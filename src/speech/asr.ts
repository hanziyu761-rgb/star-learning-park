/**
 * 说话提问（V2.17）：离线语音识别。
 * 安卓 APP 里用本地原生模块 modules/offline-asr（sherpa-onnx + 中文小模型，Apache-2.0），录音只在手机内存里识别，不保存、不上传。
 * 网页版、单文件 HTML 版没有这个模块：getAsr() 返回 null，界面不显示话筒按钮。
 * 只识别普通话；英语单词识别不好（模型是中文的）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';

type EventName = 'onPartial' | 'onFinal' | 'onError';
interface Subscription {
  remove(): void;
}
export interface AsrNative {
  isAvailable(): boolean;
  getPermission(): Promise<{ granted: boolean; canAskAgain?: boolean }>;
  requestPermission(): Promise<{ granted: boolean; canAskAgain?: boolean }>;
  start(maxSeconds: number): Promise<void>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
  addListener(event: EventName, cb: (e: { text?: string; reason?: string; message?: string }) => void): Subscription;
}

let cached: AsrNative | null | undefined;
export function getAsr(): AsrNative | null {
  if (cached === undefined) {
    try {
      cached = requireOptionalNativeModule<AsrNative>('OfflineAsr');
    } catch {
      cached = null;
    }
  }
  return cached ?? null;
}
/** 测试用 */
export function _setAsrForTest(m: AsrNative | null | undefined) {
  cached = m;
}

const N = '[零〇一二两三四五六七八九十百千0-9]';
const FIXES: [RegExp, string][] = [
  // 数字中间听成同音字：三家四 → 三加四、十检六 → 十减六、三成四 → 三乘四
  [new RegExp(`(${N})[家价假架嘉佳甲夹](?=${N})`, 'g'), '$1加'],
  [new RegExp(`(${N})[检剪见间简](?=${N})`, 'g'), '$1减'],
  [new RegExp(`(${N})[成城程承](?=${N})`, 'g'), '$1乘'],
  // 等于几、多几、有几、是几
  [/(等于|多|有|是|第)[己级机鸡挤记计季及吉急集极](?=$|[个吗呀啊呢？?！!，,。])/g, '$1几'],
];
/** 把识别结果里常见的同音错字改回来（只改紧挨着数字或“等于、多”的字，避免误改） */
export function fixAsrText(text: string): string {
  let t = text.replace(/\s+/g, '');
  for (const [re, to] of FIXES) t = t.replace(re, to);
  return t;
}

export type VoiceState = 'idle' | 'starting' | 'listening' | 'thinking';
export type VoiceProblem = 'no-permission' | 'no-speech' | 'error' | null;

/** 页面用的“说话提问”状态：点一下开始听，说完自动停（也可以再点一下停），识别好的文字交给 onText */
export function useVoiceInput(onText: (text: string) => void) {
  const asr = getAsr();
  const [state, setState] = useState<VoiceState>('idle');
  const [partial, setPartial] = useState('');
  const [problem, setProblem] = useState<VoiceProblem>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    if (!asr) return undefined;
    const subs = [
      asr.addListener('onPartial', (e) => setPartial(fixAsrText(e.text ?? ''))),
      asr.addListener('onFinal', (e) => {
        const text = fixAsrText(e.text ?? '');
        setPartial('');
        setState('idle');
        if (text) {
          setProblem(null);
          onTextRef.current(text);
        } else setProblem('no-speech');
      }),
      asr.addListener('onError', () => {
        setPartial('');
        setState('idle');
        setProblem('error');
      }),
    ];
    return () => {
      subs.forEach((s) => s.remove());
      asr.cancel().catch(() => undefined);
    };
  }, [asr]);

  const start = useCallback(async () => {
    if (!asr) return;
    setProblem(null);
    setPartial('');
    setState('starting');
    try {
      let p = await asr.getPermission();
      if (!p.granted) p = await asr.requestPermission();
      if (!p.granted) {
        setState('idle');
        setProblem('no-permission');
        return;
      }
      await asr.start(15);
      setState('listening');
    } catch (e) {
      setState('idle');
      setProblem((e as { code?: string })?.code === 'NO_PERMISSION' ? 'no-permission' : 'error');
    }
  }, [asr]);

  const stop = useCallback(async () => {
    if (!asr) return;
    setState('thinking');
    try {
      await asr.stop();
    } catch {
      setState('idle');
    }
  }, [asr]);

  return { available: !!asr, state, partial, problem, start, stop };
}

export const VOICE_PROBLEM_TEXT: Record<Exclude<VoiceProblem, null>, string> = {
  'no-permission': '需要打开麦克风才能说话提问。请爸爸妈妈在手机“设置 → 应用 → 星星学习乐园 → 权限”里允许麦克风。',
  'no-speech': '星星宝没听清，靠近一点，再说一次吧。',
  error: '话筒出了点问题，可以再试一次，或者请爸爸妈妈帮忙打字。',
};
