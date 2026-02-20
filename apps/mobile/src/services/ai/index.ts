/**
 * AI services: context, local Ollama, production API.
 * Chat entry point remains ai-chat.service.ts (createConversation, sendChatMessage).
 */

export { analyzeQueryType, buildContextForQuery } from './context-builder.service';
export type { QueryAnalysis, QueryType } from './context-builder.service';
export { formatForAI, formatMinimal } from './context-formatter.service';
export {
  chat as localAiChat,
  isAvailable as localAiIsAvailable,
  warmup as localAiWarmup,
  getDiagnostics as localAiGetDiagnostics,
  getAvailableModels as localAiGetAvailableModels,
} from './local-ai.service';
export { optimizeForSmallModel } from './context-optimizer.service';
export { chat as productionAiChat } from './production-ai.service';
export type { ProductionChatResult, ProductionChatParams } from './production-ai.service';
export { logUsage, getMonthlyUsage, checkDailyLimit } from './cost-monitor.service';
export type { AiUsageProvider } from './cost-monitor.service';
