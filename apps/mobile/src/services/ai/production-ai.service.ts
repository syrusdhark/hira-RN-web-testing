/**
 * Production AI (Anthropic / OpenRouter). Used when local AI is disabled.
 * Cost is calculated from token usage for monitoring.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const OPENROUTER_MODEL = 'deepseek/deepseek-r1-0528:free';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

/** Per 1M tokens (approximate). */
const ANTHROPIC_INPUT_COST_PER_M = 3;
const ANTHROPIC_OUTPUT_COST_PER_M = 15;

function isOpenRouterKey(key: string): boolean {
  return key.startsWith('sk-or-');
}

export interface ProductionChatResult {
  response: string;
  tokensUsed: number;
  cost: number;
}

export interface ProductionChatParams {
  apiKey: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}

/**
 * Call OpenRouter or Anthropic based on apiKey prefix. Returns response and cost.
 */
export async function chat(params: ProductionChatParams): Promise<ProductionChatResult> {
  const { apiKey, systemPrompt, messages, maxTokens = 1000 } = params;

  if (isOpenRouterKey(apiKey)) {
    return chatOpenRouter(apiKey, systemPrompt, messages, maxTokens);
  }
  return chatAnthropic(apiKey, systemPrompt, messages, maxTokens);
}

async function chatOpenRouter(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens: number
): Promise<ProductionChatResult> {
  const openRouterMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: maxTokens,
      messages: openRouterMessages,
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    usage?: { completion_tokens?: number; total_tokens?: number };
    choices?: Array<{ message?: { content?: string }; text?: string }>;
  };

  if (!response.ok) {
    const msg = data?.error?.message ?? data?.error ?? 'OpenRouter API error';
    throw new Error(String(msg));
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    '';
  const responseText = typeof content === 'string' ? content : '';
  const tokensUsed =
    data?.usage?.completion_tokens ?? data?.usage?.total_tokens ?? 0;
  const cost = 0; // OpenRouter pricing varies; optional: add per-model rates

  return { response: responseText, tokensUsed, cost };
}

async function chatAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens: number
): Promise<ProductionChatResult> {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    usage?: { input_tokens?: number; output_tokens?: number };
    content?: Array<{ text?: string }>;
  };

  if (!response.ok) {
    const message =
      (data?.error?.message ?? data?.error) || 'Anthropic API error';
    throw new Error(String(message));
  }

  const contentArray = Array.isArray(data.content) ? data.content : [];
  const firstTextBlock = contentArray[0];
  const responseText =
    firstTextBlock && typeof firstTextBlock.text === 'string'
      ? firstTextBlock.text
      : '';

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const tokensUsed = inputTokens + outputTokens;
  const cost =
    (inputTokens / 1_000_000) * ANTHROPIC_INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * ANTHROPIC_OUTPUT_COST_PER_M;

  return { response: responseText, tokensUsed, cost };
}
