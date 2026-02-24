import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, space, typography } from '../theme';

const TAB_ICON_SIZE = 28;
const TAB_IMAGE_SIZE = 36;
const ICON_ACTIVE_OFFSET = 6;
const LABEL_OFFSET_INACTIVE = 4;
const DOT_SIZE = 4;
const JUMP_DURATION = 400;
const TRANSITION_DURATION = 300;

const EASING_JUMP = Easing.bezier(0.25, 1, 0.5, 1);

type TabItemProps = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconImage?: number;
  activeColor?: string;
  active: boolean;
  onPress?: () => void;
};

export function TabItem({ label, icon, iconImage, activeColor, active, onPress }: TabItemProps) {
  const accent = activeColor ?? colors.primaryViolet;
  const iconColor = active ? accent : colors.textTertiary;

  const iconTranslateY = useSharedValue(active ? -ICON_ACTIVE_OFFSET : 0);
  const activeVal = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    iconTranslateY.value = withTiming(active ? -ICON_ACTIVE_OFFSET : 0, {
      duration: active ? JUMP_DURATION : TRANSITION_DURATION,
      easing: EASING_JUMP,
    });
    activeVal.value = withTiming(active ? 1 : 0, { duration: TRANSITION_DURATION });
  }, [active, iconTranslateY, activeVal]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconTranslateY.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: activeVal.value,
    transform: [{ translateY: interpolate(activeVal.value, [0, 1], [LABEL_OFFSET_INACTIVE, 0]) }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: activeVal.value * 0.6,
    transform: [{ scale: activeVal.value }],
  }));

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress ?? (() => { })}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.iconWrap, iconAnimatedStyle]}>
        {iconImage != null ? (
          <Image
            source={iconImage}
            style={[styles.tabImage, { opacity: active ? 1 : 0.6 }]}
            resizeMode="contain"
            fadeDuration={0}
          />
        ) : (
          <MaterialCommunityIcons name={icon} size={TAB_ICON_SIZE} color={iconColor} />
        )}
      </Animated.View>
      <Animated.Text
        style={[styles.label, labelAnimatedStyle, active && { color: accent }]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
      <Animated.View style={[styles.dot, { backgroundColor: accent }, dotAnimatedStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabImage: {
    width: TAB_IMAGE_SIZE,
    height: TAB_IMAGE_SIZE,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: space.sm,
    paddingBottom: 8,
    gap: 6,
  },
  label: {
    ...typography.sm,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
