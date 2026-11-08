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
 * v5 — 新增思维训练：答对后“你是怎么想的”的思路选择 strategies、每日挑战记录 challenges
 * v6 — 新增英语单词卡生词本 wordbook（V2.18）
 * v7 — 新增游戏乐园记录 games；练习结果来源增加 game（V2.19）
 * v8 — 全 APP 统一童声（voiceGender 固定为 child）；新增开机动画开关 splash（V2.21）
 * v9 — 新增家长“拍照错题” photoMistakes（V4.1）：只存识别出的文字和同类题，不存照片
 */
export const PROGRESS_VERSION = 9;

/** AI 出的同类选择题（语文、英语）：标注“AI 生成，未经人工审核”，只在家长中心显示 */
export interface PhotoAiItem {
  question: string;
  options: string[];
  answer: string;
  explain: string;
}

/** 家长拍照录入的一道错题（V4.1） */
export interface PhotoMistake {
  id: string;
  at: number;
  subject: Subject;
  grade: number;
  /** 家长确认的知识点（可为空：AI 和家长都没选出合适的） */
  kpId: string;
  kpName: string;
  /** 家长确认（可修改）后的题目文字 */
  question: string;
  childAnswer: string;
  correctAnswer: string;
  /** AI 对错因的分析（家长可修改） */
  reason: string;
  /** 数学：原创出题程序出的同类题 id（kp:知识点:签名，可还原题目，答案由程序计算） */
  exerciseIds: string[];
  /** 语文、英语：AI 出的同类题 */
  aiItems: PhotoAiItem[];
}
export const MAX_PHOTO_MISTAKES = 200;

/** 答对后孩子选的解题思路（没有对错之分） */
export interface StrategyRecord {
  at: number;
  kp: string;
  lessonId: string;
  exerciseId: string;
  /** 思路编号，见 src/thinking/strategies.ts */
  choice: string;
}

/** 每日挑战（思维题）：不计入正确率，答错不扣分 */
export interface ChallengeRecord {
  at: number;
  /** 哪一天的挑战（本地日期 YYYY-MM-DD） */
  day: string;
  /** 题目 id（ch:类型:签名），可由它还原题目 */
  id: string;
  type: string;
  /** 主要锻炼的思维方面，见 src/thinking/dims.ts */
  dims: string[];
  firstTryCorrect: boolean;
  attempts: number;
  /** 当天第一道是每日挑战（得星星）；之后的是“再玩一道” */
  daily: boolean;
  /** 学科（V2.6 起记录；V2.5 的记录没有，按题型判断） */
  subject?: Subject;
  /** 这道题的难度档 1～4（V2.11 起记录，难度跟着孩子调整） */
  level?: number;
}

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
  /** 每日挑战难度跟着孩子调整（V2.11，默认开启；旧数据读入时补默认值） */
  adaptiveChallenge: boolean;
  /** 朗读声音（V2.16）：女声 / 男声 / 童声；家长可指定手机里的某个中文、英语声音（空 = 自动挑选）；语速 */
  voiceGender: 'female' | 'male' | 'child';
  voiceZh: string;
  voiceEn: string;
  speechRate: 'slow' | 'normal';
  /** 说话提问（V2.17）：家长同意后才打开麦克风，默认关闭；离线识别，声音不离开手机 */
  voiceInput: boolean;
  /** 游戏乐园每天最多玩几分钟（V2.19，默认 15；0 = 不限制，只提醒休息） */
  gameMinutes: number;
  /** 星星宝用云端自然语音朗读（V2.18，阿里云百炼 CosyVoice，需服务端配置密钥；默认开启，失败时用手机语音） */
  aiCloudVoice: boolean;
  /** 打开 APP 时播放开机动画（V2.21，默认开启） */
  splash: boolean;
  /** 教材资源库里家长选的教材版本（V4.1，空 = 自动选第一套已核实目录的版本） */
  textbookEdition: { chinese: string; math: string; english: string };
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
  source?: 'lesson' | 'review' | 'diagnose' | 'game';
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
  /** 思路选择记录（v5） */
  strategies: StrategyRecord[];
  /** 每日挑战记录（v5） */
  challenges: ChallengeRecord[];
  /** 英语单词卡生词本（v6）：按单词记；streak 为听写连续拼对次数，满 3 次自动移出 */
  wordbook: WordbookEntry[];
  /** 游戏乐园每局记录（v7）：用来算每天玩了多久、难度跟着孩子走 */
  games: GameRecord[];
  /** 家长拍照录入的错题（v9），新的在后 */
  photoMistakes: PhotoMistake[];
}

export type GameId = 'kitchen' | 'fish' | 'bubble';
export interface GameRecord {
  game: GameId;
  /** 结束时间 */
  at: number;
  /** 这局用时（秒，最多计 5 分钟） */
  sec: number;
  stars: number;
  /** 一次做对的题数 / 总题数 */
  correct: number;
  total: number;
  level: number;
}
export const MAX_GAMES = 500;

export interface WordbookEntry {
  w: string;
  streak: number;
  addedAt: number;
}
export const WORDBOOK_CLEAR_STREAK = 3;

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
    settings: {
      grade: 1,
      aiEnabled: false,
      aiBaseUrl: '',
      adaptiveChallenge: true,
      voiceGender: 'child',
      voiceZh: '',
      voiceEn: '',
      speechRate: 'slow',
      voiceInput: false,
      gameMinutes: 15,
      aiCloudVoice: true,
      splash: true,
      textbookEdition: { chinese: '', math: '', english: '' },
    },
    hidden: [],
    diagnoses: [],
    strategies: [],
    challenges: [],
    wordbook: [],
    games: [],
    photoMistakes: [],
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
      source?: 'lesson' | 'review' | 'diagnose' | 'game';
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
  /** 生词本：收藏（红心）、移除、听写结果（拼对连续 3 次移出；拼错自动加入并清零） */
  /** 玩完一局游戏：保存记录，奖励这局得到的星星 */
  | { type: 'game/complete'; record: GameRecord }
  | { type: 'photo/add'; entry: PhotoMistake }
  | { type: 'photo/remove'; id: string }
  | { type: 'wordbook/add'; w: string; now: number }
  | { type: 'wordbook/remove'; w: string }
  | { type: 'wordbook/dictation'; w: string; correct: boolean; now: number }
  | { type: 'bank/hide'; questionId: string }
  | { type: 'bank/unhide-all' }
  /** 完成一次前置知识诊断：保存结论，奖励 1 颗星 */
  | { type: 'diagnosis/complete'; record: DiagnosisRecord }
  /** 答对后选了解题思路 */
  | { type: 'strategy/choose'; record: StrategyRecord }
  /** 完成一道挑战题：当天第一道（daily）答对得 2 颗星、答错也得 1 颗星；之后的不再给星 */
  | { type: 'challenge/complete'; record: ChallengeRecord }
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

    case 'strategy/choose': {
      const strategies = [...state.strategies, action.record];
      return { ...state, strategies: strategies.length > MAX_RESULTS ? strategies.slice(-MAX_RESULTS) : strategies };
    }

    case 'game/complete': {
      const r = { ...action.record, sec: Math.max(0, Math.min(300, Math.round(action.record.sec))), stars: Math.max(0, Math.min(3, action.record.stars)) };
      const games = [...state.games, r];
      return { ...state, totalStars: state.totalStars + r.stars, games: games.length > MAX_GAMES ? games.slice(-MAX_GAMES) : games };
    }
    case 'photo/add': {
      const list = [...state.photoMistakes.filter((m) => m.id !== action.entry.id), action.entry];
      return { ...state, photoMistakes: list.length > MAX_PHOTO_MISTAKES ? list.slice(-MAX_PHOTO_MISTAKES) : list };
    }
    case 'photo/remove':
      return { ...state, photoMistakes: state.photoMistakes.filter((m) => m.id !== action.id) };
    case 'wordbook/add':
      return state.wordbook.some((e) => e.w === action.w)
        ? state
        : { ...state, wordbook: [...state.wordbook, { w: action.w, streak: 0, addedAt: action.now }] };
    case 'wordbook/remove':
      return { ...state, wordbook: state.wordbook.filter((e) => e.w !== action.w) };
    case 'wordbook/dictation': {
      const has = state.wordbook.find((e) => e.w === action.w);
      if (!action.correct)
        return has
          ? { ...state, wordbook: state.wordbook.map((e) => (e.w === action.w ? { ...e, streak: 0 } : e)) }
          : { ...state, wordbook: [...state.wordbook, { w: action.w, streak: 0, addedAt: action.now }] };
      if (!has) return state;
      const streak = has.streak + 1;
      return {
        ...state,
        wordbook:
          streak >= WORDBOOK_CLEAR_STREAK
            ? state.wordbook.filter((e) => e.w !== action.w)
            : state.wordbook.map((e) => (e.w === action.w ? { ...e, streak } : e)),
      };
    }
    case 'challenge/complete': {
      const r = action.record;
      const daily = r.daily && !state.challenges.some((c) => c.daily && c.day === r.day);
      const record = { ...r, daily };
      const challenges = [...state.challenges, record];
      return {
        ...state,
        totalStars: state.totalStars + challengeStars(record),
        challenges: challenges.length > MAX_RESULTS ? challenges.slice(-MAX_RESULTS) : challenges,
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

/** 挑战题的星星：每天第一道答对 2 颗、答错 1 颗（鼓励尝试）；“再玩一道”不给星 */
export function challengeStars(r: Pick<ChallengeRecord, 'daily' | 'firstTryCorrect'>): number {
  if (!r.daily) return 0;
  return r.firstTryCorrect ? 2 : 1;
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
    // v8：只保留童声，旧记录里的女声 / 男声一律改为童声
    settings: {
      ...createEmptyProgress().settings,
      ...(data.settings ?? {}),
      voiceGender: 'child',
      textbookEdition: {
        ...createEmptyProgress().settings.textbookEdition,
        ...(data.settings?.textbookEdition && typeof data.settings.textbookEdition === 'object' ? data.settings.textbookEdition : {}),
      },
    },
    hidden: Array.isArray(data.hidden) ? data.hidden : [],
    diagnoses: Array.isArray(data.diagnoses) ? data.diagnoses : [],
    strategies: Array.isArray(data.strategies) ? data.strategies : [],
    challenges: Array.isArray(data.challenges) ? data.challenges : [],
    wordbook: Array.isArray(data.wordbook)
      ? data.wordbook.filter((e) => e && typeof e.w === 'string').map((e) => ({ w: e.w, streak: Number(e.streak) || 0, addedAt: Number(e.addedAt) || 0 }))
      : [],
    games: Array.isArray(data.games) ? data.games.filter((g) => g && typeof g.game === 'string') : [],
    photoMistakes: Array.isArray(data.photoMistakes)
      ? data.photoMistakes
          .filter((m) => m && typeof m.id === 'string' && typeof m.question === 'string')
          .map((m) => ({
            ...m,
            exerciseIds: Array.isArray(m.exerciseIds) ? m.exerciseIds.filter((x) => typeof x === 'string') : [],
            aiItems: Array.isArray(m.aiItems) ? m.aiItems.filter((x) => x && Array.isArray(x.options)) : [],
          }))
      : [],
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
