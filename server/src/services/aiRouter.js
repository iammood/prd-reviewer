const callAnthropic = require('./anthropicService');
const callOpenAI = require('./openaiService');

async function aiRouter({ provider, apiKey, systemPrompt, userMessage }) {
  console.log('[aiRouter] entering — provider:', provider);
  console.log('[aiRouter] systemPrompt length:', systemPrompt?.length);
  console.log('[aiRouter] userMessage length:', userMessage?.length);

  if (provider === 'anthropic') {
    console.log('[aiRouter] routing to anthropicService');
    const result = await callAnthropic({ apiKey, systemPrompt, userMessage });
    console.log('[aiRouter] anthropicService returned — response length:', result?.length);
    return result;
  }
  if (provider === 'openai') {
    console.log('[aiRouter] routing to openaiService');
    return callOpenAI({ apiKey, systemPrompt, userMessage });
  }
  throw new Error(`Unknown provider: ${provider}`);
}

module.exports = aiRouter;
