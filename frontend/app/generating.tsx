// Generating your LifeScript — pulsing orb + AI plan request.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { ScreenBg, PulsingOrb, TypingText } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, todayKey, StoredMission, addTimeline } from '../src/state';
import { api } from '../src/api';

const PHASES = [
  'Reading your story…',
  'Mapping your 8 constellations…',
  'Designing your first missions…',
  'Composing your weekly arc…',
  'Writing your first line…',
];

export default function Generating() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), 1100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const t0 = Date.now();
      try {
        const state = await loadState();
        if (!state.profile) { router.replace('/onboarding'); return; }
        const plan = await api.initialPlan(state.profile);

        const today = new Date();
        const stored: StoredMission[] = plan.missions.map((m, i) => {
          const d = new Date(today); d.setDate(today.getDate() + i);
          const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return {
            id: m.id || `m_${i}`, title: m.title, description: m.description,
            area: m.area, minutes: m.minutes, icon: m.icon || 'rocket-outline',
            date: dk, completed: false, kind: 'main',
          };
        });

        const elapsed = Date.now() - t0;
        if (elapsed < 4500) await new Promise((r) => setTimeout(r, 4500 - elapsed));

        const next = addTimeline({
          ...state,
          onboarded: true,
          joinDate: state.joinDate || new Date().toISOString(),
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
          currentChapter: 1,
          chapterStartDate: todayKey(),
          chaptersUnlocked: [1],
        }, { kind: 'onboarded', label: 'LifeScript begins' });
        await saveState(next);

        router.replace('/(tabs)');
      } catch (e: any) {
        console.error('initial plan error', e);
        setError(e?.message || 'Generation failed. Please try again.');
      }
    })();
  }, []);

  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ScreenBg>
      <View style={styles.root}>
        <PulsingOrb size={220} />
        <Text style={styles.title}>Generating your LifeScript</Text>
        <Animated.View style={aStyle}>
          <TypingText text={error || PHASES[phase]} style={styles.phase} testID="generating-phase" speedMs={30} />
        </Animated.View>
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
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 48, textAlign: 'center' },
  phase: { color: colors.textAccent, fontSize: 15, marginTop: 14 },
  retry: { color: colors.primary, marginTop: 24, fontWeight: '700', fontSize: 15 },
});
