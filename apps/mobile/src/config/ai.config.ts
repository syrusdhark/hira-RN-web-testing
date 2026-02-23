import Constants from 'expo-constants';

export type AiProvider = 'anthropic' | 'openrouter';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  maxTokens: number;
  /** Optional daily token limit per user when using production API. */
  dailyLimit?: number;
}

const OPENROUTER_MODEL = 'deepseek/deepseek-r1-0528:free';
const DEFAULT_MODEL_ANTHROPIC = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;

/**
 * Returns current AI config based on env. Use for UI or rate limiting.
 */
export function getAiConfig(): AiConfig {
  const openrouterKey =
    Constants.expoConfig?.extra?.openrouterApiKey ??
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  const hasOpenRouter =
    typeof openrouterKey === 'string' && openrouterKey.trim().length > 0;

  if (hasOpenRouter) {
    return {
      provider: 'openrouter',
      model: OPENROUTER_MODEL,
      maxTokens: DEFAULT_MAX_TOKENS,
      dailyLimit: __DEV__ ? 1000 : 10000,
    };
  }

  const anthropicKey =
    Constants.expoConfig?.extra?.anthropicApiKey ??
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  const hasAnthropic =
    typeof anthropicKey === 'string' && anthropicKey.trim().startsWith('sk-ant-');

  return {
    provider: hasAnthropic ? 'anthropic' : 'openrouter',
    model: hasAnthropic ? DEFAULT_MODEL_ANTHROPIC : OPENROUTER_MODEL,
    maxTokens: DEFAULT_MAX_TOKENS,
    dailyLimit: __DEV__ ? 1000 : 10000,
  };
}
