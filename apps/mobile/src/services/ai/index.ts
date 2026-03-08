/**
 * AI services: context, production API (OpenRouter / Anthropic), Gemini chat.
 * Chat entry point: ai-chat.service.ts (createConversation, sendChatMessage).
 * Local chat: gemini.service sendGeminiMessage (conversation only).
 */

export { sendGeminiMessage } from './gemini.service';
export type { SendGeminiMessageParams, GeminiConfig } from './gemini.service';
export { analyzeQueryType, buildContextForQuery } from './context-builder.service';
export type { QueryAnalysis, QueryType } from './context-builder.service';
export { formatForAI, formatMinimal } from './context-formatter.service';
export { optimizeForSmallModel } from './context-optimizer.service';
export { chat as productionAiChat } from './production-ai.service';
export type { ProductionChatResult, ProductionChatParams } from './production-ai.service';
export { logUsage, getMonthlyUsage, checkDailyLimit, getDailyUsage } from './cost-monitor.service';
export type { AiUsageProvider } from './cost-monitor.service';
export { createConversation } from '../ai-chat.service';
export {
  sendMessage,
  getUserUsage,
  clearConversation,
  getUserConversations,
  getConversationHistory,
  DAILY_LIMIT_REACHED,
} from './ai-chat-service-v2';
export type { UserUsage, ConversationSummary, HistoryMessage } from './ai-chat-service-v2';
