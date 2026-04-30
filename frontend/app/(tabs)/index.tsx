// LifeScript 2.0 Home — constellation + dynamic mission board + chapter system.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';

import {
  ScreenBg, GlassCard, SectionTitle, PrimaryButton, ConstellationMap, TypingText,
} from '../../src/ui';
import { colors, areaColors, areaIcons, LIFE_AREAS as THEME_AREAS } from '../../src/theme';
import {
  loadState, saveState, todayKey, dayDiff, lifeScore, dayIndexSinceJoin,
  LIFE_AREAS, State, StoredMission,
} from '../../src/state';
import { levelForXP, nextLevel, progressToNext, eraFor } from '../../src/levels';
import { api } from '../../src/api';
import { scheduleAll } from '../../src/notify';
import { Sounds } from '../../src/sounds';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [challenge, setChallenge] = useState<{ title: string; description: string; participants: number } | null>(null);

  const refresh = useCallback(async () => {
    const s = await loadState();
    if (!s.onboarded || !s.profile) { router.replace('/'); return; }

    // Streak guard — if we missed a day, drop the streak (unless a shield is available).
    let next = s;
    if (s.lastCompletionDate) {
      const diff = dayDiff(s.lastCompletionDate, todayKey());
      if (diff >= 2) {
        if (s.shields > 0) {
          next = { ...s, shields: s.shields - 1, lastCompletionDate: todayKey() };
          await saveState(next);
        } else if (s.streak > 0) {
          next = { ...s, streak: 0 };
          await saveState(next);
          Sounds.streakBreak();
        }
      }
    }

    // Daily quote refresh
    if (next.dailyQuoteDate !== todayKey() && next.profile) {
      try {
        const q = await api.dailyQuote(next.profile, next.streak);
        next = { ...next, dailyQuote: q.quote, dailyQuoteDate: todayKey() };
        await saveState(next);
      } catch {}
    }
    setState(next);

    // Try the global daily challenge (non-blocking).
    try {
      const c = await api.dailyChallenge(todayKey());
      setChallenge({ title: c.title, description: c.description, participants: c.participants });
    } catch {}

    // Schedule notifications (non-blocking).
    if (next.notificationsEnabled && next.profile) {
      const todayMission = next.missions.find((m) => m.date === todayKey() && !m.completed);
      scheduleAll(next.profile.name, todayMission?.title, next.streak).catch(() => {});
    }
  }, [router]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const today = todayKey();
  const dayIdx = dayIndexSinceJoin(state);
  const chapter = Math.min(4, Math.max(1, dayIdx));

  // Is the user gated by chapters? Day 4+ and not pro → show chapter gate on the home, not inline.
  const gated = chapter >= 4 && !state.pro;

  const openMissions = state.missions.filter((m) => !m.completed);
  const todayMission = state.missions.find((m) => m.date === today && !m.completed) ?? openMissions[0];
  const sideQuests = openMissions.filter((m) => m !== todayMission).slice(0, 2);

  const completedToday = !!state.missions.find((m) => m.date === today && m.completed);
  const level = levelForXP(state.xp);
  const era = eraFor(level);
  const nxt = nextLevel(state.xp);
  const lvlProgress = progressToNext(state.xp);
  const score = lifeScore(state);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const nodes = LIFE_AREAS.map((area, i) => {
    const angle = (360 / LIFE_AREAS.length) * i - 90;
    const unlocked = (area !== 'Purpose' && area !== 'Legacy') || level.id >= 5;
    return {
      id: area,
      label: area,
      value: unlocked ? (state.areas[area] ?? 0) : 0,
      color: areaColors[area],
      angle,
      radius: Math.min(width, 360) * 0.36,
    };
  });

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  return (
    <ScreenBg gradient={['#080818', era.palette.bg, '#04040C'] as const}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} testID="home-greeting">
              {greeting}, {state.profile.name}.
            </Text>
            <Text style={styles.subGreeting}>Capítulo {chapter} · Dia {dayIdx}</Text>
          </View>
          <StreakBadge streak={state.streak} testID="home-streak" />
        </View>

        {/* Level + Era */}
        <GlassCard style={{ paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.levelCircle, { backgroundColor: `${era.palette.accent}20`, borderColor: era.palette.accent }]}>
              <Text style={[styles.levelNum, { color: era.palette.accent }]}>{level.id}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.eraName}>{era.name.toUpperCase()}</Text>
              <Text style={styles.levelTitle} testID="home-level-name">{level.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.xp} testID="home-xp">{state.xp} XP</Text>
              <Text style={styles.xpNext}>{nxt ? `${nxt.minXP - state.xp} até ${nxt.name}` : 'Máx'}</Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <LinearGradient
              colors={[era.palette.accent, colors.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpBarFill, { width: `${lvlProgress * 100}%` }]}
            />
          </View>
          <Text style={styles.tagline}>{level.tagline}</Text>
        </GlassCard>

        {/* Constellation Life Map */}
        <SectionTitle style={{ marginTop: 24 }}>Seu mapa de vida</SectionTitle>
        <GlassCard tint="rgba(124,58,237,0.06)" style={{ paddingVertical: 18 }}>
          <ConstellationMap
            size={Math.min(width, 360) - 48}
            nodes={nodes}
            centerLabel={`${score}`}
            centerSub="LIFE SCORE"
            onNodePress={(id) => router.push({ pathname: '/area/[name]', params: { name: id } })}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6 }}>
            <TouchableOpacity
              testID="home-share-btn"
              onPress={() => router.push('/share')}
              style={styles.sharePill}
            >
              <Ionicons name="share-social" size={14} color={colors.text} />
              <Text style={styles.sharePillTxt}>  Compartilhar mapa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="home-timeline-btn"
              onPress={() => router.push('/timeline')}
              style={[styles.sharePill, { marginLeft: 8 }]}
            >
              <Ionicons name="time" size={14} color={colors.text} />
              <Text style={styles.sharePillTxt}>  Linha do tempo</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Chapter gate on day 4+ for free users */}
        {gated && <ChapterGate state={state} onOpen={() => router.push('/chapter')} />}

        {/* Main Quest */}
        <SectionTitle style={{ marginTop: 24 }} right={
          <TouchableOpacity onPress={() => router.push('/archive')} testID="home-archive-btn">
            <Text style={styles.linkTxt}>Arquivo ›</Text>
          </TouchableOpacity>
        }>Missão principal</SectionTitle>
        {todayMission ? (
          <MissionCard
            kind="main"
            mission={todayMission}
            completed={completedToday}
            onPress={() => router.push({ pathname: '/mission', params: { id: todayMission.id } })}
          />
        ) : (
          <GlassCard><Text style={styles.dim}>Nenhuma missão aberta. Descanse hoje.</Text></GlassCard>
        )}

        {/* Side Quests */}
        {sideQuests.length > 0 && (
          <>
            <SectionTitle style={{ marginTop: 20 }}>Missões paralelas</SectionTitle>
            {sideQuests.map((m) => (
              <MissionCard key={m.id} kind="side" mission={m} completed={false}
                onPress={() => router.push({ pathname: '/mission', params: { id: m.id } })} />
            ))}
          </>
        )}

        {/* Daily Challenge */}
        {challenge && (
          <>
            <SectionTitle style={{ marginTop: 20 }}>Hoje, ao redor do mundo</SectionTitle>
            <GlassCard tint="rgba(245,158,11,0.06)" testID="home-daily-challenge">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.challengeIcon, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
                  <Ionicons name="flame" size={22} color={colors.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.mainTitle}>{challenge.title}</Text>
                  <Text style={styles.mainDesc} numberOfLines={2}>{challenge.description}</Text>
                </View>
              </View>
              <Text style={styles.participants}>{challenge.participants.toLocaleString()} LifeScripters estão nessa hoje.</Text>
            </GlassCard>
          </>
        )}

        {/* Daily Quote */}
        {state.dailyQuote ? (
          <GlassCard style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <Ionicons name="sparkles" size={18} color={colors.gold} />
              <TypingText
                text={'  ' + state.dailyQuote}
                style={styles.quote}
                testID="home-quote"
              />
            </View>
            <TouchableOpacity onPress={() => Sounds.speak(state.dailyQuote)} style={{ marginTop: 10 }} testID="home-speak-btn">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="volume-medium" size={14} color={colors.textAccent} />
                <Text style={{ color: colors.textAccent, fontSize: 12, marginLeft: 6 }}>Ouvir</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        ) : null}

        {/* Daily Spin + quick actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
          <QuickAction icon="refresh-circle" label="Roleta Diária" onPress={() => router.push('/spin')} testID="home-spin-btn" gradient={['#7C3AED', '#EC4899']} />
          <QuickAction icon="flash" label="Foco" onPress={() => router.push('/focus')} testID="home-focus-btn" gradient={['#0D9488', '#10B981']} />
          <QuickAction icon="card" label="Identidade" onPress={() => router.push('/identity')} testID="home-identity-btn" gradient={['#F59E0B', '#B45309']} />
        </View>

        {/* Boss prompt */}
        {state.totalMissionsDone >= 5 && (
          <TouchableOpacity testID="home-boss-prompt" onPress={() => router.push('/boss')} activeOpacity={0.85}>
            <GlassCard style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="skull" size={26} color="#F43F5E" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.bossTitle}>Boss Battle pronta</Text>
                  <Text style={styles.bossSub}>3 dias. Uma medalha rara. Uma virada.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Pro banner for non-pros */}
        {!state.pro && chapter < 4 && (
          <TouchableOpacity
            testID="home-upgrade-banner"
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.85}
            style={{ marginTop: 18 }}
          >
            <LinearGradient
              colors={['#7C3AED', '#EC4899', '#F59E0B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.proBanner}
            >
              <Ionicons name="diamond" size={22} color="#fff" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.proTitle}>O Capítulo 4 aguarda</Text>
                <Text style={styles.proSub}>Desbloqueie seu LifeScript completo.</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Axiom FAB */}
      <TouchableOpacity testID="home-coach-fab" onPress={() => router.push('/coach')} style={styles.fab} activeOpacity={0.85}>
        <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.fabInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="sparkles" size={26} color="#fff" />
        </LinearGradient>
        <View style={styles.fabRing} />
      </TouchableOpacity>
    </ScreenBg>
  );
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
        -1, true,
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

function MissionCard({ mission, completed, kind, onPress }:
  { mission: StoredMission; completed: boolean; kind: 'main' | 'side'; onPress: () => void }) {
  const accent = areaColors[mission.area] || colors.primary;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} testID={kind === 'main' ? 'home-today-mission' : `home-side-${mission.id}`}>
      <GlassCard tint={`${accent}11`} style={kind === 'side' ? { marginTop: 8, paddingVertical: 14 } : { paddingVertical: 16 }}>
        <View style={styles.missionTop}>
          <View style={[styles.missionIcon, { backgroundColor: `${accent}22` }]}>
            <Ionicons name={mission.icon as any} size={kind === 'side' ? 20 : 26} color={accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.missionArea}>{mission.area.toUpperCase()} · {mission.minutes} MIN</Text>
            <Text style={[styles.mainTitle, kind === 'side' && { fontSize: 16 }]}>{mission.title}</Text>
          </View>
          {completed && <Ionicons name="checkmark-circle" size={24} color={colors.green} />}
        </View>
        {kind === 'main' && (
          <>
            <Text style={styles.mainDesc}>{mission.description}</Text>
            <View style={styles.missionCta}>
              <Text style={styles.missionCtaTxt}>
                {completed ? 'Concluída hoje' : 'Iniciar missão'}
              </Text>
              <Ionicons
                name={completed ? 'checkmark' : 'arrow-forward'}
                size={18}
                color={completed ? colors.green : colors.primaryLight}
              />
            </View>
          </>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

function ChapterGate({ state, onOpen }: { state: State; onOpen: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={{ marginTop: 20 }} testID="home-chapter-gate">
      <LinearGradient colors={['#1A0B2A', '#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chapterGate}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="lock-closed" size={22} color="#fff" />
          <Text style={styles.chapterGateTitle}>  O Capítulo 4 te espera</Text>
        </View>
        <Text style={styles.chapterGateSub}>
          Seu LifeScript está apenas começando. Abra o próximo capítulo.
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, onPress, testID, gradient }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={{ flex: 1 }} activeOpacity={0.85}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.qa}>
        <Ionicons name={icon} size={22} color="#fff" />
        <Text style={styles.qaTxt}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 62, paddingHorizontal: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subGreeting: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, gap: 6,
  },
  streakNum: { color: '#F59E0B', fontWeight: '800', fontSize: 16, marginLeft: 4 },

  levelCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  levelNum: { fontWeight: '800', fontSize: 22 },
  eraName: { color: colors.textDim, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  levelTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  xp: { color: colors.gold, fontWeight: '800', fontSize: 16 },
  xpNext: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  xpBarBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3,
    marginTop: 12, overflow: 'hidden',
  },
  xpBarFill: { height: '100%', borderRadius: 3 },
  tagline: { color: colors.textAccent, fontSize: 12, fontStyle: 'italic', marginTop: 8 },

  sharePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border,
  },
  sharePillTxt: { color: colors.text, fontSize: 12, fontWeight: '600' },

  linkTxt: { color: colors.primaryLight, fontSize: 12, fontWeight: '700' },

  missionTop: { flexDirection: 'row', alignItems: 'center' },
  missionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  missionArea: { color: colors.textDim, fontSize: 11, letterSpacing: 1.3, fontWeight: '700', marginBottom: 2 },
  mainTitle: { color: colors.text, fontSize: 18, fontWeight: '800', lineHeight: 24, letterSpacing: -0.3 },
  mainDesc: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 8 },
  missionCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  missionCtaTxt: { color: colors.text, fontWeight: '700', fontSize: 14 },

  challengeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  participants: { color: colors.gold, fontSize: 12, marginTop: 10, fontWeight: '700' },

  quote: { color: colors.text, fontSize: 14, lineHeight: 22, flex: 1, fontStyle: 'italic' },

  qa: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  qaTxt: { color: '#fff', fontWeight: '700', fontSize: 12, marginTop: 6 },

  chapterGate: { padding: 18, borderRadius: 20 },
  chapterGateTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  chapterGateSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 },

  proBanner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 },
  proTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  proSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

  bossTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bossSub: { color: colors.textDim, fontSize: 12, marginTop: 3 },

  fab: { position: 'absolute', right: 18, bottom: 100, width: 62, height: 62, borderRadius: 31 },
  fabInner: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  fabRing: { position: 'absolute', left: -4, top: -4, right: -4, bottom: -4, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(124,58,237,0.35)' },

  dim: { color: colors.textDim },
});
