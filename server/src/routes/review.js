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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    // --- Validate required fields ---
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // --- Parse document based on file type ---
    const name = req.file.originalname.toLowerCase();
    let prdText;
    if (name.endsWith('.docx')) {
      prdText = await parseDocx(req.file.buffer);
    } else if (name.endsWith('.pdf')) {
      prdText = await parsePdf(req.file.buffer);
    } else {
      prdText = req.file.buffer.toString('utf-8');
    }

    if (!prdText || prdText.trim().length < 50) {
      return res.status(400).json({ error: 'Document appears to be empty or too short to review' });
    }

    // --- Build prompt and call AI ---
    const { systemPrompt, userMessage } = buildPrompt(prdText);
    const rawResponse = await aiRouter({ provider: 'anthropic', apiKey, systemPrompt, userMessage });

    // --- Validate AI response ---
    const categories = validateAndParse(rawResponse);

    // --- Compute overall score and verdict ---
    const weights = { design: 0.25, engineering: 0.30, product: 0.25, security: 0.20 };
    const overallScore = Math.round(
      Object.entries(weights).reduce((sum, [key, w]) => sum + (categories[key].score * w), 0)
    );

    const hasBlocker = Object.values(categories).some(c => c.status === 'blocker');
    let verdict;
    if (hasBlocker) {
      verdict = 'NOT READY TO BUILD';
    } else if (overallScore >= 75) {
      verdict = 'READY TO BUILD';
    } else {
      verdict = 'CONDITIONAL APPROVAL';
    }

    // Build overall summary from category verdicts
    const overallSummary = Object.entries(categories)
      .map(([name, data]) => `${name.charAt(0).toUpperCase() + name.slice(1)}: ${data.verdict}`)
      .join(' ');

    return res.json({
      overall: {
        score: overallScore,
        verdict,
        summary: overallSummary,
      },
      categories,
      prdText,
    });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'AI_SCHEMA_ERROR') {
      return res.status(422).json({ error: `AI response did not match expected schema: ${err.message}` });
    }
    console.error('Review error:', err);
    return res.status(502).json({ error: `AI provider error: ${err.message || 'Unknown error'}` });
  }
});

module.exports = router;
