// Profile — Hall of Records.
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Switch, Share,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, SectionTitle, PrimaryButton } from '../../src/ui';
import { colors, areaColors } from '../../src/theme';
import { loadState, saveState, resetState, lifeScore, State } from '../../src/state';
import { LEVELS, levelForXP, eraFor } from '../../src/levels';
import { AVATARS } from '../../src/avatars';
import { BADGES, awardBadge } from '../../src/badges';
import { INVENTORY_META } from '../../src/inventory';

export default function Profile() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const level = levelForXP(state.xp);
  const era = eraFor(level);
  const score = lifeScore(state);
  const join = new Date(state.joinDate).toLocaleDateString();

  const favArea = Object.entries(state.areas).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const rarestBadge = BADGES.find((b) => state.badges.includes(b.id) && b.rarity === 'legendary')
    || BADGES.find((b) => state.badges.includes(b.id) && b.rarity === 'rare')
    || BADGES.find((b) => state.badges.includes(b.id));

  const setAvatar = async (a: string) => {
    const next = { ...state, avatar: a };
    await saveState(next); setState(next); setPickerOpen(false);
  };

  const invite = async () => {
    const link = `https://lifescript.app/?ref=${state.referralCode}`;
    try {
      await Share.share({ message: `Entre na minha jornada LifeScript. Código ${state.referralCode} — nós dois ganhamos um Escudo de Sequência: ${link}` });
      const nextRef = Math.min(state.referrals + 1, 3);
      const next = {
        ...state,
        referrals: nextRef,
        pro: nextRef >= 3 ? true : state.pro,
        badges: awardBadge(state.badges, 'recruiter'),
      };
      if (nextRef >= 3) next.badges = awardBadge(next.badges, 'tribe');
      await saveState(next); setState(next);
    } catch {}
  };

  const resetAll = () =>
    Alert.alert(
      'Reiniciar seu LifeScript?',
      'Isso apaga seu progresso local e refaz o onboarding.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: async () => { await resetState(); router.replace('/'); } },
      ],
    );

  return (
    <ScreenBg gradient={['#080818', era.palette.bg, '#04040C'] as const}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setPickerOpen(true)} testID="profile-avatar-btn">
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarEmoji}>{state.avatar}</Text>
              <View style={styles.avatarEdit}><Ionicons name="pencil" size={12} color="#fff" /></View>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.name} testID="profile-name">{state.profile.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name={level.icon as any} size={14} color={level.color} />
              <Text style={[styles.levelText, { color: level.color }]}>  {era.name} · L{level.id} · {level.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat value={state.xp.toString()} label="XP" testID="profile-xp" />
          <Stat value={state.streak.toString()} label="Sequência" testID="profile-streak" />
          <Stat value={state.badges.length.toString()} label="Medalhas" testID="profile-badges" />
          <Stat value={score.toString()} label="Pontos" testID="profile-score" />
        </View>

        <SectionTitle style={{ marginTop: 24 }} right={
          <TouchableOpacity onPress={() => router.push('/identity')} testID="profile-identity-link">
            <Text style={styles.linkTxt}>Abrir ›</Text>
          </TouchableOpacity>
        }>Cartão de identidade</SectionTitle>
        <GlassCard tint="rgba(124,58,237,0.1)">
          {state.identityCard ? (
            <>
              <Text style={styles.idStatement}>{state.identityCard.statement}</Text>
              <Text style={styles.idMeta}>
                {state.identityCard.percentProgress}% até sua visão do Dia 1 · gerado em {new Date(state.identityCard.generatedAt).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.idEmpty}>Ainda não gerado.</Text>
              <Text style={[styles.idMeta, { marginTop: 4 }]}>Complete 5+ missões e toque em Abrir para gerar.</Text>
            </>
          )}
        </GlassCard>

        {state.traits.length > 0 && (
          <>
            <SectionTitle style={{ marginTop: 22 }}>Traços</SectionTitle>
            <View style={styles.traitRow}>
              {state.traits.map((t) => (
                <View key={t} style={[styles.traitChip, { borderColor: areaColors[t] || colors.border }]}>
                  <Text style={[styles.traitTxt, { color: areaColors[t] || colors.text }]}>{t}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <SectionTitle style={{ marginTop: 22 }} right={
          <TouchableOpacity onPress={() => router.push('/inventory')} testID="profile-inventory-link">
            <Text style={styles.linkTxt}>Todos ›</Text>
          </TouchableOpacity>
        }>Inventário</SectionTitle>
        <View style={styles.invRow}>
          {Object.entries(INVENTORY_META).slice(0, 4).map(([k, m]) => {
            const n = state.inventory[k] || 0;
            const owned = n > 0;
            return (
              <View key={k} style={[styles.invCard, { borderColor: owned ? `${m.color}66` : colors.border }]}>
                <Ionicons name={m.icon as any} size={22} color={owned ? m.color : 'rgba(255,255,255,0.2)'} />
                <Text style={[styles.invN, !owned && { color: colors.textDim }]}>×{n}</Text>
              </View>
            );
          })}
        </View>

        <SectionTitle style={{ marginTop: 22 }}>Acesso rápido</SectionTitle>
        <View style={styles.gridBig}>
          <TileBtn icon="mail" label="Carta ao eu futuro" onPress={() => router.push('/letter')} testID="profile-letter-link" />
          <TileBtn icon="star" label="Quadro dos Sonhos" onPress={() => router.push('/dreamboard')} testID="profile-dream-link" />
          <TileBtn icon="analytics" label="Insight semanal" onPress={() => router.push('/insight')} testID="profile-insight-link" />
          <TileBtn icon="earth" label="Hall da Fama" onPress={() => router.push('/halloffame')} testID="profile-hof-link" />
          <TileBtn icon="time" label="Linha do tempo" onPress={() => router.push('/timeline')} testID="profile-timeline-link" />
          <TileBtn icon="library" label="Arquivo de missões" onPress={() => router.push('/archive')} testID="profile-archive-link" />
        </View>

        <SectionTitle style={{ marginTop: 22 }}>Indicações</SectionTitle>
        <GlassCard>
          <Text style={styles.refTxt}>Código: <Text style={{ color: colors.gold, fontWeight: '800' }} testID="profile-ref-code">{state.referralCode}</Text></Text>
          <Text style={{ color: colors.textDim, fontSize: 13, marginTop: 4 }}>
            {state.referrals}/3 amigos · 3 desbloqueiam 1 mês Pro.
          </Text>
          <View style={styles.refBar}>
            <View style={[styles.refBarFill, { width: `${(state.referrals / 3) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={invite} style={styles.refBtn} testID="profile-invite-btn">
            <Ionicons name="share-social" size={18} color={colors.primaryLight} />
            <Text style={styles.refBtnTxt}>  Enviar convite</Text>
          </TouchableOpacity>
        </GlassCard>

        <SectionTitle style={{ marginTop: 22 }}>Configurações</SectionTitle>
        <GlassCard>
          <Row label="Lembrete diário" right={<Text style={styles.dim}>{state.reminderTime}</Text>} testID="settings-reminder" />
          <Row label="Modo escuro" right={
            <Switch value={state.darkMode} onValueChange={async (v) => { const n = { ...state, darkMode: v }; await saveState(n); setState(n); }} trackColor={{ false: '#333', true: colors.primary }} testID="settings-dark-toggle" />
          } />
          <Row label="Notificações" right={
            <Switch value={state.notificationsEnabled} onValueChange={async (v) => { const n = { ...state, notificationsEnabled: v }; await saveState(n); setState(n); }} trackColor={{ false: '#333', true: colors.primary }} testID="settings-notif-toggle" />
          } />
          <Row label="Editar minhas metas" right={<Ionicons name="chevron-forward" size={18} color={colors.textDim} />} onPress={() => router.push('/edit-goals')} testID="settings-edit-goals" />
          <Row label="LifeScript Pro" right={<Text style={{ color: state.pro ? colors.gold : colors.primaryLight, fontWeight: '700' }}>{state.pro ? 'Ativo' : 'Fazer upgrade'}</Text>} onPress={() => router.push('/upgrade')} testID="settings-pro" />
          <Row label="Reiniciar tudo" right={<Ionicons name="trash" size={18} color={colors.danger} />} onPress={resetAll} testID="settings-reset" last />
        </GlassCard>

        <Text style={[styles.joined, { marginTop: 18 }]}>Entrou em {join}</Text>
        <View style={{ height: 140 }} />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Escolha seu avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((a) => (
                <TouchableOpacity key={a} onPress={() => setAvatar(a)} style={[styles.avatarChoice, state.avatar === a && styles.avatarChoiceActive]} testID={`avatar-${a}`}>
                  <Text style={{ fontSize: 28 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton label="Concluído" testID="avatar-done-btn" onPress={() => setPickerOpen(false)} variant="ghost" />
          </View>
        </View>
      </Modal>
    </ScreenBg>
  );
}

function Stat({ value, label, testID }: any) {
  return (
    <View style={styles.stat} testID={testID}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLab}>{label}</Text>
    </View>
  );
}

function Row({ label, right, onPress, testID, last }: any) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} activeOpacity={0.7}
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      testID={testID}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </Wrap>
  );
}

function TileBtn({ icon, label, onPress, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.tile} testID={testID} activeOpacity={0.85}>
      <Ionicons name={icon as any} size={22} color={colors.primaryLight} />
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 70, paddingHorizontal: 22, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(124,58,237,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  avatarEmoji: { fontSize: 44 },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  name: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  levelText: { fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  statVal: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLab: { color: colors.textDim, fontSize: 11, marginTop: 2 },

  idStatement: { color: colors.text, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  idMeta: { color: colors.textDim, fontSize: 11, marginTop: 6 },
  idEmpty: { color: colors.textDim, fontSize: 14 },

  traitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  traitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  traitTxt: { fontWeight: '700', fontSize: 12 },

  invRow: { flexDirection: 'row', gap: 8 },
  invCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1 },
  invN: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 4 },

  gridBig: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  tileLabel: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 8 },

  refTxt: { color: colors.text, fontSize: 14, fontWeight: '600' },
  refBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  refBarFill: { height: '100%', backgroundColor: colors.gold },
  refBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginTop: 12, justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 12 },
  refBtnTxt: { color: colors.primaryLight, fontWeight: '700' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },

  joined: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  dim: { color: colors.textDim, fontSize: 13 },

  linkTxt: { color: colors.primaryLight, fontSize: 12, fontWeight: '700' },

  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  avatarChoice: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  avatarChoiceActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.2)' },
});
