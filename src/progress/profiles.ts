/**
 * 一台手机多个孩子（V5.4）：孩子名单单独保存（slp.profiles.v1），每个孩子的学习记录各存一个键。
 * 第一个孩子（p1）用原来的存储键 slp.progress.v1，所以旧数据不用搬，自动成为第一个孩子；学习记录的结构不变。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from './storage';

export const PROFILES_KEY = 'slp.profiles.v1';
export const FIRST_PROFILE = 'p1';
export const PROFILE_EMOJIS = ['🧒', '👦', '👧', '🐼', '🐯', '🐰', '🦊', '🐻'];
export const MAX_PROFILES = 6;

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}
export interface ProfileIndex {
  v: 1;
  active: string;
  list: Profile[];
}

/** 这个孩子的学习记录存在哪个键 */
export const progressKeyOf = (id: string) => (id === FIRST_PROFILE ? STORAGE_KEY : `${STORAGE_KEY}.${id}`);
/** 这个孩子的其它单独保存的数据（护眼计时等）的键 */
export const keyFor = (base: string, id: string) => (id === FIRST_PROFILE ? base : `${base}.${id}`);

export const defaultIndex = (): ProfileIndex => ({ v: 1, active: FIRST_PROFILE, list: [{ id: FIRST_PROFILE, name: '宝贝', emoji: '🧒', createdAt: 0 }] });

export function parseProfiles(raw: string | null): ProfileIndex {
  try {
    const x = raw ? (JSON.parse(raw) as ProfileIndex) : null;
    if (x && x.v === 1 && Array.isArray(x.list)) {
      const list = x.list.filter((p) => p && typeof p.id === 'string' && /^p\d+$/.test(p.id) && typeof p.name === 'string');
      // 第一个孩子一定在（他的记录就是原来的存储键）
      if (!list.some((p) => p.id === FIRST_PROFILE)) list.unshift(defaultIndex().list[0]);
      const active = list.some((p) => p.id === x.active) ? x.active : FIRST_PROFILE;
      return { v: 1, active, list };
    }
  } catch {
    // 坏数据按只有一个孩子
  }
  return defaultIndex();
}

export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, 8);

export function addProfile(idx: ProfileIndex, name: string, emoji: string, now: number): { idx: ProfileIndex; id: string } | null {
  const n = cleanName(name);
  if (!n || idx.list.length >= MAX_PROFILES) return null;
  let k = 2;
  while (idx.list.some((p) => p.id === `p${k}`)) k++;
  const id = `p${k}`;
  return { idx: { ...idx, list: [...idx.list, { id, name: n, emoji: PROFILE_EMOJIS.includes(emoji) ? emoji : PROFILE_EMOJIS[0], createdAt: now }] }, id };
}

export function renameProfile(idx: ProfileIndex, id: string, name: string, emoji?: string): ProfileIndex {
  const n = cleanName(name);
  if (!n) return idx;
  return { ...idx, list: idx.list.map((p) => (p.id === id ? { ...p, name: n, emoji: emoji && PROFILE_EMOJIS.includes(emoji) ? emoji : p.emoji } : p)) };
}

/** 删除孩子（第一个孩子不能删，可以改名）；删的是当前孩子时换到第一个 */
export function removeProfile(idx: ProfileIndex, id: string): ProfileIndex {
  if (id === FIRST_PROFILE || !idx.list.some((p) => p.id === id)) return idx;
  const list = idx.list.filter((p) => p.id !== id);
  return { ...idx, list, active: idx.active === id ? list[0].id : idx.active };
}

export async function loadProfiles(): Promise<ProfileIndex> {
  return parseProfiles(await AsyncStorage.getItem(PROFILES_KEY).catch(() => null));
}
export function saveProfiles(idx: ProfileIndex): Promise<void> {
  return AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(idx)).catch(() => undefined);
}
