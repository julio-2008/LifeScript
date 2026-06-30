// Onboarding LifeScript — 15 perguntas em conversa, com seletor de idioma fixo
// no canto superior direito. Padrão: Português (BR).
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ScreenBg, PrimaryButton } from '../src/ui';
import { colors, areaColors } from '../src/theme';
import { Profile, loadState, saveState } from '../src/state';

const { width } = Dimensions.get('window');
const TOTAL = 15;

type Lang = 'pt' | 'en';

// Estrutura: cada pergunta em PT e EN. PT é o padrão.
const QUESTIONS: Array<{
  id: string;
  mood: 'dawn' | 'sky' | 'heavy' | 'focus' | 'warm';
  pt: { title: string; hint: string; placeholder?: string };
  en: { title: string; hint: string; placeholder?: string };
}> = [
  { id: 'name', mood: 'dawn',
    pt: { title: 'Como devo te chamar?', hint: 'Vou usar seu nome com frequência.', placeholder: 'Seu nome' },
    en: { title: 'What should I call you?', hint: "I'll use your name often.", placeholder: 'Your name' } },
  { id: 'age', mood: 'dawn',
    pt: { title: 'Quantos anos você tem?', hint: 'O contexto molda as missões.', placeholder: 'Idade' },
    en: { title: 'How old are you?', hint: 'Context shapes missions.', placeholder: 'Age' } },
  { id: 'country', mood: 'dawn',
    pt: { title: 'Onde você mora?', hint: 'Cidade ou país — você escolhe.', placeholder: 'País / cidade' },
    en: { title: 'Where do you live?', hint: 'City or country — your pick.', placeholder: 'Country / city' } },
  { id: 'dream', mood: 'sky',
    pt: { title: 'Qual é o seu maior sonho?', hint: 'Seja honesto. Quanto mais corajoso, melhor.', placeholder: 'Construir uma empresa. Viajar o mundo. Curar-se…' },
    en: { title: 'What is your biggest dream?', hint: 'Be honest. The braver, the better.', placeholder: 'Build a company. Heal. Travel the world…' } },
  { id: 'obstacle', mood: 'heavy',
    pt: { title: 'O que está no seu caminho?', hint: 'Nomear o obstáculo o encolhe.', placeholder: 'Procrastinação, medo, dinheiro…' },
    en: { title: 'What stands in your way?', hint: 'Naming it shrinks it.', placeholder: 'Procrastination, fear, money…' } },
  { id: 'hours', mood: 'focus',
    pt: { title: 'Quanto tempo por dia para você?', hint: 'Mesmo 30 minutos acumulam.' },
    en: { title: 'Daily time for yourself?', hint: 'Even 30 minutes compounds.' } },
  { id: 'focus', mood: 'focus',
    pt: { title: 'Onde você quer crescer primeiro?', hint: 'Escolha sua âncora na constelação.' },
    en: { title: 'Where do you want growth first?', hint: 'Pick your constellation anchor.' } },
  { id: 'income', mood: 'focus',
    pt: { title: 'Qual é sua renda atual?', hint: 'Sem julgamento. Isso molda as missões.' },
    en: { title: 'Your current income level?', hint: 'No judgement. It shapes missions.' } },
  { id: 'style', mood: 'focus',
    pt: { title: 'Vitórias rápidas ou trabalho profundo?', hint: 'Seu ritmo importa.' },
    en: { title: 'Fast wins or deep work?', hint: 'Your rhythm matters.' } },
  { id: 'vision', mood: 'sky',
    pt: { title: 'Descreva sua vida daqui a 1 ano.', hint: 'Se tudo desse certo.', placeholder: 'Acordo em paz. Construí…' },
    en: { title: 'Describe your life in 1 year.', hint: 'If everything went right.', placeholder: 'I wake up calm. I have built…' } },
  { id: 'proud', mood: 'warm',
    pt: { title: 'Algo que te orgulha?', hint: 'Dos últimos 12 meses.', placeholder: 'Comecei a correr. Disse não. Mudei…' },
    en: { title: 'One thing you are proud of?', hint: 'From the last 12 months.', placeholder: 'I moved. I started running. I said no.' } },
  { id: 'someday', mood: 'heavy',
    pt: { title: 'O que você sempre adia dizendo "um dia"?', hint: 'Aquela coisa que você sempre posterga.', placeholder: 'Aquela coisa que você fica dizendo "um dia"' },
    en: { title: 'What do you keep saying "someday" about?', hint: 'That thing you keep postponing.', placeholder: 'That thing you keep saying "someday" about' } },
  { id: 'rolemodel', mood: 'sky',
    pt: { title: 'Qual vida você gostaria que se parecesse com a sua — e por quê?', hint: 'Sem pressa. Nomeie a pessoa.', placeholder: 'Alguém cuja vida parece certa — e por quê' },
    en: { title: 'Whose life do you want yours to resemble — and why?', hint: 'No rush. Name them.', placeholder: 'Someone whose life feels right — and why' } },
  { id: 'tuesday', mood: 'warm',
    pt: { title: 'Como seria uma terça-feira perfeita?', hint: 'Terças porque são dias comuns.', placeholder: 'Café devagar. Trabalho profundo. Caminhada às 17h…' },
    en: { title: 'What does a perfect Tuesday look like?', hint: "Tuesdays because they're ordinary.", placeholder: 'Slow coffee. Deep work. A walk at 5pm…' } },
  { id: 'change', mood: 'heavy',
    pt: { title: 'Se pudesse mudar uma coisa em si na hora — qual seria?', hint: 'A resposta honesta.', placeholder: 'Se a mudança instantânea fosse possível…' },
    en: { title: 'If you could change one thing about yourself instantly — what?', hint: 'The honest answer.', placeholder: 'If instant change were possible…' } },
];

// UI labels traduzidas
const UI = {
  pt: {
    cta_continue: 'Continuar',
    cta_generate: 'Gerar meu LifeScript',
    focus_areas: {
      Career: 'Carreira', Finances: 'Finanças', Health: 'Saúde',
      Relationships: 'Relações', Mind: 'Mente', Skills: 'Habilidades',
    } as Record<string, string>,
    income_options: { Low: 'Baixa', Medium: 'Média', High: 'Alta' } as Record<string, string>,
    style_options: {
      'Fast wins': { label: 'Vitórias rápidas', desc: 'Momento rápido. Pequenas vitórias diárias.' },
      'Deep work': { label: 'Trabalho profundo', desc: 'Mais lento. Mais transformador.' },
    } as Record<string, { label: string; desc: string }>,
    hours_min: '30 min',
    hours_max: '4 horas',
  },
  en: {
    cta_continue: 'Continue',
    cta_generate: 'Generate my LifeScript',
    focus_areas: {
      Career: 'Career', Finances: 'Finances', Health: 'Health',
      Relationships: 'Relationships', Mind: 'Mind', Skills: 'Skills',
    } as Record<string, string>,
    income_options: { Low: 'Low', Medium: 'Medium', High: 'High' } as Record<string, string>,
    style_options: {
      'Fast wins': { label: 'Fast wins', desc: 'Quick momentum. Daily small victories.' },
      'Deep work': { label: 'Deep work', desc: 'Slower. More transformative.' },
    } as Record<string, { label: string; desc: string }>,
    hours_min: '30 min',
    hours_max: '4 hours',
  },
};

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
  const [lang, setLang] = useState<Lang>('pt');
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

  const q = QUESTIONS[step];
  const t = q[lang];
  const ui = UI[lang];

  const canNext = (() => {
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
    <ScreenBg gradient={moodToGradient(q.mood)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={back} testID="onboarding-back-btn" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <ProgressOrb value={progress} />
          <Text style={styles.stepTxt} testID="onboarding-step-indicator">{step + 1}/{TOTAL}</Text>
          <LanguagePill lang={lang} onChange={setLang} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.questionWrap, a]}>
            <Text style={styles.hint}>{t.hint}</Text>
            <Text style={styles.q}>{t.title}</Text>

            <View style={{ marginTop: 28 }}>
              {step === 0 && <TextInputField value={data.name} onChange={(t: string) => set('name', t)} placeholder={QUESTIONS[0][lang].placeholder} testID="onboarding-name-input" autoFocus />}
              {step === 1 && <TextInputField value={data.age} onChange={(t: string) => set('age', t.replace(/[^0-9]/g, ''))} placeholder={QUESTIONS[1][lang].placeholder} keyboardType="number-pad" maxLength={3} testID="onboarding-age-input" autoFocus />}
              {step === 2 && <TextInputField value={data.country} onChange={(t: string) => set('country', t)} placeholder={QUESTIONS[2][lang].placeholder} testID="onboarding-country-input" autoFocus />}
              {step === 3 && <TextInputField multiline value={data.dream} onChange={(t: string) => set('dream', t)} placeholder={QUESTIONS[3][lang].placeholder} testID="onboarding-dream-input" autoFocus />}
              {step === 4 && <TextInputField multiline value={data.obstacle} onChange={(t: string) => set('obstacle', t)} placeholder={QUESTIONS[4][lang].placeholder} testID="onboarding-obstacle-input" autoFocus />}
              {step === 5 && (
                <HoursSlider value={data.hours} onChange={(v) => set('hours', v)} ui={ui} />
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
                        <Text style={[styles.cardLabel, active && { color: areaColors[f.key] }]}>
                          {ui.focus_areas[f.key]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {step === 7 && (['Low', 'Medium', 'High'] as const).map((opt) => (
                <Row key={opt} label={ui.income_options[opt]} active={data.income === opt} onPress={() => set('income', opt)} testID={`onboarding-income-${opt}`} />
              ))}
              {step === 8 && ([
                { key: 'Fast wins', icon: 'flash' },
                { key: 'Deep work', icon: 'planet' },
              ] as const).map((opt) => (
                <Row key={opt.key} label={ui.style_options[opt.key].label} desc={ui.style_options[opt.key].desc} icon={opt.icon}
                  active={data.style === opt.key} onPress={() => set('style', opt.key)}
                  testID={`onboarding-style-${opt.key}`} />
              ))}
              {step === 9 && <TextInputField multiline minHeight={140} value={data.vision} onChange={(t: string) => set('vision', t)} placeholder={QUESTIONS[9][lang].placeholder} testID="onboarding-vision-input" autoFocus />}
              {step === 10 && <TextInputField multiline value={data.proud} onChange={(t: string) => set('proud', t)} placeholder={QUESTIONS[10][lang].placeholder} testID="onboarding-proud-input" autoFocus />}
              {step === 11 && <TextInputField multiline value={data.someday} onChange={(t: string) => set('someday', t)} placeholder={QUESTIONS[11][lang].placeholder} testID="onboarding-someday-input" autoFocus />}
              {step === 12 && <TextInputField multiline value={data.rolemodel} onChange={(t: string) => set('rolemodel', t)} placeholder={QUESTIONS[12][lang].placeholder} testID="onboarding-rolemodel-input" autoFocus />}
              {step === 13 && <TextInputField multiline value={data.tuesday} onChange={(t: string) => set('tuesday', t)} placeholder={QUESTIONS[13][lang].placeholder} testID="onboarding-tuesday-input" autoFocus />}
              {step === 14 && <TextInputField multiline value={data.change} onChange={(t: string) => set('change', t)} placeholder={QUESTIONS[14][lang].placeholder} testID="onboarding-change-input" autoFocus />}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={step === TOTAL - 1 ? ui.cta_generate : ui.cta_continue}
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

function LanguagePill({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <View style={styles.langPill} testID="onboarding-language-pill">
      <TouchableOpacity
        onPress={() => onChange('pt')}
        style={[styles.langOpt, lang === 'pt' && styles.langOptActive]}
        testID="onboarding-lang-pt"
      >
        <Text style={[styles.langTxt, lang === 'pt' && styles.langTxtActive]}>PT</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange('en')}
        style={[styles.langOpt, lang === 'en' && styles.langOptActive]}
        testID="onboarding-lang-en"
      >
        <Text style={[styles.langTxt, lang === 'en' && styles.langTxtActive]}>EN</Text>
      </TouchableOpacity>
    </View>
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

function HoursSlider({ value, onChange, ui }: { value: number; onChange: (v: number) => void; ui: any }) {
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
        <Text style={{ color: colors.textDim, fontSize: 12 }}>{ui.hours_min}</Text>
        <Text style={{ color: colors.textDim, fontSize: 12 }}>{ui.hours_max}</Text>
      </View>
    </View>
  );
}

function ProgressOrb({ value }: { value: number }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <View style={{ alignItems: 'center' }}>
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
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 6,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  stepTxt: { color: colors.textDim, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Pílula de idioma fixada no canto superior direito
  langPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    borderRadius: 999,
    padding: 3,
  },
  langOpt: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 38,
    alignItems: 'center',
  },
  langOptActive: {
    backgroundColor: 'rgba(124,58,237,0.55)',
  },
  langTxt: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  langTxtActive: {
    color: '#fff',
  },

  scroll: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 30 },
  questionWrap: { minHeight: 320 },
  hint: { color: colors.textAccent, fontSize: 13, letterSpacing: 1.4, fontWeight: '600', textTransform: 'uppercase', marginBottom: 14 },
  q: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -1, lineHeight: 36 },
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
