const OpenAI = require('openai');

async function callOpenAI({ apiKey, systemPrompt, userMessage }) {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content in OpenAI response');
  return content;
}

module.exports = callOpenAI;
