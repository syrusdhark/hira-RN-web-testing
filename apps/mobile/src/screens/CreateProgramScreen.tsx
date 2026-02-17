import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useCreateProgram, type CreateProgramInput } from '../hooks/useProgramSchedule';
import { useWorkoutTemplates, useWorkoutTemplate } from '../hooks/useWorkoutTemplates';

const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

type CreateProgramScreenProps = {
  navigation?: { goBack: () => void };
  onSuccess?: () => void;
};

export function CreateProgramScreen({ navigation, onSuccess }: CreateProgramScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('4');
  const [dayAssignments, setDayAssignments] = useState<Record<number, string | null>>({});
  const [dayPickerOpen, setDayPickerOpen] = useState<number | null>(null);
  const [expandedDayNumber, setExpandedDayNumber] = useState<number | null>(null);

  const createProgram = useCreateProgram();
  const { data: templates = [] } = useWorkoutTemplates();
  const expandedTemplateId = expandedDayNumber != null ? (dayAssignments[expandedDayNumber] ?? null) : null;
  const { data: expandedTemplate, isLoading: expandedTemplateLoading } = useWorkoutTemplate(expandedTemplateId);

  const templateTitleById: Record<string, string> = {};
  for (const t of templates as { id: string; title?: string }[]) {
    if (t?.id) templateTitleById[t.id] = t.title ?? 'Workout';
  }

  const handleDayPress = (dayNumber: number) => {
    const templateId = dayAssignments[dayNumber] ?? null;
    if (templateId) {
      setExpandedDayNumber((prev) => (prev === dayNumber ? null : dayNumber));
    } else {
      setDayPickerOpen(dayNumber);
    }
  };

  const renderExpandedContent = (dayNumber: number) => {
    if (expandedDayNumber !== dayNumber) return null;
    if (expandedTemplateLoading) {
      return (
        <View style={styles.dropdownBlock}>
          <Text style={styles.dropdownLoading}>Loading…</Text>
        </View>
      );
    }
    const exercises = (expandedTemplate as { workout_template_exercises?: any[] })?.workout_template_exercises ?? [];
    const sortedExercises = [...exercises].sort(
      (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );

    return (
      <View style={styles.dropdownBlock}>
        {sortedExercises.length === 0 ? (
          <Text style={styles.dropdownEmpty}>No exercises</Text>
        ) : (
          sortedExercises.map((ex: any) => {
            const sets = (ex.workout_template_sets ?? []).slice().sort(
              (a: any, b: any) => (a.set_number ?? 0) - (b.set_number ?? 0)
            );
            const setCount = sets.length;
            const repsVal = sets[0]?.reps != null ? sets[0].reps : null;
            const setsRepsText =
              setCount > 0 && repsVal != null
                ? `${setCount} Sets x ${repsVal} Reps`
                : setCount > 0
                  ? `${setCount} Sets`
                  : '—';
            return (
              <View key={ex.id} style={styles.dropdownExercise}>
                <Text style={styles.dropdownExerciseName} numberOfLines={1}>
                  {ex.exercise_name ?? '--'}
                </Text>
                <Text style={styles.dropdownSetText}>{setsRepsText}</Text>
              </View>
            );
          })
        )}
        <View style={styles.dropdownActions}>
          <Pressable
            style={({ pressed }) => [styles.dropdownButton, styles.dropdownButtonSecondary, pressed && { opacity: 0.8 }]}
            onPress={() => {
              setDayPickerOpen(dayNumber);
              setExpandedDayNumber(null);
            }}
          >
            <Text style={styles.dropdownButtonSecondaryText}>Change workout</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Missing field', 'Please enter a program title.');
      return;
    }
    const weeks = parseInt(durationWeeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
      Alert.alert('Invalid duration', 'Please enter a duration between 1 and 12 weeks.');
      return;
    }

    const day_assignments: Record<number, string> = {};
    for (let d = 1; d <= 7; d++) {
      const tid = dayAssignments[d];
      if (tid) day_assignments[d] = tid;
    }

    createProgram.mutate(
      {
        title: trimmedTitle,
        description: description.trim() || null,
        duration_weeks: weeks,
        restOnSunday: true,
        day_assignments: Object.keys(day_assignments).length > 0 ? day_assignments : undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          navigation?.goBack();
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create program.');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { paddingTop: paddingTop + 52 }]}>
          <Text style={styles.screenTitle}>Create program</Text>
          <Text style={styles.subtitle}>Set up your program details and schedule.</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>TITLE</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="format-title" size={20} color={colors.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. My 4-Week Program"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <Text style={styles.label}>DESCRIPTION (OPTIONAL)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's this program about?"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.periodisationRow}>
            <Text style={styles.periodisationLabel}>PERIODISATION</Text>
            <View style={styles.periodisationInputWrap}>
              <TextInput
                style={styles.periodisationInput}
                placeholder="4"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={durationWeeks}
                onChangeText={setDurationWeeks}
              />
              <Text style={styles.periodisationUnit}>weeks</Text>
            </View>
          </View>

          <Text style={styles.label}>WEEKLY SCHEDULE</Text>
          <View style={styles.dayList}>
            {(Array.from({ length: 7 }, (_, i) => i + 1) as number[]).map((dayNumber) => {
              const templateId = dayAssignments[dayNumber] ?? null;
              const label = templateId ? templateTitleById[templateId] ?? 'Workout' : 'Select workout';
              const isExpanded = expandedDayNumber === dayNumber;
              const chevronIcon = templateId ? (isExpanded ? 'chevron-up' : 'chevron-down') : 'chevron-right';
              return (
                <View key={dayNumber} style={styles.dayContainer}>
                  <Pressable
                    style={({ pressed }) => [styles.dayRow, pressed && { opacity: 0.8 }]}
                    onPress={() => handleDayPress(dayNumber)}
                  >
                    <Text style={styles.dayRowName}>{DAY_NAMES[dayNumber - 1]}</Text>
                    <View style={styles.dayRowMiddle}>
                      {templateId ? (
                        <LinearGradient
                          colors={['#424242', '#18181b']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.dayRowGradient}
                        >
                          <Text style={styles.dayRowGradientText} numberOfLines={1}>{label}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.dayRowPlaceholder} numberOfLines={1}>{label}</Text>
                      )}
                      <MaterialCommunityIcons name={chevronIcon} size={20} color={colors.textTertiary} style={styles.dayRowChevron} />
                    </View>
                  </Pressable>
                  {renderExpandedContent(dayNumber)}
                </View>
              );
            })}
          </View>

          <Modal
            visible={dayPickerOpen !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setDayPickerOpen(null)}
          >
            <Pressable style={styles.modalBackdrop} onPress={() => setDayPickerOpen(null)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.modalTitle}>
                  {dayPickerOpen != null ? `Choose workout for ${DAY_NAMES[dayPickerOpen - 1]}` : ''}
                </Text>
                <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                  <Pressable
                    style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.8 }]}
                    onPress={() => {
                      if (dayPickerOpen != null) {
                        setDayAssignments((prev) => ({ ...prev, [dayPickerOpen]: null }));
                        setDayPickerOpen(null);
                      }
                    }}
                  >
                    <Text style={styles.modalItemTitle}>Rest</Text>
                    <Text style={styles.modalItemMeta}>No workout</Text>
                  </Pressable>
                  {templates.length === 0 ? (
                    <Text style={styles.modalEmpty}>No workouts yet. Create one in Workouts.</Text>
                  ) : (
                    (templates as { id: string; title?: string; workout_template_exercises?: { count?: number }[] }[]).map((t) => {
                      const count = t.workout_template_exercises?.[0]?.count ?? 0;
                      return (
                        <Pressable
                          key={t.id}
                          style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.8 }]}
                          onPress={() => {
                            if (dayPickerOpen != null) {
                              setDayAssignments((prev) => ({ ...prev, [dayPickerOpen]: t.id }));
                              setDayPickerOpen(null);
                            }
                          }}
                        >
                          <Text style={styles.modalItemTitle} numberOfLines={1}>{t.title ?? 'Workout'}</Text>
                          <Text style={styles.modalItemMeta}>{count} exercises</Text>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
                <Pressable style={styles.modalCloseButton} onPress={() => setDayPickerOpen(null)}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>

          <Pressable
            onPress={handleSubmit}
            disabled={createProgram.isPending}
            style={styles.submitBtnContainer}
          >
            <LinearGradient
              colors={[colors.primaryViolet, colors.bodyOrange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {createProgram.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Create</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMidnight,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
  },
  screenTitle: {
    ...typography['2xl'],
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: space.xs,
  },
  subtitle: {
    ...typography.base,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingBottom: 100,
  },
  label: {
    ...typography.sm,
    color: colors.textSecondary,
    marginBottom: space.xs,
    marginTop: space.lg,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  inputIcon: {
    marginRight: space.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  textAreaContainer: {
    height: undefined,
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: space.sm,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  unitText: {
    ...typography.sm,
    color: colors.textTertiary,
    marginLeft: space.sm,
  },
  periodisationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.lg,
    marginBottom: space.md,
  },
  periodisationLabel: {
    ...typography.sm,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginVertical: 0,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  periodisationInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    minWidth: 100,
  },
  periodisationInput: {
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: 0,
    width: 36,
    textAlign: 'center',
  },
  periodisationUnit: {
    ...typography.sm,
    color: colors.textTertiary,
    marginLeft: space.xs,
  },
  dayList: {
    marginTop: space.xs,
  },
  dayContainer: {
    marginBottom: space.xs,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  dayRowName: {
    ...typography.sm,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    width: 100,
  },
  dayRowMiddle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: space.sm,
  },
  dayRowGradient: {
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
  },
  dayRowGradientText: {
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dayRowPlaceholder: {
    flex: 1,
    ...typography.base,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  dayRowChevron: {
    marginLeft: space.xs,
  },
  dropdownBlock: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginTop: -space.xs,
    marginHorizontal: space.sm,
    marginBottom: space.xs,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dropdownLoading: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  dropdownEmpty: {
    ...typography.sm,
    color: colors.textTertiary,
    marginBottom: space.sm,
  },
  dropdownExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  dropdownExerciseName: {
    flex: 1,
    marginRight: space.sm,
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dropdownSetText: {
    flexShrink: 0,
    ...typography.xs,
    color: colors.textSecondary,
  },
  dropdownActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  dropdownButton: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownButtonSecondary: {
    backgroundColor: colors.bgCharcoal,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dropdownButtonSecondaryText: {
    ...typography.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  modalTitle: {
    ...typography.lg,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: space.md,
  },
  modalList: {
    maxHeight: 320,
  },
  modalEmpty: {
    ...typography.sm,
    color: colors.textSecondary,
    paddingVertical: space.lg,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    marginBottom: space.xs,
    backgroundColor: colors.bgElevated,
  },
  modalItemTitle: {
    ...typography.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalItemMeta: {
    ...typography.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  modalCloseText: {
    ...typography.base,
    color: colors.textSecondary,
  },
  submitBtnContainer: {
    marginTop: space.xl,
  },
  submitButton: {
    height: 56,
    borderRadius: radius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    ...typography.lg,
    fontWeight: '700',
    color: 'white',
  },
});
