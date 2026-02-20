import type { WellnessContext } from '../../types/ai-context';

/**
 * Optimize context for smaller local models (e.g. phi4-mini) to reduce tokens and latency.
 */
export function optimizeForSmallModel(context: WellnessContext): string {
  const lines: string[] = [];

  lines.push(`User: ${context.core.user_name}`);

  if (context.current_state?.today_feeling != null) {
    lines.push(`Feeling: ${context.current_state.today_feeling}/10`);
  }
  if (context.current_state?.today_energy != null) {
    lines.push(`Energy: ${context.current_state.today_energy}/10`);
  }

  if (context.recent_activity?.workouts_this_week != null) {
    lines.push(`Workouts this week: ${context.recent_activity.workouts_this_week}`);
  }
  if (context.recent_activity?.last_workout) {
    const w = context.recent_activity.last_workout;
    const exercises = (w.exercises ?? []).slice(0, 2).join(', ');
    lines.push(
      `Last workout: ${exercises || '—'} (felt ${w.feeling_score ?? '—'}/10)`
    );
  }

  if (context.recovery?.muscles_need_rest?.length) {
    lines.push(
      `Recovering: ${context.recovery.muscles_need_rest.slice(0, 3).join(', ')}`
    );
  }

  return lines.join('\n');
}
