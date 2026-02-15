import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Section } from '../components/Section';
import { PrimaryButton } from '../components/PrimaryButton';
import { getTodayHealthData, openHealthConnectSettings, type GetTodayHealthDataResult } from '../services/HealthService';
import { colors, space, typography } from '../theme';

function formatSteps(value: number | null): string {
  if (value === null) return '--';
  return value.toLocaleString();
}

function formatSleepMinutes(value: number | null): string {
  if (value === null) return '--';
  const h = Math.floor(value / 60);
  const m = Math.round(value % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDistanceMeters(value: number | null): string {
  if (value === null) return '--';
  const km = value / 1000;
  return `${km.toFixed(2)} km`;
}

function formatPace(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(1)} min/km`;
}

function formatSyncedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return '--';
  }
}

export function HealthDataTestScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GetTodayHealthDataResult | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await getTodayHealthData();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const isPermissionDenied =
    result?.error === 'permission_denied' ||
    (result?.normalized &&
      'error' in result.normalized.steps &&
      result.normalized.steps.error === 'permission_denied');

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const err = await openHealthConnectSettings();
      if (err) Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  }, []);

  return (
    <EnvironmentContainer>
      <FloatingBackButton onPress={navigation.goBack} />
      <ScreenHeader />
      <Section spacing="md">
        <PrimaryButton
          label={loading ? 'Fetching…' : "Fetch Today's Health Data"}
          onPress={fetchData}
        />
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primaryViolet} />
          </View>
        )}
        {result && !loading && (
          <View style={styles.results}>
            <Text style={styles.label}>Steps</Text>
            <Text style={styles.value}>{result.error && !result.steps ? result.error : formatSteps(result.steps)}</Text>
            <Text style={styles.label}>Sleep</Text>
            <Text style={styles.value}>{formatSleepMinutes(result.sleepMinutes)}</Text>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{formatDistanceMeters(result.distanceMeters)}</Text>
            <Text style={styles.label}>Pace</Text>
            <Text style={styles.value}>{formatPace(result.paceMinPerKm)}</Text>
            <Text style={styles.label}>Last synced</Text>
            <Text style={styles.value}>{formatSyncedAt(result.syncedAt)}</Text>
            {result.error && (
              <Text style={styles.errorText}>{result.error}</Text>
            )}
          </View>
        )}
        {Platform.OS === 'android' && (
          <Section spacing="sm">
            <PrimaryButton
              label={isPermissionDenied && result ? 'Open Health Connect to grant access' : 'Open Health Connect (request access)'}
              onPress={requestPermissions}
            />
          </Section>
        )}
        {result && !loading && (
          <Section spacing="sm">
            <PrimaryButton label="Refresh data" onPress={fetchData} color={colors.primaryViolet} />
          </Section>
        )}
      </Section>
    </EnvironmentContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: space.md,
    alignItems: 'center',
  },
  results: {
    marginTop: space.md,
    paddingVertical: space.sm,
  },
  label: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: space.sm,
  },
  value: {
    ...typography.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  errorText: {
    ...typography.sm,
    color: colors.bodyOrange,
    marginTop: space.md,
  },
});
