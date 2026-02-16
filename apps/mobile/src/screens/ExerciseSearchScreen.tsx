import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useExerciseSearch } from '../hooks/useExerciseSearch';

type ExerciseSearchScreenProps = {
    onClose?: () => void;
    onSelectExercise?: (exercise: {
        id: string;
        name: string;
        category: string;
        exercise_type: string | null;
        difficulty_level: string;
        equipment: string;
        muscles?: string[];
    }) => void;
};

const EXERCISE_TYPES = [
    { id: 'all', label: 'All', color: colors.bodyOrange },
    { id: 'bodybuilding', label: 'Bodybuilding', color: colors.primaryIndigo },
    { id: 'strength', label: 'Strength', color: colors.primaryViolet },
    { id: 'yoga', label: 'Yoga', color: colors.healthGreen },
    { id: 'stretch', label: 'Stretch', color: colors.actionAmber },
    { id: 'rest', label: 'Rest', color: colors.textTertiary },
    { id: 'calisthenics', label: 'Calisthenics', color: colors.bodyOrange },
    { id: 'hybrid', label: 'Hybrid', color: colors.brandBlue },
];

export function ExerciseSearchScreen({ onClose, onSelectExercise }: ExerciseSearchScreenProps) {
    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Updated destructuring to match hook return
    const { exercises, isLoading } = useExerciseSearch(searchQuery);

    // Filter by exercise type
    const filteredExercises = exercises?.filter(ex => {
        if (selectedCategory === 'all') return true;
        return ex.exercise_type === selectedCategory || (ex.exercise_type == null && ex.category === selectedCategory);
    }) || [];

    // Get top 3 exercises as suggestions
    const topSuggestions = filteredExercises.slice(0, 3);

    // Recently viewed: empty until we have local storage; all listed exercises come from DB
    const recentlyViewed: any[] = [];

    const handleSelectExercise = (exercise: any) => {
        if (onSelectExercise) {
            // Extract muscles from relation
            const muscles = exercise.exercise_muscles?.map((m: any) => m.muscle) || [];

            onSelectExercise({
                id: exercise.id,
                name: exercise.name,
                category: exercise.category ?? '',
                exercise_type: exercise.exercise_type ?? null,
                difficulty_level: exercise.difficulty_level,
                equipment: exercise.equipment,
                muscles: muscles,
            });
            onClose?.();
        }
    };

    return (
        <View style={styles.container}>
            <FloatingBackButton onPress={() => onClose?.()} />

            <View style={[styles.header, { paddingTop }]}>
                <Text style={styles.headerTitle}>Exercise Search</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search 'Bench Press' or 'Cardio'..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textTertiary} />
                        </Pressable>
                    )}
                </View>

                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {EXERCISE_TYPES.map(cat => (
                        <Pressable
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === cat.id && { backgroundColor: cat.color }
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat.id && styles.categoryTextActive
                            ]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* AI Suggestion */}
                {!searchQuery && (
                    <View style={styles.aiSuggestion}>
                        <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.actionAmber} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.aiTitle}>AI SUGGESTION</Text>
                            <Text style={styles.aiText}>
                                Based on your chest day last week, consider adding <Text style={styles.aiHighlight}>Cable Flys</Text> to target your inner pecs today.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.bodyOrange} />
                        <Text style={styles.loadingText}>Loading exercises...</Text>
                    </View>
                )}

                {/* Top Results */}
                {!isLoading && filteredExercises.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {searchQuery ? 'Search Results' : 'Top Results'}
                            </Text>
                            {!searchQuery && (
                                <Pressable>
                                    <Text style={styles.viewAllText}>View all</Text>
                                </Pressable>
                            )}
                        </View>

                        {topSuggestions.map((exercise) => (
                            <Pressable
                                key={exercise.id}
                                style={styles.exerciseCard}
                                onPress={() => handleSelectExercise(exercise)}
                            >
                                <View style={styles.exerciseIcon}>
                                    <MaterialCommunityIcons name="dumbbell" size={24} color={colors.textTertiary} />
                                </View>
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <View style={styles.exerciseMeta}>
                                        <Text style={styles.metaText}>{exercise.exercise_type || exercise.category || 'Uncategorized'}</Text>
                                        <View style={styles.metaDot} />
                                        <Text style={styles.metaText}>{exercise.equipment || 'No Equipment'}</Text>
                                        {exercise.exercise_muscles && exercise.exercise_muscles.length > 0 && (
                                            <>
                                                <View style={styles.metaDot} />
                                                <Text style={styles.metaText}>{exercise.exercise_muscles[0].muscle}</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <Pressable
                                    style={styles.addButton}
                                    onPress={() => handleSelectExercise(exercise)}
                                >
                                    <MaterialCommunityIcons name="plus" size={24} color={colors.textPrimary} />
                                </Pressable>
                            </Pressable>
                        ))}
                    </>
                )}

                {/* Empty State */}
                {!isLoading && filteredExercises.length === 0 && searchQuery && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="magnify" size={64} color={colors.bgElevated} />
                        <Text style={styles.emptyTitle}>No exercises found</Text>
                        <Text style={styles.emptyText}>
                            Try searching for different terms or browse by category
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    header: {
        paddingHorizontal: space.md,
        paddingBottom: space.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    headerTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    content: {
        padding: space.md,
        paddingBottom: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        gap: space.sm,
        marginBottom: space.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        ...typography.base,
        height: 40,
    },
    categoriesScroll: {
        marginBottom: space.lg,
    },
    categoriesContainer: {
        gap: space.sm,
        paddingRight: space.md,
    },
    categoryChip: {
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        borderRadius: radius.full,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    categoryText: {
        ...typography.sm,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    categoryTextActive: {
        color: colors.textPrimary,
    },
    aiSuggestion: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 176, 0, 0.1)',
        borderRadius: radius.lg,
        padding: space.md,
        marginBottom: space.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 176, 0, 0.2)',
    },
    aiTitle: {
        ...typography.xs,
        fontWeight: '700',
        color: colors.actionAmber,
        marginBottom: 4,
    },
    aiText: {
        ...typography.sm,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    aiHighlight: {
        color: colors.actionAmber,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: space['2xl'],
    },
    loadingText: {
        ...typography.sm,
        color: colors.textTertiary,
        marginTop: space.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: space.md,
    },
    sectionTitle: {
        ...typography.base,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    viewAllText: {
        ...typography.sm,
        color: colors.bodyOrange,
        fontWeight: '600',
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        padding: space.md,
        marginBottom: space.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    exerciseIcon: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: space.sm,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        ...typography.base,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    exerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        ...typography.xs,
        color: colors.textTertiary,
        textTransform: 'capitalize',
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.textTertiary,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.bodyOrange,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: space['2xl'],
    },
    emptyTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: space.md,
        marginBottom: space.sm,
    },
    emptyText: {
        ...typography.sm,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    recentlyViewedContainer: {
        gap: space.md,
        paddingRight: space.md,
    },
    recentCard: {
        width: 140,
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    recentImagePlaceholder: {
        width: '100%',
        height: 140,
        backgroundColor: colors.bgElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentName: {
        ...typography.sm,
        fontWeight: '600',
        color: colors.textPrimary,
        padding: space.sm,
    },
});
