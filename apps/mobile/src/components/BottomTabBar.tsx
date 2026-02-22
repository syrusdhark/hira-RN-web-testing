import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { TAB_BAR_ROW_HEIGHT } from '../constants/layout';
import { TabItem } from './TabItem';

export type TabConfig = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconImage?: number; // require() asset for custom tab icon (e.g. logo)
  activeColor?: string;
};

type BottomTabBarProps = {
  tabs: TabConfig[];
  activeTab: string;
  onTabPress: (key: string) => void;
};

export function BottomTabBar({ tabs, activeTab, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Base padding for the tab item content area (applies on all platforms)
  const BASE_BOTTOM_PADDING = Platform.OS === 'android' ? 8 : 10;

  // Extra padding added only when the device has a home indicator / gesture bar
  // (e.g. iPhone Face ID models, Android gesture-nav devices).
  // insets.bottom will be > 0 on those devices; we add it on top of the base.
  const safeAreaExtra = insets.bottom > 0 ? insets.bottom : 0;

  const containerBottomPadding = BASE_BOTTOM_PADDING + safeAreaExtra;

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: containerBottomPadding,
          minHeight: TAB_BAR_ROW_HEIGHT + containerBottomPadding,
        },
      ]}
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          label={tab.label}
          icon={tab.icon}
          iconImage={tab.iconImage}
          activeColor={tab.activeColor}
          active={activeTab === tab.key}
          onPress={() => onTabPress(tab.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    // height: 72, // Removed fixed height to allow TabItem padding to dictate size
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMidnight,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    paddingHorizontal: space.md,
  },
});
