import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius } from '../theme';
import { Section } from '../components/Section';
import { ProgressBar } from '../components/ProgressBar';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useExerciseMuscleMappings } from '../hooks/useExerciseMuscleMappings';
import { useTodayWorkoutForIntensity } from '../hooks/useTodayWorkoutForIntensity';
import { useProfile } from '../context/ProfileContext';
import {
  MuscleIntensityCalculator,
  type UserProfile,
  type IntensityResult,
  type MuscleScore,
} from '../services/MuscleIntensityCalculator';

function mapActivityLevelToFitness(
  activityLevel: string | null
): 'beginner' | 'intermediate' | 'advanced' {
  if (!activityLevel) return 'intermediate';
  const v = activityLevel.toLowerCase();
  if (v === 'sedentary' || v === 'light') return 'beginner';
  if (v === 'moderate' || v === 'active') return 'intermediate';
  if (v === 'athlete') return 'advanced';
  return 'intermediate';
}

function formatMuscleName(muscle: string): string {
  return muscle
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDuration(min: number): string {
  if (min <= 0) return '0 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m} min` : `${h}h`;
}

function categoryColor(category: MuscleScore['category']): string {
  switch (category) {
    case 'high':
      return colors.healthGreen;
    case 'medium':
      return colors.primaryIndigo;
    case 'low':
      return colors.actionAmber;
    case 'minimal':
      return colors.textTertiary;
    default:
      return colors.textTertiary;
  }
}

export function WorkoutInsightsScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { profile } = useProfile();
  const { data: mappings = [], isLoading: mappingsLoading, isError: mappingsError } = useExerciseMuscleMappings();
  const { data: workoutData, isLoading: workoutLoading } = useTodayWorkoutForIntensity();
  const exercises = workoutData?.exercises ?? [];
  const totalDurationMinutes = workoutData?.totalDurationMinutes ?? 0;

  const userProfile: UserProfile = useMemo(
    () => ({
      bodyWeight: profile?.latest_weight_kg ?? 70,
      fitnessLevel: mapActivityLevelToFitness(profile?.activity_level ?? null),
    }),
    [profile?.latest_weight_kg, profile?.activity_level]
  );

  const result: IntensityResult | null = useMemo(() => {
    if (mappings.length === 0 || exercises.length === 0) return null;
    const calc = new MuscleIntensityCalculator(mappings);
    return calc.calculateDailyIntensity(exercises, userProfile);
  }, [mappings, exercises, userProfile]);

  const isLoading = mappingsLoading || workoutLoading;
  const noMappings = !mappingsLoading && (mappingsError || mappings.length === 0);
  const noWorkoutToday = !workoutLoading && exercises.length === 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Insights</Text>
          <View style={styles.headerRight} />
        </View>
        <EnvironmentContainer>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primaryViolet} />
          </View>
        </EnvironmentContainer>
      </View>
    );
  }

  if (noMappings) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Insights</Text>
          <View style={styles.headerRight} />
        </View>
        <EnvironmentContainer>
          <Section spacing="md">
            <Text style={styles.emptyText}>Muscle mapping data not available.</Text>
          </Section>
        </EnvironmentContainer>
      </View>
    );
  }

  if (noWorkoutToday) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Insights</Text>
          <View style={styles.headerRight} />
        </View>
        <EnvironmentContainer>
          <Section spacing="md">
            <Text style={styles.emptyText}>No workout logged for today. Log a session to see muscle intensity.</Text>
          </Section>
        </EnvironmentContainer>
      </View>
    );
  }

  if (!result || result.muscleScores.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Insights</Text>
          <View style={styles.headerRight} />
        </View>
        <EnvironmentContainer>
          <Section spacing="md">
            <Text style={styles.emptyText}>No muscle intensity data for today's exercises.</Text>
          </Section>
        </EnvironmentContainer>
      </View>
    );
  }

  const meta = result.metadata;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout Insights</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <EnvironmentContainer>
          <Section spacing="md">
            <View style={styles.metadataRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{meta.totalVolume}</Text>
                <Text style={styles.metaLabel}>Total volume (kg)</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{formatDuration(totalDurationMinutes)}</Text>
                <Text style={styles.metaLabel}>Time</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{exercises.length}</Text>
                <Text style={styles.metaLabel}>Total exercises</Text>
              </View>
            </View>
            <View style={[styles.metadataRow, styles.metadataRowSecond]}>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{meta.totalMusclesWorked}</Text>
                <Text style={styles.metaLabel}>Muscles worked</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {formatMuscleName(meta.highestIntensityMuscle) || '—'}
                </Text>
                <Text style={styles.metaLabel}>Highest intensity</Text>
              </View>
            </View>
          </Section>

          <Section spacing="md">
            <Text style={styles.sectionTitle}>Muscle intensity</Text>
            {result.muscleScores.map((ms) => (
              <View key={ms.muscle} style={styles.muscleRow}>
                <View style={styles.muscleRowTop}>
                  <Text style={styles.muscleName} numberOfLines={1}>
                    {formatMuscleName(ms.muscle)}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: categoryColor(ms.category) + '22' }]}>
                    <Text style={[styles.badgeText, { color: categoryColor(ms.category) }]}>
                      {ms.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.barRow}>
                  <View style={styles.barWrap}>
                    <ProgressBar
                      value={ms.score}
                      color={categoryColor(ms.category)}
                      height={8}
                    />
                  </View>
                  <Text style={styles.scoreText}>{ms.score}%</Text>
                </View>
              </View>
            ))}
          </Section>
        </EnvironmentContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCharcoal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  backButton: {
    padding: space.xs,
    marginRight: space.xs,
  },
  headerTitle: {
    ...typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space['2xl'],
  },
  loadingWrap: {
    paddingVertical: space['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.base,
    color: colors.textSecondary,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  metadataRowSecond: {
    marginTop: space.sm,
  },
  metaItem: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    padding: space.md,
    borderRadius: radius.md,
  },
  metaValue: {
    ...typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    marginTop: space['2xs'],
  },
  sectionTitle: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  muscleRow: {
    marginBottom: space.md,
  },
  muscleRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  muscleName: {
    ...typography.base,
    color: colors.textPrimary,
    flex: 1,
    marginRight: space.sm,
  },
  badge: {
    paddingHorizontal: space.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.xs,
    fontWeight: '600',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  barWrap: {
    flex: 1,
    marginTop: 0,
  },
  scoreText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'right',
  },
});
