// LifeScript Pro upgrade screen with countdown + dramatic before/after.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenBg, PrimaryButton, GlassCard } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State } from '../src/state';

const { width } = Dimensions.get('window');

const PROMISES = [
  { with: 'Unlimited AI Coach',     without: '3 messages per day' },
  { with: 'Unlimited daily missions', without: 'First 7 days only' },
  { with: 'Boss Battles every 30 days', without: 'Locked' },
  { with: 'Streak Shields',          without: 'No protection' },
  { with: 'Advanced analytics',      without: 'Basic only' },
  { with: 'Custom mission themes',   without: 'Default only' },
];

export default function Upgrade() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [now, setNow] = useState(Date.now());

  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  // Countdown — 48h since this visit (resets on each open of the app)
  const totalMs = 48 * 3600 * 1000;
  const elapsed = now - state.proCountdownStart;
  const left = Math.max(0, totalMs - elapsed);
  const hh = Math.floor(left / 3600000);
  const mm = Math.floor((left % 3600000) / 60000);
  const ss = Math.floor((left % 60000) / 1000);

  const purchase = async () => {
    if (!state) return;
    Alert.alert(
      'Activate LifeScript Pro?',
      'This is a demo — the upgrade flow is simulated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: plan === 'yearly' ? 'Activate yearly' : 'Activate monthly',
          onPress: async () => {
            const next = { ...state, pro: true };
            await saveState(next);
            setState(next);
            Alert.alert('Welcome to Pro', 'All features unlocked. Enjoy!');
            router.back();
          },
        },
      ],
    );
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="upgrade-back-btn">
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        <View style={styles.diamondWrap}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899', '#F59E0B']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.diamond}
          >
            <Ionicons name="diamond" size={40} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Unlock LifeScript Pro</Text>
        <Text style={styles.subtitle}>Become the version of you that future-you wishes you started today.</Text>

        {/* Countdown */}
        {!state.pro && (
          <View style={styles.countdown} testID="upgrade-countdown">
            <Ionicons name="timer" size={16} color={colors.gold} />
            <Text style={styles.countdownTxt}>
              {`  Launch price ends in ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}
            </Text>
          </View>
        )}

        {/* Before / After split */}
        <View style={styles.split}>
          <View style={[styles.splitCol, styles.beforeCol]}>
            <Text style={[styles.splitHeader, { color: colors.textDim }]}>Without Pro</Text>
            {PROMISES.map((p) => (
              <View key={p.without} style={styles.splitRow}>
                <Ionicons name="lock-closed" size={14} color={colors.textDim} />
                <Text style={[styles.splitTxt, { color: colors.textDim }]}>  {p.without}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.splitCol, styles.afterCol]}>
            <LinearGradient
              colors={['rgba(124,58,237,0.4)', 'rgba(236,72,153,0.25)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.splitHeader, { color: '#fff' }]}>With Pro</Text>
            {PROMISES.map((p) => (
              <View key={p.with} style={styles.splitRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.gold} />
                <Text style={styles.splitTxt}>  {p.with}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansRow}>
          <PlanCard
            active={plan === 'monthly'}
            onPress={() => setPlan('monthly')}
            title="Monthly"
            price="$6.99"
            cadence="/month"
            testID="plan-monthly"
          />
          <PlanCard
            active={plan === 'yearly'}
            onPress={() => setPlan('yearly')}
            title="Yearly"
            price="$49.99"
            cadence="/year"
            badge="SAVE 40%"
            testID="plan-yearly"
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <PrimaryButton
            label={state.pro ? 'You are Pro 🎉' : `Activate ${plan === 'monthly' ? 'monthly' : 'yearly'}`}
            icon={state.pro ? 'trophy' : 'diamond'}
            testID="upgrade-purchase-btn"
            onPress={purchase}
            variant="gold"
            disabled={state.pro}
          />
        </View>

        <Text style={styles.fineprint}>
          Demo only — no real charge. Invite 3 friends to unlock 1 month free.
        </Text>
      </ScrollView>
    </ScreenBg>
  );
}

function PlanCard({
  active,
  onPress,
  title,
  price,
  cadence,
  badge,
  testID,
}: {
  active: boolean;
  onPress: () => void;
  title: string;
  price: string;
  cadence: string;
  badge?: string;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.plan, active && styles.planActive]}
      testID={testID}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.planTitle, active && { color: colors.gold }]}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planCad}>{cadence}</Text>
      </View>
      {active && (
        <View style={styles.planCheck}>
          <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  diamondWrap: { alignItems: 'center', marginTop: 8 },
  diamond: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 20,
  },
  title: {
    color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center',
    letterSpacing: -1, marginTop: 18,
  },
  subtitle: { color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  countdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.4)', borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 999, alignSelf: 'center', marginTop: 18,
  },
  countdownTxt: { color: colors.gold, fontWeight: '700', fontSize: 13 },

  split: { flexDirection: 'row', marginTop: 22, borderRadius: 18, overflow: 'hidden' },
  splitCol: { flex: 1, padding: 16 },
  beforeCol: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRightWidth: 0.5, borderRightColor: colors.border,
  },
  afterCol: { overflow: 'hidden' },
  splitHeader: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  splitRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  splitTxt: { color: '#fff', fontSize: 12 },

  plansRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  plan: {
    flex: 1, padding: 16, borderRadius: 18,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.border,
    minHeight: 120,
  },
  planActive: { borderColor: colors.gold, backgroundColor: 'rgba(245,158,11,0.08)' },
  badge: {
    position: 'absolute', top: -10, right: 12,
    backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 99,
  },
  badgeTxt: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  planPrice: { color: colors.text, fontSize: 24, fontWeight: '800' },
  planCad: { color: colors.textDim, fontSize: 12 },
  planCheck: { position: 'absolute', top: 12, right: 12 },

  fineprint: { color: colors.textDim, textAlign: 'center', marginTop: 18, fontSize: 11 },
});
