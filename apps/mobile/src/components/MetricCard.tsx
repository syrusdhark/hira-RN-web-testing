import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, typography } from '../theme';

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  subtitle?: string;
};

export function MetricCard({ label, value, unit, subtitle }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.md,
    width: '100%',
  },
  label: {
    ...typography.sm,
    fontWeight: '500',
    color: colors.textTertiary,
    marginBottom: space.xs,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  value: {
    ...typography['3xl'],
    fontWeight: '600',
    color: colors.textPrimary,
  },
  unit: {
    ...typography.base,
    color: colors.textSecondary,
  },
  subtitle: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: space.xs,
  },
});
