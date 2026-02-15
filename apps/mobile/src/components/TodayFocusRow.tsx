import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, typography } from '../theme';

type TodayFocusRowProps = {
  message: string;
};

export function TodayFocusRow({ message }: TodayFocusRowProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        <Text style={styles.label}>TODAY'S FOCUS</Text>
        <View style={styles.divider} />
        <Text style={styles.message} numberOfLines={1}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: space.md,
  },
  pill: {
    backgroundColor: `${colors.bgCharcoal}80`,
    borderRadius: radius.full,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...typography.xs,
    fontWeight: '800',
    color: colors.brandBlue,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: colors.borderDefault,
    marginHorizontal: space.md,
  },
  message: {
    ...typography.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});
