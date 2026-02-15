import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius } from '../theme';
import { Section } from '../components/Section';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useUserAchievements } from '../hooks/useUserAchievements';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface AchievementRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  tier: string | null;
}

const ACHIEVEMENTS_KEY = ['allAchievements'];

function useAllAchievements() {
  return useQuery({
    queryKey: ACHIEVEMENTS_KEY,
    queryFn: async (): Promise<AchievementRow[]> => {
      const { data, error } = await supabase
        .from('achievements')
        .select('id, code, title, description, icon, tier')
        .order('id');
      if (error) throw error;
      return (data ?? []) as AchievementRow[];
    },
  });
}

export function AchievementsScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;
  const { data: unlocked = [], isLoading: unlockedLoading } = useUserAchievements();
  const { data: allAchievements = [], isLoading: allLoading } = useAllAchievements();

  const unlockedCodes = new Set(unlocked.map((u) => u.code));
  const unlockedByCode = new Map(unlocked.map((u) => [u.code, u]));

  const list = allAchievements.map((a) => ({
    ...a,
    unlocked: unlockedCodes.has(a.code),
    unlocked_at: unlockedByCode.get(a.code)?.unlocked_at ?? null,
  }));

  const isLoading = unlockedLoading || allLoading;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 40 }} />
      </View>

      <EnvironmentContainer disableScroll>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primaryViolet} />
          </View>
        ) : (
          <FlatList
            data={list}
            style={styles.list}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={[styles.iconWrap, !item.unlocked && styles.iconWrapLocked]}>
                  {item.unlocked ? (
                    <MaterialCommunityIcons
                      name={(item.icon as any) || 'medal'}
                      size={28}
                      color={colors.primaryViolet}
                    />
                  ) : (
                    <MaterialCommunityIcons name="lock" size={28} color={colors.textTertiary} />
                  )}
                </View>
                <View style={styles.content}>
                  <Text style={[styles.title, !item.unlocked && styles.titleLocked]}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  {item.unlocked && item.unlocked_at ? (
                    <Text style={styles.unlockedAt}>
                      Unlocked {new Date(item.unlocked_at).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No achievements yet.</Text>
            }
          />
        )}
      </EnvironmentContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B2E66',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.md,
  },
  iconWrapLocked: { backgroundColor: colors.bgElevated },
  content: { flex: 1 },
  title: { ...typography.base, fontWeight: '600', color: colors.textPrimary },
  titleLocked: { color: colors.textTertiary },
  description: { ...typography.sm, color: colors.textSecondary, marginTop: 2 },
  unlockedAt: { ...typography.xs, color: colors.primaryIndigo, marginTop: 4 },
  empty: { ...typography.base, color: colors.textSecondary, textAlign: 'center', marginTop: space.xl },
});
