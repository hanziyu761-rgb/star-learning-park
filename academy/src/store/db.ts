import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Learner, LearningEvent, Work, ParentSettings, SafetyEvent } from './types';
import { DEFAULT_SETTINGS } from './types';

// The academy keeps its own IndexedDB database. It never writes to the legacy
// app's localStorage key "star-adventure-v4".
export const DB_NAME = 'ai-academy';
export const DB_VERSION = 1;

interface AcademyDB extends DBSchema {
  learners: { key: string; value: Learner };
  events: { key: string; value: LearningEvent; indexes: { byLearner: string; byLearnerLesson: [string, string] } };
  works: { key: string; value: Work; indexes: { byLearner: string } };
  settings: { key: string; value: unknown };
  safety: { key: string; value: SafetyEvent };
}

let dbPromise: Promise<IDBPDatabase<AcademyDB>> | null = null;

export function db(): Promise<IDBPDatabase<AcademyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AcademyDB>(DB_NAME, DB_VERSION, {
      upgrade(d) {
        d.createObjectStore('learners', { keyPath: 'id' });
        const ev = d.createObjectStore('events', { keyPath: 'id' });
        ev.createIndex('byLearner', 'learnerId');
        ev.createIndex('byLearnerLesson', ['learnerId', 'lessonId']);
        const works = d.createObjectStore('works', { keyPath: 'id' });
        works.createIndex('byLearner', 'learnerId');
        d.createObjectStore('settings');
        d.createObjectStore('safety', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

/** For tests: forget the open connection. */
export async function resetDbConnection(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}

export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    try { return c.randomUUID(); } catch { /* insecure context */ }
  }
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- learners ----------
export async function listLearners(): Promise<Learner[]> {
  return (await (await db()).getAll('learners')).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function saveLearner(l: Learner): Promise<void> { await (await db()).put('learners', l); }
export async function getActiveLearnerId(): Promise<string | null> {
  return ((await (await db()).get('settings', 'activeLearner')) as string | undefined) ?? null;
}
export async function setActiveLearnerId(id: string): Promise<void> { await (await db()).put('settings', id, 'activeLearner'); }

// ---------- events (append-only) ----------
export async function appendEvent(e: LearningEvent): Promise<void> {
  // add() refuses an existing id, so recorded events cannot be overwritten.
  await (await db()).add('events', e);
}
export async function eventsForLearner(learnerId: string): Promise<LearningEvent[]> {
  return (await (await db()).getAllFromIndex('events', 'byLearner', learnerId)).sort((a, b) => a.at.localeCompare(b.at));
}

// ---------- works ----------
export async function saveWork(w: Work): Promise<void> { await (await db()).put('works', w); }
export async function worksForLearner(learnerId: string): Promise<Work[]> {
  return (await (await db()).getAllFromIndex('works', 'byLearner', learnerId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ---------- parent settings ----------
export async function getSettings(): Promise<ParentSettings> {
  const s = (await (await db()).get('settings', 'parent')) as Partial<ParentSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(s ?? {}), voiceInput: false, imageUpload: false, sharing: false, accompaniedMode: false };
}
export async function saveSettings(s: ParentSettings): Promise<void> {
  await (await db()).put('settings', { ...s, voiceInput: false, imageUpload: false, sharing: false, accompaniedMode: false }, 'parent');
}

// ---------- safety log (category only) ----------
export async function logSafety(e: SafetyEvent): Promise<void> { await (await db()).add('safety', e); }
export async function safetyEvents(): Promise<SafetyEvent[]> { return (await db()).getAll('safety'); }

// ---------- export ----------
export interface AcademyBackup {
  app: 'AI 少年学院';
  format: 1;
  exportedAt: string;
  learners: Learner[];
  events: LearningEvent[];
  works: Work[];
  settings: ParentSettings;
  safety: SafetyEvent[];
}

export async function exportAll(): Promise<AcademyBackup> {
  const d = await db();
  return {
    app: 'AI 少年学院',
    format: 1,
    exportedAt: new Date().toISOString(),
    learners: await d.getAll('learners'),
    events: await d.getAll('events'),
    works: await d.getAll('works'),
    settings: await getSettings(),
    safety: await d.getAll('safety'),
  };
}
