/**
 * 发音：使用设备自带的语音合成引擎（expo-speech）。
 * - 不需要网络，也不需要账号。
 * - 发音质量取决于手机的语音引擎；部分安卓手机需要在系统设置中安装中文/英文语音包。
 * - 第二阶段计划为核心词汇替换成真人录音（见 docs/DEVELOPMENT_PLAN.md）。
 */
import * as Speech from 'expo-speech';
import type { Speakable } from '@/lesson/types';

const RATE: Record<Speakable['lang'], number> = {
  'zh-CN': 0.85,
  'en-US': 0.8,
};

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
export function speak(item: Speakable, onDone?: () => void): void {
  const id = ++speakingId;
  Speech.stop();
  notify(true);
  const finish = () => {
    if (id === speakingId) notify(false);
    onDone?.();
  };
  try {
    Speech.speak(item.text, {
      language: item.lang,
      rate: RATE[item.lang],
      pitch: 1.05,
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
