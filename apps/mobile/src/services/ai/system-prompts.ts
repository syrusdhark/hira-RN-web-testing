/**
 * Production-grade system prompts for Hira AI.
 * One master prompt + structured context + optional behavior mode.
 */

import type { WellnessContext } from '../../types/ai-context';

// ---------------------------------------------------------------------------
// Runtime context (replaces query-type routing)
// ---------------------------------------------------------------------------

export interface HiraRuntimeContext {
  user: {
    name: string;
    feeling?: number;
    energy?: number;
    recovery?: string;
  };
  intent?: string;
  surface?: 'chat' | 'home_card' | 'insight_view';
  behaviorMode?: 'normal' | 'brief' | 'deep_reflection';
}

// ---------------------------------------------------------------------------
// Master prompt (full)
// ---------------------------------------------------------------------------

export const HIRA_MASTER_PROMPT = `You are Hira, a calm, emotionally intelligent AI wellness companion.

ROLE:
- Supportive, grounded, never preachy.
- Encourages reflection before instruction.
- Gives options, not commands.
- Does not diagnose medical conditions.
- Avoids overwhelming the user.

PRIMARY BEHAVIOR:
1. Acknowledge emotional state first.
2. Interpret context (energy, recovery, workouts).
3. Offer 1–3 simple next steps.
4. Keep responses concise (under 180 words).
5. Never switch personality; one unified voice.

DECISION LOGIC:
- If emotional distress appears → prioritize validation.
- If workout planning appears → consider energy + recovery.
- If insights requested → summarize patterns clearly.
- If unclear → ask one clarifying question.

CONSTRAINTS:
- NEVER give medical advice or diagnose conditions.
- NEVER tell someone to push through pain or injury.
- NEVER shame, judge, or use aggressive fitness language.
- If something seems medical: "That sounds worth checking with a doctor."
- Rest is progress. Listen to body signals. Sustainable beats optimal. Every body is different.`;

// ---------------------------------------------------------------------------
// Compact variant (Gemini 2.5 Flash Lite optimized)
// ---------------------------------------------------------------------------

export const HIRA_MASTER_PROMPT_COMPACT = `You are Hira, a calm, emotionally intelligent AI wellness companion.

Core identity: Supportive, grounded. Reflection before instruction. Options, not commands. No medical diagnosis. Avoid overwhelming the user.

Behavior:
1. Acknowledge emotional state first.
2. Use context (energy, recovery, workouts).
3. Offer 1–3 simple next steps.
4. Keep under 180 words. One voice.

Decision logic: Emotional distress → validate first. Workout planning → energy + recovery. Insights → summarize patterns. Unclear → one clarifying question.

Constraints: No medical advice. No pushing through pain. No shame or aggressive fitness language. If medical: "Worth checking with a doctor." Rest = progress. Sustainable > optimal.`;

// ---------------------------------------------------------------------------
// Build full system prompt from context
// ---------------------------------------------------------------------------

export interface BuildPromptOptions {
  useCompact?: boolean;
}

export function buildPrompt(
  context: HiraRuntimeContext,
  options?: BuildPromptOptions
): string {
  const base =
    options?.useCompact !== false ? HIRA_MASTER_PROMPT_COMPACT : HIRA_MASTER_PROMPT;

  let block = '\n\nCURRENT USER STATE:\n';
  block += `- Name: ${context.user.name}\n`;
  block += `- Feeling: ${context.user.feeling != null ? `${context.user.feeling}/10` : 'unknown'}\n`;
  block += `- Energy: ${context.user.energy != null ? `${context.user.energy}/10` : 'unknown'}\n`;
  block += `- Recovery: ${context.user.recovery ?? 'unknown'}\n`;

  if (context.surface != null || context.intent != null) {
    block += '\nINTERACTION CONTEXT:\n';
    if (context.surface != null) block += `- Surface: ${context.surface}\n`;
    if (context.intent != null) block += `- Intent hint: ${context.intent}\n`;
  }

  if (context.behaviorMode != null && context.behaviorMode !== 'normal') {
    block += '\nRESPONSE MODE:\n';
    if (context.behaviorMode === 'brief') {
      block += '- Keep under 100 words.\n';
    } else if (context.behaviorMode === 'deep_reflection') {
      block += '- Explore underlying patterns; slightly longer reflection OK.\n';
    }
  }

  return base + block;
}

// ---------------------------------------------------------------------------
// Optional: map WellnessContext → HiraRuntimeContext
// ---------------------------------------------------------------------------

export function wellnessToRuntimeContext(
  w: WellnessContext,
  overrides?: Partial<HiraRuntimeContext>
): HiraRuntimeContext {
  const recoveryParts: string[] = [];
  if (w.recovery?.muscles_need_rest?.length) {
    recoveryParts.push(`need rest: ${w.recovery.muscles_need_rest.slice(0, 3).join(', ')}`);
  }
  if (w.recovery?.overall_recovery_score != null) {
    recoveryParts.push(`score ${w.recovery.overall_recovery_score}/10`);
  }
  const recovery = recoveryParts.length ? recoveryParts.join('; ') : undefined;

  const ctx: HiraRuntimeContext = {
    user: {
      name: w.core.user_name,
      feeling: w.current_state?.today_feeling,
      energy: w.current_state?.today_energy,
      recovery,
    },
    ...overrides,
  };
  if (overrides?.user) {
    ctx.user = { ...ctx.user, ...overrides.user };
  }
  return ctx;
}
