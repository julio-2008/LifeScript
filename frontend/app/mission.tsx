// Focused mission view with timer + complete flow.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScreenBg, GlassCard, PrimaryButton, ConfettiBurst, CircularProgress } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import { loadState, saveState, todayKey, dayDiff, State } from '../src/state';
import { awardBadge } from '../src/badges';
import { levelForXP, nextLevel } from '../src/levels';

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      const m = s.missions.find((x) => x.id === id) || s.missions[0];
      if (m?.notes) setNotes(m.notes);
    });
  }, [id]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  const mission = state.missions.find((m) => m.id === id) || state.missions[0];
  if (!mission) {
    return (
      <ScreenBg>
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>No mission found.</Text>
        </View>
      </ScreenBg>
    );
  }

  const targetSec = mission.minutes * 60;
  const progress = Math.min(seconds / targetSec, 1);
  const minStr = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secStr = (seconds % 60).toString().padStart(2, '0');

  const completeMission = async () => {
    if (completed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCompleted(true);
    setShowConfetti(true);

    const today = todayKey();
    let newXp = state.xp + 50;
    let newStreak = state.streak;
    let badges = [...state.badges];

    // Streak update.
    if (state.lastCompletionDate !== today) {
      const last = state.lastCompletionDate;
      newStreak = !last || dayDiff(last, today) === 1 ? state.streak + 1 : 1;
    }
    if (newStreak === 7) {
      newXp += 200;
      badges = awardBadge(badges, 'unstoppable');
    }
    if (newStreak === 30) badges = awardBadge(badges, 'transformer');
    if (state.totalMissionsDone === 0) badges = awardBadge(badges, 'first_step');
    if (state.totalMissionsDone + 1 === 100) badges = awardBadge(badges, 'century');
    const hour = new Date().getHours();
    if (hour < 9) badges = awardBadge(badges, 'early_bird');
    if (hour >= 22) badges = awardBadge(badges, 'night_owl');
    // Area badges
    const sameAreaCount =
      state.missions.filter((m) => m.completed && m.area === mission.area).length + 1;
    if (sameAreaCount === 10) {
      const map: Record<string, string> = {
        Mind: 'mind_master',
        Finances: 'wealth_builder',
        Health: 'iron_body',
        Relationships: 'social_arc',
        Skills: 'craftsman',
        Career: 'climber',
      };
      const bid = map[mission.area];
      if (bid) badges = awardBadge(badges, bid);
    }
    // Level badges
    const oldLevel = levelForXP(state.xp);
    const newLevel = levelForXP(newXp);
    const leveledUp = newLevel.id > oldLevel.id;
    if (leveledUp) {
      const lvlMap: Record<number, string> = {
        2: 'level_2', 3: 'level_3', 4: 'level_4', 5: 'level_5', 6: 'level_6',
      };
      const bid = lvlMap[newLevel.id];
      if (bid) badges = awardBadge(badges, bid);
    }

    // Update missions list.
    const missions = state.missions.map((m) =>
      m.id === mission.id ? { ...m, completed: true, notes } : m,
    );

    // Bump life area.
    const areaVal = Math.min(1, (state.areas[mission.area] ?? 0) + 0.05);
    const areas = { ...state.areas, [mission.area]: areaVal };

    // Weekly quest.
    let wq = state.weeklyQuest;
    if (wq) {
      const idx = state.missions.findIndex((m) => m.id === mission.id);
      if (idx >= 0 && idx < 7) {
        const progressArr = [...wq.progress];
        progressArr[idx] = true;
        wq = { ...wq, progress: progressArr };
      }
    }

    const updated: State = {
      ...state,
      xp: newXp,
      streak: newStreak,
      lastCompletionDate: today,
      totalMissionsDone: state.totalMissionsDone + 1,
      missions,
      areas,
      weeklyQuest: wq,
      badges,
    };
    await saveState(updated);
    setState(updated);

    if (leveledUp) {
      setTimeout(() => {
        router.replace({ pathname: '/levelup', params: { level: newLevel.id.toString() } });
      }, 2200);
    } else {
      setTimeout(() => router.replace('/(tabs)'), 2200);
    }
  };

  const skipTimer = () => {
    setSeconds(targetSec);
    setRunning(false);
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="mission-back-btn">
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerArea}>{mission.area.toUpperCase()}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <CircularProgress
              progress={progress}
              size={220}
              stroke={10}
              color={areaColors[mission.area] || colors.primary}
            >
              <Ionicons
                name={mission.icon as any}
                size={36}
                color={areaColors[mission.area] || colors.primary}
              />
              <Text style={styles.timer} testID="mission-timer">
                {minStr}:{secStr}
              </Text>
              <Text style={styles.timerSub}>
                of {mission.minutes} min
              </Text>
            </CircularProgress>
          </View>

          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.desc}>{mission.description}</Text>

          <GlassCard style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="create-outline" size={18} color={colors.textAccent} />
              <Text style={styles.notesLabel}>  Your reflection</Text>
            </View>
            <TextInput
              testID="mission-notes-input"
              value={notes}
              onChangeText={setNotes}
              placeholder="Write what you learned, felt, or noticed…"
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
                onPress={skipTimer}
                variant="ghost"
              />
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              label={completed ? 'Completed!' : 'Complete mission · +50 XP'}
              icon={completed ? 'checkmark-circle' : 'sparkles'}
              testID="mission-complete-btn"
              onPress={completeMission}
              variant="gold"
              disabled={completed}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfettiBurst visible={showConfetti} />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 6,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerArea: { color: colors.textAccent, fontSize: 12, letterSpacing: 1.6, fontWeight: '700' },

  timer: { color: colors.text, fontSize: 36, fontWeight: '800', marginTop: 4 },
  timerSub: { color: colors.textDim, fontSize: 12 },

  title: {
    color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5,
    marginTop: 28, textAlign: 'center',
  },
  desc: { color: colors.textDim, fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },

  notesLabel: { color: colors.textAccent, fontSize: 13, fontWeight: '600' },
  notes: {
    color: colors.text, fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { color: colors.textDim },
});
