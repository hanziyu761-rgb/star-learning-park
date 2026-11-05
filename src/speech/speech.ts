/**
 * 发音：使用设备自带的语音合成引擎（expo-speech）。
 * - 不需要网络，也不需要账号。
 * - 发音质量取决于手机的语音引擎；部分安卓手机需要在系统设置中安装中文/英文语音包。
 * - 第二阶段计划为核心词汇替换成真人录音（见 docs/DEVELOPMENT_PLAN.md）。
 */
import * as Speech from 'expo-speech';
import { playClip, stopClip } from './clips';
import type { Speakable } from '@/lesson/types';

/* ───── 朗读声音（V2.16）：女声 / 男声、指定声音、语速，对小朋友更友好 ───── */
export interface VoicePrefs {
  /** 童声：中文用预先录好的童声录音；手机语音用女声调高音调 */
  gender: 'female' | 'male' | 'child';
  /** 指定的中文、英语声音（手机语音引擎里的声音编号；空 = 用默认声音） */
  zh: string;
  en: string;
  rate: 'slow' | 'normal';
}
let prefs: VoicePrefs = { gender: 'female', zh: '', en: '', rate: 'slow' };
export function setVoicePrefs(p: VoicePrefs) {
  prefs = p;
}
export const getVoicePrefs = () => prefs;

/** 语速：慢一点更适合低年级孩子 */
const RATE: Record<VoicePrefs['rate'], Record<Speakable['lang'], number>> = {
  slow: { 'zh-CN': 0.78, 'en-US': 0.72 },
  normal: { 'zh-CN': 0.9, 'en-US': 0.85 },
};
/** 音调：女声稍亮一点显得亲切；男声用自然音调（没有男声音色的手机上稍低一点） */
export function pitchFor(p: VoicePrefs, lang: Speakable['lang']): number {
  const picked = lang === 'zh-CN' ? p.zh : p.en;
  if (p.gender === 'child') return 1.3;
  if (p.gender === 'female') return 1.12;
  return picked ? 1.0 : 0.82;
}
export function speechOptions(item: Speakable, p: VoicePrefs = prefs) {
  const voice = item.lang === 'zh-CN' ? p.zh : p.en;
  return {
    language: item.lang,
    rate: RATE[p.rate][item.lang],
    pitch: pitchFor(p, item.lang),
    ...(voice ? { voice } : {}),
  };
}

type Listener = (speaking: boolean) => void;
const listeners = new Set<Listener>();
let speakingId = 0;

function notify(speaking: boolean) {
  listeners.forEach((l) => l(speaking));
}

export function onSpeakingChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 打断当前朗读，立即朗读新内容 */
export function speak(item: Speakable, onDone?: () => void, override?: { voice?: string }): void {
  const id = ++speakingId;
  Speech.stop();
  stopClip();
  notify(true);
  const finish = () => {
    if (id === speakingId) notify(false);
    onDone?.();
  };
  // 有预先录好的录音就放录音（慢一点 = 原速，正常 = 稍快播放）
  if (!override?.voice && playClip(item, prefs.gender, prefs.rate === 'slow' ? 1 : 1.12, finish)) return;
  try {
    Speech.speak(item.text, {
      ...speechOptions(item),
      // 试听某个声音时临时指定
      ...(override?.voice
        ? { voice: override.voice, pitch: prefs.gender === 'male' ? 1.0 : prefs.gender === 'child' ? 1.3 : 1.12 }
        : {}),
      onDone: finish,
      onStopped: () => {
        if (id === speakingId) notify(false);
      },
      onError: finish,
    });
  } catch {
    finish();
  }
}

/** 依次朗读多段内容 */
export function speakSequence(items: Speakable[], onDone?: () => void): void {
  if (items.length === 0) {
    onDone?.();
    return;
  }
  const [first, ...rest] = items;
  const id = speakingId + 1;
  speak(first, () => {
    // 如果中途被其他朗读打断，就不再继续
    if (id !== speakingId) return;
    speakSequence(rest, onDone);
  });
}

export function stopSpeaking(): void {
  speakingId++;
  Speech.stop();
  stopClip();
  notify(false);
}

export const zhSpeak = (text: string): Speakable => ({ text, lang: 'zh-CN' });
export const enSpeak = (text: string): Speakable => ({ text, lang: 'en-US' });

/** 声音检查（V2.15）：本机有没有中文、英语的语音。部分安卓手机检测不准，所以还要配合“试听”按钮 */
export interface VoiceCheck {
  total: number;
  zh: boolean;
  en: boolean;
}

export function summarizeVoices(voices: { language?: string }[]): VoiceCheck {
  const langs = voices.map((v) => (v.language ?? '').toLowerCase().replace('_', '-'));
  return {
    total: voices.length,
    zh: langs.some((l) => l.startsWith('zh') || l.startsWith('cmn')),
    en: langs.some((l) => l.startsWith('en')),
  };
}

export async function checkVoices(): Promise<VoiceCheck> {
  try {
    // 有的浏览器、手机一直不返回语音列表：最多等 3 秒，按“没检测到”处理（仍可点试听确认）
    const timeout = new Promise<{ language?: string }[]>((resolve) => setTimeout(() => resolve([]), 3000));
    return summarizeVoices(await Promise.race([Speech.getAvailableVoicesAsync(), timeout]));
  } catch {
    return { total: 0, zh: false, en: false };
  }
}

/* ───── 手机里有哪些声音、是男声还是女声 ───── */
export interface VoiceInfo {
  id: string;
  name: string;
  lang: 'zh-CN' | 'en-US';
  /** 根据声音名字推测的性别（推测不出为 unknown，需要试听） */
  gender: 'female' | 'male' | 'unknown';
  /** 需要联网的声音 */
  network: boolean;
}

/*
 * 常见语音引擎的命名：三星 SMTf（女）/ SMTm（男）；谷歌离线声音代号（据公开资料整理，可能随版本变化，所以界面上写“可能是”并提供试听）。
 */
const GOOGLE_FEMALE = ['ccc', 'cce', 'ssa', 'sfg', 'iog', 'tpc', 'tpf', 'iob'];
const GOOGLE_MALE = ['ccd', 'iom', 'iol', 'tpd'];

export function guessGender(v: { identifier?: string; name?: string }): VoiceInfo['gender'] {
  const s = `${v.identifier ?? ''} ${v.name ?? ''}`.toLowerCase();
  if (/female|woman|girl|smtf|#f\b|[-_]f\d{2}/.test(s)) return 'female';
  if (/\bmale|\bman\b|boy|smtm|#m\b|[-_]m\d{2}/.test(s)) return 'male';
  const code = s.match(/-x-([a-z]{3})/)?.[1];
  if (code && GOOGLE_FEMALE.includes(code)) return 'female';
  if (code && GOOGLE_MALE.includes(code)) return 'male';
  return 'unknown';
}

export function listVoices(raw: { identifier: string; name: string; language: string }[]): VoiceInfo[] {
  const out: VoiceInfo[] = [];
  for (const v of raw) {
    const l = (v.language ?? '').toLowerCase().replace('_', '-');
    const lang = l.startsWith('zh') || l.startsWith('cmn') ? 'zh-CN' : l.startsWith('en') ? 'en-US' : null;
    // 只要普通话和美式/英式英语（粤语、台湾腔等先不列）
    if (!lang || /yue|hk|tw/.test(l)) continue;
    out.push({
      id: v.identifier,
      name: v.name,
      lang,
      gender: guessGender(v),
      network: /network/i.test(`${v.identifier} ${v.name}`),
    });
  }
  // 离线声音排前面（不用网络也能读）
  return out.sort((a, b) => Number(a.network) - Number(b.network));
}

/** 按“女声 / 男声”自动挑一个声音；推测不出性别时返回空（用默认声音） */
export function pickVoice(voices: VoiceInfo[], lang: VoiceInfo['lang'], gender: 'female' | 'male'): string {
  return voices.find((v) => v.lang === lang && v.gender === gender)?.id ?? '';
}

export async function getVoices(): Promise<VoiceInfo[]> {
  try {
    const timeout = new Promise<[]>((resolve) => setTimeout(() => resolve([]), 3000));
    return listVoices(await Promise.race([Speech.getAvailableVoicesAsync(), timeout]));
  } catch {
    return [];
  }
}
