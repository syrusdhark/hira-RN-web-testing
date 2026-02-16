
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

const NUTRITION_RINGS = [
  { size: 80, stroke: 5, pct: 0.65 },
  { size: 56, stroke: 4, pct: 0.5 },
  { size: 32, stroke: 3, pct: 0.55 },
];

function NutritionRing({
  size,
  stroke,
  pct,
  accent,
  trackColor,
}: {
  size: number;
  stroke: number;
  pct: number;
  accent: string;
  trackColor: string;
}) {
  const r = size / 2;
  const maskHeight = pct <= 0.5 ? size : size * (1 - (pct - 0.5) / 0.25);
  return (
    <View style={[styles.nutritionRingWrap, { width: size, height: size, borderRadius: r }]}>
      <View style={[styles.nutritionRingTrack, { width: size, height: size, borderRadius: r, borderWidth: stroke, borderColor: trackColor }]} />
      <View style={[styles.nutritionRingProgressWrap, { width: size, height: size, borderRadius: r, overflow: 'hidden' }]} pointerEvents="none">
        <View
          style={[
            styles.nutritionRingArc,
            {
              width: size,
              height: size,
              borderRadius: r,
              borderWidth: stroke,
              borderColor: 'transparent',
              borderBottomColor: accent,
              borderRightColor: accent,
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
        <View style={[styles.radialProgressMask, { height: maskHeight, backgroundColor: colors.bgCharcoal }]} />
      </View>
    </View>
  );
}

const NUTRITION_GRADIENT_TOP = "#000000";
const NUTRITION_GRADIENT_BOTTOM = '#00692B'; // dark green tint at bottom

export function NutritionCard({
  currentCalories,
  mealsLogged = 0,
  onPress,
  fullWidth = false,
}: {
  currentCalories: number;
  mealsLogged?: number;
  onPress?: () => void;
  fullWidth?: boolean;
}) {
  const accent = accentColors.green;

  const content = (
    <>
      <LinearGradient
        colors={[NUTRITION_GRADIENT_TOP, NUTRITION_GRADIENT_BOTTOM]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 1]}
        style={styles.nutritionCardGradient}
      />
      <Text style={styles.nutritionCardTitle}>NOURISH</Text>

      <View style={styles.nutritionCardContent}>
        <Text style={[styles.nutritionMealsLine, { color: colors.textPrimary }]}>
          {mealsLogged} meals logged today
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          styles.nutritionCard,
          fullWidth && styles.cardFullWidth,
          { borderColor: `${accent}30` },
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    )
  }

  return (
    <View style={[styles.card, styles.nutritionCard, fullWidth && styles.cardFullWidth, { borderColor: `${accent}30` }]}>
      {content}
    </View>
  );
}

const SLEEP_ACCENT = colors.brandBlue;
const SLEEP_GRADIENT_TOP = '#000000'; // deep dark teal
const SLEEP_GRADIENT_BOTTOM = '#16456E';

export function SleepCard({
  duration,
  qualityValue,
  onPress,
}: {
  duration: string;
  qualityValue: number;
  onPress?: () => void;
}) {
  const [hours, minutes] = duration.split(' ');
  const hoursNum = hours.replace('h', '').trim();
  const minutesNum = minutes.replace('m', '').trim();

  const cardContent = (
    <>
      <LinearGradient
        colors={[SLEEP_GRADIENT_TOP, SLEEP_GRADIENT_BOTTOM]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 1]}
        style={styles.sleepCardGradient}
      />
      <Text style={styles.sleepCardTitle}>SLEEP</Text>
      <View style={styles.sleepCardContent}>
        <View style={[styles.sleepIconWrap, { backgroundColor: `${SLEEP_ACCENT}20` }]}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={28} color={SLEEP_ACCENT} />
        </View>
        <View style={styles.sleepDurationRow}>
          <Text style={styles.sleepBigValue}>{hoursNum}</Text>
          <Text style={styles.sleepUnitSmall}>h</Text>
          <Text style={styles.sleepUnitSmall}>  </Text>
          <Text style={styles.sleepBigValue}>{minutesNum}</Text>
          <Text style={styles.sleepUnitSmaller}>m</Text>
          <Text style={[styles.sleepUnitSmaller, { marginLeft: 4, opacity: 0.7 }]}>slept</Text>
        </View>
      </View>
    </>
  );

  const cardStyle = [
    styles.card,
    styles.sleepCard,
    { borderColor: `${SLEEP_ACCENT}35` },
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [...cardStyle, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
        onPress={onPress}
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{cardContent}</View>;
}

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
  const accent = colors.bodyOrange;
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

const HABIT_GRADIENT_TOP = '#000000';
const HABIT_GRADIENT_BOTTOM = '#3b0764'; // dark purple

const ROUTINE_NAME_MAX_LENGTH = 10;

function truncateRoutineName(name: string): string {
  if (name.length <= ROUTINE_NAME_MAX_LENGTH) return name;
  return name.slice(0, ROUTINE_NAME_MAX_LENGTH) + '...';
}

export type HabitCardItem = { name: string; completed: boolean };

export function HabitCard({
  onPress,
  habits,
  habitsLeftToTrack,
}: {
  onPress?: () => void;
  habits?: HabitCardItem[];
  habitsLeftToTrack?: number;
}) {
  const accent = colors.primaryViolet;
  const items = (habits ?? []).slice(0, 3);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const footerText = `${completedCount} of ${totalCount}`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        styles.habitCard,
        { borderColor: `${accent}40` },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={[HABIT_GRADIENT_TOP, HABIT_GRADIENT_BOTTOM]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 1]}
        style={styles.habitCardGradient}
      />

      <Text style={styles.habitCardTitle}>ROUTINES</Text>

      <View style={styles.habitList}>
        {items.length === 0 ? (
          <Text style={styles.habitText}>—</Text>
        ) : (
          items.map((item) => (
            <View key={item.name} style={styles.habitRow}>
              <MaterialCommunityIcons
                name={item.completed ? 'check-circle' : 'circle-outline'}
                size={18}
                color={colors.textPrimary}
              />
              <Text style={[styles.habitText, styles.habitTextTruncate]} numberOfLines={1}>{truncateRoutineName(item.name)}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.habitFooter}>{footerText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius['2xl'],
    padding: space.lg,
    borderWidth: 1,
    width: '48.5%', // Slightly larger to fill space better but allow wrapping
    minHeight: 180,
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  cardFullWidth: {
    width: '100%',
  },
  sleepCard: {
    overflow: 'hidden',
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  nutritionCard: {
    overflow: 'hidden',
    shadowColor: colors.healthGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 180,
  },
  nutritionCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
  },
  sleepCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
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
    marginRight: space.md,
    justifyContent: 'center',
  },
  moveCardMainTitle: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: space.xs,
  },
  moveCardSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  moveCardSubtitleText: {
    ...typography.sm,
    color: colors.textPrimary,
  },
  moveCardRightColumn: {
    justifyContent: 'center',
  },
  moveCardPillButtonWrap: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  moveCardPillButton: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
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
  habitCard: {
    overflow: 'hidden',
    shadowColor: colors.primaryViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  habitCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
  },
  habitCardTitle: {
    ...typography.xs,
    fontWeight: '800',
    color: colors.primaryViolet,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: space.md,
  },
  habitList: {
    gap: space.sm,
    marginBottom: space.md,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  habitText: {
    ...typography.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  habitTextTruncate: {
    flex: 1,
    minWidth: 0,
  },
  habitSummary: {
    ...typography.xs,
    color: colors.primaryViolet,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 'auto',
  },
  habitFooter: {
    ...typography.xs,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 'auto',
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
  nutritionRingsContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: space.sm,
  },
  nutritionRingOuter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionRingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionRingTrack: {
    position: 'absolute',
  },
  nutritionRingProgressWrap: {
    position: 'absolute',
  },
  nutritionRingArc: {
    position: 'absolute',
  },
  radialProgressMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCharcoal,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: space.xs,
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  pillText: {
    ...typography.xs,
    fontWeight: '700',
  },
  sleepCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sleepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: space.md,
  },
  sleepDurationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sleepBigValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sleepUnitSmall: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 2,
  },
  sleepUnitSmaller: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 2,
  },
  sleepValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginVertical: space.sm,
  },
  unitText: {
    ...typography.sm,
    color: colors.textSecondary,
    marginRight: space.xs,
  },
  qualityContainer: {
    marginTop: space.sm,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qualityLabel: {
    ...typography.xs,
    color: colors.textTertiary,
    fontWeight: '700',
  },
  qualityPerc: {
    ...typography.xs,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  qualityBarContainer: {
    height: 4,
    backgroundColor: colors.borderDefault,
    borderRadius: 2,
    overflow: 'hidden',
  },
  qualityBar: {
    height: '100%',
    borderRadius: 2,
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
  nutritionCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: space.md,
  },
  nutritionCardTitle: {
    ...typography.xs,
    fontWeight: '800',
    color: colors.healthGreen,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  sleepCardTitle: {
    ...typography.xs,
    fontWeight: '800',
    color: colors.brandBlue,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  nutritionMainValueContainer: {
    alignItems: 'center',
    gap: space.xs,
  },
  nutritionBigValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  nutritionDivider: {
    width: 32,
    height: 2,
    backgroundColor: colors.borderDefault,
    marginVertical: 4,
  },
  nutritionMealsLeft: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nutritionMealsLine: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
});
