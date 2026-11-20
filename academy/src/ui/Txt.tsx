import { Fragment, useEffect, useState } from 'react';
import { useApp } from '../app/state';
import { canSpeak, speak } from './speech';

type PinyinFn = (text: string) => { origin: string; pinyin: string; isZh: boolean }[];
let pinyinFn: PinyinFn | null = null;
let loading: Promise<PinyinFn> | null = null;

function loadPinyin(): Promise<PinyinFn> {
  if (pinyinFn) return Promise.resolve(pinyinFn);
  loading ??= import('pinyin-pro').then((m) => {
    pinyinFn = (t: string) => m.pinyin(t, { type: 'all' }) as unknown as ReturnType<PinyinFn>;
    return pinyinFn;
  });
  return loading;
}

/** True when pinyin should show: grade 1–2 and the parent setting is on. */
export function usePinyinOn(): boolean {
  const { learner, settings } = useApp();
  return !!learner && learner.grade <= 2 && settings.pinyin;
}

/** Chinese text with optional pinyin above each character. */
export function Txt({ children, pinyin }: { children: string; pinyin?: boolean }) {
  const auto = usePinyinOn();
  const on = pinyin ?? auto;
  // Wrapped in an object: React would treat a bare function as a state updater.
  const [holder, setHolder] = useState<{ fn: PinyinFn } | null>(() => (pinyinFn ? { fn: pinyinFn } : null));
  const fn = holder?.fn ?? null;
  useEffect(() => {
    if (on && !fn) void loadPinyin().then((f) => setHolder({ fn: f })).catch(() => undefined);
  }, [on, fn]);
  if (!on || !fn) return <>{children}</>;
  return (
    <span className="py">
      {fn(children).map((c, i) => c.isZh && c.pinyin
        ? <ruby key={i}>{c.origin}<rt aria-hidden="true">{c.pinyin}</rt></ruby>
        : <Fragment key={i}>{c.origin}</Fragment>)}
    </span>
  );
}

export function SpeakButton({ text, label = '听一听' }: { text: string; label?: string }) {
  const { settings } = useApp();
  const [msg, setMsg] = useState('');
  if (!settings.readAloud) return null;
  return (
    <button
      type="button"
      className="speak"
      aria-label={label}
      onClick={() => setMsg(speak(text) ? '' : canSpeak() ? '' : '这台设备不支持朗读')}
    >
      🔊<span className="speak-label">{msg || label}</span>
    </button>
  );
}
