// Boss Battle screen — generates and tracks a 3-day intensive challenge.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ScreenBg, GlassCard, PrimaryButton, PulsingOrb } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State } from '../src/state';
import { generateBossBattle } from '../src/api';
import { awardBadge } from '../src/badges';

type Battle = {
  title: string;
  narrative: string;
  days: { day: number; title: string; description: string; minutes: number }[];
  reward_badge: string;
  progress: boolean[];
};

const KEY = 'currentBoss';

export default function BossScreen() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await loadState();
      setState(s);
      // try to read battle from window-scoped state (we'll piggy-back on coachSession unused field).
      const stored = (s as any)[KEY];
      if (stored) setBattle(stored);
    })();
  }, []);

  const startBattle = async () => {
    if (!state?.profile) return;
    setLoading(true);
    try {
      const data = await generateBossBattle(state.profile, state.bossCycle + 1);
      const b: Battle = { ...data, progress: [false, false, false] };
      const next: any = { ...state, [KEY]: b, bossCycle: state.bossCycle + 1 };
      await saveState(next);
      setState(next);
      setBattle(b);
    } catch (e: any) {
      Alert.alert('Could not generate boss', e?.message ?? 'Try again');
    } finally {
      setLoading(false);
    }
  };

  const completeDay = async (i: number) => {
    if (!battle || !state) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const newProgress = [...battle.progress];
    newProgress[i] = true;
    const updatedBattle = { ...battle, progress: newProgress };
    let xp = state.xp + 75;
    let badges = state.badges;
    let totalDone = state.totalMissionsDone + 1;
    if (newProgress.every((x) => x)) {
      xp += 200;
      badges = awardBadge(badges, 'boss_slayer');
    }
    const next: any = {
      ...state,
      [KEY]: updatedBattle,
      xp,
      badges,
      totalMissionsDone: totalDone,
    };
    await saveState(next);
    setState(next);
    setBattle(updatedBattle);
    if (newProgress.every((x) => x)) {
      Alert.alert('Boss defeated!', `You unlocked: ${battle.reward_badge}`);
      setTimeout(() => router.back(), 800);
    }
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 60 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="boss-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Boss Battle</Text>
          <View style={{ width: 40 }} />
        </View>

        {!battle ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <View style={{ marginBottom: 24 }}>
              <PulsingOrb size={160} />
            </View>
            <Text style={styles.title}>A 3-day intensive awaits.</Text>
            <Text style={styles.subtitle}>
              Defeat the boss to claim a rare badge and a permanent boost to all life areas.
            </Text>
            <View style={{ marginTop: 24, alignSelf: 'stretch' }}>
              <PrimaryButton
                label={loading ? 'Summoning…' : 'Summon the boss'}
                icon="skull"
                testID="boss-start-btn"
                onPress={startBattle}
                variant="gold"
                disabled={loading}
              />
            </View>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={['#7F1D1D', '#7C3AED']}
              style={styles.banner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="skull" size={40} color="#fff" />
              <Text style={styles.battleTitle}>{battle.title}</Text>
              <Text style={styles.battleNarr}>{battle.narrative}</Text>
              <Text style={styles.reward}>Reward: {battle.reward_badge}</Text>
            </LinearGradient>

            {battle.days.map((d, i) => {
              const done = battle.progress[i];
              return (
                <GlassCard key={i} style={{ marginTop: 14, opacity: done ? 0.6 : 1 }} testID={`boss-day-${i}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View style={[styles.dayChip, done && { backgroundColor: colors.green }]}>
                      <Text style={styles.dayChipTxt}>{done ? '✓' : `D${d.day}`}</Text>
                    </View>
                    <Text style={styles.dayMin}>  {d.minutes} min</Text>
                  </View>
                  <Text style={styles.dayTitle}>{d.title}</Text>
                  <Text style={styles.dayDesc}>{d.description}</Text>
                  {!done && (
                    <View style={{ marginTop: 12 }}>
                      <PrimaryButton
                        label="Complete day"
                        icon="checkmark"
                        testID={`boss-complete-${i}`}
                        onPress={() => completeDay(i)}
                        variant="gold"
                      />
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },

  title: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginTop: 12 },
  subtitle: { color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 16 },

  banner: {
    padding: 22, borderRadius: 24, marginTop: 14, alignItems: 'flex-start',
    shadowColor: '#7F1D1D', shadowOpacity: 0.5, shadowRadius: 16, elevation: 6,
  },
  battleTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10, letterSpacing: -0.5 },
  battleNarr: { color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 20 },
  reward: { color: colors.gold, fontWeight: '700', marginTop: 10, fontSize: 13 },

  dayChip: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  dayChipTxt: { color: '#fff', fontWeight: '800' },
  dayMin: { color: colors.textDim, fontSize: 12 },
  dayTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 8 },
  dayDesc: { color: colors.textDim, marginTop: 4, lineHeight: 20 },
});
