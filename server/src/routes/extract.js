const express = require('express');
const multer   = require('multer');
const pdf      = require('pdf-parse');
const mammoth  = require('mammoth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mime = req.file.mimetype;
    const name = req.file.originalname.toLowerCase();
    let text = '';

    const isPdf  = mime === 'application/pdf'  || name.endsWith('.pdf');
    const isDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx');
    const isText = mime === 'text/plain' || mime === 'text/markdown' || name.endsWith('.md') || name.endsWith('.txt');

    if (isPdf) {
      const data = await pdf(req.file.buffer);
      text = data.text;
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (isText) {
      text = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    return res.json({ text });
  } catch (err) {
    console.error('Extract error:', err);
    return res.status(500).json({ error: 'Failed to extract text from file' });
  }
});

module.exports = router;
