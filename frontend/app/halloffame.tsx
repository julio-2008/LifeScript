// Global Hall of Fame — fake/simulated leaderboard for social proof.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, SectionTitle } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, lifeScore, State } from '../src/state';
import { levelForXP } from '../src/levels';

type Entry = { name: string; country: string; score: number; level: number };
const FAKE: Entry[] = [
  { name: 'Mira K.',    country: '🇵🇹', score: 984, level: 47 },
  { name: 'Ravi S.',    country: '🇮🇳', score: 962, level: 44 },
  { name: 'Elif Y.',    country: '🇹🇷', score: 941, level: 42 },
  { name: 'Noah P.',    country: '🇨🇦', score: 923, level: 40 },
  { name: 'Bella G.',   country: '🇮🇹', score: 908, level: 39 },
  { name: 'Kenji M.',   country: '🇯🇵', score: 890, level: 37 },
  { name: 'Amelia V.',  country: '🇧🇷', score: 874, level: 36 },
  { name: 'Omar L.',    country: '🇲🇦', score: 851, level: 34 },
  { name: 'Sofia N.',   country: '🇪🇸', score: 832, level: 33 },
  { name: 'Daniel H.',  country: '🇺🇸', score: 811, level: 31 },
];

export default function HallOfFame() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));
  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const userScore = lifeScore(state);
  const userLevel = levelForXP(state.xp);
  const mergedSorted = [
    ...FAKE,
    { name: state.profile?.name || 'You', country: state.profile?.country || '🌍', score: userScore, level: userLevel.id },
  ].sort((a, b) => b.score - a.score);
  const meIdx = mergedSorted.findIndex((e) => e.name === (state.profile?.name || 'You'));

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 60 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="hof-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hall da Fama</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassCard style={{ marginTop: 14 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Você está em #{meIdx + 1} globalmente</Text>
          <Text style={{ color: colors.textDim, fontSize: 13, marginTop: 3 }}>Pontos {userScore} · {userLevel.name}</Text>
        </GlassCard>

        <SectionTitle style={{ marginTop: 22 }}>Top pontuadores desta semana</SectionTitle>
        {mergedSorted.slice(0, 12).map((e, i) => {
          const me = i === meIdx;
          return (
            <View key={i} style={[styles.row, me && styles.meRow]} testID={`hof-row-${i}`}>
              <Text style={styles.rank}>#{i + 1}</Text>
              <Text style={styles.flag}>{e.country}</Text>
              <Text style={[styles.name, me && { color: colors.gold }]}>{e.name}</Text>
              <Text style={styles.level}>L{e.level}</Text>
              <Text style={[styles.score, me && { color: colors.gold }]}>{e.score}</Text>
            </View>
          );
        })}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  meRow: { backgroundColor: 'rgba(245,158,11,0.08)', paddingHorizontal: 10, borderRadius: 12 },
  rank: { color: colors.textDim, width: 34, fontWeight: '800' },
  flag: { fontSize: 18, width: 26 },
  name: { color: colors.text, flex: 1, fontWeight: '600' },
  level: { color: colors.textAccent, fontWeight: '700', width: 40 },
  score: { color: colors.text, fontWeight: '800', width: 60, textAlign: 'right' },
});
