// Life Area Deep Dive — /area/[name]
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, SectionTitle, PrimaryButton, CircularProgress } from '../../src/ui';
import { colors, areaColors, areaIcons } from '../../src/theme';
import { loadState, State, LIFE_AREAS } from '../../src/state';

const QUOTES: Record<string, { author: string; quote: string }[]> = {
  Career: [{ author: 'Steve Jobs', quote: 'The only way to do great work is to love what you do.' }],
  Finances: [{ author: 'Warren Buffett', quote: 'Do not save what is left after spending; spend what is left after saving.' }],
  Health: [{ author: 'Jim Rohn', quote: 'Take care of your body. It is the only place you have to live.' }],
  Relationships: [{ author: 'Maya Angelou', quote: 'People will forget what you said, but never forget how you made them feel.' }],
  Mind: [{ author: 'Marcus Aurelius', quote: 'You have power over your mind — not outside events.' }],
  Skills: [{ author: 'Bruce Lee', quote: 'I fear not the man who has practiced 10,000 kicks once.' }],
  Purpose: [{ author: 'Victor Frankl', quote: 'Those who have a why can bear almost any how.' }],
  Legacy: [{ author: 'Shannon L. Alder', quote: 'Carve your name on hearts, not tombstones.' }],
};

export default function AreaScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const router = useRouter();
  const area = String(name || 'Mind');
  const [state, setState] = useState<State | null>(null);

  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const score = state.areas[area] ?? 0;
  const areaMissions = state.missionArchive.filter((m) => m.area === area);
  const q = QUOTES[area]?.[0] ?? { author: 'Anonymous', quote: '' };
  const color = areaColors[area] || colors.primary;
  const locked = (area === 'Purpose' || area === 'Legacy') && score === 0;
  const upcoming = state.missions.filter((m) => m.area === area && !m.completed).slice(0, 3);

  return (
    <ScreenBg gradient={['#080818', `${color}22`, '#06061A'] as const}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 60 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="area-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{area}</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassCard tint={`${color}15`} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 24 }}>
          <CircularProgress progress={score} size={140} stroke={10} color={color}>
            <Ionicons name={(areaIcons[area] || 'star') as any} size={40} color={color} />
          </CircularProgress>
          <Text style={styles.score}>{Math.round(score * 100)}%</Text>
          <Text style={styles.sub}>{areaMissions.length} mission{areaMissions.length === 1 ? '' : 's'} completed</Text>
        </GlassCard>

        {locked && (
          <GlassCard style={{ marginTop: 16 }}>
            <Text style={styles.lockTitle}>🌌 Hidden constellation</Text>
            <Text style={styles.lockDesc}>{area === 'Purpose' ? 'Unlocks as you discover your deeper why.' : 'Unlocks at Level 5 or through Legacy missions.'}</Text>
          </GlassCard>
        )}

        <SectionTitle style={{ marginTop: 24 }}>Axiom's diagnosis</SectionTitle>
        <GlassCard>
          <Text style={styles.diag}>
            {areaMissions.length === 0
              ? `Your ${area} constellation is dormant. A single small action today prevents a 3-week setback.`
              : `You have shown up for ${area} ${areaMissions.length} times. Consistency is your leverage — keep the drift small.`}
          </Text>
        </GlassCard>

        {upcoming.length > 0 && (
          <>
            <SectionTitle style={{ marginTop: 24 }}>Upcoming</SectionTitle>
            {upcoming.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => router.push({ pathname: '/mission', params: { id: m.id } })}
                testID={`area-mission-${m.id}`}
              >
                <GlassCard style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={m.icon as any} size={22} color={color} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.missionTitle}>{m.title}</Text>
                      <Text style={styles.missionMeta}>{m.minutes} min · {m.date}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}

        {q.quote && (
          <>
            <SectionTitle style={{ marginTop: 24 }}>Voices of mastery</SectionTitle>
            <GlassCard>
              <Text style={styles.quote}>"{q.quote}"</Text>
              <Text style={styles.author}>— {q.author}</Text>
            </GlassCard>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  score: { color: colors.text, fontSize: 48, fontWeight: '800', letterSpacing: -1, marginTop: 12 },
  sub: { color: colors.textDim, fontSize: 13 },
  lockTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  lockDesc: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  diag: { color: colors.text, fontSize: 14, lineHeight: 22 },
  missionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  missionMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  quote: { color: colors.text, fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  author: { color: colors.textAccent, marginTop: 8, fontWeight: '700', fontSize: 12 },
});
