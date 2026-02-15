import React from 'react';
import { StyleSheet, View, Platform, StatusBar, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { colors, radius, typography, space } from '../theme';
import { HeaderBadges } from './HeaderBadges';

type BadgeItem = { value: string; accent: 'violet' | 'amber' };

type ScreenHeaderProps = {
  leftElement?: React.ReactNode;
  rightBadges?: BadgeItem[];
  onNavigateToCart?: () => void;
};

export function ScreenHeader({ leftElement, rightBadges, onNavigateToCart }: ScreenHeaderProps) {
  const { totalCount } = useCart();
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 44;

  return (
    <View style={[styles.root, { paddingTop }]}>
      {leftElement ?? null}
      <View style={styles.spacer} />
      <View style={styles.rightContent}>
        {rightBadges && rightBadges.length > 0 ? (
          <HeaderBadges badges={rightBadges} />
        ) : null}

        {onNavigateToCart && (
          <Pressable
            onPress={onNavigateToCart}
            style={styles.cartButton}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color={colors.textPrimary} />
            {totalCount > 0 && (
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{totalCount > 9 ? '9+' : totalCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: space.sm,
  },
  spacer: {
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  cartCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primaryViolet,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgMidnight,
  },
  cartCountText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
});
