// Chapter cliffhanger screen — the core of the cliffhanger monetization system.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenBg, PrimaryButton, PulsingOrb, TypingText, GlassCard } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State, dayIndexSinceJoin, addTimeline } from '../src/state';
import { api } from '../src/api';
import { awardBadge } from '../src/badges';

type Copy = { headline: string; body: string; cliffhanger: string };

export default function Chapter() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chapter?: string }>();
  const [state, setState] = useState<State | null>(null);
  const [copy, setCopy] = useState<Copy | null>(null);
  const [pattern, setPattern] = useState<{ title: string; insight: string } | null>(null);
  const [countdown, setCountdown] = useState('24:00:00');

  useEffect(() => {
    loadState().then(async (s) => {
      setState(s);
      const chapterParam = params.chapter ? Number(params.chapter) : undefined;
      const chapter = chapterParam ?? Math.min(4, dayIndexSinceJoin(s));
      if (!s.profile) return;

      try {
        const msg = await api.chapterMessage(s.profile, chapter);
        setCopy(msg);
      } catch {
        setCopy({
          headline: `Chapter ${chapter} Complete`,
          body: 'Tomorrow, your next challenge begins.',
          cliffhanger: 'The one that changes everything.',
        });
      }

      // Chapter 3 — reveal the hidden pattern.
      if (chapter === 3 && !s.hiddenPattern) {
        try {
          const p = await api.hiddenPattern(s.profile);
          const next = addTimeline({
            ...s,
            hiddenPattern: { ...p, revealedAt: new Date().toISOString() },
            badges: awardBadge(s.badges, 'hidden_pattern'),
            chaptersUnlocked: Array.from(new Set([...s.chaptersUnlocked, 3, 4])),
          }, { kind: 'pattern', label: `Pattern revealed: ${p.title}` });
          await saveState(next); setState(next);
          setPattern(p);
        } catch {}
      } else if (chapter === 3 && s.hiddenPattern) {
        setPattern({ title: s.hiddenPattern.title, insight: s.hiddenPattern.insight });
      }

      // Award chapter badges + advance chapter
      const badges = [...s.badges];
      const chaptersUnlocked = Array.from(new Set([...s.chaptersUnlocked, chapter, chapter + 1]));
      if (chapter === 1) awardBadge(badges, 'chapter_1');
      if (chapter === 2) awardBadge(badges, 'chapter_2');
      if (chapter === 3) awardBadge(badges, 'chapter_3');
      const next = addTimeline({
        ...s,
        currentChapter: Math.max(s.currentChapter, chapter),
        chaptersUnlocked,
        badges: chapter === 1 ? awardBadge(badges, 'chapter_1')
              : chapter === 2 ? awardBadge(badges, 'chapter_2')
              : chapter === 3 ? awardBadge(badges, 'chapter_3') : badges,
      }, { kind: 'chapter', label: `Chapter ${chapter} complete` });
      await saveState(next); setState(next);
    });
  }, []);

  // Countdown to tomorrow (24:00:00 mask)
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      const ms = end.getTime() - n.getTime();
      const hh = Math.floor(ms / 3600000);
      const mm = Math.floor((ms % 3600000) / 60000);
      const ss = Math.floor((ms % 60000) / 1000);
      setCountdown(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const chapter = params.chapter ? Number(params.chapter) : Math.min(4, dayIndexSinceJoin(state));
  const isGate = chapter >= 3 && !state.pro;

  const doShare = async () => {
    const msg = copy
      ? `${copy.headline} — my LifeScript is taking shape. ${copy.cliffhanger} — lifescript.app`
      : `Chapter ${chapter} of my LifeScript — lifescript.app`;
    try { await Share.share({ message: msg }); } catch {}
  };

  return (
    <ScreenBg gradient={['#05050F', '#1A0B3D', '#08060E'] as const}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn} testID="chapter-back-btn">
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.root}>
        <Text style={styles.kicker}>CHAPTER {chapter}</Text>
        <Text style={styles.headline}>{copy?.headline || 'Chapter complete.'}</Text>

        {chapter === 3 && pattern ? (
          <GlassCard style={{ marginTop: 16 }} tint="rgba(245,158,11,0.08)">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="eye" size={18} color={colors.gold} />
              <Text style={[styles.patternTitle, { marginLeft: 8 }]}>{pattern.title}</Text>
            </View>
            <TypingText text={pattern.insight} style={styles.patternInsight} speedMs={22} />
          </GlassCard>
        ) : (
          <View style={{ marginTop: 16 }}>
            <TypingText text={copy?.body || 'Your story is just beginning.'} style={styles.body} speedMs={24} />
          </View>
        )}

        <View style={{ marginTop: 22 }}>
          <PulsingOrb size={160} />
        </View>

        <Text style={styles.cliff}>{copy?.cliffhanger || ''}</Text>

        {chapter < 3 ? (
          <>
            <View style={styles.countdownRow}>
              <Ionicons name="timer" size={16} color={colors.gold} />
              <Text style={styles.countdownTxt}>  Next chapter unlocks in {countdown}</Text>
            </View>
            <View style={{ marginTop: 18, alignSelf: 'stretch' }}>
              <PrimaryButton label="Share my progress" icon="share-social" testID="chapter-share-btn" onPress={doShare} variant="ghost" />
              <View style={{ height: 10 }} />
              <PrimaryButton label="Back to my map" icon="planet" testID="chapter-continue-btn" onPress={() => router.replace('/(tabs)')} variant="gold" />
            </View>
          </>
        ) : (
          <View style={{ marginTop: 18, alignSelf: 'stretch' }}>
            {isGate ? (
              <>
                <Text style={styles.gateLine}>Chapter 4 is where your real LifeScript begins.</Text>
                <PrimaryButton label="Continue my story" icon="diamond" testID="chapter-upgrade-btn" onPress={() => router.push('/upgrade')} variant="gold" />
                <View style={{ height: 8 }} />
                <PrimaryButton label="Not yet — back to map" icon="arrow-back" testID="chapter-back-map-btn" onPress={() => router.replace('/(tabs)')} variant="ghost" />
              </>
            ) : (
              <PrimaryButton label="Write Chapter 4" icon="sparkles" testID="chapter-continue-btn" onPress={() => router.replace('/(tabs)')} variant="gold" />
            )}
          </View>
        )}
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  root: { flex: 1, paddingHorizontal: 28, paddingBottom: 40, alignItems: 'center' },
  kicker: { color: colors.gold, letterSpacing: 4, fontWeight: '800', fontSize: 13 },
  headline: { color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1.2, textAlign: 'center', marginTop: 10, lineHeight: 44 },
  body: { color: colors.textAccent, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  cliff: { color: colors.text, fontSize: 18, fontStyle: 'italic', textAlign: 'center', marginTop: 20, lineHeight: 26 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' },
  countdownTxt: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  gateLine: { color: colors.textAccent, fontSize: 15, textAlign: 'center', marginBottom: 14, lineHeight: 22 },
  patternTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  patternInsight: { color: colors.text, fontSize: 15, lineHeight: 23, marginTop: 10 },
});
