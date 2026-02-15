import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { MuscleMappingRow } from '../services/MuscleIntensityCalculator';

export const EXERCISE_MUSCLE_MAPPINGS_KEY = ['exerciseMuscleMappings'];

export function useExerciseMuscleMappings() {
  return useQuery({
    queryKey: EXERCISE_MUSCLE_MAPPINGS_KEY,
    queryFn: async (): Promise<MuscleMappingRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('exercise_muscle_mapping')
        .select('exercise_name, muscle_group, coefficient');

      if (error) {
        return [];
      }

      return (data ?? []).map((row) => ({
        exercise_name: String(row.exercise_name ?? ''),
        muscle_group: String(row.muscle_group ?? ''),
        coefficient: Number(row.coefficient ?? 0),
      }));
    },
  });
}
