# Changelog

## 4-week restructuring (AI v2, features layout, 5-tab nav)

### Removed / out of scope
- **Nutrition**: No nutrition screens, routes, or UI; legacy code archived under `src/archive/nutrition/` if present. DB tables unchanged.
- **Sleep / Habits**: No standalone Sleep or Habit tracker screens; archived under `src/archive/sleep/`, `src/archive/habits/` if present. AI context for nutrition/sleep is keyword-only (no app data).
- **Daily Check-in**: No UI; optional table `daily_feelings` migration available (`supabase/migrations/20250218000000_daily_feelings.sql`) for future use.

### AI Chat v2
- **Service** (`services/ai/ai-chat-service-v2.ts`): `sendMessage(userId, userMessage, conversationId?)`, `getUserUsage(userId)`, `clearConversation(conversationId)`, `getConversationHistory(conversationId)`, `getUserConversations(userId)`.
- **Daily limit**: Production API enforces a daily token limit (e.g. 10K); clear error when exceeded (`DAILY_LIMIT_REACHED`).
- **AiChatScreen**: Usage badge in header (X / 10K tokens or "Limit reached"), Load conversation history on open, **Clear chat** button, **Quick-suggestion chips** (e.g. "Should I workout today?", "How am I progressing?"), "Hira is thinking…" while waiting for reply.

### Features layout
- **Re-exports** under `src/features/`: `ai/`, `shop/`, `community/`, `workout/` (screens and hooks). Existing imports from `screens/`, `context/`, `hooks/` still work.
- **Path alias**: `@/*` → `./src/*` in `tsconfig.json`; enable with `app.json` `experiments.tsconfigPaths: true`. Use e.g. `from '@/theme'`, `from '@/features/ai'`.

### Navigation
- **5 tabs**: Buy, Today, Hira, Connect, **Profile**. Progress tab removed; **Profile** is the 5th tab. Workout Insights remains reachable from Today (Muscle intensity link).

### Cleanup
- Stray `console.log` removed from production paths (App, TemplateSessionScreen, useWorkoutTemplates).

### Docs
- **PROJECT_SUMMARY.md**: Updated for AI v2, features folder, 5-tab nav, run instructions, and database (optional `daily_feelings`).
