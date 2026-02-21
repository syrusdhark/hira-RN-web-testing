import { supabase } from '../../lib/supabase';
import type { WellnessContext } from '../../types/ai-context';

export type QueryType = 'workout' | 'nutrition' | 'sleep' | 'general' | 'recovery' | 'emotional';

export interface QueryAnalysis {
  type: QueryType;
  keywords: string[];
  needsRecovery: boolean;
  needsHistory: boolean;
}

const WORKOUT_KEYWORDS = [
  'workout', 'exercise', 'train', 'lift', 'squat', 'bench', 'deadlift',
  'press', 'row', 'pull', 'push', 'cardio', 'run', 'bike', 'swim',
  'strength', 'muscle', 'program', 'routine', 'gym', 'fitness',
];

const RECOVERY_KEYWORDS = [
  'sore', 'pain', 'hurt', 'recover', 'rest', 'tired', 'fatigue',
  'doms', 'injury', 'strain', 'ache',
];

const EMOTIONAL_KEYWORDS = [
  'feel', 'feeling', 'mood', 'stressed', 'anxious', 'happy',
  'sad', 'overwhelmed', 'motivated', 'unmotivated', 'burnout',
];

const NUTRITION_KEYWORDS = [
  'eat', 'food', 'meal', 'hungry', 'diet', 'calories',
  'protein', 'carbs', 'fat', 'nutrition', 'snack',
];

const SLEEP_KEYWORDS = [
  'sleep', 'insomnia', 'tired', 'energy', 'rest', 'exhausted',
  'wake', 'bed', 'nap',
];

/**
 * Analyzes user message to determine what context is needed.
 */
export function analyzeQueryType(message: string): QueryAnalysis {
  const lowerMessage = message.toLowerCase();

  const hasWorkout = WORKOUT_KEYWORDS.some((kw) => lowerMessage.includes(kw));
  const hasRecovery = RECOVERY_KEYWORDS.some((kw) => lowerMessage.includes(kw));
  const hasEmotional = EMOTIONAL_KEYWORDS.some((kw) => lowerMessage.includes(kw));
  const hasNutrition = NUTRITION_KEYWORDS.some((kw) => lowerMessage.includes(kw));
  const hasSleep = SLEEP_KEYWORDS.some((kw) => lowerMessage.includes(kw));

  const keywords: string[] = [];
  [...WORKOUT_KEYWORDS, ...RECOVERY_KEYWORDS, ...EMOTIONAL_KEYWORDS].forEach((kw) => {
    if (lowerMessage.includes(kw)) keywords.push(kw);
  });

  let type: QueryType;
  if (hasRecovery) type = 'recovery';
  else if (hasWorkout) type = 'workout';
  else if (hasEmotional) type = 'emotional';
  else if (hasNutrition) type = 'nutrition';
  else if (hasSleep) type = 'sleep';
  else type = 'general';

  return {
    type,
    keywords,
    needsRecovery: hasRecovery || hasWorkout,
    needsHistory: hasWorkout || hasRecovery,
  };
}

/**
 * Build context based on query analysis. Always includes core; adds tiers by query type.
 */
export async function buildContextForQuery(
  userId: string,
  userMessage: string,
  maxHistoryDays = 7
): Promise<WellnessContext> {
  const analysis = analyzeQueryType(userMessage);

  const context: WellnessContext = {
    core: await getCoreContext(userId),
    current_state: await getCurrentState(userId),
    goals: await getGoals(userId),
  };

  switch (analysis.type) {
    case 'workout':
    case 'recovery':
      context.recent_activity = await getRecentActivity(userId, maxHistoryDays);
      context.patterns = await getWorkoutPatterns(userId);
      if (analysis.needsRecovery) {
        context.recovery = await getRecoveryStatus(userId);
      }
      break;
    case 'emotional':
      context.recent_activity = await getRecentActivity(userId, maxHistoryDays);
      context.patterns = await getWorkoutPatterns(userId);
      break;
    case 'nutrition':
    case 'sleep':
      // No app-specific nutrition/sleep data; context stays core + goals. AI can still give general advice.
      context.recent_activity = await getRecentActivity(userId, Math.min(3, maxHistoryDays));
      break;
    case 'general':
      break;
  }

  return context;
}

async function getCoreContext(userId: string): Promise<WellnessContext['core']> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  return {
    user_name: (profile?.full_name as string)?.trim() || 'there',
    current_date: new Date().toISOString().split('T')[0],
    user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/** Stub: daily_feelings table may not exist; return empty or extend when table is added. */
async function getCurrentState(userId: string): Promise<WellnessContext['current_state']> {
  // Optional: when daily_feelings exists, query by user_id and today's date
  return {};
}

async function getRecentActivity(
  userId: string,
  days: number
): Promise<WellnessContext['recent_activity']> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      performed_at,
      duration_minutes,
      feeling_score,
      rpe_actual,
      workout_session_exercises ( exercise_name )
    `)
    .eq('user_id', userId)
    .gte('performed_at', startDate.toISOString())
    .order('performed_at', { ascending: false })
    .limit(20);

  if (error || !sessions?.length) {
    return { workouts_this_week: 0 };
  }

  const exerciseNames = (s: { workout_session_exercises?: { exercise_name: string }[] }) =>
    (s.workout_session_exercises ?? []).map((e) => e.exercise_name);

  const last = sessions[0] as {
    performed_at: string;
    duration_minutes: number | null;
    feeling_score: number | null;
    rpe_actual: number | null;
    workout_session_exercises?: { exercise_name: string }[];
  };

  const totalFeeling = sessions.reduce(
    (sum, s) => sum + ((s as { feeling_score?: number }).feeling_score ?? 0),
    0
  );
  const avgFeeling = sessions.length ? totalFeeling / sessions.length : 0;

  return {
    workouts_this_week: sessions.length,
    last_workout: {
      date: last.performed_at,
      exercises: exerciseNames(last),
      duration_minutes: last.duration_minutes ?? 0,
      feeling_score: last.feeling_score ?? undefined,
      rpe: last.rpe_actual ?? undefined,
    },
    avg_feeling_this_week: avgFeeling,
  };
}

/** Stub: RPC get_muscle_recovery_status may be added later; on missing RPC returns {}. */
async function getRecoveryStatus(userId: string): Promise<WellnessContext['recovery']> {
  const { data, error } = await supabase.rpc('get_muscle_recovery_status', {
    p_user_id: userId,
  });

  if (error || !data || !Array.isArray(data)) {
    return {};
  }

  const ready: string[] = [];
  const recovering: string[] = [];
  const needRest: string[] = [];

  (data as { muscle?: string; hours_since?: number }[]).forEach((row) => {
    const muscle = row.muscle ?? '';
    const hours = row.hours_since ?? 0;
    if (hours >= 48) ready.push(muscle);
    else if (hours >= 24) recovering.push(muscle);
    else needRest.push(muscle);
  });

  const total = ready.length + recovering.length + needRest.length;
  const overall_recovery_score = total
    ? Math.min(10, Math.floor((ready.length / total) * 10))
    : undefined;

  return {
    muscles_ready: ready.length ? ready : undefined,
    muscles_recovering: recovering.length ? recovering : undefined,
    muscles_need_rest: needRest.length ? needRest : undefined,
    overall_recovery_score,
  };
}

/** Stub: RPC get_user_workout_patterns may be added; fallback from recent sessions. */
async function getWorkoutPatterns(userId: string): Promise<WellnessContext['patterns']> {
  const { data, error } = await supabase.rpc('get_user_workout_patterns', {
    p_user_id: userId,
  });

  if (!error && data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as { favorite_exercises?: string[]; best_time?: string; avg_weekly_workouts?: number };
    return {
      favorite_exercises: d.favorite_exercises,
      best_workout_time: (d.best_time as 'morning' | 'afternoon' | 'evening') ?? 'morning',
      optimal_workout_frequency: d.avg_weekly_workouts ?? 3,
    };
  }

  const activity = await getRecentActivity(userId, 30);
  const exercises = activity?.last_workout?.exercises ?? [];
  return {
    favorite_exercises: exercises.length ? exercises.slice(0, 5) : undefined,
    best_workout_time: 'morning',
    optimal_workout_frequency: 3,
  };
}

async function getGoals(userId: string): Promise<WellnessContext['goals']> {
  const { data: profile } = await supabase
    .from('user_health_profile')
    .select('goals')
    .eq('user_id', userId)
    .single();

  const { data: program } = await supabase
    .from('workout_programs')
    .select('intention, fitness_level')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  type Goals = NonNullable<WellnessContext['goals']>;
  const intention = program?.intention as Goals['primary_intention'] | undefined;
  const fitness_level = program?.fitness_level as Goals['fitness_level'] | undefined;
  const specific_goals = Array.isArray(profile?.goals) ? (profile.goals as string[]) : undefined;

  return {
    primary_intention: intention,
    fitness_level,
    specific_goals: specific_goals?.length ? specific_goals : undefined,
  };
}
