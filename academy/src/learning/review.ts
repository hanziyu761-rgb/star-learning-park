import type { KnowledgePoint, Lesson, QuizQuestion } from '../curriculum/types';
import type { LearningEvent } from '../store/types';
import { localDay } from './progress';

// Spaced review by knowledge point. Evidence = first-attempt answers (lesson,
// review or practice) and finished experiments. Evidence is grouped by day:
// a day "passes" when at least 75% of that day's evidence was correct.
// Consecutive passing days push the next review further out; a failing day
// brings it back to tomorrow.

export const INTERVALS = [1, 1, 3, 7, 14, 30] as const;
export const PASS_RATIO = 0.75;

export interface ReviewState {
  kpId: string;
  /** Consecutive passing days. */
  streak: number;
  lastDay: string;
  lastPassed: boolean;
  dueDay: string;
  /** All first-attempt evidence counted so far. */
  attempts: number;
  correct: number;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(y, m - 1, d + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** One piece of evidence per (event, knowledge point). */
function evidence(events: LearningEvent[]): { kp: string; day: string; ok: boolean }[] {
  const out: { kp: string; day: string; ok: boolean }[] = [];
  for (const e of events) {
    if (e.type === 'answer' && e.attemptNo === 1) for (const kp of e.knowledgePoints) out.push({ kp, day: localDay(e.at), ok: e.correct });
    if (e.type === 'experiment') for (const kp of e.knowledgePoints) out.push({ kp, day: localDay(e.at), ok: e.mistakes === 0 });
  }
  return out;
}

export function reviewStates(events: LearningEvent[]): Map<string, ReviewState> {
  const byKp = new Map<string, Map<string, { n: number; ok: number }>>();
  for (const ev of evidence(events)) {
    const days = byKp.get(ev.kp) ?? new Map();
    const d = days.get(ev.day) ?? { n: 0, ok: 0 };
    d.n += 1; if (ev.ok) d.ok += 1;
    days.set(ev.day, d);
    byKp.set(ev.kp, days);
  }
  const states = new Map<string, ReviewState>();
  for (const [kpId, days] of byKp) {
    let streak = 0, attempts = 0, correct = 0, lastDay = '', lastPassed = false;
    for (const day of [...days.keys()].sort()) {
      const d = days.get(day)!;
      attempts += d.n; correct += d.ok;
      lastPassed = d.ok / d.n >= PASS_RATIO;
      streak = lastPassed ? streak + 1 : 0;
      lastDay = day;
    }
    const interval = INTERVALS[Math.min(streak, INTERVALS.length - 1)];
    states.set(kpId, { kpId, streak, lastDay, lastPassed, dueDay: addDays(lastDay, interval), attempts, correct });
  }
  return states;
}

export function dueKnowledgePoints(events: LearningEvent[], today: string): ReviewState[] {
  return [...reviewStates(events).values()]
    .filter((s) => s.dueDay <= today)
    .sort((a, b) => a.dueDay.localeCompare(b.dueDay) || Number(a.lastPassed) - Number(b.lastPassed));
}

/** Knowledge points that are learned but not solid: last day failed, or still at the first step. */
export function weakKnowledgePoints(events: LearningEvent[]): ReviewState[] {
  return [...reviewStates(events).values()].filter((s) => !s.lastPassed);
}

export interface ReviewItem { lessonId: string; question: QuizQuestion; kpId: string }

/**
 * Picks one question per knowledge point (up to `max`), preferring review-only
 * questions and the question this child answered longest ago.
 */
export function buildReviewSession(kpIds: string[], lessons: Lesson[], events: LearningEvent[], max = 6): ReviewItem[] {
  const lastSeen = new Map<string, string>();
  for (const e of events) if (e.type === 'answer') lastSeen.set(e.questionId, e.at);
  const items: ReviewItem[] = [];
  const used = new Set<string>();
  for (const kpId of kpIds) {
    if (items.length >= max) break;
    const pool: { lessonId: string; q: QuizQuestion; reviewOnly: boolean }[] = [];
    for (const l of lessons) {
      for (const q of l.review ?? []) if (q.knowledgePoints.includes(kpId)) pool.push({ lessonId: l.id, q, reviewOnly: true });
      for (const s of l.steps) if (s.kind === 'quiz') for (const q of s.questions) if (q.knowledgePoints.includes(kpId)) pool.push({ lessonId: l.id, q, reviewOnly: false });
    }
    const pick = pool
      .filter((p) => !used.has(p.q.id))
      .sort((a, b) => (lastSeen.get(a.q.id) ?? '').localeCompare(lastSeen.get(b.q.id) ?? '') || Number(b.reviewOnly) - Number(a.reviewOnly))[0];
    if (pick) { used.add(pick.q.id); items.push({ lessonId: pick.lessonId, question: pick.q, kpId }); }
  }
  return items;
}

/** Prerequisite knowledge points (from other lessons) that are not solid yet. */
export function weakPrerequisites(lesson: Lesson, allKps: KnowledgePoint[], events: LearningEvent[]): { kp: KnowledgePoint; reason: 'not-learned' | 'weak' }[] {
  const own = new Set(lesson.knowledgePoints.map((k) => k.id));
  const pre = new Set(lesson.knowledgePoints.flatMap((k) => k.prerequisites).filter((id) => !own.has(id)));
  const states = reviewStates(events);
  const out: { kp: KnowledgePoint; reason: 'not-learned' | 'weak' }[] = [];
  for (const id of pre) {
    const kp = allKps.find((k) => k.id === id);
    if (!kp) continue;
    const s = states.get(id);
    if (!s) out.push({ kp, reason: 'not-learned' });
    else if (!s.lastPassed) out.push({ kp, reason: 'weak' });
  }
  return out;
}
