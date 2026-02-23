/**
 * AI chat service v2: usage limits, clear conversation, list conversations.
 * Delegates actual send to ai-chat.service; enforces daily token limit for production API.
 */

import { supabase } from '../../lib/supabase';
import {
  createConversation as createConversationBase,
  sendChatMessage as sendChatMessageBase,
} from '../ai-chat.service';
import { getAiConfig } from '../../config/ai.config';
import { checkDailyLimit, getDailyUsage } from './cost-monitor.service';

export const DAILY_LIMIT_REACHED = 'DAILY_LIMIT_REACHED';

export interface UserUsage {
  tokensUsed: number;
  limit: number;
  limitReached: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

/**
 * Send a message. Creates a conversation if conversationId is omitted.
 * For production API, throws if daily token limit exceeded (message includes DAILY_LIMIT_REACHED).
 */
export async function sendMessage(
  userId: string,
  userMessage: string,
  conversationId?: string | null
): Promise<{ reply: string; conversationId: string }> {
  const id = conversationId ?? (await createConversationBase(userId));

  const config = getAiConfig();
  const limit = config.dailyLimit ?? 10_000;
  if (limit > 0) {
    const withinLimit = await checkDailyLimit(userId, limit);
    if (!withinLimit) {
      const e = new Error(
        `You've reached your daily limit (${limit.toLocaleString()} tokens). Try again tomorrow.`
      ) as Error & { code?: string };
      e.code = DAILY_LIMIT_REACHED;
      throw e;
    }
  }

  const reply = await sendChatMessageBase(userId, id, userMessage);
  return { reply, conversationId: id };
}

/**
 * Usage for today (production API).
 */
export async function getUserUsage(userId: string): Promise<UserUsage> {
  const config = getAiConfig();
  const limit = config.dailyLimit ?? 10_000;

  if (limit <= 0) {
    return { tokensUsed: 0, limit: 0, limitReached: false };
  }

  const { tokensUsed } = await getDailyUsage(userId);
  return {
    tokensUsed,
    limit,
    limitReached: tokensUsed >= limit,
  };
}

/**
 * Clear all messages in a conversation. Conversation row is kept.
 */
export async function clearConversation(conversationId: string): Promise<void> {
  await supabase.from('ai_messages').delete().eq('conversation_id', conversationId);
}

/**
 * List user's conversations, newest first.
 */
export async function getUserConversations(userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || 'New Chat',
    updated_at: (r.updated_at as string) ?? '',
  }));
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Load message history for a conversation (chronological order).
 */
export async function getConversationHistory(
  conversationId: string,
  limit = 50
): Promise<HistoryMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: (m.content as string) ?? '',
  }));
}

// Re-export for consumers that need to create a conversation without sending
export { createConversationBase as createConversation } from '../ai-chat.service';
