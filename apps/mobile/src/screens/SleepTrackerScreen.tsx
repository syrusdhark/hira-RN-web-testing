import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';

const SLEEP_ACCENT = colors.primaryIndigo;

type SleepTrackerScreenProps = {
  navigation?: { goBack: () => void };
};

export function SleepTrackerScreen({ navigation }: SleepTrackerScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  return (
    <View style={styles.container}>
      <FloatingBackButton onPress={() => navigation?.goBack()} />



      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: sleep duration */}
        <Text style={styles.heroDuration}>7h 30m</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.pillBadge, { borderColor: `${SLEEP_ACCENT}40`, backgroundColor: `${SLEEP_ACCENT}15` }]}>
            <MaterialCommunityIcons name="chart-line" size={16} color={SLEEP_ACCENT} style={styles.pillIcon} />
            <Text style={[styles.pillText, { color: SLEEP_ACCENT }]}>+30m vs goal</Text>
          </View>
          <View style={[styles.pillBadge, { borderColor: `${SLEEP_ACCENT}40`, backgroundColor: `${SLEEP_ACCENT}15` }]}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={SLEEP_ACCENT} style={styles.pillIcon} />
            <Text style={[styles.pillText, { color: SLEEP_ACCENT }]}>85% Quality</Text>
          </View>
        </View>

        {/* Live Tracking card */}
        <View style={styles.section}>
          <View style={styles.surfaceCard}>
            <Text style={[styles.cardLabel, { color: SLEEP_ACCENT }]}>LIVE TRACKING</Text>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Circadian Rhythm</Text>
              <MaterialCommunityIcons name="equalizer" size={24} color={SLEEP_ACCENT} />
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusIconWrap, { backgroundColor: `${SLEEP_ACCENT}25` }]}>
                <MaterialCommunityIcons name="check" size={18} color={SLEEP_ACCENT} />
              </View>
              <Text style={[styles.statusLabel, { color: SLEEP_ACCENT }]}>CURRENT STATUS</Text>
              <Text style={styles.statusValue}>Normal</Text>
            </View>
            <Text style={styles.bodyText}>
              Peak alertness expected until <Text style={styles.bodyBold}>2:00 PM</Text>. Try to complete focus-heavy tasks before the afternoon dip.
            </Text>
          </View>
        </View>

        {/* A Tip for the Day */}
        <View style={styles.section}>
          <View style={styles.tipSectionHeader}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={SLEEP_ACCENT} style={styles.tipIcon} />
            <Text style={styles.tipSectionTitle}>A Tip for the Day</Text>
          </View>
          <View style={styles.surfaceCard}>
            <View style={styles.tipCardHeader}>
              <View style={[styles.tipIconWrap, { backgroundColor: `${SLEEP_ACCENT}25` }]}>
                <MaterialCommunityIcons name="snowflake" size={20} color={SLEEP_ACCENT} />
              </View>
              <View style={styles.tipTitleBlock}>
                <Text style={[styles.tipLabel, { color: SLEEP_ACCENT }]}>FOR TONIGHT</Text>
                <Text style={styles.tipTitle}>Optimal Environment</Text>
              </View>
              <MaterialCommunityIcons name="bed" size={24} color={colors.textSecondary} />
            </View>
            <Text style={styles.bodyText}>
              Set your thermostat to <Text style={styles.bodyBold}>68°F (20°C)</Text>. A cooler room mimics your body's natural temperature drop, signaling it's time for deep restorative sleep.
            </Text>
            <Pressable style={[styles.reminderBtn, { borderColor: SLEEP_ACCENT }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={SLEEP_ACCENT} />
              <Text style={[styles.reminderBtnText, { color: SLEEP_ACCENT }]}>Set Reminder for 9:00 PM</Text>
            </Pressable>
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  headerLeft: { width: 40 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  headerIconBtn: {
    padding: space.xs,
  },
  content: {
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
  },
  heroDuration: {
    ...typography['4xl'],
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: space.md,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginBottom: space.xl,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillIcon: { marginRight: space.xs },
  pillText: {
    ...typography.sm,
    fontWeight: '700',
  },
  section: {
    marginBottom: space.xl,
  },
  surfaceCard: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardLabel: {
    ...typography.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: space.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  cardTitle: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
    gap: space.sm,
  },
  statusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    ...typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusValue: {
    ...typography.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: space.xs,
  },
  bodyText: {
    ...typography.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyBold: {
    fontWeight: '700',
  },
  tipSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
    gap: space.sm,
  },
  tipIcon: { marginRight: 2 },
  tipSectionTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.md,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.md,
  },
  tipTitleBlock: { flex: 1 },
  tipLabel: {
    ...typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
  },
  reminderBtnText: {
    ...typography.base,
    fontWeight: '600',
  },
  bottomSpacer: { height: space['2xl'] },
});
