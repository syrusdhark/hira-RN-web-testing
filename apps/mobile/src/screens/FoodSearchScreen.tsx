// apps/mobile/src/screens/FoodSearchScreen.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    StatusBar,
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, typography } from '../theme';
import { useFoodLibrarySearch } from '../hooks/useFoodLibrarySearch';
import { useFoodSearch, useLogMeal } from '../hooks/useNutrition';
import { MealType } from '../context/NutritionContext';
import type { FoodLibraryItem } from '../types/food-library.types';

// Mock data for categories/chips
const CATEGORIES = [
    { id: 'all', label: 'All Items' },
    { id: 'favorites', label: 'My Meals' },
    { id: 'protein', label: 'High Protein' },
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'snacks', label: 'Snacks' },
];

// Fallback image for foods
const DEFAULT_FOOD_IMAGE =
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=200&auto=format&fit=crop';

type FoodSearchScreenProps = {
    onClose: () => void;
    onAddFood: (food: any) => void;
    onSelectFoodLibraryItem?: (item: FoodLibraryItem) => void;
    mealType: MealType;
};

export function FoodSearchScreen({
    onClose,
    onAddFood,
    onSelectFoodLibraryItem,
    mealType,
}: FoodSearchScreenProps) {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    // Simple debounce implementation
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Use the unified food library search (foods + saved meals)
    const {
        data: libraryResults = [],
        isLoading: isLibraryLoading,
    } = useFoodLibrarySearch(debouncedQuery);

    // Fallback to regular food search if library search returns nothing
    const { data: foodResults = [], isLoading: isFoodLoading } =
        useFoodSearch(debouncedQuery);

    const logMealMutation = useLogMeal();

    const paddingTop = Math.max(insets.top, 20);

    // Combine results - prioritize library results
    const searchResults =
        libraryResults.length > 0 ? libraryResults : mapFoodsToLibraryItems(foodResults);
    const isLoading = isLibraryLoading || isFoodLoading;

    const handleSelectItem = async (item: FoodLibraryItem) => {
        if (item.item_type === 'meal') {
            // User selected a saved meal
            if (onSelectFoodLibraryItem) {
                onSelectFoodLibraryItem(item);
            } else {
                // Fallback: log the meal directly
                onAddFood(item);
            }
        } else {
            // User selected individual food
            try {
                await logMealMutation.mutateAsync({
                    name: item.name,
                    mealType,
                    items: [
                        {
                            foodId: item.item_id,
                            quantityG: 100, // Default 100g
                        },
                    ],
                    description: '100g',
                });
                onAddFood(item);
            } catch (error) {
                console.error('Failed to log food:', error);
            }
        }
    };

    const renderItem = ({ item }: { item: FoodLibraryItem }) => {
        const isMeal = item.item_type === 'meal';

        return (
            <Pressable style={styles.card} onPress={() => handleSelectItem(item)}>
                <View style={styles.cardContent}>
                    <Image
                        source={{ uri: DEFAULT_FOOD_IMAGE }}
                        style={styles.foodImage}
                    />
                    <View style={styles.foodInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.foodName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {isMeal && (
                                <View style={styles.myMealBadge}>
                                    <Text style={styles.myMealBadgeText}>My Meal</Text>
                                </View>
                            )}
                        </View>

                        {item.description && (
                            <Text style={styles.foodDescription} numberOfLines={1}>
                                {item.description}
                            </Text>
                        )}

                        {isMeal && item.meal_item_count > 0 && (
                            <Text style={styles.ingredientCount}>
                                {item.meal_item_count} ingredient
                                {item.meal_item_count !== 1 ? 's' : ''}
                            </Text>
                        )}

                        <View style={styles.macroRow}>
                            <MacroChip label="Cal" value={Math.round(item.calories)} />
                            <MacroChip
                                label="P"
                                value={Math.round(item.protein_g)}
                                unit="g"
                            />
                            <MacroChip label="C" value={Math.round(item.carbs_g)} unit="g" />
                            <MacroChip label="F" value={Math.round(item.fat_g)} unit="g" />
                        </View>
                    </View>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => handleSelectItem(item)}
                    >
                        <MaterialCommunityIcons
                            name="plus"
                            size={20}
                            color={colors.textInverse}
                        />
                    </Pressable>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { paddingTop }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={onClose} style={styles.backButton}>
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={24}
                        color={colors.textPrimary}
                    />
                </Pressable>
                <Text style={styles.headerTitle}>Food Library</Text>
                <Pressable style={styles.filterButton}>
                    <MaterialCommunityIcons
                        name="filter-variant"
                        size={24}
                        color={colors.textPrimary}
                    />
                </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color={colors.textTertiary}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search foods or saved meals..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons
                            name="close-circle"
                            size={18}
                            color={colors.textTertiary}
                        />
                    </Pressable>
                )}
            </View>

            {/* Filter Chips */}
            <View style={styles.chipsContainer}>
                <FlatList
                    horizontal
                    data={CATEGORIES}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.chipsContent}
                    renderItem={({ item }) => (
                        <Pressable
                            style={[
                                styles.chip,
                                activeCategory === item.id && styles.chipActive,
                            ]}
                            onPress={() => setActiveCategory(item.id)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    activeCategory === item.id && styles.chipTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </Pressable>
                    )}
                />
            </View>

            {/* Results */}
            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>
                        {debouncedQuery.length < 2 ? 'Popular' : 'Results'}
                    </Text>
                    {debouncedQuery.length < 2 && (
                        <Text style={styles.viewAll}>View All</Text>
                    )}
                </View>

                {isLoading && debouncedQuery.length >= 2 && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.healthGreen} />
                    </View>
                )}

                {!isLoading && debouncedQuery.length >= 2 && searchResults.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No results found for "{debouncedQuery}"
                        </Text>
                        <Text style={styles.emptyHint}>Try a different search term</Text>
                    </View>
                )}

                {debouncedQuery.length < 2 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Start typing to search</Text>
                        <Text style={styles.emptyHint}>
                            Search for foods or your saved meals
                        </Text>
                    </View>
                )}

                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => `${item.item_type}-${item.item_id}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

// Helper to map regular foods to FoodLibraryItem format
function mapFoodsToLibraryItems(foods: any[]): FoodLibraryItem[] {
    return foods.map((food) => ({
        item_id: food.id,
        item_type: 'food' as const,
        name: food.name,
        description: food.description || food.brand || null,
        calories: food.calories_per_100g || 0,
        protein_g: food.protein_g_per_100g || 0,
        carbs_g: food.carbs_g_per_100g || 0,
        fat_g: food.fat_g_per_100g || 0,
        fiber_g: food.fiber_g_per_100g || null,
        is_user_meal: false,
        meal_item_count: 0,
        relevance_rank: 1,
    }));
}

// Macro chip component
function MacroChip({
    label,
    value,
    unit = '',
}: {
    label: string;
    value: number;
    unit?: string;
}) {
    return (
        <View style={styles.macroChip}>
            <Text style={styles.macroLabel}>{label}:</Text>
            <Text style={styles.macroValue}>
                {value}
                {unit}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.md,
        paddingBottom: space.md,
    },
    backButton: {
        padding: space.xs,
        borderRadius: radius.full,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    filterButton: {
        padding: space.xs,
        borderRadius: radius.full,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        marginHorizontal: space.md,
        paddingHorizontal: space.md,
        height: 48,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    searchIcon: {
        marginRight: space.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        height: '100%',
    },
    chipsContainer: {
        marginTop: space.lg,
        height: 40,
    },
    chipsContent: {
        paddingHorizontal: space.md,
        gap: space.sm,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radius.full,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        justifyContent: 'center',
    },
    chipActive: {
        backgroundColor: colors.healthGreen,
        borderColor: colors.healthGreen,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: colors.bgMidnight,
    },
    listContainer: {
        flex: 1,
        marginTop: space.lg,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: space.md,
        marginBottom: space.md,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    viewAll: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.healthGreen,
    },
    listContent: {
        paddingHorizontal: space.md,
        paddingBottom: space.xl,
        gap: space.md,
    },
    card: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: space.sm,
        gap: space.md,
    },
    foodImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.bgElevated,
    },
    foodInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        marginBottom: 2,
    },
    foodName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
    },
    myMealBadge: {
        backgroundColor: `${colors.brandBlue}30`,
        paddingHorizontal: space.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    myMealBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.brandBlue,
    },
    foodDescription: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: 2,
    },
    ingredientCount: {
        fontSize: 11,
        color: colors.textTertiary,
        marginBottom: 4,
    },
    macroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
    },
    macroChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    macroLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textTertiary,
    },
    macroValue: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.healthGreen,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.healthGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        padding: space.xl,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: space.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    emptyHint: {
        color: colors.textTertiary,
        fontSize: 12,
        marginTop: 4,
    },
});
