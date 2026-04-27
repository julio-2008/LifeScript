// "Generating your LifeScript..." screen — pulsing orb + AI plan request.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { ScreenBg, PulsingOrb } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, todayKey, StoredMission } from '../src/state';
import { generateInitialPlan } from '../src/api';

const PHASES = [
  'Reading your story…',
  'Mapping your life areas…',
  'Designing your missions…',
  'Composing your weekly quest…',
  'Writing your first quote…',
];

export default function Generating() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const opacity = useSharedValue(0.5);
  const startedRef = useRef(false);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => Math.min(p + 1, PHASES.length - 1));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const t0 = Date.now();
      try {
        const state = await loadState();
        if (!state.profile) {
          router.replace('/onboarding');
          return;
        }
        const plan = await generateInitialPlan(state.profile);

        // Build stored missions: 7 missions tied to today + next 6 days.
        const today = new Date();
        const stored: StoredMission[] = plan.missions.map((m, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return {
            id: m.id || `m_${i}`,
            title: m.title,
            description: m.description,
            area: m.area,
            minutes: m.minutes,
            icon: m.icon || 'rocket-outline',
            date: dk,
            completed: false,
          };
        });

        // Wait for at least 4 seconds so the orb feels intentional.
        const elapsed = Date.now() - t0;
        if (elapsed < 4500) {
          await new Promise((r) => setTimeout(r, 4500 - elapsed));
        }

        await saveState({
          ...state,
          onboarded: true,
          missions: stored,
          weeklyQuest: {
            id: plan.weekly_quest.id || `wq_${Date.now()}`,
            title: plan.weekly_quest.title,
            description: plan.weekly_quest.description,
            daily_steps: plan.weekly_quest.daily_steps,
            progress: new Array(7).fill(false),
          },
          welcomeQuote: plan.welcome_quote,
          dailyQuote: plan.welcome_quote,
          dailyQuoteDate: todayKey(),
        });

        router.replace('/(tabs)');
      } catch (e: any) {
        console.error('initial plan error', e);
        setError(e?.message || 'Generation failed. Please try again.');
      }
    })();
  }, []);

  const phaseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ScreenBg>
      <View style={styles.root}>
        <PulsingOrb size={220} />
        <Text style={styles.title}>Generating your LifeScript</Text>
        <Animated.Text style={[styles.phase, phaseStyle]} testID="generating-phase">
          {error ? error : PHASES[phase]}
        </Animated.Text>
        {error && (
          <Text style={styles.retry} onPress={() => router.replace('/onboarding')}>
            Tap to retry
          </Text>
        )}
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 56,
    textAlign: 'center',
  },
  phase: { color: colors.textAccent, fontSize: 15, marginTop: 12 },
  retry: { color: colors.primary, marginTop: 24, fontWeight: '700', fontSize: 15 },
});
