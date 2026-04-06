const express = require('express');
const callAnthropic = require('../services/anthropicService');

const router = express.Router();

router.post('/', express.json(), async (req, res) => {
  const { categories = {}, fixes = [] } = req.body;

  if (!fixes.length) {
    return res.status(400).json({ error: 'No fixes provided.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Build context from original review
  const categoryContext = Object.entries(categories)
    .filter(([, cat]) => ['blocker', 'caution'].includes(cat.status))
    .map(([key, cat]) => `${key.charAt(0).toUpperCase() + key.slice(1)} (${cat.status}): ${cat.verdict}`)
    .join('\n');

  // Build the fixes section
  const fixesText = fixes
    .map(f => [
      `### ${f.categoryLabel} — ${f.suggestedFix}`,
      `**Team's proposed approach:** ${f.userResponse}`,
    ].join('\n'))
    .join('\n\n');

  const systemPrompt = `You are an expert product requirements document writer. Your job is to take PRD review feedback and the team's proposed solutions and generate clear, well-structured PRD content that addresses the identified gaps.

Write in professional, concise language suitable for engineering and design teams. Use markdown with clear section headers (##, ###), bullet points, and acceptance criteria where appropriate. Be specific and actionable — avoid vague statements.`;

  const userMessage = `A PRD was reviewed and the following issues were found:\n\n${categoryContext}\n\n---\n\nThe team has proposed the following fixes:\n\n${fixesText}\n\n---\n\nGenerate updated PRD sections in markdown that incorporate all of these improvements. For each fix, write the corresponding PRD content (requirements, acceptance criteria, user stories, technical notes, etc.) that would satisfy the reviewer's concerns. Start with a brief overview of what changed, then write each updated section clearly.`;

  try {
    const prd = await callAnthropic({
      apiKey,
      systemPrompt,
      userMessage,
    });

    return res.json({ prd });
  } catch (err) {
    console.error('Generate PRD error:', err);
    return res.status(502).json({ error: `Failed to generate PRD: ${err.message || 'Unknown error'}` });
  }
});

module.exports = router;
