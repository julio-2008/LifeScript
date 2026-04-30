// 15-question onboarding for LifeScript 2.0. Each question feels like a conversation,
// not a form.
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ScreenBg, PrimaryButton, PulsingOrb } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import { Profile, loadState, saveState } from '../src/state';

const { width } = Dimensions.get('window');
const TOTAL = 15;

const QUESTIONS = [
  { id: 'name',      title: 'What should I call you?',          hint: 'I\'ll use your name often.',        mood: 'dawn' },
  { id: 'age',       title: 'How old are you?',                 hint: 'Context shapes missions.',          mood: 'dawn' },
  { id: 'country',   title: 'Where do you live?',               hint: 'City or country — your pick.',      mood: 'dawn' },
  { id: 'dream',     title: 'What is your biggest dream?',      hint: 'Be honest. The braver, the better.',mood: 'sky' },
  { id: 'obstacle',  title: 'What stands in your way?',         hint: 'Naming it shrinks it.',              mood: 'heavy' },
  { id: 'hours',     title: 'Daily time for yourself?',         hint: 'Even 30 minutes compounds.',         mood: 'focus' },
  { id: 'focus',     title: 'Where do you want growth first?',  hint: 'Pick your constellation anchor.',    mood: 'focus' },
  { id: 'income',    title: 'Your current income level?',       hint: 'No judgement. It shapes missions.',  mood: 'focus' },
  { id: 'style',     title: 'Fast wins or deep work?',          hint: 'Your rhythm matters.',               mood: 'focus' },
  { id: 'vision',    title: 'Describe your life in 1 year.',    hint: 'If everything went right.',          mood: 'sky' },
  { id: 'proud',     title: 'One thing you are proud of?',      hint: 'From the last 12 months.',           mood: 'warm' },
  { id: 'someday',   title: 'What do you keep saying "someday" about?', hint: 'That thing you keep postponing.', mood: 'heavy' },
  { id: 'rolemodel', title: 'Whose life do you want yours to resemble — and why?', hint: 'No rush. Name them.', mood: 'sky' },
  { id: 'tuesday',   title: 'What does a perfect Tuesday look like?', hint: 'Tuesdays because they\'re ordinary.', mood: 'warm' },
  { id: 'change',    title: 'If you could change one thing about yourself instantly — what?', hint: 'The honest answer.', mood: 'heavy' },
] as const;

const focusAreas = [
  { key: 'Career', icon: 'briefcase' },
  { key: 'Finances', icon: 'cash' },
  { key: 'Health', icon: 'fitness' },
  { key: 'Relationships', icon: 'people' },
  { key: 'Mind', icon: 'bulb' },
  { key: 'Skills', icon: 'construct' },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>({
    name: '', age: '', country: '', dream: '', obstacle: '',
    hours: 1, focus: '', income: '', style: '', vision: '',
    proud: '', someday: '', rolemodel: '', tuesday: '', change: '',
  });

  const fade = useSharedValue(1);
  const slide = useSharedValue(0);

  useEffect(() => {
    fade.value = 0; slide.value = 40;
    fade.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    slide.value = withSpring(0, { damping: 14 });
  }, [step]);

  const a = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: slide.value }] }));

  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));

  const canNext = (() => {
    const q = QUESTIONS[step];
    const v = data[q.id];
    switch (q.id) {
      case 'age': return v && Number(v) > 0 && Number(v) < 120;
      case 'hours': return Number(v) > 0;
      case 'focus':
      case 'income':
      case 'style': return !!v;
      case 'dream':
      case 'obstacle':
      case 'vision':
      case 'proud':
      case 'someday':
      case 'rolemodel':
      case 'tuesday':
      case 'change':
        return (v ?? '').trim().length > 5;
      default: return (v ?? '').trim().length > 0;
    }
  })();

  const advance = async () => {
    if (step < TOTAL - 1) { setStep(step + 1); return; }
    const profile: Profile = {
      name: data.name.trim(), age: Number(data.age), country: data.country.trim(),
      dream: data.dream.trim(), obstacle: data.obstacle.trim(),
      hours_per_day: Number(data.hours), focus_area: data.focus,
      income: data.income, style: data.style, one_year_vision: data.vision.trim(),
      proud_of_last_year: data.proud.trim(), someday_thing: data.someday.trim(),
      role_model: data.rolemodel.trim(), perfect_tuesday: data.tuesday.trim(),
      one_change: data.change.trim(),
    };
    const s = await loadState();
    await saveState({ ...s, profile });
    router.replace('/generating');
  };

  const back = () => { if (step === 0) router.back(); else setStep(step - 1); };
  const progress = (step + 1) / TOTAL;

  return (
    <ScreenBg gradient={moodToGradient(QUESTIONS[step].mood)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={back} testID="onboarding-back-btn" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <ProgressOrb value={progress} />
          <Text style={styles.stepTxt} testID="onboarding-step-indicator">{step + 1}/{TOTAL}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.questionWrap, a]}>
            <Text style={styles.hint}>{QUESTIONS[step].hint}</Text>
            <Text style={styles.q}>{QUESTIONS[step].title}</Text>

            <View style={{ marginTop: 28 }}>
              {step === 0 && <TextInputField value={data.name} onChange={(t) => set('name', t)} placeholder="Your name" testID="onboarding-name-input" autoFocus />}
              {step === 1 && <TextInputField value={data.age} onChange={(t) => set('age', t.replace(/[^0-9]/g, ''))} placeholder="Age" keyboardType="number-pad" maxLength={3} testID="onboarding-age-input" autoFocus />}
              {step === 2 && <TextInputField value={data.country} onChange={(t) => set('country', t)} placeholder="Country" testID="onboarding-country-input" autoFocus />}
              {step === 3 && <TextInputField multiline value={data.dream} onChange={(t) => set('dream', t)} placeholder="Build a company. Heal. Travel the world…" testID="onboarding-dream-input" autoFocus />}
              {step === 4 && <TextInputField multiline value={data.obstacle} onChange={(t) => set('obstacle', t)} placeholder="Procrastination, fear, money…" testID="onboarding-obstacle-input" autoFocus />}
              {step === 5 && (
                <HoursSlider value={data.hours} onChange={(v) => set('hours', v)} />
              )}
              {step === 6 && (
                <View style={styles.cards}>
                  {focusAreas.map((f) => {
                    const active = data.focus === f.key;
                    return (
                      <TouchableOpacity key={f.key} onPress={() => set('focus', f.key)}
                        testID={`onboarding-focus-${f.key}`}
                        style={[styles.card, active && { borderColor: areaColors[f.key] }]}>
                        <Ionicons name={f.icon as any} size={28} color={active ? areaColors[f.key] : colors.text} />
                        <Text style={[styles.cardLabel, active && { color: areaColors[f.key] }]}>{f.key}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {step === 7 && (['Low', 'Medium', 'High'] as const).map((opt) => (
                <Row key={opt} label={opt} active={data.income === opt} onPress={() => set('income', opt)} testID={`onboarding-income-${opt}`} />
              ))}
              {step === 8 && ([
                { key: 'Fast wins', desc: 'Quick momentum. Daily small victories.', icon: 'flash' },
                { key: 'Deep work', desc: 'Slower. More transformative.', icon: 'planet' },
              ] as const).map((opt) => (
                <Row key={opt.key} label={opt.key} desc={opt.desc} icon={opt.icon}
                  active={data.style === opt.key} onPress={() => set('style', opt.key)}
                  testID={`onboarding-style-${opt.key}`} />
              ))}
              {step === 9 && <TextInputField multiline minHeight={140} value={data.vision} onChange={(t) => set('vision', t)} placeholder="I wake up calm. I have built…" testID="onboarding-vision-input" autoFocus />}
              {step === 10 && <TextInputField multiline value={data.proud} onChange={(t) => set('proud', t)} placeholder="I moved. I started running. I said no." testID="onboarding-proud-input" autoFocus />}
              {step === 11 && <TextInputField multiline value={data.someday} onChange={(t) => set('someday', t)} placeholder="That thing you keep saying 'someday' about" testID="onboarding-someday-input" autoFocus />}
              {step === 12 && <TextInputField multiline value={data.rolemodel} onChange={(t) => set('rolemodel', t)} placeholder="Someone whose life feels right — and why" testID="onboarding-rolemodel-input" autoFocus />}
              {step === 13 && <TextInputField multiline value={data.tuesday} onChange={(t) => set('tuesday', t)} placeholder="Slow coffee. Deep work. A walk at 5pm…" testID="onboarding-tuesday-input" autoFocus />}
              {step === 14 && <TextInputField multiline value={data.change} onChange={(t) => set('change', t)} placeholder="If instant change were possible…" testID="onboarding-change-input" autoFocus />}
            </View>
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

function moodToGradient(mood: string): readonly [string, string, ...string[]] {
  switch (mood) {
    case 'dawn':  return ['#080818', '#1A0B2A', '#080818'] as const;
    case 'sky':   return ['#080818', '#0B1F3A', '#080818'] as const;
    case 'heavy': return ['#030306', '#110A18', '#080818'] as const;
    case 'focus': return ['#080818', '#0B1A2A', '#080818'] as const;
    case 'warm':  return ['#080818', '#2A1608', '#080818'] as const;
    default:      return ['#080818', '#130F2A', '#080818'] as const;
  }
}

function TextInputField({ value, onChange, placeholder, multiline, minHeight, maxLength, keyboardType, autoFocus, testID }: any) {
  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textDim}
      multiline={multiline}
      maxLength={maxLength}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      style={[
        styles.input,
        multiline && { minHeight: minHeight ?? 100, textAlignVertical: 'top' },
      ]}
    />
  );
}

function Row({ label, active, onPress, testID, desc, icon }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID}
      style={[styles.rowCard, active && { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.1)' }]}>
      {icon && <Ionicons name={icon as any} size={22} color={colors.primary} />}
      <View style={{ flex: 1, marginLeft: icon ? 12 : 0 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 4 }}>{desc}</Text>}
      </View>
      {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
    </TouchableOpacity>
  );
}

function HoursSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
  return (
    <View>
      <Text style={styles.sliderValue} testID="onboarding-hours-value">{value}h</Text>
      <View style={styles.sliderTrack}>
        {steps.map((v) => (
          <TouchableOpacity key={v} testID={`onboarding-hours-${v}`} onPress={() => onChange(v)}
            style={[styles.sliderDot, value >= v && styles.sliderDotActive]} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>30 min</Text>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>4 hours</Text>
      </View>
    </View>
  );
}

function ProgressOrb({ value }: { value: number }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={40} height={40}>
          <Circle cx={20} cy={20} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={3} fill="transparent" />
          <Circle cx={20} cy={20} r={r}
            stroke={colors.primary} strokeWidth={3} fill="transparent"
            strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - value)}
            strokeLinecap="round"
            transform={`rotate(-90 20 20)`}
          />
        </Svg>
        <View style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 6,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  stepTxt: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 30 },
  questionWrap: { minHeight: 320 },
  hint: { color: colors.textAccent, fontSize: 13, letterSpacing: 1.4, fontWeight: '600', textTransform: 'uppercase', marginBottom: 14 },
  q: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -1, lineHeight: 38 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18,
    color: colors.text, fontSize: 18,
  },
  sliderValue: { color: colors.primary, fontSize: 56, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  sliderTrack: { flexDirection: 'row', gap: 6 },
  sliderDot: { flex: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 7 },
  sliderDotActive: { backgroundColor: colors.primary },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 16, paddingVertical: 22, alignItems: 'center', marginBottom: 12,
  },
  cardLabel: { color: colors.text, marginTop: 10, fontWeight: '600', fontSize: 15 },
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 10,
  },
  rowLabel: { color: colors.text, fontSize: 17, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 6 },
});
