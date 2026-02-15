import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useWorkoutSessions, type WorkoutSessionSummary, type SessionType } from '../hooks/useWorkoutSessions';

export type { SessionType, WorkoutSessionSummary };

type WorkoutHistoryScreenProps = {
  navigation?: { goBack: () => void };
  onSessionPress?: (sessionId: string) => void;
  sessions?: WorkoutSessionSummary[];
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayHeader(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const mon = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${mon} ${d.getDate()} • ${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const TYPE_CONFIG: Record<SessionType, { icon: string; color: string; label: string }> = {
  strength: { icon: 'dumbbell', color: colors.bodyOrange, label: 'Strength' },
  cardio: { icon: 'run', color: colors.primaryIndigo, label: 'Cardio' },
  yoga: { icon: 'meditation', color: colors.healthGreen, label: 'Yoga' },
  hiit: { icon: 'lightning-bolt', color: colors.actionAmber, label: 'HIIT' },
  general: { icon: 'dumbbell', color: colors.textTertiary, label: 'General' },
};

export function WorkoutHistoryScreen({
  navigation,
  onSessionPress,
  sessions: sessionsProp,
}: WorkoutHistoryScreenProps) {
  const { data: sessionsData, isLoading, isError } = useWorkoutSessions();
  const sessions = sessionsProp ?? sessionsData ?? [];

  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthKey = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

  const filteredByMonth = useMemo(() => {
    return sessions.filter((s) => getMonthKey(new Date(s.performed_at)) === monthKey);
  }, [sessions, monthKey]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, WorkoutSessionSummary[]>();
    const sorted = [...filteredByMonth].sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime());
    sorted.forEach((s) => {
      const key = getDayKey(s.performed_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
  }, [filteredByMonth]);

  const goPrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const monthLabel = `${MONTH_NAMES[selectedMonth.month]} ${selectedMonth.year}`;

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <View style={[styles.header, { paddingTop }]}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Workout History</Text>
        <Pressable style={styles.headerRight} accessibilityLabel="Calendar">
          <MaterialCommunityIcons name="calendar" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.monthRow}>
        <Pressable onPress={goPrevMonth} style={styles.monthArrow} accessibilityLabel="Previous month">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={goNextMonth} style={styles.monthArrow} accessibilityLabel="Next month">
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={colors.bodyOrange} />
            <Text style={styles.emptySub}>Loading history…</Text>
          </View>
        ) : isError ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Could not load history</Text>
            <Text style={styles.emptySub}>Pull to retry or try again later.</Text>
          </View>
        ) : groupedByDay.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No workouts this month</Text>
            <Text style={styles.emptySub}>Complete a workout from My Workouts to see it here.</Text>
          </View>
        ) : (
          groupedByDay.map(({ day, items }) => (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayHeader}>{formatDayHeader(items[0].performed_at).toUpperCase()}</Text>
              {items.map((session) => {
                const config = TYPE_CONFIG[session.session_type];
                return (
                  <Pressable key={session.id} style={styles.card} onPress={() => onSessionPress?.(session.id)}>
                    <View style={[styles.iconCircle, { backgroundColor: config.color + '30' }]}>
                      <MaterialCommunityIcons name={config.icon as any} size={28} color={config.color} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{session.title}</Text>
                      <Text style={styles.cardSubtitle}>{formatDateShort(session.performed_at)}</Text>
                      <View style={styles.badgesRow}>
                        {session.duration_minutes != null && (
                          <View style={styles.badge}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textTertiary} />
                            <Text style={styles.badgeText}>{session.duration_minutes}m</Text>
                          </View>
                        )}
                        {session.calories_burned != null && (
                          <View style={styles.badge}>
                            <MaterialCommunityIcons name="fire" size={12} color={colors.textTertiary} />
                            <Text style={styles.badgeText}>{session.calories_burned} kcal</Text>
                          </View>
                        )}
                        {session.total_weight_kg != null && (
                          <View style={styles.badge}>
                            <MaterialCommunityIcons name="weight-lifter" size={12} color={colors.textTertiary} />
                            <Text style={styles.badgeText}>{session.total_weight_kg.toLocaleString()} kg</Text>
                          </View>
                        )}
                        {session.distance_km != null && (
                          <View style={styles.badge}>
                            <MaterialCommunityIcons name="map-marker" size={12} color={colors.textTertiary} />
                            <Text style={styles.badgeText}>{session.distance_km} km</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMidnight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  headerLeft: { width: 40 },
  headerTitle: { ...typography.xl, fontWeight: '700', color: colors.textPrimary },
  headerRight: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
  monthArrow: { padding: space.xs },
  monthLabel: { ...typography.lg, fontWeight: '600', color: colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.md, paddingBottom: 100 },
  daySection: { marginBottom: space.lg },
  dayHeader: { ...typography.xs, fontWeight: '700', color: colors.textTertiary, marginBottom: space.sm, letterSpacing: 0.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.base, fontWeight: '700', color: colors.textPrimary, marginBottom: space['2xs'] },
  cardSubtitle: { ...typography.sm, color: colors.textTertiary, marginBottom: space.xs },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bgCharcoal, paddingHorizontal: 6, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { ...typography.xs, color: colors.textSecondary },
  emptyWrap: { paddingVertical: space['2xl'] * 2, alignItems: 'center', gap: space.sm },
  emptyTitle: { ...typography.lg, fontWeight: '700', color: colors.textPrimary },
  emptySub: { ...typography.sm, color: colors.textTertiary },
  bottomSpacer: { height: space.xl },
});
