/**
 * 按“课程/练习 id + 题目 id”找回题目，用于今日复习。
 * 支持：精做课程、题库（bank:）、口算（oral:）。
 */
import type { Exercise, Subject } from '@/lesson/types';
import { findBankExercise, findUnit } from './bank';
import { exerciseLabel, getLesson } from './index';
import { exerciseFromKpId } from '@/knowledge/generators';
import { getKp } from '@/knowledge/graph';
import { findOralExercise, ORAL_TOPICS } from './oral';
import { dictationTitle, findDictation, isDictationId } from './zhDictation';
import { quizTitle } from '@/knowledge/quiz';
import { plainText } from './zh';
import { ALL_WRITE_SETS, isWriteLessonId, traceExercise } from './writing';
import { bubbleExercise } from '@/games/bubble';
import { fishExercise } from '@/games/fish';
import { kitchenExercise } from '@/games/kitchen';

const GAME_SOURCES: Record<string, { subject: Subject; name: string; make: (id: string) => Exercise | null }> = {
  'game:kitchen': { subject: 'math', name: '游戏 · 凑数小厨房', make: kitchenExercise },
  'game:fish': { subject: 'chinese', name: '游戏 · 拼音钓鱼', make: fishExercise },
  'game:bubble': { subject: 'english', name: '游戏 · 拼词泡泡', make: bubbleExercise },
};

export interface ResolvedExercise {
  exercise: Exercise;
  subject: Subject;
  /** 来源名称（显示“来自：…”） */
  source: string;
}

export type ExerciseResolver = (lessonId: string, exerciseId: string) => ResolvedExercise | null;

export const resolveExercise: ExerciseResolver = (lessonId, exerciseId) => {
  const game = GAME_SOURCES[lessonId];
  if (game) {
    const ex = game.make(exerciseId);
    return ex ? { exercise: ex, subject: game.subject, source: game.name } : null;
  }
  if (lessonId.startsWith('kp:') || lessonId.startsWith('diag:') || lessonId.startsWith('mix:') || lessonId.startsWith('quiz:')) {
    const ex = exerciseFromKpId(exerciseId);
    // 今日一练（mix:）的知识点从题目 id 里取
    // 单元小测（quiz:，V5.4）也从题目 id 里取（综合小测里有好几个知识点）
    const kp = getKp(lessonId.startsWith('mix:') || lessonId.startsWith('quiz:') ? (exerciseId.split(':')[1] ?? '') : lessonId.split(':')[1]);
    return ex ? { exercise: ex, subject: kp?.subject ?? 'math', source: `知识点 · ${kp?.name ?? ''}` } : null;
  }
  const bank = findBankExercise(lessonId, exerciseId);
  if (bank)
    return { exercise: bank.exercise, subject: bank.book.subject, source: `${bank.book.title} · ${bank.unit.title}` };
  if (isWriteLessonId(lessonId)) {
    try {
      return {
        exercise: traceExercise(exerciseId.replace(/^write-/, '')),
        subject: 'chinese',
        source: sourceName(lessonId),
      };
    } catch {
      return null;
    }
  }
  const oral = findOralExercise(lessonId, exerciseId);
  if (oral) return { exercise: oral.exercise, subject: 'math', source: `口算 · ${oral.topic.title}` };
  // 语文听写、古诗文默写（V5.4）
  const dict = findDictation(lessonId, exerciseId);
  if (dict) return { exercise: dict, subject: 'chinese', source: sourceName(lessonId) };
  const lesson = getLesson(lessonId);
  if (!lesson) return null;
  for (const s of lesson.steps) {
    if (s.kind === 'exercise' && s.exercise.id === exerciseId) {
      return { exercise: s.exercise, subject: lesson.subject, source: plainText(lesson.title) };
    }
  }
  return null;
};

/** 课程、题库单元、口算的显示名称 */
export function sourceName(lessonId: string): string {
  if (GAME_SOURCES[lessonId]) return GAME_SOURCES[lessonId].name;
  if (lessonId.startsWith('bank:')) {
    const f = findUnit(lessonId.slice(5));
    return f ? `${f.book.title} · ${f.unit.title}` : lessonId;
  }
  if (lessonId.startsWith('mix:')) return '今日一练';
  if (lessonId.startsWith('quiz:')) return quizTitle(lessonId);
  if (lessonId.startsWith('kp:') || lessonId.startsWith('diag:')) {
    const k = getKp(lessonId.split(':')[1]);
    return k ? `${lessonId.startsWith('diag:') ? '找原因' : '知识点练习'} · ${k.name}` : lessonId;
  }
  if (isWriteLessonId(lessonId)) {
    const set = ALL_WRITE_SETS[Number(lessonId.slice(6)) - 1];
    return set ? `描红写字 · ${set.map((c) => c.char).join(' ')}` : lessonId;
  }
  if (lessonId.startsWith('oral:')) {
    const t = ORAL_TOPICS.find((x) => `oral:${x.id}` === lessonId);
    return t ? `口算 · ${t.title}` : lessonId;
  }
  if (isDictationId(lessonId)) {
    const g = Number(lessonId.slice(7));
    return `${dictationTitle(g)}（${g}年级）`;
  }
  const l = getLesson(lessonId);
  return l ? plainText(l.title) : lessonId;
}

/** 错题的题目文字（家长中心显示） */
export function mistakeLabel(lessonId: string, exerciseId: string): string {
  if (isWriteLessonId(lessonId)) return `描红：${exerciseId.replace(/^write-/, '')}`;
  if (lessonId.startsWith('game:bubble')) {
    const r = resolveExercise(lessonId, exerciseId);
    return r && r.exercise.kind === 'choice' ? `拼写：${r.exercise.answerId}` : exerciseId;
  }
  // 知识点练习、找原因（kp: / diag:）也按题目还原（V5.2 修正：以前只显示题目编号）
  if (!/^(bank|oral|game|kp|diag|mix|zdict|quiz):/.test(lessonId)) return exerciseLabel(lessonId, exerciseId);
  const r = resolveExercise(lessonId, exerciseId);
  if (!r) return exerciseId;
  const e = r.exercise;
  const text = (t: string | { char: string }[]) => (typeof t === 'string' ? t : t.map((x) => x.char).join(''));
  if (e.kind === 'truefalse') return text(e.statement.text);
  if ((e.kind === 'choice' || e.kind === 'input') && e.stem?.text) {
    // “算一算”这类很短的指令、英语的“Choose the best answer.”只显示题目本身；“解方程，x 等于多少？”这类连同算式一起显示
    const p = text(e.prompt.text);
    return /\p{Script=Han}/u.test(p) && Array.from(p).length > 4 ? `${p} ${text(e.stem.text)}` : text(e.stem.text);
  }
  return text(e.prompt.text);
}
