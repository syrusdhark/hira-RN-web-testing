import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { useNutrition, type MealType } from '../context/NutritionContext';
import { NutritionRing } from '../components/NutritionRing';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock Data for visual display (will be replaced with real data when macros are tracked)
const NUTRIENTS = [
    { label: 'Protein', value: '80g', icon: 'molecule', color: '#00F0FF' }, // Cyan
    { label: 'Carbs', value: '120g', icon: 'barley', color: '#5C8DFF' },    // Indigo
    { label: 'Fats', value: '30g', icon: 'water', color: '#D946EF' },       // Purple/Pink
    { label: 'Fibre', value: '24g', icon: 'leaf', color: '#FFB000' },       // Amber
];

const MICROS = [
    { label: 'Vitamin D', value: '15µg', icon: 'white-balance-sunny', color: '#2DD4BF' }, // Teal
    { label: 'Vitamin C', value: '75mg', icon: 'fruit-citrus', color: '#A3E635' },        // Lime
    { label: 'Vitamin B1', value: '1.1mg', icon: 'flask', color: '#F472B6' },             // Pink
    { label: 'Cholesterol', value: '180mg', icon: 'heart-pulse', color: '#F87171' },      // Red
];

const SUGGESTIONS = [
    {
        id: 1,
        title: 'Grilled Salmon Bowl',
        tag: 'HIGH PROTEIN',
        calories: '480 kcal',
        image: 'https://images.unsplash.com/photo-1467003909585-6f8c7a2ee196?q=80&w=200&auto=format&fit=crop',
    },
    {
        id: 2,
        title: 'Avocado Toast',
        tag: 'HEALTHY FATS',
        calories: '320 kcal',
        image: 'https://images.unsplash.com/photo-1588137372308-15f75323a399?q=80&w=200&auto=format&fit=crop',
    },
];

const MEAL_CONFIG: { key: MealType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'breakfast', label: 'Breakfast', icon: 'white-balance-sunny' },
    { key: 'lunch', label: 'Lunch', icon: 'weather-sunny' },
    { key: 'dinner', label: 'Dinner', icon: 'weather-night' },
    { key: 'snack', label: 'Snacks', icon: 'cookie' },
];

function getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function getPrevDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function getNextDate(dateStr: string): string | null {
    if (dateStr >= getTodayDate()) return null;
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

function formatDateForDisplay(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type NavigationHeaderProps = {
    navigation?: { goBack: () => void };
    onNavigateToFoodSearch?: (mealType: MealType) => void;
};

export function NutritionDetailsScreen({ navigation, onNavigateToFoodSearch }: NavigationHeaderProps) {
    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
    const today = getTodayDate();
    const [selectedDate, setSelectedDate] = useState<string>(today);

    const {
        calories,
        targetCalories,
        meals,
        addFoodToMeal,
        removeFoodFromMeal,
        getMealCalories,
        isLoading,
        setSelectedDateOverride,
    } = useNutrition();

    useEffect(() => {
        setSelectedDateOverride(selectedDate);
        return () => setSelectedDateOverride(null);
    }, [selectedDate, setSelectedDateOverride]);

    const isViewingToday = selectedDate === today;
    const nextDate = getNextDate(selectedDate);

    const remaining = targetCalories - calories;
    const [addModalMeal, setAddModalMeal] = useState<MealType | null>(null);
    const [addName, setAddName] = useState('');
    const [addPortion, setAddPortion] = useState('');
    const [addCaloriesInput, setAddCaloriesInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingFoodId, setDeletingFoodId] = useState<string | null>(null);

    const openAddFood = (mealType: MealType) => {
        setAddModalMeal(mealType);
        setAddName('');
        setAddPortion('');
        setAddCaloriesInput('');
    };

    const closeAddFood = () => {
        setAddModalMeal(null);
    };

    const submitAddFood = async () => {
        if (!addModalMeal || !addName.trim()) return;

        setIsSubmitting(true);
        try {
            const cal = parseInt(addCaloriesInput, 10) || 0;
            await addFoodToMeal(addModalMeal, {
                name: addName.trim(),
                portion: addPortion.trim() || undefined,
                calories: cal,
            });
            closeAddFood();
        } catch (error: any) {
            Alert.alert(
                'Failed to add food',
                error?.message || 'Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveFood = async (mealType: MealType, foodId: string, foodName: string) => {
        Alert.alert(
            'Remove Food',
            `Are you sure you want to remove "${foodName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingFoodId(foodId);
                        try {
                            await removeFoodFromMeal(mealType, foodId);
                        } catch (error: any) {
                            Alert.alert(
                                'Failed to remove food',
                                error?.message || 'Please try again.',
                                [{ text: 'OK' }]
                            );
                        } finally {
                            setDeletingFoodId(null);
                        }
                    },
                },
            ]
        );
    };

    // Calculate the number of meals with food logged
    const mealsWithFood = Object.values(meals).filter(m => m.length > 0).length;

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop }]}>
                <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.dateSwitcher}>
                    <Pressable
                        onPress={() => setSelectedDate(getPrevDate(selectedDate))}
                        style={styles.dateArrow}
                        accessibilityLabel="Previous day"
                    >
                        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.dateText} numberOfLines={1}>{formatDateForDisplay(selectedDate)}</Text>
                    <Pressable
                        onPress={() => nextDate && setSelectedDate(nextDate)}
                        style={[styles.dateArrow, !nextDate && styles.dateArrowDisabled]}
                        disabled={!nextDate}
                        accessibilityLabel="Next day"
                    >
                        <MaterialCommunityIcons name="chevron-right" size={28} color={nextDate ? colors.textPrimary : colors.textTertiary} />
                    </Pressable>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.healthGreen} />
                    <Text style={styles.loadingText}>Loading nutrition data...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Main Calorie Circle Card */}
                    <View style={styles.mainCard}>
                        {/* Subtle Glow Background */}
                        <LinearGradient
                            colors={['rgba(255, 176, 0, 0.05)', 'rgba(0,0,0,0)']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            locations={[0, 1]}
                            style={StyleSheet.absoluteFillObject}
                        />

                        <View style={styles.circleContainer}>
                            <NutritionRing calories={calories} targetCalories={targetCalories} />

                            <View style={styles.circleInner}>
                                <Text style={styles.caloriesValue}>{calories.toLocaleString()}</Text>
                                <Text style={styles.caloriesLabel}>KCAL EATEN</Text>

                                <View style={styles.remainingRow}>
                                    <Text style={[styles.remainingValue, remaining < 0 && { color: '#FF6B6B' }]}>
                                        {remaining < 0 ? '+' : ''}{Math.abs(remaining).toLocaleString()}
                                    </Text>
                                    <Text style={styles.remainingLabel}> {remaining < 0 ? 'OVER' : 'LEFT'}</Text>
                                </View>

                                <View style={styles.mealsBadge}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={12} color={colors.textSecondary} />
                                    <Text style={styles.mealsBadgeText}>
                                        {Math.max(0, 4 - mealsWithFood)} Meal{Math.max(0, 4 - mealsWithFood) !== 1 ? 's' : ''} Left
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Macros Grid */}
                    <View style={styles.gridContainer}>
                        <View style={styles.gridRow}>
                            {NUTRIENTS.map((item, index) => (
                                <View key={index} style={styles.gridItem}>
                                    <View style={[styles.iconCircle, { borderColor: item.color }]}>
                                        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <Text style={styles.gridValue}>{item.value}</Text>
                                    <Text style={styles.gridLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={[styles.gridRow, { marginTop: space.lg }]}>
                            {MICROS.map((item, index) => (
                                <View key={index} style={styles.gridItem}>
                                    <View style={[styles.iconCircle, { borderColor: item.color }]}>
                                        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <Text style={styles.gridValue}>{item.value}</Text>
                                    <Text style={styles.gridLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* AI Suggestions */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="auto-fix" size={18} color={colors.healthGreen} />
                            <Text style={styles.sectionTitle}>Hira AI Suggestions</Text>
                        </View>
                        <Text style={styles.viewAll}>View All</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                        {SUGGESTIONS.map((item) => (
                            <Pressable key={item.id} style={styles.suggestionCard}>
                                <Image source={{ uri: item.image }} style={styles.suggestionImage} />
                                <View style={styles.suggestionContent}>
                                    <Text style={styles.suggestionTag}>{item.tag}</Text>
                                    <Text style={styles.suggestionTitle}>{item.title}</Text>
                                    <View style={styles.suggestionFooter}>
                                        <Text style={styles.suggestionCals}>{item.calories}</Text>
                                        <View style={styles.addBtnSmall}>
                                            <MaterialCommunityIcons name="arrow-right" size={14} color="#000" />
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Meals for selected date */}
                    <Text style={[styles.sectionTitle, { marginTop: space.xl, marginBottom: space.md, paddingHorizontal: space.md }]}>
                        {isViewingToday ? "Today's Meals" : `${formatDateForDisplay(selectedDate)} — Meals`}
                    </Text>

                    {MEAL_CONFIG.map(({ key: mealType, label, icon }) => {
                        const mealCalories = getMealCalories(mealType);
                        const foodList = meals[mealType];
                        const isEmpty = foodList.length === 0;
                        const iconColor = mealType === 'breakfast' || mealType === 'lunch' ? colors.actionAmber : mealType === 'dinner' ? '#8A70FF' : '#D946EF';
                        return (
                            <View key={mealType} style={styles.mealCard}>
                                <View style={styles.mealHeader}>
                                    <View style={styles.mealHeaderLeft}>
                                        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
                                        <Text style={styles.mealTitle}>{label}</Text>
                                    </View>
                                    <Text style={styles.mealCals}>{mealCalories} kcal</Text>
                                </View>

                                {isEmpty ? (
                                    <Text style={styles.emptyMealText}>No food logged yet</Text>
                                ) : (
                                    foodList.map((food) => (
                                        <View key={food.id} style={styles.foodItem}>
                                            <View style={[styles.foodThumb, styles.foodThumbPlaceholder]}>
                                                <MaterialCommunityIcons name="food-apple-outline" size={20} color={colors.textTertiary} />
                                            </View>
                                            <View style={styles.foodInfo}>
                                                <Text style={styles.foodName}>{food.name}</Text>
                                                {food.portion ? <Text style={styles.foodPortion}>{food.portion}</Text> : null}
                                                <Text style={styles.foodCalsSmall}>{food.calories} kcal</Text>
                                            </View>
                                            <Pressable
                                                onPress={() => handleRemoveFood(mealType, food.id, food.name)}
                                                style={[styles.removeFoodBtn, !isViewingToday && styles.actionDisabled]}
                                                accessibilityLabel="Remove food"
                                                disabled={deletingFoodId === food.id || !isViewingToday}
                                            >
                                                {deletingFoodId === food.id ? (
                                                    <ActivityIndicator size="small" color={colors.textTertiary} />
                                                ) : (
                                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textTertiary} />
                                                )}
                                            </Pressable>
                                        </View>
                                    ))
                                )}

                                {isViewingToday && (mealType === 'lunch' && isEmpty ? (
                                    <Pressable style={styles.logMealBtn} onPress={() => onNavigateToFoodSearch?.(mealType)}>
                                        <LinearGradient
                                            colors={['rgba(45, 255, 143, 0.1)', 'rgba(45, 255, 143, 0.05)']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            locations={[0, 1]}
                                            style={StyleSheet.absoluteFillObject}
                                        />
                                        <MaterialCommunityIcons name="plus" size={16} color={colors.healthGreen} />
                                        <Text style={[styles.addFoodText, { color: colors.healthGreen }]}>Log Lunch</Text>
                                    </Pressable>
                                ) : (
                                    <Pressable style={styles.addFoodBtn} onPress={() => onNavigateToFoodSearch?.(mealType)}>
                                        <MaterialCommunityIcons name="plus-circle" size={18} color={colors.textSecondary} />
                                        <Text style={styles.addFoodText}>Add Food</Text>
                                    </Pressable>
                                ))}
                                {!isViewingToday && (
                                    <Text style={styles.viewOnlyHint}>Viewing past day — logging disabled</Text>
                                )}
                            </View>
                        );
                    })}

                    <View style={{ height: 100 }} />

                </ScrollView>
            )}

            {/* Floating Scan Button (Visual only for now) */}
            <View style={styles.floatingScanWrapper}>
                <View style={styles.scanBtn}>
                    <MaterialCommunityIcons name="barcode-scan" size={28} color="#000" />
                </View>
            </View>

            {/* Add Food Modal */}
            <Modal
                visible={addModalMeal !== null}
                transparent
                animationType="fade"
                onRequestClose={closeAddFood}
            >
                <Pressable style={styles.modalOverlay} onPress={closeAddFood}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalKeyboard}
                    >
                        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                            <Text style={styles.modalTitle}>
                                {addModalMeal ? `Add food to ${MEAL_CONFIG.find((m) => m.key === addModalMeal)?.label ?? addModalMeal}` : 'Add Food'}
                            </Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Food name"
                                placeholderTextColor={colors.textTertiary}
                                value={addName}
                                onChangeText={setAddName}
                                autoCapitalize="words"
                                editable={!isSubmitting}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Portion (e.g. 1 bowl)"
                                placeholderTextColor={colors.textTertiary}
                                value={addPortion}
                                onChangeText={setAddPortion}
                                editable={!isSubmitting}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Calories"
                                placeholderTextColor={colors.textTertiary}
                                value={addCaloriesInput}
                                onChangeText={setAddCaloriesInput}
                                keyboardType="number-pad"
                                editable={!isSubmitting}
                            />
                            <View style={styles.modalActions}>
                                <Pressable
                                    style={styles.modalCancelBtn}
                                    onPress={closeAddFood}
                                    disabled={isSubmitting}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.modalAddBtn,
                                        (!addName.trim() || isSubmitting) && styles.modalAddBtnDisabled
                                    ]}
                                    onPress={submitAddFood}
                                    disabled={!addName.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color={colors.textInverse} />
                                    ) : (
                                        <Text style={styles.modalAddText}>Add</Text>
                                    )}
                                </Pressable>
                            </View>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: space.md,
        paddingBottom: space.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    dateSwitcher: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        paddingHorizontal: space.xs,
    },
    dateArrow: {
        padding: space.xs,
    },
    dateArrowDisabled: {
        opacity: 0.5,
    },
    dateText: {
        ...typography.sm,
        fontWeight: '600',
        color: colors.textPrimary,
        maxWidth: 180,
    },
    headerSpacer: {
        width: 40,
    },
    viewOnlyHint: {
        ...typography.xs,
        color: colors.textTertiary,
        marginTop: space.xs,
    },
    actionDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.base,
        color: colors.textSecondary,
        marginTop: space.md,
    },
    headerRight: {
        flexDirection: 'row',
        gap: space.sm,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.full,
        gap: 4,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    headerBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    headerBadgeValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    scrollContent: {
        paddingBottom: space.xl,
    },
    mainCard: {
        marginHorizontal: space.md,
        height: 280, // Approximate height
        backgroundColor: colors.bgCharcoal,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: space.xl,
        overflow: 'hidden',
    },
    circleContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    circleInner: {
        alignItems: 'center',
    },
    caloriesValue: {
        fontSize: 40,
        fontWeight: '800',
        color: colors.textPrimary,
        lineHeight: 44,
    },
    caloriesLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textTertiary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    remainingRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    remainingValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.actionAmber,
    },
    remainingLabel: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    mealsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.md,
        gap: 4,
    },
    mealsBadgeText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    gridContainer: {
        paddingHorizontal: space.lg,
        marginBottom: space.xl,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridItem: {
        alignItems: 'center',
        width: SCREEN_WIDTH / 5, // Approximate
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    gridLabel: {
        fontSize: 10,
        color: colors.textTertiary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: space.md,
        marginBottom: space.md,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    viewAll: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.healthGreen,
    },
    suggestionsScroll: {
        paddingHorizontal: space.md,
        gap: space.md,
    },
    suggestionCard: {
        width: 220,
        backgroundColor: colors.bgCharcoal,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    suggestionImage: {
        width: '100%',
        height: 120,
        backgroundColor: colors.bgElevated,
    },
    suggestionContent: {
        padding: space.md,
    },
    suggestionTag: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.healthGreen,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.sm,
    },
    suggestionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    suggestionCals: {
        fontSize: 12,
        color: colors.textTertiary,
    },
    addBtnSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.healthGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealCard: {
        marginHorizontal: space.md,
        backgroundColor: colors.bgCharcoal,
        borderRadius: 24,
        padding: space.md,
        marginBottom: space.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: space.md,
    },
    mealHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
    },
    mealTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mealCals: {
        fontSize: 13,
        color: colors.textTertiary,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgElevated,
        padding: 10,
        borderRadius: 16,
        marginBottom: space.md,
        gap: space.md,
    },
    foodThumb: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgCharcoal,
    },
    foodThumbPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    foodPortion: {
        fontSize: 11,
        color: colors.textTertiary,
    },
    foodCalsSmall: {
        fontSize: 11,
        color: colors.textTertiary,
        marginTop: 2,
    },
    removeFoodBtn: {
        padding: space.xs,
        minWidth: 32,
        minHeight: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addFoodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderRadius: 16,
        paddingVertical: 12,
        gap: 6,
    },
    addFoodText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    emptyMealText: {
        textAlign: 'center',
        color: colors.textTertiary,
        fontSize: 12,
        marginBottom: space.md,
    },
    logMealBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 6,
        overflow: 'hidden',
    },
    floatingScanWrapper: {
        position: 'absolute',
        bottom: space.lg,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scanBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.healthGreen,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.healthGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 4,
        borderColor: 'rgba(45, 255, 143, 0.2)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: space.lg,
    },
    modalKeyboard: {
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.xl,
        padding: space.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.lg,
    },
    modalInput: {
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        fontSize: 15,
        color: colors.textPrimary,
        marginBottom: space.md,
        borderWidth: 1,
        borderColor: colors.borderDefault,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: space.sm,
        marginTop: space.sm,
    },
    modalCancelBtn: {
        paddingVertical: space.sm,
        paddingHorizontal: space.lg,
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    modalAddBtn: {
        paddingVertical: space.sm,
        paddingHorizontal: space.lg,
        borderRadius: radius.md,
        backgroundColor: colors.healthGreen,
        minWidth: 60,
        alignItems: 'center',
    },
    modalAddBtnDisabled: {
        opacity: 0.5,
    },
    modalAddText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textInverse,
    },
});
