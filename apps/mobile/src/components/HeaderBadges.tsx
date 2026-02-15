import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';

type BadgeItem = { value: string; accent: 'violet' | 'amber' };

type HeaderBadgesProps = {
  badges: BadgeItem[];
};

export function HeaderBadges({ badges }: HeaderBadgesProps) {
  return (
    <View style={styles.wrapper}>
      {badges.map((b, i) => {
        const isViolet = b.accent === 'violet';
        const color = isViolet ? colors.primaryViolet : colors.actionAmber;
        const icon = isViolet ? 'flash' : 'fire';

        return (
          <View
            key={i}
            style={[
              styles.badge,
              { borderColor: `${color}40`, backgroundColor: `${color}15` }
            ]}
          >
            <MaterialCommunityIcons name={icon as any} size={14} color={color} style={styles.icon} />
            <Text style={[styles.value, { color: colors.textPrimary }]}>{b.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', gap: space.sm },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  value: {
    ...typography.sm,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});

