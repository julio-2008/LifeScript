// Level-up celebration screen.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { ScreenBg, ConfettiBurst, PrimaryButton, PulsingOrb } from '../src/ui';
import { colors } from '../src/theme';
import { LEVELS } from '../src/levels';

export default function LevelUp() {
  const { level } = useLocalSearchParams<{ level?: string }>();
  const router = useRouter();
  const [show, setShow] = useState(false);

  const levelObj = LEVELS.find((l) => l.id === Number(level)) || LEVELS[1];

  const scale = useSharedValue(0.4);
  const rotate = useSharedValue(0);

  useEffect(() => {
    setShow(true);
    scale.value = withSpring(1, { damping: 8 });
    rotate.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, []);

  const a = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <ScreenBg>
      <ConfettiBurst visible={show} />
      <View style={styles.root}>
        <Text style={styles.kicker}>LEVEL UP</Text>
        <Text style={styles.title}>Você agora é</Text>

        <Animated.View style={[styles.iconCircle, { borderColor: levelObj.color, backgroundColor: `${levelObj.color}22` }, a]}>
          <Ionicons name={levelObj.icon as any} size={70} color={levelObj.color} />
        </Animated.View>

        <Text style={[styles.name, { color: levelObj.color }]}>{levelObj.name}</Text>
        <Text style={styles.tagline}>{levelObj.tagline}</Text>

        <View style={{ marginTop: 36, width: '100%' }}>
          <PrimaryButton
            label="Compartilhar marco"
            icon="share-social"
            testID="levelup-share-btn"
            onPress={() => router.replace('/share')}
            variant="gold"
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            label="Voltar ao meu mapa"
            icon="planet"
            testID="levelup-continue-btn"
            onPress={() => router.replace('/(tabs)')}
            variant="ghost"
          />
        </View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  kicker: { color: colors.gold, letterSpacing: 4, fontWeight: '800', fontSize: 13 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 6 },
  iconCircle: {
    width: 180, height: 180, borderRadius: 90,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
    marginVertical: 30,
    shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 30,
  },
  name: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: colors.textAccent, fontSize: 16, marginTop: 8, fontStyle: 'italic' },
});
