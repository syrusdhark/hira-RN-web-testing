import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, typography } from '../theme';

type ProgressBarProps = {
  value: number;
  label?: string;
  color?: string;
  height?: number;
};

export function ProgressBar({
  value,
  label,
  color = colors.primaryViolet,
  height = 8,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: space.xs },
  label: {
    ...typography.xs,
    fontWeight: '500',
    color: colors.textTertiary,
    marginBottom: space['2xs'],
  },
  track: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
