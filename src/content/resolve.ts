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
import { plainText } from './zh';

export interface ResolvedExercise {
  exercise: Exercise;
  subject: Subject;
  /** 来源名称（显示“来自：…”） */
  source: string;
}

export type ExerciseResolver = (lessonId: string, exerciseId: string) => ResolvedExercise | null;

export const resolveExercise: ExerciseResolver = (lessonId, exerciseId) => {
  if (lessonId.startsWith('kp:') || lessonId.startsWith('diag:')) {
    const ex = exerciseFromKpId(exerciseId);
    const kp = getKp(lessonId.split(':')[1]);
    return ex ? { exercise: ex, subject: kp?.subject ?? 'math', source: `知识点 · ${kp?.name ?? ''}` } : null;
  }
  const bank = findBankExercise(lessonId, exerciseId);
  if (bank)
    return { exercise: bank.exercise, subject: bank.book.subject, source: `${bank.book.title} · ${bank.unit.title}` };
  const oral = findOralExercise(lessonId, exerciseId);
  if (oral) return { exercise: oral.exercise, subject: 'math', source: `口算 · ${oral.topic.title}` };
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
  if (lessonId.startsWith('bank:')) {
    const f = findUnit(lessonId.slice(5));
    return f ? `${f.book.title} · ${f.unit.title}` : lessonId;
  }
  if (lessonId.startsWith('kp:') || lessonId.startsWith('diag:')) {
    const k = getKp(lessonId.split(':')[1]);
    return k ? `${lessonId.startsWith('diag:') ? '找原因' : '知识点练习'} · ${k.name}` : lessonId;
  }
  if (lessonId.startsWith('oral:')) {
    const t = ORAL_TOPICS.find((x) => `oral:${x.id}` === lessonId);
    return t ? `口算 · ${t.title}` : lessonId;
  }
  const l = getLesson(lessonId);
  return l ? plainText(l.title) : lessonId;
}

/** 错题的题目文字（家长中心显示） */
export function mistakeLabel(lessonId: string, exerciseId: string): string {
  if (!lessonId.startsWith('bank:') && !lessonId.startsWith('oral:')) return exerciseLabel(lessonId, exerciseId);
  const r = resolveExercise(lessonId, exerciseId);
  if (!r) return exerciseId;
  const e = r.exercise;
  const text = (t: string | { char: string }[]) => (typeof t === 'string' ? t : t.map((x) => x.char).join(''));
  if (e.kind === 'truefalse') return text(e.statement.text);
  if (e.kind === 'choice' && e.stem?.text) return text(e.stem.text);
  return text(e.prompt.text);
}
