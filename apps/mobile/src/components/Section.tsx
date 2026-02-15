import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../theme';

type SectionProps = {
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
};

export function Section({ children, spacing = 'md' }: SectionProps) {
  const marginBottom = spacing === 'xs' ? space.xs :
    spacing === 'sm' ? space.sm :
      spacing === 'lg' ? space.lg :
        space.md;

  return (
    <View style={[styles.root, { marginBottom }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
});
