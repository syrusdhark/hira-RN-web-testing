import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { Section } from '../components/Section';
import { ProgressBar } from '../components/ProgressBar';

import { useProfile } from '../context/ProfileContext';
import { useUserXp } from '../hooks/useUserXp';
import { useUserStreaks } from '../hooks/useUserStreaks';
import { useUserAchievements } from '../hooks/useUserAchievements';
import { FloatingBackButton } from '../components/FloatingBackButton';

type ProfileScreenProps = {
  navigation?: { goBack: () => void };
  onViewAllAchievements?: () => void;
  onPersonalInfo?: () => void;
  onPreferences?: () => void;
  onIntegrations?: () => void;
  onHelpSupport?: () => void;
  onSignOut?: () => void;
};

const AVATAR_SIZE = 96;
const SCREEN_WIDTH = Dimensions.get('window').width;

const ACHIEVEMENT_SLOTS = 4;
const KNOWN_ICONS = ['dumbbell', 'fitness', 'fire', 'star', 'calendar', 'trophy', 'utensils', 'target', 'sunrise', 'weight', 'medal', 'lightning-bolt', 'water', 'foot-print'] as const;
function achievementIconName(icon: string | null): keyof typeof MaterialCommunityIcons.glyphMap {
  if (icon && KNOWN_ICONS.includes(icon as any)) return icon as keyof typeof MaterialCommunityIcons.glyphMap;
  return 'medal';
}

export function ProfileScreen({
  navigation,
  onViewAllAchievements,
  onPersonalInfo,
  onPreferences,
  onIntegrations,
  onHelpSupport,
  onSignOut,
}: ProfileScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 44;
  const { profile, loading } = useProfile();
  const { data: xpSummary, isLoading: xpLoading } = useUserXp();
  const { data: streaks = [], isLoading: streaksLoading } = useUserStreaks();
  const { data: achievements = [], isLoading: achievementsLoading } = useUserAchievements();

  const displayName = profile?.full_name || 'Hira Member';
  const displayInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const mainStreak = streaks.find((s) => s.streak_type === 'workout' || s.streak_type === 'overall') ?? null;
  const streakValue = streaksLoading ? '--' : mainStreak ? `${mainStreak.current_streak} days` : '0 days';
  const streakBest = streaksLoading ? '--' : mainStreak ? `Best: ${mainStreak.longest_streak} days` : 'Best: 0 days';

  const rankTitle = xpLoading ? '--' : (xpSummary?.level_title ?? 'Beginner');
  const rankProgress = xpSummary?.progress_pct ?? 0;
  const rankSub = xpLoading
    ? '--'
    : xpSummary?.next_level_xp_required != null
      ? `${xpSummary.xp_in_current_level}/${xpSummary.xp_in_current_level + xpSummary.xp_to_next_level} XP`
      : 'Max level';

  const achievementSlots = achievements.slice(0, ACHIEVEMENT_SLOTS);
  const filledSlots = achievementSlots.length;

  return (
    <View style={styles.root}>
      {navigation ? <FloatingBackButton onPress={navigation.goBack} /> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{displayInitials}</Text>
            </View>
            <View style={styles.verificationBadge}>
              <MaterialCommunityIcons name="check" size={14} color={colors.textPrimary} />
            </View>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.membership}>Hira Elite Member • Since {new Date().getFullYear()}</Text>
        </View>

        <Section spacing="md">
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricCardIcons}>
                <MaterialCommunityIcons name="fire" size={20} color={colors.actionAmber} />
                <MaterialCommunityIcons name="fire" size={12} color={colors.actionAmber} style={{ opacity: 0.5 }} />
              </View>
              <Text style={styles.metricLabel}>Streak</Text>
              {streaksLoading ? (
                <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginVertical: space.xs }} />
              ) : (
                <>
                  <Text style={styles.metricValue}>{streakValue}</Text>
                  <Text style={styles.metricSub}>{streakBest}</Text>
                </>
              )}
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricCardIcons}>
                <MaterialCommunityIcons name="trophy" size={20} color="#E5B84A" />
                <MaterialCommunityIcons name="trophy" size={12} color="#E5B84A" style={{ opacity: 0.5 }} />
              </View>
              <Text style={styles.metricLabel}>Rank</Text>
              {xpLoading ? (
                <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginVertical: space.xs }} />
              ) : (
                <>
                  <Text style={styles.metricValue}>{rankTitle}</Text>
                  <ProgressBar value={rankProgress} height={6} color="#E5B84A" />
                  <Text style={styles.metricSub}>{rankSub}</Text>
                </>
              )}
            </View>
          </View>
        </Section>

        <Section spacing="md">
          <View style={styles.achievementsCard}>
            <View style={styles.achievementsHeader}>
              <View style={styles.achievementsTitleRow}>
                <MaterialCommunityIcons name="medal" size={20} color={colors.primaryViolet} />
                <Text style={styles.achievementsTitle}>Achievements</Text>
              </View>
              <Pressable onPress={onViewAllAchievements}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <View style={styles.achievementsRow}>
              {achievementsLoading
                ? Array.from({ length: ACHIEVEMENT_SLOTS }).map((_, i) => (
                    <View key={i} style={styles.achievementItem}>
                      <View style={[styles.achievementIcon, { backgroundColor: colors.bgElevated }]}>
                        <ActivityIndicator size="small" color={colors.textTertiary} />
                      </View>
                      <Text style={styles.achievementLabel}>--</Text>
                    </View>
                  ))
                : [
                    ...achievementSlots.map((ach) => (
                      <View key={ach.id} style={styles.achievementItem}>
                        <View style={[styles.achievementIcon, { backgroundColor: '#3B2E66' }]}>
                          <MaterialCommunityIcons
                            name={achievementIconName(ach.icon)}
                            size={24}
                            color={colors.primaryViolet}
                          />
                        </View>
                        <Text style={styles.achievementLabel} numberOfLines={2}>{ach.title}</Text>
                      </View>
                    )),
                    ...Array.from({ length: ACHIEVEMENT_SLOTS - filledSlots }).map((_, i) => (
                      <View key={`locked-${i}`} style={styles.achievementItem}>
                        <View style={[styles.achievementIcon, { backgroundColor: colors.bgElevated }]}>
                          <MaterialCommunityIcons name="lock" size={24} color={colors.textTertiary} />
                        </View>
                        <Text style={styles.achievementLabel}>Locked</Text>
                      </View>
                    )),
                  ]}
            </View>
          </View>
        </Section>

        <Section spacing="sm">
          <ProfileRow
            icon="account-outline"
            title="Personal Information"
            subtitle="Height, Weight, Age, Goals"
            onPress={onPersonalInfo}
          />
          <ProfileRow
            icon="tune-variant"
            title="Preferences"
            subtitle="Units, Theme, Notifications"
            onPress={onPreferences}
          />
        </Section>

        <Section spacing="xs">
          <Text style={styles.sectionLabel}>SETTINGS & TOOLS</Text>
          <ProfileRow
            icon="sync"
            title="Integrations"
            subtitle="Apple Health, Google Fit"
            badge="2 Active"
            badgeColor={colors.healthGreen}
            onPress={onIntegrations}
          />
          <ProfileRow
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQ, Contact Us"
            onPress={onHelpSupport}
          />
        </Section>

        {onSignOut ? (
          <Section spacing="md">
            <Pressable
              style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
              onPress={onSignOut}
            >
              <MaterialCommunityIcons name="logout" size={22} color={colors.textPrimary} style={styles.signOutIcon} />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </Section>
        ) : null}
      </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.textPrimary} style={styles.rowIcon} />
      <View style={styles.rowContent}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowTitle}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : undefined]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: colors.bgMidnight,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    paddingHorizontal: space.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: space.sm,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#2A2528',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...typography['2xl'],
    fontWeight: '700',
    color: colors.textSecondary,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryViolet,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bgMidnight,
  },
  userName: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: space['2xs'],
  },
  membership: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  metricRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricCardIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  metricLabel: {
    ...typography.sm,
    color: colors.textPrimary,
    marginBottom: space['2xs'],
  },
  metricValue: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metricSub: {
    ...typography.xs,
    color: colors.textSecondary,
    marginTop: space['2xs'],
  },
  achievementsCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  achievementsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  achievementsTitle: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAll: {
    ...typography.sm,
    color: colors.primaryIndigo,
    fontWeight: '500',
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  achievementLabel: {
    ...typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
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
  rowIcon: {
    marginRight: space.sm,
  },
  rowContent: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  rowTitle: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: space.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.healthGreen,
  },
  badgeText: {
    ...typography.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  signOutButtonPressed: {
    opacity: 0.8,
  },
  signOutIcon: {
    marginRight: space.sm,
  },
  signOutText: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
