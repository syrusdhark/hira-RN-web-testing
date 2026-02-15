// apps/mobile/src/screens/AddMealScreen.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import {
    useFoodSearch,
    useLogMeal,
    type MealType,
    type Food,
} from '../hooks/useNutrition';
import { useFoodLibrarySearch } from '../hooks/useFoodLibrarySearch';
import { SaveMealTemplateModal } from '../components/SaveMealTemplateModal';
import { FoodSearchScreen } from './FoodSearchScreen';
import { getSuggestedAliases } from '../services/generateMealAliases';
import type { FoodLibraryItem } from '../types/food-library.types';
import { supabase } from '../lib/supabase';

interface AddMealScreenProps {
    mealType: MealType;
    onClose: () => void;
    onSuccess?: () => void;
}

interface SelectedFood {
    food: Food;
    quantityG: number;
}

export function AddMealScreen({
    mealType,
    onClose,
    onSuccess,
}: AddMealScreenProps) {
    const [mealName, setMealName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showFoodLibrary, setShowFoodLibrary] = useState(false);

    // Save to library modal state
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [lastLoggedMealId, setLastLoggedMealId] = useState<string | null>(null);
    const [lastLoggedMealName, setLastLoggedMealName] = useState<string>('');
    const [suggestedAliases, setSuggestedAliases] = useState<string[]>([]);

    const { data: searchResults, isLoading: isSearchLoading } =
        useFoodSearch(searchQuery);
    const logMealMutation = useLogMeal();

    const handleAddFood = (food: Food) => {
        // Check if already added
        const existing = selectedFoods.find((sf) => sf.food.id === food.id);
        if (existing) {
            Alert.alert('Already Added', 'This food is already in your meal');
            return;
        }

        // Add with default 100g quantity
        setSelectedFoods([...selectedFoods, { food, quantityG: 100 }]);
        setSearchQuery('');
        setIsSearching(false);
    };

    const handleSelectLibraryItem = async (item: FoodLibraryItem) => {
        if (item.item_type === 'meal') {
            // User selected a saved meal - fetch its items and add them
            try {
                const { data: mealItems, error } = await supabase
                    .from('meal_items')
                    .select(
                        `
            *,
            food:foods (*)
          `
                    )
                    .eq('meal_id', item.item_id);

                if (error) throw error;

                if (mealItems && mealItems.length > 0) {
                    const newFoods: SelectedFood[] = mealItems
                        .filter((mi: any) => mi.food)
                        .map((mi: any) => ({
                            food: mi.food as Food,
                            quantityG: mi.quantity_g,
                        }));

                    setSelectedFoods((prev) => [...prev, ...newFoods]);
                    setMealName(item.name);
                }
            } catch (error) {
                console.error('Error loading saved meal:', error);
                Alert.alert('Error', 'Failed to load saved meal');
            }
        } else {
            // Regular food item - convert to Food type
            const food: Food = {
                id: item.item_id,
                name: item.name,
                description: item.description,
                calories_per_100g: item.calories,
                protein_g_per_100g: item.protein_g,
                carbs_g_per_100g: item.carbs_g,
                fat_g_per_100g: item.fat_g,
                fiber_g_per_100g: item.fiber_g ?? 0,
                brand: null,
                category: null,
            };
            handleAddFood(food);
        }

        setShowFoodLibrary(false);
    };

    const handleUpdateQuantity = (foodId: string, quantityG: number) => {
        setSelectedFoods(
            selectedFoods.map((sf) =>
                sf.food.id === foodId ? { ...sf, quantityG } : sf
            )
        );
    };

    const handleRemoveFood = (foodId: string) => {
        setSelectedFoods(selectedFoods.filter((sf) => sf.food.id !== foodId));
    };

    const calculateTotalCalories = () => {
        return selectedFoods.reduce((total, sf) => {
            return total + (sf.food.calories_per_100g * sf.quantityG) / 100;
        }, 0);
    };

    const handleLogMeal = async () => {
        if (!mealName.trim()) {
            Alert.alert('Missing Name', 'Please enter a name for this meal');
            return;
        }

        if (selectedFoods.length === 0) {
            Alert.alert('No Foods', 'Please add at least one food item');
            return;
        }

        try {
            const result = await logMealMutation.mutateAsync({
                name: mealName.trim(),
                mealType,
                items: selectedFoods.map((sf) => ({
                    foodId: sf.food.id,
                    quantityG: sf.quantityG,
                })),
            });

            // Store meal info for potential save to library
            setLastLoggedMealId(result.mealId);
            setLastLoggedMealName(mealName.trim());

            // Generate suggested aliases
            const ingredients = selectedFoods.map((sf) => ({ name: sf.food.name }));
            const aliases = getSuggestedAliases(mealName.trim(), ingredients);
            setSuggestedAliases(aliases);

            // Ask if they want to save to library (only if multiple items)
            if (selectedFoods.length > 1) {
                Alert.alert(
                    'Meal Logged! 🎉',
                    'Would you like to save this meal to your food library for quick logging next time?',
                    [
                        {
                            text: 'Not Now',
                            style: 'cancel',
                            onPress: () => {
                                onSuccess?.();
                                onClose();
                            },
                        },
                        {
                            text: 'Save to Library',
                            onPress: () => setShowSaveTemplate(true),
                        },
                    ]
                );
            } else {
                Alert.alert('Success', 'Meal logged successfully!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            onSuccess?.();
                            onClose();
                        },
                    },
                ]);
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to log meal');
        }
    };

    const handleSaveTemplateSuccess = () => {
        onSuccess?.();
        onClose();
    };

    const renderFoodSearchResult = ({ item }: { item: Food }) => (
        <Pressable
            style={styles.searchResultItem}
            onPress={() => handleAddFood(item)}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>{item.name}</Text>
                {item.brand && <Text style={styles.foodBrand}>{item.brand}</Text>}
                <Text style={styles.foodCalories}>
                    {item.calories_per_100g} kcal per 100g
                </Text>
            </View>
            <MaterialCommunityIcons
                name="plus-circle"
                size={24}
                color={colors.healthGreen}
            />
        </Pressable>
    );

    const renderSelectedFood = ({ item }: { item: SelectedFood }) => {
        const calories = (
            (item.food.calories_per_100g * item.quantityG) /
            100
        ).toFixed(0);

        return (
            <View style={styles.selectedFoodItem}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.selectedFoodName}>{item.food.name}</Text>
                    <Text style={styles.selectedFoodCalories}>{calories} kcal</Text>
                </View>
                <View style={styles.quantityInput}>
                    <TextInput
                        style={styles.quantityTextInput}
                        value={item.quantityG.toString()}
                        onChangeText={(text) => {
                            const num = parseInt(text) || 0;
                            handleUpdateQuantity(item.food.id, num);
                        }}
                        keyboardType="number-pad"
                    />
                    <Text style={styles.quantityUnit}>g</Text>
                </View>
                <Pressable
                    onPress={() => handleRemoveFood(item.food.id)}
                    style={styles.removeButton}
                >
                    <MaterialCommunityIcons
                        name="close-circle"
                        size={24}
                        color={colors.textTertiary}
                    />
                </Pressable>
            </View>
        );
    };

    // Full-screen Food Library modal
    if (showFoodLibrary) {
        return (
            <Modal visible={showFoodLibrary} animationType="slide">
                <FoodSearchScreen
                    onClose={() => setShowFoodLibrary(false)}
                    onAddFood={(item) => {
                        // Handle regular food from library
                        if (item && 'calories_per_100g' in item) {
                            handleAddFood(item as Food);
                        }
                    }}
                    onSelectFoodLibraryItem={handleSelectLibraryItem}
                    mealType={mealType}
                />
            </Modal>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={onClose} style={styles.closeButton}>
                    <MaterialCommunityIcons
                        name="close"
                        size={24}
                        color={colors.textPrimary}
                    />
                </Pressable>
                <Text style={styles.headerTitle}>
                    Log {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Meal Name */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Meal Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Chicken Salad"
                    placeholderTextColor={colors.textTertiary}
                    value={mealName}
                    onChangeText={setMealName}
                />
            </View>

            {/* Selected Foods */}
            {selectedFoods.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                        Foods ({selectedFoods.length})
                    </Text>
                    <FlatList
                        data={selectedFoods}
                        renderItem={renderSelectedFood}
                        keyExtractor={(item) => item.food.id}
                        style={styles.selectedFoodsList}
                    />
                    <View style={styles.totalCaloriesRow}>
                        <Text style={styles.totalCaloriesLabel}>Total:</Text>
                        <Text style={styles.totalCaloriesValue}>
                            {calculateTotalCalories().toFixed(0)} kcal
                        </Text>
                    </View>
                </View>
            )}

            {/* Food Search / Food Library Button */}
            <View style={[styles.section, { flex: 1 }]}>
                <Text style={styles.sectionLabel}>Add Foods</Text>

                {/* Food Library Button */}
                <Pressable
                    style={styles.libraryButton}
                    onPress={() => setShowFoodLibrary(true)}
                >
                    <MaterialCommunityIcons
                        name="book-open-page-variant"
                        size={20}
                        color={colors.healthGreen}
                    />
                    <Text style={styles.libraryButtonText}>
                        Browse Food Library & Saved Meals
                    </Text>
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.textTertiary}
                    />
                </Pressable>

                {/* Quick Search */}
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons
                        name="magnify"
                        size={20}
                        color={colors.textTertiary}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Quick search foods..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsSearching(true)}
                    />
                </View>

                {isSearching && (
                    <View style={styles.searchResults}>
                        {isSearchLoading ? (
                            <ActivityIndicator size="small" color={colors.healthGreen} />
                        ) : searchResults && searchResults.length > 0 ? (
                            <FlatList
                                data={searchResults}
                                renderItem={renderFoodSearchResult}
                                keyExtractor={(item) => item.id}
                            />
                        ) : searchQuery.length >= 2 ? (
                            <Text style={styles.noResults}>No foods found</Text>
                        ) : (
                            <Text style={styles.noResults}>Type to search foods</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Log Button */}
            <Pressable
                style={[
                    styles.logButton,
                    (!mealName.trim() ||
                        selectedFoods.length === 0 ||
                        logMealMutation.isPending) &&
                    styles.logButtonDisabled,
                ]}
                onPress={handleLogMeal}
                disabled={
                    !mealName.trim() ||
                    selectedFoods.length === 0 ||
                    logMealMutation.isPending
                }
            >
                {logMealMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                    <Text style={styles.logButtonText}>Log Meal</Text>
                )}
            </Pressable>

            {/* Save Meal Template Modal */}
            <SaveMealTemplateModal
                visible={showSaveTemplate}
                mealId={lastLoggedMealId || ''}
                mealName={lastLoggedMealName}
                onClose={() => {
                    setShowSaveTemplate(false);
                    onSuccess?.();
                    onClose();
                }}
                onSuccess={handleSaveTemplateSuccess}
            />
        </KeyboardAvoidingView>
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
        paddingVertical: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    section: {
        paddingHorizontal: space.md,
        paddingVertical: space.md,
    },
    sectionLabel: {
        ...typography.sm,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: space.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    libraryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.xl,
        paddingHorizontal: space.md,
        paddingVertical: space.md,
        borderWidth: 1,
        borderColor: colors.healthGreen + '40',
        marginBottom: space.md,
        gap: space.sm,
    },
    libraryButtonText: {
        flex: 1,
        ...typography.base,
        color: colors.textPrimary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        gap: space.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
    },
    searchResults: {
        marginTop: space.md,
        maxHeight: 200,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: space.md,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        marginBottom: space.sm,
        gap: space.md,
    },
    foodName: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    foodBrand: {
        ...typography.sm,
        color: colors.textTertiary,
    },
    foodCalories: {
        ...typography.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    selectedFoodsList: {
        maxHeight: 200,
    },
    selectedFoodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: space.md,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        marginBottom: space.sm,
        gap: space.md,
    },
    selectedFoodName: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    selectedFoodCalories: {
        ...typography.sm,
        color: colors.healthGreen,
    },
    quantityInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.sm,
        paddingHorizontal: space.sm,
        paddingVertical: 4,
        gap: 4,
    },
    quantityTextInput: {
        width: 50,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    quantityUnit: {
        fontSize: 12,
        color: colors.textTertiary,
    },
    removeButton: {
        padding: 4,
    },
    totalCaloriesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: space.md,
        paddingTop: space.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderSubtle,
    },
    totalCaloriesLabel: {
        ...typography.base,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    totalCaloriesValue: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.healthGreen,
    },
    noResults: {
        ...typography.sm,
        color: colors.textTertiary,
        textAlign: 'center',
        padding: space.lg,
    },
    logButton: {
        backgroundColor: colors.healthGreen,
        marginHorizontal: space.md,
        marginBottom: space.lg,
        paddingVertical: space.md,
        borderRadius: radius.xl,
        alignItems: 'center',
        shadowColor: colors.healthGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logButtonDisabled: {
        opacity: 0.5,
    },
    logButtonText: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textInverse,
    },
});
