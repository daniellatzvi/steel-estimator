require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const clientBuildPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

const client = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120000
});

const EXTRACTION_PROMPT = `You are an experienced structural steel estimator reviewing structural construction drawings.

Go through every page and identify ALL steel members and materials. For each one return:
- mark: piece mark if shown, otherwise abbreviate by type (B=beam, C=column, BR=brace, PL=plate, MISC=misc)
- description: what it is (Wide Flange Beam, HSS Column, Angle Brace, Base Plate, Stair Stringer, Handrail, Grating, etc)
- section: size exactly as written on the drawing (W12x26, HSS6x6x1/4, L4x4x3/8, PL1/2, etc). Use "TBD" if not labeled.
- quantity: count of identical members. Use 1 if only one shown or unclear.
- length_ft: length in decimal feet from dimension strings if shown, otherwise 0
- notes: grid line, level, or other useful location context

Be thorough — missing a member is worse than including an uncertain one.
Skip cover sheets and general notes pages.

Return ONLY a valid JSON array. No explanation, no markdown fences.`;

app.post('/api/extract', upload.single('drawing'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch(e) {}
  };

  const keepAlive = setInterval(() => {
    try { res.write(`: ping\n\n`); } catch(e) { clearInterval(keepAlive); }
  }, 15000);

  const done = (data) => {
    clearInterval(keepAlive);
    send(data);
    res.end();
  };

  try {
    if (!process.env.ANTHROPIC_API_KEY) return done({ error: 'API key not configured.' });
    if (!req.file) return done({ error: 'No file uploaded.' });

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(1);

    // Image upload
    if (mimeType.startsWith('image/')) {
      send({ status: 'Analyzing drawing...' });
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileBuffer.toString('base64') }},
          { type: 'text', text: EXTRACTION_PROMPT }
        ]}]
      });
      const members = JSON.parse(response.content[0].text.trim().replace(/```json|```/g, '').trim());
      return done({ done: true, members: Array.isArray(members) ? members : [], method: 'image', pages: 1 });
    }

    if (mimeType !== 'application/pdf') return done({ error: 'Unsupported file type. Upload a PDF, JPG, or PNG.' });

    // Step 1: Try text extraction (fast path for CAD PDFs)
    send({ status: `Reading ${fileSizeMB}MB PDF...` });
    let pageCount = 1;
    try {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(fileBuffer);
      pageCount = pdfData.numpages || 1;
      const text = pdfData.text || '';

      if (text.trim().length > 100) {
        send({ status: `Found text content across ${pageCount} pages. Running AI extraction...` });
        const response = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: [{
            type: 'text',
            text: `${EXTRACTION_PROMPT}\n\nDRAWING TEXT CONTENT (${pageCount} pages):\n${text.slice(0, 80000)}`
          }]}]
        });
        const members = JSON.parse(response.content[0].text.trim().replace(/```json|```/g, '').trim());
        return done({ done: true, members: Array.isArray(members) ? members : [], method: 'text', pages: pageCount });
      }
      
      // No text found - fall through to vision
    } catch(e) {
      // pdf-parse failed, continue
    }

    // Step 2: Send PDF directly to Claude vision (works without any system tools)
    // Claude can natively read PDFs up to ~32MB
    const pdfSizeMB = fileBuffer.length / 1024 / 1024;
    
    if (pdfSizeMB <= 30) {
      send({ status: `Analyzing ${pageCount} pages visually...` });
      const base64Pdf = fileBuffer.toString('base64');
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Pdf }},
          { type: 'text', text: EXTRACTION_PROMPT }
        ]}]
      });
      const members = JSON.parse(response.content[0].text.trim().replace(/```json|```/g, '').trim());
      return done({ done: true, members: Array.isArray(members) ? members : [], method: 'pdf-vision', pages: pageCount });
    }

    // Step 3: Large scanned PDF -- chunk it using pdf-lib
    send({ status: `Large scanned PDF (${fileSizeMB}MB). Processing in chunks...`, totalPages: pageCount });
    
    const { PDFDocument } = require('pdf-lib');
    const srcDoc = await PDFDocument.load(fileBuffer);
    const totalPages = srcDoc.getPageCount();
    const CHUNK_SIZE = 5;
    let allMembers = [];

    for (let start = 0; start < totalPages; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE, totalPages);
      send({ 
        status: `Analyzing pages ${start + 1}–${end} of ${totalPages}...`,
        page: start + 1,
        totalPages
      });

      try {
        const chunkDoc = await PDFDocument.create();
        const pageIndices = [];
        for (let i = start; i < end; i++) pageIndices.push(i);
        const copiedPages = await chunkDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach(p => chunkDoc.addPage(p));
        const chunkBytes = await chunkDoc.save();
        const chunkBase64 = Buffer.from(chunkBytes).toString('base64');

        const response = await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 2048,
          messages: [{ role: 'user', content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: chunkBase64 }},
            { type: 'text', text: EXTRACTION_PROMPT + `\n\nNote: These are pages ${start+1}-${end} of the drawing set. Tag your notes with the page number.` }
          ]}]
        });

        const raw = response.content[0].text.trim().replace(/```json|```/g, '').trim();
        const chunkMembers = JSON.parse(raw);
        if (Array.isArray(chunkMembers)) allMembers.push(...chunkMembers);

        send({ status: `Pages ${start+1}–${end} done. ${allMembers.length} members found so far...`, page: end, totalPages });
      } catch(chunkErr) {
        send({ status: `Pages ${start+1}–${end}: skipped (${chunkErr.message})` });
      }
    }

    return done({ done: true, members: allMembers, method: 'chunked', pages: totalPages });

  } catch (error) {
    console.error('Extraction error:', error);
    done({ error: error.message || 'Extraction failed. Please try again.' });
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
