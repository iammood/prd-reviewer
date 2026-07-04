const Anthropic = require('@anthropic-ai/sdk');

const ATTEMPT_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS     = 2_000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isRetryable(err) {
  if (err?.code === 'ANTHROPIC_TIMEOUT') return true;
  const s = err?.status;
  return s === 429 || s === 502 || s === 503;
}

async function attemptCall(client, params) {
  const request = client.messages.create(params);
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(Object.assign(
        new Error('Anthropic request timed out after 60s'),
        { code: 'ANTHROPIC_TIMEOUT' },
      )),
      ATTEMPT_TIMEOUT_MS,
    )
  );
  return Promise.race([request, timeout]);
}

async function callAnthropic({ apiKey, systemPrompt, userMessage }) {
  console.log('[anthropicService] entering');
  console.log('[anthropicService] apiKey present:', !!apiKey);
  console.log('[anthropicService] systemPrompt length:', systemPrompt?.length);
  console.log('[anthropicService] userMessage length:', userMessage?.length);

  const estimatedInputTokens = Math.round(((systemPrompt?.length || 0) + (userMessage?.length || 0)) / 4);
  console.log('[anthropicService] estimated input tokens:', estimatedInputTokens);

  // Disable SDK retries — we manage retry logic ourselves
  const client = new Anthropic({ apiKey, maxRetries: 0 });

  const params = {
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  };

  const started = Date.now();
  let message;
  let attempts = 1;

  while (true) {
    try {
      console.log(`[anthropicService] attempt ${attempts} — calling API`);
      message = await attemptCall(client, params);
      break;
    } catch (err) {
      const elapsed = Date.now() - started;
      console.error(`[anthropicService] attempt ${attempts} failed after ${elapsed}ms — ${err.message} (status: ${err.status ?? 'n/a'})`);

      if (attempts === 1 && isRetryable(err)) {
        console.log(`[anthropicService] retryable — waiting ${RETRY_DELAY_MS}ms then retrying`);
        await sleep(RETRY_DELAY_MS);
        attempts = 2;
        continue;
      }

      console.error('[anthropicService] not retrying:', err.stack);
      throw err;
    }
  }

  const duration = Date.now() - started;
  console.log(`[anthropicService] success — ${duration}ms, ${attempts} attempt(s)`);
  console.log('[anthropicService] stop_reason:', message.stop_reason);
  console.log('[anthropicService] usage:', JSON.stringify(message.usage));

  const block = message.content.find(b => b.type === 'text');
  console.log('[anthropicService] text block found:', !!block, '— length:', block?.text?.length);

  if (!block) throw new Error('No text content in Anthropic response');

  return block.text;
}

module.exports = callAnthropic;
