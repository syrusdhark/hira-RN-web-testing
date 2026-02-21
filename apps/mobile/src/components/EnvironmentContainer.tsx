import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '../theme';
import { TAB_BAR_ROW_HEIGHT } from '../constants/layout';

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
  const insets = useSafeAreaInsets();
  const contentBottomPadding = footer != null
    ? insets.bottom + TAB_BAR_ROW_HEIGHT
    : 110;

  const Container = disableScroll ? View : ScrollView;
  const containerStyle = [
    styles.scroll,
    disableScroll && styles.content,
    disableScroll && noPadding && styles.contentNoPadding,
    disableScroll && footer != null && { paddingBottom: contentBottomPadding },
  ];
  const contentStyle = [
    styles.content,
    noPadding && styles.contentNoPadding,
    { paddingBottom: contentBottomPadding },
  ];
  const containerProps = disableScroll ? {} : {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: contentStyle
  };

  return (
    <LinearGradient
      colors={[colors.bgGradientTop, colors.bgGradientBottom]}
      style={styles.root}
    >
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: space.md,
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
