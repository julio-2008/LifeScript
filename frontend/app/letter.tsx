// Legacy Letter — seal a letter to your future self, opens in 1 year.
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, PrimaryButton, TypingText } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State, addTimeline } from '../src/state';
import { awardBadge } from '../src/badges';

export default function Letter() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [body, setBody] = useState('');

  useFocusEffect(useCallback(() => { loadState().then(setState); }, []));

  if (!state) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const letter = state.legacyLetter;
  const canOpen = letter ? new Date().toISOString().slice(0, 10) >= letter.openOn : false;

  const seal = async () => {
    if (body.trim().length < 20) { Alert.alert('Escreva mais', 'Escreva pelo menos um parágrafo.'); return; }
    const openOn = new Date(); openOn.setFullYear(openOn.getFullYear() + 1);
    const next = addTimeline({
      ...state,
      legacyLetter: {
        writtenAt: new Date().toISOString(),
        openOn: openOn.toISOString().slice(0, 10),
        body: body.trim(),
        opened: false,
      },
      badges: awardBadge(state.badges, 'letter_sealed'),
    }, { kind: 'letter', label: 'Sealed legacy letter' });
    await saveState(next); setState(next); setBody('');
  };

  const open = async () => {
    if (!letter) return;
    const next = { ...state, legacyLetter: { ...letter, opened: true } };
    await saveState(next); setState(next);
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="letter-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carta ao eu futuro</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 22 }}>
          {!letter ? (
            <>
              <Text style={styles.intro}>Escreva uma carta para quem você será em 1 ano. Ela ficará selada até esse dia chegar. O Axiom te avisará.</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Querido(a) eu do futuro…"
                placeholderTextColor={colors.textDim}
                multiline
                style={styles.input}
                testID="letter-input"
              />
              <View style={{ marginTop: 16 }}>
                <PrimaryButton label="Selar por 1 ano" icon="mail" testID="letter-seal-btn" onPress={seal} variant="gold" />
              </View>
            </>
          ) : letter.opened ? (
            <GlassCard>
              <Text style={styles.dateTxt}>Escrita em {new Date(letter.writtenAt).toLocaleDateString()}</Text>
              <Text style={styles.body}>{letter.body}</Text>
            </GlassCard>
          ) : canOpen ? (
            <>
              <GlassCard style={{ alignItems: 'center' }} tint="rgba(245,158,11,0.1)">
                <Ionicons name="mail-open" size={40} color={colors.gold} />
                <Text style={styles.bigTitle}>Sua carta está pronta</Text>
                <Text style={styles.subText}>Do passado. Para você. Hoje.</Text>
                <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
                  <PrimaryButton label="Abrir a carta" icon="mail-open" testID="letter-open-btn" onPress={open} variant="gold" />
                </View>
              </GlassCard>
            </>
          ) : (
            <GlassCard style={{ alignItems: 'center' }} tint="rgba(124,58,237,0.1)">
              <Ionicons name="lock-closed" size={36} color={colors.primaryLight} />
              <Text style={styles.bigTitle}>Selada</Text>
              <Text style={styles.subText}>Abre em {letter.openOn}</Text>
              <Text style={styles.dateTxt}>Selada em {new Date(letter.writtenAt).toLocaleDateString()}</Text>
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  intro: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  input: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, color: colors.text, fontSize: 15, minHeight: 220, textAlignVertical: 'top' },
  bigTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 10 },
  subText: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  dateTxt: { color: colors.textAccent, fontSize: 11, marginTop: 10 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: 12 },
});
