// LifeScript 2.0 — full persistent state.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EconomyState,
  FutureSelfCard,
  CounterfactualRetrospective,
  ReturnState,
  BioStatusSnapshot,
  ClimateContext,
  GeofenceEvent,
  LedgerEntry,
} from './models';

export type Profile = {
  name: string;
  age: number;
  country: string;
  dream: string;
  obstacle: string;
  hours_per_day: number;
  focus_area: string;
  income: 'Low' | 'Medium' | 'High';
  style: 'Fast wins' | 'Deep work';
  one_year_vision: string;
  // New in 2.0 — the 5 extra onboarding questions
  proud_of_last_year: string;
  someday_thing: string;
  role_model: string;
  perfect_tuesday: string;
  one_change: string;
};

export type StoredMission = {
  id: string;
  title: string;
  description: string;
  area: string;
  minutes: number;
  icon: string;
  date: string;
  completed: boolean;
  notes?: string;
  reflection?: string;
  reflectionQ?: string;
  kind?: 'main' | 'side' | 'daily-challenge' | 'stealth' | 'emergency';
  completedAt?: string; // ISO
};

export type WeeklyQuest = {
  id: string;
  title: string;
  description: string;
  daily_steps: string[];
  progress: boolean[];
};

export type AxiomMode = 'hard' | 'support' | 'strategist' | 'philosopher' | 'silent';

export type InventoryEntry = { type: string; count: number };

export type IdentityCard = {
  generatedAt: string;
  statement: string;
  percentProgress: number;
};

export type LegacyLetter = {
  writtenAt: string;
  openOn: string; // YYYY-MM-DD (~1 year later)
  body: string;
  opened: boolean;
};

export type TimelineEvent = {
  at: string; // ISO
  kind: string;
  label: string;
  meta?: Record<string, any>;
};

export type HiddenPattern = {
  title: string;
  insight: string;
  revealedAt: string;
};

export type State = {
  // setup
  onboarded: boolean;
  profile: Profile | null;
  avatar: string;
  joinDate: string;

  // gamification
  xp: number;
  totalMissionsDone: number;
  streak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  shields: number;
  badges: string[];
  traits: string[];
  prestige: number;

  // plan
  missions: StoredMission[];
  missionArchive: StoredMission[];
  weeklyQuest: WeeklyQuest | null;
  welcomeQuote: string;
  dailyQuote: string;
  dailyQuoteDate: string | null;

  // 8 life areas (0..1)
  areas: Record<string, number>;

  // chapters / monetization narrative
  currentChapter: number; // 1 at start
  chapterStartDate: string | null; // YYYY-MM-DD current chapter started
  chaptersUnlocked: number[]; // [1,2,3] etc
  hiddenPattern: HiddenPattern | null;

  // pro & referrals
  pro: boolean;
  referrals: number;
  referralCode: string;
  proCountdownStart: number;
  hasShared: boolean;

  // axiom coach
  axiomMode: AxiomMode;
  coachSession: string | null;
  coachHistory: { role: 'user' | 'assistant'; content: string; at?: string }[];

  // inventory & identity
  inventory: Record<string, number>;
  identityCard: IdentityCard | null;

  // dreams / letters / timeline
  dreamBoard: string[];
  legacyLetter: LegacyLetter | null;
  timeline: TimelineEvent[];

  // seasons & spin
  season: number;
  seasonStart: string;
  lastSpinDate: string | null;

  // stealth/emergency/daily challenge
  lastStealthDate: string | null;
  lastEmergencyDate: string | null;
  dailyChallengeDate: string | null;

  // settings
  darkMode: boolean;
  reminderTime: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: 'aurora' | 'nebula' | 'ember' | 'forest' | 'mono';
  bossCycle: number;
  lastBossDate: string | null;
  ledgerVersion: number;
  ledgerLastSync: string | null;
  ledgerEntries: LedgerEntry[];
  economy: EconomyState;
  futureSelfCard: FutureSelfCard | null;
  counterfactualRetrospectives: CounterfactualRetrospective[];
  returnState: ReturnState;
  bioStatus: BioStatusSnapshot;
  climateContext: ClimateContext | null;
  geofenceContext: GeofenceEvent | null;
};

export const LIFE_AREAS = ['Career', 'Finances', 'Health', 'Relationships', 'Mind', 'Skills', 'Purpose', 'Legacy'] as const;

export const DEFAULT_AREAS: Record<string, number> = {
  Career: 0.08,
  Finances: 0.08,
  Health: 0.08,
  Relationships: 0.08,
  Mind: 0.08,
  Skills: 0.08,
  Purpose: 0,
  Legacy: 0,
};

const KEY = '@lifescript_state_v2';

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const INITIAL_STATE: State = {
  onboarded: false,
  profile: null,
  avatar: '🌕',
  joinDate: new Date().toISOString(),
  xp: 0,
  totalMissionsDone: 0,
  streak: 0,
  longestStreak: 0,
  lastCompletionDate: null,
  shields: 1,
  badges: [],
  traits: [],
  prestige: 0,
  missions: [],
  missionArchive: [],
  weeklyQuest: null,
  welcomeQuote: '',
  dailyQuote: '',
  dailyQuoteDate: null,
  areas: { ...DEFAULT_AREAS },
  currentChapter: 1,
  chapterStartDate: null,
  chaptersUnlocked: [1],
  hiddenPattern: null,
  pro: false,
  referrals: 0,
  referralCode: randomCode(),
  proCountdownStart: Date.now(),
  hasShared: false,
  axiomMode: 'support',
  coachSession: null,
  coachHistory: [],
  inventory: {},
  identityCard: null,
  dreamBoard: [],
  legacyLetter: null,
  timeline: [],
  season: 1,
  seasonStart: new Date().toISOString(),
  lastSpinDate: null,
  lastStealthDate: null,
  lastEmergencyDate: null,
  dailyChallengeDate: null,
  ledgerVersion: 1,
  ledgerLastSync: null,
  ledgerEntries: [],
  economy: {
    current: { time: 180, attention: 100, willpower: 75 },
    maximum: { time: 180, attention: 100, willpower: 75 },
    regeneration: { timePerHour: 40, attentionPerHour: 18, willpowerPerHour: 12 },
    friction: { time: 8, attention: 5, willpower: 3 },
    lastUpdatedAt: new Date().toISOString(),
    debt: { time: 0, attention: 0, willpower: 0 },
    burnoutRisk: 0,
  },
  futureSelfCard: null,
  counterfactualRetrospectives: [],
  returnState: {
    lastActiveAt: new Date().toISOString(),
    absenceDays: 0,
    trigger: 'none',
    recoveryMode: 'light',
    reconfiguration: {
      dailyMissions: 3,
      preferredWindow: '08:00-12:00',
      allowRituals: true,
    },
    lastReturnMessage: 'Bem-vindo ao LifeScript. Esta é a sua linha do retorno.',
  },
  bioStatus: {
    heartRate: 68,
    sleepScore: 80,
    cognitiveDebt: 0,
    stressRatio: 0.1,
    hydrated: true,
    recordedAt: new Date().toISOString(),
  },
  climateContext: null,
  geofenceContext: null,
  darkMode: true,
  reminderTime: '08:00',
  notificationsEnabled: true,
  soundEnabled: true,
  theme: 'aurora',
  bossCycle: 0,
  lastBossDate: null,
};

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    // Defensive merge so new 2.0 fields appear on old data.
    return {
      ...INITIAL_STATE,
      ...parsed,
      areas: { ...DEFAULT_AREAS, ...(parsed.areas || {}) },
      inventory: { ...(parsed.inventory || {}) },
    };
  } catch {
    return INITIAL_STATE;
  }
}

export async function saveState(state: State): Promise<void> {
  try {
    // Keep state size bounded.
    const coachHistory = state.coachHistory.slice(-30);
    const missionArchive = state.missionArchive.slice(-200);
    const timeline = state.timeline.slice(-100);
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ ...state, coachHistory, missionArchive, timeline }),
    );
  } catch (e) {
    console.warn('saveState failed', e);
  }
}

export async function resetState(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  await AsyncStorage.removeItem('@lifescript_state_v1');
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function addTimeline(state: State, event: Omit<TimelineEvent, 'at'>): State {
  return {
    ...state,
    timeline: [...state.timeline, { ...event, at: new Date().toISOString() }],
  };
}

export function chapterForDay(dayIndex: number): number {
  // Day 1 -> Chapter 1, Day 2 -> 2, Day 3 -> 3, Day 4+ -> 4 (paywall)
  return Math.min(4, Math.max(1, dayIndex));
}

export function dayIndexSinceJoin(state: State): number {
  if (!state.joinDate) return 1;
  const joined = new Date(state.joinDate);
  const now = new Date();
  const ms = now.getTime() - joined.getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

export function lifeScore(state: State): number {
  // 0..1000 — 8-area avg (65%) + xp factor (25%) + streak factor (10%)
  const areaAvg = Object.values(state.areas).reduce((a, b) => a + b, 0) / 8;
  const xpFactor = Math.min(1, state.xp / 25000);
  const streakFactor = Math.min(1, state.streak / 60);
  return Math.round((areaAvg * 0.65 + xpFactor * 0.25 + streakFactor * 0.1) * 1000);
}
