// Persistent state for LifeScript stored in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

export type StoredMission = {
  id: string;
  title: string;
  description: string;
  area: string;
  minutes: number;
  icon: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
};

export type WeeklyQuest = {
  id: string;
  title: string;
  description: string;
  daily_steps: string[];
  progress: boolean[]; // length 7
};

export type State = {
  // setup
  onboarded: boolean;
  profile: Profile | null;
  avatar: string;
  joinDate: string; // ISO

  // gamification
  xp: number;
  totalMissionsDone: number;
  streak: number;
  lastCompletionDate: string | null; // YYYY-MM-DD
  shields: number;
  badges: string[]; // badge ids

  // plan
  missions: StoredMission[];
  weeklyQuest: WeeklyQuest | null;
  welcomeQuote: string;
  dailyQuote: string;
  dailyQuoteDate: string | null;

  // life areas (0..1)
  areas: Record<string, number>;

  // social/pro
  pro: boolean;
  referrals: number;
  referralCode: string;
  proCountdownStart: number; // ms epoch — resets each visit

  // settings
  darkMode: boolean;
  reminderTime: string; // HH:MM
  hasShared: boolean;
  bossCycle: number;
  lastBossDate: string | null;

  // coach
  coachSession: string | null;
  coachHistory: { role: 'user' | 'assistant'; content: string }[];
};

export const DEFAULT_AREAS: Record<string, number> = {
  Career: 0.1,
  Finances: 0.1,
  Health: 0.1,
  Relationships: 0.1,
  Mind: 0.1,
  Skills: 0.1,
};

const KEY = '@lifescript_state_v1';

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const INITIAL_STATE: State = {
  onboarded: false,
  profile: null,
  avatar: '🦊',
  joinDate: new Date().toISOString(),
  xp: 0,
  totalMissionsDone: 0,
  streak: 0,
  lastCompletionDate: null,
  shields: 1,
  badges: [],
  missions: [],
  weeklyQuest: null,
  welcomeQuote: '',
  dailyQuote: '',
  dailyQuoteDate: null,
  areas: { ...DEFAULT_AREAS },
  pro: false,
  referrals: 0,
  referralCode: randomCode(),
  proCountdownStart: Date.now(),
  darkMode: true,
  reminderTime: '08:00',
  hasShared: false,
  bossCycle: 0,
  lastBossDate: null,
  coachSession: null,
  coachHistory: [],
};

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return INITIAL_STATE;
  }
}

export async function saveState(state: State): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('saveState failed', e);
  }
}

export async function resetState(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
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

export function lifeScore(state: State): number {
  // 0..1000 = average of life areas (60%) + xp factor (30%) + streak factor (10%)
  const areaAvg = Object.values(state.areas).reduce((a, b) => a + b, 0) / 6;
  const xpFactor = Math.min(1, state.xp / 6000);
  const streakFactor = Math.min(1, state.streak / 30);
  const raw = areaAvg * 0.6 + xpFactor * 0.3 + streakFactor * 0.1;
  return Math.round(raw * 1000);
}
