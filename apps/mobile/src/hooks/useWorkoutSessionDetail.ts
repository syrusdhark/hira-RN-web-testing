import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type SessionSet = {
  id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  rir: number | null;
};

export type SessionExercise = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: SessionSet[];
};

export type WorkoutSessionDetail = {
  id: string;
  title: string;
  performed_at: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  total_weight_kg: number | null;
  distance_km: number | null;
  session_type: string;
  exercises: SessionExercise[];
};

const WORKOUT_SESSION_DETAIL_KEY = (id: string | null) => ['workoutSessionDetail', id ?? ''];

export function useWorkoutSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: WORKOUT_SESSION_DETAIL_KEY(sessionId),
    queryFn: async (): Promise<WorkoutSessionDetail | null> => {
      if (!sessionId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, performed_at, duration_minutes, calories_burned, session_type, workout_template_id, workout_templates(title)')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !session) return null;

      const { data: exercises, error: exError } = await supabase
        .from('workout_session_exercises')
        .select('id, exercise_id, exercise_name, order_index')
        .eq('workout_session_id', sessionId)
        .order('order_index', { ascending: true });

      if (exError) {
        console.error('Error fetching session exercises:', exError);
        return null;
      }

      const exerciseList = exercises ?? [];
      const exerciseIds = exerciseList.map((e) => e.id);

      const { data: setsRows, error: setsError } = await supabase
        .from('workout_session_sets')
        .select('id, workout_session_exercise_id, set_number, weight, reps, duration_seconds, rest_seconds, rir')
        .in('workout_session_exercise_id', exerciseIds)
        .order('set_number', { ascending: true });

      if (setsError) {
        console.error('Error fetching session sets:', setsError);
        return null;
      }

      const setsByExercise: Record<string, SessionSet[]> = {};
      for (const e of exerciseList) {
        setsByExercise[e.id] = [];
      }
      for (const row of setsRows ?? []) {
        const list = setsByExercise[row.workout_session_exercise_id];
        if (list) {
          list.push({
            id: row.id,
            set_number: row.set_number,
            reps: row.reps ?? null,
            weight: row.weight != null ? Number(row.weight) : null,
            duration_seconds: row.duration_seconds ?? null,
            rest_seconds: row.rest_seconds ?? null,
            rir: row.rir ?? null,
          });
        }
      }

      let total_weight_kg: number | null = null;
      for (const row of setsRows ?? []) {
        const w = row.weight != null ? Number(row.weight) : 0;
        const r = row.reps ?? 0;
        total_weight_kg = (total_weight_kg ?? 0) + w * r;
      }
      if (total_weight_kg != null) total_weight_kg = Math.round(total_weight_kg);

      const sessionDetail: WorkoutSessionDetail = {
        id: session.id,
        title: (session as any).workout_templates?.title ?? 'Workout',
        performed_at: session.performed_at,
        duration_minutes: session.duration_minutes ?? null,
        calories_burned: session.calories_burned ?? null,
        total_weight_kg,
        distance_km: null,
        session_type: session.session_type ?? 'general',
        exercises: exerciseList.map((e) => ({
          id: e.id,
          exercise_id: e.exercise_id ?? '',
          exercise_name: e.exercise_name,
          order_index: e.order_index,
          sets: setsByExercise[e.id] ?? [],
        })),
      };

      return sessionDetail;
    },
    enabled: !!sessionId,
  });
}
