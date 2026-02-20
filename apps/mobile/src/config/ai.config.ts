import Constants from 'expo-constants';

export type AiProvider = 'local' | 'anthropic' | 'openrouter';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  maxTokens: number;
  /** Optional daily token limit per user when using production API. */
  dailyLimit?: number;
}

const DEFAULT_MODEL_LOCAL = 'phi4-mini:latest';
const DEFAULT_MODEL_ANTHROPIC = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;

/**
 * Returns current AI config based on env. Use when you need to know provider or limits
 * (e.g. for UI or rate limiting). Chat routing itself is in ai-chat.service (shouldUseLocalAi).
 */
export function getAiConfig(): AiConfig {
  const useLocal =
    Constants.expoConfig?.extra?.useLocalAi ??
    process.env.EXPO_PUBLIC_USE_LOCAL_AI;
  const url =
    Constants.expoConfig?.extra?.localAiUrl ??
    process.env.EXPO_PUBLIC_LOCAL_AI_URL;
  const localEnabled =
    useLocal === 'true' && typeof url === 'string' && url.trim().length > 0;

  if (localEnabled) {
    const model =
      Constants.expoConfig?.extra?.localAiModel ??
      process.env.EXPO_PUBLIC_LOCAL_AI_MODEL ??
      DEFAULT_MODEL_LOCAL;
    return {
      provider: 'local',
      model: typeof model === 'string' ? model : DEFAULT_MODEL_LOCAL,
      maxTokens: DEFAULT_MAX_TOKENS,
    };
  }

  const apiKey =
    Constants.expoConfig?.extra?.anthropicApiKey ??
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  const isOpenRouter =
    typeof apiKey === 'string' && apiKey.trim().startsWith('sk-or-');

  return {
    provider: isOpenRouter ? 'openrouter' : 'anthropic',
    model: DEFAULT_MODEL_ANTHROPIC,
    maxTokens: DEFAULT_MAX_TOKENS,
    dailyLimit: __DEV__ ? 1000 : 10000,
  };
}
