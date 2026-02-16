import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Exercise } from '../services/MuscleIntensityCalculator';

export const TODAY_WORKOUT_FOR_INTENSITY_KEY = ['todayWorkoutForIntensity'];

function getTodayRangeISO(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export type TodayWorkoutForIntensity = {
  exercises: Exercise[];
  totalDurationMinutes: number;
};

export function useTodayWorkoutForIntensity() {
  return useQuery({
    queryKey: TODAY_WORKOUT_FOR_INTENSITY_KEY,
    queryFn: async (): Promise<TodayWorkoutForIntensity> => {
      const empty: TodayWorkoutForIntensity = { exercises: [], totalDurationMinutes: 0 };
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return empty;

      const { start, end } = getTodayRangeISO();

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, duration_minutes')
        .eq('user_id', user.id)
        .gte('performed_at', start)
        .lt('performed_at', end)
        .order('performed_at', { ascending: true });

      if (sessionsError || !sessions?.length) return empty;

      const totalDurationMinutes = (sessions ?? []).reduce(
        (sum, s) => sum + (s.duration_minutes ?? 0),
        0
      );
      const sessionIds = sessions.map((s) => s.id);

      const { data: sessionExercises, error: exError } = await supabase
        .from('workout_session_exercises')
        .select('id, workout_session_id, exercise_name, order_index')
        .in('workout_session_id', sessionIds)
        .order('workout_session_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (exError || !sessionExercises?.length) return { exercises: [], totalDurationMinutes };

      const exerciseRowIds = sessionExercises.map((e) => e.id);

      const { data: setsRows, error: setsError } = await supabase
        .from('workout_session_sets')
        .select('workout_session_exercise_id, weight, reps, rir')
        .in('workout_session_exercise_id', exerciseRowIds)
        .order('workout_session_exercise_id');

      if (setsError) return { exercises: [], totalDurationMinutes };

      const setsByExerciseId: Record<string, { reps: number; weight: number; rir?: number }[]> = {};
      for (const e of sessionExercises) {
        setsByExerciseId[e.id] = [];
      }
      for (const row of setsRows ?? []) {
        const list = setsByExerciseId[row.workout_session_exercise_id];
        if (list) {
          list.push({
            reps: row.reps ?? 0,
            weight: row.weight != null ? Number(row.weight) : 0,
            rir: row.rir ?? undefined,
          });
        }
      }

      const exercises: Exercise[] = sessionExercises.map((row) => ({
        name: row.exercise_name ?? '--',
        sets: setsByExerciseId[row.id] ?? [],
      }));

      return { exercises, totalDurationMinutes };
    },
  });
}
