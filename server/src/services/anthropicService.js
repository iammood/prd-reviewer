const Anthropic = require('@anthropic-ai/sdk');

async function callAnthropic({ apiKey, systemPrompt, userMessage }) {
  console.log('[anthropicService] entering');
  console.log('[anthropicService] apiKey present:', !!apiKey);
  console.log('[anthropicService] systemPrompt length:', systemPrompt?.length);
  console.log('[anthropicService] userMessage length:', userMessage?.length);

  const client = new Anthropic({ apiKey });

  let message;
  try {
    console.log('[anthropicService] before client.messages.create()');
    message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    console.log('[anthropicService] after client.messages.create()');
    console.log('[anthropicService] stop_reason:', message.stop_reason);
    console.log('[anthropicService] usage:', JSON.stringify(message.usage));
    console.log('[anthropicService] content blocks:', message.content?.length);
  } catch (err) {
    console.error('[anthropicService] client.messages.create() threw:');
    console.error('[anthropicService] error name:', err.name);
    console.error('[anthropicService] error message:', err.message);
    console.error('[anthropicService] error status:', err.status);
    console.error('[anthropicService] error stack:', err.stack);
    throw err;
  }

  console.log('[anthropicService] before accessing message.content');
  const block = message.content.find(b => b.type === 'text');
  console.log('[anthropicService] text block found:', !!block);
  console.log('[anthropicService] text block length:', block?.text?.length);

  if (!block) throw new Error('No text content in Anthropic response');

  console.log('[anthropicService] before returning response');
  return block.text;
}

module.exports = callAnthropic;
