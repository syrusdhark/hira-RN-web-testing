import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import {
  buildUserContext,
  formatContextForPrompt,
  type UserContext,
} from './ai-context.service';
import * as ProductionAi from './ai/production-ai.service';
import { logUsage } from './ai/cost-monitor.service';

function getAiApiKey(): string {
  const openrouter =
    Constants.expoConfig?.extra?.openrouterApiKey ||
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (typeof openrouter === 'string' && openrouter.trim().length > 0) {
    return openrouter.trim();
  }
  const key =
    Constants.expoConfig?.extra?.anthropicApiKey ||
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

/** OpenRouter keys start with sk-or-; Anthropic keys start with sk-ant- */
function isOpenRouterKey(key: string): boolean {
  return key.startsWith('sk-or-');
}

// Primary system prompt with personality, expertise, and safety rails
const ENHANCED_SYSTEM_PROMPT = `You are Hira, an elite personal trainer and nutrition coach integrated into the Hira fitness app.

<expertise>
- Exercise science and evidence-based program design
- Nutrition planning and macro tracking
- Recovery, sleep optimization, and fatigue management
- Movement quality and injury prevention
- Supplement science (evidence-based only)
</expertise>

<personality>
- Direct, confident, and motivating
- Practical over theoretical
- Personalized using user context
- Encouraging without toxic positivity
- Natural use of fitness emojis (💪, 🔥, ⚡)
- Friendly but professional
</personality>

<response_guidelines>
1. **Use context**: Reference user's injuries, goals, recent workouts, and nutrition when relevant
2. **Be specific**: "Do 3 sets of 8-12 reps" not "do some reps"
3. **Ask when needed**: If crucial info is missing, ask before giving advice
4. **Celebrate progress**: Acknowledge wins and improvements
5. **Stay concise**: Aim for 2-4 sentences unless detail is requested
6. **Progressive suggestions**: Meet users where they are, don't prescribe perfection
</response_guidelines>

<safety_boundaries>
NEVER:
- Diagnose injuries or medical conditions
- Recommend seeing a doctor for specific symptoms (you can encourage general checkups)
- Prescribe medications or supplements for medical conditions
- Give advice that contradicts user's stated injuries (e.g., squats for someone with knee injury)
- Recommend extreme calorie restriction (<1200 cal for women, <1500 for men)
- Encourage overtraining or ignoring pain

ALWAYS:
- Defer to medical professionals for pain, injuries, or health concerns
- Provide exercise modifications for injuries/limitations
- Base nutrition advice on sustainable practices
- Encourage rest and recovery when signs of overtraining appear
</safety_boundaries>

<example_interactions>
User: "What should I eat before my workout?"
Context: Goal is muscle gain, works out at 6am
Hira: "For a 6am session, keep it light: a banana with a scoop of protein powder 30-45 min before. Save the bigger meal for after when your body's primed for growth 💪"

User: "My shoulder hurts during bench press"
Hira: "Stop bench pressing until the pain's gone. Try floor press or push-ups instead - same movement, less shoulder stress. If it persists beyond a week, get it checked by a pro. Your shoulder health > any PR."

User: "I'm not seeing results"
Context: User has only logged 2 workouts in 3 weeks
Hira: "Real talk - 2 workouts in 3 weeks won't move the needle. Aim for at least 3 consistent sessions this week. Even 30 min counts. Progress comes from showing up, not perfection."
</example_interactions>

Remember: You're inside an app that tracks their workouts, nutrition, and sleep. When you reference their data, it shows you're paying attention. That's powerful.`;

// Alias so the rest of the file can use a generic name if we ever swap prompts
const SYSTEM_PROMPT = ENHANCED_SYSTEM_PROMPT;

function buildUserContextPrompt(context: UserContext): string {
  const formatted = formatContextForPrompt(context);

  if (!formatted) {
    return '';
  }

  return `
<user_context>
${formatted}
</user_context>

Use this context to personalize your responses. Reference relevant details naturally when appropriate.`;
}

async function getConversationHistory(conversationId: string, limit = 20) {
  const { data: messages, error } = await supabase
    .from('ai_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !messages) return [];

  // Reverse to get chronological order
  return messages.reverse();
}

/**
 * Sends a chat message through the AI API and stores the full conversation
 * in Supabase. Intended for use from the mobile app.
 *
 * NOTE: For production, route this through a backend so the AI API key
 * never ships in the app bundle. This direct call is for MVP/testing only.
 */
export async function sendChatMessage(
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<string> {
  try {
    // 1. Save user message to database
    const { error: saveError } = await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });

    if (saveError) throw saveError;

    // 2. Build user context
    const context = await buildUserContext(userId);
    const contextPrompt = buildUserContextPrompt(context);

    // 3. Get conversation history
    const history = await getConversationHistory(conversationId);

    // 4. Build messages array for the AI API
    const messages = [
      // Add context as a priming exchange when available
      ...(contextPrompt
        ? ([
            {
              role: 'user' as const,
              content: contextPrompt,
            },
            {
              role: 'assistant' as const,
              content:
                'I understand the user context and will personalize my responses accordingly.',
            },
          ] as const)
        : []),

      // Add conversation history
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // 5. Call the AI API (OpenRouter or Anthropic)
    const apiKey = getAiApiKey();
    if (!apiKey) {
      throw new Error(
        'Missing API key. Add EXPO_PUBLIC_OPENROUTER_API_KEY (or EXPO_PUBLIC_ANTHROPIC_API_KEY) to apps/mobile/.env and restart the dev server.'
      );
    }
    const result = await ProductionAi.chat({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      messages,
      maxTokens: 1000,
    });
    const assistantMessage = result.response;
    const tokenCount = result.tokensUsed;
    await logUsage(
      userId,
      result.tokensUsed,
      result.cost,
      isOpenRouterKey(apiKey) ? 'openrouter' : 'anthropic'
    );

    if (!assistantMessage) {
      throw new Error(
        'AI returned no content. Check your API key and model, or try again.'
      );
    }

    // 6. Save assistant response to database
    const modelUsed = isOpenRouterKey(apiKey)
      ? 'deepseek/deepseek-r1-0528:free'
      : 'claude-sonnet-4-20250514';
    const { error: saveAssistantError } = await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantMessage,
      token_count: tokenCount,
      model_used: modelUsed,
    });

    if (saveAssistantError) throw saveAssistantError;

    // 7. Update conversation timestamp
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return assistantMessage;
  } catch (error) {
    console.error('Error sending AI chat message:', error);
    throw error;
  }
}

/**
 * Helper to create a new AI conversation with an initial context snapshot.
 */
export async function createConversation(userId: string): Promise<string> {
  const context = await buildUserContext(userId);

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      context_snapshot: context,
      title: 'New Chat',
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

/**
 * Example usage sketch for a future Chat UI screen:
 *
 * - On mount:
 *   - Call createConversation(userId) if you don't have a conversationId yet.
 *   - Store conversationId in component state or navigation params.
 *
 * - When the user sends a message:
 *   - Optimistically append the user message to local UI state.
 *   - Call sendChatMessage(userId, conversationId, text).
 *   - When it resolves, append the assistantMessage to local UI state.
 *
 * - Render:
 *   - Use a FlatList / ScrollView to render messages in order.
 *   - Show a TextInput and a PrimaryButton (Send) at the bottom.
 */

