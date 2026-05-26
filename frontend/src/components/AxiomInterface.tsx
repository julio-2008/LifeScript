import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, PrimaryButton, SectionTitle } from '../ui';
import { loadState, saveState, AxiomMode, State } from '../state';

const AXIOM_OPTIONS: { mode: AxiomMode; label: string; tone: string; hint: string }[] = [
  { mode: 'support', label: 'Mentor', tone: 'Acolhedor', hint: 'Entende suas tensões e recomenda clareza.' },
  { mode: 'hard', label: 'Rival', tone: 'Desafiador', hint: 'Questiona sua resistência e corta distrações.' },
  { mode: 'philosopher', label: 'Espelho', tone: 'Reflexivo', hint: 'Reflete seu padrão e devolve significado.' },
  { mode: 'silent', label: 'Estranho', tone: 'Analítico', hint: 'Observa com distância e revela lógica oculta.' },
];

export default function AxiomInterface() {
  const [state, setState] = useState<State | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const selectedMode = state?.axiomMode ?? 'support';
  const modeMeta = useMemo(() => AXIOM_OPTIONS.find((option) => option.mode === selectedMode) ?? AXIOM_OPTIONS[0], [selectedMode]);

  const handleModeChange = async (mode: AxiomMode) => {
    if (!state) return;
    const next = { ...state, axiomMode: mode };
    setState(next);
    await saveState(next);
  };

  const handleSubmit = async () => {
    if (!state || !inputText.trim()) return;
    setSending(true);
    const next: State = {
      ...state,
      coachHistory: [...state.coachHistory, { role: 'user', content: inputText.trim(), at: new Date().toISOString() }],
      coachSession: `${state.coachSession ?? ''}\n${selectedMode}: ${inputText.trim()}`,
    };
    setState(next);
    await saveState(next);
    setInputText('');
    setTimeout(() => setSending(false), 300);
  };

  if (!state) {
    return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;
  }

  return (
    <ScreenBg gradient={['#070B14', '#0F1227', '#06070E']}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>O Axioma</Text>
            <Text style={styles.subtitle}>Um motor narrativo para fazer suas perguntas mais profundas avançarem.</Text>

            <GlassCard style={styles.postureCard} tint="rgba(124,58,237,0.08)">
              <Text style={styles.sectionLabel}>Postura atual</Text>
              <View style={styles.optionRow}>
                {AXIOM_OPTIONS.map((option) => {
                  const active = option.mode === selectedMode;
                  return (
                    <TouchableOpacity
                      key={option.mode}
                      onPress={() => handleModeChange(option.mode)}
                      activeOpacity={0.9}
                      style={[styles.optionPill, active && styles.optionPillActive]}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.optionHint}>{modeMeta.hint}</Text>
            </GlassCard>

            <GlassCard style={styles.interactionCard} tint="rgba(8,145,178,0.08)">
              <View style={styles.interactionHeader}>
                <Text style={styles.sectionLabel}>Entrada de texto</Text>
                <Text style={styles.modeBadge}>{modeMeta.tone}</Text>
              </View>
              <TextInput
                placeholder="Descreva o desafio que você quer que o Axioma responda..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
                multiline
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.voiceBox} activeOpacity={0.88}>
                  <Ionicons name="mic-circle" size={28} color="#A78BFA" />
                  <Text style={styles.voiceText}>Voz silenciosa</Text>
                </TouchableOpacity>
                <PrimaryButton
                  label={sending ? 'Enviando...' : 'Enviar ao Axioma'}
                  onPress={handleSubmit}
                  icon="send"
                  disabled={sending || !inputText.trim()}
                  style={styles.sendBtn}
                />
              </View>
            </GlassCard>

            <SectionTitle style={styles.sectionTop}>Últimos insights</SectionTitle>
            <GlassCard style={styles.historyCard} tint="rgba(255,255,255,0.03)">
              {state.coachHistory.length ? (
                state.coachHistory.slice(-4).reverse().map((item, index) => (
                  <View key={`${item.at}-${index}`} style={styles.historyRow}>
                    <Text style={styles.historyRole}>{item.role === 'assistant' ? 'Axioma' : 'Você'}</Text>
                    <Text style={styles.historyText} numberOfLines={2}>{item.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Ainda não há diálogos com o Axioma.</Text>
              )}
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 18, paddingBottom: 28 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: '#CBD5E1', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  postureCard: { marginBottom: 18, padding: 18 },
  sectionLabel: { color: '#C4B5FD', fontSize: 12, letterSpacing: 1.7, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionPill: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, marginBottom: 8 },
  optionPillActive: { backgroundColor: 'rgba(124,58,237,0.18)' },
  optionText: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  optionTextActive: { color: '#fff' },
  optionHint: { color: '#94A3B8', marginTop: 14, fontSize: 12, lineHeight: 18 },
  interactionCard: { marginBottom: 18, padding: 18 },
  interactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modeBadge: { color: '#F8FAFC', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  input: { minHeight: 110, color: '#F8FAFC', fontSize: 15, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  voiceBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)' },
  voiceText: { color: '#D8B4FE', marginLeft: 8, fontSize: 13, fontWeight: '700' },
  sendBtn: { flex: 1, marginLeft: 12 },
  sectionTop: { marginTop: 4 },
  historyCard: { padding: 18 },
  historyRow: { marginBottom: 14 },
  historyRole: { color: '#A78BFA', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  historyText: { color: '#F8FAFC', fontSize: 14, lineHeight: 20 },
  emptyText: { color: '#94A3B8', fontSize: 12, marginTop: 8 },
});
