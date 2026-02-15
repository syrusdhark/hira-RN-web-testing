import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';

export type NutritionRingProps = {
  calories: number;
  targetCalories: number;
  size?: number;
  strokeWidth?: number;
  overflowStrokeWidth?: number;
};

export function NutritionRing({
  calories,
  targetCalories,
  size = 200,
  strokeWidth = 12,
  overflowStrokeWidth = 6,
}: NutritionRingProps) {
  const safeTarget = Math.max(targetCalories || 0, 1);
  const safeCalories = Math.max(calories || 0, 0);

  const ratio = safeCalories / safeTarget;
  const baseProgress = Math.min(ratio, 1);
  const overflowProgress = ratio > 1 ? Math.min(ratio - 1, 1) : 0;

  const half = size / 2;
  const radius = half - strokeWidth / 2;
  const overflowRadius = radius + overflowStrokeWidth;

  const circumference = 2 * Math.PI * radius;
  const baseDashOffset = circumference * (1 - baseProgress);

  const overflowCircumference = 2 * Math.PI * overflowRadius;
  const overflowDashOffset = overflowCircumference * (1 - overflowProgress);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={half} originY={half}>
          {/* Track */}
          <Circle
            cx={half}
            cy={half}
            r={radius}
            stroke={colors.bgElevated}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Main progress */}
          {baseProgress > 0 && (
            <Circle
              cx={half}
              cy={half}
              r={radius}
              stroke={colors.actionAmber}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={baseDashOffset}
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Overflow progress (outer ring) */}
          {overflowProgress > 0 && (
            <Circle
              cx={half}
              cy={half}
              r={overflowRadius}
              stroke={colors.bodyOrange}
              strokeWidth={overflowStrokeWidth}
              strokeDasharray={`${overflowCircumference} ${overflowCircumference}`}
              strokeDashoffset={overflowDashOffset}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

