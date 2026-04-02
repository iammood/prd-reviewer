const Anthropic = require('@anthropic-ai/sdk');

async function callAnthropic({ apiKey, systemPrompt, userMessage }) {
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = message.content.find(b => b.type === 'text');
  if (!block) throw new Error('No text content in Anthropic response');
  return block.text;
}

module.exports = callAnthropic;
