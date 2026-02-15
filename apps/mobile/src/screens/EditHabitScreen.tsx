import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, space, radius } from '../theme';
import { Section } from '../components/Section';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useHabit, useUpdateHabit } from '../hooks/useHabits';
import type { HabitCategory } from '../types/habits';

const CATEGORIES: HabitCategory[] = ['Health', 'Productivity', 'Mindfulness', 'Social', 'Custom'];
const COLORS = ['#8A70FF', '#E91E8C', '#FF5C00', '#FFB000', '#2DFF8F', '#00F0FF', '#5C8DFF', '#71717A'];
const ICONS = ['leaf', 'dumbbell', 'fire', 'brain', 'star', 'water', 'run', 'meditation'];

function parseReminderTime(t: string | null): Date | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return null;
  const d = new Date(0, 0, 0, h || 0, m || 0, 0);
  return d;
}

export function EditHabitScreen({
  habitId,
  navigation,
}: {
  habitId: string | null;
  navigation: { goBack: () => void };
}) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { data: habit, isLoading: habitLoading } = useHabit(habitId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Health');
  const [frequency, setFrequency] = useState<'daily' | 'custom'>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [colorHex, setColorHex] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number | null>(30);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [whyText, setWhyText] = useState('');

  useEffect(() => {
    if (!habit) return;
    setName(habit.name);
    setCategory((habit.category as HabitCategory) || 'Health');
    setFrequency(habit.frequency);
    setScheduleDays(habit.schedule_days && habit.schedule_days.length ? habit.schedule_days : [1, 2, 3, 4, 5]);
    setColorHex(habit.color_hex || COLORS[0]);
    setIcon(habit.icon || ICONS[0]);
    setDailyGoalMinutes(habit.daily_goal_minutes);
    setReminderTime(parseReminderTime(habit.reminder_time));
    setWhyText(habit.why_text || '');
  }, [habit]);

  const updateHabit = useUpdateHabit();

  const toggleScheduleDay = (day: number) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    if (!habitId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a habit name.');
      return;
    }
    try {
      await updateHabit.mutateAsync({
        id: habitId,
        name: trimmed,
        category,
        frequency,
        schedule_days: frequency === 'custom' ? scheduleDays : null,
        color_hex: colorHex,
        icon,
        daily_goal_minutes: dailyGoalMinutes,
        reminder_time: reminderTime
          ? `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}:00`
          : null,
        why_text: whyText.trim() || null,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not update habit.');
    }
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayValues = [1, 2, 3, 4, 5, 6, 0];

  if (!habitId) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Habit</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No habit selected</Text>
        </View>
      </View>
    );
  }

  if (habitLoading || !habit) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop }]}>
          <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Habit</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryViolet} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Habit</Text>
        <View style={{ width: 40 }} />
      </View>

      <EnvironmentContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Section spacing="md">
            <Text style={styles.label}>THE HABIT</Text>
            <TextInput
              style={styles.input}
              placeholder="Morning Meditation"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </Section>

          <Section spacing="md">
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, category === c && styles.chipSelected]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextSelected]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section spacing="md">
            <Text style={styles.label}>FREQUENCY</Text>
            <View style={styles.freqRow}>
              <Pressable
                style={[styles.chip, frequency === 'daily' && styles.chipSelected]}
                onPress={() => setFrequency('daily')}
              >
                <Text style={[styles.chipText, frequency === 'daily' && styles.chipTextSelected]}>Daily</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, frequency === 'custom' && styles.chipSelected]}
                onPress={() => setFrequency('custom')}
              >
                <Text style={[styles.chipText, frequency === 'custom' && styles.chipTextSelected]}>Custom</Text>
              </Pressable>
            </View>
            {frequency === 'custom' && (
              <View style={styles.dayRow}>
                {dayValues.map((day, i) => (
                  <Pressable
                    key={day}
                    style={[styles.dayCircle, scheduleDays.includes(day) && styles.dayCircleSelected]}
                    onPress={() => toggleScheduleDay(day)}
                  >
                    <Text style={[styles.dayCircleText, scheduleDays.includes(day) && styles.dayCircleTextSelected]}>
                      {dayLabels[i]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Section>

          <Section spacing="md">
            <Text style={styles.label}>CUSTOMIZE</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.colorCircle, { backgroundColor: c }, colorHex === c && styles.colorCircleBorder]}
                  onPress={() => setColorHex(c)}
                />
              ))}
            </View>
            <View style={styles.iconRow}>
              {ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  style={[styles.iconCircle, icon === ic && styles.iconCircleSelected]}
                  onPress={() => setIcon(ic)}
                >
                  <MaterialCommunityIcons
                    name={ic as any}
                    size={24}
                    color={icon === ic ? colors.textPrimary : colors.textTertiary}
                  />
                </Pressable>
              ))}
            </View>
          </Section>

          <Section spacing="md">
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Daily Goal</Text>
              <Text style={styles.cardValue}>{dailyGoalMinutes != null ? `${dailyGoalMinutes} min` : '—'}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Reminder</Text>
              <Pressable onPress={() => setShowReminderPicker(true)}>
                <Text style={styles.cardValue}>
                  {reminderTime
                    ? reminderTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : '—'}
                </Text>
              </Pressable>
            </View>
            {showReminderPicker && (
              <DateTimePicker
                value={reminderTime || new Date(0, 0, 0, 8, 0)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  setShowReminderPicker(Platform.OS === 'ios');
                  if (d) setReminderTime(d);
                }}
              />
            )}
          </Section>

          <Section spacing="md">
            <Text style={styles.label}>Why is this important?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="To feel more energized before starting my workday."
              placeholderTextColor={colors.textTertiary}
              value={whyText}
              onChangeText={setWhyText}
              multiline
              numberOfLines={3}
            />
          </Section>

          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={() => navigation?.goBack()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.createButton, updateHabit.isPending && styles.createButtonDisabled]}
              onPress={handleSave}
              disabled={updateHabit.isPending}
            >
              {updateHabit.isPending ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.createButtonText}>Save changes</Text>
              )}
            </Pressable>
          </View>
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
  headerTitle: { ...typography.lg, fontWeight: '700', color: colors.textPrimary },
  label: {
    ...typography.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...typography.base,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCharcoal,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipSelected: { backgroundColor: colors.primaryViolet, borderColor: colors.primaryViolet },
  chipText: { ...typography.sm, color: colors.textPrimary },
  chipTextSelected: { color: colors.textPrimary },
  freqRow: { flexDirection: 'row', gap: space.sm },
  dayRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCharcoal,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: { backgroundColor: colors.primaryViolet, borderColor: colors.primaryViolet },
  dayCircleText: { ...typography.sm, color: colors.textSecondary },
  dayCircleTextSelected: { color: colors.textPrimary },
  colorRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorCircleBorder: { borderWidth: 3, borderColor: colors.textPrimary },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCharcoal,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconCircleSelected: { backgroundColor: colors.primaryViolet, borderColor: colors.primaryViolet },
  card: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardLabel: { ...typography.xs, color: colors.textTertiary, marginBottom: 4 },
  cardValue: { ...typography.base, color: colors.textPrimary },
  footer: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  cancelButton: { flex: 1, paddingVertical: space.md, alignItems: 'center' },
  cancelButtonText: { ...typography.base, color: colors.textPrimary },
  createButton: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { ...typography.base, fontWeight: '600', color: colors.textPrimary },
});
