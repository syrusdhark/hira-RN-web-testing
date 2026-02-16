import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';

const APP_VERSION = '1.0.0';

type PreferencesScreenProps = {
  navigation: { goBack: () => void };
};

export function PreferencesScreen({ navigation }: PreferencesScreenProps) {
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [shareUsageData, setShareUsageData] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState(false);

  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 44;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>GENERAL</Text>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryViolet + '22' }]}>
            <MaterialCommunityIcons name="scale-bathroom" size={22} color={colors.primaryViolet} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>Units of Measurement</Text>
          </View>
          <View style={styles.segmentRow}>
            <Pressable
              style={[
                styles.segmentOption,
                units === 'imperial' && styles.segmentOptionSelected,
              ]}
              onPress={() => setUnits('imperial')}
            >
              <Text
                style={[
                  styles.segmentText,
                  units === 'imperial' && styles.segmentTextSelected,
                ]}
              >
                Imperial
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentOption,
                units === 'metric' && styles.segmentOptionSelected,
              ]}
              onPress={() => setUnits('metric')}
            >
              <Text
                style={[
                  styles.segmentText,
                  units === 'metric' && styles.segmentTextSelected,
                ]}
              >
                Metric
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <Pressable style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryIndigo + '22' }]}>
            <MaterialCommunityIcons name="weather-night" size={22} color={colors.primaryIndigo} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>App Theme</Text>
            <View style={styles.rowRight}>
              <Text style={styles.cardValue}>System Default</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
            </View>
          </View>
        </Pressable>

        <Text style={styles.sectionLabel}>PRIVACY & DATA</Text>
        <View style={[styles.card, styles.cardColumn]}>
          <View style={styles.privacyRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.healthGreen + '22' }]}>
              <MaterialCommunityIcons name="chart-bar" size={22} color={colors.healthGreen} />
            </View>
            <View style={styles.privacyContent}>
              <Text style={styles.cardTitle}>Share Usage Data</Text>
              <Text style={styles.cardSubtitle}>Help us improve Hira AI</Text>
            </View>
            <Switch
              value={shareUsageData}
              onValueChange={setShareUsageData}
              trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <View style={styles.privacyDivider} />
          <View style={styles.privacyRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tabAccentRose + '22' }]}>
              <MaterialCommunityIcons name="target" size={22} color={colors.tabAccentRose} />
            </View>
            <View style={styles.privacyContent}>
              <Text style={styles.cardTitle}>Personalized Recs</Text>
              <Text style={styles.cardSubtitle}>Tailored suggestions</Text>
            </View>
            <Switch
              value={personalizedRecs}
              onValueChange={setPersonalizedRecs}
              trackColor={{ false: colors.borderDefault, true: colors.primaryViolet }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <View style={styles.privacyDivider} />
          <Pressable style={styles.privacyRow}>
            <View style={styles.privacyContentFlex}>
              <Text style={styles.cardTitle}>Read Privacy Policy</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={styles.footerVersion}>Hira AI v{APP_VERSION}</Text>
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
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.bgMidnight,
  },
  backButton: {
    padding: space.xs,
    minWidth: 44,
  },
  headerTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    minWidth: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingBottom: space['2xl'],
  },
  sectionLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  card: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: space.sm,
  },
  cardColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.sm,
  },
  cardTitle: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardContent: {
    flex: 1,
    marginRight: space.sm,
  },
  cardValue: {
    ...typography.sm,
    color: colors.textSecondary,
    marginRight: space.xs,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    padding: 2,
  },
  segmentOption: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
  },
  segmentOptionSelected: {
    backgroundColor: colors.primaryViolet,
  },
  segmentText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  segmentTextSelected: {
    color: colors.textPrimary,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: space.xs,
  },
  privacyContent: {
    flex: 1,
    marginLeft: 0,
  },
  privacyContentFlex: {
    flex: 1,
  },
  privacyDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: space.xs,
    marginLeft: 40 + space.sm,
  },
  cardSubtitle: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerVersion: {
    ...typography.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: space['2xl'],
  },
});
