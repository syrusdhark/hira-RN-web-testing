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
} from 'react-native';

import { supabase } from '../lib/supabase';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { NextWorkoutCard } from '../components/OverviewCards';

type WorkoutTrackerScreenProps = {
  navigation?: { goBack: () => void };
  onNavigateToProgram?: () => void;
  onNavigateToTemplateCreate?: () => void;
  onNavigateToMyWorkouts?: () => void;
  onEditTemplate?: (templateId: string) => void;
  onNavigateToWorkoutInsights?: () => void;
  showBackButton?: boolean;
};

export function WorkoutTrackerScreen({
  navigation,
  onNavigateToProgram,
  onNavigateToTemplateCreate,
  onNavigateToMyWorkouts,
  onEditTemplate,
  onNavigateToWorkoutInsights,
  showBackButton = true,
}: WorkoutTrackerScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const cardWidth = Dimensions.get('window').width * 0.45;
  const { data, isLoading } = useWorkoutTemplates();
  const templates = (data || []).slice(0, 5);
  const loading = isLoading;

  return (
    <View style={styles.container}>
      {showBackButton ? <FloatingBackButton onPress={() => navigation?.goBack()} /> : null}

      {/* Top Header Icons */}
      <View style={[styles.header, { paddingTop }]} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.moveCardWrap}>
          <NextWorkoutCard
            fullWidth
            title="MOVE"
            onPress={onNavigateToProgram}
            workoutName="Create your own program"
            hideSubtitle
            hideCta
          />
        </View>

        {/* Workout Insights */}
        {onNavigateToWorkoutInsights ? (
          <Pressable style={styles.insightsCard} onPress={onNavigateToWorkoutInsights}>
            <MaterialCommunityIcons name="chart-box-outline" size={22} color={colors.primaryViolet} />
            <Text style={styles.insightsCardText}>Muscle intensity</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
          </Pressable>
        ) : null}

        {/* Start Workout Action */}


        {/* My Workouts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Workouts</Text>
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
              <Pressable key={t.id} onPress={() => onEditTemplate?.(t.id)}>
                <LinearGradient
                  colors={['#424242', '#18181b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.templateCard, { width: Dimensions.get('window').width * 0.42 }]}
                >
                  <View style={styles.difficultyTag}>
                    <Text style={[styles.difficultyText, { color: colors.actionAmber }]}>{t.difficulty_level || 'General'}</Text>
                  </View>
                  <Text style={styles.templateTitle} numberOfLines={2}>{t.title}</Text>

                  <View style={styles.templateStats}>
                    <View style={styles.statRow}>
                      <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textTertiary} />
                      <Text style={styles.statText}>{t.workout_template_exercises?.[0]?.count || 0} Exercises</Text>
                    </View>
                    <View style={styles.statRow}>
                      <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.statText}>{t.estimated_duration ? `${t.estimated_duration}m` : 'N/A'}</Text>
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
    paddingBottom: space.md,
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
    paddingTop: space.xl,
  },
  moveCardWrap: {
    marginTop: space.lg,
    marginBottom: space.lg,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: space.sm,
    height: 44, // 2 lines roughly
  },
  templateStats: {
    gap: 6,
    marginBottom: space.md,
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
  insightsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.lg,
    gap: space.sm,
  },
  insightsCardText: {
    flex: 1,
    ...typography.base,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});

