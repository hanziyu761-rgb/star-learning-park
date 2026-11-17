/** V5.4 学习记录备份与换手机 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { backupSummary, makeBackup, parseBackup } from '@/progress/backup';
import { createEmptyProgress } from '@/progress/model';
import { defaultIndex } from '@/progress/profiles';
import { ProgressProvider, useProgress } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';

describe('备份文件', () => {
  it('导出再读回内容一样；摘要给家长看', () => {
    const s = createEmptyProgress();
    s.totalStars = 9;
    s.settings.grade = 4;
    const text = makeBackup(defaultIndex(), { p1: s }, 123, '5.4.0');
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.data.p1.totalStars).toBe(9);
    expect(backupSummary(r.backup)).toEqual([{ id: 'p1', name: '宝贝', emoji: '🧒', grade: 4, questions: 0, stars: 9 }]);
  });
  it('不是备份、别的 APP 的文件、记录损坏、空备份都不导入', () => {
    expect(parseBackup('hello')).toEqual({ ok: false, reason: 'not-json' });
    expect(parseBackup('{"a":1}')).toEqual({ ok: false, reason: 'not-ours' });
    const bad = JSON.parse(makeBackup(defaultIndex(), { p1: createEmptyProgress() }, 1, ''));
    bad.data.p1 = { 乱: 1 };
    expect(parseBackup(JSON.stringify(bad))).toEqual({ ok: false, reason: 'bad-child' });
    const empty = JSON.parse(makeBackup(defaultIndex(), {}, 1, ''));
    expect(parseBackup(JSON.stringify(empty))).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('导入、撤销', () => {
  let api: ReturnType<typeof useProgress>;
  function Probe() {
    api = useProgress();
    return null;
  }
  beforeEach(() => AsyncStorage.clear());

  it('两个孩子的备份导入到新手机：两个孩子和记录都恢复；撤销换回原来的', async () => {
    // 旧手机：两个孩子
    const a = createEmptyProgress();
    a.totalStars = 5;
    const b = createEmptyProgress();
    b.totalStars = 7;
    b.settings.grade = 8;
    const idx = { v: 1 as const, active: 'p1', list: [...defaultIndex().list, { id: 'p2', name: '哥哥', emoji: '👦', createdAt: 1 }] };
    const r = parseBackup(makeBackup(idx, { p1: a, p2: b }, 1, ''));
    if (!r.ok) throw new Error('备份没读出来');

    // 新手机：已经有一点记录
    const mine = createEmptyProgress();
    mine.totalStars = 1;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mine));
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    await waitFor(() => expect(api.status).toBe('ready'));
    expect(api.state.totalStars).toBe(1);

    await act(async () => {
      await api.restoreAll(r.backup);
    });
    expect(api.profiles.list.map((p) => p.name)).toEqual(['宝贝', '哥哥']);
    expect(api.state.totalStars).toBe(5);
    await act(async () => {
      await api.switchProfile('p2');
    });
    expect(api.state.totalStars).toBe(7);
    expect(api.state.settings.grade).toBe(8);

    // 导出：两个孩子都在
    const all = await api.exportAll();
    expect(Object.keys(all.data).sort()).toEqual(['p1', 'p2']);

    // 撤销：换回导入前（只有一个孩子、1 颗星）
    let ok = false;
    await act(async () => {
      ok = await api.undoRestore();
    });
    expect(ok).toBe(true);
    expect(api.profiles.list.map((p) => p.id)).toEqual(['p1']);
    expect(api.state.totalStars).toBe(1);
    expect(await AsyncStorage.getItem(`${STORAGE_KEY}.p2`)).toBeNull();
  });
});
