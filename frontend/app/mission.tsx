// Focused mission view + reflection question + chapter cliffhangers.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, PrimaryButton, ConfettiBurst, CircularProgress, GlassCard, TypingText } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import {
  loadState, saveState, todayKey, dayDiff, dayIndexSinceJoin, addTimeline, State,
} from '../src/state';
import { awardBadge } from '../src/badges';
import { levelForXP } from '../src/levels';
import { inventoryKeyForArea } from '../src/inventory';
import { api } from '../src/api';
import { Sounds } from '../src/sounds';

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reflection flow
  const [reflectionQ, setReflectionQ] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      const m = s.missions.find((x) => x.id === id) || s.missions[0];
      if (m?.notes) setNotes(m.notes);
    });
  }, [id]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  const mission = state.missions.find((m) => m.id === id) || state.missions[0];
  if (!mission) {
    return <ScreenBg><View style={styles.empty}><Text style={styles.emptyTxt}>No mission found.</Text></View></ScreenBg>;
  }

  const targetSec = mission.minutes * 60;
  const progress = Math.min(seconds / targetSec, 1);
  const minStr = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secStr = (seconds % 60).toString().padStart(2, '0');

  const completeMission = async () => {
    if (completed || !state) return;
    Sounds.complete();
    setCompleted(true);
    setShowConfetti(true);

    const today = todayKey();
    let newXp = state.xp + 50;
    let newStreak = state.streak;
    let badges = [...state.badges];
    let traits = [...state.traits];

    // Streak
    if (state.lastCompletionDate !== today) {
      const last = state.lastCompletionDate;
      newStreak = !last || dayDiff(last, today) === 1 ? state.streak + 1 : 1;
    }
    if (newStreak === 7) { newXp += 200; badges = awardBadge(badges, 'unstoppable'); }
    if (newStreak === 30) badges = awardBadge(badges, 'transformer');
    if (state.totalMissionsDone === 0) badges = awardBadge(badges, 'first_step');
    if (state.totalMissionsDone + 1 === 100) badges = awardBadge(badges, 'centurion');
    const hour = new Date().getHours();
    if (hour < 9) badges = awardBadge(badges, 'early_bird');
    if (hour >= 22) badges = awardBadge(badges, 'night_owl');

    // Area traits / trait badges
    const sameArea = state.missionArchive.filter((m) => m.area === mission.area).length + 1;
    if (sameArea === 10) {
      const map: Record<string, string> = {
        Career: 'trait_career', Finances: 'trait_finances', Health: 'trait_health',
        Relationships: 'trait_relationships', Mind: 'trait_mind', Skills: 'trait_skills',
        Purpose: 'trait_purpose', Legacy: 'trait_legacy',
      };
      const b = map[mission.area];
      if (b) badges = awardBadge(badges, b);
      if (!traits.includes(mission.area)) traits.push(mission.area);
    }

    // Level checks
    const oldLevel = levelForXP(state.xp);
    const newLevel = levelForXP(newXp);
    const leveledUp = newLevel.id > oldLevel.id;
    if (leveledUp) {
      const eraBadgeId = `era_${newLevel.era}`;
      badges = awardBadge(badges, eraBadgeId);
    }

    // Inventory
    const invKey = inventoryKeyForArea(mission.area);
    const inventory = { ...state.inventory, [invKey]: (state.inventory[invKey] || 0) + 1 };

    // Area bump
    const areaVal = Math.min(1, (state.areas[mission.area] ?? 0) + 0.05);
    const areas = { ...state.areas, [mission.area]: areaVal };

    // Missions + archive
    const missions = state.missions.map((m) => m.id === mission.id ? { ...m, completed: true, notes } : m);
    const archived = { ...mission, completed: true, notes, completedAt: new Date().toISOString() };
    const missionArchive = [...state.missionArchive, archived];

    // Weekly quest tick
    let wq = state.weeklyQuest;
    if (wq) {
      const idx = state.missions.findIndex((m) => m.id === mission.id);
      if (idx >= 0 && idx < 7) {
        const p = [...wq.progress]; p[idx] = true;
        wq = { ...wq, progress: p };
      }
    }

    // Chapter advance
    const dayIdx = dayIndexSinceJoin(state);
    const newChapter = Math.min(4, Math.max(state.currentChapter, dayIdx));
    let chaptersUnlocked = state.chaptersUnlocked.slice();
    for (let i = 1; i <= newChapter; i++) if (!chaptersUnlocked.includes(i)) chaptersUnlocked.push(i);

    let updated: State = addTimeline({
      ...state,
      xp: newXp,
      streak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastCompletionDate: today,
      totalMissionsDone: state.totalMissionsDone + 1,
      missions,
      missionArchive,
      areas,
      weeklyQuest: wq,
      badges,
      traits,
      inventory,
      currentChapter: newChapter,
      chaptersUnlocked,
    }, { kind: 'mission', label: `Completed: ${mission.title}` });

    await saveState(updated);
    setState(updated);

    // Fetch reflection question (non-blocking for UX).
    if (state.profile) {
      try {
        const { question } = await api.reflectionQuestion(state.profile, mission.title, mission.area);
        setReflectionQ(question);
      } catch {
        setReflectionQ('What did completing this teach you?');
      }
    }

    // If leveled up — route after reflection submit will handle.
    if (leveledUp) Sounds.levelUp();
  };

  const submitReflection = async () => {
    if (!state) return;
    setSaving(true);
    const updated = {
      ...state,
      missionArchive: state.missionArchive.map((m, i) =>
        i === state.missionArchive.length - 1 ? { ...m, reflection, reflectionQ: reflectionQ ?? '' } : m,
      ),
    };
    // Reflection badge
    const reflectionsCount = updated.missionArchive.filter((m) => (m.reflection || '').trim().length > 0).length;
    if (reflectionsCount >= 10 && !updated.badges.includes('reflector')) {
      updated.badges = awardBadge(updated.badges, 'reflector');
    }
    await saveState(updated);
    setSaving(false);

    // Chapter cliffhanger: if a chapter just completed (day 1/2/3) → route to chapter screen.
    const dayIdx = dayIndexSinceJoin(state);
    if (dayIdx <= 3 && !state.chaptersUnlocked.includes(dayIdx + 1)) {
      router.replace({ pathname: '/chapter', params: { chapter: dayIdx.toString() } });
      return;
    }

    // If leveled up → level-up screen.
    const oldLevel = levelForXP(state.xp);
    const newLevel = levelForXP(updated.xp);
    if (newLevel.id > oldLevel.id) {
      router.replace({ pathname: '/levelup', params: { level: newLevel.id.toString() } });
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="mission-back-btn">
            <Ionicons name={reflectionQ ? 'close' : 'chevron-back'} size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerArea}>{mission.area.toUpperCase()}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          {!reflectionQ ? (
            <>
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <CircularProgress
                  progress={progress}
                  size={220}
                  stroke={10}
                  color={areaColors[mission.area] || colors.primary}
                >
                  <Ionicons name={mission.icon as any} size={36} color={areaColors[mission.area] || colors.primary} />
                  <Text style={styles.timer} testID="mission-timer">{minStr}:{secStr}</Text>
                  <Text style={styles.timerSub}>of {mission.minutes} min</Text>
                </CircularProgress>
              </View>

              <Text style={styles.title}>{mission.title}</Text>
              <Text style={styles.desc}>{mission.description}</Text>

              <GlassCard style={{ marginTop: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="create-outline" size={18} color={colors.textAccent} />
                  <Text style={styles.notesLabel}>  Notes</Text>
                </View>
                <TextInput
                  testID="mission-notes-input"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Jot anything useful during this mission…"
                  placeholderTextColor={colors.textDim}
                  style={styles.notes}
                  multiline
                />
              </GlassCard>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label={running ? 'Pause' : 'Start timer'}
                    icon={running ? 'pause' : 'play'}
                    testID="mission-timer-btn"
                    onPress={() => setRunning(!running)}
                    variant="ghost"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Skip"
                    icon="play-skip-forward"
                    testID="mission-skip-btn"
                    onPress={() => { setSeconds(targetSec); setRunning(false); }}
                    variant="ghost"
                  />
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  label={completed ? 'Reflecting…' : 'Complete mission · +50 XP'}
                  icon={completed ? 'checkmark-circle' : 'sparkles'}
                  testID="mission-complete-btn"
                  onPress={completeMission}
                  variant="gold"
                  disabled={completed}
                />
              </View>
            </>
          ) : (
            <View style={{ marginTop: 36 }}>
              <Text style={styles.kicker}>REFLECTION</Text>
              <TypingText text={reflectionQ} style={styles.reflectionQ} speedMs={26} />
              <TextInput
                testID="mission-reflection-input"
                value={reflection}
                onChangeText={setReflection}
                placeholder="In one sentence…"
                placeholderTextColor={colors.textDim}
                style={styles.reflectionInput}
                multiline
                autoFocus
              />
              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  label={saving ? 'Saving…' : 'Save reflection · Continue'}
                  icon="arrow-forward"
                  testID="mission-reflection-submit-btn"
                  onPress={submitReflection}
                  variant="gold"
                  disabled={saving}
                />
              </View>
              <TouchableOpacity onPress={submitReflection} style={{ alignItems: 'center', marginTop: 12 }} testID="mission-reflection-skip">
                <Text style={{ color: colors.textDim, fontSize: 12 }}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfettiBurst visible={showConfetti} />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerArea: { color: colors.textAccent, fontSize: 12, letterSpacing: 1.6, fontWeight: '700' },
  timer: { color: colors.text, fontSize: 36, fontWeight: '800', marginTop: 4 },
  timerSub: { color: colors.textDim, fontSize: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 28, textAlign: 'center' },
  desc: { color: colors.textDim, fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  notesLabel: { color: colors.textAccent, fontSize: 13, fontWeight: '600' },
  notes: { color: colors.text, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { color: colors.textDim },
  kicker: { color: colors.textAccent, letterSpacing: 2.5, fontSize: 12, fontWeight: '800' },
  reflectionQ: { color: colors.text, fontSize: 26, fontWeight: '800', lineHeight: 32, marginTop: 10, letterSpacing: -0.5 },
  reflectionInput: {
    marginTop: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 18, padding: 18, color: colors.text,
    fontSize: 16, minHeight: 140, textAlignVertical: 'top',
  },
});
