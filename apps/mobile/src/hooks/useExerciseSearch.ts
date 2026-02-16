import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useMemo } from 'react';

export const EXERCISES_KEY = ['exercises'];

interface Exercise {
    id: string;
    name: string;
    category: string | null;
    exercise_type: string | null;
    difficulty_level: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    equipment: string | null;
    is_custom: boolean;
    is_public: boolean;
    exercise_muscles: Array<{
        muscle: string;
        role: 'primary' | 'secondary' | 'stabilizer';
    }>;
}

/**
 * Hook to fetch and cache all exercises
 * Loads once on app start and caches for 30 minutes
 */
export function useExercises() {
    return useQuery<Exercise[]>({
        queryKey: EXERCISES_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('*, exercise_muscles(muscle, role)')
                .is('deleted_at', null)
                .order('name');

            if (error) {
                throw error;
            }

            return data || [];
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Hook to search exercises with client-side filtering
 * Performs instant in-memory search on cached exercises
 * 
 * @param searchTerm - The search query string
 * @returns Filtered exercises matching the search term
 */
export function useExerciseSearch(searchTerm: string) {
    const { data: allExercises, isLoading, error } = useExercises();

    // Filter in memory for instant results
    const filtered = useMemo(() => {
        if (!searchTerm || !allExercises) return allExercises || [];

        const term = searchTerm.toLowerCase().trim();

        return allExercises.filter(exercise => {
            // Match against exercise name
            if (exercise.name.toLowerCase().includes(term)) {
                return true;
            }

            // Match against category (legacy) and exercise_type
            if (exercise.category?.toLowerCase().includes(term)) {
                return true;
            }
            if (exercise.exercise_type?.toLowerCase().includes(term)) {
                return true;
            }

            // Match against muscle groups
            const muscles = exercise.exercise_muscles?.map(m => m.muscle.toLowerCase()) || [];
            if (muscles.some(muscle => muscle.includes(term))) {
                return true;
            }

            return false;
        });
    }, [allExercises, searchTerm]);

    return {
        exercises: filtered,
        isLoading,
        error,
    };
}

/**
 * Hook to use server-side full-text search (for advanced use cases)
 * Falls back to PostgreSQL FTS when needed
 * 
 * @param searchTerm - The search query string
 * @param enabled - Whether to run the query (default: true when searchTerm exists)
 */
export function useExerciseServerSearch(searchTerm: string, enabled = true) {
    return useQuery({
        queryKey: ['exerciseSearch', searchTerm],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('search_exercises', {
                search_term: searchTerm,
            });

            if (error) {
                throw error;
            }

            return data || [];
        },
        enabled: enabled && !!searchTerm && searchTerm.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
