import {MissionRecord, LifeArea, StressEvent, StressEventImpact, ClimateContext, GeofenceEvent, EconomyState} from './models';
import {missionCostByDifficulty, normalizeToken, applyMissionCost} from './macro';

const ATTENTION_LOW_THRESHOLD = 30;
const WILLPOWER_LOW_THRESHOLD = 25;
const TIME_LOW_THRESHOLD = 45;

export class EcosystemStressEngine {
  public generatePredatorEvent(
    economy: EconomyState,
    climate: ClimateContext | null,
    geofence: GeofenceEvent | null,
  ): StressEvent | null {
    const attention = economy.current.attention;
    const willpower = economy.current.willpower;
    const time = economy.current.time;
    const severityScore = this.computeSeverity(economy, climate);
    if (attention > ATTENTION_LOW_THRESHOLD && willpower > WILLPOWER_LOW_THRESHOLD && time > TIME_LOW_THRESHOLD) {
      return null;
    }
    const type: StressEvent['type'] = attention < ATTENTION_LOW_THRESHOLD ? 'predator' : time < TIME_LOW_THRESHOLD ? 'scarcity' : 'distraction';
    const impact: StressEventImpact = {
      timeDrain: Math.round(10 + severityScore * 8),
      attentionDrain: Math.round(12 + severityScore * 10),
      willpowerDrain: Math.round(8 + severityScore * 6),
      severity: severityScore >= 0.7 ? 'high' : severityScore >= 0.4 ? 'medium' : 'low',
      automaticMission: true,
    };
    const label = type === 'predator' ? 'Predador da Atenção' : type === 'scarcity' ? 'Escassez de Tempo' : 'Distração Persistente';
    const description =
      type === 'predator'
        ? 'Algo externo está drenando sua atenção agora. Isso cria um evento que força foco ou corrige a fuga.'
        : type === 'scarcity'
        ? 'O tempo da sua semana está escasso. O sistema reage com uma missão de contenção.'
        : 'A mente está verde de distração. O Ecossistema exige um reforço corretivo imediato.';
    return {
      id: `stress-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      description,
      triggeredAt: new Date().toISOString(),
      impact,
      resolved: false,
    };
  }

  public createCorrectiveMission(event: StressEvent): MissionRecord {
    const area: LifeArea = event.type === 'predator' ? 'Mind' : event.type === 'scarcity' ? 'Purpose' : 'Health';
    const baseDifficulty = event.impact.severity === 'high' ? 4 : event.impact.severity === 'medium' ? 3 : 2;
    const mission: MissionRecord = {
      id: `corrective-${event.id}`,
      kind: 'ecosystem',
      title: event.type === 'predator' ? 'Confrontar a distração' : event.type === 'scarcity' ? 'Guardar tempo crítico' : 'Zelar pela clareza',
      description:
        event.type === 'predator'
          ? 'Responda ao predador de atenção com uma sessão de foco intenso e uma breve reflexão sobre a razão.'
          : event.type === 'scarcity'
          ? 'Reorganize um bloco pequeno de tempo para proteger a sua reserva de esforço.'
          : 'Execute uma prática de desaceleração que interrompe a distração e reconecta com você.',
      area,
      minutes: event.impact.severity === 'high' ? 25 : event.impact.severity === 'medium' ? 18 : 12,
      difficulty: baseDifficulty,
      cost: missionCostByDifficulty(baseDifficulty),
      status: 'pending',
      createdAt: new Date().toISOString(),
      context: `triggeredBy:${event.id}`,
    };
    return mission;
  }

  public applyStressImpact(economy: EconomyState, event: StressEvent): EconomyState {
    return {
      ...economy,
      current: {
        time: normalizeToken(economy.current.time - event.impact.timeDrain, economy.maximum.time),
        attention: normalizeToken(economy.current.attention - event.impact.attentionDrain, economy.maximum.attention),
        willpower: normalizeToken(economy.current.willpower - event.impact.willpowerDrain, economy.maximum.willpower),
      },
      burnoutRisk: Math.min(1, economy.burnoutRisk + (event.impact.severity === 'high' ? 0.07 : event.impact.severity === 'medium' ? 0.04 : 0.02)),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  private computeSeverity(economy: EconomyState, climate: ClimateContext | null): number {
    const attentionFactor = 1 - economy.current.attention / economy.maximum.attention;
    const willpowerFactor = 1 - economy.current.willpower / economy.maximum.willpower;
    const timeFactor = 1 - economy.current.time / economy.maximum.time;
    const climateFactor = climate?.weatherImpact === 'high' ? 0.15 : climate?.weatherImpact === 'medium' ? 0.08 : 0.03;
    return Math.min(1, Math.max(0, (attentionFactor + willpowerFactor + timeFactor) / 3 + climateFactor));
  }
}
