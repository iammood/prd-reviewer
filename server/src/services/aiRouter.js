const callAnthropic = require('./anthropicService');
const callOpenAI = require('./openaiService');

async function aiRouter({ provider, apiKey, systemPrompt, userMessage }) {
  if (provider === 'anthropic') {
    return callAnthropic({ apiKey, systemPrompt, userMessage });
  }
  if (provider === 'openai') {
    return callOpenAI({ apiKey, systemPrompt, userMessage });
  }
  throw new Error(`Unknown provider: ${provider}`);
}

module.exports = aiRouter;
