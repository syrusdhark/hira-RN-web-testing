/**
 * Optional: log and query AI usage for production API (tokens, cost).
 * Requires table ai_usage_logs (see supabase/migrations).
 */

import { supabase } from '../../lib/supabase';

export type AiUsageProvider = 'anthropic' | 'openrouter';

export interface AiUsageLogRow {
  user_id: string;
  tokens_used: number;
  cost_usd: number;
  provider: AiUsageProvider;
}

/**
 * Log one API call. No-op if table does not exist or insert fails.
 */
export async function logUsage(
  userId: string,
  tokensUsed: number,
  costUsd: number,
  provider: AiUsageProvider
): Promise<void> {
  if (tokensUsed <= 0 && costUsd <= 0) return;
  const { error } = await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    tokens_used: tokensUsed,
    cost_usd: costUsd,
    provider,
  });
  if (error) {
    console.warn('AiCostMonitor: failed to log usage (table may not exist):', error.message);
  }
}

/**
 * Sum tokens and cost for the current month (UTC).
 */
export async function getMonthlyUsage(userId: string): Promise<{
  tokensUsed: number;
  costUsd: number;
}> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString());

  if (error) {
    console.warn('AiCostMonitor: getMonthlyUsage failed:', error.message);
    return { tokensUsed: 0, costUsd: 0 };
  }

  const tokensUsed = (data ?? []).reduce((s, r) => s + (Number(r.tokens_used) || 0), 0);
  const costUsd = (data ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
  return { tokensUsed, costUsd };
}

/**
 * Return true if today's (UTC) usage is under the given token limit.
 * Requires table to exist; on error returns true (allow).
 */
export async function checkDailyLimit(
  userId: string,
  tokenLimit: number
): Promise<boolean> {
  if (tokenLimit <= 0) return true;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) {
    console.warn('AiCostMonitor: checkDailyLimit failed:', error.message);
    return true;
  }

  const used = (data ?? []).reduce((s, r) => s + (Number(r.tokens_used) || 0), 0);
  return used < tokenLimit;
}

/**
 * Return today's (UTC) token usage for the user. For UI display (e.g. "X / 10K tokens").
 */
export async function getDailyUsage(userId: string): Promise<{
  tokensUsed: number;
}> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) {
    return { tokensUsed: 0 };
  }

  const tokensUsed = (data ?? []).reduce((s, r) => s + (Number(r.tokens_used) || 0), 0);
  return { tokensUsed };
}
