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
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';

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

export type MyWorkoutsScreenProps = {
  navigation?: { goBack: () => void };
  onNavigateToWorkoutHistory?: () => void;
  onCreateNew?: () => void;
  onStartTemplate?: (templateId: string) => void;
  onEditTemplate?: (templateId: string) => void;
};

export function MyWorkoutsScreen({
  navigation,
  onNavigateToWorkoutHistory,
  onCreateNew,
  onStartTemplate,
  onEditTemplate,
}: MyWorkoutsScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { data, isLoading } = useWorkoutTemplates();
  const templates = (data || []) as TemplateRow[];
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? templates.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
    : templates;
  const recent = filtered.slice(0, 5);

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <View style={[styles.header, { paddingTop }]}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>My Workouts</Text>
        <Pressable style={styles.headerRight} onPress={onNavigateToWorkoutHistory} accessibilityLabel="History">
          <Text style={styles.headerHistoryText}>History</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="never"
      >
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find your workout..."
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
        ) : (
          <>
            {recent.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.sectionTitle}>Recent & Favorites</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScroll}
                >
                  {recent.map((t) => (
                    <Pressable key={t.id} onPress={() => onStartTemplate?.(t.id)}>
                      <LinearGradient
                        colors={['#424242', '#18181b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.templateCard, { width: Dimensions.get('window').width * 0.42 }]}
                      >
                        <View style={styles.difficultyTag}>
                          <Text style={[styles.difficultyText, { color: colors.actionAmber }]}>{t.difficulty_level ?? '--'}</Text>
                        </View>
                        <Text style={styles.templateTitle} numberOfLines={2}>{t.title}</Text>

                        <View style={styles.templateStats}>
                          <View style={styles.statRow}>
                            <MaterialCommunityIcons name="dumbbell" size={14} color={colors.textTertiary} />
                            <Text style={styles.statText}>{exerciseCount(t)} Exercises</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>All My Workouts</Text>
                <Pressable accessibilityLabel="Filter">
                  <MaterialCommunityIcons name="filter-variant" size={22} color={colors.textPrimary} />
                </Pressable>
              </View>
              {filtered.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No workouts yet</Text>
                  <Text style={styles.emptySub}>Create one to get started.</Text>
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
                          {t.updated_at ? (
                            <>
                              <Text style={styles.listDot}> • </Text>
                              <Text style={styles.listMetaGray}>Updated</Text>
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
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.fabContainer}>
        <Pressable style={styles.fab} onPress={onCreateNew}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Create New</Text>
        </Pressable>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  headerLeft: { width: 40 },
  headerTitle: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
  headerHistoryText: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingBottom: 100,
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
  section: { marginBottom: space.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  sectionTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recentScroll: { gap: space.md, paddingRight: space.md },
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
  listDifficulty: { ...typography.sm, fontWeight: '600' },
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
  listActionEdit: { backgroundColor: colors.bgElevated },
  bottomSpacer: { height: space.xl },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : space.lg,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionAmber,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.full,
    gap: space.sm,
  },
  fabLabel: {
    ...typography.base,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
