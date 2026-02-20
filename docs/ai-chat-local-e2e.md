# AI Chat: Local Ollama E2E Testing

Run the full chat flow **end-to-end with local Ollama only** (no API key). Use this to validate integration before adding production API (Phase 3).

## Prerequisites

1. **Ollama** installed and a model pulled:
   ```bash
   ollama pull llama3.1:8b
   ollama run llama3.1:8b
   # Leave it running or run in background
   ```

2. **Env** in `apps/mobile/.env`:
   ```env
   EXPO_PUBLIC_USE_LOCAL_AI=true
   EXPO_PUBLIC_LOCAL_AI_URL=http://localhost:11434
   EXPO_PUBLIC_LOCAL_AI_MODEL=llama3.1:8b
   ```
   - **Android emulator:** use `EXPO_PUBLIC_LOCAL_AI_URL=http://10.0.2.2:11434`
   - **Physical device:** use your machine’s LAN IP (e.g. `http://192.168.1.100:11434`)

3. **No API key** required for this phase. You can omit `EXPO_PUBLIC_ANTHROPIC_API_KEY` or leave it empty.

## Steps

1. **Start the app** (from repo root or `apps/mobile`):
   ```bash
   npx expo start
   ```

2. **Open the AI chat** in the app (e.g. Today tab → AI chat entry point).

3. **Create conversation** – the app calls `createConversation(userId)`. Confirm no error.

4. **Send a message** – e.g. “Should I workout today?”. Confirm:
   - Request is sent to Ollama (no cloud call).
   - A reply appears from the local model.
   - The user message and assistant reply are stored in Supabase (`ai_messages`).
   - Conversation history still loads correctly (e.g. send a second message and confirm context is consistent).

5. **Error case** – stop Ollama or set `EXPO_PUBLIC_LOCAL_AI_URL` to an unreachable host. Send a message and confirm the app shows a clear error (e.g. “Cannot reach local AI. Check URL and that Ollama is running.”).

## Sign-off

When the above works reliably, local E2E is complete. Proceed to Phase 3 to add production API (Anthropic/OpenRouter) and the option to switch between local and API.
