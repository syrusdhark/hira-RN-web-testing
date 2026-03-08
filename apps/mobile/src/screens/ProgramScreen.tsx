import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useProgramSchedule, useAssignTemplateToProgramDay, useProgramsList, useSetActiveProgram, useDeleteProgram } from '../hooks/useProgramSchedule';
import { useWorkoutTemplates, useWorkoutTemplate } from '../hooks/useWorkoutTemplates';

const CARD_WIDTH = 100;
const CARD_GAP = 8;

export type StartProgramDayPayload = {
  templateId: string;
  programId?: string;
  programDayId?: string;
};

type ProgramScreenProps = {
  navigation?: { goBack: () => void };
  onStartProgramDay?: (payload: StartProgramDayPayload) => void;
  onViewProgramDay?: (payload: StartProgramDayPayload) => void;
  onCreateProgram?: () => void;
};

const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export function ProgramScreen({ navigation, onStartProgramDay, onViewProgramDay, onCreateProgram }: ProgramScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { data, isLoading } = useProgramSchedule();
  const { data: templates = [] } = useWorkoutTemplates();
  const assignTemplate = useAssignTemplateToProgramDay();
  const { data: programsList = [] } = useProgramsList();
  const setActiveProgram = useSetActiveProgram();
  const deleteProgram = useDeleteProgram();

  const program = data?.program ?? null;
  const weeks = data?.weeks ?? [];
  const scheduleByWeek = data?.scheduleByWeek ?? {};
  const completedDayIds = new Set(data?.completedDayIds ?? []);
  const todayWeekNumber = data?.todayWeekNumber ?? null;
  const todayWeekday = data?.todayWeekday ?? null;

  const initialWeek = todayWeekNumber && weeks.includes(todayWeekNumber)
    ? todayWeekNumber
    : weeks[0] ?? 1;

  const [selectedWeek, setSelectedWeek] = React.useState<number>(initialWeek);
  const [dayToAssignTemplate, setDayToAssignTemplate] = React.useState<{
    id: string;
    day_number: number;
    title: string | null;
    is_rest_day: boolean;
  } | null>(null);
  const [expandedDayId, setExpandedDayId] = React.useState<string | null>(null);
  const [myProgramsModalVisible, setMyProgramsModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (todayWeekNumber && weeks.includes(todayWeekNumber)) {
      setSelectedWeek(todayWeekNumber);
    } else if (weeks.length > 0) {
      setSelectedWeek(weeks[0]);
    }
  }, [todayWeekNumber, weeks.join(',')]);

  React.useEffect(() => {
    setExpandedDayId(null);
  }, [selectedWeek]);

  const daysForWeek = scheduleByWeek[selectedWeek] ?? [];

  const expandedDay = React.useMemo(
    () => daysForWeek.find((d: any) => d.id === expandedDayId) ?? null,
    [daysForWeek, expandedDayId]
  );
  const expandedTemplateId = expandedDay?.templateId ?? null;
  const { data: expandedTemplate, isLoading: expandedTemplateLoading } = useWorkoutTemplate(expandedTemplateId);

  const templateTitleById = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of templates as any[]) {
      if (t?.id && t?.title) map[t.id] = t.title;
    }
    return map;
  }, [templates]);

  const renderWeekTabs = () => {
    if (!weeks.length) return null;
    const currentWeek = todayWeekNumber ?? weeks[0];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekTabsScrollContent}
        style={styles.weekTabsRow}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {weeks.map((week) => {
          const isActiveWeek = week === currentWeek;
          const isSelected = week === selectedWeek;
          return (
            <Pressable
              key={week}
              style={({ pressed }) => [
                styles.weekTab,
                isActiveWeek && styles.weekTabActive,
                isSelected && styles.weekTabSelected,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setSelectedWeek(week)}
            >
              <Text style={styles.weekTitleLabel}>{`Week ${week}`}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  const handleViewDay = (day: any) => {
    if (!day.templateId || !onViewProgramDay) return;
    onViewProgramDay({
      templateId: day.templateId,
      programId: program?.id ?? undefined,
      programDayId: day.id,
    });
  };

  const handleStartDay = (day: any) => {
    if (!day.templateId || !onStartProgramDay) return;
    onStartProgramDay({
      templateId: day.templateId,
      programId: program?.id ?? undefined,
      programDayId: day.id,
    });
  };

  const handleDayPress = (day: any) => {
    if (day.is_rest_day) return;
    if (day.templateId && !completedDayIds.has(day.id)) {
      setExpandedDayId((prev) => (prev === day.id ? null : day.id));
    } else if (!day.templateId) {
      setDayToAssignTemplate(day);
    }
  };

  const renderExpandedContent = (day: any) => {
    if (expandedDayId !== day.id) return null;
    if (expandedTemplateLoading) {
      return (
        <View style={styles.dropdownBlock}>
          <Text style={styles.dropdownLoading}>Loading…</Text>
        </View>
      );
    }
    const exercises = (expandedTemplate as any)?.workout_template_exercises ?? [];
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
                <View style={styles.dropdownExerciseRow}>
                  <Text style={styles.dropdownExerciseName} numberOfLines={1}>
                    {ex.exercise_name ?? '--'}
                  </Text>
                  <Text style={styles.dropdownSetText}>{setsRepsText}</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={styles.dropdownActions}>
          <Pressable
            style={({ pressed }) => [styles.dropdownButton, styles.dropdownButtonSecondary, pressed && { opacity: 0.8 }]}
            onPress={() => handleStartDay(day)}
          >
            <Text style={styles.dropdownButtonSecondaryText}>Start</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderDayRow = (day: any) => {
    const isToday = todayWeekNumber === day.week_number && todayWeekday === day.day_number;
    const isCompleted = completedDayIds.has(day.id);
    const hasTemplate = !!day.templateId && !day.is_rest_day;
    const templateTitle = hasTemplate ? (templateTitleById[day.templateId] ?? 'Workout') : null;
    const canTap = (hasTemplate && !isCompleted) || (!day.templateId && !day.is_rest_day);
    const isExpanded = expandedDayId === day.id;

    const programDayIndex = ((day.week_number ?? 1) - 1) * 7 + (day.day_number ?? 1);
    const weekdayRaw = DAY_NAMES[(day.day_number ?? 1) - 1] ?? 'DAY';
    const weekdayTitleCase = weekdayRaw.charAt(0) + weekdayRaw.slice(1).toLowerCase();
    const label = `Day ${programDayIndex} ${weekdayTitleCase}`;

    const renderMiddle = () => {
      if (day.is_rest_day) {
        return <Text style={styles.dayTitleText} numberOfLines={1}>{day.title || 'Rest'}</Text>;
      }
      if (!day.templateId) {
        return (
          <Text style={styles.selectWorkoutPlaceholder} numberOfLines={1}>
            Select workout
          </Text>
        );
      }
      return (
        <LinearGradient
          colors={['#424242', '#18181b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.templateRectangle}
        >
          <Text style={styles.templateRectangleText} numberOfLines={1}>{templateTitle}</Text>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
            style={styles.templateChevron}
          />
        </LinearGradient>
      );
    };

    const rowContent = (
      <>
        <View style={styles.dayLabelColumn}>
          {isToday && <View style={styles.dayTodayBar} />}
          <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{label}</Text>
        </View>
        <View style={styles.dayTitleColumn}>
          {renderMiddle()}
        </View>
        <View style={styles.dayStatusColumn} />
      </>
    );

    const row = canTap ? (
      <Pressable
        style={({ pressed }) => [styles.dayRow, pressed && { opacity: 0.8 }]}
        onPress={() => handleDayPress(day)}
      >
        {rowContent}
      </Pressable>
    ) : (
      <View style={styles.dayRow}>
        {rowContent}
      </View>
    );

    return (
      <View key={day.id} style={styles.dayContainer}>
        {row}
        {renderExpandedContent(day)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <View style={[styles.header, { paddingTop }]}>
        <Pressable
          style={({ pressed }) => [styles.programTitleButton, pressed && { opacity: 0.8 }]}
          onPress={() => setMyProgramsModalVisible(true)}
        >
          <Text style={styles.programTitle}>{program?.title ?? 'Program'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {!program && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active program</Text>
          <Text style={styles.subText}>Create a program to get a week-by-week schedule and track your progress.</Text>
          {onCreateProgram ? (
            <Pressable style={styles.emptyStateButton} onPress={onCreateProgram}>
              <Text style={styles.emptyStateButtonText}>Create program</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {renderWeekTabs()}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{`WEEK ${selectedWeek} SCHEDULE`}</Text>
          </View>

          <View style={styles.dayList}>
            {isLoading && !daysForWeek.length ? (
              <Text style={styles.loadingText}>Loading schedule...</Text>
            ) : daysForWeek.length === 0 ? (
              <Text style={styles.subText}>No days scheduled for this week.</Text>
            ) : (
              daysForWeek.map(renderDayRow)
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={dayToAssignTemplate !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDayToAssignTemplate(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDayToAssignTemplate(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Choose workout for {dayToAssignTemplate ? DAY_NAMES[(dayToAssignTemplate.day_number ?? 1) - 1] ?? 'day' : ''}
            </Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {templates.length === 0 ? (
                <Text style={styles.modalEmpty}>No workouts yet. Create one in My Workouts.</Text>
              ) : (
                templates.map((t: any) => {
                  const count = t.exercise_count ?? t.workout_template_exercises?.[0]?.count ?? (Array.isArray(t.workout_template_exercises) ? t.workout_template_exercises.length : 0) ?? 0;
                  return (
                    <Pressable
                      key={t.id}
                      style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.8 }]}
                      onPress={() => {
                        if (!dayToAssignTemplate) return;
                        assignTemplate.mutate(
                          { programDayId: dayToAssignTemplate.id, templateId: t.id },
                          { onSuccess: () => setDayToAssignTemplate(null) }
                        );
                      }}
                      disabled={assignTemplate.isPending}
                    >
                      <Text style={styles.modalItemTitle} numberOfLines={1}>{t.title ?? 'Workout'}</Text>
                      <Text style={styles.modalItemMeta}>{count} exercises</Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setDayToAssignTemplate(null)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={myProgramsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMyProgramsModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMyProgramsModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>My Programs</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {programsList.length === 0 ? (
                <Text style={styles.modalEmpty}>No programs yet.</Text>
              ) : (
                programsList.map((p) => (
                  <View key={p.id} style={styles.myProgramRow}>
                    <Pressable
                      style={({ pressed }) => [styles.modalItem, { flex: 1 }, pressed && { opacity: 0.8 }]}
                      onPress={() => {
                        setActiveProgram.mutate(p.id, {
                          onSuccess: () => setMyProgramsModalVisible(false),
                        });
                      }}
                      disabled={setActiveProgram.isPending}
                    >
                      <Text style={styles.modalItemTitle} numberOfLines={1}>{p.title}</Text>
                      <View style={styles.myProgramRowMeta}>
                        {p.duration_weeks != null ? (
                          <Text style={styles.modalItemMeta}>{p.duration_weeks} weeks</Text>
                        ) : null}
                        {p.is_active ? (
                          <Text style={styles.myProgramActiveBadge}>Active</Text>
                        ) : null}
                      </View>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.myProgramDeleteBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => {
                        Alert.alert(
                          'Delete program?',
                          `Delete "${p.title}"? This cannot be undone.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => deleteProgram.mutate(p.id),
                            },
                          ]
                        );
                      }}
                      disabled={deleteProgram.isPending}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={22} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
            {onCreateProgram ? (
              <Pressable
                style={({ pressed }) => [styles.myProgramCreateButton, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  setMyProgramsModalVisible(false);
                  onCreateProgram();
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.textPrimary} />
                <Text style={styles.myProgramCreateButtonText}>Create program</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setMyProgramsModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMidnight,
  },
  header: {
    paddingHorizontal: space.md,
    paddingBottom: space.lg,
    backgroundColor: colors.bgMidnight,
    zIndex: 1,
    alignItems: 'center',
  },
  programTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  programTitle: {
    ...typography.xl,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: space.md,
    paddingBottom: space['2xl'],
  },
  weekTabsRow: {
    marginBottom: space.lg,
    marginTop: space.md,
  },
  weekTabsScrollContent: {
    paddingHorizontal: space.md,
  },
  weekTab: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_GAP / 2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.bgCharcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekTabActive: {
    borderColor: colors.bodyOrange,
    shadowColor: colors.bodyOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  weekTabSelected: {
    borderColor: colors.bodyOrange,
  },
  weekTitleLabel: {
    ...typography.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: space.md,
    marginBottom: space.sm,
  },
  sectionLabel: {
    ...typography.xs,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dayList: {
    borderRadius: radius.xl,
    backgroundColor: colors.bgCharcoal,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
  },
  dayContainer: {
    marginBottom: space.xs,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    marginBottom: space.xs,
  },
  dayLabelColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  dayTodayBar: {
    width: 3,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.bodyOrange,
    marginRight: space.xs,
  },
  dayName: {
    ...typography.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayNameToday: {
    color: colors.bodyOrange,
    fontWeight: '700',
  },
  dayTitleColumn: {
    flex: 1,
    paddingHorizontal: space.sm,
  },
  dayTitleText: {
    ...typography.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  selectWorkoutPlaceholder: {
    ...typography.base,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  templateRectangle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  templateRectangleText: {
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  templateChevron: {
    marginLeft: space.xs,
  },
  dropdownBlock: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginTop: -space.xs,
    marginHorizontal: space.sm,
    marginBottom: space.xs,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
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
    marginBottom: space.sm,
  },
  dropdownExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dropdownExerciseName: {
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  dropdownSetText: {
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
  dropdownButtonPrimary: {
    backgroundColor: colors.bodyOrange,
  },
  dropdownButtonSecondary: {
    backgroundColor: colors.bgCharcoal,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dropdownButtonPrimaryText: {
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dropdownButtonSecondaryText: {
    ...typography.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayStatusColumn: {
    width: 0,
    minWidth: 0,
  },
  statusIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startPill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.bodyOrange,
  },
  startPillText: {
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  noTemplateText: {
    ...typography.sm,
    color: colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: space.xl,
  },
  emptyStateButton: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.bodyOrange,
  },
  emptyStateButtonText: {
    ...typography.lg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: space.md,
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
  myProgramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
    gap: space.sm,
  },
  myProgramRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: 2,
  },
  myProgramActiveBadge: {
    ...typography.xs,
    color: colors.bodyOrange,
    fontWeight: '600',
  },
  myProgramDeleteBtn: {
    padding: space.sm,
  },
  myProgramCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: space.md,
  },
  myProgramCreateButtonText: {
    ...typography.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
