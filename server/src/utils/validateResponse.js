const { z } = require('zod');

const CategorySchema = z.object({
  score: z.number().int().min(0).max(100),
  status: z.enum(['good', 'caution', 'blocker']),
  summary: z.string().min(1),
  recommendations: z.array(z.string()).min(3).max(3),
});

const ReviewSchema = z.object({
  product: CategorySchema,
  design: CategorySchema,
  engineering: CategorySchema,
});

function extractJson(raw) {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch (_) {}

  // Strip markdown code fences and retry
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {}

  // Try to find the first { ... } block
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  return null;
}

function validateAndParse(rawResponse) {
  const parsed = extractJson(rawResponse);
  if (!parsed) {
    const err = new Error('Could not parse JSON from AI response');
    err.code = 'AI_SCHEMA_ERROR';
    throw err;
  }

  const result = ReviewSchema.safeParse(parsed);
  if (!result.success) {
    const err = new Error(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '));
    err.code = 'AI_SCHEMA_ERROR';
    throw err;
  }

  return result.data;
}

module.exports = { validateAndParse };
