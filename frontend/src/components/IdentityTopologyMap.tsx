import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenBg, GlassCard, ConstellationMap, PrimaryButton, SectionTitle } from '../ui';
import { loadState, State } from '../state';
import { colors } from '../theme';

export default function IdentityTopologyMap() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const areas = state?.areas ?? {};

  const nodes = useMemo(() => {
    const list = Object.entries(areas).map(([label, value], idx) => ({
      id: label,
      label,
      value,
      color: Object.values(colors)[idx % Object.values(colors).length] as string,
      angle: 360 / Math.max(1, Object.keys(areas).length) * idx - 90,
      radius: 88 + (value * 80),
    }));
    return list;
  }, [areas]);

  const missingBridges = useMemo(() => {
    const weakAreas = Object.entries(areas)
      .filter(([, value]) => value < 0.28)
      .map(([area]) => area);
    const strongAreas = Object.entries(areas)
      .filter(([, value]) => value >= 0.5)
      .map(([area]) => area);
    return { weakAreas, strongAreas };
  }, [areas]);

  if (!state) {
    return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  }

  return (
    <ScreenBg gradient={['#02060F', '#0B1020', '#05070D']}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Topologia de Identidade</Text>
          <Text style={styles.subtitle}>Veja o mapa de forças, conexões consolidadas e as pontes que ainda precisam ser erguidas.</Text>

          <GlassCard style={styles.mapCard} tint="rgba(59,130,246,0.08)">
            <ConstellationMap
              size={320}
              nodes={nodes}
              centerLabel="Self"
              centerSub="Conexões adaptativas"
            />
          </GlassCard>

          <GlassCard style={styles.insightCard} tint="rgba(16,185,129,0.08)">
            <SectionTitle style={styles.sectionLabel}>Forças consolidadas</SectionTitle>
            <View style={styles.badgesRow}>
              {missingBridges.strongAreas.length ? missingBridges.strongAreas.map((area) => (
                <View key={area} style={[styles.badge, { borderColor: '#10B981' }]}>
                  <Text style={styles.badgeText}>{area}</Text>
                </View>
              )) : <Text style={styles.helperText}>Nenhuma área estabilizada ainda.</Text>}
            </View>

            <SectionTitle style={[styles.sectionLabel, { marginTop: 20 }]}>Pontes ausentes</SectionTitle>
            <View style={styles.badgesRow}>
              {missingBridges.weakAreas.length ? missingBridges.weakAreas.map((area) => (
                <View key={area} style={[styles.badge, { borderColor: '#F59E0B' }]}>
                  <Text style={styles.badgeText}>{area}</Text>
                </View>
              )) : <Text style={styles.helperText}>Sua topologia está equilibrada no momento.</Text>}
            </View>

            <Text style={styles.footnote}>Use a topologia para identificar onde construir ligações entre força e vulnerabilidade.</Text>
          </GlassCard>

          <GlassCard style={styles.actionCard} tint="rgba(124,58,237,0.08)">
            <Text style={styles.actionTitle}>Reparos de baixo risco</Text>
            <Text style={styles.actionText}>Se uma ponte estiver fraca, escolha uma micro-tarefa que conecte duas áreas antes de delegar.</Text>
            <PrimaryButton label="Fazer uma ponte agora" icon="link" onPress={() => {}} />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 18, paddingBottom: 28 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: '#A5B4FC', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  mapCard: { alignItems: 'center', padding: 18, marginBottom: 18 },
  insightCard: { padding: 18, marginBottom: 18 },
  sectionLabel: { color: '#C4B5FD', fontSize: 12, letterSpacing: 1.7, fontWeight: '800', textTransform: 'uppercase' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  badge: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 10, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  helperText: { color: '#94A3B8', fontSize: 12, marginTop: 10 },
  footnote: { color: '#C4B5FD', fontSize: 12, marginTop: 18, lineHeight: 18 },
  actionCard: { padding: 18 },
  actionTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  actionText: { color: '#94A3B8', fontSize: 13, marginBottom: 18, lineHeight: 18 },
});
