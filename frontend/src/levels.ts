// Level definitions for the LifeScript progression system.
import { colors } from './theme';

export type Level = {
  id: number;
  name: string;
  minXP: number;
  icon: string; // ionicons name
  color: string;
  tagline: string;
};

export const LEVELS: Level[] = [
  { id: 1, name: 'Beginner',  minXP: 0,    icon: 'leaf-outline',     color: colors.green,    tagline: 'The seed is planted.' },
  { id: 2, name: 'Seeker',    minXP: 250,  icon: 'compass-outline',  color: colors.blue,     tagline: 'You search the path.' },
  { id: 3, name: 'Builder',   minXP: 700,  icon: 'hammer-outline',   color: colors.primary,  tagline: 'Brick by brick.' },
  { id: 4, name: 'Achiever',  minXP: 1500, icon: 'trophy-outline',   color: colors.gold,     tagline: 'Victories accumulate.' },
  { id: 5, name: 'Legend',    minXP: 3000, icon: 'flame',            color: colors.pink,     tagline: 'Your name echoes.' },
  { id: 6, name: 'Sovereign', minXP: 6000, icon: 'planet',           color: '#FFD700',       tagline: 'You write the rules.' },
];

export function levelForXP(xp: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXP) current = l;
  }
  return current;
}

export function nextLevel(xp: number): Level | null {
  for (const l of LEVELS) {
    if (l.minXP > xp) return l;
  }
  return null;
}

export function progressToNext(xp: number): number {
  const cur = levelForXP(xp);
  const nxt = nextLevel(xp);
  if (!nxt) return 1;
  return Math.min(1, (xp - cur.minXP) / (nxt.minXP - cur.minXP));
}
