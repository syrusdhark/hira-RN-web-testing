import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const TODAY_WORKOUT_STATS_KEY = ['todayWorkoutStats'];

export type TodayWorkoutStats = {
  exercisesTotal: number;
  muscleHitMost: string | null;
  caloriesBurnedToday: number;
};

function getTodayRangeISO(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useTodayWorkoutStats() {
  return useQuery({
    queryKey: TODAY_WORKOUT_STATS_KEY,
    queryFn: async (): Promise<TodayWorkoutStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { exercisesTotal: 0, muscleHitMost: null, caloriesBurnedToday: 0 };

      const { start, end } = getTodayRangeISO();

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, calories_burned')
        .eq('user_id', user.id)
        .gte('performed_at', start)
        .lt('performed_at', end);

      if (sessionsError) throw sessionsError;
      if (!sessions?.length) return { exercisesTotal: 0, muscleHitMost: null, caloriesBurnedToday: 0 };

      const caloriesBurnedToday = (sessions ?? []).reduce(
        (sum, s) => sum + (s.calories_burned ?? 0),
        0
      );
      const sessionIds = sessions.map((s) => s.id);

      const { data: sessionExercises, error: exError } = await supabase
        .from('workout_session_exercises')
        .select('id, workout_session_id, exercise_id')
        .in('workout_session_id', sessionIds);

      if (exError) throw exError;
      const exercisesTotal = sessionExercises?.length ?? 0;

      const exerciseIds = [...new Set((sessionExercises ?? []).map((e) => e.exercise_id).filter(Boolean))] as string[];
      let muscleHitMost: string | null = null;
      if (exerciseIds.length > 0) {
        const { data: muscles, error: musError } = await supabase
          .from('exercise_muscles')
          .select('exercise_id, muscle')
          .in('exercise_id', exerciseIds)
          .eq('role', 'primary');

        if (!musError && muscles?.length) {
          const countByMuscle: Record<string, number> = {};
          for (const row of muscles) {
            const m = String(row.muscle ?? '').trim();
            if (m) countByMuscle[m] = (countByMuscle[m] ?? 0) + 1;
          }
          const entries = Object.entries(countByMuscle);
          if (entries.length > 0) {
            const max = entries.reduce((a, b) => (a[1] >= b[1] ? a : b));
            muscleHitMost = max[0];
          }
        }
      }

      return { exercisesTotal, muscleHitMost, caloriesBurnedToday };
    },
  });
}
