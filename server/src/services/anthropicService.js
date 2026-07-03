const Anthropic = require('@anthropic-ai/sdk');

const TIMEOUT_MS = 60_000;

async function callAnthropic({ apiKey, systemPrompt, userMessage }) {
  console.log('[anthropicService] entering');
  console.log('[anthropicService] apiKey present:', !!apiKey);
  console.log('[anthropicService] systemPrompt length:', systemPrompt?.length);
  console.log('[anthropicService] userMessage length:', userMessage?.length);

  const estimatedInputTokens = Math.round(((systemPrompt?.length || 0) + (userMessage?.length || 0)) / 4);
  console.log('[anthropicService] estimated input tokens:', estimatedInputTokens);

  const client = new Anthropic({ apiKey });
  const started = Date.now();

  let message;
  try {
    console.log('[anthropicService] before client.messages.create()');

    const request = client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const timeoutGuard = new Promise((_, reject) =>
      setTimeout(
        () => reject(Object.assign(new Error('Anthropic request timed out after 60s'), { code: 'ANTHROPIC_TIMEOUT' })),
        TIMEOUT_MS,
      )
    );

    message = await Promise.race([request, timeoutGuard]);

    const duration = Date.now() - started;
    console.log('[anthropicService] completed — duration:', duration + 'ms');
    console.log('[anthropicService] stop_reason:', message.stop_reason);
    console.log('[anthropicService] usage:', JSON.stringify(message.usage));
    console.log('[anthropicService] content blocks:', message.content?.length);
  } catch (err) {
    const duration = Date.now() - started;
    console.error('[anthropicService] failed after', duration + 'ms');
    console.error('[anthropicService] error name:', err.name);
    console.error('[anthropicService] error message:', err.message);
    console.error('[anthropicService] error status:', err.status);
    console.error('[anthropicService] error stack:', err.stack);
    throw err;
  }

  const block = message.content.find(b => b.type === 'text');
  console.log('[anthropicService] text block found:', !!block, '— length:', block?.text?.length);

  if (!block) throw new Error('No text content in Anthropic response');

  return block.text;
}

module.exports = callAnthropic;
