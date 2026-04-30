// Splash / Welcome screen.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenBg, PrimaryButton, PulsingOrb } from '../src/ui';
import { colors } from '../src/theme';
import { loadState } from '../src/state';

const { width } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const state = await loadState();
      if (state.onboarded) {
        router.replace('/(tabs)');
        return;
      }
      setChecking(false);
      logoOpacity.value = withTiming(1, { duration: 1200 });
      logoScale.value = withSpring(1, { damping: 9 });
      titleOpacity.value = withDelay(700, withTiming(1, { duration: 800 }));
      taglineOpacity.value = withDelay(1400, withTiming(1, { duration: 800 }));
      buttonOpacity.value = withDelay(2200, withTiming(1, { duration: 600 }));
      buttonPulse.value = withDelay(
        2400,
        withRepeat(
          withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        ),
      );
    })();
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonPulse.value }],
  }));

  if (checking) {
    return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  }

  // Cap orb so the full layout fits inside common mobile heights (e.g. 667).
  const orbSize = Math.min(width * 0.5, 200);

  return (
    <ScreenBg>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <PulsingOrb size={orbSize} />
          </Animated.View>

          <Animated.Text style={[styles.title, titleStyle]} testID="splash-title">
            LifeScript
          </Animated.Text>

          <Animated.Text style={[styles.tagline, taglineStyle]} testID="splash-tagline">
            Sua vida. Escrita por você.{'\n'}Impulsionada por IA.
          </Animated.Text>

          <Animated.View style={[styles.buttonWrap, buttonStyle]}>
            <PrimaryButton
              label="Comece sua jornada"
              icon="arrow-forward"
              testID="splash-start-btn"
              onPress={() => router.push('/onboarding')}
            />
            <View style={styles.subRow}>
              <Ionicons name="shield-checkmark" size={14} color={colors.textDim} />
              <Text style={styles.subTxt}>Privado. Pessoal. Impulsionado por Claude.</Text>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.bottomGradient} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(124,58,237,0.18)']}
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logoWrap: { marginBottom: 18 },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: colors.textAccent,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    letterSpacing: 0.3,
  },
  buttonWrap: { width: '100%', alignItems: 'center', maxWidth: 360 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 },
  subTxt: { color: colors.textDim, fontSize: 12, marginLeft: 6 },
  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 240,
  },
});
