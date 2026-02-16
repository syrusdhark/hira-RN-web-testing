import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    StatusBar,
    Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';

export type InitialExercise = {
    name: string;
    muscle: string;
    exerciseId?: string | null;
};

type AddExercisesForSessionScreenProps = {
    navigation: { goBack: () => void };
    onStartWorkout: (exercises: InitialExercise[]) => void;
    onAddExercise: (callback: (exercise: any) => void) => void;
};

function exerciseFromSearch(ex: any): InitialExercise {
    const muscle = ex.muscles?.[0]
        || (ex.exercise_type ? ex.exercise_type.charAt(0).toUpperCase() + ex.exercise_type.slice(1) : null)
        || ex.category
        || '--';
    return {
        name: ex.name,
        muscle: typeof muscle === 'string' ? muscle : '--',
        exerciseId: ex.id ?? null,
    };
}

export function AddExercisesForSessionScreen({
    navigation,
    onStartWorkout,
    onAddExercise,
}: AddExercisesForSessionScreenProps) {
    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
    const [exercises, setExercises] = useState<InitialExercise[]>([]);

    const handleAddExercise = () => {
        onAddExercise((exercise) => {
            setExercises((prev) => [...prev, exerciseFromSearch(exercise)]);
        });
    };

    const handleRemove = (index: number) => {
        setExercises((prev) => prev.filter((_, i) => i !== index));
    };

    const handleStartWorkout = () => {
        if (exercises.length === 0) return;
        onStartWorkout(exercises);
    };

    return (
        <View style={styles.container}>
            <FloatingBackButton onPress={() => navigation?.goBack()} />
            <View style={[styles.header, { paddingTop }]}>
                <View style={styles.headerLeft} />
                <Text style={styles.headerTitle}>Add exercises</Text>
                <View style={styles.headerRight} />
            </View>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>Add at least one exercise, then start your workout.</Text>
                {exercises.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <MaterialCommunityIcons name="dumbbell" size={48} color={colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No exercises yet</Text>
                        <Text style={styles.emptySub}>Tap "Add exercise" to pick exercises.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {exercises.map((ex, index) => (
                            <View key={`${ex.name}-${index}`} style={styles.row}>
                                <View style={styles.rowIcon}>
                                    <MaterialCommunityIcons name="dumbbell" size={20} color={colors.bodyOrange} />
                                </View>
                                <View style={styles.rowBody}>
                                    <Text style={styles.rowName}>{ex.name}</Text>
                                    <Text style={styles.rowMuscle}>{ex.muscle}</Text>
                                </View>
                                <Pressable
                                    style={styles.removeBtn}
                                    onPress={() => handleRemove(index)}
                                    accessibilityLabel="Remove exercise"
                                >
                                    <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}
                <Pressable style={styles.addButton} onPress={handleAddExercise}>
                    <MaterialCommunityIcons name="plus" size={20} color={colors.bodyOrange} />
                    <Text style={styles.addButtonText}>Add exercise</Text>
                </Pressable>
                <Pressable
                    style={[styles.startButton, exercises.length === 0 && styles.startButtonDisabled]}
                    onPress={handleStartWorkout}
                    disabled={exercises.length === 0}
                >
                    <MaterialCommunityIcons name="play" size={22} color={colors.textInverse} />
                    <Text style={styles.startButtonText}>Start workout</Text>
                </Pressable>
                <View style={styles.bottomSpacer} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.md,
        paddingBottom: space.md,
    },
    headerLeft: { width: 40 },
    headerTitle: {
        ...typography.xl,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerRight: { width: 40 },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: space.md,
        paddingBottom: 100,
    },
    subtitle: {
        ...typography.sm,
        color: colors.textTertiary,
        marginBottom: space.lg,
    },
    emptyWrap: {
        paddingVertical: space.xl * 2,
        alignItems: 'center',
        gap: space.sm,
        marginBottom: space.lg,
    },
    emptyTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    emptySub: {
        ...typography.sm,
        color: colors.textTertiary,
    },
    list: {
        gap: space.sm,
        marginBottom: space.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        padding: space.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 92, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: space.sm,
    },
    rowBody: { flex: 1 },
    rowName: {
        ...typography.base,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    rowMuscle: {
        ...typography.xs,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    removeBtn: {
        padding: space.xs,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        height: 56,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        marginBottom: space.lg,
    },
    addButtonText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.bodyOrange,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.bodyOrange,
    },
    startButtonDisabled: {
        opacity: 0.5,
    },
    startButtonText: {
        ...typography.base,
        fontWeight: '800',
        color: colors.textInverse,
        textTransform: 'uppercase',
    },
    bottomSpacer: { height: space.xl },
});
