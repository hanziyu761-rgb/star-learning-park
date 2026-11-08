import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Learner, LearningEvent, ParentSettings, Work } from '../store/types';
import { DEFAULT_SETTINGS } from '../store/types';
import { eventsForLearner, getActiveLearnerId, getSettings, listLearners, worksForLearner } from '../store/db';

interface AppState {
  ready: boolean;
  learners: Learner[];
  learner: Learner | null;
  events: LearningEvent[];
  works: Work[];
  settings: ParentSettings;
  /** Re-read everything from IndexedDB (after a write). */
  refresh: () => Promise<void>;
  error: string | null;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AppState, 'refresh'>>({
    ready: false, learners: [], learner: null, events: [], works: [], settings: DEFAULT_SETTINGS, error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const learners = await listLearners();
      const activeId = await getActiveLearnerId();
      const learner = learners.find((l) => l.id === activeId) ?? learners[0] ?? null;
      const [events, works, settings] = await Promise.all([
        learner ? eventsForLearner(learner.id) : Promise.resolve([]),
        learner ? worksForLearner(learner.id) : Promise.resolve([]),
        getSettings(),
      ]);
      setState({ ready: true, learners, learner, events, works, settings, error: null });
    } catch (e) {
      setState((s) => ({ ...s, ready: true, error: '无法打开本机学习记录。请检查浏览器是否开启了无痕模式或禁止了网站存储。' }));
      console.error(e);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <Ctx.Provider value={{ ...state, refresh }}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
