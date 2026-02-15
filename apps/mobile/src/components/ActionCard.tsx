import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { PrimaryButton } from './PrimaryButton';

type ActionCardProps = {
  title?: string;
  children?: React.ReactNode;
};

export function ActionCard({ children }: ActionCardProps) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.xl,
    padding: space.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.2)',
    shadowColor: colors.actionAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
});
