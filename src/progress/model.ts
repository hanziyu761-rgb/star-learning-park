/**
 * 学习进度数据模型（纯函数，不依赖界面和存储，便于测试）。
 *
 * 设计要点：
 * - 每道题记录“第一次是否答对”和“尝试次数”，正确率按第一次作答计算，重试不会掩盖错误。
 * - 错题单独汇总，并按知识点（skill）统计，为以后的智能复习做准备。
 * - 只有真实发生的学习行为才会写入记录，不生成任何示例数据。
 */
import type { Subject } from '@/lesson/types';

export const PROGRESS_VERSION = 1;

export interface ExerciseResult {
  lessonId: string;
  exerciseId: string;
  subject: Subject;
  skill: string;
  firstTryCorrect: boolean;
  attempts: number;
  at: number;
}

export interface MistakeEntry {
  key: string; // lessonId/exerciseId
  lessonId: string;
  exerciseId: string;
  subject: Subject;
  skill: string;
  wrongCount: number;
  lastWrongAt: number;
  /** 之后某次第一次就答对，视为已掌握 */
  resolved: boolean;
}

export interface SessionRecord {
  lessonId: string;
  subject: Subject;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  firstTryCorrect: number;
  exerciseCount: number;
  stars: number;
}

export interface LessonProgress {
  lessonId: string;
  subject: Subject;
  /** 进入课程的次数 */
  startCount: number;
  completedCount: number;
  bestStars: number;
  lastStudiedAt: number;
  firstCompletedAt?: number;
}

export interface ActiveLesson {
  lessonId: string;
  subject: Subject;
  stepIndex: number;
  startedAt: number;
  updatedAt: number;
}

export interface ProgressState {
  version: number;
  totalStars: number;
  lessons: Record<string, LessonProgress>;
  results: ExerciseResult[];
  mistakes: Record<string, MistakeEntry>;
  sessions: SessionRecord[];
  /** 未完成的课程，用于“继续上次学习” */
  active: ActiveLesson | null;
}

export const MAX_RESULTS = 2000;
export const MAX_SESSIONS = 500;
/** 单次课程计入时长的上限，避免孩子中途离开很久导致时长失真 */
export const MAX_SESSION_SEC = 60 * 60;

export function createEmptyProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    totalStars: 0,
    lessons: {},
    results: [],
    mistakes: {},
    sessions: [],
    active: null,
  };
}

export type ProgressAction =
  | { type: 'lesson/start'; lessonId: string; subject: Subject; now: number; resume: boolean }
  | { type: 'lesson/step'; lessonId: string; stepIndex: number; now: number }
  | {
      type: 'exercise/result';
      lessonId: string;
      exerciseId: string;
      subject: Subject;
      skill: string;
      firstTryCorrect: boolean;
      attempts: number;
      now: number;
    }
  | { type: 'lesson/complete'; lessonId: string; subject: Subject; now: number }
  | { type: 'reset' };

/** 按第一次作答正确率给星星：90% 以上 3 颗，60% 以上 2 颗，完成即有 1 颗 */
export function starsForAccuracy(correct: number, total: number): number {
  if (total <= 0) return 3; // 没有题目的课程，完成即满星
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'lesson/start': {
      const prev = state.lessons[action.lessonId];
      const resuming =
        action.resume && state.active !== null && state.active.lessonId === action.lessonId;
      const active: ActiveLesson = resuming
        ? { ...state.active!, updatedAt: action.now }
        : {
            lessonId: action.lessonId,
            subject: action.subject,
            stepIndex: 0,
            startedAt: action.now,
            updatedAt: action.now,
          };
      return {
        ...state,
        active,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            lessonId: action.lessonId,
            subject: action.subject,
            startCount: (prev?.startCount ?? 0) + (resuming ? 0 : 1),
            completedCount: prev?.completedCount ?? 0,
            bestStars: prev?.bestStars ?? 0,
            lastStudiedAt: action.now,
            firstCompletedAt: prev?.firstCompletedAt,
          },
        },
      };
    }

    case 'lesson/step': {
      if (!state.active || state.active.lessonId !== action.lessonId) return state;
      return {
        ...state,
        active: { ...state.active, stepIndex: action.stepIndex, updatedAt: action.now },
      };
    }

    case 'exercise/result': {
      const result: ExerciseResult = {
        lessonId: action.lessonId,
        exerciseId: action.exerciseId,
        subject: action.subject,
        skill: action.skill,
        firstTryCorrect: action.firstTryCorrect,
        attempts: Math.max(1, action.attempts),
        at: action.now,
      };
      const key = `${action.lessonId}/${action.exerciseId}`;
      const existing = state.mistakes[key];
      let mistakes = state.mistakes;
      if (!action.firstTryCorrect) {
        mistakes = {
          ...mistakes,
          [key]: {
            key,
            lessonId: action.lessonId,
            exerciseId: action.exerciseId,
            subject: action.subject,
            skill: action.skill,
            wrongCount: (existing?.wrongCount ?? 0) + 1,
            lastWrongAt: action.now,
            resolved: false,
          },
        };
      } else if (existing && !existing.resolved) {
        mistakes = { ...mistakes, [key]: { ...existing, resolved: true } };
      }
      const results = [...state.results, result];
      return {
        ...state,
        results: results.length > MAX_RESULTS ? results.slice(-MAX_RESULTS) : results,
        mistakes,
      };
    }

    case 'lesson/complete': {
      const startedAt =
        state.active && state.active.lessonId === action.lessonId
          ? state.active.startedAt
          : action.now;
      // 本次课程的题目结果 = 本次开始之后记录的结果
      const sessionResults = state.results.filter(
        (r) => r.lessonId === action.lessonId && r.at >= startedAt,
      );
      const correct = sessionResults.filter((r) => r.firstTryCorrect).length;
      const stars = starsForAccuracy(correct, sessionResults.length);
      const durationSec = Math.min(
        MAX_SESSION_SEC,
        Math.max(0, Math.round((action.now - startedAt) / 1000)),
      );
      const session: SessionRecord = {
        lessonId: action.lessonId,
        subject: action.subject,
        startedAt,
        endedAt: action.now,
        durationSec,
        firstTryCorrect: correct,
        exerciseCount: sessionResults.length,
        stars,
      };
      const prev = state.lessons[action.lessonId];
      const sessions = [...state.sessions, session];
      return {
        ...state,
        totalStars: state.totalStars + stars,
        active: state.active?.lessonId === action.lessonId ? null : state.active,
        sessions: sessions.length > MAX_SESSIONS ? sessions.slice(-MAX_SESSIONS) : sessions,
        lessons: {
          ...state.lessons,
          [action.lessonId]: {
            lessonId: action.lessonId,
            subject: action.subject,
            startCount: prev?.startCount ?? 1,
            completedCount: (prev?.completedCount ?? 0) + 1,
            bestStars: Math.max(prev?.bestStars ?? 0, stars),
            lastStudiedAt: action.now,
            firstCompletedAt: prev?.firstCompletedAt ?? action.now,
          },
        },
      };
    }

    case 'reset':
      return createEmptyProgress();

    default:
      return state;
  }
}

/**
 * 校验从存储中读出的数据。数据损坏时返回 null，由调用方决定如何处理。
 */
export function parseProgress(raw: string | null): ProgressState | null {
  if (raw === null) return createEmptyProgress();
  try {
    const data = JSON.parse(raw) as Partial<ProgressState>;
    if (
      typeof data !== 'object' ||
      data === null ||
      typeof data.totalStars !== 'number' ||
      typeof data.lessons !== 'object' ||
      !Array.isArray(data.results) ||
      !Array.isArray(data.sessions) ||
      typeof data.mistakes !== 'object'
    ) {
      return null;
    }
    // 以后版本升级时在这里做数据迁移
    return { ...createEmptyProgress(), ...data, version: PROGRESS_VERSION } as ProgressState;
  } catch {
    return null;
  }
}
