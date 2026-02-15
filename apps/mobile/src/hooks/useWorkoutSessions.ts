import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type SessionType = 'strength' | 'cardio' | 'yoga' | 'hiit' | 'general';

export type WorkoutSessionSummary = {
  id: string;
  performed_at: string;
  title: string;
  session_type: SessionType;
  duration_minutes: number | null;
  calories_burned: number | null;
  total_weight_kg: number | null;
  distance_km: number | null;
};

export const WORKOUT_SESSIONS_KEY = ['workoutSessions'];

function normalizeSessionType(raw: string | null): SessionType {
  if (raw === 'strength' || raw === 'cardio' || raw === 'yoga' || raw === 'hiit' || raw === 'general') return raw;
  return 'general';
}

export function useWorkoutSessions() {
  return useQuery({
    queryKey: WORKOUT_SESSIONS_KEY,
    queryFn: async (): Promise<WorkoutSessionSummary[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, performed_at, duration_minutes, calories_burned, session_type, workout_template_id, workout_templates(title)')
        .eq('user_id', user.id)
        .order('performed_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching workout sessions:', sessionsError);
        throw sessionsError;
      }

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map((s) => s.id);

      const { data: exercises, error: exError } = await supabase
        .from('workout_session_exercises')
        .select('id, workout_session_id')
        .in('workout_session_id', sessionIds);

      const totalBySession: Record<string, number> = {};
      if (!exError && exercises?.length) {
        const exerciseIds = exercises.map((e) => e.id);
        const exerciseToSession: Record<string, string> = {};
        exercises.forEach((e) => { exerciseToSession[e.id] = e.workout_session_id; });

        const { data: setsData, error: setsError } = await supabase
          .from('workout_session_sets')
          .select('weight, reps, workout_session_exercise_id')
          .in('workout_session_exercise_id', exerciseIds);

        if (!setsError && setsData) {
          for (const row of setsData) {
            const sessionId = exerciseToSession[row.workout_session_exercise_id];
            if (!sessionId) continue;
            const w = Number(row.weight) || 0;
            const r = Number(row.reps) || 0;
            totalBySession[sessionId] = (totalBySession[sessionId] || 0) + w * r;
          }
        }
      }

      return sessions.map((s: any) => ({
        id: s.id,
        performed_at: s.performed_at,
        title: s.workout_templates?.title ?? 'Workout',
        session_type: normalizeSessionType(s.session_type),
        duration_minutes: s.duration_minutes ?? null,
        calories_burned: s.calories_burned ?? null,
        total_weight_kg: totalBySession[s.id] != null ? Math.round(totalBySession[s.id]) : null,
        distance_km: null,
      }));
    },
  });
}
