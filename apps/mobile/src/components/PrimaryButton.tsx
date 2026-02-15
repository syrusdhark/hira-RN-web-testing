import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, space, typography } from '../theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  color?: string;
};

export function PrimaryButton({ label, onPress, color = colors.actionAmber }: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        pressed && styles.pressed
      ]}
      onPress={onPress ?? (() => { })}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  label: {
    ...typography.base,
    fontWeight: '800',
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
