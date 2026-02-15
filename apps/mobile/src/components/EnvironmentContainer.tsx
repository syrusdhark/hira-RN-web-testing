import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';

export function EnvironmentContainer({
  children,
  footer,
  noPadding = false,
  disableScroll = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  disableScroll?: boolean;
}) {
  const Container = disableScroll ? View : ScrollView;
  const containerStyle = [styles.scroll, disableScroll && styles.content, disableScroll && noPadding && styles.contentNoPadding];
  const contentStyle = [styles.content, noPadding && styles.contentNoPadding];
  const containerProps = disableScroll ? {} : {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: contentStyle
  };

  return (
    <View style={styles.root}>
      <Container
        style={containerStyle}
        {...containerProps}
      >
        {children}
      </Container>
      {footer && (
        <View style={styles.fixedFooter}>
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgMidnight },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 110,
    paddingHorizontal: space.md, // Restored global padding for consistency
  },
  contentNoPadding: {
    paddingHorizontal: 0,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
