// 50 levels across 5 Eras.
import { colors } from './theme';

export type Level = {
  id: number;
  name: string;
  minXP: number;
  icon: string;
  color: string;
  tagline: string;
  era: number;
};

export type Era = {
  id: number;
  name: string;
  subtitle: string;
  range: [number, number];
  palette: { bg: string; accent: string; highlight: string };
  icon: string;
  cinematic: string;
};

export const ERAS: Era[] = [
  {
    id: 1,
    name: 'The Awakening',
    subtitle: 'You discover yourself.',
    range: [1, 10],
    palette: { bg: '#1A0B2A', accent: '#A78BFA', highlight: '#F59E0B' },
    icon: 'partly-sunny',
    cinematic: 'Dawn is not a moment. Dawn is a decision.',
  },
  {
    id: 2,
    name: 'The Builder',
    subtitle: 'You take action.',
    range: [11, 20],
    palette: { bg: '#071930', accent: '#3B82F6', highlight: '#F9FAFB' },
    icon: 'hammer',
    cinematic: 'Every building you admire was once a hole in the ground.',
  },
  {
    id: 3,
    name: 'The Achiever',
    subtitle: 'Momentum is yours.',
    range: [21, 30],
    palette: { bg: '#0B2A1D', accent: '#10B981', highlight: '#F59E0B' },
    icon: 'trophy',
    cinematic: 'You are no longer becoming. You have become.',
  },
  {
    id: 4,
    name: 'The Leader',
    subtitle: 'You raise others.',
    range: [31, 40],
    palette: { bg: '#2A0912', accent: '#F43F5E', highlight: '#E5E7EB' },
    icon: 'flame',
    cinematic: 'Your shadow is longer than your shape.',
  },
  {
    id: 5,
    name: 'The Sovereign',
    subtitle: 'You write the rules.',
    range: [41, 50],
    palette: { bg: '#000000', accent: '#FFFFFF', highlight: '#C4B5FD' },
    icon: 'planet',
    cinematic: 'You are the author now.',
  },
];

function levelColor(id: number): string {
  if (id <= 10) return '#A78BFA';
  if (id <= 20) return '#3B82F6';
  if (id <= 30) return '#10B981';
  if (id <= 40) return '#F43F5E';
  return '#FFD700';
}

function levelName(id: number): string {
  const names = [
    '', 'Spark', 'Seeker', 'Wanderer', 'Initiate', 'Curious',     // 1-5
    'Questioner', 'Discoverer', 'Dreamer', 'Believer', 'Awake',  // 6-10
    'Apprentice', 'Framer', 'Doer', 'Craftsman', 'Artisan',       // 11-15
    'Maker', 'Architect', 'Engineer', 'Operator', 'Builder',      // 16-20
    'Ascending', 'Momentum', 'Relentless', 'Disciplined', 'Consistent', // 21-25
    'Compounding', 'Focused', 'Victorious', 'Champion', 'Achiever', // 26-30
    'Mentor', 'Voice', 'Catalyst', 'Influence', 'Signal',          // 31-35
    'Beacon', 'Commander', 'Strategist', 'Visionary', 'Leader',    // 36-40
    'Author', 'Sage', 'Oracle', 'Anchor', 'North Star',            // 41-45
    'Mythic', 'Legend', 'Sovereign', 'Eternal', 'LifeScript',      // 46-50
  ];
  return names[id] || `Level ${id}`;
}

function taglineFor(id: number): string {
  const taglines = [
    '', 'The seed is planted.', 'You search the path.', 'You wander on purpose.',
    'The door opens.', 'Your questions matter.', 'Clarity arrives.',
    'You find a pattern.', 'A dream becomes real.', 'Belief becomes body.',
    'You are awake.', 'You learn the craft.', 'You shape the first stone.',
    'Action replaces anxiety.', 'Your hands know now.', 'You make with intent.',
    'You build things that last.', 'You design the system.',
    'The engine is yours.', 'You run the operation.', 'The structure stands.',
    'You move upward.', 'Speed is a habit.', 'Nothing stops you.',
    'Discipline is freedom.', 'Every day is a rep.', 'Small things compound.',
    'Laser. Not flashlight.', 'The trophy is a memory.', 'They cheer your name.',
    'You achieved it.',
    'You guide the next person.', 'Your voice carries.',
    'You set things alight.', 'You shift the room.', 'You signal the way.',
    'They follow your light.', 'You lead the charge.', 'You see three moves ahead.',
    'You see the decade.', 'You are the leader.',
    'You author your life.', 'Wisdom is your tool.', 'You know what is coming.',
    'You hold the center.', 'They orient to you.', 'You become the myth.',
    'Legends are written about you.', 'You rule your life entirely.',
    'Time bends around you.', 'You are the script.',
  ];
  return taglines[id] || 'You rise.';
}

export const LEVELS: Level[] = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1;
  const era = Math.ceil(id / 10);
  // Quadratic XP curve — 200 XP for L2, scaling to ~50k for L50
  const minXP = Math.round(Math.pow(id - 1, 2.1) * 22);
  return {
    id,
    name: levelName(id),
    minXP,
    icon:
      id <= 10 ? 'sparkles-outline' :
      id <= 20 ? 'hammer-outline' :
      id <= 30 ? 'trophy-outline' :
      id <= 40 ? 'flame-outline' :
      'planet',
    color: levelColor(id),
    tagline: taglineFor(id),
    era,
  };
});

export function levelForXP(xp: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXP) current = l;
  return current;
}

export function nextLevel(xp: number): Level | null {
  for (const l of LEVELS) if (l.minXP > xp) return l;
  return null;
}

export function progressToNext(xp: number): number {
  const cur = levelForXP(xp);
  const nxt = nextLevel(xp);
  if (!nxt) return 1;
  return Math.min(1, (xp - cur.minXP) / (nxt.minXP - cur.minXP));
}

export function eraFor(level: Level): Era {
  return ERAS.find((e) => e.id === level.era) || ERAS[0];
}
