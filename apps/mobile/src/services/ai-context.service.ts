import { supabase } from '../lib/supabase';

export interface UserContext {
  profile: {
    injuries?: string[];
    goals?: string[];
    experience_level?: string;
    dietary_restrictions?: string[];
  };
  workout: {
    active_program?: {
      name: string;
      focus: string;
      days_per_week: number;
    };
    recent_sessions?: Array<{
      date: string;
      template_name: string;
      completed: boolean;
    }>;
    preferences?: {
      favorite_exercises?: string[];
      avoided_exercises?: string[];
    };
  };
  memory: {
    // Raw memory payloads from ai_memory_snapshots, keyed by memory_type.
    // We deliberately keep this loose so the DB schema can evolve.
    [key: string]: any;
  };
}

/**
 * Builds a structured UserContext from Supabase.
 * Aggregates active ai_memory_snapshots and recent workout templates.
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  const context: UserContext = {
    profile: {},
    workout: {},
    memory: {},
  };

  try {
    // 1. Get active memory snapshots
    const { data: memories, error: memoriesError } = await supabase
      .from('ai_memory_snapshots')
      .select('memory_type, value')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!memoriesError && memories) {
      memories.forEach((m: { memory_type: string; value: any }) => {
        context.memory[m.memory_type] = m.value;
      });

      // Map memories to structured context
      const injuries = context.memory.injuries;
      const goals = context.memory.goals;
      const experienceLevel = context.memory.experience_level;
      const dietaryConstraints = context.memory.dietary_constraints;

      context.profile.injuries = injuries?.list ?? [];
      context.profile.goals = goals?.list ?? [];
      context.profile.experience_level =
        typeof experienceLevel === 'string' ? experienceLevel : 'intermediate';
      context.profile.dietary_restrictions = dietaryConstraints?.list ?? [];
    }

    // 2. Get recent workout templates (acts as proxy for recent sessions for now)
    const { data: recentTemplates, error: templatesError } = await supabase
      .from('workout_templates')
      .select('name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!templatesError && recentTemplates && recentTemplates.length > 0) {
      context.workout.recent_sessions = recentTemplates.map(
        (t: { name: string; created_at: string }) => ({
          date: t.created_at,
          template_name: t.name,
          // Once workout logs are in place we can wire real completion here.
          completed: false,
        })
      );
    }

    return context;
  } catch (error) {
    // We intentionally swallow errors here and return partial context
    // so the AI experience can still function.
    console.error('Error building user context:', error);
    return context;
  }
}

/**
 * Formats a UserContext into a compact, human-readable string
 * suitable for injecting into an AI prompt.
 */
export function formatContextForPrompt(context: UserContext): string {
  const parts: string[] = [];

  // Profile info
  if (context.profile.experience_level) {
    parts.push(`Experience Level: ${context.profile.experience_level}`);
  }

  if (context.profile.goals && context.profile.goals.length > 0) {
    parts.push(`Goals: ${context.profile.goals.join(', ')}`);
  }

  if (context.profile.injuries && context.profile.injuries.length > 0) {
    parts.push(`Injuries/Limitations: ${context.profile.injuries.join(', ')}`);
  }

  if (
    context.profile.dietary_restrictions &&
    context.profile.dietary_restrictions.length > 0
  ) {
    parts.push(
      `Dietary Restrictions: ${context.profile.dietary_restrictions.join(', ')}`
    );
  }

  // Workout info
  if (context.workout.recent_sessions && context.workout.recent_sessions.length > 0) {
    parts.push(
      `Recent Workouts: ${context.workout.recent_sessions
        .map((s) => s.template_name)
        .join(', ')}`
    );
  }

  return parts.join('\n');
}
