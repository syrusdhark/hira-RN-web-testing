import React, { useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius } from '../theme';
import { Section } from '../components/Section';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useHabit, useHabitCompletions, useDeleteHabit } from '../hooks/useHabits';
import {
  toDateString,
  getCurrentStreak,
  getBestStreak,
  getRate,
  getLast7DaysCompletion,
  getMonthGrid,
  getVsLastMonth,
  type DayCompletion,
} from '../utils/habitInsightsUtils';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getAICoachMessage(
  habitName: string,
  rate7: number,
  currentStreak: number,
  totalCompletions: number
): { line1: string; highlight: string; line2: string } {
  if (totalCompletions === 0) {
    return {
      line1: "Add your first completion to see insights and tips here.",
      highlight: "",
      line2: "",
    };
  }
  if (rate7 >= 100 && currentStreak >= 7) {
    return {
      line1: `Great job! You're `,
      highlight: '100% consistent',
      line2: ` with ${habitName} this week. Keep the streak going!`,
    };
  }
  if (rate7 >= 80) {
    return {
      line1: `You're `,
      highlight: `${rate7}% consistent`,
      line2: ` with ${habitName} this week. Small steps add up.`,
    };
  }
  if (currentStreak > 0) {
    return {
      line1: `${currentStreak} day streak with ${habitName}. `,
      highlight: 'Keep it up',
      line2: " — log today to extend it.",
    };
  }
  return {
    line1: `You've logged ${habitName} ${totalCompletions} time${totalCompletions === 1 ? '' : 's'} recently. `,
    highlight: 'Log today',
    line2: " to start a new streak.",
  };
}

export function HabitInsightsScreen({
  navigation,
  habitId,
  initialDate: _initialDate,
  onNavigateToEditHabit,
}: {
  navigation: { goBack: () => void };
  habitId?: string | null;
  initialDate?: string | null;
  onNavigateToEditHabit?: (habitId: string) => void;
}) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const today = new Date();
  const todayStr = toDateString(today);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startStr = toDateString(ninetyDaysAgo);

  const { data: habit, isLoading: habitLoading } = useHabit(habitId ?? null);
  const { data: completions = [] } = useHabitCompletions(startStr, todayStr);
  const deleteHabit = useDeleteHabit();

  const completionDates = useMemo(() => {
    if (!habitId) return [];
    return completions
      .filter((c) => c.habit_id === habitId && c.completed)
      .map((c) => c.completion_date);
  }, [habitId, completions]);

  const currentStreak = useMemo(
    () => (habit ? getCurrentStreak(habit, completionDates, today) : 0),
    [habit, completionDates, today]
  );
  const bestStreak = useMemo(() => {
    if (!habit) return 0;
    return getBestStreak(habit, completionDates, ninetyDaysAgo, today);
  }, [habit, completionDates]);
  const rate7 = useMemo(
    () => (habit ? getRate(habit, completionDates, 7, today) : 0),
    [habit, completionDates]
  );
  const totalLast30 = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = toDateString(cutoff);
    return completionDates.filter((d) => d >= cutoffStr).length;
  }, [completionDates, today]);
  const last7Days = useMemo(
    () => (habit ? getLast7DaysCompletion(habit, completionDates, today) : []),
    [habit, completionDates]
  );
  const monthGrid = useMemo(() => {
    if (!habit) return [];
    return getMonthGrid(habit, completionDates, today.getFullYear(), today.getMonth());
  }, [habit, completionDates, today]);
  const vsLastMonth = useMemo(
    () => (habit ? getVsLastMonth(habit, completionDates, today) : null),
    [habit, completionDates, today]
  );

  useEffect(() => {
    if (!habitId) return;
    if (!habitLoading && habit == null) {
      navigation.goBack();
    }
  }, [habitId, habit, habitLoading, navigation]);

  const showMenu = () => {
    if (!habitId) return;
    Alert.alert('Habit', undefined, [
      { text: 'Edit habit', onPress: () => onNavigateToEditHabit?.(habitId) },
      {
        text: 'Delete habit',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete habit',
            'This will remove all completion history for this habit.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteHabit.mutate(habitId);
                  navigation.goBack();
                },
              },
            ]
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!habitId) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Habit</Text>
          <View style={styles.menuButton} />
        </View>
        <EnvironmentContainer>
          <Section spacing="md">
            <Text style={styles.emptyText}>Select a habit to view insights.</Text>
          </Section>
        </EnvironmentContainer>
      </View>
    );
  }

  if (habitLoading || !habit) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Habit</Text>
          <View style={styles.menuButton} />
        </View>
        <EnvironmentContainer>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primaryViolet} />
          </View>
        </EnvironmentContainer>
      </View>
    );
  }

  const aiMessage = getAICoachMessage(habit.name, rate7, currentStreak, totalLast30);
  const monthName = MONTH_NAMES[today.getMonth()];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{habit.name}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => onNavigateToEditHabit?.(habitId)} style={styles.iconButton}>
            <MaterialCommunityIcons name="pencil" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={showMenu} style={styles.iconButton}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <EnvironmentContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Section spacing="md">
            <View style={styles.streakCard}>
              <MaterialCommunityIcons name="fire" size={48} color={colors.primaryViolet} />
              <Text style={styles.streakValue}>{currentStreak} Day Streak</Text>
              {vsLastMonth != null && (
                <Text style={[styles.streakSub, vsLastMonth >= 0 && { color: colors.healthGreen }]}>
                  {vsLastMonth >= 0 ? '+' : ''}{vsLastMonth}% vs last month
                </Text>
              )}
            </View>
          </Section>

          <Section spacing="md">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>WEEKLY ACTIVITY</Text>
              <Text style={styles.sectionSub}>Past 7 Days</Text>
            </View>
            <View style={styles.weeklyChart}>
              {last7Days.map((day: DayCompletion, i: number) => (
                <View key={day.dateStr} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: day.completed ? 48 : 4, backgroundColor: day.completed ? colors.primaryViolet : colors.bgElevated },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.dayLabel}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section spacing="md">
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Rate</Text>
                <Text style={styles.metricValue}>{rate7}%</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total</Text>
                <Text style={styles.metricValue}>{totalLast30}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Best</Text>
                <Text style={styles.metricValue}>{bestStreak}d</Text>
              </View>
            </View>
          </Section>

          <Section spacing="md">
            <Text style={styles.sectionLabel}>{monthName.toUpperCase()} CONSISTENCY</Text>
            <View style={styles.monthGrid}>
              {monthGrid.map((row, ri) => (
                <View key={ri} style={styles.monthRow}>
                  {row.map((cell, ci) => (
                    <View
                      key={ci}
                      style={[
                        styles.monthCell,
                        cell === 'completed' && styles.monthCellCompleted,
                        cell === 'missed' && styles.monthCellMissed,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </Section>

          <Section spacing="md">
            <View style={styles.aiCard}>
              <View style={styles.aiPill}>
                <MaterialCommunityIcons name="sparkles" size={14} color={colors.textPrimary} />
                <Text style={styles.aiPillText}>AI COACH</Text>
              </View>
              <Text style={styles.aiText}>
                {aiMessage.line1}
                {aiMessage.highlight ? (
                  <Text style={styles.aiHighlight}>{aiMessage.highlight}</Text>
                ) : null}
                {aiMessage.line2}
              </Text>
            </View>
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </EnvironmentContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMidnight },
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
  headerTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: space.sm,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuButton: { width: 40, height: 40 },
  loadingWrap: { paddingVertical: space['2xl'], alignItems: 'center' },
  emptyText: { ...typography.base, color: colors.textSecondary, textAlign: 'center' },
  streakCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  streakValue: {
    ...typography['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: space.sm,
  },
  streakSub: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: space.xs,
  },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  sectionSub: { ...typography.xs, color: colors.textTertiary },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: 20,
    height: 52,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { ...typography.xs, color: colors.textTertiary, marginTop: space.xs },
  metricsRow: { flexDirection: 'row', gap: space.sm },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricLabel: { ...typography.xs, color: colors.textTertiary, marginBottom: space.xs },
  metricValue: { ...typography.xl, fontWeight: '700', color: colors.primaryViolet },
  monthGrid: { alignSelf: 'flex-start' },
  monthRow: { flexDirection: 'row', marginBottom: 2 },
  monthCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.bgElevated,
    marginRight: 2,
  },
  monthCellCompleted: { backgroundColor: colors.primaryViolet },
  monthCellMissed: { backgroundColor: colors.borderDefault },
  aiCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryViolet,
    paddingHorizontal: space.sm,
    paddingVertical: space['2xs'],
    borderRadius: radius.full,
    gap: space['2xs'],
    marginBottom: space.sm,
  },
  aiPillText: { ...typography.xs, fontWeight: '600', color: colors.textPrimary },
  aiText: { ...typography.sm, color: colors.textSecondary, lineHeight: 22 },
  aiHighlight: { color: colors.primaryViolet, fontWeight: '600' },
});
