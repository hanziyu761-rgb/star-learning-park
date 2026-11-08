import type { Lesson, Grade } from '../curriculum/types';
import type { LearningEvent } from '../store/types';

// Everything here is derived from recorded events. Nothing is estimated or invented.

export interface LessonProgress {
  lessonId: string;
  started: boolean;
  completed: boolean;
  stepsDone: Set<string>;
  activeMs: number;
  lastAt: string | null;
}

export function lessonProgress(lesson: Lesson, events: LearningEvent[]): LessonProgress {
  const mine = events.filter((e) => e.lessonId === lesson.id);
  const stepsDone = new Set<string>();
  for (const e of mine) if (e.type === 'step_done') stepsDone.add(e.stepId);
  return {
    lessonId: lesson.id,
    started: mine.some((e) => e.type === 'lesson_start'),
    completed: mine.some((e) => e.type === 'lesson_complete'),
    stepsDone,
    activeMs: mine.reduce((sum, e) => sum + e.activeMs, 0),
    lastAt: mine.length ? mine[mine.length - 1].at : null,
  };
}

export function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function totalActiveMs(events: LearningEvent[]): number {
  return events.reduce((s, e) => s + e.activeMs, 0);
}

export function activeMsOnDay(events: LearningEvent[], day: string): number {
  return events.filter((e) => localDay(e.at) === day).reduce((s, e) => s + e.activeMs, 0);
}

/** Study minutes per day for the last `days` days, oldest first. */
export function dailyMinutes(events: LearningEvent[], days: number, now = new Date()): { day: string; minutes: number }[] {
  const out: { day: string; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = localDay(d.toISOString());
    out.push({ day, minutes: Math.round(activeMsOnDay(events, day) / 60000) });
  }
  return out;
}

export function formatMinutes(ms: number): string {
  const min = Math.round(ms / 60000);
  if (ms > 0 && min === 0) return '不到 1 分钟';
  if (min < 60) return `${min} 分钟`;
  return `${Math.floor(min / 60)} 小时 ${min % 60} 分钟`;
}

/**
 * What to show on "继续学习": an unfinished started lesson (most recent first),
 * else the first lesson not yet completed, else null (all done).
 */
export function nextLesson(lessons: Lesson[], events: LearningEvent[]): { lesson: Lesson; resume: boolean } | null {
  const progress = lessons.map((l) => lessonProgress(l, events));
  const unfinished = progress.filter((p) => p.started && !p.completed).sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''));
  if (unfinished.length) return { lesson: lessons.find((l) => l.id === unfinished[0].lessonId)!, resume: true };
  const fresh = lessons.find((l) => !progress.find((p) => p.lessonId === l.id)!.completed);
  return fresh ? { lesson: fresh, resume: false } : null;
}

/** Prerequisite lessons the learner has not completed yet. */
export function missingPrerequisites(lesson: Lesson, all: Lesson[], events: LearningEvent[]): Lesson[] {
  return lesson.prerequisites
    .map((id) => all.find((l) => l.id === id))
    .filter((l): l is Lesson => !!l && !lessonProgress(l, events).completed);
}

export function completedCount(lessons: Lesson[], events: LearningEvent[]): number {
  return lessons.filter((l) => lessonProgress(l, events).completed).length;
}

export function isLowerGrade(grade: Grade): boolean {
  return grade <= 2;
}
