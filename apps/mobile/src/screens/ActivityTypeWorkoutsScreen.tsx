import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  Bodybuilding: 'Strength',
  Calisthenics: 'Calisthenics',
  Running: 'Running',
  Stretch: 'Stretch',
  Yoga: 'Yoga',
};

type TemplateRow = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  workout_template_exercises: { count?: number }[] | Array<{ exercises?: { exercise_type?: string } }>;
  exercise_count?: number;
  difficulty_level?: string;
  estimated_duration?: number;
  activity_type?: string | null;
  activity_type_tags?: string[] | null;
};

function exerciseCount(row: TemplateRow): number {
  if (typeof (row as any).exercise_count === 'number') return (row as any).exercise_count;
  const arr = row.workout_template_exercises;
  if (Array.isArray(arr)) return arr.length;
  const c = arr?.[0]?.count;
  return typeof c === 'number' ? c : 0;
}

export type ActivityTypeWorkoutsScreenProps = {
  navigation?: { goBack: () => void };
  activityType: string;
  onStartTemplate?: (templateId: string) => void;
  onEditTemplate?: (templateId: string) => void;
  onNavigateToWorkoutHistory?: () => void;
  onCreateNew?: () => void;
};

export function ActivityTypeWorkoutsScreen({
  navigation,
  activityType,
  onStartTemplate,
  onEditTemplate,
}: ActivityTypeWorkoutsScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { data, isLoading } = useWorkoutTemplates();
  const templates = (data || []) as TemplateRow[];
  const [search, setSearch] = useState('');

  const label = ACTIVITY_TYPE_LABELS[activityType] ?? activityType;
  const screenTitle = `${label} Workouts`;

  const filtered = search.trim()
    ? templates.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
    : templates;

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.bigTitle}>{screenTitle}</Text>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workouts..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.actionAmber} />
            <Text style={styles.loadingText}>Loading workouts…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No workouts found</Text>
            <Text style={styles.emptySub}>
              {search.trim() ? 'Try a different search.' : 'Create a workout to get started.'}
            </Text>
          </View>
        ) : (
          filtered.map((t) => (
            <Pressable key={t.id} onPress={() => onStartTemplate?.(t.id)}>
              <LinearGradient
                colors={['#424242', '#18181b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.listRow}
              >
                <View style={styles.listIconBox}>
                  <MaterialCommunityIcons name="dumbbell" size={22} color={colors.textPrimary} />
                </View>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{t.title}</Text>
                  <View style={styles.listMeta}>
                    <Text style={styles.listMetaGray}>{exerciseCount(t)} exercises</Text>
                    {t.activity_type === 'hybrid' && t.activity_type_tags?.length ? (
                      <>
                        <Text style={styles.listDot}> • </Text>
                        <Text style={styles.listMetaGray}>
                          Hybrid ({t.activity_type_tags.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1)).join(', ')})
                        </Text>
                      </>
                    ) : null}
                    {t.difficulty_level ? (
                      <>
                        <Text style={styles.listDot}> • </Text>
                        <Text style={styles.listMetaGray}>{t.difficulty_level}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  style={[styles.listActionBtn, styles.listActionPlay]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onStartTemplate?.(t.id);
                  }}
                >
                  <MaterialCommunityIcons name="play" size={20} color={colors.textInverse} />
                </Pressable>
              </LinearGradient>
            </Pressable>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMidnight,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingBottom: 100,
  },
  bigTitle: {
    ...typography['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: space['3xl'],
    marginBottom: space.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 44,
    marginBottom: space.lg,
    gap: space.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.base,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  loadingWrap: {
    paddingVertical: space.xl * 2,
    alignItems: 'center',
    gap: space.md,
  },
  loadingText: {
    ...typography.sm,
    color: colors.textTertiary,
  },
  emptyWrap: {
    paddingVertical: space.xl * 2,
    alignItems: 'center',
    gap: space.sm,
  },
  emptyTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    ...typography.sm,
    color: colors.textTertiary,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.md,
  },
  listBody: { flex: 1 },
  listTitle: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: space['2xs'],
  },
  listMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  listDot: { ...typography.sm, color: colors.textTertiary },
  listMetaGray: { ...typography.sm, color: colors.textTertiary },
  listActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: space.sm,
  },
  listActionPlay: { backgroundColor: colors.actionAmber },
  bottomSpacer: { height: space.xl },
});
