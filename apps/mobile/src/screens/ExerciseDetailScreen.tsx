import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    StatusBar,
    ActivityIndicator,
    Linking,
    Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useExerciseDetail } from '../hooks/useExerciseDetail';

type ExerciseDetailScreenProps = {
    exerciseId: string | null;
    exerciseName: string;
    navigation: { goBack: () => void };
};

function DetailRow({ label, value }: { label: string; value: string | null }) {
    const display = value ?? '--';
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{display}</Text>
        </View>
    );
}

export function ExerciseDetailScreen({
    exerciseId,
    exerciseName,
    navigation,
}: ExerciseDetailScreenProps) {
    const { data: exercise, isLoading, isError } = useExerciseDetail(exerciseId);
    const baseTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 50 : 56;
    const paddingTop = baseTop + 56;

    // Custom exercise (no id): show name and message only
    if (!exerciseId) {
        return (
            <View style={[styles.container, styles.centered]}>
                <FloatingBackButton onPress={() => navigation?.goBack()} />
                <View style={[styles.content, { paddingTop }]}>
                    <Text style={styles.title}>{exerciseName}</Text>
                    <Text style={styles.customMessage}>Custom exercise – no additional details.</Text>
                </View>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <FloatingBackButton onPress={() => navigation?.goBack()} />
                <ActivityIndicator size="large" color={colors.bodyOrange} />
                <Text style={styles.loadingText}>Loading exercise…</Text>
            </View>
        );
    }

    if (isError || !exercise) {
        return (
            <View style={[styles.container, styles.centered]}>
                <FloatingBackButton onPress={() => navigation?.goBack()} />
                <Text style={styles.errorTitle}>{exerciseName}</Text>
                <Text style={styles.errorSub}>Could not load exercise details.</Text>
            </View>
        );
    }

    const muscles = exercise.exercise_muscles ?? [];
    const primaryBodyPart = exercise.primary_body_part ?? null;
    const equipment = exercise.equipment ?? null;
    const exerciseType = exercise.exercise_type ?? null;
    const difficulty = exercise.difficulty_level ?? null;

    return (
        <View style={styles.container}>
            <FloatingBackButton onPress={() => navigation?.goBack()} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingTop }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>{exercise.name}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.detailCard}>
                        <DetailRow label="Type" value={exerciseType} />
                        <DetailRow label="Difficulty" value={difficulty} />
                        <DetailRow label="Equipment" value={equipment} />
                        <DetailRow label="Primary body part" value={primaryBodyPart} />
                    </View>
                </View>

                {muscles.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Muscles</Text>
                        <View style={styles.detailCard}>
                            {muscles.map((m) => (
                                <View key={`${m.muscle}-${m.role}`} style={styles.muscleRow}>
                                    <Text style={styles.muscleName}>{m.muscle}</Text>
                                    <Text style={styles.muscleRole}>{m.role}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {exercise.video_url ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Video</Text>
                        <Pressable
                            style={styles.videoLink}
                            onPress={() => Linking.openURL(exercise.video_url!)}
                        >
                            <MaterialCommunityIcons name="play-circle-outline" size={24} color={colors.bodyOrange} />
                            <Text style={styles.videoLinkText}>Watch video</Text>
                        </Pressable>
                    </View>
                ) : null}

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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: space.md,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: space.md,
        paddingBottom: 100,
    },
    title: {
        ...typography['2xl'],
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.lg,
    },
    customMessage: {
        ...typography.sm,
        color: colors.textTertiary,
        marginTop: space.xs,
    },
    loadingText: {
        ...typography.sm,
        color: colors.textTertiary,
        marginTop: space.md,
    },
    errorTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    errorSub: {
        ...typography.sm,
        color: colors.textTertiary,
        marginTop: space.xs,
    },
    section: {
        marginBottom: space.lg,
    },
    sectionTitle: {
        ...typography.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: space.sm,
    },
    detailCard: {
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        padding: space.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: space.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    detailLabel: {
        ...typography.sm,
        color: colors.textTertiary,
    },
    detailValue: {
        ...typography.sm,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    muscleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: space.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    muscleName: {
        ...typography.sm,
        color: colors.textPrimary,
    },
    muscleRole: {
        ...typography.xs,
        color: colors.textTertiary,
        textTransform: 'capitalize',
    },
    videoLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        padding: space.md,
        backgroundColor: colors.bgCharcoal,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    videoLinkText: {
        ...typography.base,
        fontWeight: '600',
        color: colors.bodyOrange,
    },
    bottomSpacer: {
        height: space.xl,
    },
});
