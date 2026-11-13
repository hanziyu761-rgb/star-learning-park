/**
 * 全局“不标拼音”开关（V4.3）：孩子上初中（七年级及以上）后，所有汉字都不再标拼音。
 * 由学习记录里的年级决定（ProgressContext 设置）；PinyinText 读取。
 */
import { useSyncExternalStore } from 'react';

let off = false;
const listeners = new Set<() => void>();

export function setPinyinOff(v: boolean) {
  if (off === v) return;
  off = v;
  listeners.forEach((l) => l());
}

export const isPinyinOff = () => off;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePinyinOff(): boolean {
  return useSyncExternalStore(subscribe, isPinyinOff, isPinyinOff);
}
