import * as SQLite from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { TemporalLogicEngine } from './temporalEngine';
import { State, INITIAL_STATE, loadState as loadLegacyState } from './state';
import { LedgerEntry, LedgerEntryType, StressEvent, EconomyState, FutureSelfCard } from './models';

const TASK_NAME = 'LifeScriptBackgroundSync';
const DB_NAME = 'lifescript.db';
const STATE_KEY = 'app_state';
const STATE_TABLE = 'app_state';
const LEDGER_TABLE = 'ledger_entries';

async function runQuery(db: SQLite.SQLiteDatabase, sql: string, params: (string | number | null)[] = []) {
  return db.runAsync(sql, params as any);
}

async function queryRows<T>(db: SQLite.SQLiteDatabase, sql: string, params: (string | number | null)[] = []): Promise<T[]> {
  return db.getAllAsync<T>(sql, params as any);
}

function openDatabase(): SQLite.SQLiteDatabase {
  return SQLite.openDatabaseSync(DB_NAME);
}

async function ensureTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await runQuery(db, `CREATE TABLE IF NOT EXISTS ${STATE_TABLE} (key TEXT PRIMARY KEY, value TEXT);`);
  await runQuery(
    db,
    `CREATE TABLE IF NOT EXISTS ${LEDGER_TABLE} (
      id TEXT PRIMARY KEY,
      type TEXT,
      title TEXT,
      body TEXT,
      meta TEXT,
      privacy TEXT,
      encrypted INTEGER,
      payload TEXT,
      createdAt TEXT,
      hash TEXT
    );`,
  );
}

async function loadStateFromDatabase(db: SQLite.SQLiteDatabase): Promise<State | null> {
  const rows = await queryRows<{ value: string }>(db, `SELECT value FROM ${STATE_TABLE} WHERE key = ?;`, [STATE_KEY]);
  if (rows.length > 0) {
    try {
      return JSON.parse(rows[0].value) as State;
    } catch {
      return null;
    }
  }
  const legacy = await loadLegacyState();
  return legacy;
}

async function saveStateToDatabase(db: SQLite.SQLiteDatabase, state: State): Promise<void> {
  await runQuery(db, `INSERT OR REPLACE INTO ${STATE_TABLE} (key, value) VALUES (?, ?);`, [STATE_KEY, JSON.stringify(state)]);
}

async function persistLedgerEntry(db: SQLite.SQLiteDatabase, entry: LedgerEntry): Promise<void> {
  await runQuery(
    db,
    `INSERT OR REPLACE INTO ${LEDGER_TABLE} (id, type, title, body, meta, privacy, encrypted, payload, createdAt, hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      entry.id,
      entry.type,
      entry.title,
      entry.body,
      JSON.stringify(entry.meta || {}),
      entry.privacy,
      entry.encrypted ? 1 : 0,
      entry.payload ? JSON.stringify(entry.payload) : null,
      entry.createdAt,
      entry.hash,
    ],
  );
}

function computeRegeneration(current: EconomyState, now: Date): EconomyState {
  const previous = new Date(current.lastUpdatedAt);
  const hours = Math.max(0, (now.getTime() - previous.getTime()) / 3600000);
  const refill = {
    time: Math.round(current.current.time + current.regeneration.timePerHour * hours),
    attention: Math.round(current.current.attention + current.regeneration.attentionPerHour * hours),
    willpower: Math.round(current.current.willpower + current.regeneration.willpowerPerHour * hours),
  };
  return {
    ...current,
    current: {
      time: Math.min(current.maximum.time, refill.time),
      attention: Math.min(current.maximum.attention, refill.attention),
      willpower: Math.min(current.maximum.willpower, refill.willpower),
    },
    burnoutRisk: Math.max(0, current.burnoutRisk - 0.01 * hours),
    lastUpdatedAt: now.toISOString(),
  };
}

function createEcosystemStressEntry(): LedgerEntry {
  const event: StressEvent = {
    id: `stress-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'distraction',
    label: 'Estresse de Ecossistema',
    description: 'O ambiente interno detectou uma queda silenciosa de foco. Ajuste uma missão de recuperação leve.',
    triggeredAt: new Date().toISOString(),
    impact: { timeDrain: 10, attentionDrain: 8, willpowerDrain: 6, severity: 'medium', automaticMission: false },
    resolved: false,
  };
  return {
    id: event.id,
    createdAt: event.triggeredAt,
    type: 'shadow',
    title: event.label,
    body: event.description,
    meta: { impact: event.impact, type: event.type },
    privacy: 'secret',
    encrypted: false,
    hash: `${event.id}:${event.label}:${event.triggeredAt}`,
  };
}

async function generateMonthlyLetterIfNeeded(state: State, engine: TemporalLogicEngine): Promise<State> {
  const now = new Date();
  const dueAt = state.futureSelfCard?.dueAt ? new Date(state.futureSelfCard.dueAt) : null;
  if (!dueAt || dueAt <= now) {
    const recent = state.missions.filter((m) => m.completed || m.date >= new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString());
    const profileName = state.profile?.name ?? 'usuário';
    const card = engine.buildMonthlyLetterPayload(
      profileName,
      recent as any,
      state.economy,
      state.timeline.map((event) => event.label),
    );
    return { ...state, futureSelfCard: card };
  }
  return state;
}

async function runDailyBackgroundCycle(): Promise<boolean> {
  const db = openDatabase();
  await ensureTables(db);
  const state = (await loadStateFromDatabase(db)) ?? INITIAL_STATE;
  const engine = new TemporalLogicEngine();
  const nextState: State = {
    ...state,
    economy: computeRegeneration(state.economy, new Date()),
  };
  const finalState = await generateMonthlyLetterIfNeeded(nextState, engine);
  await saveStateToDatabase(db, finalState);
  const stressEntry = createEcosystemStressEntry();
  await persistLedgerEntry(db, stressEntry);
  return true;
}

let taskRegistered = false;

export async function initializeBackgroundTasks(): Promise<void> {
  if (taskRegistered) return;

  // Background tasks are only available on native platforms (Android/iOS)
  try {
    if (!TaskManager || !BackgroundFetch) {
      console.log('BackgroundTasks: TaskManager or BackgroundFetch not available (expected on web)');
      return;
    }

    if (!TaskManager.isTaskDefined(TASK_NAME)) {
      TaskManager.defineTask(TASK_NAME, async () => {
        try {
          const success = await runDailyBackgroundCycle();
          return success ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
        } catch (error) {
          console.error('BackgroundTasks cycle failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 60 * 24,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    taskRegistered = true;
    console.log('BackgroundTasks registered successfully');
  } catch (error) {
    console.warn('BackgroundTasks registration error (safe to ignore on web):', error);
    taskRegistered = false;
  }
}
