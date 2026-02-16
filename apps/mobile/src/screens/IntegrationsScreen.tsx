import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';

type IntegrationsScreenProps = {
  navigation: { goBack: () => void };
};

const AVAILABLE_ITEMS = [
  { id: 'google-fit', name: 'Google Fit', subtitle: 'Activity & workouts', icon: 'run' as const },
  { id: 'myfitnesspal', name: 'MyFitnessPal', subtitle: 'Nutrition tracking', icon: 'nutrition' as const },
  { id: 'strava', name: 'Strava', subtitle: 'Social fitness', icon: 'run' as const },
  { id: 'fitbit', name: 'Fitbit', subtitle: 'Health monitor', icon: 'heart-pulse' as const },
];

export function IntegrationsScreen({ navigation }: IntegrationsScreenProps) {
  const [appleHealthOn, setAppleHealthOn] = useState(true);
  const [ouraOn, setOuraOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 44;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Integrations</Text>
        <Pressable style={styles.headerRight} accessibilityLabel="Help">
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            Connect your <Text style={styles.introAccent}>data sources</Text>
          </Text>
          <Text style={styles.introSubtitle}>
            Link third party apps to power Hira AI with your health and activity data.
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Integrations..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionLabel}>ACTIVE CONNECTIONS</Text>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: colors.healthGreen + '22' }]}>
            <MaterialCommunityIcons name="heart" size={22} color={colors.healthGreen} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Apple Health</Text>
            <Text style={styles.cardSubtitle}>• Syncing active</Text>
          </View>
          <Switch
            value={appleHealthOn}
            onValueChange={setAppleHealthOn}
            trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
            thumbColor={colors.textPrimary}
          />
        </View>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: colors.borderDefault }]}>
            <MaterialCommunityIcons name="circle-outline" size={22} color={colors.textSecondary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Oura</Text>
            <Text style={styles.cardSubtitle}>• Syncing active</Text>
          </View>
          <Switch
            value={ouraOn}
            onValueChange={setOuraOn}
            trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>AVAILABLE</Text>
          <Pressable>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {AVAILABLE_ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryViolet + '22' }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={colors.primaryViolet} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Pressable style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerHint}>Don&apos;t see your app?</Text>
          <Pressable>
            <Text style={styles.footerLink}>Request an Integration →</Text>
          </Pressable>
        </View>
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
  headerRight: { padding: space.xs, minWidth: 44 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.md, paddingBottom: space['2xl'] },
  intro: { marginTop: space.lg, marginBottom: space.md },
  introTitle: { ...typography.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: space.xs },
  introAccent: { color: colors.primaryViolet },
  introSubtitle: { ...typography.sm, color: colors.textSecondary },
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
  searchInput: {
    flex: 1,
    ...typography.base,
    color: colors.textPrimary,
    paddingVertical: space.sm,
  },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: space.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  seeAll: { ...typography.sm, fontWeight: '600', color: colors.primaryViolet },
  card: {
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
  cardContent: { flex: 1 },
  cardTitle: { ...typography.base, fontWeight: '600', color: colors.textPrimary },
  cardSubtitle: { ...typography.sm, color: colors.textSecondary, marginTop: 2 },
  connectButton: {
    backgroundColor: colors.primaryViolet,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  connectButtonText: { ...typography.sm, fontWeight: '600', color: colors.textPrimary },
  footer: { marginTop: space.xl, alignItems: 'center' },
  footerHint: { ...typography.sm, color: colors.textTertiary, marginBottom: space.xs },
  footerLink: { ...typography.sm, fontWeight: '600', color: colors.primaryViolet },
});
