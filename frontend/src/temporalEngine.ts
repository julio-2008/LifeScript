import {ReturnState, CounterfactualRetrospective, FutureSelfCard, BioStatusSnapshot, StressEvent, ClimateContext, MissionRecord} from './models';
import {State, StoredMission} from './state';

function isoDate(date: Date): string {
  return date.toISOString();
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function summarizeMissionPerformance(missions: MissionRecord[]): { completed: number; skipped: number; averageDifficulty: number; energySpent: number } {
  const completed = missions.filter((mission) => mission.status === 'complete').length;
  const skipped = missions.filter((mission) => mission.status === 'skipped').length;
  const averageDifficulty = missions.length === 0 ? 0 : missions.reduce((sum, mission) => sum + mission.difficulty, 0) / missions.length;
  const energySpent = missions.reduce((sum, mission) => sum + mission.minutes, 0);
  return { completed, skipped, averageDifficulty, energySpent };
}

export class TemporalLogicEngine {
  public buildMonthlyLetterPayload(
    profileName: string,
    recentMissions: MissionRecord[],
    economy: { current: { time: number; attention: number; willpower: number }; burnoutRisk: number },
    timelineSummaries: string[],
  ): FutureSelfCard {
    const summary = summarizeMissionPerformance(recentMissions);
    const failureRate = recentMissions.length === 0 ? 0 : summary.skipped / recentMissions.length;
    const mood = failureRate > 0.25 ? 'com gentileza e precisão' : 'com clareza e agradecimento';
    const currentRoute = `Nas últimas 4 semanas, você completou ${summary.completed} de ${recentMissions.length} missões e gastou ${summary.energySpent} minutos de esforço profundo.`;
    const alternativeRoute = `Se você mantiver a disciplina com a energia disponível, as próximas 30 dias podem virar aprendizado consistente em vez de frustração.`;
    const actions = [
      {
        title: 'Revisar um rastro',
        duration: '15 min',
        impact: 'Torna automático o que você já começou a construir',
        area: 'Mind' as const,
        minutes: 15,
      },
      {
        title: 'Proteção energética',
        duration: '10 min',
        impact: 'Reduz a dívida cognitiva e recupera clareza',
        area: 'Health' as const,
        minutes: 10,
      },
      {
        title: 'Ancorar intenção',
        duration: '12 min',
        impact: 'Conecta seu manifesto ao próximo passo',
        area: 'Purpose' as const,
        minutes: 12,
      },
    ];
    const futureSelfMessage = `Olá ${profileName}, esta carta vem do próximo mês para lembrar que você não precisa esperar pela motivação — você precisa honrar a gentileza com a qual está construindo.`;
    return {
      generatedAt: isoDate(new Date()),
      dueAt: this.nextMonthlyLetterDate(),
      currentRoute,
      alternativeRoute,
      actions,
      futureSelfMessage,
      versionLabel: `mensal-${new Date().toISOString().slice(0, 10)}`,
    };
  }

  public nextMonthlyLetterDate(from = new Date()): string {
    const next = new Date(from);
    next.setUTCMonth(next.getUTCMonth() + 1);
    next.setUTCDate(1);
    next.setUTCHours(8, 0, 0, 0);
    return next.toISOString();
  }

  public generateCounterfactualRetrospective(
    state: State,
    rejectedMissions: StoredMission[],
  ): CounterfactualRetrospective {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const baseWeek = weekStart.toISOString().slice(0, 10);
    const realCompleted = state.missions.filter((mission) => mission.completed);
    const realSkipped = state.missions.filter((mission) => mission.completed === false && mission.date && mission.date <= new Date().toISOString());
    const realSummary = `Você concluiu ${realCompleted.length} missões reais e acumulou ${state.xp} XP no período.`;
    const alternativeSummary = rejectedMissions.length
      ? `Se você tivesse transformado ${rejectedMissions.length} recusas em contra-missões, a semana teria reservado mais energia focada e menos dívida cognitiva.`
      : 'Nenhuma missão recusada foi registrada, então a semana real é a melhor nota disponível.';
    const learning = rejectedMissions.length
      ? `A maior diferença está em como você reage à resistência: negociar a missão ou reescrever seu preço interno.`
      : 'A consistência aparece quando você vê cada missão como um contrato com sua identidade.';
    return {
      id: `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      generatedAt: isoDate(new Date()),
      baseWeek,
      realSummary,
      alternativeSummary,
      learning,
    };
  }

  public evaluateReturnState(state: State): ReturnState {
    const lastActive = state.lastCompletionDate ? state.lastCompletionDate : state.joinDate;
    const absenceDays = daysBetween(lastActive, new Date().toISOString());
    const trigger: ReturnState['trigger'] = absenceDays >= 5 ? 'personal' : absenceDays >= 3 ? 'motivation' : 'none';
    const recoveryMode: ReturnState['recoveryMode'] = absenceDays >= 7 ? 'supportive' : absenceDays >= 4 ? 'moderate' : 'light';
    return {
      ...state.returnState,
      lastActiveAt: lastActive,
      absenceDays,
      trigger,
      recoveryMode,
      lastReturnMessage:
        trigger === 'personal'
          ? 'Você ficou ausente por alguns dias. Quando voltar, vamos desacelerar sem culpa.'
          : 'Seu retorno será tratado como um novo início, com gentileza e clareza.',
    };
  }

  public buildLetterGraphPayload(
    state: State,
    climate: ClimateContext | null,
    bio: BioStatusSnapshot,
  ): { header: string; body: string; prompt: string } {
    const completed = state.missions.filter((mission) => mission.completed).length;
    const failed = state.missions.filter((mission) => !mission.completed).length;
    const header = `Resumo dos últimos 30 dias — ${completed} vitórias, ${failed} curas, taxa de resiliência ${Math.round((1 - failed / Math.max(1, completed + failed)) * 100)}%`;
    const body = `Seu corpo sinalizou ${bio.sleepScore}% de sono e cortisol leve. O clima local está ${climate?.condition ?? 'neutro'} com impacto ${climate?.weatherImpact ?? 'medium'}.`;
    const prompt = `Gere a Carta Mensal do Eu Futuro com tom ritualístico, usando: ${header}. ${body}. Foque em gratidão, dificuldade e uma pergunta central poderosa.`;
    return { header, body, prompt };
  }
}
