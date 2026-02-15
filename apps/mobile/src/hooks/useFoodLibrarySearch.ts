// apps/mobile/src/hooks/useFoodLibrarySearch.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
    FoodLibraryItem,
    SaveMealAsTemplateParams,
    CreateMealAliasParams,
} from '../types/food-library.types';

export const FOOD_LIBRARY_QUERY_KEY = 'food-library';

/**
 * Search both foods and user's saved meals
 */
export function useFoodLibrarySearch(searchTerm: string, limit = 20) {
    return useQuery({
        queryKey: [FOOD_LIBRARY_QUERY_KEY, searchTerm, limit],
        queryFn: async () => {
            if (!searchTerm.trim()) {
                return [];
            }

            const { data, error } = await supabase.rpc('search_food_library', {
                p_search_term: searchTerm,
                p_limit: limit,
            });

            if (error) {
                console.error('Food library search error:', error);
                throw error;
            }

            return (data || []) as FoodLibraryItem[];
        },
        enabled: searchTerm.length >= 2, // Only search with 2+ characters
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Save a meal as a template so it appears in food library searches
 */
export function useSaveMealAsTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ mealId, aliases = [] }: SaveMealAsTemplateParams) => {
            // Mark meal as template
            const { error: updateError } = await supabase
                .from('meals')
                .update({ is_template: true })
                .eq('id', mealId);

            if (updateError) throw updateError;

            // Add aliases if provided
            if (aliases.length > 0) {
                const aliasRecords = aliases.map((alias) => ({
                    meal_id: mealId,
                    alias: alias.trim().toLowerCase(),
                }));

                const { error: aliasError } = await supabase
                    .from('meal_aliases')
                    .insert(aliasRecords);

                if (aliasError) throw aliasError;
            }

            return { mealId, aliases };
        },
        onSuccess: () => {
            // Invalidate food library searches
            queryClient.invalidateQueries({ queryKey: [FOOD_LIBRARY_QUERY_KEY] });
        },
    });
}

/**
 * Add an alias to an existing meal
 */
export function useCreateMealAlias() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            meal_id,
            alias,
            relevance_score = 0,
        }: CreateMealAliasParams) => {
            const { data, error } = await supabase
                .from('meal_aliases')
                .insert({
                    meal_id,
                    alias: alias.trim().toLowerCase(),
                    relevance_score,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FOOD_LIBRARY_QUERY_KEY] });
        },
    });
}

/**
 * Delete a meal alias
 */
export function useDeleteMealAlias() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (aliasId: string) => {
            const { error } = await supabase
                .from('meal_aliases')
                .delete()
                .eq('id', aliasId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FOOD_LIBRARY_QUERY_KEY] });
        },
    });
}

/**
 * Get all aliases for a specific meal
 */
export function useMealAliases(mealId: string) {
    return useQuery({
        queryKey: ['meal-aliases', mealId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('meal_aliases')
                .select('*')
                .eq('meal_id', mealId)
                .order('relevance_score', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!mealId,
    });
}
