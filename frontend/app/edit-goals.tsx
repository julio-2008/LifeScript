// Edit onboarding answers and regenerate plan — LifeScript 2.0.
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBg, GlassCard, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State } from '../src/state';

const FIELDS: { key: string; label: string; hint?: string; multiline?: boolean }[] = [
  { key: 'dream', label: 'Biggest dream', multiline: true },
  { key: 'obstacle', label: 'Biggest obstacle', multiline: true },
  { key: 'one_year_vision', label: '1-year vision', multiline: true },
  { key: 'proud_of_last_year', label: 'Proud of (last year)', multiline: true },
  { key: 'someday_thing', label: '"Someday" thing', multiline: true },
  { key: 'role_model', label: 'Role model', multiline: true },
  { key: 'perfect_tuesday', label: 'Perfect Tuesday', multiline: true },
  { key: 'one_change', label: 'One instant change', multiline: true },
];

export default function EditGoals() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      if (s.profile) {
        setValues({
          dream: s.profile.dream || '',
          obstacle: s.profile.obstacle || '',
          one_year_vision: s.profile.one_year_vision || '',
          proud_of_last_year: s.profile.proud_of_last_year || '',
          someday_thing: s.profile.someday_thing || '',
          role_model: s.profile.role_model || '',
          perfect_tuesday: s.profile.perfect_tuesday || '',
          one_change: s.profile.one_change || '',
        });
      }
    });
  }, []);

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const set = (k: string, v: string) => setValues((d) => ({ ...d, [k]: v }));

  const save = async () => {
    const profile = { ...state.profile!, ...values };
    const next = { ...state, profile };
    await saveState(next); setState(next);
    Alert.alert('Saved', 'Regenerate your plan now?', [
      { text: 'Later' },
      { text: 'Regenerate', onPress: () => router.replace('/generating') },
    ]);
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="edit-back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit my goals</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 22 }} keyboardShouldPersistTaps="handled">
          {FIELDS.map((f) => (
            <View key={f.key} style={{ marginBottom: 18 }}>
              <Text style={styles.label}>{f.label.toUpperCase()}</Text>
              <GlassCard style={{ padding: 4 }}>
                <TextInput
                  testID={`edit-${f.key}`}
                  value={values[f.key] || ''}
                  onChangeText={(t) => set(f.key, t)}
                  placeholderTextColor={colors.textDim}
                  multiline={f.multiline}
                  style={[styles.input, f.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
                />
              </GlassCard>
            </View>
          ))}

          <View style={{ marginTop: 12 }}>
            <PrimaryButton label="Save changes" icon="save" testID="edit-save-btn" onPress={save} variant="gold" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  label: { color: colors.textAccent, fontSize: 11, letterSpacing: 1.4, fontWeight: '700', marginBottom: 8 },
  input: { color: colors.text, padding: 14, fontSize: 15 },
});
