import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius } from '../theme';
import { Section } from '../components/Section';
import { CardGrid } from '../components/CardGrid';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useHabits, useHabitCompletions, useDeleteHabit, useUpsertHabitCompletion } from '../hooks/useHabits';
import type { Habit, HabitCompletion } from '../types/habits';

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekEnd(d: Date): Date {
  const start = getWeekStart(d);
  start.setDate(start.getDate() + 6);
  return start;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isHabitScheduledOnDay(habit: Habit, dayOfWeek: number): boolean {
  if (habit.frequency === 'daily') return true;
  if (!habit.schedule_days?.length) return true;
  return habit.schedule_days.includes(dayOfWeek);
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDay();
}

export function HabitTrackerScreen({
  navigation,
  onNavigateToHabitInsights,
  onNavigateToCreateHabit,
  onNavigateToEditHabit,
  onNavigateToDailyInsights,
}: {
  navigation: { goBack: () => void };
  onNavigateToHabitInsights?: (habitId: string) => void;
  onNavigateToCreateHabit?: () => void;
  onNavigateToEditHabit?: (habitId: string) => void;
  onNavigateToDailyInsights?: () => void;
}) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const today = new Date();
  const todayStr = toDateString(today);
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  const startStr = toDateString(weekStart);
  const endStr = toDateString(weekEnd);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  const lastStartStr = toDateString(lastWeekStart);
  const lastEndStr = toDateString(lastWeekEnd);

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: completionsThisWeek = [] } = useHabitCompletions(startStr, endStr);
  const { data: completionsLastWeek = [] } = useHabitCompletions(lastStartStr, lastEndStr);
  const deleteHabit = useDeleteHabit();
  const upsertCompletion = useUpsertHabitCompletion();

  const dayLabels = useMemo(() => ['S', 'M', 'T', 'W', 'T', 'F', 'S'], []);
  const weekDays = useMemo(() => {
    const out: { date: Date; dateStr: string; dayOfWeek: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      out.push({ date: d, dateStr: toDateString(d), dayOfWeek: i });
    }
    return out;
  }, [weekStart]);

  const { weeklyConsistencyPct, weeklyConsistencyUpFromLast, dayBars } = useMemo(() => {
    let thisWeekGoodDays = 0;
    const bars: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateString(d);
      const dayOfWeek = d.getDay();
      const dueHabits = habits.filter((h) => isHabitScheduledOnDay(h, dayOfWeek));
      if (dueHabits.length === 0) {
        bars.push(100);
        thisWeekGoodDays += 1;
        continue;
      }
      const completedCount = completionsThisWeek.filter(
        (c) => c.completion_date === dateStr && c.completed
      ).length;
      const pct = dueHabits.length ? (completedCount / dueHabits.length) * 100 : 100;
      bars.push(pct);
      if (pct >= 100) thisWeekGoodDays += 1;
    }
    const thisPct = Math.round((thisWeekGoodDays / 7) * 100);

    let lastWeekGoodDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateString(d);
      const dayOfWeek = d.getDay();
      const dueHabits = habits.filter((h) => isHabitScheduledOnDay(h, dayOfWeek));
      if (dueHabits.length === 0) {
        lastWeekGoodDays += 1;
        continue;
      }
      const completedCount = completionsLastWeek.filter(
        (c) => c.completion_date === dateStr && c.completed
      ).length;
      if (completedCount >= dueHabits.length) lastWeekGoodDays += 1;
    }
    const lastPct = Math.round((lastWeekGoodDays / 7) * 100);
    const upFromLast = thisPct - lastPct;

    return {
      weeklyConsistencyPct: thisPct,
      weeklyConsistencyUpFromLast: upFromLast,
      dayBars: bars,
    };
  }, [habits, completionsThisWeek, completionsLastWeek, weekStart, lastWeekStart]);

  const todayCompletionsByHabit = useMemo(() => {
    const map: Record<string, HabitCompletion> = {};
    completionsThisWeek.forEach((c) => {
      if (c.completion_date === todayStr) map[c.habit_id] = c;
    });
    return map;
  }, [completionsThisWeek, todayStr]);

  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const getStatusForHabit = (habit: Habit): 'completed' | 'incomplete' | 'missed' => {
    const comp = todayCompletionsByHabit[habit.id];
    const dayOfWeek = getDayOfWeek(todayStr);
    if (!isHabitScheduledOnDay(habit, dayOfWeek)) return 'incomplete';
    if (comp?.completed) return 'completed';
    return 'incomplete';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Habit Tracker</Text>
        <Pressable onPress={onNavigateToDailyInsights} style={styles.insightsButton}>
          <Text style={styles.insightsButtonText}>Insights</Text>
        </Pressable>
      </View>

      <EnvironmentContainer>
        <Text style={styles.dateText}>{dateFormatted}</Text>

        <Section spacing="md">
          <Text style={styles.sectionLabel}>WEEKLY CONSISTENCY</Text>
          {habitsLoading ? (
            <ActivityIndicator size="small" color={colors.primaryViolet} style={{ marginVertical: space.sm }} />
          ) : (
            <>
              <View style={styles.consistencyRow}>
                <Text style={styles.consistencyPct}>{weeklyConsistencyPct}%</Text>
                <Text style={styles.consistencySub}>
                  {weeklyConsistencyUpFromLast >= 0 ? '+' : ''}{weeklyConsistencyUpFromLast}% from last week
                </Text>
              </View>
              <View style={styles.barChartRow}>
                {dayBars.map((pct, i) => (
                  <View key={i} style={styles.barWrapper}>
                    <View style={[styles.barTrack, { height: 60 }]}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.min(100, pct)}%`, backgroundColor: colors.primaryViolet },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{dayLabels[i]}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Section>

        <Section spacing="md">
          <View style={styles.myHabitsHeader}>
            <Text style={styles.sectionLabel}>MY HABITS</Text>
            <Pressable hitSlop={8}>
              <Text style={styles.showButton}>SHOW</Text>
            </Pressable>
          </View>
          {habitsLoading ? (
            <ActivityIndicator size="small" color={colors.primaryViolet} style={{ marginVertical: space.sm }} />
          ) : (
            <CardGrid>
              {habits.map((habit) => {
                const status = getStatusForHabit(habit);
                return (
                  <Pressable
                    key={habit.id}
                    style={({ pressed }) => [
                      styles.habitCard,
                      { borderColor: (habit.color_hex || colors.primaryViolet) + '40' },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => onNavigateToHabitInsights?.(habit.id)}
                    onLongPress={() => {
                      Alert.alert(habit.name, undefined, [
                        { text: 'Edit', onPress: () => onNavigateToEditHabit?.(habit.id) },
                        { text: 'Delete', style: 'destructive', onPress: () => {
                          Alert.alert('Delete habit', `Delete "${habit.name}"? This will remove all completion history.`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteHabit.mutate(habit.id) },
                          ]);
                        }},
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }}
                  >
                    <View style={[styles.habitCardIcon, { backgroundColor: habit.color_hex || colors.primaryViolet }]}>
                      <MaterialCommunityIcons
                        name={(habit.icon as any) || 'checkbox-marked-circle'}
                        size={24}
                        color={colors.textPrimary}
                      />
                    </View>
                    <Text style={styles.habitCardTitle} numberOfLines={1}>{habit.name}</Text>
                    <View style={styles.habitCardStatusRow}>
                      <View style={styles.habitCardStatusLeft}>
                        {status === 'completed' ? (
                          <Text style={styles.habitCardStatusText}>COMPLETED</Text>
                        ) : (
                          <>
                            <View style={styles.orangeDot} />
                            <Text style={styles.habitCardStatusText}>INCOMPLETE</Text>
                          </>
                        )}
                      </View>
                      <Pressable
                        hitSlop={12}
                        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          const completed = todayCompletionsByHabit[habit.id]?.completed ?? false;
                          if (completed) {
                            Alert.alert(
                              'Are you sure to uncheck this?',
                              undefined,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Uncheck',
                                  onPress: () =>
                                    upsertCompletion.mutate({
                                      habitId: habit.id,
                                      completionDate: todayStr,
                                      completed: false,
                                    }),
                                },
                              ]
                            );
                          } else {
                            upsertCompletion.mutate({
                              habitId: habit.id,
                              completionDate: todayStr,
                              completed: true,
                            });
                          }
                        }}
                      >
                        {status === 'completed' ? (
                          <MaterialCommunityIcons name="check-circle" size={24} color={colors.healthGreen} />
                        ) : (
                          <MaterialCommunityIcons name="circle-outline" size={24} color={colors.textTertiary} />
                        )}
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
              <Pressable
                style={({ pressed }) => [styles.addHabitCard, pressed && { opacity: 0.8 }]}
                onPress={onNavigateToCreateHabit}
              >
                <MaterialCommunityIcons name="plus" size={32} color={colors.textTertiary} />
                <Text style={styles.addHabitCardText}>ADD HABIT</Text>
              </Pressable>
            </CardGrid>
          )}
        </Section>

        <View style={{ height: 80 }} />
      </EnvironmentContainer>
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
  headerTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  insightsButton: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.sm,
  },
  insightsButtonText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.primaryViolet,
  },
  dateText: {
    ...typography.base,
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  consistencyRow: {
    marginBottom: space.sm,
  },
  consistencyPct: {
    ...typography['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  consistencySub: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: space['2xs'],
  },
  barChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    minHeight: 4,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    marginTop: space['2xs'],
  },
  myHabitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  showButton: {
    ...typography.xs,
    color: colors.primaryIndigo,
    fontWeight: '600',
  },
  habitCard: {
    width: '48.5%',
    minHeight: 120,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
  },
  habitCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  habitCardTitle: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: space.xs,
  },
  habitCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  habitCardStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    flex: 1,
  },
  habitCardStatusText: {
    ...typography.xs,
    color: colors.textSecondary,
  },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.bodyOrange,
  },
  addHabitCard: {
    width: '48.5%',
    minHeight: 120,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.md,
  },
  addHabitCardText: {
    ...typography.sm,
    color: colors.textTertiary,
    marginTop: space.xs,
  },
});
