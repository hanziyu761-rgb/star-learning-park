/**
 * 发音（V5.1 只用星星宝童声，不再用手机自带语音）：
 * 1. 预先录好的童声录音（固定内容，没网也能听）
 * 2. 手机里存过的云端童声（随机出的题，第一次联网合成后存下）
 * 3. 联网用云端童声现念（阿里云百炼，经自家 AI 服务，APP 里没有密钥）
 * 3 也不行（没网、没设置 AI 服务、服务出错）时不出声，并发出“朗读出问题”通知，页面上提示一句（SpeechNotice）。
 */
import { clipId, findClip, playClip, playUri, stopClip } from './clips';
import { cachedTts, saveTts } from './ttsCache';
import type { Speakable } from '@/lesson/types';

/* ───── 朗读设置：只剩语速（gender、zh、en 是旧版手机语音的设置，保留字段兼容旧记录，不再使用） ───── */
export interface VoicePrefs {
  gender: 'female' | 'male' | 'child';
  zh: string;
  en: string;
  rate: 'slow' | 'normal';
}
let prefs: VoicePrefs = { gender: 'child', zh: '', en: '', rate: 'slow' };
export function setVoicePrefs(p: VoicePrefs) {
  prefs = p;
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

/* ───── 朗读出问题（V5.1）：没网或没设置 AI 服务时，页面上提示一句 ───── */
export type SpeechProblem = 'offline' | 'no-service';
type ProblemListener = (p: SpeechProblem) => void;
const problemListeners = new Set<ProblemListener>();
export function onSpeechProblem(l: ProblemListener): () => void {
  problemListeners.add(l);
  return () => problemListeners.delete(l);
}
function problem(p: SpeechProblem) {
  problemListeners.forEach((l) => l(p));
}

/* ───── 云端童声（V2.18 星星宝；V2.21 起所有没有预录的句子都用它） ───── */
type CloudVoice = (item: Speakable) => Promise<string>;
let cloudVoice: CloudVoice | null = null;
export function setCloudVoice(f: CloudVoice | null) {
  cloudVoice = f;
}
export const hasCloudVoice = () => cloudVoice !== null;

/* ───── 提前合成（V4.2）：题目还没读到就先把童声准备好，进题时不用等网络 ───── */
const inflight = new Map<string, Promise<string>>();
export const PREFETCH_PAUSE_MS = 60_000;
let prefetchPausedUntil = 0;
/** 测试用 */
export const _resetPrefetchPause = () => {
  prefetchPausedUntil = 0;
};
/** 联网合成最多等这么久（云函数刚醒时第一次要几秒）；超时算没连上，不出声 */
export const CLOUD_WAIT_MS = 15_000;

function fetchCloud(item: Speakable, cid: string): Promise<string> {
  const running = inflight.get(cid);
  if (running) return running;
  const p = cloudVoice!(item)
    .then((uri) => {
      if (!item.cloud) void saveTts(cid, uri); // 后台存到手机里，这次先直接播放
      return uri;
    })
    .finally(() => inflight.delete(cid));
  inflight.set(cid, p);
  return p;
}

/** 后台把接下来要读的句子先合成好存到手机里（已有录音或缓存的跳过）；失败不提示 */
export function prefetchSpeech(items: (Speakable | undefined)[]): void {
  // 合成服务刚失败过（没网、没配置、太频繁）：歇一分钟再提前合成，不反复打扰服务
  if (!cloudVoice || Date.now() < prefetchPausedUntil) return;
  for (const item of items) {
    if (!item || item.cloud || !item.text.trim()) continue;
    if (findClip(item) !== undefined) continue;
    const cid = clipId(item.lang, item.text.trim());
    if (cachedTts(cid) || inflight.has(cid)) continue;
    fetchCloud(item, cid).catch(() => {
      prefetchPausedUntil = Date.now() + PREFETCH_PAUSE_MS;
    });
  }
}

/** 一道题进题时会读的句子（题目，以及“听一听”的内容） */
export function speakablesOf(ex: { prompt?: { speak?: Speakable }; listen?: Speakable }): Speakable[] {
  return [ex.prompt?.speak, ex.listen].filter((x): x is Speakable => !!x);
}

/** 打断当前朗读，立即朗读新内容 */
export function speak(item: Speakable, onDone?: () => void): void {
  const id = ++speakingId;
  stopClip();
  notify(true);
  const finish = () => {
    if (id === speakingId) notify(false);
    onDone?.();
  };
  /** 读不出来：不出声，提示一句，照常往下走（不卡住课程） */
  const fail = (p: SpeechProblem) => {
    if (id !== speakingId) return;
    problem(p);
    finish();
  };
  const rate = prefs.rate === 'slow' ? 1 : 1.12; // 录音是正常语速：慢一点 = 原速，正常 = 稍快播放
  // 1. 预先录好的童声
  if (!item.cloud && playClip(item, rate, finish)) return;
  // 2. 手机里存过的云端童声
  const cid = clipId(item.lang, item.text.trim());
  const local = cachedTts(cid);
  if (local && playUri(local, finish, () => fail('offline'), rate)) return;
  // 3. 联网现念
  if (!cloudVoice) return fail('no-service');
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    fail('offline');
  }, CLOUD_WAIT_MS);
  fetchCloud(item, cid).then(
    (uri) => {
      clearTimeout(timer);
      if (settled || id !== speakingId) return; // 已经超时，或被新的朗读打断
      settled = true;
      if (!playUri(uri, finish, () => fail('offline'), rate)) fail('offline');
    },
    () => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      fail('offline');
    },
  );
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
  stopClip();
  notify(false);
}

export const zhSpeak = (text: string): Speakable => ({ text, lang: 'zh-CN' });
export const enSpeak = (text: string): Speakable => ({ text, lang: 'en-US' });
