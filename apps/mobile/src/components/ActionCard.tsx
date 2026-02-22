import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';

type ActionCardProps = {
  title?: string;
  children?: React.ReactNode;
};

export function ActionCard({ children }: ActionCardProps) {
  return (
    <View style={styles.shadowContainer}>
      <View style={styles.cardContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
    shadowColor: colors.actionAmber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  cardContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgCharcoal,
    padding: space.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.2)',
  },
});
