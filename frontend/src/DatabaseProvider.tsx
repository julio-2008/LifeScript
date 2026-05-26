import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { State, INITIAL_STATE, loadState as loadLegacyState } from './state';
import { LedgerEntry, LedgerEntryType, LedgerPrivacy, EncryptedPayload, EconomyState } from './models';

const DB_NAME = 'lifescript.db';
const STATE_KEY = 'app_state';
const LEDGER_TABLE = 'ledger_entries';
const STATE_TABLE = 'app_state';

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export type DatabaseContextValue = {
  db: SQLite.SQLiteDatabase;
  appState: State;
  loading: boolean;
  setAppState: (next: State) => Promise<void>;
  appendLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash'>) => Promise<LedgerEntry>;
  queryLedgerEntries: (filter?: { type?: LedgerEntryType; privacy?: LedgerPrivacy; since?: string }) => Promise<LedgerEntry[]>;
  saveEconomy: (economy: EconomyState) => Promise<void>;
};

async function runQuery(db: SQLite.SQLiteDatabase, sql: string, params: (string | number | null)[] = []) {
  return db.runAsync(sql, params as any);
}

async function queryRows<T>(db: SQLite.SQLiteDatabase, sql: string, params: (string | number | null)[] = []): Promise<T[]> {
  return db.getAllAsync<T>(sql, params as any);
}

function openDatabase(): SQLite.SQLiteDatabase {
  return SQLite.openDatabaseSync(DB_NAME);
}

export class DatabaseLedgerStore {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  private async ensureLedgerTable(): Promise<void> {
    await runQuery(
      this.db,
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

  public async appendEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash'>): Promise<LedgerEntry> {
    await this.ensureLedgerTable();
    const newEntry: LedgerEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      hash: `${entry.type}:${entry.body}:${Date.now()}`,
    };
    await runQuery(
      this.db,
      `INSERT OR REPLACE INTO ${LEDGER_TABLE} (id, type, title, body, meta, privacy, encrypted, payload, createdAt, hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newEntry.id,
        newEntry.type,
        newEntry.title,
        newEntry.body,
        JSON.stringify(newEntry.meta || {}),
        newEntry.privacy,
        newEntry.encrypted ? 1 : 0,
        newEntry.payload ? JSON.stringify(newEntry.payload) : null,
        newEntry.createdAt,
        newEntry.hash,
      ],
    );
    return newEntry;
  }

  public async appendEncryptedEntry(
    entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash' | 'encrypted'> & { payload: EncryptedPayload },
  ): Promise<LedgerEntry> {
    return this.appendEntry({
      ...entry,
      body: '',
      encrypted: true,
      payload: entry.payload,
    });
  }

  public async queryEntries(filter?: {
    type?: LedgerEntryType;
    privacy?: LedgerPrivacy;
    since?: string;
  }): Promise<LedgerEntry[]> {
    await this.ensureLedgerTable();
    let sql = `SELECT * FROM ${LEDGER_TABLE}`;
    const clauses: string[] = [];
    const values: (string | number)[] = [];
    if (filter?.type) {
      clauses.push('type = ?');
      values.push(filter.type);
    }
    if (filter?.privacy) {
      clauses.push('privacy = ?');
      values.push(filter.privacy);
    }
    if (filter?.since) {
      clauses.push('createdAt >= ?');
      values.push(filter.since);
    }
    if (clauses.length) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    sql += ' ORDER BY createdAt DESC;';
    const rows = await queryRows<any>(this.db, sql, values);
    return rows.map((raw: any) => ({
      id: raw.id,
      type: raw.type,
      title: raw.title,
      body: raw.body,
      meta: JSON.parse(raw.meta || '{}'),
      privacy: raw.privacy,
      encrypted: raw.encrypted === 1,
      payload: raw.payload ? JSON.parse(raw.payload) : undefined,
      createdAt: raw.createdAt,
      hash: raw.hash,
    }));
  }

  public async decryptEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    if (!entry.encrypted || !entry.payload) return entry;
    return {
      ...entry,
      body: entry.body || '',
    };
  }

  public async exportLedger(options: { include: LedgerEntryType[]; format: 'json' | 'txt' }): Promise<string> {
    const entries = await this.queryEntries();
    const filtered = entries.filter((entry) => options.include.includes(entry.type));
    if (options.format === 'json') return JSON.stringify(filtered, null, 2);
    return filtered
      .map((entry) => `---\n${entry.type.toUpperCase()} • ${entry.title}\n${entry.createdAt}\n${entry.body}\n${JSON.stringify(entry.meta)}\n`)
      .join('\n');
  }

  public async clearLedger(): Promise<void> {
    await this.ensureLedgerTable();
    await runQuery(this.db, `DELETE FROM ${LEDGER_TABLE};`);
  }
}

async function ensureStateTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await runQuery(db, `CREATE TABLE IF NOT EXISTS ${STATE_TABLE} (key TEXT PRIMARY KEY, value TEXT);`);
}

async function loadStateFromDatabase(db: SQLite.SQLiteDatabase): Promise<State | null> {
  await ensureStateTable(db);
  const rows = await queryRows<{ value: string }>(db, `SELECT value FROM ${STATE_TABLE} WHERE key = ?;`, [STATE_KEY]);
  if (rows.length > 0) {
    try {
      return JSON.parse(rows[0].value) as State;
    } catch {
      return null;
    }
  }
  return null;
}

async function saveStateToDatabase(db: SQLite.SQLiteDatabase, state: State): Promise<void> {
  await ensureStateTable(db);
  await runQuery(db, `INSERT OR REPLACE INTO ${STATE_TABLE} (key, value) VALUES (?, ?);`, [STATE_KEY, JSON.stringify(state)]);
}

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  // Temporarily disabled database provider - will be reimplemented
  return <>{children}</>;
}
