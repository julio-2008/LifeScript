// Profile / Settings screen.
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
  Share,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, SectionTitle, PrimaryButton } from '../../src/ui';
import { colors } from '../../src/theme';
import { loadState, saveState, resetState, State, lifeScore } from '../../src/state';
import { LEVELS, levelForXP } from '../../src/levels';
import { AVATARS } from '../../src/avatars';
import { BADGES } from '../../src/badges';

export default function Profile() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadState().then(setState);
    }, []),
  );

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const level = levelForXP(state.xp);
  const earned = state.badges.length;
  const score = lifeScore(state);
  const join = new Date(state.joinDate).toLocaleDateString();

  const setAvatar = async (a: string) => {
    const next = { ...state, avatar: a };
    await saveState(next);
    setState(next);
    setPickerOpen(false);
  };

  const inviteFriend = async () => {
    const link = `https://lifescript.app/?ref=${state.referralCode}`;
    try {
      await Share.share({
        message: `I'm scripting my life with LifeScript. Use my code ${state.referralCode} and we both get a Streak Shield: ${link}`,
      });
      // Simulate referral count for demo (mock).
      const next = {
        ...state,
        referrals: Math.min(state.referrals + 1, 3),
        pro: state.referrals + 1 >= 3 ? true : state.pro,
        badges: state.referrals + 1 >= 1 && !state.badges.includes('recruiter')
          ? [...state.badges, 'recruiter']
          : state.badges,
      };
      await saveState(next);
      setState(next);
    } catch (e) {
      console.warn('share err', e);
    }
  };

  const resetAll = () =>
    Alert.alert(
      'Restart your LifeScript?',
      'This deletes your local progress and re-runs onboarding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            await resetState();
            router.replace('/');
          },
        },
      ],
    );

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setPickerOpen(true)} testID="profile-avatar-btn">
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarEmoji}>{state.avatar}</Text>
              <View style={styles.avatarEdit}>
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.name} testID="profile-name">{state.profile.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name={level.icon as any} size={14} color={level.color} />
              <Text style={[styles.levelText, { color: level.color }]}>  {level.name}</Text>
              <Text style={{ color: colors.textDim }}>  ·  {state.profile.country}</Text>
            </View>
          </View>
        </View>

        {/* stats */}
        <View style={styles.statsRow}>
          <Stat value={state.xp.toString()} label="XP" testID="profile-xp" />
          <Stat value={state.streak.toString()} label="Streak" testID="profile-streak" />
          <Stat value={earned.toString()} label="Badges" testID="profile-badges" />
          <Stat value={score.toString()} label="Score" testID="profile-score" />
        </View>

        {/* recent badges */}
        <SectionTitle style={{ marginTop: 24 }}>Recent badges</SectionTitle>
        <GlassCard>
          {state.badges.length === 0 ? (
            <Text style={styles.dim}>Complete missions to earn your first badge.</Text>
          ) : (
            <View style={styles.badgeRow}>
              {state.badges.slice(-6).map((id) => {
                const b = BADGES.find((x) => x.id === id);
                if (!b) return null;
                return (
                  <View key={id} style={[styles.badgeChip, { borderColor: `${b.color}66` }]}>
                    <Ionicons name={b.icon as any} size={16} color={b.color} />
                    <Text style={styles.badgeChipTxt}>{b.name}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>

        {/* referral */}
        <SectionTitle style={{ marginTop: 28 }}>Challenge a friend</SectionTitle>
        <GlassCard>
          <Text style={styles.refTxt}>
            Your code: <Text style={{ color: colors.gold, fontWeight: '800' }} testID="profile-ref-code">{state.referralCode}</Text>
          </Text>
          <Text style={[styles.dim, { marginTop: 6 }]}>
            {state.referrals}/3 friends invited. Reach 3 to unlock 1 month Pro free.
          </Text>
          <View style={styles.refBar}>
            <View style={[styles.refBarFill, { width: `${(state.referrals / 3) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={inviteFriend} style={styles.refBtn} testID="profile-invite-btn">
            <Ionicons name="share-social" size={18} color={colors.primary} />
            <Text style={styles.refBtnTxt}>Send invite</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* settings */}
        <SectionTitle style={{ marginTop: 28 }}>Settings</SectionTitle>
        <GlassCard>
          <Row label="Daily reminder" right={<Text style={styles.dim}>{state.reminderTime}</Text>} testID="settings-reminder" />
          <Row
            label="Dark mode"
            right={
              <Switch
                value={state.darkMode}
                onValueChange={async (v) => { const n = { ...state, darkMode: v }; await saveState(n); setState(n); }}
                trackColor={{ false: '#333', true: colors.primary }}
                testID="settings-dark-toggle"
              />
            }
          />
          <Row
            label="Edit my goals"
            right={<Ionicons name="chevron-forward" size={18} color={colors.textDim} />}
            onPress={() => router.push('/edit-goals')}
            testID="settings-edit-goals"
          />
          <Row
            label="LifeScript Pro"
            right={
              <Text style={{ color: state.pro ? colors.gold : colors.primary, fontWeight: '700' }}>
                {state.pro ? 'Active' : 'Upgrade'}
              </Text>
            }
            onPress={() => router.push('/upgrade')}
            testID="settings-pro"
          />
          <Row
            label="Restart everything"
            right={<Ionicons name="trash" size={18} color={colors.red} />}
            onPress={resetAll}
            testID="settings-reset"
            last
          />
        </GlassCard>

        <Text style={[styles.joined, { marginTop: 18 }]}>Joined {join}</Text>
        <View style={{ height: 140 }} />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose your avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAvatar(a)}
                  style={[styles.avatarChoice, state.avatar === a && styles.avatarChoiceActive]}
                  testID={`avatar-${a}`}
                >
                  <Text style={{ fontSize: 28 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton label="Done" testID="avatar-done-btn" onPress={() => setPickerOpen(false)} variant="ghost" />
          </View>
        </View>
      </Modal>
    </ScreenBg>
  );
}

function Stat({ value, label, testID }: { value: string; label: string; testID?: string }) {
  return (
    <View style={styles.stat} testID={testID}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLab}>{label}</Text>
    </View>
  );
}

function Row({
  label,
  right,
  onPress,
  testID,
  last,
}: { label: string; right?: React.ReactNode; onPress?: () => void; testID?: string; last?: boolean; }) {
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      testID={testID}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 70, paddingHorizontal: 24, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(124,58,237,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarEmoji: { fontSize: 44 },
  avatarEdit: {
    position: 'absolute', right: -2, bottom: -2,
    backgroundColor: colors.primary,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  name: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  levelText: { fontSize: 14, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 22, gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.border,
  },
  statVal: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLab: { color: colors.textDim, fontSize: 11, marginTop: 2 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeChipTxt: { color: colors.text, fontSize: 12, fontWeight: '600', marginLeft: 4 },

  refTxt: { color: colors.text, fontSize: 14, fontWeight: '600' },
  refBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3, marginTop: 12, overflow: 'hidden',
  },
  refBarFill: { height: '100%', backgroundColor: colors.gold },
  refBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, marginTop: 12, justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 12,
  },
  refBtnTxt: { color: colors.primary, fontWeight: '700', marginLeft: 6 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },

  joined: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  dim: { color: colors.textDim, fontSize: 13 },

  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  avatarChoice: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  avatarChoiceActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.2)' },
});
