import type { WellnessContext } from '../../types/ai-context';

/**
 * Format WellnessContext into readable text for the AI system/context block.
 */
export function formatForAI(context: WellnessContext): string {
  const parts: string[] = [];

  parts.push('USER PROFILE:');
  parts.push(`Name: ${context.core.user_name}`);
  parts.push(`Date: ${context.core.current_date}`);
  parts.push('');

  if (context.current_state) {
    const cs = context.current_state;
    const stateLines: string[] = [];
    if (cs.today_feeling != null) stateLines.push(`Feeling today: ${cs.today_feeling}/10`);
    if (cs.today_energy != null) stateLines.push(`Energy level: ${cs.today_energy}/10`);
    if (cs.current_mood) stateLines.push(`Mood: ${cs.current_mood}`);
    if (cs.sleep_quality != null) stateLines.push(`Sleep quality: ${cs.sleep_quality}/10`);
    if (stateLines.length) {
      parts.push('CURRENT STATE:');
      stateLines.forEach((l) => parts.push(l));
      parts.push('');
    }
  }

  if (context.recent_activity) {
    const ra = context.recent_activity;
    parts.push('RECENT ACTIVITY:');
    parts.push(`Workouts this week: ${ra.workouts_this_week ?? 0}`);
    if (ra.last_workout) {
      const lw = ra.last_workout;
      parts.push(`Last workout: ${lw.date}`);
      parts.push(`  - Duration: ${lw.duration_minutes} minutes`);
      parts.push(`  - Exercises: ${(lw.exercises ?? []).slice(0, 5).join(', ')}${(lw.exercises?.length ?? 0) > 5 ? '...' : ''}`);
      if (lw.feeling_score != null) parts.push(`  - Felt: ${lw.feeling_score}/10`);
      if (lw.rpe != null) parts.push(`  - RPE: ${lw.rpe}/10`);
    }
    if (ra.avg_feeling_this_week != null) {
      parts.push(`Average feeling this week: ${ra.avg_feeling_this_week.toFixed(1)}/10`);
    }
    parts.push('');
  }

  if (context.recovery) {
    const r = context.recovery;
    parts.push('RECOVERY STATUS:');
    if (r.muscles_ready?.length) parts.push(`Ready to train: ${r.muscles_ready.join(', ')}`);
    if (r.muscles_recovering?.length) parts.push(`Recovering: ${r.muscles_recovering.join(', ')}`);
    if (r.muscles_need_rest?.length) parts.push(`Still recovering: ${r.muscles_need_rest.join(', ')}`);
    if (r.overall_recovery_score != null) parts.push(`Overall recovery: ${r.overall_recovery_score}/10`);
    parts.push('');
  }

  if (context.patterns) {
    const p = context.patterns;
    parts.push('PATTERNS & PREFERENCES:');
    if (p.favorite_exercises?.length) parts.push(`Favorite exercises: ${p.favorite_exercises.join(', ')}`);
    if (p.best_workout_time) parts.push(`Best workout time: ${p.best_workout_time}`);
    if (p.optimal_workout_frequency != null) parts.push(`Optimal frequency: ${p.optimal_workout_frequency}x per week`);
    parts.push('');
  }

  if (context.goals) {
    const g = context.goals;
    parts.push('GOALS:');
    if (g.primary_intention) parts.push(`Primary intention: ${g.primary_intention.replace(/_/g, ' ')}`);
    if (g.fitness_level) parts.push(`Fitness level: ${g.fitness_level}`);
    if (g.specific_goals?.length) parts.push(`Goals: ${g.specific_goals.join(', ')}`);
    parts.push('');
  }

  return parts.join('\n').trim();
}

/**
 * Create a minimal one-line summary for token efficiency.
 */
export function formatMinimal(context: WellnessContext): string {
  const parts: string[] = [];

  parts.push(`User: ${context.core.user_name}`);

  if (context.current_state?.today_feeling != null) {
    parts.push(`Feeling: ${context.current_state.today_feeling}/10`);
  }
  if (context.recent_activity?.workouts_this_week != null) {
    parts.push(`Workouts this week: ${context.recent_activity.workouts_this_week}`);
  }
  if (context.recovery?.muscles_need_rest?.length) {
    parts.push(`Recovering: ${context.recovery.muscles_need_rest.join(', ')}`);
  }

  return parts.join(' | ');
}
