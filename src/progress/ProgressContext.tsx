import { AI_VOICE, aiHealth, aiTts, DEFAULT_AI_BASE_URL } from '@/ai/client';
import { setCloudVoice, setVoicePrefs } from '@/speech/speech';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createEmptyProgress, progressReducer, type ProgressAction, type ProgressState } from './model';
import { loadProgress, saveProgress } from './storage';

export type ProgressStatus = 'loading' | 'ready';

interface ProgressContextValue {
  status: ProgressStatus;
  state: ProgressState;
  /** 读取时发现数据损坏或无法读取 */
  loadProblem: 'corrupt' | 'read-failed' | null;
  /** 最近一次保存失败 */
  saveFailed: boolean;
  dispatch: (action: ProgressAction) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ProgressStatus>('loading');
  const [state, setState] = useState<ProgressState>(createEmptyProgress);
  const [loadProblem, setLoadProblem] = useState<'corrupt' | 'read-failed' | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((res) => {
      if (cancelled) return;
      setState(res.state);
      setLoadProblem(res.ok ? null : res.reason);
      loaded.current = true;
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 朗读声音跟着家长的设置走（V2.16）
  const s = state.settings;
  useEffect(() => {
    setVoicePrefs({ gender: 'child', zh: s.voiceZh, en: s.voiceEn, rate: s.speechRate });
  }, [s.voiceZh, s.voiceEn, s.speechRate]);
  // 云端童声（V2.21）：没有预录的句子联网用星星宝童声现念。只发送要朗读的文字。
  // 星星宝的回答（AI 老师）仍需家长先开启 AI 老师；题目朗读只要“联网童声”开关打开就用
  useEffect(() => {
    const baseUrl = s.aiBaseUrl || DEFAULT_AI_BASE_URL;
    if (!s.aiCloudVoice || !baseUrl) {
      setCloudVoice(null);
      return;
    }
    setCloudVoice((item) => aiTts({ enabled: true, baseUrl }, item.text, AI_VOICE, 'normal'));
    // 先叫醒 AI 服务（云函数平时休眠，第一次请求要多等几秒），孩子进题时就不用等了（V4.2）
    aiHealth({ enabled: true, baseUrl }).catch(() => undefined);
    return () => setCloudVoice(null);
  }, [s.aiCloudVoice, s.aiBaseUrl]);

  const dispatch = useCallback((action: ProgressAction) => {
    if (!loaded.current) return; // 读取完成之前不允许写入，防止覆盖已有进度
    setState((prev) => {
      const next = progressReducer(prev, action);
      if (next !== prev) {
        saveProgress(next).then(
          () => setSaveFailed(false),
          () => setSaveFailed(true),
        );
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ status, state, loadProblem, saveFailed, dispatch }),
    [status, state, loadProblem, saveFailed, dispatch],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress 必须在 ProgressProvider 内使用');
  return ctx;
}
