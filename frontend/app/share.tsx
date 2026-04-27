// Share Your Map — Spotify Wrapped style branded card + native share.
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { ScreenBg, PrimaryButton, Starfield, CircularProgress } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import { loadState, saveState, lifeScore, State } from '../src/state';
import { LEVELS, levelForXP } from '../src/levels';
import { awardBadge } from '../src/badges';

const { width } = Dimensions.get('window');
const CARD_W = width - 48;

export default function ShareScreen() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const cardRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      loadState().then(setState);
    }, []),
  );

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const level = levelForXP(state.xp);
  const score = lifeScore(state);
  const phrase = pickPhrase(state.streak, level.id);

  const doShare = async () => {
    try {
      let updated = state;
      if (!state.hasShared) {
        const next = {
          ...state,
          xp: state.xp + 100,
          hasShared: true,
          badges: awardBadge(state.badges, 'sharer'),
        };
        await saveState(next);
        setState(next);
        updated = next;
      }
      const message = `I'm on Day ${state.streak || state.totalMissionsDone || 1} of my LifeScript. Level ${level.id} — ${level.name}. Life Score ${score}/1000. What's yours saying? https://lifescript.app/?ref=${state.referralCode}`;

      if (Platform.OS === 'web') {
        await Share.share({ message });
        return;
      }

      try {
        const uri = await captureRef(cardRef.current!, { format: 'png', quality: 0.9 });
        const can = await Sharing.isAvailableAsync();
        if (can) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share my LifeScript' });
        } else {
          await Share.share({ message });
        }
      } catch {
        await Share.share({ message });
      }
    } catch (e: any) {
      Alert.alert('Could not share', e?.message ?? 'Try again.');
    }
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="share-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share your map</Text>
          <View style={{ width: 40 }} />
        </View>

        <View ref={cardRef} collapsable={false} style={[styles.card, { width: CARD_W }]} testID="share-card">
          <LinearGradient
            colors={['#1A0B3D', '#3B0764', '#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Starfield density={70} />

          <View style={styles.cardInner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="planet" size={18} color="#FFD700" />
              <Text style={styles.brand}>  LIFESCRIPT</Text>
            </View>

            <Text style={styles.cardName}>{state.profile.name}</Text>
            <Text style={styles.cardLevel}>{level.name} · Level {level.id}</Text>

            <View style={styles.scoreBlock}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreLabel}>LIFE SCORE</Text>
            </View>

            <View style={styles.areasRow}>
              {Object.entries(state.areas).map(([area, val]) => (
                <View key={area} style={styles.areaBlock}>
                  <CircularProgress
                    progress={val}
                    size={48}
                    stroke={4}
                    color={areaColors[area]}
                    bg="rgba(255,255,255,0.15)"
                  >
                    <Text style={styles.areaPct}>{Math.round(val * 100)}</Text>
                  </CircularProgress>
                  <Text style={styles.areaName}>{area.slice(0, 4)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statRow}>
              <View style={styles.statBlock}>
                <Ionicons name="flame" size={20} color="#FFD700" />
                <Text style={styles.statVal}>{state.streak} day streak</Text>
              </View>
              <View style={styles.statBlock}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.statVal}>{state.badges.length} badges</Text>
              </View>
            </View>

            <Text style={styles.phrase}>{phrase}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>lifescript.app</Text>
              <Text style={styles.footerCode}>@{state.profile.name.toLowerCase().replace(/\s/g, '')}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <PrimaryButton label="Share" icon="share-social" testID="share-btn" onPress={doShare} variant="gold" />
        </View>
        <Text style={styles.tip}>
          {state.hasShared ? 'You earned the Evangelist badge!' : 'First share unlocks +100 XP and a badge.'}
        </Text>
      </ScrollView>
    </ScreenBg>
  );
}

function pickPhrase(streak: number, levelId: number): string {
  if (streak >= 30) return 'I show up for myself every single day.';
  if (streak >= 7) return 'Momentum is my superpower.';
  if (levelId >= 4) return 'Building the life I once only imagined.';
  if (levelId >= 2) return 'The path is becoming clear.';
  return 'Day one of my new chapter.';
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },

  card: {
    aspectRatio: 9 / 16,
    borderRadius: 28,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  cardInner: { flex: 1, padding: 26, justifyContent: 'space-between' },
  brand: {
    color: '#FFD700', letterSpacing: 4, fontSize: 12, fontWeight: '800',
  },
  cardName: {
    color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 14,
  },
  cardLevel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2, fontWeight: '600' },

  scoreBlock: { alignItems: 'flex-start', marginTop: 8 },
  scoreNumber: { color: '#FFD700', fontSize: 84, fontWeight: '800', letterSpacing: -3, lineHeight: 90 },
  scoreLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, letterSpacing: 2, fontWeight: '700' },

  areasRow: { flexDirection: 'row', justifyContent: 'space-between' },
  areaBlock: { alignItems: 'center', flex: 1 },
  areaPct: { color: '#fff', fontSize: 11, fontWeight: '800' },
  areaName: { color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 4, letterSpacing: 1 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBlock: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99,
  },
  statVal: { color: '#fff', marginLeft: 6, fontSize: 12, fontWeight: '600' },

  phrase: { color: '#fff', fontSize: 18, fontStyle: 'italic', lineHeight: 24, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1.5 },
  footerCode: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

  tip: { color: colors.textDim, textAlign: 'center', marginTop: 14, fontSize: 12 },
});
