// Axiom — LifeScript's AI coach with 5 modes and memory.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, PrimaryButton, TypingText } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, todayKey, State, AxiomMode } from '../src/state';
import { api } from '../src/api';
import { levelForXP } from '../src/levels';
import { Sounds } from '../src/sounds';

const FREE_DAILY_LIMIT = 3;

const MODES: { key: AxiomMode; name: string; icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }[] = [
  { key: 'hard',        name: 'Duro',        icon: 'flash',         color: '#F43F5E', desc: 'Honestidade brutal.' },
  { key: 'support',     name: 'Apoio',       icon: 'heart',         color: '#EC4899', desc: 'Caloroso e direto.' },
  { key: 'strategist',  name: 'Estrategista', icon: 'analytics',    color: '#3B82F6', desc: 'Só tática.' },
  { key: 'philosopher', name: 'Filósofo',    icon: 'planet',        color: '#A78BFA', desc: 'Perguntas profundas.' },
  { key: 'silent',      name: 'Silêncio',    icon: 'volume-mute',   color: '#9CA3AF', desc: 'Poucas palavras.' },
];

export default function Coach() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { loadState().then(setState); }, []);

  const scrollEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const todayMission = state.missions.find((m) => m.date === todayKey() && !m.completed);
  const dailyUserMessages = state.coachHistory.filter((m) => m.role === 'user').length;
  const limited = !state.pro && dailyUserMessages >= FREE_DAILY_LIMIT;
  const mode = state.axiomMode;

  const setMode = async (m: AxiomMode) => {
    const next = { ...state, axiomMode: m };
    await saveState(next); setState(next);
  };

  const send = async (forcedText?: string) => {
    const text = (forcedText ?? input).trim();
    if (!text || sending || !state.profile) return;
    if (limited) { router.push('/upgrade'); return; }

    const userMsg = { role: 'user' as const, content: text };
    const newHist = [...state.coachHistory, userMsg];
    const updated = { ...state, coachHistory: newHist };
    setState(updated);
    setInput('');
    setSending(true);
    scrollEnd();

    try {
      const level = levelForXP(state.xp);
      const recentReflections = state.missionArchive.slice(-5).map((m) => m.reflection || '').filter(Boolean);
      const recentMissions = state.missionArchive.slice(-5).map((m) => m.title);
      const res = await api.coachChat({
        profile: state.profile,
        level: level.name,
        streak: state.streak,
        total_xp: state.xp,
        today_mission: todayMission?.title,
        history: newHist,
        message: text,
        session_id: state.coachSession,
        mode,
        recent_reflections: recentReflections,
        recent_missions: recentMissions,
      });
      const reply = { role: 'assistant' as const, content: res.reply };
      const merged = [...newHist, reply];
      const next = { ...updated, coachHistory: merged.slice(-30), coachSession: res.session_id };
      await saveState(next); setState(next);
      scrollEnd();
      if (mode !== 'silent') Sounds.speak(res.reply.replace(/\n/g, ' '));
    } catch {
      const reply = { role: 'assistant' as const, content: 'Perdi meu sinal por um segundo. Tente novamente — estou aqui.' };
      const next = { ...updated, coachHistory: [...newHist, reply] };
      await saveState(next); setState(next);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { Sounds.stopSpeak(); router.back(); }} style={styles.backBtn} testID="coach-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Axiom</Text>
            <Text style={styles.headerSub}>
              {state.pro ? `Pro · ${mode}` : `Grátis · ${Math.max(0, FREE_DAILY_LIMIT - dailyUserMessages)} restantes hoje`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => Sounds.stopSpeak()} style={styles.backBtn} testID="coach-mute">
            <Ionicons name="volume-mute" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Mode selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <TouchableOpacity key={m.key} onPress={() => setMode(m.key)}
                testID={`coach-mode-${m.key}`}
                style={[styles.modeBtn, active && { borderColor: m.color, backgroundColor: `${m.color}22` }]}>
                <Ionicons name={m.icon} size={14} color={active ? m.color : colors.textDim} />
                <Text style={[styles.modeTxt, active && { color: m.color }]}>  {m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatPad} showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollEnd()}>
          {state.coachHistory.length === 0 && (
            <View style={styles.intro}>
              <View style={styles.axiomOrb}>
                <Ionicons name="sparkles" size={28} color="#fff" />
              </View>
              <Text style={styles.introTitle}>Eu conheço a sua história.</Text>
              <Text style={styles.introSub}>Pergunte qualquer coisa. Eu me lembro — missões passadas, reflexões, o que você disse no Dia 1.</Text>
              <View style={styles.quickWrap}>
                {[
                  'Por que a missão de hoje importa?',
                  'Me dê motivação de emergência.',
                  'Estou exausto — descanso ou empurrar?',
                  'O que você notou em mim nesta semana?',
                ].map((q) => (
                  <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => send(q)} testID={`coach-quick-${q}`}>
                    <Text style={styles.quickTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {state.coachHistory.map((m, i) => (
            <View key={i} style={[styles.bubbleRow, m.role === 'user' ? styles.userRow : styles.aiRow]}>
              {m.role === 'assistant' && (
                <View style={styles.avatar}><Ionicons name="sparkles" size={14} color="#fff" /></View>
              )}
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                {m.role === 'assistant' && i === state.coachHistory.length - 1 ? (
                  <TypingText text={m.content} style={[styles.bubbleTxt, { color: colors.text }]} speedMs={18} />
                ) : (
                  <Text style={[styles.bubbleTxt, m.role === 'user' && { color: '#fff' }]}>{m.content}</Text>
                )}
              </View>
            </View>
          ))}

          {sending && (
            <View style={styles.aiRow}>
              <View style={styles.avatar}><Ionicons name="sparkles" size={14} color="#fff" /></View>
              <View style={[styles.bubble, styles.bubbleAi]}><ActivityIndicator color={colors.primaryLight} /></View>
            </View>
          )}

          {limited && (
            <GlassCard style={{ marginTop: 14 }}>
              <Text style={styles.limitTitle}>Você atingiu o limite grátis de hoje</Text>
              <Text style={styles.limitSub}>Faça upgrade para Axiom ilimitado.</Text>
              <View style={{ marginTop: 10 }}>
                <PrimaryButton label="Ver Pro" icon="diamond" testID="coach-upgrade-btn" onPress={() => router.push('/upgrade')} />
              </View>
            </GlassCard>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={limited ? 'Faça upgrade para continuar…' : 'Pergunte ao seu coach…'}
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
            editable={!limited && !sending}
            testID="coach-input"
          />
          <TouchableOpacity onPress={() => send()} disabled={sending || !input.trim() || limited}
            style={[styles.sendBtn, (!input.trim() || sending || limited) && { opacity: 0.4 }]}
            testID="coach-send-btn">
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  headerSub: { color: colors.textDim, fontSize: 11, marginTop: 2 },

  modesRow: { marginTop: 10, flexGrow: 0 },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
  },
  modeTxt: { color: colors.textDim, fontSize: 12, fontWeight: '700' },

  chatPad: { padding: 16, paddingBottom: 32 },
  intro: { alignItems: 'center', marginTop: 20, paddingHorizontal: 24 },
  axiomOrb: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  introTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 14 },
  introSub: { color: colors.textDim, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  quickWrap: { marginTop: 20, gap: 10, alignSelf: 'stretch' },
  quickBtn: { backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: colors.borderActive, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  quickTxt: { color: colors.text, fontSize: 14 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 6 },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleAi: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTxt: { color: colors.text, fontSize: 15, lineHeight: 21 },

  inputBar: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: 'rgba(8,8,24,0.95)', alignItems: 'flex-end', paddingBottom: 28 },
  input: { flex: 1, color: colors.text, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, maxHeight: 120, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  limitTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  limitSub: { color: colors.textDim, marginTop: 4 },
});
