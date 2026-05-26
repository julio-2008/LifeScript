// LifeScript 2.0 API client.
import { Profile } from './state';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export type AIMission = {
  id: string;
  title: string;
  description: string;
  area: string;
  minutes: number;
  icon: string;
};

export type InitialPlan = {
  missions: AIMission[];
  weekly_quest: { id: string; title: string; description: string; daily_steps: string[] };
  welcome_quote: string;
};

async function post<T>(path: string, body: unknown, timeoutMs = 40000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  } finally { clearTimeout(t); }
}

export const api = {
  initialPlan: (profile: Profile) =>
    post<InitialPlan>('/ai/initial-plan', { profile, day_index: 0, completed_missions: [] }),
  dailyQuote: (profile: Profile, streak: number) =>
    post<{ quote: string; author: string }>('/ai/daily-quote', { profile, streak }),
  coachChat: (payload: {
    profile: Profile;
    level: string;
    streak: number;
    total_xp: number;
    today_mission?: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    message: string;
    session_id?: string | null;
    mode: 'hard' | 'support' | 'strategist' | 'philosopher' | 'silent';
    recent_reflections?: string[];
    recent_missions?: string[];
  }) => post<{ reply: string; session_id: string }>('/ai/coach-chat', payload),
  bossBattle: (profile: Profile, cycle: number) =>
    post<{ title: string; narrative: string; days: { day: number; title: string; description: string; minutes: number }[]; reward_badge: string }>(
      '/ai/boss-battle', { profile, cycle },
    ),
  sideQuests: (profile: Profile, neglected_areas: string[]) =>
    post<{ missions: AIMission[] }>('/ai/side-quests', { profile, neglected_areas }),
  stealthMission: (profile: Profile, current_level: string) =>
    post<AIMission>('/ai/stealth-mission', { profile, current_level }),
  dailyChallenge: (day: string) =>
    post<{ title: string; description: string; icon: string; participants: number }>('/ai/daily-challenge', { day }),
  hiddenPattern: (profile: Profile) =>
    post<{ title: string; insight: string }>('/ai/hidden-pattern', { profile }),
  identityCard: (payload: {
    profile: Profile; level: string; streak: number;
    total_missions: number; top_areas: string[]; recent_reflections?: string[];
  }) => post<{ statement: string; percent_progress: number }>('/ai/identity-card', payload),
  weeklyInsight: (payload: {
    profile: Profile; area_scores: Record<string, number>; streak: number;
    missions_last_7_days: number; neglected_areas: string[];
  }) => post<{ diagnosis: string; challenge: string; quote: string }>('/ai/weekly-insight', payload),
  reflectionQuestion: (profile: Profile, mission_title: string, area: string) =>
    post<{ question: string }>('/ai/reflection-question', { profile, mission_title, area }),
  regenerateMission: (profile: Profile, previous_mission: string, reason: string) =>
    post<AIMission>('/ai/regenerate-mission', { profile, previous_mission, reason }),
  chapterMessage: (profile: Profile, chapter: number) =>
    post<{ headline: string; body: string; cliffhanger: string }>('/ai/chapter-message', { profile, chapter }),
  futureSelf: (payload: {
    profile: Profile;
    level: string;
    streak: number;
    total_missions_done: number;
    missions_skipped: number;
    life_score: number;
    strongest_area?: string;
    weakest_area?: string;
    identity_statement?: string;
    recent_reflections?: string[];
    recent_missions?: string[];
  }) => post<{
    current_route: string;
    alternative_route: string;
    actions: { title: string; duration: string; impact: string; area: string; icon: string; minutes: number }[];
    future_self_message: string;
  }>('/ai/future-self', payload, 60000),
};
