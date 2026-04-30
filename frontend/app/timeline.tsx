// Life Timeline — chronological record of becoming.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, State } from '../src/state';

const ICON_FOR: Record<string, keyof typeof Ionicons.glyphMap> = {
  onboarded: 'rocket',
  mission: 'checkmark-circle',
  chapter: 'book',
  pattern: 'eye',
  level: 'trophy',
  share: 'share-social',
  referral: 'person-add',
  letter: 'mail',
};

export default function Timeline() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));
  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const events = [...state.timeline].reverse();

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 60 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="timeline-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sua linha do tempo</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ marginTop: 18 }}>
          {events.length === 0 ? (
            <GlassCard><Text style={styles.dim}>Cada evento aparecerá aqui conforme você evolui.</Text></GlassCard>
          ) : events.map((e, i) => (
            <View key={i} style={styles.eventRow} testID={`timeline-event-${i}`}>
              <View style={styles.dot}>
                <Ionicons name={ICON_FOR[e.kind] || 'star'} size={14} color={colors.text} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.label}>{e.label}</Text>
                <Text style={styles.date}>{new Date(e.at).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124,58,237,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderActive },
  label: { color: colors.text, fontWeight: '700', fontSize: 14 },
  date: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  dim: { color: colors.textDim },
});
