// Identity Card — AI-generated monthly summary of who the user is becoming.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBg, GlassCard, PrimaryButton, TypingText, Starfield, CircularProgress } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State, addTimeline } from '../src/state';
import { levelForXP } from '../src/levels';
import { api } from '../src/api';
import { awardBadge } from '../src/badges';

export default function IdentityCard() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadState().then(setState); }, []);

  const generate = async () => {
    if (!state?.profile) return;
    setLoading(true);
    try {
      const recentReflections = state.missionArchive.slice(-10).map((m) => m.reflection || '').filter(Boolean);
      const topAreas = Object.entries(state.areas).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
      const level = levelForXP(state.xp);
      const card = await api.identityCard({
        profile: state.profile,
        level: level.name,
        streak: state.streak,
        total_missions: state.totalMissionsDone,
        top_areas: topAreas,
        recent_reflections: recentReflections,
      });
      const next = addTimeline({
        ...state,
        identityCard: { generatedAt: new Date().toISOString(), statement: card.statement, percentProgress: card.percent_progress },
        badges: awardBadge(state.badges, 'identity_seen'),
      }, { kind: 'identity', label: 'Identity Card generated' });
      await saveState(next); setState(next);
    } catch (e: any) {
      alert('Não foi possível gerar: ' + (e?.message || 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const doShare = () => {
    if (!state?.identityCard) return;
    Share.share({ message: `Minha Identidade LifeScript: ${state.identityCard.statement} — lifescript.app` }).catch(() => {});
  };

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const id = state.identityCard;

  return (
    <ScreenBg>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="id-back-btn">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 22 }}>
        <View style={styles.card}>
          <LinearGradient colors={['#0A0A1A', '#3B0764', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Starfield density={50} />
          <View style={{ padding: 22 }}>
            <Text style={styles.kicker}>IDENTIDADE · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.name}>{state.profile?.name}</Text>
            {loading ? (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <ActivityIndicator color={colors.primaryLight} />
                <Text style={{ color: colors.textDim, marginTop: 10 }}>Lendo os dados…</Text>
              </View>
            ) : id ? (
              <>
                <TypingText text={id.statement} style={styles.statement} speedMs={22} />
                <View style={{ alignItems: 'center', marginTop: 22 }}>
                  <CircularProgress progress={id.percentProgress / 100} size={110} stroke={8} color={colors.gold}>
                    <Text style={styles.pct}>{id.percentProgress}%</Text>
                  </CircularProgress>
                  <Text style={styles.pctSub}>rumo à sua visão do Dia 1</Text>
                </View>
              </>
            ) : (
              <Text style={styles.empty}>O Axiom ainda não escreveu seu Cartão de Identidade. Gere agora.</Text>
            )}
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <PrimaryButton
            label={id ? 'Regenerar' : 'Gerar minha identidade'}
            icon="card"
            testID="id-generate-btn"
            onPress={generate}
            variant="gold"
            disabled={loading}
          />
          {id && (
            <View style={{ marginTop: 10 }}>
              <PrimaryButton label="Compartilhar" icon="share-social" testID="id-share-btn" onPress={doShare} variant="ghost" />
            </View>
          )}
        </View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  card: { borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, minHeight: 360 },
  kicker: { color: '#FFD700', fontWeight: '800', letterSpacing: 2, fontSize: 11 },
  name: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  statement: { color: '#fff', fontSize: 18, lineHeight: 26, marginTop: 18, letterSpacing: -0.3 },
  pct: { color: colors.gold, fontWeight: '800', fontSize: 22 },
  pctSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4, letterSpacing: 1 },
  empty: { color: 'rgba(255,255,255,0.85)', marginTop: 18, fontSize: 15, lineHeight: 22 },
});
