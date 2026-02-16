import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ExerciseDetail {
    id: string;
    name: string;
    primary_body_part: string | null;
    equipment: string | null;
    exercise_type: string | null;
    difficulty_level: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    exercise_muscles: Array<{
        muscle: string;
        role: 'primary' | 'secondary' | 'stabilizer';
    }>;
}

/**
 * Fetches a single exercise by id with muscle mappings.
 * Disabled when exerciseId is null/empty.
 */
export function useExerciseDetail(exerciseId: string | null) {
    return useQuery<ExerciseDetail | null>({
        queryKey: ['exercise', exerciseId],
        queryFn: async () => {
            if (!exerciseId) return null;
            const { data, error } = await supabase
                .from('exercises')
                .select('id, name, primary_body_part, equipment, exercise_type, difficulty_level, thumbnail_url, video_url, exercise_muscles(muscle, role)')
                .eq('id', exerciseId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data as ExerciseDetail | null;
        },
        enabled: !!exerciseId,
        staleTime: 5 * 60 * 1000,
    });
}
