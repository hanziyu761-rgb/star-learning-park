/**
 * 学习进度数据模型（纯函数，不依赖界面和存储，便于测试）。
 *
 * 设计要点：
 * - 每道题记录“第一次是否答对”和“尝试次数”，正确率按第一次作答计算，重试不会掩盖错误。
 * - 错题单独汇总，并按知识点（skill）统计，为以后的智能复习做准备。
 * - 只有真实发生的学习行为才会写入记录，不生成任何示例数据。
 */
import type { Subject } from '@/lesson/types';
import { dayKey, isGraduated, newSrs, reviewSrs, type SrsState } from './srs';

/**
 * 数据版本：
 * v1 — V1.0
 * v2 — 错题增加间隔复习状态 srs；练习结果增加来源 source；新增复习记录 reviews
 * v3 — 新增设置 settings（年级、AI 老师开关）和家长屏蔽的题库题目 hidden
 * v4 — 新增前置知识诊断记录 diagnoses；练习结果来源增加 diagnose
 */
export const PROGRESS_VERSION = 4;

export interface DiagnosisRecord {
  at: number;
  target: string;
  verdicts: Record<string, 'mastered' | 'shaky' | 'weak'>;
  roots: string[];
  questionCount: number;
}

export interface Settings {
  /** 题库与口算使用的年级（1–6），由家长设置 */
  grade: number;
  /** 家长是否开启 AI 老师（默认关闭） */
  aiEnabled: boolean;
  /** AI 服务地址（家长填写或构建时预设），不含任何密钥 */
  aiBaseUrl: string;
}

export interface ExerciseResult {
  lessonId: string;
  exerciseId: string;
  subject: Subject;
  skill: string;
  firstTryCorrect: boolean;
  attempts: number;
  at: number;
  /** 来自课程还是“今日复习”；v1 旧记录没有此字段，视为课程 */
  source?: 'lesson' | 'review' | 'diagnose';
}

export interface MistakeEntry {
  key: string; // lessonId/exerciseId
  lessonId: string;
  exerciseId: string;
  subject: Subject;
  skill: string;
  wrongCount: number;
  lastWrongAt: number;
  /** 已掌握：间隔复习达到毕业条件（第 3 盒且累计答对 ≥ 2 次） */
  resolved: boolean;
  /** 间隔复习状态 */
  srs: SrsState;
}

export interface ReviewRecord {
  at: number;
  count: number;
  firstTryCorrect: number;
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
  /** 完成的“今日复习”记录 */
  reviews: ReviewRecord[];
  settings: Settings;
  /** 家长或孩子标记“这题有问题”而屏蔽的题库题目 id */
  hidden: string[];
  /** 前置知识诊断记录 */
  diagnoses: DiagnosisRecord[];
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
    reviews: [],
    settings: { grade: 1, aiEnabled: false, aiBaseUrl: '' },
    hidden: [],
    diagnoses: [],
  };
}

export type ProgressAction =
  | {
      type: 'lesson/start';
      lessonId: string;
      subject: Subject;
      now: number;
      resume: boolean;
    }
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
      source?: 'lesson' | 'review' | 'diagnose';
    }
  | { type: 'lesson/complete'; lessonId: string; subject: Subject; now: number }
  /** 完成一轮题库或口算练习（不影响“继续学习”的课程） */
  | {
      type: 'practice/complete';
      lessonId: string;
      subject: Subject;
      startedAt: number;
      now: number;
    }
  | { type: 'settings/set'; settings: Partial<Settings> }
  | { type: 'bank/hide'; questionId: string }
  | { type: 'bank/unhide-all' }
  /** 完成一次前置知识诊断：保存结论，奖励 1 颗星 */
  | { type: 'diagnosis/complete'; record: DiagnosisRecord }
  /** 完成一轮今日复习：奖励 1 颗星 */
  | {
      type: 'review/complete';
      now: number;
      count: number;
      firstTryCorrect: number;
    }
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
      const resuming = action.resume && state.active !== null && state.active.lessonId === action.lessonId;
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
        active: {
          ...state.active,
          stepIndex: action.stepIndex,
          updatedAt: action.now,
        },
      };
    }

    case 'exercise/result': {
      const source = action.source ?? 'lesson';
      const result: ExerciseResult = {
        lessonId: action.lessonId,
        exerciseId: action.exerciseId,
        subject: action.subject,
        skill: action.skill,
        firstTryCorrect: action.firstTryCorrect,
        attempts: Math.max(1, action.attempts),
        at: action.now,
        source,
      };
      const key = `${action.lessonId}/${action.exerciseId}`;
      const existing = state.mistakes[key];
      let mistakes = state.mistakes;
      if (!action.firstTryCorrect) {
        // 答错：加入错题，回到第 1 盒，当天就能复习
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
            srs: existing ? reviewSrs(existing.srs, false, action.now) : newSrs(action.now),
          },
        };
      } else if (existing && !existing.resolved) {
        // 已有错题再次一次答对：按间隔复习升盒，达到条件才算掌握
        const srs = reviewSrs(existing.srs, true, action.now);
        mistakes = {
          ...mistakes,
          [key]: { ...existing, srs, resolved: isGraduated(srs) },
        };
      }
      const results = [...state.results, result];
      return {
        ...state,
        results: results.length > MAX_RESULTS ? results.slice(-MAX_RESULTS) : results,
        mistakes,
      };
    }

    case 'review/complete': {
      if (action.count <= 0) return state;
      const reviews = [
        ...state.reviews,
        {
          at: action.now,
          count: action.count,
          firstTryCorrect: action.firstTryCorrect,
        },
      ];
      return {
        ...state,
        totalStars: state.totalStars + 1,
        reviews: reviews.length > MAX_SESSIONS ? reviews.slice(-MAX_SESSIONS) : reviews,
      };
    }

    case 'settings/set':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'bank/hide':
      return state.hidden.includes(action.questionId)
        ? state
        : { ...state, hidden: [...state.hidden, action.questionId] };

    case 'bank/unhide-all':
      return { ...state, hidden: [] };

    case 'diagnosis/complete': {
      const diagnoses = [...state.diagnoses, action.record];
      return {
        ...state,
        totalStars: state.totalStars + (action.record.questionCount > 0 ? 1 : 0),
        diagnoses: diagnoses.length > MAX_SESSIONS ? diagnoses.slice(-MAX_SESSIONS) : diagnoses,
      };
    }

    case 'practice/complete':
      return completeSession(state, action.lessonId, action.subject, action.startedAt, action.now, false);

    case 'lesson/complete': {
      const startedAt = state.active && state.active.lessonId === action.lessonId ? state.active.startedAt : action.now;
      return completeSession(state, action.lessonId, action.subject, startedAt, action.now, true);
    }

    case 'reset':
      return createEmptyProgress();

    default:
      return state;
  }
}

/** 结束一次学习（课程或练习）：计算星星、时长，记录学习次数 */
function completeSession(
  state: ProgressState,
  lessonId: string,
  subject: Subject,
  startedAt: number,
  now: number,
  clearActive: boolean,
): ProgressState {
  const action = { lessonId, subject, now };
  {
    // 本次课程的题目结果 = 本次开始之后记录的结果
    const sessionResults = state.results.filter(
      (r) => r.lessonId === action.lessonId && r.at >= startedAt && (r.source ?? 'lesson') === 'lesson',
    );
    const correct = sessionResults.filter((r) => r.firstTryCorrect).length;
    const stars = starsForAccuracy(correct, sessionResults.length);
    const durationSec = Math.min(MAX_SESSION_SEC, Math.max(0, Math.round((action.now - startedAt) / 1000)));
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
      active: clearActive && state.active?.lessonId === action.lessonId ? null : state.active,
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
}

/**
 * 把旧版本数据升级到当前版本。只增加字段，不删除任何已有记录。
 */
export function migrateProgress(data: ProgressState, now: number = Date.now()): ProgressState {
  const mistakes: Record<string, MistakeEntry> = {};
  for (const [k, m] of Object.entries(data.mistakes ?? {})) {
    const old = m as Partial<MistakeEntry> & MistakeEntry;
    if (old.srs) {
      mistakes[k] = old;
    } else if (old.resolved) {
      // v1 已掌握的错题：视为已毕业
      mistakes[k] = {
        ...old,
        srs: { box: 3, correctCount: 2, nextReviewDay: dayKey(now) },
      };
    } else {
      // v1 未掌握的错题：进入第 1 盒，今天即可复习
      mistakes[k] = { ...old, srs: newSrs(now) };
    }
  }
  return {
    ...createEmptyProgress(),
    ...data,
    mistakes,
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    settings: { ...createEmptyProgress().settings, ...(data.settings ?? {}) },
    hidden: Array.isArray(data.hidden) ? data.hidden : [],
    diagnoses: Array.isArray(data.diagnoses) ? data.diagnoses : [],
    version: PROGRESS_VERSION,
  };
}

/**
 * 校验从存储中读出的数据。数据损坏时返回 null，由调用方决定如何处理。
 */
export function parseProgress(raw: string | null, now: number = Date.now()): ProgressState | null {
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
    return migrateProgress(data as ProgressState, now);
  } catch {
    return null;
  }
}
