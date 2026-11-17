/**
 * 学习进度的本地持久化（设备本地，不上传任何服务器）。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyProgress, parseProgress, type ProgressState } from './model';

export const STORAGE_KEY = 'slp.progress.v1';
export const CORRUPT_BACKUP_KEY = 'slp.progress.corrupt-backup';

export type LoadResult =
  | { ok: true; state: ProgressState }
  /** 数据损坏：原始数据已另存备份，返回空进度 */
  | { ok: false; state: ProgressState; reason: 'corrupt' | 'read-failed' };

/** key：哪个孩子的记录（V5.4 一台手机多个孩子；不传 = 第一个孩子，就是原来的存储键） */
export async function loadProgress(key: string = STORAGE_KEY): Promise<LoadResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    return { ok: false, state: createEmptyProgress(), reason: 'read-failed' };
  }
  const parsed = parseProgress(raw);
  if (parsed) return { ok: true, state: parsed };
  try {
    if (raw !== null) await AsyncStorage.setItem(key === STORAGE_KEY ? CORRUPT_BACKUP_KEY : `${CORRUPT_BACKUP_KEY}.${key}`, raw);
  } catch {
    // 备份失败也不影响继续使用
  }
  return { ok: false, state: createEmptyProgress(), reason: 'corrupt' };
}

/** 串行写入，保证后一次保存不会被前一次覆盖 */
let writeChain: Promise<void> = Promise.resolve();

export function saveProgress(state: ProgressState, key: string = STORAGE_KEY): Promise<void> {
  const data = JSON.stringify(state);
  const next = writeChain.then(() => AsyncStorage.setItem(key, data));
  writeChain = next.catch(() => undefined);
  return next;
}

export async function flushProgressWrites(): Promise<void> {
  await writeChain;
}
