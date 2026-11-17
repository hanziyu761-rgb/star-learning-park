import { AI_VOICE, aiHealth, aiTts, DEFAULT_AI_BASE_URL } from '@/ai/client';
import { setCloudVoice, setVoicePrefs } from '@/speech/speech';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createEmptyProgress, progressReducer, type ProgressAction, type ProgressState } from './model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProgress, saveProgress } from './storage';
import { BEFORE_IMPORT_KEY, makeBackup, parseBackup, type Backup } from './backup';
import {
  addProfile as addP,
  defaultIndex,
  loadProfiles,
  progressKeyOf,
  removeProfile as removeP,
  renameProfile as renameP,
  saveProfiles,
  type ProfileIndex,
} from './profiles';
import { setPinyinOff } from '@/components/pinyinMode';
import { pinyinHidden } from './grade';
import { useColorScheme } from 'react-native';
import { setScheme, type Scheme } from '@/theme';

export type ProgressStatus = 'loading' | 'ready';

interface ProgressContextValue {
  status: ProgressStatus;
  state: ProgressState;
  /** 读取时发现数据损坏或无法读取 */
  loadProblem: 'corrupt' | 'read-failed' | null;
  /** 最近一次保存失败 */
  saveFailed: boolean;
  dispatch: (action: ProgressAction) => void;
  /** 当前配色（V5.0） */
  scheme: Scheme;
  /** 一台手机多个孩子（V5.4） */
  profiles: ProfileIndex;
  switchProfile: (id: string) => Promise<void>;
  /** 新加一个孩子（复制当前孩子的设置，年级用给定的），并切换过去；满了返回 null */
  addProfile: (name: string, emoji: string, grade: number) => Promise<string | null>;
  renameProfile: (id: string, name: string, emoji?: string) => void;
  /** 删除孩子和他的学习记录（第一个孩子不能删） */
  removeProfile: (id: string) => Promise<void>;
  /** 备份（V5.4）：所有孩子的学习记录 */
  exportAll: () => Promise<{ profiles: ProfileIndex; data: Record<string, ProgressState> }>;
  /** 用备份替换这台手机上的全部学习记录（替换前自动留一份，可以撤销） */
  restoreAll: (b: Backup) => Promise<void>;
  /** 撤销上次导入：换回导入前的记录；没有可撤销的返回 false */
  undoRestore: () => Promise<boolean>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ProgressStatus>('loading');
  const [state, setState] = useState<ProgressState>(createEmptyProgress);
  const [loadProblem, setLoadProblem] = useState<'corrupt' | 'read-failed' | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const loaded = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [profiles, setProfiles] = useState<ProfileIndex>(defaultIndex);
  const profilesRef = useRef<ProfileIndex>(defaultIndex());
  /** 当前孩子的存储键：保存时用它 */
  const keyRef = useRef(progressKeyOf(defaultIndex().active));

  const loadFor = useCallback(async (idx: ProfileIndex) => {
    loaded.current = false;
    setStatus('loading');
    const key = progressKeyOf(idx.active);
    const res = await loadProgress(key);
    keyRef.current = key;
    profilesRef.current = idx;
    setProfiles(idx);
    setState(res.state);
    setLoadProblem(res.ok ? null : res.reason);
    loaded.current = true;
    setStatus('ready');
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadProfiles().then((idx) => {
      if (!cancelled) loadFor(idx);
    });
    return () => {
      cancelled = true;
    };
  }, [loadFor]);

  const switchProfile = useCallback(
    async (id: string) => {
      const idx = profilesRef.current;
      if (id === idx.active || !idx.list.some((p) => p.id === id)) return;
      const next = { ...idx, active: id };
      await saveProfiles(next);
      await loadFor(next);
    },
    [loadFor],
  );

  const addProfile = useCallback(
    async (name: string, emoji: string, grade: number) => {
      const r = addP(profilesRef.current, name, emoji, Date.now());
      if (!r) return null;
      // 新孩子：设置沿用当前孩子的（声音、外观、AI 服务地址等），年级用家长选的
      const fresh = createEmptyProgress();
      fresh.settings = { ...stateRef.current.settings, grade };
      await saveProgress(fresh, progressKeyOf(r.id));
      const next = { ...r.idx, active: r.id };
      await saveProfiles(next);
      await loadFor(next);
      return r.id;
    },
    [loadFor],
  );

  const renameProfile = useCallback((id: string, name: string, emoji?: string) => {
    const next = renameP(profilesRef.current, id, name, emoji);
    profilesRef.current = next;
    setProfiles(next);
    saveProfiles(next);
  }, []);

  const removeProfile = useCallback(
    async (id: string) => {
      const before = profilesRef.current;
      const next = removeP(before, id);
      if (next === before) return;
      await saveProfiles(next);
      await AsyncStorage.removeItem(progressKeyOf(id)).catch(() => undefined);
      if (before.active === id) await loadFor(next);
      else {
        profilesRef.current = next;
        setProfiles(next);
      }
    },
    [loadFor],
  );

  // 朗读声音跟着家长的设置走（V2.16）
  const s = state.settings;
  useEffect(() => {
    setVoicePrefs({ gender: 'child', zh: s.voiceZh, en: s.voiceEn, rate: s.speechRate });
  }, [s.voiceZh, s.voiceEn, s.speechRate]);
  // 拼音：家长中心可以开关（V5.1）；没设置过时初中（七年级及以上）不标（V4.3）
  useLayoutEffect(() => {
    setPinyinOff(pinyinHidden(s));
  }, [s.grade, s.pinyin]); // eslint-disable-line react-hooks/exhaustive-deps
  // 云端童声（V2.21）：没有预录的句子联网用星星宝童声现念。只发送要朗读的文字。
  // V5.1 起一直用（不再有手机语音可退），设置里的 aiCloudVoice 开关不再使用；星星宝的回答仍需家长先开启 AI 老师
  useEffect(() => {
    const baseUrl = s.aiBaseUrl || DEFAULT_AI_BASE_URL;
    if (!baseUrl) {
      setCloudVoice(null);
      return;
    }
    setCloudVoice((item) => aiTts({ enabled: true, baseUrl }, item.text, AI_VOICE, 'normal'));
    // 先叫醒 AI 服务（云函数平时休眠，第一次请求要多等几秒），孩子进题时就不用等了（V4.2）
    aiHealth({ enabled: true, baseUrl }).catch(() => undefined);
    return () => setCloudVoice(null);
  }, [s.aiBaseUrl]);

  const dispatch = useCallback((action: ProgressAction) => {
    if (!loaded.current) return; // 读取完成之前不允许写入，防止覆盖已有进度
    setState((prev) => {
      const next = progressReducer(prev, action);
      if (next !== prev) {
        saveProgress(next, keyRef.current).then(
          () => setSaveFailed(false),
          () => setSaveFailed(true),
        );
      }
      return next;
    });
  }, []);

  // 外观（V5.0）：家长选了浅色 / 深色就用它，否则跟随手机系统。
  // 在渲染时就设好当前配色，子页面这一轮渲染拿到的就是新配色；scheme 放进 value，所有页面都会重新渲染
  const system = useColorScheme();
  const scheme: Scheme = s.appearance === 'light' || s.appearance === 'dark' ? s.appearance : system === 'dark' ? 'dark' : 'light';
  setScheme(scheme);

  const exportAll = useCallback(async () => {
    const idx = profilesRef.current;
    const data: Record<string, ProgressState> = {};
    for (const p of idx.list) data[p.id] = p.id === idx.active ? stateRef.current : (await loadProgress(progressKeyOf(p.id))).state;
    return { profiles: idx, data };
  }, []);

  const writeAll = useCallback(
    async (b: Backup) => {
      const before = profilesRef.current;
      for (const p of b.profiles.list) await saveProgress(b.data[p.id], progressKeyOf(p.id));
      // 这台手机上有、备份里没有的孩子：删掉他的记录
      for (const p of before.list) if (!b.profiles.list.some((x) => x.id === p.id)) await AsyncStorage.removeItem(progressKeyOf(p.id)).catch(() => undefined);
      await saveProfiles(b.profiles);
      await loadFor(b.profiles);
    },
    [loadFor],
  );

  const restoreAll = useCallback(
    async (b: Backup) => {
      const cur = await exportAll();
      await AsyncStorage.setItem(BEFORE_IMPORT_KEY, makeBackup(cur.profiles, cur.data, Date.now(), '')).catch(() => undefined);
      await writeAll(b);
    },
    [exportAll, writeAll],
  );

  const undoRestore = useCallback(async () => {
    const raw = await AsyncStorage.getItem(BEFORE_IMPORT_KEY).catch(() => null);
    const r = raw ? parseBackup(raw) : null;
    if (!r || !r.ok) return false;
    await writeAll(r.backup);
    await AsyncStorage.removeItem(BEFORE_IMPORT_KEY).catch(() => undefined);
    return true;
  }, [writeAll]);

  const value = useMemo(
    () => ({ status, state, loadProblem, saveFailed, dispatch, scheme, profiles, switchProfile, addProfile, renameProfile, removeProfile, exportAll, restoreAll, undoRestore }),
    [status, state, loadProblem, saveFailed, dispatch, scheme, profiles, switchProfile, addProfile, renameProfile, removeProfile, exportAll, restoreAll, undoRestore],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress 必须在 ProgressProvider 内使用');
  return ctx;
}
