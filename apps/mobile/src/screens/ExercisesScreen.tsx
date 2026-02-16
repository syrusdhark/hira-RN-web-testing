import React, { useMemo, useState } from 'react';
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
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useExercises } from '../hooks/useExerciseSearch';

const CARD_WIDTH = (Dimensions.get('window').width - space.md * 2 - space.sm) / 2;

export type ExercisesScreenProps = {
  navigation?: { goBack: () => void };
  onOpenExerciseDetail?: (exerciseId: string, exerciseName: string) => void;
};

export function ExercisesScreen({
  navigation,
  onOpenExerciseDetail,
}: ExercisesScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { data: exercises = [], isLoading } = useExercises();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises;
    const term = search.trim().toLowerCase();
    return exercises.filter(
      (ex) =>
        ex.name?.toLowerCase().includes(term) ||
        ex.exercise_type?.toLowerCase().includes(term) ||
        (ex.exercise_muscles ?? []).some((m: { muscle?: string }) => m.muscle?.toLowerCase().includes(term))
    );
  }, [exercises, search]);

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.bigTitle}>Exercises</Text>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.actionAmber} />
            <Text style={styles.loadingText}>Loading exercises…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="dumbbell" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptySub}>
              {search.trim() ? 'Try a different search.' : 'No exercises in the database.'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((ex) => (
              <Pressable
                key={ex.id}
                style={({ pressed }) => [styles.box, pressed && styles.boxPressed]}
                onPress={() => onOpenExerciseDetail?.(ex.id, ex.name ?? '')}
              >
                <Text style={styles.boxTitle} numberOfLines={2}>{ex.name}</Text>
                {ex.exercise_type ? (
                  <Text style={styles.boxMeta} numberOfLines={1}>{ex.exercise_type}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  box: {
    width: CARD_WIDTH,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.md,
    minHeight: 72,
  },
  boxPressed: {
    opacity: 0.85,
  },
  boxTitle: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: space['2xs'],
  },
  boxMeta: {
    ...typography.xs,
    color: colors.textTertiary,
  },
  bottomSpacer: { height: space.xl },
});
