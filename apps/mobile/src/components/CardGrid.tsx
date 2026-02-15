import React from 'react';
import { StyleSheet, View } from 'react-native';

type CardGridProps = {
  children: React.ReactNode;
};

export function CardGrid({ children }: CardGridProps) {
  return (
    <View style={styles.row}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
});
