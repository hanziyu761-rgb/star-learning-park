/**
 * 个性化学习建议（规则版）
 *
 * 思路来自 EduAgent `study_plans.py`（MIT License, Copyright (c) 2025 Student Trainee Center,
 * https://github.com/StudentTraineeCenter/edu-agent）：按知识点统计正确率，低于 70% 判为薄弱，
 * 再结合可用的学习资源给出计划。EduAgent 把这些交给大模型写计划；
 * 这里先用确定性规则直接给出可点击的下一步，结果完全由真实学习记录决定，可测试、离线可用。
 */
import type { Exercise, Lesson } from '@/lesson/types';
import type { MistakeEntry, ProgressState } from './model';
import { dueMistakes, weakSkills } from './stats';

export interface ReviewItem {
  mistake: MistakeEntry;
  lesson: Lesson;
  exercise: Exercise;
}

export function findExercise(lessons: Lesson[], lessonId: string, exerciseId: string) {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  for (const s of lesson.steps) {
    if (s.kind === 'exercise' && s.exercise.id === exerciseId) return { lesson, exercise: s.exercise };
  }
  return null;
}

/**
 * 今天可以在“今日复习”里单独重做的错题（最多 limit 道）。
 * 演示类、操作类环节（如“合起来”“开放题”）不能单独重做，它们通过“薄弱知识点 → 重学该课”来复习。
 */
export function reviewQueue(state: ProgressState, lessons: Lesson[], now: number, limit = 10): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const m of dueMistakes(state, now)) {
    const found = findExercise(lessons, m.lessonId, m.exerciseId);
    if (found) items.push({ mistake: m, ...found });
    if (items.length >= limit) break;
  }
  return items;
}

export type Suggestion =
  | { kind: 'continue'; lessonId: string }
  | { kind: 'review'; count: number }
  | { kind: 'weak'; lessonId: string; skill: string; accuracy: number }
  | { kind: 'new'; lessonId: string }
  | { kind: 'more-stars'; lessonId: string; bestStars: number };

/** 每节课包含的知识点 */
export function lessonSkills(lesson: Lesson): string[] {
  const set = new Set<string>();
  for (const s of lesson.steps) {
    if (s.kind === 'exercise') set.add(s.exercise.skill);
    else if ('skill' in s) set.add(s.skill);
  }
  return [...set];
}

export function suggestNext(state: ProgressState, lessons: Lesson[], now: number, limit = 3): Suggestion[] {
  const out: Suggestion[] = [];
  const used = new Set<string>();
  const push = (s: Suggestion) => {
    if ('lessonId' in s) {
      if (used.has(s.lessonId)) return;
      used.add(s.lessonId);
    }
    out.push(s);
  };

  // 1. 没学完的课
  if (state.active && lessons.some((l) => l.id === state.active!.lessonId)) {
    push({ kind: 'continue', lessonId: state.active.lessonId });
  }
  // 2. 今天到期的错题复习
  const due = reviewQueue(state, lessons, now).length;
  if (due > 0) out.push({ kind: 'review', count: due });
  // 3. 薄弱知识点 → 推荐包含该知识点的课程再学一次
  for (const w of weakSkills(state)) {
    const lesson = lessons.find((l) => lessonSkills(l).includes(w.skill));
    if (lesson) push({ kind: 'weak', lessonId: lesson.id, skill: w.skill, accuracy: w.accuracy });
  }
  // 4. 还没学过的课（按学科轮流，每科按顺序）
  const notDone = lessons
    .filter((l) => !(state.lessons[l.id]?.completedCount ?? 0))
    .sort((a, b) => a.order - b.order);
  for (const l of notDone) push({ kind: 'new', lessonId: l.id });
  // 5. 还能拿更多星星的课
  for (const l of lessons) {
    const p = state.lessons[l.id];
    if (p && p.completedCount > 0 && p.bestStars < 3) push({ kind: 'more-stars', lessonId: l.id, bestStars: p.bestStars });
  }
  return out.slice(0, limit);
}
