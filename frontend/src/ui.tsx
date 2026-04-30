// Reusable UI for LifeScript 2.0.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat,
  withSequence, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, areaColors } from './theme';
import { Sounds } from './sounds';

// ------------------------- GlassCard -------------------------
export function GlassCard({
  children, style, intensity = 26, tint = 'rgba(124,58,237,0.05)',
}: { children: React.ReactNode; style?: StyleProp<ViewStyle>; intensity?: number; tint?: string; }) {
  return (
    <View style={[gc.wrapper, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[gc.tint, { backgroundColor: tint }]} />
      <View style={gc.content}>{children}</View>
    </View>
  );
}
const gc = StyleSheet.create({
  wrapper: {
    borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', backgroundColor: colors.glass,
  },
  tint: { ...StyleSheet.absoluteFillObject },
  content: { padding: 16 },
});

// ------------------------- PrimaryButton -------------------------
export function PrimaryButton({
  label, onPress, icon, testID, style, disabled, variant = 'primary', small,
}: {
  label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap;
  testID?: string; style?: StyleProp<ViewStyle>; disabled?: boolean;
  variant?: 'primary' | 'gold' | 'ghost' | 'danger' | 'sovereign'; small?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const gradients: Record<string, readonly [string, string, ...string[]]> = {
    primary:   ['#7C3AED', '#5B21B6'] as const,
    gold:      ['#F59E0B', '#B45309'] as const,
    ghost:     ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
    danger:    ['#F43F5E', '#881337'] as const,
    sovereign: ['#FFFFFF', '#C4B5FD'] as const,
  };
  const fg = variant === 'sovereign' ? '#000' : '#fff';
  const colorsArr = gradients[variant];
  return (
    <Animated.View style={[animStyle, style]}>
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.88}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 12 }); Sounds.tap(); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={onPress}
        disabled={disabled}
      >
        <LinearGradient
          colors={colorsArr}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            pb.btn,
            small && { paddingVertical: 10, paddingHorizontal: 18 },
            disabled && { opacity: 0.5 },
          ]}
        >
          {icon && <Ionicons name={icon} size={small ? 16 : 20} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[pb.txt, { color: fg }, small && { fontSize: 14 }]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const pb = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: radii.full,
  },
  txt: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});

// ------------------------- CircularProgress -------------------------
export function CircularProgress({
  progress, size = 84, stroke = 6, color, bg = 'rgba(255,255,255,0.08)', children,
}: {
  progress: number; size?: number; stroke?: number; color: string; bg?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={stroke} fill="transparent" />
        <Circle cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="transparent"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

// ------------------------- Starfield -------------------------
export function Starfield({ density = 50 }: { density?: number }) {
  const stars = React.useMemo(
    () => Array.from({ length: density }).map(() => ({
      top: Math.random() * 100, left: Math.random() * 100,
      size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.7 + 0.2,
      delay: Math.random() * 2000,
    })),
    [density],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {stars.map((s, i) => <Twinkle key={i} {...s} />)}
    </View>
  );
}
function Twinkle({ top, left, size, opacity, delay }: any) {
  const o = useSharedValue(opacity * 0.4);
  React.useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(opacity, { duration: 1400 + delay }),
        withTiming(opacity * 0.3, { duration: 1400 }),
      ), -1, true);
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ position: 'absolute', top: `${top}%`, left: `${left}%`, width: size, height: size, borderRadius: size, backgroundColor: '#fff' }, a]} />;
}

// ------------------------- PulsingOrb -------------------------
export function PulsingOrb({ size = 180, color = '#7C3AED' }: { size?: number; color?: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
    opacity.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const aOuter = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const aMid = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(scale.value, [1, 1.15], [1.05, 0.95]) }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: `${color}30` }, aOuter]} />
      <Animated.View style={[{ position: 'absolute', width: size * 0.7, height: size * 0.7, borderRadius: size, backgroundColor: `${color}60` }, aMid]} />
      <LinearGradient
        colors={['#E9D5FF', color, '#3B0764']}
        start={{ x: 0.2, y: 0.2 }} end={{ x: 0.8, y: 0.8 }}
        style={{ width: size * 0.45, height: size * 0.45, borderRadius: size }}
      />
    </View>
  );
}

// ------------------------- ConfettiBurst -------------------------
export function ConfettiBurst({ visible }: { visible: boolean }) {
  const particles = React.useMemo(
    () => Array.from({ length: 36 }).map(() => ({
      x: Math.random() * 360 - 180, y: Math.random() * 600 + 60,
      rot: Math.random() * 360, delay: Math.random() * 300,
      color: ['#7C3AED', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#FFFFFF'][Math.floor(Math.random() * 6)],
      size: Math.random() * 8 + 6,
    })),
    [],
  );
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {particles.map((p, i) => <Particle key={i} {...p} />)}
    </View>
  );
}
function Particle({ x, y, rot, delay, color, size }: any) {
  const ty = useSharedValue(-30);
  const op = useSharedValue(1);
  const r = useSharedValue(0);
  React.useEffect(() => {
    ty.value = withTiming(y, { duration: 2200 + delay, easing: Easing.out(Easing.cubic) });
    op.value = withTiming(0, { duration: 2200 + delay });
    r.value = withTiming(rot, { duration: 2000 + delay });
  }, []);
  const a = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: x }, { rotate: `${r.value}deg` }],
    opacity: op.value,
  }));
  return (
    <Animated.View style={[{ position: 'absolute', top: 100, left: '50%', width: size, height: size * 1.4, borderRadius: 2, backgroundColor: color }, a]} />
  );
}

// ------------------------- SectionTitle -------------------------
export function SectionTitle({ children, style, right }: { children: React.ReactNode; style?: StyleProp<TextStyle>; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={[sec.title, style]}>{children}</Text>
      {right}
    </View>
  );
}
const sec = StyleSheet.create({
  title: { fontSize: 12, color: colors.textDim, letterSpacing: 1.8, fontWeight: '800', textTransform: 'uppercase' },
});

// ------------------------- ScreenBg -------------------------
export function ScreenBg({ children, gradient }: { children: React.ReactNode; gradient?: readonly [string, string, ...string[]] }) {
  const g = gradient ?? (['#080818', '#120F2E', '#06061A'] as const);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={g} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Starfield density={55} />
      {children}
    </View>
  );
}

// ------------------------- ConstellationMap (Life Map 2.0) -------------------------
export type ConstellationNode = { id: string; label: string; value: number; color: string; angle: number; radius: number };
export function ConstellationMap({
  size = 320, nodes, onNodePress, centerLabel, centerSub,
}: {
  size?: number;
  nodes: ConstellationNode[];
  onNodePress?: (id: string) => void;
  centerLabel?: string;
  centerSub?: string;
}) {
  const cx = size / 2, cy = size / 2;
  const pos = nodes.map((n) => {
    const rad = (n.angle * Math.PI) / 180;
    return { ...n, x: cx + Math.cos(rad) * n.radius, y: cy + Math.sin(rad) * n.radius };
  });
  const pulse = useSharedValue(0.85);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 1600 }),
      ),
      -1, true,
    );
  }, []);

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="core" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <Stop offset="35%" stopColor="#A78BFA" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* Connection lines */}
        {pos.map((n, i) => (
          <Line key={`line-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke={`${n.color}${n.value > 0.1 ? '99' : '33'}`}
            strokeWidth={Math.max(0.8, n.value * 2.5)} />
        ))}
        {/* Core */}
        <Circle cx={cx} cy={cy} r={38} fill="url(#core)" />
      </Svg>
      {/* Nodes rendered as Views for touch handling */}
      {pos.map((n) => {
        const active = n.value > 0.05;
        return (
          <TouchableOpacity
            key={n.id}
            testID={`constellation-node-${n.id}`}
            onPress={() => onNodePress?.(n.id)}
            activeOpacity={0.8}
            style={{
              position: 'absolute',
              left: n.x - 26, top: n.y - 26,
              width: 52, height: 52, borderRadius: 26,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: active ? `${n.color}2A` : 'rgba(255,255,255,0.02)',
              borderWidth: 1, borderColor: active ? n.color : 'rgba(255,255,255,0.1)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: active ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800' }}>
                {Math.round(n.value * 100)}
              </Text>
            </View>
            <Text numberOfLines={1} style={{
              color: active ? '#F9FAFB' : 'rgba(255,255,255,0.5)',
              fontSize: 10, marginTop: 4, fontWeight: '600',
            }}>{n.label}</Text>
          </TouchableOpacity>
        );
      })}
      {/* Center label */}
      <View style={{
        position: 'absolute', left: 0, right: 0, top: cy - 14,
        alignItems: 'center',
      }} pointerEvents="none">
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>{centerLabel}</Text>
        {centerSub && <Text style={{ color: '#C4B5FD', fontSize: 10, marginTop: 2 }}>{centerSub}</Text>}
      </View>
    </View>
  );
}

// ------------------------- TypingText -------------------------
export function TypingText({
  text, style, speedMs = 24, testID,
}: { text: string; style?: StyleProp<TextStyle>; speedMs?: number; testID?: string }) {
  const [shown, setShown] = React.useState('');
  React.useEffect(() => {
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text]);
  return <Text testID={testID} style={style}>{shown}</Text>;
}

// ------------------------- LayeredBg (gradient + noise) -------------------------
export function GradientBg({ colors: c }: { colors: readonly [string, string, ...string[]] }) {
  return <LinearGradient colors={c} style={StyleSheet.absoluteFill} />;
}
