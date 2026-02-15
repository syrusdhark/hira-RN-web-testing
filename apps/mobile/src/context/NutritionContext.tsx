import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import {
  useMealsByType,
  useDailySummary,
  useNutritionGoals,
  useLogMeal,
  useDeleteMeal,
  useUpdateNutritionGoals,
  useCreateFood,
  type MealType,
  type Meal,
  type MealItem,
} from '../hooks/useNutrition';

export type { MealType } from '../hooks/useNutrition';

// UI-friendly food entry (simplified from Meal + MealItems)
export interface FoodEntry {
  id: string;
  name: string;
  portion?: string;
  calories: number;

}

interface NutritionContextType {
  // Data
  calories: number;
  targetCalories: number;
  meals: Record<MealType, FoodEntry[]>;

  // Loading states
  isLoading: boolean;
  isGoalsLoading: boolean;

  // Actions
  updateTarget: (target: number) => void;
  addFoodToMeal: (mealType: MealType, food: Omit<FoodEntry, 'id'>) => Promise<void>;
  removeFoodFromMeal: (mealType: MealType, foodId: string) => Promise<void>;

  // Helpers
  getMealCalories: (mealType: MealType) => number;
  refetch: () => void;
  totalMeals: number;
  setSelectedDateOverride: (date: string | null) => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

/**
 * Transform Meal (with MealItems) to FoodEntry for UI
 */
function mealToFoodEntries(meal: Meal): FoodEntry[] {
  if (!meal.meal_items || meal.meal_items.length === 0) {
    // If no items, show the meal itself as a single entry
    return [{
      id: meal.id,
      name: meal.name,
      portion: meal.description || undefined,
      calories: 0, // Will be calculated from items

    }];
  }

  // Return each meal item as a food entry
  return meal.meal_items.map((item: MealItem) => ({
    id: item.id,
    name: item.food?.name || item.custom_food_name || 'Unknown Food',
    portion: `${item.quantity_g}g`,
    calories: Number(item.calories),

  }));
}

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [selectedDateOverride, setSelectedDateOverride] = useState<string | null>(null);
  const effectiveDate = selectedDateOverride ?? undefined;

  const {
    mealsByType,
    totalCalories,
    getMealCalories,
    totalMeals,
    isLoading,
    refetch,
  } = useMealsByType(effectiveDate);

  const {
    data: summaryData,
  } = useDailySummary(effectiveDate);

  const {
    data: goalsData,
    isLoading: isGoalsLoading,
  } = useNutritionGoals();

  // Mutations
  const logMealMutation = useLogMeal();
  const deleteMealMutation = useDeleteMeal();
  const updateGoalsMutation = useUpdateNutritionGoals();
  const createFoodMutation = useCreateFood();

  // Transform Meal[] to FoodEntry[] for each meal type
  const meals = useMemo(() => {
    const result: Record<MealType, FoodEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    for (const mealType of Object.keys(mealsByType) as MealType[]) {
      const mealsOfType = mealsByType[mealType];
      for (const meal of mealsOfType) {
        result[mealType].push(...mealToFoodEntries(meal));
      }
    }

    return result;
  }, [mealsByType]);

  // Use summary data if available, otherwise use calculated total
  const calories = summaryData?.calories ? Number(summaryData.calories) : totalCalories;
  const targetCalories = goalsData?.target_calories ?? 2000;

  /**
   * Add a food entry to a meal
   * NOTE: This is a simplified API for backward compatibility
   * In reality, we need food_id and quantity to properly log meals
   * For now, we'll create a custom food entry
   */
  const addFoodToMeal = async (mealType: MealType, food: Omit<FoodEntry, 'id'>) => {
    try {
      // Create a custom food entry first
      // We simulate the portion by setting 100g = usage calories
      // This allows us to use the existing authoritative schema logic
      const newFood = await createFoodMutation.mutateAsync({
        name: food.name,
        description: food.portion || 'Quick Add',
        calories_per_100g: food.calories,
        protein_g_per_100g: 0,
        carbs_g_per_100g: 0,
        fat_g_per_100g: 0,
        fiber_g_per_100g: 0,
        brand: null,
        category: 'Quick Add',
      });

      // Log the meal with the newly created food
      await logMealMutation.mutateAsync({
        name: food.name,
        mealType,
        items: [{
          foodId: newFood.id,
          quantityG: 100, // Ensures total calories matches input
        }],
        description: food.portion,
      });
    } catch (error) {
      console.error('Failed to add food:', error);
      throw error;
    }
  };

  /**
   * Remove a food entry from a meal
   * NOTE: Since we're showing meal_items as food entries,
   * we need to delete the entire meal if it only has one item,
   * or remove the specific meal_item if it has multiple
   */
  const removeFoodFromMeal = async (mealType: MealType, foodId: string) => {
    try {
      // Find the meal that contains this food entry
      const mealsOfType = mealsByType[mealType];
      const meal = mealsOfType.find(m =>
        m.id === foodId || m.meal_items?.some(item => item.id === foodId)
      );

      if (!meal) {
        throw new Error('Meal not found');
      }

      // For now, delete the entire meal
      // TODO: Implement proper meal_item deletion if meal has multiple items
      await deleteMealMutation.mutateAsync({
        mealId: meal.id,
      });
    } catch (error) {
      console.error('Failed to remove food:', error);
      throw error;
    }
  };

  /**
   * Update target calories
   */
  const updateTarget = (target: number) => {
    updateGoalsMutation.mutate({ target_calories: target });
  };

  const value = useMemo(
    () => ({
      calories,
      targetCalories,
      meals,
      isLoading,
      isGoalsLoading,
      updateTarget,
      addFoodToMeal,
      removeFoodFromMeal,
      getMealCalories,
      refetch,
      totalMeals: Object.values(meals).filter((m) => m.length > 0).length,
      setSelectedDateOverride,
    }),
    [
      calories,
      targetCalories,
      meals,
      isLoading,
      isGoalsLoading,
      getMealCalories,
      refetch,
      totalMeals,
    ]
  );

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
}
