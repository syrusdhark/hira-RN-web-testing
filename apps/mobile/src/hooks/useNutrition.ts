import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { USER_XP_KEY } from './useUserXp';
import { USER_STREAKS_KEY } from './useUserStreaks';
import { USER_ACHIEVEMENTS_KEY } from './useUserAchievements';

// ============================================
// TYPES (matching authoritative schema)
// ============================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type LoggedVia = 'manual' | 'ai' | 'voice' | 'import';

export interface Food {
    id: string;
    name: string;
    description: string | null;
    calories_per_100g: number;
    protein_g_per_100g: number;
    carbs_g_per_100g: number;
    fat_g_per_100g: number;
    fiber_g_per_100g: number;
    brand: string | null;
    category: string | null;
}

export interface MealItem {
    id: string;
    meal_id: string;
    food_id: string | null;
    quantity_g: number;
    // Snapshot macros (frozen at insert time)
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    custom_food_name: string | null;
    created_at: string;
    // Joined food data
    food?: Food;
}

export interface Meal {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    meal_type: MealType;
    consumed_at: string;
    logged_via: LoggedVia;

    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    // Joined meal items
    meal_items?: MealItem[];
}

export interface NutritionDailySummary {
    user_id: string;
    date: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    updated_at: string;
    last_calculated_at: string;
    calculation_source: string;
}

export interface NutritionGoals {
    id: string;
    user_id: string;
    target_calories: number;
    target_protein_g: number | null;
    target_carbs_g: number | null;
    target_fat_g: number | null;
    target_fiber_g: number | null;
}

export interface LogMealInput {
    name: string;
    mealType: MealType;
    consumedAt?: Date;
    description?: string;
    loggedVia?: LoggedVia;

    items: {
        foodId: string;
        quantityG: number;
    }[];
}

// ============================================
// QUERY KEYS
// ============================================

export const MEALS_KEY = ['meals'];
export const DAILY_SUMMARY_KEY = ['nutritionDailySummary'];
export const NUTRITION_GOALS_KEY = ['nutritionGoals'];
export const FOODS_KEY = ['foods'];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch meals for a specific date
 */
export function useMeals(date?: string) {
    const targetDate = date || getTodayDate();

    return useQuery({
        queryKey: [...MEALS_KEY, targetDate],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get start and end of day
            const startOfDay = `${targetDate}T00:00:00Z`;
            const endOfDay = `${targetDate}T23:59:59Z`;

            const { data, error } = await supabase
                .from('meals')
                .select(`
                    *,
                    meal_items (
                        *,
                        food:foods (*)
                    )
                `)
                .eq('user_id', user.id)
                .eq('is_deleted', false)
                .gte('consumed_at', startOfDay)
                .lte('consumed_at', endOfDay)
                .order('consumed_at', { ascending: true });

            if (error) {
                console.error('Error fetching meals:', error);
                throw error;
            }

            return (data || []) as Meal[];
        },
    });
}

/**
 * Get meals organized by meal type
 */
export function useMealsByType(date?: string) {
    const { data: meals, ...rest } = useMeals(date);

    const mealsByType: Record<MealType, Meal[]> = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
    };

    if (meals) {
        for (const meal of meals) {
            mealsByType[meal.meal_type].push(meal);
        }
    }

    // Calculate totals from meal items
    const totalCalories = meals?.reduce((sum, meal) => {
        const mealTotal = meal.meal_items?.reduce((itemSum, item) => itemSum + Number(item.calories), 0) || 0;
        return sum + mealTotal;
    }, 0) ?? 0;

    const getMealCalories = (mealType: MealType) => {
        return mealsByType[mealType].reduce((sum, meal) => {
            const mealTotal = meal.meal_items?.reduce((itemSum, item) => itemSum + Number(item.calories), 0) || 0;
            return sum + mealTotal;
        }, 0);
    };

    return {
        ...rest,
        meals,
        mealsByType,
        totalCalories,
        getMealCalories,
        totalMeals: meals?.length ?? 0,
    };
}

/**
 * Fetch daily nutrition summary
 */
export function useDailySummary(date?: string) {
    const targetDate = date || getTodayDate();

    return useQuery({
        queryKey: [...DAILY_SUMMARY_KEY, targetDate],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('nutrition_daily_summary')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', targetDate)
                .maybeSingle();

            if (error) {
                console.error('Error fetching daily summary:', error);
                throw error;
            }

            // Return default if no summary exists yet
            if (!data) {
                return {
                    user_id: user.id,
                    date: targetDate,
                    calories: 0,
                    protein_g: 0,
                    carbs_g: 0,
                    fat_g: 0,
                    fiber_g: 0,
                    updated_at: new Date().toISOString(),
                    last_calculated_at: new Date().toISOString(),
                    calculation_source: 'manual',
                } as NutritionDailySummary;
            }

            return data as NutritionDailySummary;
        },
    });
}

/**
 * Fetch nutrition goals
 */
export function useNutritionGoals() {
    return useQuery({
        queryKey: NUTRITION_GOALS_KEY,
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('nutrition_goals')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching nutrition goals:', error);
                throw error;
            }

            // Return default goals if none exist
            if (!data) {
                return {
                    id: '',
                    user_id: user.id,
                    target_calories: 2000,
                    target_protein_g: 150,
                    target_carbs_g: 250,
                    target_fat_g: 65,
                    target_fiber_g: 30,
                } as NutritionGoals;
            }

            return data as NutritionGoals;
        },
    });
}

/**
 * Search foods
 */
export function useFoodSearch(query: string) {
    return useQuery({
        queryKey: [...FOODS_KEY, 'search', query],
        queryFn: async () => {
            if (!query || query.trim().length < 2) return [];

            const { data, error } = await supabase
                .from('foods')
                .select('*')
                .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
                .limit(20);

            if (error) {
                console.error('Error searching foods:', error);
                throw error;
            }

            return (data || []) as Food[];
        },
        enabled: query.trim().length >= 2,
    });
}

/**
 * Log a meal using the RPC function
 * This ensures atomic insertion with proper macro calculation
 */
export function useLogMeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: LogMealInput) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const consumedAt = input.consumedAt || new Date();
            const date = consumedAt.toISOString().slice(0, 10);

            // Call the RPC function to log meal atomically
            const { data: mealId, error } = await supabase.rpc('log_meal_atomic', {
                p_user_id: user.id,
                p_name: input.name,
                p_meal_type: input.mealType,
                p_consumed_at: consumedAt.toISOString(),
                p_items: input.items.map(item => ({
                    food_id: item.foodId,
                    quantity_g: item.quantityG,
                })),
                p_description: input.description || null,
                p_logged_via: input.loggedVia || 'manual',

            });

            if (error) {
                console.error('Error logging meal:', error);
                throw error;
            }

            return { mealId, date };
        },

        onSuccess: (data) => {
            // Invalidate meals and summary for that date
            queryClient.invalidateQueries({ queryKey: [...MEALS_KEY, data.date] });
            queryClient.invalidateQueries({ queryKey: [...DAILY_SUMMARY_KEY, data.date] });
            // Sync XP/streaks/achievements after meal log (triggers award XP)
            queryClient.invalidateQueries({ queryKey: USER_XP_KEY });
            queryClient.invalidateQueries({ queryKey: USER_STREAKS_KEY });
            queryClient.invalidateQueries({ queryKey: USER_ACHIEVEMENTS_KEY });
        },
    });
}

/**
 * Delete a meal (soft delete)
 */
export function useDeleteMeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ mealId, date }: { mealId: string; date?: string }) => {
            const { error } = await supabase
                .from('meals')
                .update({ is_deleted: true })
                .eq('id', mealId);

            if (error) {
                console.error('Error deleting meal:', error);
                throw error;
            }

            return { mealId, date: date || getTodayDate() };
        },

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [...MEALS_KEY, data.date] });
            queryClient.invalidateQueries({ queryKey: [...DAILY_SUMMARY_KEY, data.date] });
        },
    });
}

/**
 * Update nutrition goals
 */
export function useUpdateNutritionGoals() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (goals: Partial<Omit<NutritionGoals, 'id' | 'user_id'>>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('nutrition_goals')
                .upsert({
                    user_id: user.id,
                    ...goals,
                }, {
                    onConflict: 'user_id',
                })
                .select()
                .single();

            if (error) {
                console.error('Error updating nutrition goals:', error);
                throw error;
            }

            return data as NutritionGoals;
        },

        onSuccess: (data) => {
            queryClient.setQueryData(NUTRITION_GOALS_KEY, data);
        },
    });
}

/**
 * Create a custom food
 */
export function useCreateFood() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (food: Omit<Food, 'id' | 'created_by'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('foods')
                .insert({
                    ...food,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating food:', error);
                throw error;
            }

            return data as Food;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FOODS_KEY });
        },
    });
}
