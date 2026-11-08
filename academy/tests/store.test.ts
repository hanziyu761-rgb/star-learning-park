import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  appendEvent, eventsForLearner, exportAll, getActiveLearnerId, getSettings, listLearners, logSafety,
  newId, resetDbConnection, saveLearner, saveSettings, setActiveLearnerId, saveWork, worksForLearner,
} from '../src/store/db';
import { readLegacyGrade, LEGACY_KEY } from '../src/store/legacy';
import type { LearningEvent } from '../src/store/types';

beforeEach(async () => {
  await resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});

const ev = (over: Partial<LearningEvent> = {}): LearningEvent => ({
  id: newId(), learnerId: 'L1', at: new Date().toISOString(), lessonId: 'g1-l1', activeMs: 1000, mode: 'local', type: 'lesson_start', ...over,
} as LearningEvent);

describe('academy store', () => {
  it('saves learners and the active learner', async () => {
    await saveLearner({ id: 'L1', nickname: '小星星', avatar: '🦊', grade: 1, createdAt: '2026-11-01T00:00:00Z' });
    await setActiveLearnerId('L1');
    expect((await listLearners()).map((l) => l.nickname)).toEqual(['小星星']);
    expect(await getActiveLearnerId()).toBe('L1');
  });

  it('events are append-only: the same id cannot be written twice', async () => {
    const e = ev();
    await appendEvent(e);
    await expect(appendEvent({ ...e, activeMs: 999999 })).rejects.toBeTruthy();
    const stored = await eventsForLearner('L1');
    expect(stored).toHaveLength(1);
    expect(stored[0].activeMs).toBe(1000);
  });

  it('events are kept per learner', async () => {
    await appendEvent(ev({ learnerId: 'L1' }));
    await appendEvent(ev({ learnerId: 'L2' }));
    expect(await eventsForLearner('L1')).toHaveLength(1);
    expect(await eventsForLearner('L2')).toHaveLength(1);
  });

  it('locked features stay off even if someone writes them on', async () => {
    const s = await getSettings();
    await saveSettings({ ...s, dailyMinutes: 30, sharing: true as never, voiceInput: true as never });
    const back = await getSettings();
    expect(back.dailyMinutes).toBe(30);
    expect(back.sharing).toBe(false);
    expect(back.voiceInput).toBe(false);
    expect(back.imageUpload).toBe(false);
    expect(back.accompaniedMode).toBe(false);
  });

  it('works default to not shared', async () => {
    await saveWork({ id: 'W1', learnerId: 'L1', lessonId: 'g1-l7', type: 'robot', title: '小绿', parts: [], accompanied: false, shared: false, createdAt: 'x', updatedAt: 'x' });
    expect((await worksForLearner('L1'))[0].shared).toBe(false);
  });

  it('export contains everything but never the raw text behind a safety event', async () => {
    await saveLearner({ id: 'L1', nickname: '小星星', avatar: '🦊', grade: 1, createdAt: 'x' });
    await appendEvent(ev());
    await logSafety({ id: 'S1', learnerId: 'L1', at: 'x', category: 'privacy', where: 'nickname' });
    const data = await exportAll();
    expect(data.app).toBe('AI 少年学院');
    expect(data.learners).toHaveLength(1);
    expect(data.events).toHaveLength(1);
    expect(Object.keys(data.safety[0]).sort()).toEqual(['at', 'category', 'id', 'learnerId', 'where']);
  });

  it('never writes to the legacy app key', async () => {
    const legacy = JSON.stringify({ grade: 3, stats: { math: 12 } });
    localStorage.setItem(LEGACY_KEY, legacy);
    await saveLearner({ id: 'L1', nickname: 'a', avatar: '🦊', grade: 1, createdAt: 'x' });
    await appendEvent(ev());
    await saveSettings(await getSettings());
    expect(localStorage.getItem(LEGACY_KEY)).toBe(legacy);
  });
});

describe('legacy grade (read-only)', () => {
  it('reads the grade chosen in 星星闯关乐园', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ grade: 4 }));
    expect(readLegacyGrade()).toBe(4);
  });
  it('ignores missing or broken data', () => {
    expect(readLegacyGrade()).toBeNull();
    localStorage.setItem(LEGACY_KEY, '{not json');
    expect(readLegacyGrade()).toBeNull();
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ grade: 9 }));
    expect(readLegacyGrade()).toBeNull();
  });
});
