// LifeScript — Loot Box pós-missão. Recompensa variável para gancho de dopamina.
// A missão já foi salva antes de chegar aqui. Este ecrã só sorteia e aplica um
// brinde extra, com abertura cinematográfica.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  withSpring, Easing, FadeIn, FadeInDown,
} from 'react-native-reanimated';

import { ScreenBg, ConfettiBurst, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, addTimeline, State } from '../src/state';
import { Sounds } from '../src/sounds';

const { width } = Dimensions.get('window');

type Reward = {
  key: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  apply: (s: State) => State;
};

const RARITY_COLORS: Record<Reward['rarity'], string> = {
  common: '#A78BFA',
  rare: '#3B82F6',
  epic: '#F59E0B',
  legendary: '#F472B6',
};

const RARITY_LABEL: Record<Reward['rarity'], string> = {
  common: 'COMUM',
  rare: 'RARO',
  epic: 'ÉPICO',
  legendary: 'LENDÁRIO',
};

// Pool de recompensas — pesos determinam a raridade percebida.
function buildRewardPool(): Array<{ weight: number; make: () => Reward }> {
  return [
    // 45% XP bônus
    { weight: 45, make: () => {
      const bonus = 15 + Math.floor(Math.random() * 36); // 15..50
      return {
        key: 'xp',
        rarity: 'common',
        icon: 'flash',
        title: `+${bonus} XP bônus`,
        description: 'Você entregou. Axioma reconhece.',
        color: RARITY_COLORS.common,
        apply: (s) => ({ ...s, xp: s.xp + bonus }),
      };
    }},
    // 20% Escudo de sequência
    { weight: 20, make: () => ({
      key: 'shield',
      rarity: 'rare',
      icon: 'shield-checkmark',
      title: 'Escudo de sequência',
      description: 'Um dia falho já não quebra sua corrente. Guarde bem.',
      color: RARITY_COLORS.rare,
      apply: (s) => ({ ...s, shields: (s.shields || 0) + 1 }),
    })},
    // 15% XP grande
    { weight: 15, make: () => {
      const big = 75 + Math.floor(Math.random() * 51); // 75..125
      return {
        key: 'xp_big',
        rarity: 'rare',
        icon: 'sparkles',
        title: `+${big} XP raro`,
        description: 'Uma sequência de recompensas dobrada. Aproveita.',
        color: RARITY_COLORS.rare,
        apply: (s) => ({ ...s, xp: s.xp + big }),
      };
    }},
    // 12% Trait novo
    { weight: 12, make: () => {
      const traits = [
        'Consistente', 'Presente', 'Corajoso(a)', 'Focado(a)',
        'Paciente', 'Deliberado(a)', 'Íntegro(a)', 'Vulnerável',
        'Curioso(a)', 'Persistente',
      ];
      const pick = traits[Math.floor(Math.random() * traits.length)];
      return {
        key: 'trait',
        rarity: 'epic',
        icon: 'medal',
        title: `Traço: ${pick}`,
        description: 'Sua identidade acabou de ganhar uma prova.',
        color: RARITY_COLORS.epic,
        apply: (s) => {
          if (s.traits?.includes(pick)) return s;
          return { ...s, traits: [...(s.traits || []), pick] };
        },
      };
    }},
    // 5% Mensagem do Futuro Eu (legendary)
    { weight: 5, make: () => {
      const msgs = [
        'Continua. Você já está mais perto do que sente.',
        'Eu vi você quase desistir hoje. Fico feliz que não.',
        'O que você fez agora ainda não parece grande. Vai parecer.',
        'Isso aqui vira memória. E memória vira identidade.',
        'Guarda esse instante. Já foi provado.',
      ];
      const pick = msgs[Math.floor(Math.random() * msgs.length)];
      return {
        key: 'future_self_msg',
        rarity: 'legendary',
        icon: 'eye',
        title: 'Recado do Futuro Eu',
        description: pick,
        color: RARITY_COLORS.legendary,
        apply: (s) => addTimeline(s, {
          kind: 'future_self_whisper',
          label: 'Sussurro do Futuro Eu',
          meta: { text: pick },
        }),
      };
    }},
    // 3% Prestige (super raro)
    { weight: 3, make: () => ({
      key: 'prestige',
      rarity: 'legendary',
      icon: 'diamond',
      title: 'Fragmento de Prestígio',
      description: 'Marca rara. Você já se comporta como o próximo eu.',
      color: RARITY_COLORS.legendary,
      apply: (s) => ({ ...s, prestige: (s.prestige || 0) + 1 }),
    })},
  ];
}

function pickReward(): Reward {
  const pool = buildRewardPool();
  const total = pool.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const item of pool) {
    r -= item.weight;
    if (r <= 0) return item.make();
  }
  return pool[0].make();
}

export default function LootScreen() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);

  const openChest = useCallback(async () => {
    if (opened || saving) return;
    setSaving(true);
    const r = pickReward();
    const s = await loadState();
    const applied = r.apply(s);
    const withTimeline = addTimeline(applied, {
      kind: 'loot_opened',
      label: `Baú aberto: ${r.title}`,
      meta: { rarity: r.rarity, key: r.key },
    });
    await saveState(withTimeline);
    setReward(r);
    setOpened(true);
    setSaving(false);
    Sounds.levelUp?.();
  }, [opened, saving]);

  const done = () => router.replace('/(tabs)');

  return (
    <ScreenBg gradient={['#04030F', '#1A0B35', '#0B0820'] as const}>
      <View style={styles.container}>
        {!opened ? (
          <>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.headerBlock}>
              <Text style={styles.eyebrow}>MISSÃO COMPLETA</Text>
              <Text style={styles.title}>Um baú apareceu.</Text>
              <Text style={styles.subtitle}>
                O universo reconhece a ação. Toque para ver o que ele te deixou.
              </Text>
            </Animated.View>

            <PulsingChest onPress={openChest} />

            <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.footer}>
              <TouchableOpacity onPress={openChest} activeOpacity={0.85} disabled={saving}>
                <LinearGradient
                  colors={['#F59E0B', '#7C3AED']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.openBtn}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.openBtnTxt}>  Abrir baú</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={done} style={styles.skipBtn} testID="loot-skip">
                <Text style={styles.skipTxt}>Pular</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : reward ? (
          <RewardReveal reward={reward} onContinue={done} />
        ) : null}
      </View>
    </ScreenBg>
  );
}

function PulsingChest({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.4);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900 }),
      ),
      -1, true,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1300 }),
        withTiming(0.3, { duration: 1300 }),
      ),
      -1, true,
    );
  }, []);
  const aScale = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const aGlow = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} testID="loot-chest">
      <View style={styles.chestWrap}>
        <Animated.View style={[styles.chestGlow, aGlow]}>
          <LinearGradient
            colors={['rgba(245,158,11,0.55)', 'rgba(124,58,237,0.35)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.chestBox, aScale]}>
          <LinearGradient
            colors={['#F59E0B', '#7C3AED', '#3B0764']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.chestInner}
          >
            <Ionicons name="cube" size={72} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

function RewardReveal({ reward, onContinue }: { reward: Reward; onContinue: () => void }) {
  const scale = useSharedValue(0.5);
  const rot = useSharedValue(-20);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 90 });
    rot.value = withSpring(0, { damping: 10 });
  }, []);
  const a = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <>
      <ConfettiBurst visible />
      <Animated.View entering={FadeIn.duration(500)} style={styles.rewardContainer}>
        <Text style={[styles.rarityTag, { color: reward.color, borderColor: reward.color }]}>
          {RARITY_LABEL[reward.rarity]}
        </Text>

        <Animated.View style={[styles.rewardIconWrap, a]}>
          <LinearGradient
            colors={[reward.color, '#3B0764']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.rewardIconInner}
          >
            <Ionicons name={reward.icon as any} size={64} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.rewardTitle} testID="loot-reward-title">{reward.title}</Text>
        <Text style={styles.rewardDesc}>{reward.description}</Text>

        <View style={{ marginTop: 32, width: '100%' }}>
          <PrimaryButton
            label="Continuar"
            icon="arrow-forward"
            variant="primary"
            onPress={onContinue}
            testID="loot-continue"
          />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 90,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBlock: { alignItems: 'center', marginBottom: 20 },
  eyebrow: {
    color: colors.textAccent,
    fontSize: 11, letterSpacing: 2, fontWeight: '800',
    marginBottom: 10,
  },
  title: {
    color: colors.text, fontSize: 28, fontWeight: '800',
    letterSpacing: -0.5, textAlign: 'center',
  },
  subtitle: {
    color: colors.textDim, fontSize: 14, marginTop: 10,
    textAlign: 'center', lineHeight: 20, maxWidth: 300,
  },

  chestWrap: {
    width: 260, height: 260,
    alignItems: 'center', justifyContent: 'center',
  },
  chestGlow: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    overflow: 'hidden',
  },
  chestBox: {
    width: 170, height: 170, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(245,158,11,0.55)',
  },
  chestInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },

  footer: { alignItems: 'center', marginBottom: 40, width: '100%' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 44,
    borderRadius: 999,
  },
  openBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  skipBtn: { marginTop: 14, paddingVertical: 10 },
  skipTxt: { color: colors.textDim, fontSize: 13 },

  rewardContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%',
    paddingHorizontal: 12,
  },
  rarityTag: {
    fontSize: 11, letterSpacing: 2, fontWeight: '800',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1.5,
    marginBottom: 24,
  },
  rewardIconWrap: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 24,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  rewardIconInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  rewardTitle: {
    color: colors.text, fontSize: 26, fontWeight: '800',
    letterSpacing: -0.5, textAlign: 'center',
  },
  rewardDesc: {
    color: colors.textDim, fontSize: 14, textAlign: 'center',
    marginTop: 10, lineHeight: 21, maxWidth: 320,
  },
});
