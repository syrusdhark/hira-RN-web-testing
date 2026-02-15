// apps/mobile/src/types/food-library.types.ts

export type FoodLibraryItemType = 'food' | 'meal';

export interface FoodLibraryItem {
    item_id: string;
    item_type: FoodLibraryItemType;
    name: string;
    description: string | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number | null;
    is_user_meal: boolean;
    meal_item_count: number;
    relevance_rank: number;
}

export interface MealAlias {
    id: string;
    meal_id: string;
    alias: string;
    created_at: string;
    relevance_score: number;
}

export interface SaveMealAsTemplateParams {
    mealId: string;
    aliases?: string[];
}

export interface CreateMealAliasParams {
    meal_id: string;
    alias: string;
    relevance_score?: number;
}
