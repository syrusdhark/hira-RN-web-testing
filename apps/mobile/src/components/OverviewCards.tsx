
import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, typography } from '../theme';

type CardAccent = 'green' | 'violet' | 'orange' | 'amber';

const accentColors: Record<CardAccent, string> = {
  green: colors.healthGreen,
  violet: colors.primaryViolet,
  orange: colors.bodyOrange,
  amber: colors.actionAmber,
};

const BODY_GRADIENT_TOP = colors.bgCharcoal;
const BODY_GRADIENT_BOTTOM = '#A60000'; // darker reddish-orange at bottom for visible gradient

export function BodyCard({
  value,
  unit,
  pace,
}: {
  value: string;
  unit: string;
  pace?: string;
}) {
  const accent = accentColors.orange;
  return (
    <View style={[styles.card, styles.bodyCard, { borderColor: `${accent}30` }]}>
      <LinearGradient
        colors={[BODY_GRADIENT_TOP, BODY_GRADIENT_BOTTOM]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 1]}
        style={styles.bodyCardGradient}
      />
      <View style={styles.bodyValueRow}>
        <Text style={styles.bigValue}>{value}</Text>
        <Text style={styles.bodyUnitLabel}>{unit}</Text>
      </View>
      {pace != null && pace !== '' && (
        <View style={styles.bodyPaceRow}>
          <Text style={styles.bodyPaceValue}>{pace}</Text>
          <Text style={styles.bodyUnitLabel}>pace</Text>
        </View>
      )}
    </View>
  );
}

const WORKOUT_CARD_BG_GRADIENT = ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(255,92,0,0.88)'] as const;

export function NextWorkoutCard({
  title,
  onPress,
  onStartPress,
  workoutName,
  completedToday,
  durationMinutes,
  isRestDay,
  restDayTitle,
  fullWidth = false,
  hideSubtitle = false,
  hideCta = false,
}: {
  title: string;
  onPress?: () => void;
  onStartPress?: () => void;
  workoutName?: string | null;
  completedToday?: boolean;
  durationMinutes?: number | null;
  isRestDay?: boolean;
  restDayTitle?: string | null;
  fullWidth?: boolean;
  hideSubtitle?: boolean;
  hideCta?: boolean;
}) {
  const accent = colors.bodyOrange;
  const displayName =
    workoutName && workoutName.trim().length > 0 ? workoutName : 'Workout';

  const isRest = !!isRestDay;
  const mainTitle = isRest
    ? (restDayTitle && restDayTitle.trim().length > 0
      ? restDayTitle
      : 'Rest & Recovery')
    : displayName;
  const subtitleText = isRest
    ? 'Today is a scheduled rest day'
    : 'High Intensity';
  const ctaLabel = isRest ? 'Recover' : 'Start';

  const backgroundSource = isRest
    ? require('../../assets/rest-day.png')
    : require('../../assets/man-working-out.png');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        styles.workoutCard,
        fullWidth && styles.cardFullWidth,
        { borderColor: `${accent}50` },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
      onPress={onPress}
    >
      <Image
        source={backgroundSource}
        style={styles.moveCardBgImage}
        resizeMode="contain"
      />
      <LinearGradient
        colors={WORKOUT_CARD_BG_GRADIENT}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.workoutCardBgGradient}
      />
      {title ? (
        <Text style={[styles.workoutCardTitle, { marginBottom: space.xs }]}>{title}</Text>
      ) : null}
      <Text style={styles.moveCardProgramName} numberOfLines={2}>
        {mainTitle}
      </Text>
      {(!hideSubtitle || !hideCta) ? (
        <View style={styles.moveCardContentRow}>
          <View style={styles.moveCardLeftColumn}>
            {!hideSubtitle ? (
              <View style={styles.moveCardSubtitleRow}>
                <Text style={styles.moveCardSubtitleText}>{subtitleText}</Text>
              </View>
            ) : null}
          </View>
          {!hideCta ? (
            <View style={styles.moveCardRightColumn}>
              {completedToday ? (
                <Text style={styles.moveCardCompletedText}>Completed</Text>
              ) : onStartPress != null ? (
                <Pressable
                  style={styles.moveCardPillButtonWrap}
                  onPress={onStartPress}
                >
                  <LinearGradient
                    colors={[accent, '#E65100']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.moveCardPillButton}
                  >
                    <Text style={styles.moveCardPillButtonText}>{ctaLabel}</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <View style={styles.moveCardPillButtonWrap}>
                  <LinearGradient
                    colors={[accent, '#E65100']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.moveCardPillButton}
                  >
                    <Text style={styles.moveCardPillButtonText}>{ctaLabel}</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius['2xl'],
    padding: space.lg,
    borderWidth: 1,
    width: '48.5%',
    minHeight: 180,
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  cardFullWidth: {
    width: '100%',
  },
  bodyCard: {
    overflow: 'hidden',
    shadowColor: colors.bodyOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bodyCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
  },
  workoutCard: {
    overflow: 'hidden',
    borderWidth: 1.5,
    minHeight: 248,
    shadowColor: colors.actionAmber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  workoutCardBgGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
  },
  moveCardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: radius['2xl'],
  },
  workoutCardTitle: {
    ...typography.xs,
    fontWeight: '800',
    color: colors.bodyOrange,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  moveCardProgramName: {
    ...typography['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: space.sm,
  },
  moveCardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveCardLeftColumn: {
    flex: 1,
    marginRight: space.sm,
  },
  moveCardRightColumn: {
    alignItems: 'flex-end',
  },
  moveCardSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  moveCardSubtitleText: {
    ...typography.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  moveCardPillButtonWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  moveCardPillButton: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveCardPillButtonText: {
    ...typography.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moveCardCompletedText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  workoutContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutStats: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: space.xs,
  },
  workoutStatLine: {
    ...typography.sm,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  cardLabel: {
    ...typography.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bigValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bodyValueRow: {
    alignItems: 'center',
    marginVertical: space.sm,
  },
  bodyUnitLabel: {
    ...typography.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  unitLabel: {
    ...typography.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  bodyPaceRow: {
    alignItems: 'center',
    marginTop: space.sm,
  },
  bodyPaceValue: {
    ...typography.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  workoutIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1.5,
  },
});
