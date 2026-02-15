import React, { useMemo, useState } from 'react';
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
import { RadialMetric } from '../components/RadialMetric';
import { ProgressBar } from '../components/ProgressBar';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useHabits, useHabitCompletions } from '../hooks/useHabits';
import { toDateString, isHabitScheduledOnDay } from '../utils/habitInsightsUtils';
import type { Habit } from '../types/habits';

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function HabitDailyInsightsScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const today = new Date();
  const todayStr = toDateString(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const weekStart = getWeekStart(new Date(selectedDateStr + 'T12:00:00'));
  const weekDays = useMemo(() => {
    const out: { dateStr: string; dayOfWeek: number; label: string; dayNum: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateString(d);
      out.push({
        dateStr,
        dayOfWeek: d.getDay(),
        label: DAY_LABELS[d.getDay()],
        dayNum: d.getDate().toString(),
      });
    }
    return out;
  }, [weekStart]);

  const startStr = toDateString(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const endStr = toDateString(endDate);

  const fourWeeksStart = new Date(weekStart);
  fourWeeksStart.setDate(fourWeeksStart.getDate() - 7 * 3);
  const fourWeeksStartStr = toDateString(fourWeeksStart);

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: completions = [] } = useHabitCompletions(startStr, endStr);
  const { data: fourWeeksCompletions = [] } = useHabitCompletions(fourWeeksStartStr, endStr);

  const selectedDayOfWeek = useMemo(
    () => new Date(selectedDateStr + 'T12:00:00').getDay(),
    [selectedDateStr]
  );
  const habitsDueSelectedDay = useMemo(
    () => habits.filter((h) => isHabitScheduledOnDay(h, selectedDayOfWeek)),
    [habits, selectedDayOfWeek]
  );
  const completionsForSelectedDay = useMemo(
    () =>
      completions.filter(
        (c) => c.completion_date === selectedDateStr
      ),
    [completions, selectedDateStr]
  );
  const completedCount = useMemo(
    () => completionsForSelectedDay.filter((c) => c.completed).length,
    [completionsForSelectedDay]
  );
  const dueCount = habitsDueSelectedDay.length;
  const donePct = dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : 100;
  const awayFromPerfect = dueCount - completedCount;

  const breakdown = useMemo(() => {
    return habitsDueSelectedDay.map((habit) => {
      const comp = completionsForSelectedDay.find((c) => c.habit_id === habit.id);
      const completed = comp?.completed ?? false;
      const progressPct = comp?.progress_pct ?? null;
      let status: 'success' | 'in_progress' | 'incomplete' = 'incomplete';
      if (completed) status = 'success';
      else if (progressPct != null && progressPct > 0 && progressPct < 100) status = 'in_progress';
      return { habit, completed, progressPct, status };
    });
  }, [habitsDueSelectedDay, completionsForSelectedDay]);

  const fourWeekPcts = useMemo(() => {
    const pcts: number[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStartDate = new Date(fourWeeksStart);
      weekStartDate.setDate(weekStartDate.getDate() + w * 7);
      let goodDays = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        const dateStr = toDateString(d);
        const dayOfWeek = d.getDay();
        const due = habits.filter((h) => isHabitScheduledOnDay(h, dayOfWeek));
        if (due.length === 0) {
          goodDays += 1;
          continue;
        }
        const completedThatDay = fourWeeksCompletions.filter(
          (c) => c.completion_date === dateStr && c.completed
        ).length;
        if (completedThatDay >= due.length) goodDays += 1;
      }
      pcts.push(Math.round((goodDays / 7) * 100));
    }
    return pcts;
  }, [habits, fourWeeksCompletions, fourWeeksStart]);

  const selectedDayName = useMemo(() => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDateStr]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Habit Insights</Text>
        <View style={styles.headerRight} />
      </View>

      <EnvironmentContainer>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow} contentContainerStyle={styles.dateRowContent}>
          {weekDays.map(({ dateStr, label, dayNum }) => {
            const isSelected = dateStr === selectedDateStr;
            return (
              <Pressable
                key={dateStr}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                onPress={() => setSelectedDateStr(dateStr)}
              >
                <Text style={[styles.dateChipLabel, isSelected && styles.dateChipLabelSelected]}>{label}</Text>
                <Text style={[styles.dateChipDay, isSelected && styles.dateChipDaySelected]}>{dayNum}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Section spacing="md">
          <View style={styles.radialCard}>
            {habitsLoading ? (
              <ActivityIndicator size="large" color={colors.primaryViolet} />
            ) : (
              <>
                <RadialMetric
                  value={`${donePct}%`}
                  statusText="DONE"
                  statusColor={colors.primaryViolet}
                />
                <Text style={styles.radialSubtext}>
                  {awayFromPerfect <= 0
                    ? 'Perfect consistency today!'
                    : (
                      <>
                        Great consistency today! You're{' '}
                        <Text style={styles.radialHighlight}>{awayFromPerfect}</Text>
                        {' '}habit{awayFromPerfect === 1 ? '' : 's'}{' '}
                        <Text style={styles.radialHighlight}>away from a perfect streak.</Text>
                      </>
                    )}
                </Text>
              </>
            )}
          </View>
        </Section>

        <Section spacing="md">
          <View style={styles.breakdownHeader}>
            <Text style={styles.sectionLabel}>BREAKDOWN</Text>
            <Text style={styles.sectionDayName}>{selectedDayName}</Text>
          </View>
          {habitsLoading ? (
            <ActivityIndicator size="small" color={colors.primaryViolet} />
          ) : (
            breakdown.map(({ habit, completed, progressPct, status }) => (
              <View key={habit.id} style={styles.breakdownRow}>
                <View style={[styles.breakdownIcon, { backgroundColor: habit.color_hex || colors.primaryViolet }]}>
                  <MaterialCommunityIcons
                    name={(habit.icon as any) || 'checkbox-marked-circle'}
                    size={20}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={styles.breakdownContent}>
                  <Text style={styles.breakdownTitle}>{habit.name}</Text>
                  <Text
                    style={[
                      styles.breakdownStatus,
                      status === 'success' && styles.breakdownStatusSuccess,
                      status === 'in_progress' && styles.breakdownStatusProgress,
                    ]}
                  >
                    {status === 'success' ? 'SUCCESS' : status === 'in_progress' ? 'IN PROGRESS' : 'INCOMPLETE'}
                  </Text>
                  {progressPct != null && progressPct > 0 && (
                    <ProgressBar value={progressPct} height={6} color={colors.primaryViolet} />
                  )}
                </View>
                {completed ? (
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.healthGreen} />
                ) : (
                  <MaterialCommunityIcons name="circle-outline" size={24} color={colors.textTertiary} />
                )}
              </View>
            ))
          )}
        </Section>

        <Section spacing="md">
          <Text style={styles.sectionLabel}>4-WEEK CONSISTENCY</Text>
          <View style={styles.fourWeekRow}>
            {fourWeekPcts.map((pct, i) => (
              <View key={i} style={styles.fourWeekBar}>
                <View style={[styles.fourWeekTrack, { height: 60 }]}>
                  <View
                    style={[
                      styles.fourWeekFill,
                      { height: `${Math.min(100, pct)}%`, backgroundColor: colors.primaryViolet },
                    ]}
                  />
                </View>
                <Text style={styles.fourWeekPct}>{pct}%</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={{ height: 40 }} />
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
  headerTitle: { ...typography.lg, fontWeight: '700', color: colors.textPrimary },
  headerRight: { width: 40 },
  dateRow: { marginBottom: space.md },
  dateRowContent: { gap: space.sm, paddingHorizontal: space.xs },
  dateChip: {
    width: 52,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.lg,
  },
  dateChipSelected: { backgroundColor: colors.primaryViolet },
  dateChipLabel: { ...typography.xs, color: colors.textTertiary, fontWeight: '600' },
  dateChipLabelSelected: { color: colors.textSecondary },
  dateChipDay: { ...typography.sm, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  dateChipDaySelected: { color: colors.textPrimary },
  radialCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  radialSubtext: {
    ...typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
  },
  radialHighlight: { color: colors.primaryViolet, fontWeight: '600' },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  sectionDayName: { ...typography.sm, color: colors.textSecondary },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.sm,
  },
  breakdownContent: { flex: 1 },
  breakdownTitle: { ...typography.base, fontWeight: '600', color: colors.textPrimary },
  breakdownStatus: { ...typography.xs, color: colors.textTertiary, marginTop: 2 },
  breakdownStatusSuccess: { color: colors.healthGreen },
  breakdownStatusProgress: { color: colors.primaryViolet },
  fourWeekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  fourWeekBar: { flex: 1, alignItems: 'center' },
  fourWeekTrack: {
    width: 24,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fourWeekFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  fourWeekPct: { ...typography.xs, color: colors.textTertiary, marginTop: space.xs },
});
