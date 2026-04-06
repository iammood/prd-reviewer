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
    let text = '';

    if (mime === 'application/pdf') {
      const data = await pdf(req.file.buffer);
      text = data.text;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (mime === 'text/plain' || mime === 'text/markdown') {
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
