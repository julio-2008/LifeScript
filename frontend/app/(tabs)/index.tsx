// Home / Life Map — the main screen of LifeScript.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import {
  ScreenBg,
  GlassCard,
  CircularProgress,
  PrimaryButton,
  SectionTitle,
} from '../../src/ui';
import { colors, areaColors } from '../../src/theme';
import {
  loadState,
  saveState,
  todayKey,
  dayDiff,
  lifeScore,
  State,
  StoredMission,
} from '../../src/state';
import { LEVELS, levelForXP, nextLevel, progressToNext } from '../../src/levels';
import { generateDailyQuote } from '../../src/api';
import { awardBadge } from '../../src/badges';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const s = await loadState();
    if (!s.onboarded || !s.profile) {
      router.replace('/');
      return;
    }
    // Streak guard — if we missed a day, drop the streak (with shield).
    if (s.lastCompletionDate) {
      const diff = dayDiff(s.lastCompletionDate, todayKey());
      if (diff >= 2) {
        if (s.shields > 0) {
          await saveState({ ...s, shields: s.shields - 1, lastCompletionDate: todayKey() });
        } else if (s.streak > 0) {
          await saveState({ ...s, streak: 0 });
        }
      }
    }

    // Daily quote refresh.
    if (s.dailyQuoteDate !== todayKey() && s.profile) {
      try {
        const q = await generateDailyQuote(s.profile, s.streak);
        const updated = { ...s, dailyQuote: q.quote, dailyQuoteDate: todayKey() };
        await saveState(updated);
        setState(updated);
        return;
      } catch (e) {
        console.warn('quote fetch failed', e);
      }
    }
    setState(await loadState());
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!state || !state.profile) {
    return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  }

  const today = todayKey();
  const todayMission = state.missions.find((m) => m.date === today && !m.completed)
    ?? state.missions.find((m) => !m.completed)
    ?? state.missions[0];

  const completedToday = !!state.missions.find((m) => m.date === today && m.completed);
  const level = levelForXP(state.xp);
  const next = nextLevel(state.xp);
  const lvlProgress = progressToNext(state.xp);
  const score = lifeScore(state);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} testID="home-greeting">
              {greeting}, {state.profile.name}.
            </Text>
            <Text style={styles.subGreeting}>Your journey continues.</Text>
          </View>
          <StreakBadge streak={state.streak} testID="home-streak" />
        </View>

        {/* XP / Level card */}
        <GlassCard style={styles.levelCard}>
          <View style={styles.levelTop}>
            <View style={[styles.levelIconBg, { backgroundColor: `${level.color}22`, borderColor: level.color }]}>
              <Ionicons name={level.icon as any} size={28} color={level.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.levelLabel}>LEVEL {level.id}</Text>
              <Text style={styles.levelName} testID="home-level-name">{level.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.xpNumber} testID="home-xp">{state.xp} XP</Text>
              <Text style={styles.xpNext}>
                {next ? `${next.minXP - state.xp} to ${next.name}` : 'Max level'}
              </Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <LinearGradient
              colors={[level.color, colors.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpBarFill, { width: `${lvlProgress * 100}%` }]}
            />
          </View>
          <Text style={styles.levelTagline}>{level.tagline}</Text>
        </GlassCard>

        {/* Today's mission */}
        <SectionTitle style={{ marginTop: 24 }}>Today's mission</SectionTitle>
        {todayMission ? (
          <MissionCard
            mission={todayMission}
            completed={completedToday}
            onPress={() => router.push({ pathname: '/mission', params: { id: todayMission.id } })}
          />
        ) : (
          <GlassCard><Text style={styles.dim}>No mission today. Take a rest.</Text></GlassCard>
        )}

        {/* Daily quote */}
        {state.dailyQuote ? (
          <GlassCard style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="sparkles" size={18} color={colors.gold} />
              <Text style={styles.quote} testID="home-quote">  {state.dailyQuote}</Text>
            </View>
          </GlassCard>
        ) : null}

        {/* Weekly Quest */}
        <SectionTitle style={{ marginTop: 28 }}>Weekly quest</SectionTitle>
        {state.weeklyQuest && (
          <GlassCard testID="home-weekly-quest">
            <Text style={styles.wqTitle}>{state.weeklyQuest.title}</Text>
            <Text style={styles.wqDesc}>{state.weeklyQuest.description}</Text>
            <View style={styles.wqDots}>
              {state.weeklyQuest.progress.map((done, i) => (
                <View
                  key={i}
                  style={[
                    styles.wqDot,
                    done && { backgroundColor: colors.gold, borderColor: colors.gold },
                  ]}
                >
                  <Text style={[styles.wqDotTxt, done && { color: '#000' }]}>{i + 1}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Life areas */}
        <SectionTitle style={{ marginTop: 28 }}>Life areas</SectionTitle>
        <View style={styles.areasGrid}>
          {Object.entries(state.areas).map(([area, val]) => (
            <View key={area} style={styles.areaItem}>
              <CircularProgress progress={val} color={areaColors[area]} size={86} stroke={6}>
                <Ionicons
                  name={iconForArea(area)}
                  size={24}
                  color={areaColors[area]}
                />
              </CircularProgress>
              <Text style={styles.areaLabel}>{area}</Text>
              <Text style={styles.areaPct}>{Math.round(val * 100)}%</Text>
            </View>
          ))}
        </View>

        {/* Life Score */}
        <GlassCard style={{ marginTop: 24, alignItems: 'center', paddingVertical: 22 }}>
          <Text style={styles.scoreLabel}>YOUR LIFE SCORE</Text>
          <Text style={styles.scoreNumber} testID="home-life-score">{score}</Text>
          <Text style={styles.scoreSub}>out of 1000</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <PrimaryButton
              label="Share my map"
              icon="share-social"
              testID="home-share-btn"
              onPress={() => router.push('/share')}
            />
          </View>
        </GlassCard>

        {/* Boss battle prompt */}
        <BossPrompt state={state} />

        {/* Pro upgrade banner (if free) */}
        {!state.pro && (
          <TouchableOpacity
            testID="home-upgrade-banner"
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.85}
            style={{ marginTop: 24 }}
          >
            <LinearGradient
              colors={['#7C3AED', '#EC4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.proBanner}
            >
              <Ionicons name="diamond" size={26} color="#fff" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.proTitle}>Unlock LifeScript Pro</Text>
                <Text style={styles.proSub}>Boss Battles, unlimited coach, shields…</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Floating coach button */}
      <TouchableOpacity
        testID="home-coach-fab"
        onPress={() => router.push('/coach')}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          style={styles.fabInner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={26} color="#fff" />
        </LinearGradient>
        <View style={styles.fabPulse} />
      </TouchableOpacity>
    </ScreenBg>
  );
}

function iconForArea(a: string): any {
  return ({
    Career: 'briefcase',
    Finances: 'cash',
    Health: 'fitness',
    Relationships: 'people',
    Mind: 'bulb',
    Skills: 'construct',
  } as Record<string, string>)[a];
}

function StreakBadge({ streak, testID }: { streak: number; testID?: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (streak > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
        true,
      );
    }
  }, [streak]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.streakBadge, a]} testID={testID}>
      <Ionicons name="flame" size={18} color={streak > 0 ? '#F59E0B' : colors.textDim} />
      <Text style={[styles.streakNum, streak === 0 && { color: colors.textDim }]}>{streak}</Text>
    </Animated.View>
  );
}

function MissionCard({
  mission,
  completed,
  onPress,
}: { mission: StoredMission; completed: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} testID="home-today-mission">
      <GlassCard style={styles.missionCard}>
        <LinearGradient
          colors={[`${areaColors[mission.area] || colors.primary}33`, 'transparent']}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
        />
        <View style={styles.missionTop}>
          <View
            style={[
              styles.missionIcon,
              { backgroundColor: `${areaColors[mission.area] || colors.primary}22` },
            ]}
          >
            <Ionicons
              name={mission.icon as any}
              size={26}
              color={areaColors[mission.area] || colors.primary}
            />
          </View>
          <View style={styles.missionMeta}>
            <Text style={styles.missionArea}>{mission.area.toUpperCase()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={12} color={colors.textDim} />
              <Text style={styles.missionMinutes}>{mission.minutes} min</Text>
            </View>
          </View>
          {completed && (
            <View style={styles.completedTag}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            </View>
          )}
        </View>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        <Text style={styles.missionDesc}>{mission.description}</Text>
        <View style={styles.missionCta}>
          <Text style={styles.missionCtaTxt}>
            {completed ? 'Completed today' : 'Start mission'}
          </Text>
          <Ionicons
            name={completed ? 'checkmark' : 'arrow-forward'}
            size={18}
            color={completed ? colors.green : colors.primary}
          />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function BossPrompt({ state }: { state: State }) {
  const router = useRouter();
  const eligible = state.totalMissionsDone >= 5; // every 5 missions for demo, every 30 days in prod
  if (!eligible) return null;
  return (
    <TouchableOpacity testID="home-boss-prompt" onPress={() => router.push('/boss')} activeOpacity={0.85}>
      <GlassCard style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="skull" size={28} color="#EF4444" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.bossTitle}>Boss Battle Available</Text>
            <Text style={styles.bossSub}>3-day intensive challenge. Rare badge on victory.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 64, paddingHorizontal: 18, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subGreeting: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.4)',
    borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  streakNum: { color: '#F59E0B', fontWeight: '800', fontSize: 16, marginLeft: 4 },

  levelCard: { paddingVertical: 18 },
  levelTop: { flexDirection: 'row', alignItems: 'center' },
  levelIconBg: {
    width: 52, height: 52,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 26, borderWidth: 1,
  },
  levelLabel: { color: colors.textDim, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  levelName: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  xpNumber: { color: colors.gold, fontSize: 16, fontWeight: '800' },
  xpNext: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  xpBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  xpBarFill: { height: '100%', borderRadius: 4 },
  levelTagline: {
    color: colors.textAccent,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 10,
  },

  missionCard: { paddingVertical: 18, position: 'relative' },
  missionTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  missionIcon: {
    width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
  },
  missionMeta: { flex: 1, marginLeft: 14 },
  missionArea: {
    color: colors.textDim, fontSize: 11, letterSpacing: 1.4, fontWeight: '700',
  },
  missionMinutes: {
    color: colors.textDim, fontSize: 12, marginLeft: 4,
  },
  missionTitle: {
    color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28,
  },
  missionDesc: { color: colors.textDim, fontSize: 14, marginTop: 8, lineHeight: 20 },
  missionCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  missionCtaTxt: { color: colors.text, fontWeight: '700', fontSize: 15 },
  completedTag: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    padding: 6, borderRadius: 999,
  },

  quote: { color: colors.text, fontSize: 14, lineHeight: 22, flex: 1, fontStyle: 'italic' },

  wqTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  wqDesc: { color: colors.textDim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  wqDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  wqDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  wqDotTxt: { color: colors.textDim, fontSize: 12, fontWeight: '700' },

  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  areaItem: { width: '32%', alignItems: 'center', marginBottom: 16 },
  areaLabel: { color: colors.text, fontSize: 12, marginTop: 6, fontWeight: '600' },
  areaPct: { color: colors.textDim, fontSize: 11 },

  scoreLabel: { color: colors.textDim, fontSize: 11, letterSpacing: 1.8, fontWeight: '700' },
  scoreNumber: {
    color: colors.text, fontSize: 64, fontWeight: '800', letterSpacing: -2,
    marginTop: 4,
  },
  scoreSub: { color: colors.textDim, fontSize: 13, marginBottom: 6 },

  proBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: 20,
  },
  proTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  proSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  bossTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bossSub: { color: colors.textDim, fontSize: 12, marginTop: 3 },

  fab: {
    position: 'absolute',
    right: 18, bottom: 100,
    width: 60, height: 60, borderRadius: 30,
  },
  fabInner: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  fabPulse: {
    position: 'absolute', left: -4, top: -4, right: -4, bottom: -4,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  dim: { color: colors.textDim },
});
