const express = require('express');
const multer = require('multer');
const parseDocx = require('../services/docxParser');
const parsePdf = require('../services/pdfParser');
const aiRouter = require('../services/aiRouter');
const { validateAndParse } = require('../utils/validateResponse');
const { buildPrompt } = require('../utils/promptBuilder');

const router = express.Router();

const ACCEPTED_EXTENSIONS = ['.docx', '.pdf', '.md', '.txt'];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const accepted = ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext));
    if (!accepted) {
      return cb(Object.assign(new Error('Only .docx, .pdf, and .md files are accepted'), { status: 400 }));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Use inline multer error handler so we can attach failedAt to the response
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err) {
      const msg = err.status === 400
        ? 'Only .docx, .pdf, and .md files are accepted'
        : 'File upload failed';
      return res.status(err.status || 400).json({ error: msg, failedAt: 'uploading' });
    }
    next();
  });
}, async (req, res) => {
  // ── Phase: upload ────────────────────────────────────────────────────────────
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded', failedAt: 'uploading' });
  }

  const name   = req.file.originalname.toLowerCase();
  const sizeKb = Math.round(req.file.size / 1024);
  console.log(`[review] file=${name} size=${sizeKb}KB`);

  // ── Phase: reading ───────────────────────────────────────────────────────────
  let prdText;
  try {
    if (name.endsWith('.docx')) {
      prdText = await parseDocx(req.file.buffer);
    } else if (name.endsWith('.pdf')) {
      prdText = await parsePdf(req.file.buffer);
    } else {
      prdText = req.file.buffer.toString('utf-8');
    }
  } catch (err) {
    console.error('[review] parse error:', err.message);
    return res.status(422).json({ error: 'Unable to read this document.', failedAt: 'reading' });
  }

  if (!prdText || prdText.trim().length < 50) {
    return res.status(400).json({
      error: 'Document appears to be empty or too short to review',
      failedAt: 'reading',
    });
  }

  // ── Phase: reviewing (AI call) ────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const { systemPrompt, userMessage } = buildPrompt(prdText);

  let rawResponse;
  try {
    rawResponse = await aiRouter({ provider: 'anthropic', apiKey, systemPrompt, userMessage });
  } catch (err) {
    if (err.code === 'ANTHROPIC_TIMEOUT') {
      return res.status(504).json({
        error: 'The AI review took too long. Please try again.',
        failedAt: 'reviewing',
      });
    }
    console.error('[review] AI error:', err.message);
    return res.status(502).json({
      error: `Review failed: ${err.message || 'Unknown error'}`,
      failedAt: 'reviewing',
    });
  }

  // ── Phase: preparing (validate + compute) ─────────────────────────────────
  let categories, suggestions;
  try {
    ({ categories, suggestions } = validateAndParse(rawResponse));
  } catch (err) {
    if (err.code === 'AI_SCHEMA_ERROR') {
      return res.status(422).json({
        error: `AI response did not match expected schema: ${err.message}`,
        failedAt: 'preparing',
      });
    }
    console.error('[review] validation error:', err.message);
    return res.status(502).json({ error: 'Review failed: unexpected error', failedAt: 'preparing' });
  }

  const weights = { product: 0.40, design: 0.30, engineering: 0.30 };
  const overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, w]) => sum + (categories[key].score * w), 0)
  );

  const hasBlocker = Object.values(categories).some(c => c.status === 'blocker');
  let verdict;
  if (hasBlocker)          verdict = 'NOT READY TO BUILD';
  else if (overallScore >= 75) verdict = 'READY TO BUILD';
  else                     verdict = 'CONDITIONAL APPROVAL';

  const CATEGORY_ORDER = ['product', 'design', 'engineering'];
  const overallSummary = CATEGORY_ORDER
    .map(key => {
      const first = categories[key].summary.split(/\.\s+/)[0].trim();
      return first.endsWith('.') ? first : `${first}.`;
    })
    .join(' ');

  return res.json({
    overall: { score: overallScore, verdict, summary: overallSummary },
    categories,
    ...(suggestions && { suggestions }),
  });
});

module.exports = router;
