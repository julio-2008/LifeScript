// Edit goals screen — lets the user update their answers and regenerate the plan.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBg, GlassCard, PrimaryButton } from '../src/ui';
import { colors } from '../src/theme';
import { loadState, saveState, State } from '../src/state';

export default function EditGoals() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [dream, setDream] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [vision, setVision] = useState('');
  const [hours, setHours] = useState(1);
  const [focus, setFocus] = useState('');

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      if (s.profile) {
        setDream(s.profile.dream);
        setObstacle(s.profile.obstacle);
        setVision(s.profile.one_year_vision);
        setHours(s.profile.hours_per_day);
        setFocus(s.profile.focus_area);
      }
    });
  }, []);

  if (!state || !state.profile) return <ScreenBg><View style={{ flex: 1 }} /></ScreenBg>;

  const save = async () => {
    const profile = {
      ...state.profile!,
      dream: dream.trim(),
      obstacle: obstacle.trim(),
      one_year_vision: vision.trim(),
      hours_per_day: hours,
      focus_area: focus,
    };
    const next = { ...state, profile };
    await saveState(next);
    Alert.alert('Saved', 'Want to regenerate your plan now?', [
      { text: 'Later' },
      {
        text: 'Regenerate',
        onPress: () => router.replace('/generating'),
      },
    ]);
    setState(next);
  };

  const focusList = ['Career', 'Finances', 'Health', 'Relationships', 'Mind', 'Skills'];

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

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Biggest dream">
            <TextInput
              testID="edit-dream"
              value={dream}
              onChangeText={setDream}
              style={styles.input}
              multiline
              placeholderTextColor={colors.textDim}
            />
          </Field>

          <Field label="Biggest obstacle">
            <TextInput
              testID="edit-obstacle"
              value={obstacle}
              onChangeText={setObstacle}
              style={styles.input}
              multiline
              placeholderTextColor={colors.textDim}
            />
          </Field>

          <Field label="1-year vision">
            <TextInput
              testID="edit-vision"
              value={vision}
              onChangeText={setVision}
              style={[styles.input, { minHeight: 110 }]}
              multiline
              placeholderTextColor={colors.textDim}
            />
          </Field>

          <Field label={`Time per day · ${hours}h`}>
            <View style={styles.sliderTrack}>
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setHours(v)}
                  style={[styles.dot, hours >= v && styles.dotActive]}
                  testID={`edit-hours-${v}`}
                />
              ))}
            </View>
          </Field>

          <Field label="Focus area">
            <View style={styles.chipsRow}>
              {focusList.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFocus(f)}
                  style={[styles.chip, focus === f && styles.chipActive]}
                  testID={`edit-focus-${f}`}
                >
                  <Text style={[styles.chipTxt, focus === f && { color: colors.gold }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={{ marginTop: 18 }}>
            <PrimaryButton label="Save changes" icon="save" testID="edit-save-btn" onPress={save} variant="gold" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <GlassCard style={{ padding: 4 }}>{children}</GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  label: { color: colors.textAccent, fontSize: 12, letterSpacing: 1.4, fontWeight: '700', marginBottom: 8 },
  input: {
    color: colors.text, padding: 14, fontSize: 15,
    minHeight: 70, textAlignVertical: 'top',
  },
  sliderTrack: { flexDirection: 'row', padding: 14, gap: 4 },
  dot: { flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' },
  dotActive: { backgroundColor: colors.primary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: 'rgba(245,158,11,0.1)' },
  chipTxt: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
