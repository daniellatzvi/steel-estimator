require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PAGE_PROMPT = `You are an experienced structural steel estimator reviewing a construction drawing page.

Identify every steel member visible. For each one return:
- mark: piece mark if shown, otherwise abbreviate by type (B=beam, C=column, BR=brace, PL=plate, etc)
- description: what it is (Wide Flange Beam, HSS Column, Angle Brace, Base Plate, Handrail, etc)
- section: size if called out (W12x26, HSS6x6x1/4, L4x4x3/8, PL1/2, etc). Use "TBD" if not shown.
- quantity: count of identical members on this page. Use 1 if only one shown.
- length_ft: length in feet from dimensions if available. Use 0 if not shown.
- notes: grid line, level, or any useful context

If this page has no structural steel (cover sheet, notes, arch plan, MEP), return [].
Respond ONLY with a valid JSON array.`;

async function getPdfPageCount(buffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, { max: 1 });
    return data.numpages || 1;
  } catch(e) {
    return 1;
  }
}

async function extractTextFromPdf(buffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return { text: data.text || '', pages: data.numpages || 1 };
  } catch(e) {
    return { text: '', pages: 1 };
  }
}

async function renderPageToBase64(pdfBuffer, pageNum) {
  const tmpDir = os.tmpdir();
  const tmpId = `${Date.now()}_${pageNum}`;
  const tmpPdf = path.join(tmpDir, `p_${tmpId}.pdf`);
  
  try {
    fs.writeFileSync(tmpPdf, pdfBuffer);
    
    // Try pdftoppm first
    try {
      const { execSync } = require('child_process');
      const outBase = path.join(tmpDir, `img_${tmpId}`);
      execSync(`pdftoppm -jpeg -r 120 -f ${pageNum} -l ${pageNum} "${tmpPdf}" "${outBase}"`, { timeout: 25000 });
      
      // pdftoppm output naming
      const candidates = [
        `${outBase}-${String(pageNum).padStart(2,'0')}.jpg`,
        `${outBase}-${String(pageNum).padStart(3,'0')}.jpg`,
        `${outBase}.jpg`,
      ];
      
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          const data = fs.readFileSync(c).toString('base64');
          fs.unlinkSync(c);
          return data;
        }
      }
    } catch(e1) {
      // Try ghostscript
      try {
        const { execSync } = require('child_process');
        const outImg = path.join(tmpDir, `img_${tmpId}.jpg`);
        execSync(`gs -dNOPAUSE -dBATCH -sDEVICE=jpeg -r120 -dJPEGQ=85 -dFirstPage=${pageNum} -dLastPage=${pageNum} -sOutputFile="${outImg}" "${tmpPdf}"`, { timeout: 25000 });
        if (fs.existsSync(outImg)) {
          const data = fs.readFileSync(outImg).toString('base64');
          fs.unlinkSync(outImg);
          return data;
        }
      } catch(e2) {}
    }
  } finally {
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
  return null;
}

async function analyzePageWithClaude(base64Img, pageNum) {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Img }},
        { type: 'text', text: PAGE_PROMPT }
      ]}]
    });
    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const members = JSON.parse(raw);
    return members.map(m => ({ ...m, notes: `Pg${pageNum}${m.notes ? ' - ' + m.notes : ''}` }));
  } catch(e) {
    return [];
  }
}

async function analyzeTextWithClaude(text, pageCount) {
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: [{
        type: 'text',
        text: `You are an experienced structural steel estimator. Extract every steel member from this drawing text.

For each member return JSON with: mark, description, section, quantity, length_ft, notes.
Use "TBD" for unknown sections, 0 for unknown lengths.
Return ONLY a valid JSON array.

DRAWING TEXT (${pageCount} pages):
${text.slice(0, 60000)}`
      }]}]
    });
    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch(e) {
    return [];
  }
}

app.post('/api/extract', upload.single('drawing'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch(e) {}
  };

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      send({ error: 'API key not configured.' }); return res.end();
    }
    if (!req.file) {
      send({ error: 'No file uploaded.' }); return res.end();
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Single image
    if (mimeType.startsWith('image/')) {
      send({ status: 'Analyzing image...' });
      const base64 = fileBuffer.toString('base64');
      const members = await analyzePageWithClaude(base64, 1);
      send({ done: true, members, method: 'image', pages: 1 });
      return res.end();
    }

    if (mimeType !== 'application/pdf') {
      send({ error: 'Unsupported file type. Upload a PDF, JPG, or PNG.' }); return res.end();
    }

    // Try text extraction first (fast, no size limit)
    send({ status: 'Reading PDF...' });
    const { text, pages: pageCount } = await extractTextFromPdf(fileBuffer);

    if (text && text.trim().length > 300) {
      send({ status: `Extracting from ${pageCount} pages via text...` });
      const members = await analyzeTextWithClaude(text, pageCount);
      send({ done: true, members, method: 'text', pages: pageCount });
      return res.end();
    }

    // Vision path - process pages in parallel batches
    send({ status: `Found ${pageCount} pages. Starting visual analysis...`, totalPages: pageCount });

    const maxPages = Math.min(pageCount, 50); // support up to 50 pages
    const BATCH_SIZE = 3; // process 3 pages at a time
    let allMembers = [];

    for (let batchStart = 1; batchStart <= maxPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, maxPages);
      const batchPages = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);

      send({ 
        status: `Analyzing pages ${batchStart}-${batchEnd} of ${maxPages}...`,
        page: batchStart,
        totalPages: maxPages
      });

      // Render and analyze pages in parallel
      const batchResults = await Promise.all(batchPages.map(async (pageNum) => {
        const imgBase64 = await renderPageToBase64(fileBuffer, pageNum);
        if (!imgBase64) return [];
        return await analyzePageWithClaude(imgBase64, pageNum);
      }));

      const batchMembers = batchResults.flat();
      allMembers = allMembers.concat(batchMembers);

      send({ 
        status: `Pages ${batchStart}-${batchEnd}: found ${batchMembers.length} members (${allMembers.length} total so far)`,
        page: batchEnd,
        totalPages: maxPages,
        partialMembers: batchMembers
      });
    }

    if (pageCount > maxPages) {
      send({ status: `Note: Analyzed first ${maxPages} of ${pageCount} pages.` });
    }

    send({ done: true, members: allMembers, method: 'vision', pages: maxPages });
    res.end();

  } catch (error) {
    console.error('Extraction error:', error);
    send({ error: error.message || 'Extraction failed' });
    res.end();
  }
});

app.get('*', (req, res) => {
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not built.');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Steel Estimator running on port ${PORT}`));
