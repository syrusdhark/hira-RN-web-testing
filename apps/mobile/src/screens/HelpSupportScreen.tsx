import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';

const APP_VERSION = '1.0.0';

type HelpSupportScreenProps = {
  navigation: { goBack: () => void };
};

const SELF_SERVICE_ITEMS = [
  { id: 'getting-started', label: 'Getting Started', icon: 'rocket-launch' as const },
  { id: 'security', label: 'Security', icon: 'shield-check' as const },
  { id: 'ai-features', label: 'AI Features', icon: 'robot' as const },
  { id: 'billing', label: 'Billing', icon: 'file-document-outline' as const },
];

const TOP_QUESTIONS = [
  'How do I reset my API key?',
  'Can I upgrade my subscription?',
  'Is my data private?',
];

const GET_IN_TOUCH_ITEMS = [
  { id: 'chat', title: 'Live Chat', subtitle: 'Wait time: < 2 mins', icon: 'chat' as const, iconColor: colors.healthGreen },
  { id: 'email', title: 'Email Support', subtitle: 'We usually reply within 24h', icon: 'email-outline' as const, iconColor: colors.primaryIndigo },
  { id: 'bug', title: 'Report a Bug', subtitle: 'Help us improve Hira AI', icon: 'cog-outline' as const, iconColor: colors.bodyOrange },
];

export function HelpSupportScreen({ navigation }: HelpSupportScreenProps) {
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 44;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introTitle}>How can we help you today?</Text>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for articles, topics..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <Text style={styles.sectionLabel}>SELF SERVICE</Text>
        <View style={styles.grid}>
          {SELF_SERVICE_ITEMS.map((item) => (
            <Pressable key={item.id} style={styles.gridCard}>
              <View style={[styles.gridIconWrap, { backgroundColor: colors.primaryViolet + '22' }]}>
                <MaterialCommunityIcons name={item.icon} size={28} color={colors.primaryViolet} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>TOP QUESTIONS</Text>
          <Pressable>
            <Text style={styles.seeAll}>View all</Text>
          </Pressable>
        </View>
        {TOP_QUESTIONS.map((q, i) => (
          <Pressable key={i} style={styles.faqRow}>
            <Text style={styles.faqText}>{q}</Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textTertiary} />
          </Pressable>
        ))}

        <Text style={styles.sectionLabel}>GET IN TOUCH</Text>
        {GET_IN_TOUCH_ITEMS.map((item) => (
          <Pressable key={item.id} style={styles.touchRow}>
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '22' }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
            </View>
            <View style={styles.touchContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
          </Pressable>
        ))}

        <Text style={styles.footerVersion}>Hira AI v{APP_VERSION}</Text>
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
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.bgMidnight,
  },
  backButton: { padding: space.xs, minWidth: 44 },
  headerTitle: { ...typography.lg, fontWeight: '700', color: colors.textPrimary },
  headerRight: { minWidth: 44 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.md, paddingBottom: space['2xl'] },
  introTitle: { ...typography.xl, fontWeight: '700', color: colors.textPrimary, marginTop: space.lg, marginBottom: space.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: space.md,
    marginBottom: space.lg,
  },
  searchIcon: { marginRight: space.sm },
  searchInput: { flex: 1, ...typography.base, color: colors.textPrimary, paddingVertical: space.sm },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.lg, marginBottom: space.sm },
  seeAll: { ...typography.sm, fontWeight: '600', color: colors.primaryViolet },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -space.xs,
  },
  gridCard: {
    width: '50%',
    padding: space.xs,
    marginBottom: space.sm,
  },
  gridIconWrap: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 80,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  gridLabel: { ...typography.sm, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: space.sm,
  },
  faqText: { ...typography.base, color: colors.textPrimary, flex: 1 },
  touchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: space.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.sm,
  },
  touchContent: { flex: 1 },
  cardTitle: { ...typography.base, fontWeight: '600', color: colors.textPrimary },
  cardSubtitle: { ...typography.sm, color: colors.textSecondary, marginTop: 2 },
  footerVersion: { ...typography.xs, color: colors.textTertiary, textAlign: 'center', marginTop: space['2xl'] },
});
