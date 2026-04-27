// API client for LifeScript backend.
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
  weekly_quest: {
    id: string;
    title: string;
    description: string;
    daily_steps: string[];
  };
  welcome_quote: string;
};

async function post<T>(path: string, body: unknown, timeoutMs = 35000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export function generateInitialPlan(profile: Profile): Promise<InitialPlan> {
  return post<InitialPlan>('/ai/initial-plan', {
    profile,
    day_index: 0,
    completed_missions: [],
  });
}

export function generateDailyQuote(profile: Profile, streak: number): Promise<{ quote: string; author: string }> {
  return post<{ quote: string; author: string }>('/ai/daily-quote', { profile, streak });
}

export function coachChat(payload: {
  profile: Profile;
  level: string;
  streak: number;
  total_xp: number;
  today_mission?: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  message: string;
  session_id?: string | null;
}): Promise<{ reply: string; session_id: string }> {
  return post<{ reply: string; session_id: string }>('/ai/coach-chat', payload);
}

export function generateBossBattle(profile: Profile, cycle: number): Promise<{
  title: string;
  narrative: string;
  days: { day: number; title: string; description: string; minutes: number }[];
  reward_badge: string;
}> {
  return post('/ai/boss-battle', { profile, cycle });
}

export function regenerateMission(profile: Profile, previous: string, reason: string): Promise<AIMission> {
  return post<AIMission>('/ai/regenerate-mission', {
    profile,
    previous_mission: previous,
    reason,
  });
}
