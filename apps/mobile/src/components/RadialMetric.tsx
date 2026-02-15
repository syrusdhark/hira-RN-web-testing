import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, typography } from '../theme';

type RadialMetricProps = {
  label?: string;
  value: string;
  statusText?: string;
  statusColor?: string;
  progress?: number;
};

export function RadialMetric({
  value,
  statusText,
  statusColor = colors.healthGreen,
}: RadialMetricProps) {
  return (
    <View style={styles.wrapper}>
      {/* Background Glows */}
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />

      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        {statusText ? (
          <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },

  glow: {
    position: 'absolute',
    width: 60,
    height: 30,
    borderRadius: 30,
    opacity: 0.2,
  },
  glowLeft: {
    backgroundColor: '#333333',
    bottom: 40,
    left: '25%',
  },
  glowRight: {
    backgroundColor: colors.primaryViolet,
    bottom: 40,
    right: '25%',
  },
  content: {
    alignItems: 'center',
  },
  value: {
    ...typography['4xl'],
    fontSize: 100,
    lineHeight: 110,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -4,
  },
  status: {
    ...typography.sm,
    fontWeight: '900',
    marginTop: space.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
