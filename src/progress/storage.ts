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

export async function loadProgress(): Promise<LoadResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: false, state: createEmptyProgress(), reason: 'read-failed' };
  }
  const parsed = parseProgress(raw);
  if (parsed) return { ok: true, state: parsed };
  try {
    if (raw !== null) await AsyncStorage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    // 备份失败也不影响继续使用
  }
  return { ok: false, state: createEmptyProgress(), reason: 'corrupt' };
}

/** 串行写入，保证后一次保存不会被前一次覆盖 */
let writeChain: Promise<void> = Promise.resolve();

export function saveProgress(state: ProgressState): Promise<void> {
  const data = JSON.stringify(state);
  const next = writeChain.then(() => AsyncStorage.setItem(STORAGE_KEY, data));
  writeChain = next.catch(() => undefined);
  return next;
}

export async function flushProgressWrites(): Promise<void> {
  await writeChain;
}
