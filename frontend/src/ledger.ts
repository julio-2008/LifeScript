import AsyncStorage from '@react-native-async-storage/async-storage';
const CryptoJS: any = require('crypto-js');
import {LedgerEntry, LedgerEntryType, LedgerExportOptions, EncryptedPayload} from './models';

const LEDGER_KEY = '@lifescript_ledger_v1';
const LEDGER_SECRET_SALT = 'lifescript-ledger-secret';

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function computeHash(value: string): string {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

function deriveEncryptionKey(secret: string): string {
  return CryptoJS.PBKDF2(secret, LEDGER_SECRET_SALT, {
    keySize: 256 / 32,
    iterations: 1200,
  }).toString();
}

function encryptPayload(payload: string, secret: string): EncryptedPayload {
  const key = CryptoJS.enc.Hex.parse(deriveEncryptionKey(secret));
  const iv = CryptoJS.lib.WordArray.random(16);
  const ciphertext = CryptoJS.AES.encrypt(payload, key, { iv }).toString();
  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext,
  };
}

function decryptPayload(payload: EncryptedPayload, secret: string): string {
  const key = CryptoJS.enc.Hex.parse(deriveEncryptionKey(secret));
  const iv = CryptoJS.enc.Hex.parse(payload.iv);
  const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, { iv });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

type LedgerDocument = {
  entries: LedgerEntry[];
  updatedAt: string;
};

export class IdentityLedgerStore {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  private async loadDocument(): Promise<LedgerDocument> {
    const raw = await AsyncStorage.getItem(LEDGER_KEY);
    if (!raw) {
      return { entries: [], updatedAt: new Date().toISOString() };
    }
    try {
      return JSON.parse(raw) as LedgerDocument;
    } catch {
      return { entries: [], updatedAt: new Date().toISOString() };
    }
  }

  private async persistDocument(document: LedgerDocument): Promise<void> {
    await AsyncStorage.setItem(LEDGER_KEY, JSON.stringify(document));
  }

  public async appendEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash'>): Promise<LedgerEntry> {
    const document = await this.loadDocument();
    const body = entry.encrypted ? JSON.stringify(entry.payload) : entry.body;
    const hash = computeHash(`${entry.type}:${body}:${Date.now()}`);
    const fullEntry: LedgerEntry = {
      ...entry,
      id: `${Date.now()}-${randomId()}`,
      createdAt: new Date().toISOString(),
      hash,
    };
    document.entries.unshift(fullEntry);
    document.updatedAt = new Date().toISOString();
    await this.persistDocument(document);
    return fullEntry;
  }

  public async appendEncryptedEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'hash' | 'encrypted' | 'payload'>): Promise<LedgerEntry> {
    const payloadText = JSON.stringify({ title: entry.title, body: entry.body, meta: entry.meta });
    const encrypted = encryptPayload(payloadText, this.secret);
    return this.appendEntry({
      ...entry,
      body: '',
      payload: encrypted,
      encrypted: true,
    });
  }

  public async queryEntries(filter?: {
    type?: LedgerEntryType;
    privacy?: LedgerEntry['privacy'];
    since?: string;
  }): Promise<LedgerEntry[]> {
    const document = await this.loadDocument();
    let items = document.entries;
    if (filter?.type) items = items.filter((entry) => entry.type === filter.type);
    if (filter?.privacy) items = items.filter((entry) => entry.privacy === filter.privacy);
    const since = filter?.since;
    if (since) items = items.filter((entry) => entry.createdAt >= since);
    return items;
  }

  public async decryptEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    if (!entry.encrypted || !entry.payload) return entry;
    const decrypted = decryptPayload(entry.payload, this.secret);
    const parsed = JSON.parse(decrypted) as { title: string; body: string; meta: Record<string, any> };
    return {
      ...entry,
      title: parsed.title,
      body: parsed.body,
      meta: parsed.meta,
    };
  }

  public async exportLedger(options: LedgerExportOptions): Promise<string> {
    const document = await this.loadDocument();
    const entries = document.entries.filter((entry) => options.include.includes(entry.type as any));
    if (options.format === 'json') {
      return JSON.stringify(entries, null, 2);
    }
    return entries
      .map((entry) => `---\n${entry.type.toUpperCase()} • ${entry.title}\n${entry.createdAt}\n${entry.body}\n${JSON.stringify(entry.meta)}\n`)
      .join('\n');
  }

  public async clearLedger(): Promise<void> {
    await AsyncStorage.removeItem(LEDGER_KEY);
  }
}
