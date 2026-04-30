// Daily Spin — once per day bonus wheel.
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { ScreenBg, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, todayKey, State, addTimeline } from '../src/state';
import { awardBadge } from '../src/badges';
import { Sounds } from '../src/sounds';

type Prize = { id: string; label: string; color: string; xp?: number; shield?: boolean };
const PRIZES: Prize[] = [
  { id: 'xp50',   label: '+50 XP',     color: '#7C3AED', xp: 50 },
  { id: 'xp100',  label: '+100 XP',    color: '#F59E0B', xp: 100 },
  { id: 'shield', label: 'Escudo',     color: '#10B981', shield: true },
  { id: 'xp25',   label: '+25 XP',     color: '#3B82F6', xp: 25 },
  { id: 'xp150',  label: '+150 XP',    color: '#EC4899', xp: 150 },
  { id: 'xp10',   label: '+10 XP',     color: '#06B6D4', xp: 10 },
];

export default function Spin() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const rotation = useSharedValue(0);

  useEffect(() => { loadState().then(setState); }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const already = state.lastSpinDate === todayKey();

  const spin = async () => {
    if (already || spinning) return;
    setSpinning(true);
    const prizeIdx = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIdx];
    const slice = 360 / PRIZES.length;
    const targetAngle = 3600 + (PRIZES.length - prizeIdx) * slice - slice / 2;
    rotation.value = withTiming(targetAngle, { duration: 3600, easing: Easing.out(Easing.cubic) });
    Sounds.tap();
    setTimeout(async () => {
      setResult(prize);
      Sounds.complete();
      let badges = [...state.badges];
      if (!badges.includes('first_spin')) badges = awardBadge(badges, 'first_spin');
      if (prize.shield) badges = awardBadge(badges, 'shielded');
      const next = addTimeline({
        ...state,
        xp: state.xp + (prize.xp || 0),
        shields: state.shields + (prize.shield ? 1 : 0),
        badges,
        lastSpinDate: todayKey(),
      }, { kind: 'spin', label: `Daily Spin: ${prize.label}` });
      await saveState(next); setState(next);
      setSpinning(false);
    }, 3700);
  };

  const cx = 140, cy = 140, r = 120;
  const slice = 360 / PRIZES.length;

  return (
    <ScreenBg>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="spin-back-btn">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roleta Diária</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.center}>
        <View>
          <Animated.View style={animStyle}>
            <Svg width={280} height={280}>
              {PRIZES.map((p, i) => {
                const a0 = (i * slice - 90) * Math.PI / 180;
                const a1 = ((i + 1) * slice - 90) * Math.PI / 180;
                const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
                const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
                const largeArc = slice > 180 ? 1 : 0;
                const d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
                const midA = (i * slice + slice / 2 - 90) * Math.PI / 180;
                const tx = cx + (r - 40) * Math.cos(midA);
                const ty = cy + (r - 40) * Math.sin(midA);
                return (
                  <G key={p.id}>
                    <Path d={d} fill={p.color} opacity={0.85} />
                    <SvgText x={tx} y={ty} fill="#fff" fontSize="12" fontWeight="800" textAnchor="middle">{p.label}</SvgText>
                  </G>
                );
              })}
            </Svg>
          </Animated.View>
          <View style={styles.pointer}><Ionicons name="caret-down" size={30} color={colors.gold} /></View>
        </View>

        {result ? (
          <>
            <Text style={styles.result} testID="spin-result">Você ganhou {result.label}!</Text>
            <View style={{ marginTop: 18, alignSelf: 'stretch', paddingHorizontal: 24 }}>
              <PrimaryButton label="Voltar ao mapa" icon="planet" testID="spin-continue-btn" onPress={() => router.replace('/(tabs)')} variant="gold" />
            </View>
          </>
        ) : (
          <View style={{ marginTop: 26, alignSelf: 'stretch', paddingHorizontal: 24 }}>
            <PrimaryButton
              label={already ? 'Volte amanhã' : (spinning ? 'Girando…' : 'Girar a roleta')}
              icon="refresh"
              testID="spin-btn"
              onPress={spin}
              variant="gold"
              disabled={already || spinning}
            />
          </View>
        )}

        <Text style={styles.sub}>Uma vez por dia. Grátis.</Text>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pointer: { position: 'absolute', top: -4, left: 125 },
  result: { color: colors.gold, fontWeight: '800', fontSize: 24, marginTop: 18 },
  sub: { color: colors.textDim, marginTop: 18, fontSize: 12 },
});
