import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { ProgressBar } from '../components/ProgressBar';
import { useWorkoutSessionDetail, type WorkoutSessionDetail, type SessionExercise, type SessionSet } from '../hooks/useWorkoutSessionDetail';
import { useExerciseMuscleMappings } from '../hooks/useExerciseMuscleMappings';
import { useProfile } from '../context/ProfileContext';
import {
  MuscleIntensityCalculator,
  type UserProfile,
  type IntensityResult,
  type MuscleScore,
} from '../services/MuscleIntensityCalculator';

export type { SessionSet, SessionExercise, WorkoutSessionDetail };

function mapActivityLevelToFitness(activityLevel: string | null): 'beginner' | 'intermediate' | 'advanced' {
  if (!activityLevel) return 'intermediate';
  const v = activityLevel.toLowerCase();
  if (v === 'sedentary' || v === 'light') return 'beginner';
  if (v === 'moderate' || v === 'active') return 'intermediate';
  if (v === 'athlete') return 'advanced';
  return 'intermediate';
}

function formatMuscleName(muscle: string): string {
  return muscle.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function categoryColor(category: MuscleScore['category']): string {
  switch (category) {
    case 'high': return colors.healthGreen;
    case 'medium': return colors.primaryIndigo;
    case 'low': return colors.actionAmber;
    case 'minimal': return colors.textTertiary;
    default: return colors.textTertiary;
  }
}

type WorkoutSessionDetailScreenProps = {
  sessionId: string | null;
  navigation?: { goBack: () => void };
  session?: WorkoutSessionDetail | null;
};

function formatDetailDate(iso: string): string {
  const d = new Date(iso);
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${mon} ${d.getDate()}, ${d.getFullYear()} • ${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function WorkoutSessionDetailScreen({
  sessionId,
  navigation,
  session: sessionProp,
}: WorkoutSessionDetailScreenProps) {
  const { data: sessionData, isLoading, isError } = useWorkoutSessionDetail(sessionId);
  const session = sessionProp ?? sessionData ?? null;
  const { data: mappings = [] } = useExerciseMuscleMappings();
  const { profile } = useProfile();

  const userProfile: UserProfile = useMemo(
    () => ({
      bodyWeight: profile?.latest_weight_kg ?? 70,
      fitnessLevel: mapActivityLevelToFitness(profile?.activity_level ?? null),
    }),
    [profile?.latest_weight_kg, profile?.activity_level]
  );

  const exercisesForIntensity = useMemo(() => {
    if (!session?.exercises?.length) return [];
    return session.exercises.map((ex) => ({
      name: ex.exercise_name,
      sets: ex.sets.map((s) => ({
        reps: s.reps ?? 0,
        weight: s.weight ?? 0,
        rir: s.rir ?? undefined,
      })),
    }));
  }, [session?.exercises]);

  const intensityResult: IntensityResult | null = useMemo(() => {
    if (mappings.length === 0 || exercisesForIntensity.length === 0) return null;
    const calc = new MuscleIntensityCalculator(mappings);
    return calc.calculateDailyIntensity(exercisesForIntensity, userProfile);
  }, [mappings, exercisesForIntensity, userProfile]);

  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  if (!sessionId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FloatingBackButton onPress={() => navigation?.goBack()} />
        <Text style={styles.emptyTitle}>Session not found</Text>
        <Text style={styles.emptySub}>No session selected.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FloatingBackButton onPress={() => navigation?.goBack()} />
        <ActivityIndicator size="large" color={colors.bodyOrange} />
        <Text style={styles.emptySub}>Loading session…</Text>
      </View>
    );
  }

  if (isError || !session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FloatingBackButton onPress={() => navigation?.goBack()} />
        <Text style={styles.emptyTitle}>Session not found</Text>
        <Text style={styles.emptySub}>This workout may have been deleted.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <View style={[styles.header, { paddingTop }]}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle} numberOfLines={1}>{session.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>{formatDetailDate(session.performed_at)}</Text>
          <View style={styles.summaryRow}>
            {session.duration_minutes != null && (
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textTertiary} />
                <Text style={styles.summaryText}>{session.duration_minutes} min</Text>
              </View>
            )}
            {session.calories_burned != null && (
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="fire" size={18} color={colors.textTertiary} />
                <Text style={styles.summaryText}>{session.calories_burned} kcal</Text>
              </View>
            )}
            {session.total_weight_kg != null && (
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="weight-lifter" size={18} color={colors.textTertiary} />
                <Text style={styles.summaryText}>{session.total_weight_kg.toLocaleString()} kg total</Text>
              </View>
            )}
            {session.distance_km != null && (
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="map-marker" size={18} color={colors.textTertiary} />
                <Text style={styles.summaryText}>{session.distance_km} km</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Muscle intensity</Text>
        {mappings.length === 0 ? (
          <Text style={styles.muscleUnavailable}>Muscle intensity not available.</Text>
        ) : session.exercises.length === 0 ? (
          <Text style={styles.muscleUnavailable}>No exercises in this session.</Text>
        ) : !intensityResult || intensityResult.muscleScores.length === 0 ? (
          <Text style={styles.muscleUnavailable}>No muscle data for these exercises.</Text>
        ) : (
          intensityResult.muscleScores.map((ms) => (
            <View key={ms.muscle} style={styles.muscleRow}>
              <View style={styles.muscleRowTop}>
                <Text style={styles.muscleName} numberOfLines={1}>
                  {formatMuscleName(ms.muscle)}
                </Text>
                <View style={[styles.muscleBadge, { backgroundColor: categoryColor(ms.category) + '22' }]}>
                  <Text style={[styles.muscleBadgeText, { color: categoryColor(ms.category) }]}>
                    {ms.category.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.muscleBarRow}>
                <View style={styles.muscleBarWrap}>
                  <ProgressBar value={ms.score} color={categoryColor(ms.category)} height={8} />
                </View>
                <Text style={styles.muscleScoreText}>{ms.score}%</Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Exercises ({session.exercises.length})</Text>

        {session.exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseBlock}>
            <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
            <View style={styles.setsTable}>
              <View style={styles.setRowHeader}>
                <Text style={[styles.setCell, styles.setCellHeader]}>Set</Text>
                <Text style={[styles.setCell, styles.setCellHeader]}>Reps</Text>
                <Text style={[styles.setCell, styles.setCellHeader]}>Weight</Text>
                <Text style={[styles.setCell, styles.setCellHeader]}>Rest</Text>
                <Text style={[styles.setCell, styles.setCellHeader]}>RIR</Text>
              </View>
              {ex.sets.map((set) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setCell}>{set.set_number}</Text>
                  <Text style={styles.setCell}>{set.reps != null ? set.reps : '—'}</Text>
                  <Text style={styles.setCell}>{set.weight != null ? `${set.weight} kg` : '—'}</Text>
                  <Text style={styles.setCell}>{set.rest_seconds != null ? `${set.rest_seconds}s` : '—'}</Text>
                  <Text style={styles.setCell}>{set.rir != null ? set.rir : '—'}</Text>
                </View>
              ))}
            </View>
            {ex.sets.some((s) => s.duration_seconds != null) && (
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Duration: </Text>
                <Text style={styles.durationValue}>
                  {ex.sets.map((s) => s.duration_seconds != null ? `${s.duration_seconds}s` : null).filter(Boolean).join(', ') || '—'}
                </Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMidnight },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  headerLeft: { width: 40 },
  headerTitle: { ...typography.xl, fontWeight: '700', color: colors.textPrimary, flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.md, paddingBottom: 100 },
  summaryCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  summaryDate: { ...typography.sm, color: colors.textTertiary, marginBottom: space.sm },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  summaryText: { ...typography.sm, color: colors.textPrimary },
  sectionTitle: { ...typography.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: space.md },
  exerciseBlock: {
    marginBottom: space.xl,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  exerciseName: { ...typography.base, fontWeight: '700', color: colors.textPrimary, marginBottom: space.sm },
  setsTable: { marginTop: space.xs },
  setRowHeader: { flexDirection: 'row', paddingVertical: space.xs, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, marginBottom: space.xs },
  setRow: { flexDirection: 'row', paddingVertical: space.xs },
  setCell: { flex: 1, ...typography.sm, color: colors.textSecondary },
  setCellHeader: { color: colors.textTertiary, fontWeight: '600' },
  durationRow: { flexDirection: 'row', marginTop: space.xs },
  durationLabel: { ...typography.xs, color: colors.textTertiary },
  durationValue: { ...typography.xs, color: colors.textSecondary },
  muscleUnavailable: { ...typography.sm, color: colors.textTertiary, marginBottom: space.lg },
  muscleRow: { marginBottom: space.md },
  muscleRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs },
  muscleName: { ...typography.base, color: colors.textPrimary, flex: 1, marginRight: space.sm },
  muscleBadge: { paddingHorizontal: space.xs, paddingVertical: 2, borderRadius: radius.sm },
  muscleBadgeText: { ...typography.xs, fontWeight: '600' },
  muscleBarRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  muscleBarWrap: { flex: 1, marginTop: 0 },
  muscleScoreText: { ...typography.sm, fontWeight: '600', color: colors.textPrimary, minWidth: 36, textAlign: 'right' },
  emptyTitle: { ...typography.lg, fontWeight: '700', color: colors.textPrimary },
  emptySub: { ...typography.sm, color: colors.textTertiary, marginTop: space.xs },
  bottomSpacer: { height: space.xl },
});
