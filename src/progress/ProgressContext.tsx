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
