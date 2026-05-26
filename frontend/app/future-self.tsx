// LifeScript 2.0 — "Seu Futuro Eu Está Observando"
// Axioma pinta duas rotas: a atual vs. a alternativa, entrega 3 ações
// personalizadas e uma mensagem direta do futuro eu.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  withDelay, Easing, FadeInDown, FadeIn,
} from 'react-native-reanimated';

import { ScreenBg, GlassCard, PrimaryButton } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import {
  loadState, saveState, addTimeline, lifeScore, todayKey, State, StoredMission,
} from '../src/state';
import { levelForXP } from '../src/levels';
import { api } from '../src/api';
import { Sounds } from '../src/sounds';

const { width } = Dimensions.get('window');

type FutureAction = {
  title: string;
  duration: string;
  impact: string;
  area: string;
  icon: string;
  minutes: number;
};

type FutureData = {
  current_route: string;
  alternative_route: string;
  actions: FutureAction[];
  future_self_message: string;
};

function uuid() {
  return `fut-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function weakestAndStrongest(areas: Record<string, number>): { weak: string; strong: string } {
  const entries = Object.entries(areas);
  if (entries.length === 0) return { weak: '', strong: '' };
  entries.sort((a, b) => a[1] - b[1]);
  return { weak: entries[0][0], strong: entries[entries.length - 1][0] };
}

export default function FutureSelfScreen() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [data, setData] = useState<FutureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chose, setChose] = useState(false);

  const load = useCallback(async () => {
    const s = await loadState();
    setState(s);
    if (!s.profile) { setLoading(false); return; }

    try {
      const level = levelForXP(s.xp);
      const { weak, strong } = weakestAndStrongest(s.areas);
      const skipped = Math.max(0, s.missionArchive.filter((m) => !m.completed).length);
      const recentReflections = s.missionArchive
        .filter((m) => m.reflection && m.reflection.trim().length > 0)
        .slice(-5)
        .map((m) => m.reflection as string);
      const recentMissions = s.missionArchive.slice(-6).map((m) => m.title);

      const res = await api.futureSelf({
        profile: s.profile,
        level: level.name,
        streak: s.streak,
        total_missions_done: s.totalMissionsDone,
        missions_skipped: skipped,
        life_score: lifeScore(s),
        strongest_area: strong,
        weakest_area: weak,
        identity_statement: s.identityCard?.statement || '',
        recent_reflections: recentReflections,
        recent_missions: recentMissions,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Falha ao consultar Axioma.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const transformToMission = useCallback(async (a: FutureAction) => {
    const s = await loadState();
    if (!s.profile) return;
    // Avoid duplicates if user taps multiple times.
    const exists = s.missions.find((m) => m.title === a.title && !m.completed);
    if (exists) {
      router.push({ pathname: '/mission', params: { id: exists.id } });
      return;
    }
    const mission: StoredMission = {
      id: uuid(),
      title: a.title,
      description: a.impact,
      area: a.area,
      minutes: a.minutes || 15,
      icon: a.icon || 'sparkles-outline',
      date: todayKey(),
      completed: false,
      kind: 'side',
    };
    let next: State = { ...s, missions: [mission, ...s.missions] };
    next = addTimeline(next, {
      kind: 'future_self_action_queued',
      label: `Ação da rota alternativa adicionada: ${a.title}`,
      meta: { area: a.area },
    });
    await saveState(next);
    Sounds.tap();
    router.push({ pathname: '/mission', params: { id: mission.id } });
  }, [router]);

  const chooseAlternativeRoute = useCallback(async () => {
    if (chose) return;
    const s = await loadState();
    if (!s.profile || !data) return;

    // Build (or highlight) the priority mission from action #1
    const primary = data.actions[0];
    let missions = [...s.missions];
    if (primary) {
      const existing = missions.find((m) => m.title === primary.title && !m.completed);
      if (!existing) {
        missions = [
          {
            id: uuid(),
            title: primary.title,
            description: primary.impact,
            area: primary.area,
            minutes: primary.minutes || 15,
            icon: primary.icon || 'flame-outline',
            date: todayKey(),
            completed: false,
            kind: 'main',
          },
          ...missions,
        ];
      }
    }

    let next: State = { ...s, missions, xp: s.xp + 25 };
    next = addTimeline(next, {
      kind: 'future_self_route_chosen',
      label: 'Rota alternativa ativada com Axioma',
      meta: { xp: 25 },
    });
    await saveState(next);
    setChose(true);
    Sounds.levelUp?.();
  }, [chose, data]);

  return (
    <ScreenBg gradient={['#06041A', '#1A0B35', '#04030F'] as const}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="future-back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Seu Futuro Eu</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Seu Futuro Eu Está Observando</Text>
          <Text style={styles.subtitle}>
            Axioma analisou sua rota atual e a rota que nasce se você executar as próximas missões.
          </Text>
        </Animated.View>

        {loading && (
          <GlassCard style={{ marginTop: 24, alignItems: 'center', paddingVertical: 36 }}>
            <ActivityIndicator color={colors.primaryLight} />
            <Text style={styles.loadingTxt}>Axioma está lendo sua trajetória…</Text>
          </GlassCard>
        )}

        {error && !loading && (
          <GlassCard style={{ marginTop: 24 }}>
            <Text style={styles.errTitle}>Não consegui ler sua rota agora.</Text>
            <Text style={styles.errMsg}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn} testID="future-retry">
              <Text style={styles.retryTxt}>Tentar de novo</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {data && !loading && (
          <>
            {/* Two routes */}
            <View style={styles.routesRow}>
              <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.routeCol}>
                <RouteCard
                  title="Rota Atual"
                  body={data.current_route}
                  tone="alert"
                  icon="trending-down"
                  testID="future-current-route"
                />
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.routeCol}>
                <RouteCard
                  title="Rota Alternativa"
                  body={data.alternative_route}
                  tone="aspirational"
                  icon="trending-up"
                  testID="future-alt-route"
                  glow
                />
              </Animated.View>
            </View>

            {/* Three actions */}
            <Animated.View entering={FadeInDown.delay(300).duration(450)}>
              <Text style={styles.sectionTitle}>Próximas 3 ações que mudam sua rota</Text>
              {data.actions.map((a, i) => (
                <ActionRow
                  key={`${a.title}-${i}`}
                  index={i + 1}
                  action={a}
                  onPress={() => transformToMission(a)}
                />
              ))}
            </Animated.View>

            {/* Future Self Message */}
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <Text style={styles.sectionTitle}>Mensagem do seu Futuro Eu</Text>
              <LinearGradient
                colors={['#2A1060', '#1A0B35', '#2A1060']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.messageCard}
              >
                <View style={styles.messageQuote}>
                  <Ionicons name="sparkles" size={20} color={colors.gold} />
                </View>
                <Text style={styles.messageTxt} testID="future-message">
                  {data.future_self_message}
                </Text>
                <Text style={styles.messageSig}>— Você, em 1 ano</Text>
              </LinearGradient>
            </Animated.View>

            {/* CTA */}
            <Animated.View entering={FadeInDown.delay(500).duration(500)} style={{ marginTop: 28 }}>
              {!chose ? (
                <PrimaryButton
                  label="Escolher rota alternativa"
                  icon="flash"
                  onPress={chooseAlternativeRoute}
                  variant="primary"
                  testID="future-choose-btn"
                />
              ) : (
                <ChoseConfirmation />
              )}
            </Animated.View>

            <View style={{ height: 60 }} />
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

function RouteCard({
  title, body, tone, icon, testID, glow,
}: {
  title: string;
  body: string;
  tone: 'alert' | 'aspirational';
  icon: keyof typeof Ionicons.glyphMap;
  testID?: string;
  glow?: boolean;
}) {
  const isAlt = tone === 'aspirational';
  const borderColor = isAlt ? 'rgba(167,139,250,0.55)' : 'rgba(244,63,94,0.28)';
  const tintColor = isAlt ? 'rgba(124,58,237,0.18)' : 'rgba(40,12,20,0.45)';
  const titleColor = isAlt ? '#F5D67A' : '#F9A8A8';
  const iconColor = isAlt ? colors.gold : '#F43F5E';

  // subtle glow pulse only on alternative route
  const o = useSharedValue(0.35);
  useEffect(() => {
    if (!glow) return;
    o.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1800 }),
      ),
      -1, true,
    );
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <View style={[styles.routeCard, { borderColor, backgroundColor: tintColor }]} testID={testID}>
      {glow && (
        <Animated.View
          pointerEvents="none"
          style={[styles.routeGlow, glowStyle]}
        >
          <LinearGradient
            colors={['rgba(167,139,250,0.35)', 'rgba(245,158,11,0.15)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}
      <View style={styles.routeHead}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={[styles.routeTitle, { color: titleColor }]}>{title}</Text>
      </View>
      <Text style={styles.routeBody}>{body}</Text>
    </View>
  );
}

function ActionRow({
  index, action, onPress,
}: { index: number; action: FutureAction; onPress: () => void }) {
  const accent = areaColors[action.area] || colors.primary;
  return (
    <GlassCard tint={`${accent}0F`} style={{ marginTop: 10, paddingVertical: 12 }}>
      <View style={styles.actionRow}>
        <View style={[styles.actionIdx, { borderColor: accent }]}>
          <Text style={[styles.actionIdxTxt, { color: accent }]}>{index}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionMeta}>
            {action.duration || `${action.minutes} min`} · {action.area.toUpperCase()}
          </Text>
          <Text style={styles.actionImpact}>{action.impact}</Text>
        </View>
        <Ionicons name={(action.icon || 'sparkles-outline') as any} size={22} color={accent} />
      </View>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.actionBtn, { borderColor: `${accent}80` }]}
        testID={`future-action-${index}`}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={16} color={accent} />
        <Text style={[styles.actionBtnTxt, { color: accent }]}>  Transformar em missão</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

function ChoseConfirmation() {
  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <LinearGradient
        colors={['#7C3AED', '#F59E0B']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.confirmBox}
      >
        <Ionicons name="checkmark-circle" size={28} color="#fff" />
        <Text style={styles.confirmTitle}>Rota alternativa ativada.</Text>
        <Text style={styles.confirmSub}>Agora prove com uma ação. +25 XP.</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 42, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border,
  },
  topTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },

  title: {
    color: colors.text, fontSize: 24, fontWeight: '800',
    letterSpacing: -0.4, marginTop: 6,
  },
  subtitle: {
    color: colors.textDim, fontSize: 13, lineHeight: 20, marginTop: 8,
  },

  loadingTxt: { color: colors.textDim, fontSize: 13, marginTop: 12 },

  errTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  errMsg: { color: colors.textDim, fontSize: 12, marginTop: 6 },
  retryBtn: {
    alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
  },
  retryTxt: { color: colors.primaryLight, fontSize: 12, fontWeight: '700' },

  routesRow: {
    flexDirection: width >= 720 ? 'row' : 'column',
    marginTop: 22, gap: 12,
  },
  routeCol: { flex: 1 },
  routeCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden',
    minHeight: 150,
  },
  routeGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  routeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4, marginLeft: 8 },
  routeBody: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 10 },

  sectionTitle: {
    color: colors.textDim, fontSize: 12, letterSpacing: 1.8,
    fontWeight: '800', textTransform: 'uppercase',
    marginTop: 28, marginBottom: 8,
  },

  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionIdx: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIdxTxt: { fontSize: 14, fontWeight: '800' },
  actionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  actionMeta: {
    color: colors.textDim, fontSize: 10, letterSpacing: 1.2,
    fontWeight: '700', marginTop: 2,
  },
  actionImpact: { color: colors.textAccent, fontSize: 12, marginTop: 6, lineHeight: 18 },
  actionBtn: {
    alignSelf: 'flex-start', marginTop: 10, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionBtnTxt: { fontSize: 12, fontWeight: '700' },

  messageCard: {
    borderRadius: 22, padding: 18, borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  messageQuote: { marginBottom: 8 },
  messageTxt: {
    color: colors.text, fontSize: 16, lineHeight: 24, fontStyle: 'italic',
    fontWeight: '500',
  },
  messageSig: {
    color: colors.gold, fontSize: 11, letterSpacing: 1.5, fontWeight: '800',
    marginTop: 12, textAlign: 'right',
  },

  confirmBox: {
    borderRadius: 22, padding: 20, alignItems: 'center',
  },
  confirmTitle: {
    color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 8,
  },
  confirmSub: {
    color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4,
  },
});
