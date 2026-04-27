// 10-question onboarding flow.
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Line, Circle as SvgCircle } from 'react-native-svg';

import { ScreenBg, PrimaryButton, GlassCard } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import { Profile, loadState, saveState } from '../src/state';

const { width } = Dimensions.get('window');

const TOTAL = 10;

const focusAreas = [
  { key: 'Career', icon: 'briefcase' as const },
  { key: 'Finances', icon: 'cash' as const },
  { key: 'Health', icon: 'fitness' as const },
  { key: 'Relationships', icon: 'people' as const },
  { key: 'Mind', icon: 'bulb' as const },
  { key: 'Skills', icon: 'construct' as const },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '',
    age: '',
    country: '',
    dream: '',
    obstacle: '',
    hours_per_day: 1,
    focus_area: '',
    income: '',
    style: '',
    one_year_vision: '',
  });

  const fade = useSharedValue(1);
  const slide = useSharedValue(0);

  useEffect(() => {
    fade.value = 0;
    slide.value = 30;
    fade.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    slide.value = withSpring(0, { damping: 14 });
  }, [step]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));

  const canNext = (() => {
    switch (step) {
      case 0: return data.name.trim().length > 0;
      case 1: return data.age && Number(data.age) > 0 && Number(data.age) < 120;
      case 2: return data.country.trim().length > 0;
      case 3: return data.dream.trim().length > 5;
      case 4: return data.obstacle.trim().length > 5;
      case 5: return data.hours_per_day > 0;
      case 6: return data.focus_area !== '';
      case 7: return data.income !== '';
      case 8: return data.style !== '';
      case 9: return data.one_year_vision.trim().length > 5;
      default: return false;
    }
  })();

  const advance = async () => {
    if (step < TOTAL - 1) {
      setStep(step + 1);
    } else {
      const profile: Profile = {
        name: data.name.trim(),
        age: Number(data.age),
        country: data.country.trim(),
        dream: data.dream.trim(),
        obstacle: data.obstacle.trim(),
        hours_per_day: data.hours_per_day,
        focus_area: data.focus_area,
        income: data.income as Profile['income'],
        style: data.style as Profile['style'],
        one_year_vision: data.one_year_vision.trim(),
      };
      const s = await loadState();
      await saveState({ ...s, profile });
      router.replace('/generating');
    }
  };

  const back = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };

  const progress = (step + 1) / TOTAL;

  return (
    <ScreenBg>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={back} testID="onboarding-back-btn" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.stepTxt}>{step + 1}/{TOTAL}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.questionWrap, aStyle]}>
            {step === 0 && (
              <Question
                title="What's your first name?"
                hint="We'll personalize your entire journey."
              >
                <TextInput
                  testID="onboarding-name-input"
                  value={data.name}
                  onChangeText={(t) => set('name', t)}
                  placeholder="Your name"
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                  autoFocus
                  returnKeyType="next"
                />
              </Question>
            )}

            {step === 1 && (
              <Question title="How old are you?" hint="No judgement, just calibration.">
                <TextInput
                  testID="onboarding-age-input"
                  value={data.age}
                  onChangeText={(t) => set('age', t.replace(/[^0-9]/g, ''))}
                  placeholder="Age"
                  placeholderTextColor={colors.textDim}
                  keyboardType="number-pad"
                  style={styles.input}
                  autoFocus
                  maxLength={3}
                />
              </Question>
            )}

            {step === 2 && (
              <Question title="Where do you live?" hint="Country or city — your choice.">
                <TextInput
                  testID="onboarding-country-input"
                  value={data.country}
                  onChangeText={(t) => set('country', t)}
                  placeholder="Country"
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                  autoFocus
                />
              </Question>
            )}

            {step === 3 && (
              <Question title="What's your biggest dream in life?" hint="Be honest. The braver, the better.">
                <TextInput
                  testID="onboarding-dream-input"
                  value={data.dream}
                  onChangeText={(t) => set('dream', t)}
                  placeholder="Build a company. Heal myself. Travel the world…"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  autoFocus
                />
              </Question>
            )}

            {step === 4 && (
              <Question title="What's your biggest obstacle right now?" hint="Naming it shrinks it.">
                <TextInput
                  testID="onboarding-obstacle-input"
                  value={data.obstacle}
                  onChangeText={(t) => set('obstacle', t)}
                  placeholder="Procrastination, self-doubt, money…"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  autoFocus
                />
              </Question>
            )}

            {step === 5 && (
              <Question
                title="How much time can you invest daily?"
                hint="Even 30 minutes can transform a life."
              >
                <View style={styles.sliderWrap}>
                  <Text style={styles.sliderValue} testID="onboarding-hours-value">
                    {data.hours_per_day}h
                  </Text>
                  <View style={styles.sliderTrack}>
                    {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((v) => (
                      <TouchableOpacity
                        key={v}
                        testID={`onboarding-hours-${v}`}
                        onPress={() => set('hours_per_day', v)}
                        style={[
                          styles.sliderDot,
                          data.hours_per_day >= v && styles.sliderDotActive,
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>30 min</Text>
                    <Text style={styles.sliderLabel}>4 hours</Text>
                  </View>
                </View>
              </Question>
            )}

            {step === 6 && (
              <Question title="What area do you most want to improve?" hint="Pick one to focus on first.">
                <View style={styles.cardsGrid}>
                  {focusAreas.map((a) => {
                    const active = data.focus_area === a.key;
                    return (
                      <TouchableOpacity
                        key={a.key}
                        testID={`onboarding-focus-${a.key}`}
                        onPress={() => set('focus_area', a.key)}
                        style={[styles.choiceCard, active && { borderColor: areaColors[a.key] }]}
                      >
                        <Ionicons
                          name={a.icon}
                          size={28}
                          color={active ? areaColors[a.key] : colors.text}
                        />
                        <Text style={[styles.choiceLabel, active && { color: areaColors[a.key] }]}>
                          {a.key}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Question>
            )}

            {step === 7 && (
              <Question title="What's your income level?" hint="No judgment — this shapes the missions.">
                {(['Low', 'Medium', 'High'] as const).map((opt) => {
                  const active = data.income === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      testID={`onboarding-income-${opt}`}
                      onPress={() => set('income', opt)}
                      style={[styles.row, active && { borderColor: colors.primary }]}
                    >
                      <Text style={styles.rowLabel}>{opt}</Text>
                      {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </Question>
            )}

            {step === 8 && (
              <Question title="Fast wins or deep work?" hint="Choose your rhythm.">
                {([
                  { key: 'Fast wins', desc: 'Quick momentum. Daily small victories.', icon: 'flash' },
                  { key: 'Deep work', desc: 'Slower. More transformative.', icon: 'planet' },
                ] as const).map((opt) => {
                  const active = data.style === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      testID={`onboarding-style-${opt.key}`}
                      onPress={() => set('style', opt.key)}
                      style={[
                        styles.row,
                        { paddingVertical: 16, alignItems: 'flex-start' },
                        active && { borderColor: colors.primary },
                      ]}
                    >
                      <Ionicons name={opt.icon} size={26} color={colors.primary} />
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.rowLabel}>{opt.key}</Text>
                        <Text style={{ color: colors.textDim, fontSize: 13, marginTop: 4 }}>
                          {opt.desc}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </Question>
            )}

            {step === 9 && (
              <Question
                title="In 1 year, if everything went right…"
                hint="Describe that life in one paragraph."
              >
                <TextInput
                  testID="onboarding-vision-input"
                  value={data.one_year_vision}
                  onChangeText={(t) => set('one_year_vision', t)}
                  placeholder="I wake up calm. I have built…"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputMulti, { minHeight: 140 }]}
                  multiline
                  autoFocus
                />
              </Question>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={step === TOTAL - 1 ? 'Generate my LifeScript' : 'Continue'}
            icon={step === TOTAL - 1 ? 'sparkles' : 'arrow-forward'}
            testID="onboarding-next-btn"
            onPress={advance}
            disabled={!canNext}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.qHint}>{hint}</Text>
      <Text style={styles.qTitle}>{title}</Text>
      <View style={{ marginTop: 28 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressBar: {
    flex: 1, height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  stepTxt: { color: colors.textDim, fontSize: 12, fontWeight: '600' },

  scroll: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 30 },
  questionWrap: { minHeight: 320 },

  qHint: { color: colors.textAccent, fontSize: 13, letterSpacing: 1.4, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  qTitle: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -1, lineHeight: 38 },

  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    color: colors.text,
    fontSize: 18,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },

  sliderWrap: { paddingVertical: 12 },
  sliderValue: {
    color: colors.primary,
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sliderDot: {
    flex: 1,
    height: 14,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 7,
  },
  sliderDotActive: { backgroundColor: colors.primary },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabel: { color: colors.textDim, fontSize: 12 },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  choiceCard: {
    width: '48%',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 12,
  },
  choiceLabel: { color: colors.text, marginTop: 10, fontWeight: '600', fontSize: 15 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  rowLabel: { color: colors.text, fontSize: 17, fontWeight: '600', flex: 1 },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 6,
  },
});
