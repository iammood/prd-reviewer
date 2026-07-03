const express = require('express');
const multer = require('multer');
const parsePdf = require('../services/pdfParser');
const parseDocx = require('../services/docxParser');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mime = req.file.mimetype || '';
  const name = req.file.originalname.toLowerCase();
  const sizeKb = Math.round(req.file.size / 1024);
  console.log(`[extract] file=${name} size=${sizeKb}KB mime=${mime}`);

  const isPdf  = mime === 'application/pdf' || name.endsWith('.pdf');
  const isDocx = mime.includes('wordprocessingml') || name.endsWith('.docx');
  const isText = mime.startsWith('text/') || name.endsWith('.md') || name.endsWith('.txt');

  if (!isPdf && !isDocx && !isText) {
    return res.status(400).json({ error: 'Unsupported file type. Upload .docx, .pdf, or .md' });
  }

  let text = '';
  try {
    if (isPdf) {
      text = await parsePdf(req.file.buffer);
    } else if (isDocx) {
      text = await parseDocx(req.file.buffer, mime, name);
    } else {
      text = req.file.buffer.toString('utf-8');
    }
  } catch (parseErr) {
    console.error(`[extract] parse error for ${name}:`, parseErr.message);
    return res.status(422).json({ error: 'Unable to read this document.' });
  }

  if (!text || text.trim().length === 0) {
    return res.status(422).json({ error: 'Unable to read this document.' });
  }

  console.log(`[extract] success — ${text.length} chars extracted`);
  return res.json({ success: true, text });
});

module.exports = router;
