import {IdentityLedgerStore} from './ledger';
import {MissionRecord} from './models';
import {
  EconomyState,
  MissionCost,
  LedgerEntry,
} from './models';
import {
  canAfford,
  applyMissionCost,
  normalizeToken,
  missionCostByDifficulty,
} from './macro';

const EXECUTION_REWARD_MULTIPLIER = 0.18;
const COGNITIVE_DEBT_PENALTY = { time: 8, attention: 12, willpower: 10 };

export class EconomyController {
  private ledger: IdentityLedgerStore;

  constructor(ledger: IdentityLedgerStore) {
    this.ledger = ledger;
  }

  public costForMission(mission: MissionRecord): MissionCost {
    if (mission.cost) return mission.cost;
    return missionCostByDifficulty(mission.difficulty);
  }

  public canAffordMission(economy: EconomyState, mission: MissionRecord): boolean {
    const cost = this.costForMission(mission);
    return canAfford(economy, cost);
  }

  public reserveMission(economy: EconomyState, mission: MissionRecord): EconomyState {
    const cost = this.costForMission(mission);
    if (!canAfford(economy, cost)) {
      return economy;
    }
    const next = applyMissionCost(economy, cost);
    return next;
  }

  public completeMission(
    economy: EconomyState,
    mission: MissionRecord,
  ): { economy: EconomyState; reward: MissionCost; xp: number } {
    const cost = this.costForMission(mission);
    const reward: MissionCost = {
      time: Math.round(cost.time * EXECUTION_REWARD_MULTIPLIER),
      attention: Math.round(cost.attention * EXECUTION_REWARD_MULTIPLIER),
      willpower: Math.round(cost.willpower * EXECUTION_REWARD_MULTIPLIER),
    };
    const next: EconomyState = {
      ...economy,
      current: {
        time: normalizeToken(economy.current.time + reward.time, economy.maximum.time),
        attention: normalizeToken(economy.current.attention + reward.attention, economy.maximum.attention),
        willpower: normalizeToken(economy.current.willpower + reward.willpower, economy.maximum.willpower),
      },
      burnoutRisk: Math.max(0, economy.burnoutRisk - 0.01 * cost.willpower),
      lastUpdatedAt: new Date().toISOString(),
    };
    const xp = cost.time + cost.attention + cost.willpower;
    return { economy: next, reward, xp };
  }

  public penalizeAvoidance(economy: EconomyState, mission: MissionRecord): EconomyState {
    const cost = this.costForMission(mission);
    const penalty = {
      time: Math.round(COGNITIVE_DEBT_PENALTY.time + cost.time * 0.06),
      attention: Math.round(COGNITIVE_DEBT_PENALTY.attention + cost.attention * 0.08),
      willpower: Math.round(COGNITIVE_DEBT_PENALTY.willpower + cost.willpower * 0.05),
    };
    return {
      ...economy,
      current: {
        time: normalizeToken(economy.current.time - penalty.time, economy.maximum.time),
        attention: normalizeToken(economy.current.attention - penalty.attention, economy.maximum.attention),
        willpower: normalizeToken(economy.current.willpower - penalty.willpower, economy.maximum.willpower),
      },
      debt: {
        time: economy.debt.time + penalty.time * 0.1,
        attention: economy.debt.attention + penalty.attention * 0.1,
        willpower: economy.debt.willpower + penalty.willpower * 0.1,
      },
      burnoutRisk: Math.min(1, economy.burnoutRisk + 0.04),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  public async commitMissionTransaction(
    economy: EconomyState,
    mission: MissionRecord,
  ): Promise<{ economy: EconomyState; missionEntry: LedgerEntry }> {
    const cost = this.costForMission(mission);
    const next = applyMissionCost(economy, cost);
    const entry = await this.ledger.appendEntry({
      type: 'mission',
      title: `Reserva de missão: ${mission.title}`,
      body: JSON.stringify({ mission, cost, event: 'reserve' }),
      meta: { missionId: mission.id, action: 'reserve' },
      privacy: 'secret',
      encrypted: false,
    });
    return { economy: next, missionEntry: entry };
  }

  public async rewardMissionCompletion(
    economy: EconomyState,
    mission: MissionRecord,
  ): Promise<{ economy: EconomyState; xpAwarded: number; ledgerEntry: LedgerEntry }> {
    const { economy: nextEconomy, xp } = this.completeMission(economy, mission);
    const entry = await this.ledger.appendEntry({
      type: 'mission',
      title: `Conclusão de missão: ${mission.title}`,
      body: JSON.stringify({ mission, xp, event: 'complete' }),
      meta: { missionId: mission.id, xp },
      privacy: 'secret',
      encrypted: false,
    });
    return { economy: nextEconomy, xpAwarded: xp, ledgerEntry: entry };
  }

  public async registerAvoidance(
    economy: EconomyState,
    mission: MissionRecord,
    reason: string,
  ): Promise<{ economy: EconomyState; ledgerEntry: LedgerEntry }> {
    const nextEconomy = this.penalizeAvoidance(economy, mission);
    const entry = await this.ledger.appendEntry({
      type: 'reflection',
      title: `Débito cognitivo: ${mission.title}`,
      body: JSON.stringify({ mission, reason, event: 'avoidance' }),
      meta: { missionId: mission.id, reason },
      privacy: 'secret',
      encrypted: true,
    });
    return { economy: nextEconomy, ledgerEntry: entry };
  }

  public heatIndex(economy: EconomyState): number {
    const timeRatio = 1 - economy.current.time / economy.maximum.time;
    const attentionRatio = 1 - economy.current.attention / economy.maximum.attention;
    const willRatio = 1 - economy.current.willpower / economy.maximum.willpower;
    return normalizeToken((timeRatio + attentionRatio + willRatio + economy.burnoutRisk) / 4, 1);
  }

  public async storeEconomySnapshot(economy: EconomyState): Promise<LedgerEntry> {
    return this.ledger.appendEntry({
      type: 'self_version',
      title: 'Snapshot da macroeconomia',
      body: JSON.stringify({ economy, recordedAt: new Date().toISOString() }),
      meta: { snapshot: true },
      privacy: 'public',
      encrypted: false,
    });
  }
}
