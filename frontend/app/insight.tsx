// Weekly Insight — AI analysis of the last 7 days.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, PrimaryButton, TypingText, SectionTitle } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, State, LIFE_AREAS } from '../src/state';
import { api } from '../src/api';

export default function Insight() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ diagnosis: string; challenge: string; quote: string } | null>(null);

  useEffect(() => { loadState().then(setState); }, []);

  const generate = async () => {
    if (!state?.profile) return;
    setLoading(true);
    try {
      const weekAgo = Date.now() - 7 * 86400000;
      const last7 = state.missionArchive.filter((m) => m.completedAt && new Date(m.completedAt).getTime() > weekAgo).length;
      const neglected = LIFE_AREAS.filter((a) => (state.areas[a] ?? 0) < 0.1);
      const res = await api.weeklyInsight({
        profile: state.profile,
        area_scores: state.areas,
        streak: state.streak,
        missions_last_7_days: last7,
        neglected_areas: neglected,
      });
      setData(res);
    } catch (e: any) {
      alert('Não foi possível gerar: ' + (e?.message || 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  return (
    <ScreenBg>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="insight-back-btn">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insight Semanal</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 22 }}>
        {loading ? (
          <GlassCard style={{ alignItems: 'center', padding: 30 }}>
            <ActivityIndicator color={colors.primaryLight} />
            <Text style={{ color: colors.textDim, marginTop: 8 }}>Lendo sua semana…</Text>
          </GlassCard>
        ) : data ? (
          <>
            <SectionTitle>Diagnóstico do Axiom</SectionTitle>
            <GlassCard><TypingText text={data.diagnosis} style={styles.body} speedMs={22} /></GlassCard>
            <SectionTitle style={{ marginTop: 20 }}>Desafio desta semana</SectionTitle>
            <GlassCard tint="rgba(245,158,11,0.08)">
              <Text style={styles.challenge}>{data.challenge}</Text>
            </GlassCard>
            <SectionTitle style={{ marginTop: 20 }}>Frase do Axiom pra você</SectionTitle>
            <GlassCard><Text style={styles.quote}>"{data.quote}"</Text></GlassCard>
          </>
        ) : (
          <GlassCard style={{ alignItems: 'center', padding: 30 }}>
            <Ionicons name="analytics" size={42} color={colors.primaryLight} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 10 }}>Seu relatório está pronto</Text>
            <Text style={{ color: colors.textDim, marginTop: 4, textAlign: 'center' }}>Um toque para a análise semanal do Axiom.</Text>
            <View style={{ marginTop: 20, alignSelf: 'stretch' }}>
              <PrimaryButton label="Gerar insight" icon="sparkles" testID="insight-generate-btn" onPress={generate} variant="gold" />
            </View>
          </GlassCard>
        )}
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  challenge: { color: colors.gold, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  quote: { color: colors.text, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
});
