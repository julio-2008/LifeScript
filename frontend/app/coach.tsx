// AI Coach chat screen.
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, todayKey, State } from '../src/state';
import { coachChat } from '../src/api';
import { levelForXP } from '../src/levels';

const FREE_DAILY_LIMIT = 3;

export default function CoachScreen() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      // Reset daily count if it's a new day (stored separately is ok — for demo we'll trust history).
    });
  }, []);

  const scrollEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const todayMission = state.missions.find((m) => m.date === todayKey() && !m.completed);
  const dailyUserMessages = state.coachHistory.filter((m) => m.role === 'user').length;
  const limited = !state.pro && dailyUserMessages >= FREE_DAILY_LIMIT;

  const send = async () => {
    if (!input.trim() || sending || !state.profile) return;
    if (limited) {
      router.push('/upgrade');
      return;
    }
    const userMsg = { role: 'user' as const, content: input.trim() };
    const newHistory = [...state.coachHistory, userMsg];
    const updated = { ...state, coachHistory: newHistory };
    setState(updated);
    setInput('');
    setSending(true);
    scrollEnd();
    try {
      const level = levelForXP(state.xp);
      const res = await coachChat({
        profile: state.profile,
        level: level.name,
        streak: state.streak,
        total_xp: state.xp,
        today_mission: todayMission?.title,
        history: newHistory,
        message: userMsg.content,
        session_id: state.coachSession,
      });
      const reply = { role: 'assistant' as const, content: res.reply };
      // Cap coach history to the last 50 messages to keep AsyncStorage small.
      const merged = [...newHistory, reply];
      const next = {
        ...updated,
        coachHistory: merged.length > 50 ? merged.slice(-50) : merged,
        coachSession: res.session_id,
      };
      await saveState(next);
      setState(next);
      scrollEnd();
    } catch (e: any) {
      const reply = {
        role: 'assistant' as const,
        content: 'I lost my signal for a second. Try once more — I am here.',
      };
      const next = { ...updated, coachHistory: [...newHistory, reply] };
      await saveState(next);
      setState(next);
    } finally {
      setSending(false);
    }
  };

  const quick = async (text: string) => {
    setInput(text);
    setTimeout(send, 100);
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="coach-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>LifeScript Coach</Text>
            <Text style={styles.headerSub}>
              {state.pro ? 'Pro · unlimited' : `Free · ${Math.max(0, FREE_DAILY_LIMIT - dailyUserMessages)} left today`}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatPad}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollEnd()}
        >
          {state.coachHistory.length === 0 && (
            <View style={styles.intro}>
              <View style={styles.coachOrb}>
                <Ionicons name="sparkles" size={28} color="#fff" />
              </View>
              <Text style={styles.introTitle}>I know your story.</Text>
              <Text style={styles.introSub}>
                Ask anything — about your dream, today's mission, or what's getting in your way.
              </Text>
              <View style={styles.quickWrap}>
                {[
                  'Why does today\'s mission matter?',
                  'Give me emergency motivation.',
                  'I am exhausted.',
                ].map((q) => (
                  <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => quick(q)} testID={`coach-quick-${q}`}>
                    <Text style={styles.quickTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {state.coachHistory.map((m, i) => (
            <View
              key={i}
              style={[styles.bubbleRow, m.role === 'user' ? styles.userRow : styles.aiRow]}
            >
              {m.role === 'assistant' && (
                <View style={styles.avatar}>
                  <Ionicons name="sparkles" size={14} color="#fff" />
                </View>
              )}
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={[styles.bubbleTxt, m.role === 'user' && { color: '#fff' }]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {sending && (
            <View style={styles.aiRow}>
              <View style={styles.avatar}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.bubbleAi, { paddingVertical: 16 }]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            </View>
          )}

          {limited && (
            <GlassCard style={{ marginTop: 14 }}>
              <Text style={styles.limitTitle}>You hit today's free limit</Text>
              <Text style={styles.limitSub}>Upgrade to Pro for unlimited coaching.</Text>
              <View style={{ marginTop: 10 }}>
                <PrimaryButton label="See Pro" icon="diamond" testID="coach-upgrade-btn" onPress={() => router.push('/upgrade')} />
              </View>
            </GlassCard>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={limited ? 'Upgrade to keep talking…' : 'Ask your coach…'}
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
            editable={!limited && !sending}
            testID="coach-input"
          />
          <TouchableOpacity
            onPress={send}
            disabled={sending || !input.trim() || limited}
            style={[styles.sendBtn, (!input.trim() || sending || limited) && { opacity: 0.4 }]}
            testID="coach-send-btn"
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 16,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  headerSub: { color: colors.textDim, fontSize: 11, marginTop: 2 },

  chatPad: { padding: 16, paddingBottom: 32 },

  intro: { alignItems: 'center', marginTop: 30, paddingHorizontal: 24 },
  coachOrb: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 16,
  },
  introTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 14 },
  introSub: { color: colors.textDim, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  quickWrap: { marginTop: 20, gap: 10, alignSelf: 'stretch' },
  quickBtn: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1, borderColor: colors.borderActive,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14,
  },
  quickTxt: { color: colors.text, fontSize: 14 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 6 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  bubble: {
    maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
  },
  bubbleAi: {
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTxt: { color: colors.text, fontSize: 15, lineHeight: 21 },

  inputBar: {
    flexDirection: 'row', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: 'rgba(10,10,26,0.92)',
    alignItems: 'flex-end',
    paddingBottom: 28,
  },
  input: {
    flex: 1, color: colors.text,
    backgroundColor: colors.glass, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    maxHeight: 120, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  limitTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  limitSub: { color: colors.textDim, marginTop: 4 },
});
