// Dream Board — glowing keyword stars.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State } from '../src/state';
import { awardBadge } from '../src/badges';

export default function DreamBoard() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [input, setInput] = useState('');

  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const add = async () => {
    const v = input.trim();
    if (!v || state.dreamBoard.includes(v)) { setInput(''); return; }
    const next = { ...state, dreamBoard: [...state.dreamBoard, v] };
    if (next.dreamBoard.length >= 5) next.badges = awardBadge(next.badges, 'dream_built');
    await saveState(next); setState(next); setInput('');
  };

  const remove = async (v: string) => {
    const next = { ...state, dreamBoard: state.dreamBoard.filter((x) => x !== v) };
    await saveState(next); setState(next);
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="dream-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quadro dos Sonhos</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ padding: 22 }}>
          <Text style={styles.intro}>Palavras que representam a vida que você está se tornando. O Axiom lê estas palavras para afinar suas missões.</Text>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Adicione uma palavra-chave…"
              placeholderTextColor={colors.textDim}
              style={styles.input}
              onSubmitEditing={add}
              testID="dream-input"
            />
            <TouchableOpacity onPress={add} style={styles.addBtn} testID="dream-add-btn">
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {state.dreamBoard.map((d) => (
              <TouchableOpacity key={d} onLongPress={() => remove(d)} testID={`dream-chip-${d}`}>
                <View style={styles.chip}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={styles.chipTxt}>  {d}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {state.dreamBoard.length === 0 && (
            <GlassCard style={{ marginTop: 16 }}>
              <Text style={{ color: colors.textDim }}>Vazio. Adicione sua primeira palavra de sonho. Pressione e segure para remover.</Text>
            </GlassCard>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  intro: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  input: { flex: 1, color: colors.text, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.45)', backgroundColor: 'rgba(245,158,11,0.08)' },
  chipTxt: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
