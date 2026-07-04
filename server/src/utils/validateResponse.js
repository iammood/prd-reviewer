const { z } = require('zod');

const CategorySchema = z.object({
  score: z.number().int().min(0).max(100),
  status: z.enum(['good', 'caution', 'blocker']),
  summary: z.string().min(1),
  recommendations: z.array(z.string()).min(3).max(3),
});

const SuggestionsSchema = z.object({
  strengths:             z.array(z.string()).min(1),
  weaknesses:            z.array(z.string()).min(1),
  missingInformation:    z.array(z.string()).min(1),
  quickWins:             z.array(z.string()).min(1),
  highestImpact:         z.array(z.string()).min(1),
  overallRecommendation: z.string().min(1),
});

const ReviewSchema = z.object({
  product:     CategorySchema,
  design:      CategorySchema,
  engineering: CategorySchema,
  suggestions: SuggestionsSchema.optional(),
});

function extractJson(raw) {
  try { return JSON.parse(raw); } catch (_) {}

  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  try { return JSON.parse(stripped); } catch (_) {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
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

  const { product, design, engineering, suggestions } = result.data;
  return {
    categories:  { product, design, engineering },
    suggestions: suggestions ?? null,
  };
}

module.exports = { validateAndParse };
