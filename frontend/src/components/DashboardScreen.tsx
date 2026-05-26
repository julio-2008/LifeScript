import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Switch, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBg, GlassCard, PrimaryButton, SectionTitle } from '../ui';
import { loadState } from '../state';
import { EconomyController } from '../economyController';
import { IdentityLedgerStore } from '../ledger';
import { State, StoredMission } from '../state';

const ledgerSecret = 'dashboard-ui-secret';
const economyController = new EconomyController(new IdentityLedgerStore(ledgerSecret));

function missionScore(mission: StoredMission) {
  const kindWeight = mission.kind === 'main' ? 1.4 : mission.kind === 'daily-challenge' ? 1.25 : 1;
  return mission.minutes * kindWeight + (mission.completed ? 20 : 0);
}

export default function DashboardScreen() {
  const [state, setState] = useState<State | null>(null);
  const [signalFilter, setSignalFilter] = useState(true);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const missions = state?.missions ?? [];
  const heatIndex = state ? economyController.heatIndex(state.economy) : 0;
  const topMission = useMemo(() => {
    if (!missions.length) return null;
    return [...missions].sort((a, b) => missionScore(b) - missionScore(a))[0];
  }, [missions]);
  const visibleMissions = useMemo(() => {
    if (!missions.length) return [];
    if (!signalFilter) return missions.slice(0, 4);
    return missions
      .filter((m) => missionScore(m) >= 40 || m.kind === 'main')
      .slice(0, 4);
  }, [missions, signalFilter]);

  if (!state) {
    return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  }

  const { current, maximum, burnoutRisk } = state.economy;
  const cards = [
    { label: 'Tempo', value: current.time, total: maximum.time, accent: '#FA8C16' },
    { label: 'Atenção', value: current.attention, total: maximum.attention, accent: '#0EA5E9' },
    { label: 'Vontade', value: current.willpower, total: maximum.willpower, accent: '#C084FC' },
  ];

  return (
    <ScreenBg gradient={['#05040B', '#0F122B', '#080816']}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Painel Termodinâmico</Text>
          <Text style={styles.pageSubtitle}>Termômetro da energia psicológica e do foco estratégico.</Text>

          <GlassCard style={styles.statusCard} tint="rgba(248,113,113,0.08)">
            <View style={styles.statusHeader}>
              <Text style={styles.statusLabel}>Fluxo térmico</Text>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeText}>{Math.round(heatIndex * 100)}%</Text>
              </View>
            </View>
            <Text style={styles.statusHint}>O motor de esforço está respondendo ao ritmo atual do dia.</Text>
            <View style={styles.heatBand}>
              <LinearGradient
                colors={['#FF6D00', '#F59E0B', '#A855F7']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.heatFill, { width: `${Math.max(12, heatIndex * 100)}%` }]}
              />
            </View>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusValue}>{current.time}/{maximum.time}</Text>
                <Text style={styles.statusText}>Tempo disponível</Text>
              </View>
              <View>
                <Text style={styles.statusValue}>{current.attention}/{maximum.attention}</Text>
                <Text style={styles.statusText}>Foco disponível</Text>
              </View>
              <View>
                <Text style={styles.statusValue}>{current.willpower}/{maximum.willpower}</Text>
                <Text style={styles.statusText}>Vontade disponível</Text>
              </View>
            </View>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>Burnout</Text>
              <View style={styles.riskTrack}>
                <View style={[styles.riskFill, { width: `${Math.max(8, burnoutRisk * 100)}%` }]} />
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.filterCard} tint="rgba(59,130,246,0.08)">
            <View style={styles.filterHeader}>
              <View>
                <Text style={styles.filterTitle}>Filtro Sinal / Ruído</Text>
                <Text style={styles.filterSubtitle}>Mostre apenas as ações de maior alavancagem no dia.</Text>
              </View>
              <Switch
                value={signalFilter}
                onValueChange={setSignalFilter}
                thumbColor={signalFilter ? '#A78BFA' : '#F3F4F6'}
                trackColor={{ false: '#334155', true: '#7C3AED' }}
              />
            </View>
            {topMission ? (
              <View style={styles.highlightRow}>
                <View style={styles.highImpactPill}>
                  <Text style={styles.pillText}>{topMission.kind?.toUpperCase() ?? 'TAREFA'}</Text>
                </View>
                <Text style={styles.highlightTitle} numberOfLines={2}>{topMission.title}</Text>
                <Text style={styles.highlightMeta}>{topMission.minutes} min · {topMission.completed ? 'Concluída' : 'Pendente'}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Ainda não há missões carregadas para analisar.</Text>
            )}
          </GlassCard>

          <SectionTitle style={styles.sectionTitle}>Matriz de carga</SectionTitle>
          <View style={styles.chargeGrid}>
            {cards.map((card) => {
              const ratio = Math.max(0, Math.min(1, card.value / card.total));
              return (
                <GlassCard key={card.label} style={styles.chargeCard} tint={`${card.accent}12`}>
                  <Text style={styles.chargeLabel}>{card.label}</Text>
                  <Text style={styles.chargeValue}>{card.value}</Text>
                  <View style={styles.chargeTrack}>
                    <LinearGradient
                      colors={[card.accent, '#1B1B35']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.chargeBar, { width: `${Math.max(14, ratio * 100)}%` }]}
                    />
                  </View>
                  <Text style={styles.chargeHint}>{Math.round(ratio * 100)}% do limite máximo</Text>
                </GlassCard>
              );
            })}
          </View>

          <GlassCard style={styles.taskCluster} tint="rgba(16,185,129,0.08)">
            <Text style={styles.clusterTitle}>Tarefas em foco</Text>
            {visibleMissions.length ? visibleMissions.map((mission) => (
              <View key={mission.id} style={styles.taskRow}>
                <View>
                  <Text style={styles.taskTitle}>{mission.title}</Text>
                  <Text style={styles.taskMeta}>{mission.minutes} min · {mission.kind || 'rotina'}</Text>
                </View>
                <TouchableOpacity style={styles.actionDot}>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={styles.emptyText}>Filtro ativo. Sem missões definidas como foco.</Text>
            )}
          </GlassCard>

          <PrimaryButton
            label="Registrar snapshot térmico"
            icon="pulse"
            onPress={() => {}}
            style={styles.saveBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 18, paddingBottom: 28 },
  pageTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  pageSubtitle: { color: '#A5B4FC', marginBottom: 20, fontSize: 13, lineHeight: 20 },
  statusCard: { marginBottom: 18, padding: 20 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusLabel: { color: '#EDE9FE', fontSize: 14, fontWeight: '800' },
  metricBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  metricBadgeText: { color: '#F8FAFC', fontWeight: '700' },
  statusHint: { color: '#CBD5E1', fontSize: 12, marginBottom: 18, lineHeight: 18 },
  heatBand: { height: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginBottom: 18 },
  heatFill: { height: '100%', borderRadius: 999 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  statusText: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  riskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  riskLabel: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },
  riskTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 12, overflow: 'hidden' },
  riskFill: { height: '100%', backgroundColor: '#F59E0B' },
  filterCard: { marginBottom: 18, padding: 18 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  filterSubtitle: { color: '#94A3B8', marginTop: 4, fontSize: 12, lineHeight: 18 },
  highlightRow: { marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)' },
  highImpactPill: { alignSelf: 'flex-start', marginBottom: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.16)' },
  pillText: { color: '#FDE68A', fontSize: 11, fontWeight: '800' },
  highlightTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  highlightMeta: { color: '#94A3B8', fontSize: 12 },
  emptyText: { color: '#94A3B8', fontSize: 12, marginTop: 12 },
  sectionTitle: { marginTop: 6, marginBottom: 8 },
  chargeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeCard: { width: '32%', padding: 16 },
  chargeLabel: { color: '#A5B4FC', fontSize: 12, marginBottom: 10, fontWeight: '700' },
  chargeValue: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  chargeTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  chargeBar: { height: '100%', borderRadius: 999 },
  chargeHint: { color: '#94A3B8', fontSize: 11, marginTop: 10 },
  taskCluster: { marginTop: 18, padding: 18 },
  clusterTitle: { color: '#E0E7FF', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  taskTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  taskMeta: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  actionDot: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#6D28D9', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { marginTop: 14, alignSelf: 'stretch' },
});
