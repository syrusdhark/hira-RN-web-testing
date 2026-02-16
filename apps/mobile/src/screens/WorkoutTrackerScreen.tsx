import React, { useCallback } from 'react';
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

import { supabase } from '../lib/supabase';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
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
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const cardWidth = Dimensions.get('window').width * 0.45;
  const activityTypeCardWidth = Dimensions.get('window').width * 0.40;
  const activityTypeCardHeight = 140;
  const { data: streaks = [], isLoading: streaksLoading } = useUserStreaks();
  const mainStreak = streaks.find((s) => s.streak_type === 'workout' || s.streak_type === 'overall');
  const streakDisplay = streaksLoading ? '--' : String(mainStreak?.current_streak ?? 0);
  const { data: scheduleData } = useProgramSchedule();
  const moveCardTitle = scheduleData?.program?.title?.trim()
    ? scheduleData.program.title
    : 'Create your own program';
  const { data, isLoading } = useWorkoutTemplates();
  const templates = (data || []).slice(0, 5);
  const loading = isLoading;
  const { data: exercisesList = [], isLoading: exercisesLoading } = useExercises();
  const exercisesCarouselSlice = exercisesList.slice(0, 12);

  return (
    <View style={styles.container}>
      {showBackButton ? <FloatingBackButton onPress={() => navigation?.goBack()} /> : null}

      {/* Top Header Icons */}
      <View style={[styles.header, { paddingTop }]} />

      <ScrollView
        contentContainerStyle={styles.content}
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
            hideSubtitle
            hideCta
          />
        </View>

        {/* Exercises */}
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

        {/* Activity Types */}
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
              <ImageBackground
                source={item.source}
                resizeMode="cover"
                style={[styles.activityTypeBox, { width: activityTypeCardWidth, height: activityTypeCardHeight }]}
                imageStyle={styles.activityTypeImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.activityTypeTitleWrap}
                >
                  <Text style={styles.activityTypeTitle}>{item.title}</Text>
                </LinearGradient>
              </ImageBackground>
            </Pressable>
          ))}
        </ScrollView>

        {/* Workouts */}
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
          {loading ? (
            <ActivityIndicator color={colors.bodyOrange} />
          ) : templates.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginLeft: space.md }}>No workouts found. Create one to get started!</Text>
          ) : (
            templates.map(t => (
              <Pressable key={t.id} onPress={() => onStartTemplate?.(t.id)}>
                <LinearGradient
                  colors={['#424242', '#18181b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.templateCard, { width: activityTypeCardWidth, height: activityTypeCardHeight }]}
                >
                  <View style={styles.difficultyTag}>
                    <Text style={[styles.difficultyText, { color: colors.actionAmber }]}>{t.difficulty_level ?? '--'}</Text>
                  </View>
                  <Text style={styles.templateTitle} numberOfLines={2}>{t.title}</Text>

                  <View style={styles.templateStats}>
                    <View style={styles.statRow}>
                      <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textTertiary} />
                      <Text style={styles.statText}>{t.workout_template_exercises?.[0]?.count || 0} Exercises</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            )))}
        </ScrollView>

        {/* Workout Marketplace */}
        <View style={styles.marketplaceHeader}>
          <MaterialCommunityIcons name="storefront" size={20} color={colors.bodyOrange} />
          <Text style={styles.sectionTitle}>Workout Marketplace</Text>
        </View>

        <View style={styles.featuredCardContainer}>
          <LinearGradient
            colors={['#617873', '#0C1E1A']} // Approximate teal gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 1]}
            style={styles.featuredGradient}
          >
            <View style={styles.newDropTag}>
              <Text style={styles.newDropText}>NEW DROP</Text>
            </View>
            <Text style={styles.featuredTitle}>Elite Athlete Series</Text>
            <Text style={styles.featuredDesc}>Train like a pro with exclusive routines designed by olympic coaches.</Text>

            <Pressable style={styles.viewCollectionBtn}>
              <Text style={styles.viewCollectionText}>View Collection</Text>
            </Pressable>
          </LinearGradient>
        </View>

        <View style={styles.categoriesRow}>
          <View style={styles.categoryCard}>
            <View style={styles.catIconCircle}>
              <MaterialCommunityIcons name="account-group" size={24} color={colors.bodyOrange} />
            </View>
            <Text style={styles.catTitle}>Community</Text>
            <Text style={styles.catSub}>Top rated by users</Text>
          </View>
          <View style={styles.categoryCard}>
            <View style={styles.catIconCircle}>
              <MaterialCommunityIcons name="star" size={24} color={colors.bodyOrange} />
            </View>
            <Text style={styles.catTitle}>Premium</Text>
            <Text style={styles.catSub}>Verified coaches</Text>
          </View>
        </View>

        <Pressable style={styles.searchButton}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <Text style={styles.searchText}>Browse All Workouts</Text>
        </Pressable>

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
    paddingHorizontal: space.md,
    paddingBottom: space.xs,
    alignItems: 'center',
  },
  headerLeft: { width: 40 },
  headerRight: {
    flexDirection: 'row',
    gap: space.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  aiCircle: {
    borderColor: colors.bodyOrange,
  },
  aiText: {
    color: colors.bodyOrange,
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    paddingHorizontal: space.md,
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
  mainCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius['2xl'],
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.sm,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 0, 0.15)', // Orange opacity
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bodyOrange,
  },
  activeTagText: {
    color: colors.bodyOrange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  durationBig: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 24,
  },
  durationSmall: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  mainTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  progressSection: {
    marginBottom: space.lg,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: colors.bodyOrange,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.bodyOrange,
  },
  dayLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: space.md,
    textTransform: 'uppercase',
  },
  exerciseList: {
    gap: space.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  exerciseIndexCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIndexText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    backgroundColor: 'rgba(138, 112, 255, 0.15)', // Violet opacity
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bodyOrange,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.bodyOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },


  // Templates
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
  activityTypeBox: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  activityTypeImage: {
    borderRadius: radius.xl,
  },
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
  difficultyTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: space.sm,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
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

  // Marketplace
  marketplaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  featuredCardContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: space.md,
  },
  featuredGradient: {
    padding: space.lg,
    minHeight: 180,
  },
  newDropTag: {
    backgroundColor: colors.bodyOrange,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: space.sm,
  },
  newDropText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  featuredTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: space.xs,
  },
  featuredDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: space.lg,
    lineHeight: 18,
  },
  viewCollectionBtn: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  viewCollectionText: {
    color: 'black',
    fontWeight: '700',
    fontSize: 13,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: space.md,
    marginBottom: space.lg,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  catTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  catSub: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCharcoal,
    paddingVertical: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: space.sm,
  },
  searchText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

