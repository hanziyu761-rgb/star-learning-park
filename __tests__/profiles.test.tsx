/** V5.4 一台手机多个孩子 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { createEmptyProgress } from '@/progress/model';
import { addProfile, defaultIndex, FIRST_PROFILE, parseProfiles, progressKeyOf, removeProfile, renameProfile } from '@/progress/profiles';
import { ProgressProvider, useProgress } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';

describe('孩子名单（纯函数）', () => {
  it('没有名单 / 坏数据时只有第一个孩子，他的记录就是原来的存储键', () => {
    expect(parseProfiles(null)).toEqual(defaultIndex());
    expect(parseProfiles('乱码')).toEqual(defaultIndex());
    expect(progressKeyOf(FIRST_PROFILE)).toBe(STORAGE_KEY);
    expect(progressKeyOf('p2')).toBe(`${STORAGE_KEY}.p2`);
  });
  it('添加、改名、删除；第一个孩子不能删；名字去空格、最多 8 个字；最多 6 个孩子', () => {
    let idx = defaultIndex();
    const a = addProfile(idx, '  小明  ', '👦', 1)!;
    expect(a.id).toBe('p2');
    idx = a.idx;
    expect(idx.list[1].name).toBe('小明');
    expect(addProfile(idx, '   ', '👦', 1)).toBeNull();
    idx = renameProfile(idx, 'p2', '一二三四五六七八九十');
    expect(idx.list[1].name).toBe('一二三四五六七八');
    expect(removeProfile(idx, FIRST_PROFILE)).toBe(idx);
    expect(removeProfile({ ...idx, active: 'p2' }, 'p2')).toMatchObject({ active: FIRST_PROFILE, list: [{ id: FIRST_PROFILE }] });
    for (let i = 0; i < 4; i++) idx = addProfile(idx, `孩子${i}`, '🐼', 1)!.idx;
    expect(idx.list).toHaveLength(6);
    expect(addProfile(idx, '第七个', '🐼', 1)).toBeNull();
  });
});

describe('切换孩子（学习记录分开保存）', () => {
  let api: ReturnType<typeof useProgress>;
  function Probe() {
    api = useProgress();
    return null;
  }
  beforeEach(() => AsyncStorage.clear());

  it('旧数据自动成为第一个孩子；新孩子从空记录开始、沿用设置、年级用新选的；切回来旧记录还在；删除新孩子会删掉他的记录', async () => {
    const old = createEmptyProgress();
    old.totalStars = 42;
    old.settings.grade = 3;
    old.settings.appearance = 'dark';
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    await waitFor(() => expect(api.status).toBe('ready'));
    expect(api.state.totalStars).toBe(42);
    expect(api.profiles.active).toBe(FIRST_PROFILE);

    await act(async () => {
      await api.addProfile('妹妹', '👧', 1);
    });
    await waitFor(() => expect(api.profiles.active).toBe('p2'));
    expect(api.state.totalStars).toBe(0);
    expect(api.state.settings.grade).toBe(1);
    expect(api.state.settings.appearance).toBe('dark');
    await act(async () => {
      api.dispatch({ type: 'settings/set', settings: { grade: 2 } });
    });
    expect(api.state.settings.grade).toBe(2);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(JSON.parse((await AsyncStorage.getItem(`${STORAGE_KEY}.p2`))!).settings.grade).toBe(2);
    // 第一个孩子的记录没有被改
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!).settings.grade).toBe(3);

    await act(async () => {
      await api.switchProfile(FIRST_PROFILE);
    });
    expect(api.state.totalStars).toBe(42);
    expect(api.state.settings.grade).toBe(3);

    await act(async () => {
      await api.removeProfile('p2');
    });
    expect(api.profiles.list.map((p) => p.id)).toEqual([FIRST_PROFILE]);
    expect(await AsyncStorage.getItem(`${STORAGE_KEY}.p2`)).toBeNull();
  });
});
