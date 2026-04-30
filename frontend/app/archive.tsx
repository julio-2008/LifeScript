// Mission Archive — scrollable history with reflections.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, SectionTitle } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import { loadState, State } from '../src/state';

export default function Archive() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));
  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const archive = [...state.missionArchive].reverse();

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 60 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="archive-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seu arquivo</Text>
          <View style={{ width: 40 }} />
        </View>

        <SectionTitle style={{ marginTop: 18 }}>{archive.length} concluídas</SectionTitle>

        {archive.length === 0 ? (
          <GlassCard><Text style={styles.dim}>Nenhuma missão ainda. A primeira ecoará aqui para sempre.</Text></GlassCard>
        ) : archive.map((m) => (
          <GlassCard key={m.id} style={{ marginBottom: 12 }} testID={`archive-item-${m.id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconWrap, { backgroundColor: `${areaColors[m.area]}22` }]}>
                <Ionicons name={m.icon as any} size={20} color={areaColors[m.area]} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.mainTitle}>{m.title}</Text>
                <Text style={styles.meta}>{m.area.toUpperCase()} · {(m.completedAt ? new Date(m.completedAt).toLocaleDateString() : m.date)}</Text>
              </View>
            </View>
            {m.reflection ? (
              <View style={styles.refBlock}>
                <Text style={styles.refQ}>{m.reflectionQ || 'Reflexão'}</Text>
                <Text style={styles.refA}>"{m.reflection}"</Text>
              </View>
            ) : null}
          </GlassCard>
        ))}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mainTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 2, letterSpacing: 1 },
  refBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  refQ: { color: colors.textAccent, fontSize: 11, fontWeight: '700' },
  refA: { color: colors.text, fontSize: 14, fontStyle: 'italic', marginTop: 4, lineHeight: 20 },
  dim: { color: colors.textDim },
});
