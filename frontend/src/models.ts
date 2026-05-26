export type LifeArea =
  | 'Career'
  | 'Finances'
  | 'Health'
  | 'Relationships'
  | 'Mind'
  | 'Skills'
  | 'Purpose'
  | 'Legacy';

export const LIFE_AREAS: LifeArea[] = [
  'Career',
  'Finances',
  'Health',
  'Relationships',
  'Mind',
  'Skills',
  'Purpose',
  'Legacy',
];

export type LedgerEntryType =
  | 'manifesto'
  | 'mission'
  | 'reflection'
  | 'badge'
  | 'shadow'
  | 'letter'
  | 'boss'
  | 'clan'
  | 'self_version';

export type LedgerPrivacy = 'public' | 'secret';

export type EncryptedPayload = {
  iv: string;
  ciphertext: string;
};

export type StressEventType = 'predator' | 'scarcity' | 'distraction' | 'fatigue';

export type StressEventImpact = {
  timeDrain: number;
  attentionDrain: number;
  willpowerDrain: number;
  severity: 'low' | 'medium' | 'high';
  automaticMission: boolean;
};

export type StressEvent = {
  id: string;
  type: StressEventType;
  label: string;
  description: string;
  triggeredAt: string;
  impact: StressEventImpact;
  resolved: boolean;
  relatedMissionId?: string;
};

export type LedgerEntry = {
  id: string;
  createdAt: string;
  type: LedgerEntryType;
  title: string;
  body: string;
  meta: Record<string, any>;
  privacy: LedgerPrivacy;
  encrypted: boolean;
  payload?: EncryptedPayload;
  hash: string;
};

export type MissionKind =
  | 'daily'
  | 'boss'
  | 'clan'
  | 'ritual'
  | 'practice'
  | 'ecosystem'
  | 'return';

export type MissionCost = {
  time: number;
  attention: number;
  willpower: number;
};

export type MissionRecord = {
  id: string;
  kind: MissionKind;
  title: string;
  description: string;
  area: LifeArea;
  minutes: number;
  difficulty: number;
  cost: MissionCost;
  status: 'pending' | 'in_progress' | 'complete' | 'skipped' | 'variant';
  scheduledFor?: string;
  completedAt?: string;
  reflection?: string;
  note?: string;
  context?: string;
  createdAt: string;
};

export type EconomyTokens = {
  time: number;
  attention: number;
  willpower: number;
};

export type EconomyRates = {
  timePerHour: number;
  attentionPerHour: number;
  willpowerPerHour: number;
};

export type EconomyLimits = EconomyTokens;

export type EconomyState = {
  current: EconomyTokens;
  maximum: EconomyTokens;
  regeneration: EconomyRates;
  friction: EconomyTokens;
  lastUpdatedAt: string;
  debt: EconomyTokens;
  burnoutRisk: number;
};

export type FutureSelfCard = {
  generatedAt: string;
  dueAt: string;
  currentRoute: string;
  alternativeRoute: string;
  actions: Array<{
    title: string;
    duration: string;
    impact: string;
    area: LifeArea;
    minutes: number;
  }>;
  futureSelfMessage: string;
  versionLabel: string;
};

export type CounterfactualRetrospective = {
  id: string;
  generatedAt: string;
  baseWeek: string;
  realSummary: string;
  alternativeSummary: string;
  learning: string;
};

export type ReturnState = {
  lastActiveAt: string;
  absenceDays: number;
  trigger: 'personal' | 'work' | 'motivation' | 'emergency' | 'none';
  recoveryMode: 'light' | 'moderate' | 'supportive';
  reconfiguration: {
    dailyMissions: number;
    preferredWindow: string;
    allowRituals: boolean;
  };
  lastReturnMessage: string;
};

export type BioStatusSnapshot = {
  heartRate: number;
  sleepScore: number;
  cognitiveDebt: number;
  stressRatio: number;
  hydrated: boolean;
  recordedAt: string;
};

export type ClimateContext = {
  locationName: string;
  temperatureC: number;
  condition: string;
  weatherImpact: 'low' | 'medium' | 'high';
  updatedAt: string;
};

export type GeofenceEvent = {
  id: string;
  label: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  lastEnteredAt?: string;
  lastExitedAt?: string;
  active: boolean;
};

export type LedgerExportOptions = {
  include: Array<'manifesto' | 'letters' | 'reflections' | 'badges' | 'boss' | 'clan'>;
  format: 'json' | 'text';
};
