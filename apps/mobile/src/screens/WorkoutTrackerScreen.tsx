import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWorkoutTemplates, computeActivityTypeFromRow, formatActivityTypeLabel } from '../hooks/useWorkoutTemplates';
import { useExercises } from '../hooks/useExerciseSearch';
import { useProgramSchedule } from '../hooks/useProgramSchedule';
import { useUserStreaks } from '../hooks/useUserStreaks';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { NextWorkoutCard } from '../components/OverviewCards';

const ACTIVITY_TYPES = [
  { source: require('../../assets/bodybuilding.jpg'), title: 'Bodybuilding' },
  { source: require('../../assets/calisthenics-woman.png'), title: 'Calisthenics' },
  { source: require('../../assets/male-runner-in-action.jpg'), title: 'Running' },
  { source: require('../../assets/stretch.jpg'), title: 'Stretch' },
  { source: require('../../assets/yoga-female.png'), title: 'Yoga' },
];

type WorkoutTrackerScreenProps = {
  navigation?: { goBack: () => void };
  onNavigateToProgram?: () => void;
  onNavigateToTemplateCreate?: () => void;
  onNavigateToMyWorkouts?: () => void;
  onNavigateToActivityType?: (activityType: string) => void;
  onStartTemplate?: (templateId: string) => void;
  onEditTemplate?: (templateId: string) => void;
  onNavigateToWorkoutInsights?: () => void;
  onOpenExerciseDetail?: (exerciseId: string, exerciseName: string) => void;
  onNavigateToExercises?: () => void;
  onNavigateToProfile?: () => void;
  showBackButton?: boolean;
};

export function WorkoutTrackerScreen({
  navigation,
  onNavigateToProgram,
  onNavigateToTemplateCreate,
  onNavigateToMyWorkouts,
  onNavigateToActivityType,
  onStartTemplate,
  onEditTemplate,
  onNavigateToWorkoutInsights,
  onOpenExerciseDetail,
  onNavigateToExercises,
  onNavigateToProfile,
  showBackButton = true,
}: WorkoutTrackerScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const paddingLeft = Math.max(insets.left, space.xs);
  const paddingRight = Math.max(insets.right, space.xs);
  const contentWidth = Dimensions.get('window').width - paddingLeft - paddingRight;
  const activityTypeCardWidth = contentWidth * 0.40;
  const activityTypeCardHeight = 140;
  const { data: streaks = [], isLoading: streaksLoading } = useUserStreaks();
  const mainStreak = streaks.find((s) => s.streak_type === 'workout' || s.streak_type === 'overall');
  const streakDisplay = streaksLoading ? '--' : String(mainStreak?.current_streak ?? 0);
  const { data: scheduleData } = useProgramSchedule();
  const { data: templatesData, isLoading } = useWorkoutTemplates();
  const templateTitleById = useMemo(() => {
    const list = templatesData ?? [];
    return list.reduce((acc: Record<string, string>, t: { id?: string; title?: string }) => {
      if (t?.id != null && t?.title != null) acc[t.id] = t.title;
      return acc;
    }, {});
  }, [templatesData]);
  const todaySlot =
    scheduleData?.todayWeekNumber != null && scheduleData?.todayWeekday != null
      ? scheduleData.scheduleByWeek[scheduleData.todayWeekNumber]?.find(
          (d) => d.day_number === scheduleData.todayWeekday
        )
      : undefined;
  const dayLabel = todaySlot
    ? (todaySlot.templateId && templateTitleById[todaySlot.templateId])
      ? templateTitleById[todaySlot.templateId]
      : (todaySlot.title?.trim() && todaySlot.title.trim().toLowerCase() !== 'workout')
        ? todaySlot.title.trim()
        : 'Select workout'
    : '';
  const moveCardDayWeekLine = todaySlot
    ? `Day ${(todaySlot.week_number - 1) * 7 + todaySlot.day_number} of Week ${todaySlot.week_number}`
    : null;
  const moveCardTitle = todaySlot
    ? dayLabel
    : scheduleData?.program?.title?.trim()
      ? scheduleData.program.title
      : 'Create your own program';
  const templates = (templatesData ?? []).slice(0, 5);
  const { data: exercisesList = [], isLoading: exercisesLoading } = useExercises();
  const exercisesCarouselSlice = exercisesList.slice(0, 12);

  return (
    <View style={styles.container}>
      {showBackButton ? <FloatingBackButton onPress={() => navigation?.goBack()} /> : null}

      <View style={[styles.header, { paddingTop, paddingLeft, paddingRight }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingLeft, paddingRight }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.streakDayRow}>
          <View style={styles.streakDayLeft} />
          <View style={styles.streakDayRight}>
            <MaterialCommunityIcons name="fire" size={22} color={colors.actionAmber} />
            <Text style={styles.streakDayNumber}>{streakDisplay}</Text>
            <Pressable
              onPress={() => onNavigateToProfile?.()}
              style={({ pressed }) => [styles.profileIconButton, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Profile"
            >
              <MaterialCommunityIcons name="account-circle-outline" size={28} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>
        <View style={styles.moveCardWrap}>
          <NextWorkoutCard
            fullWidth
            title="MOVE"
            onPress={onNavigateToProgram}
            workoutName={moveCardTitle}
            dayWeekLabel={moveCardDayWeekLine}
            hideSubtitle
            hideCta
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          <Pressable onPress={onNavigateToMyWorkouts}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.bodyOrange} />
          ) : templates.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginLeft: space.md }}>No workouts found. Create one to get started!</Text>
          ) : (
            templates.map(t => {
              const activitySource = t.activity_type != null
                ? { activity_type: t.activity_type, activity_type_tags: t.activity_type_tags ?? null }
                : computeActivityTypeFromRow(t);
              const activityLabel = formatActivityTypeLabel(activitySource);
              const exerciseCount = (t as any).exercise_count ?? (t as any).workout_template_exercises?.length ?? (t as any).workout_template_exercises?.[0]?.count ?? 0;
              return (
                <Pressable key={t.id} onPress={() => onStartTemplate?.(t.id)}>
                  <LinearGradient
                    colors={['#424242', '#18181b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.templateCard, { width: activityTypeCardWidth, height: activityTypeCardHeight }]}
                  >
                    {activityLabel ? (
                      <View style={styles.activityTypeTag}>
                        <Text style={styles.activityTypeTagText} numberOfLines={1}>{activityLabel}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.templateTitle} numberOfLines={2}>{t.title}</Text>

                    <View style={styles.templateStats}>
                      <View style={styles.statRow}>
                        <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textTertiary} />
                        <Text style={styles.statText}>{exerciseCount} Exercises</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            }))}
        </ScrollView>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Pressable onPress={onNavigateToExercises}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.exercisesSection}>
          {exercisesLoading ? (
            <ActivityIndicator color={colors.bodyOrange} style={{ marginVertical: space.lg }} />
          ) : exercisesCarouselSlice.length === 0 ? (
            <Text style={styles.exercisesPlaceholder}>No exercises found.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.exerciseCarouselContent}
            >
              {exercisesCarouselSlice.map((ex) => (
                <Pressable
                  key={ex.id}
                  style={({ pressed }) => [styles.exerciseBox, { width: activityTypeCardWidth, height: activityTypeCardHeight }, pressed && styles.exerciseBoxPressed]}
                  onPress={() => onOpenExerciseDetail?.(ex.id, ex.name ?? '')}
                >
                  <Text style={styles.exerciseBoxTitle} numberOfLines={2}>{ex.name}</Text>
                  {ex.exercise_type ? (
                    <Text style={styles.exerciseBoxMeta} numberOfLines={1}>{ex.exercise_type}</Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Activity Types</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activityTypesScroll}
        >
          {ACTIVITY_TYPES.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => onNavigateToActivityType?.(item.title)}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            >
              <View style={[styles.activityTypeShadow, { width: activityTypeCardWidth, height: activityTypeCardHeight }]}>
                <View style={styles.activityTypeClip}>
                  <ImageBackground
                    source={item.source}
                    resizeMode="cover"
                    style={styles.activityTypeImageBg}
                    imageStyle={styles.activityTypeImage}
                    fadeDuration={0}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.activityTypeTitleWrap}
                    >
                      <Text style={styles.activityTypeTitle}>{item.title}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Marketplace</Text>
        </View>

        <View style={{ height: 40 }} />
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
    justifyContent: 'space-between',
    paddingBottom: space.xs,
    alignItems: 'center',
  },
  content: {
    paddingTop: space.sm,
  },
  streakDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  streakDayLeft: {
    minWidth: 1,
  },
  profileIconButton: {
    padding: space.xs,
    marginRight: -space.xs,
  },
  streakDayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  streakDayNumber: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '600',
  },
  moveCardWrap: {
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  exercisesSection: {
    paddingVertical: space.md,
    paddingHorizontal: 0,
    marginBottom: space.lg,
  },
  exerciseCarouselContent: {
    gap: space.md,
    paddingRight: space.md,
  },
  exerciseBox: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.md,
    justifyContent: 'flex-end',
  },
  exerciseBoxPressed: {
    opacity: 0.85,
  },
  exerciseBoxTitle: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: space['2xs'],
  },
  exerciseBoxMeta: {
    ...typography.xs,
    color: colors.textTertiary,
  },
  exercisesPlaceholder: {
    ...typography.sm,
    color: colors.textTertiary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: space.md,
  },
  activityTypesScroll: {
    gap: space.md,
    paddingRight: space.md,
    marginBottom: space.lg,
  },
  activityTypeShadow: {
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  activityTypeClip: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgMidnight,
  },
  activityTypeImageBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  activityTypeImage: {},
  activityTypeTitleWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    justifyContent: 'flex-end',
    minHeight: 48,
  },
  activityTypeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: colors.bodyOrange,
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalScroll: {
    gap: space.md,
    paddingRight: space.md,
    marginBottom: space['2xl'],
  },
  templateCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'space-between',
  },
  activityTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: space.sm,
  },
  activityTypeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.actionAmber,
  },
  templateTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginBottom: space.sm,
  },
  templateStats: {
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

});

