const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();

router.post('/', express.json(), async (req, res) => {
  const { categoryLabel, issue, whyItMatters, suggestedFix } = req.body || {};

  if (!issue || !suggestedFix) {
    return res.status(400).json({ error: 'Missing required fields: issue, suggestedFix' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `You are a product manager writing a concrete amendment to a PRD.
Your task: given an identified issue and a suggested fix direction, write 2–3 sentences of polished PRD language that directly addresses the issue.
Write in first-person product voice ("We will...", "The system shall...", or "This feature includes...").
Be specific and actionable. Do not add preamble or explanation — output only the PRD text.`;

  const userMessage = `Category: ${categoryLabel || 'General'}
Issue: ${issue}
Why it matters: ${whyItMatters || ''}
Suggested fix direction: ${suggestedFix}

Write the PRD amendment text now.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const fixText = message.content.find(b => b.type === 'text')?.text?.trim() || '';
    return res.json({ fixText });
  } catch (err) {
    console.error('Fix generation error:', err);
    return res.status(502).json({ error: `AI error: ${err.message || 'Unknown error'}` });
  }
});

module.exports = router;
