import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, space, typography } from '../theme';

const LOGO_SIZE = 120;
const DURATION = 400;
const STAGGER = 180;

type WelcomeSplashScreenProps = {
  onComplete: () => void;
};

export function WelcomeSplashScreen({ onComplete }: WelcomeSplashScreenProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(12);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(12);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    logoOpacity.value = withTiming(1, { duration: DURATION, easing });
    logoScale.value = withTiming(1, { duration: DURATION, easing });

    titleOpacity.value = withDelay(
      STAGGER,
      withTiming(1, { duration: DURATION - 50, easing })
    );
    titleTranslateY.value = withDelay(
      STAGGER,
      withTiming(0, { duration: DURATION - 50, easing })
    );

    taglineOpacity.value = withDelay(
      STAGGER * 2,
      withTiming(1, { duration: DURATION - 50, easing })
    );
    taglineTranslateY.value = withDelay(
      STAGGER * 2,
      withTiming(0, { duration: DURATION - 50, easing })
    );

    buttonOpacity.value = withDelay(
      STAGGER * 3,
      withTiming(1, { duration: DURATION - 50, easing })
    );
  }, [
    logoOpacity,
    logoScale,
    titleOpacity,
    titleTranslateY,
    taglineOpacity,
    taglineTranslateY,
    buttonOpacity,
  ]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          colors.bgMidnight,
          '#0f0f1a',
          '#1a1a2e',
          '#0f0f1a',
          colors.bgMidnight,
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/hira-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Hira logo"
          />
        </Animated.View>
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          Hira AI
        </Animated.Text>
        <Animated.View style={taglineAnimatedStyle}>
          <Text style={styles.tagline}>Your journey to wellness</Text>
          <Text style={styles.tagline}>starts here.</Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.footer, buttonAnimatedStyle]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onComplete}
          accessibilityLabel="Get started"
        >
          <Text style={styles.buttonText}>Get started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space['3xl'],
  },
  logoWrap: {
    marginBottom: space.xl,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  title: {
    ...typography['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: space.md,
  },
  tagline: {
    ...typography.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space['3xl'],
  },
  button: {
    backgroundColor: colors.primaryViolet,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    ...typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
