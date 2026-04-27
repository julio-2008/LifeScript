// Reusable components for LifeScript.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence, Easing, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from './theme';

// ---------- GlassCard ----------
export function GlassCard({ children, style, intensity = 30 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; intensity?: number; }) {
  return (
    <View style={[gcStyles.wrapper, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={gcStyles.tint} />
      <View style={gcStyles.content}>{children}</View>
    </View>
  );
}
const gcStyles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.glass,
  },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(124,58,237,0.05)' },
  content: { padding: 16 },
});

// ---------- PrimaryButton ----------
export function PrimaryButton({
  label,
  onPress,
  icon,
  testID,
  style,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: 'primary' | 'gold' | 'ghost';
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const colorsArr =
    variant === 'gold'
      ? (['#F59E0B', '#B45309'] as const)
      : variant === 'ghost'
        ? (['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as const)
        : (['#7C3AED', '#5B21B6'] as const);
  return (
    <Animated.View style={[animStyle, style]}>
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.85}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={onPress}
        disabled={disabled}
      >
        <LinearGradient
          colors={colorsArr}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[btnStyles.btn, disabled && { opacity: 0.5 }]}
        >
          {icon && <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={btnStyles.txt}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
const btnStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radii.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  txt: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});

// ---------- CircularProgress ring ----------
export function CircularProgress({
  progress,
  size = 84,
  stroke = 6,
  color,
  bg = 'rgba(255,255,255,0.08)',
  children,
}: {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  color: string;
  bg?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={stroke} fill="transparent" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

// ---------- Starfield ----------
export function Starfield({ density = 60 }: { density?: number }) {
  const stars = React.useMemo(
    () =>
      Array.from({ length: density }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.2,
        delay: Math.random() * 2000,
      })),
    [density],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {stars.map((s, i) => (
        <Twinkle key={i} top={s.top} left={s.left} size={s.size} opacity={s.opacity} delay={s.delay} />
      ))}
    </View>
  );
}
function Twinkle({ top, left, size, opacity, delay }: { top: number; left: number; size: number; opacity: number; delay: number; }) {
  const o = useSharedValue(opacity * 0.4);
  React.useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(opacity, { duration: 1500 + delay }),
        withTiming(opacity * 0.3, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: `${top}%`,
          left: `${left}%`,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: '#fff',
        },
        animStyle,
      ]}
    />
  );
}

// ---------- Pulsing Orb (for generating screen) ----------
export function PulsingOrb({ size = 180 }: { size?: number }) {
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
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size,
            backgroundColor: 'rgba(124,58,237,0.18)',
          },
          aOuter,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size,
            backgroundColor: 'rgba(124,58,237,0.35)',
          },
          aMid,
        ]}
      />
      <LinearGradient
        colors={['#C4B5FD', '#7C3AED', '#3B0764']}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.8, y: 0.8 }}
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: size,
          shadowColor: colors.primary,
          shadowOpacity: 0.9,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

// ---------- ConfettiBurst (lightweight particles) ----------
export function ConfettiBurst({ visible }: { visible: boolean }) {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 32 }).map(() => ({
        x: Math.random() * 360 - 180,
        y: Math.random() * 600 + 50,
        rot: Math.random() * 360,
        delay: Math.random() * 300,
        color: ['#7C3AED', '#F59E0B', '#10B981', '#EC4899', '#3B82F6'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 6,
      })),
    [],
  );
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}
function Particle({ x, y, rot, delay, color, size }: { x: number; y: number; rot: number; delay: number; color: string; size: number; }) {
  const ty = useSharedValue(-30);
  const op = useSharedValue(1);
  const r = useSharedValue(0);
  React.useEffect(() => {
    ty.value = withTiming(y, { duration: 2200 + delay, easing: Easing.out(Easing.cubic) });
    op.value = withTiming(0, { duration: 2200 + delay });
    r.value = withTiming(rot, { duration: 2000 + delay });
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: x }, { rotate: `${r.value}deg` }],
    opacity: op.value,
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 100,
          left: '50%',
          width: size,
          height: size * 1.4,
          borderRadius: 2,
          backgroundColor: color,
        },
        aStyle,
      ]}
    />
  );
}

// ---------- Section title ----------
export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[secStyles.title, style]}>{children}</Text>;
}
const secStyles = StyleSheet.create({
  title: {
    fontSize: 13,
    color: colors.textDim,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});

// ---------- ScreenContainer ----------
export function ScreenBg({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={['#0A0A1A', '#13102B', '#0A0A1A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Starfield density={50} />
      {children}
    </View>
  );
}
