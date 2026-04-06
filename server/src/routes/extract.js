const express = require('express');
const multer  = require('multer');
const parseDocx = require('../services/docxParser');
const parsePdf  = require('../services/pdfParser');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const ok   = ['.docx', '.pdf', '.md', '.txt'].some(ext => name.endsWith(ext));
    if (!ok) return cb(Object.assign(new Error('Unsupported format'), { status: 400 }));
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const name = req.file.originalname.toLowerCase();
    let text;
    if      (name.endsWith('.docx')) text = await parseDocx(req.file.buffer);
    else if (name.endsWith('.pdf'))  text = await parsePdf(req.file.buffer);
    else                             text = req.file.buffer.toString('utf-8');

    return res.json({ text: text || '' });
  } catch (err) {
    console.error('Extract error:', err);
    return res.status(500).json({ error: 'Failed to extract text from file' });
  }
});

module.exports = router;
