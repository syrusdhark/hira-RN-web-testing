/**
 * AI feature: chat screen and AI services.
 */

export { AiChatScreen } from '../../screens/AiChatScreen';
export {
  sendMessage,
  getUserUsage,
  clearConversation,
  getUserConversations,
  getConversationHistory,
  createConversation,
  shouldUseLocalAi,
  DAILY_LIMIT_REACHED,
} from '../../services/ai';
export type { UserUsage, ConversationSummary, HistoryMessage } from '../../services/ai';
