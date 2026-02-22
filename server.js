require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PAGE_EXTRACTION_PROMPT = `You are an experienced structural steel estimator looking at a construction drawing.

Your job: identify EVERY steel member visible on this page and create a takeoff list.

Look for:
- Beams, girders, columns, braces, struts
- HSS/tube steel, angles, channels
- Base plates, gusset plates, connection plates
- Stairs, handrails, ladders, platforms, grating
- Any other structural steel items

For each member you find, return:
- mark: piece mark if shown (e.g. B1, COL-1), or make one up based on type (e.g. "B", "C", "BR")
- description: what it is (e.g. "Wide Flange Beam", "HSS Column", "Angle Brace", "Base Plate")
- section: size designation if called out (e.g. "W12x26", "HSS6x6x1/4", "L4x4x3/8", "PL1/2"). If not shown, put "TBD"
- quantity: count of identical members visible. If only one shown, use 1.
- length_ft: length in feet if dimensions are shown. Calculate from dimension strings if possible. If unclear, put 0.
- notes: grid location, level, or any other useful context

Be thorough -- it is better to include something uncertain than to miss a member.
If this page has no structural steel (e.g. it's a cover sheet, notes page, or architectural plan), return an empty array.

Respond ONLY with a valid JSON array. No other text.`;

async function extractPageAsBase64(pdfBuffer, pageNum) {
  const tmpDir = os.tmpdir();
  const tmpPdf = path.join(tmpDir, `page_${pageNum}_${Date.now()}.pdf`);
  const tmpImg = path.join(tmpDir, `page_${pageNum}_${Date.now()}.jpg`);
  
  try {
    fs.writeFileSync(tmpPdf, pdfBuffer);
    // Use pdftoppm if available, otherwise try ghostscript
    try {
      execSync(`pdftoppm -jpeg -r 150 -f ${pageNum} -l ${pageNum} "${tmpPdf}" "${tmpImg.replace('.jpg', '')}"`, { timeout: 30000 });
      const imgPath = `${tmpImg.replace('.jpg', '')}-${String(pageNum).padStart(2, '0')}.jpg`;
      if (fs.existsSync(imgPath)) {
        const data = fs.readFileSync(imgPath).toString('base64');
        fs.unlinkSync(imgPath);
        return data;
      }
    } catch(e) {
      // Try ghostscript
      execSync(`gs -dNOPAUSE -dBATCH -sDEVICE=jpeg -r150 -dFirstPage=${pageNum} -dLastPage=${pageNum} -sOutputFile="${tmpImg}" "${tmpPdf}"`, { timeout: 30000 });
      if (fs.existsSync(tmpImg)) {
        const data = fs.readFileSync(tmpImg).toString('base64');
        fs.unlinkSync(tmpImg);
        return data;
      }
    }
  } finally {
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
  return null;
}

async function getPageCount(pdfBuffer) {
  const tmpDir = os.tmpdir();
  const tmpPdf = path.join(tmpDir, `count_${Date.now()}.pdf`);
  try {
    fs.writeFileSync(tmpPdf, pdfBuffer);
    try {
      const out = execSync(`pdfinfo "${tmpPdf}"`, { timeout: 10000 }).toString();
      const match = out.match(/Pages:\s+(\d+)/);
      if (match) return parseInt(match[1]);
    } catch(e) {}
    // Fallback: try pdf-parse
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    return data.numpages || 1;
  } finally {
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
}

app.post('/api/extract', upload.single('drawing'), async (req, res) => {
  // Set up SSE for progress streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      send({ error: 'API key not configured.' });
      return res.end();
    }
    if (!req.file) {
      send({ error: 'No file uploaded.' });
      return res.end();
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Handle single image
    if (mimeType.startsWith('image/')) {
      send({ status: 'Analyzing drawing...' });
      const base64Data = fileBuffer.toString('base64');
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
          { type: 'text', text: PAGE_EXTRACTION_PROMPT }
        ]}]
      });
      const members = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim());
      send({ done: true, members });
      return res.end();
    }

    // PDF handling
    if (mimeType !== 'application/pdf') {
      send({ error: 'Unsupported file type. Upload a PDF, JPG, or PNG.' });
      return res.end();
    }

    // First try text extraction (fast path for CAD PDFs)
    let pageCount = 1;
    try {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(fileBuffer);
      const text = pdfData.text || '';
      pageCount = pdfData.numpages || 1;

      if (text.trim().length > 200) {
        // Has readable text - use text extraction (fast, any size)
        send({ status: `Extracting from ${pageCount}-page PDF (text mode)...` });
        const response = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: [{
            type: 'text',
            text: `You are an experienced structural steel estimator. Extract every steel member from this drawing text.

For each member return JSON with: mark, description, section, quantity, length_ft, notes.
If section size not found, use "TBD". If length not found, use 0.
Return ONLY a JSON array.

DRAWING TEXT:
${text.slice(0, 60000)}`
          }]}]
        });
        const members = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim());
        send({ done: true, members, method: 'text', pages: pageCount });
        return res.end();
      }
    } catch(e) {
      // Continue to vision approach
    }

    // Vision approach: process page by page
    try {
      pageCount = await getPageCount(fileBuffer);
    } catch(e) { pageCount = 1; }

    const maxPages = Math.min(pageCount, 20); // Cap at 20 pages to control cost
    send({ status: `Found ${pageCount} pages. Analyzing ${maxPages} pages...`, totalPages: maxPages });

    let allMembers = [];
    let markCounters = {};

    for (let p = 1; p <= maxPages; p++) {
      send({ status: `Analyzing page ${p} of ${maxPages}...`, page: p, totalPages: maxPages });
      
      try {
        const imgBase64 = await extractPageAsBase64(fileBuffer, p);
        if (!imgBase64) {
          send({ status: `Page ${p}: could not render, skipping` });
          continue;
        }

        const response = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 2048,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imgBase64 } },
            { type: 'text', text: PAGE_EXTRACTION_PROMPT }
          ]}]
        });

        const pageMembers = JSON.parse(response.content[0].text.replace(/```json|```/g, '').trim());
        
        // Add page number to notes and deduplicate marks
        pageMembers.forEach(m => {
          m.notes = `Pg${p}${m.notes ? ' - ' + m.notes : ''}`;
          allMembers.push(m);
        });

        send({ status: `Page ${p}: found ${pageMembers.length} members`, page: p, pageMembers });

      } catch(pageErr) {
        send({ status: `Page ${p}: error - ${pageErr.message}` });
      }
    }

    if (pageCount > maxPages) {
      send({ status: `Note: Only analyzed first ${maxPages} of ${pageCount} pages to control cost.` });
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
