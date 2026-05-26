import {
  EconomyState,
  EconomyTokens,
  EconomyRates,
  EconomyLimits,
  FutureSelfCard,
  MissionCost,
  MissionRecord,
  CounterfactualRetrospective,
  BioStatusSnapshot,
  ReturnState,
} from './models';

const BASE_MAX: EconomyLimits = {
  time: 180,
  attention: 100,
  willpower: 75,
};

const BASE_REGEN: EconomyRates = {
  timePerHour: 40,
  attentionPerHour: 18,
  willpowerPerHour: 12,
};

export const INITIAL_ECONOMY_STATE: EconomyState = {
  current: { ...BASE_MAX },
  maximum: { ...BASE_MAX },
  regeneration: { ...BASE_REGEN },
  friction: { time: 8, attention: 5, willpower: 3 },
  lastUpdatedAt: new Date().toISOString(),
  debt: { time: 0, attention: 0, willpower: 0 },
  burnoutRisk: 0,
};

export function normalizeToken(value: number, limit: number): number {
  return Math.max(0, Math.min(limit, value));
}

export function missionCostByDifficulty(difficulty: number): MissionCost {
  return {
    time: Math.round(15 + difficulty * 6),
    attention: Math.round(12 + difficulty * 4),
    willpower: Math.round(8 + difficulty * 3),
  };
}

export function computeMissionCost(mission: MissionRecord): MissionCost {
  return {
    time: mission.minutes,
    attention: Math.round(mission.difficulty * 5 + mission.minutes * 0.2),
    willpower: Math.round(mission.difficulty * 3 + mission.minutes * 0.1),
  };
}

export function canAfford(economy: EconomyState, cost: MissionCost): boolean {
  return (
    economy.current.time >= cost.time &&
    economy.current.attention >= cost.attention &&
    economy.current.willpower >= cost.willpower
  );
}

export function applyMissionCost(economy: EconomyState, cost: MissionCost): EconomyState {
  return {
    ...economy,
    current: {
      time: normalizeToken(economy.current.time - cost.time, economy.maximum.time),
      attention: normalizeToken(economy.current.attention - cost.attention, economy.maximum.attention),
      willpower: normalizeToken(economy.current.willpower - cost.willpower, economy.maximum.willpower),
    },
    debt: {
      time: economy.debt.time + Math.max(0, cost.time - economy.current.time),
      attention: economy.debt.attention + Math.max(0, cost.attention - economy.current.attention),
      willpower: economy.debt.willpower + Math.max(0, cost.willpower - economy.current.willpower),
    },
    burnoutRisk: Math.min(1, economy.burnoutRisk + 0.02 * (cost.attention / 10 + cost.willpower / 5)),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function regenerateEconomy(economy: EconomyState, now = new Date()): EconomyState {
  const elapsedHours = Math.max(0, (now.getTime() - new Date(economy.lastUpdatedAt).getTime()) / 3600000);
  const recovered: EconomyTokens = {
    time: normalizeToken(economy.current.time + economy.regeneration.timePerHour * elapsedHours, economy.maximum.time),
    attention: normalizeToken(economy.current.attention + economy.regeneration.attentionPerHour * elapsedHours, economy.maximum.attention),
    willpower: normalizeToken(economy.current.willpower + economy.regeneration.willpowerPerHour * elapsedHours, economy.maximum.willpower),
  };
  const riskReduction = Math.max(0, economy.burnoutRisk - elapsedHours * 0.02);
  return {
    ...economy,
    current: recovered,
    burnoutRisk: riskReduction,
    lastUpdatedAt: now.toISOString(),
  };
}

export function adjustEconomyForBioStatus(economy: EconomyState, bio: BioStatusSnapshot): EconomyState {
  const timePenalty = bio.cognitiveDebt * 0.5;
  const attentionPenalty = bio.stressRatio * 6;
  const willpowerPenalty = bio.sleepScore < 60 ? 10 : 0;
  return {
    ...economy,
    current: {
      time: normalizeToken(economy.current.time - timePenalty, economy.maximum.time),
      attention: normalizeToken(economy.current.attention - attentionPenalty, economy.maximum.attention),
      willpower: normalizeToken(economy.current.willpower - willpowerPenalty, economy.maximum.willpower),
    },
    burnoutRisk: Math.min(1, economy.burnoutRisk + bio.stressRatio * 0.03),
    lastUpdatedAt: bio.recordedAt,
  };
}

export function nextMonthlyLetterDate(from = new Date()): string {
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(1);
  next.setUTCHours(8, 0, 0, 0);
  return next.toISOString();
}

export function createFutureSelfCard(
  userId: string,
  baseSummary: string,
  alternativeSummary: string,
  actions: FutureSelfCard['actions'],
  futureMessage: string,
): FutureSelfCard {
  return {
    generatedAt: new Date().toISOString(),
    dueAt: nextMonthlyLetterDate(),
    currentRoute: baseSummary,
    alternativeRoute: alternativeSummary,
    actions,
    futureSelfMessage: futureMessage,
    versionLabel: `v-${Date.now()}`,
  };
}

export function captureCounterfactualRetrospective(
  baseWeek: string,
  realSummary: string,
  alternativeSummary: string,
  learning: string,
): CounterfactualRetrospective {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: new Date().toISOString(),
    baseWeek,
    realSummary,
    alternativeSummary,
    learning,
  };
}

export function createReturnState(trigger: ReturnState['trigger']): ReturnState {
  return {
    lastActiveAt: new Date().toISOString(),
    absenceDays: 0,
    trigger,
    recoveryMode: trigger === 'emergency' ? 'supportive' : 'moderate',
    reconfiguration: {
      dailyMissions: 2,
      preferredWindow: '08:00-12:00',
      allowRituals: true,
    },
    lastReturnMessage: '',
  };
}

export function updateReturnState(returnState: ReturnState, daysAbsent: number): ReturnState {
  const recoveryMode = daysAbsent >= 5 ? 'supportive' : daysAbsent >= 3 ? 'moderate' : 'light';
  return {
    ...returnState,
    absenceDays: daysAbsent,
    recoveryMode,
    lastReturnMessage:
      recoveryMode === 'supportive'
        ? 'Você voltou. Aqui não há culpa — só um mapa renovado.'
        : 'Pronto para retomar com um passo mais suave.'
  };
}
