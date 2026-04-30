// Badges collection screen.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, SectionTitle } from '../../src/ui';
import { colors } from '../../src/theme';
import { BADGES } from '../../src/badges';
import { loadState, State } from '../../src/state';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 12;
const SIZE = (width - 48 - GAP * (COLS - 1)) / COLS;

export default function Badges() {
  const [state, setState] = useState<State | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadState().then(setState);
    }, []),
  );

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const earned = state.badges.length;
  const total = BADGES.length;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sua coleção</Text>
        <Text style={styles.sub}>
          <Text style={{ color: colors.gold, fontWeight: '800' }} testID="badges-count">{earned}</Text>
          <Text> de {total} medalhas conquistadas</Text>
        </Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(earned / total) * 100}%` }]} />
        </View>

        <SectionTitle style={{ marginTop: 28 }}>Todas as medalhas</SectionTitle>

        <View style={styles.grid}>
          {BADGES.map((b) => {
            const unlocked = state.badges.includes(b.id);
            return (
              <View
                key={b.id}
                style={[styles.card, { width: SIZE, height: SIZE + 50 }]}
                testID={`badge-${b.id}`}
              >
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: unlocked ? `${b.color}22` : 'rgba(255,255,255,0.04)',
                      borderColor: unlocked ? `${b.color}66` : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={b.icon as any}
                    size={32}
                    color={unlocked ? b.color : 'rgba(255,255,255,0.2)'}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.bName, !unlocked && { color: colors.textDim }]}
                >
                  {b.name}
                </Text>
                <Text numberOfLines={2} style={styles.bRule}>
                  {b.rule}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 30 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  sub: { color: colors.textDim, marginTop: 6, fontSize: 14 },
  progressBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3, overflow: 'hidden', marginTop: 18,
  },
  progressFill: { height: '100%', backgroundColor: colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconWrap: {
    width: '78%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  bName: { color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  bRule: { color: colors.textDim, fontSize: 10, textAlign: 'center', marginTop: 2 },
});
