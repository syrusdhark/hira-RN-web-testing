import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, space } from '../theme';
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
  const bottomInset = Platform.OS === 'ios' ? 34 : space.md;
  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
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
