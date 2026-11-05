/**
 * 家长中心与首页使用的统计。全部根据真实学习记录计算。
 */
import type { Subject } from '@/lesson/types';
import type { MistakeEntry, ProgressState, SessionRecord } from './model';
import { isDue } from './srs';

export interface SubjectStats {
  subject: Subject;
  completedLessons: number;
  sessions: number;
  exercises: number;
  firstTryCorrect: number;
  /** 0–100，没有做过题时为 null */
  accuracy: number | null;
  studySec: number;
  lastStudiedAt: number | null;
}

export interface SkillStats {
  skill: string;
  subject: Subject;
  total: number;
  correct: number;
  accuracy: number;
}

export const SUBJECTS: Subject[] = ['math', 'chinese', 'english'];

export function subjectStats(state: ProgressState, subject: Subject): SubjectStats {
  // 正确率只统计课程中的作答；复习作答单独统计，避免重复计入
  const results = state.results.filter((r) => r.subject === subject && (r.source ?? 'lesson') === 'lesson');
  const sessions = state.sessions.filter((s) => s.subject === subject);
  const correct = results.filter((r) => r.firstTryCorrect).length;
  const lessons = Object.values(state.lessons).filter((l) => l.subject === subject);
  const last = lessons.reduce<number | null>((m, l) => (m === null || l.lastStudiedAt > m ? l.lastStudiedAt : m), null);
  return {
    subject,
    completedLessons: lessons.filter((l) => l.completedCount > 0).length,
    sessions: sessions.length,
    exercises: results.length,
    firstTryCorrect: correct,
    accuracy: results.length ? Math.round((correct / results.length) * 100) : null,
    studySec: sessions.reduce((s, x) => s + x.durationSec, 0),
    lastStudiedAt: last,
  };
}

export function skillStats(state: ProgressState): SkillStats[] {
  const map = new Map<string, SkillStats>();
  for (const r of state.results) {
    const s = map.get(r.skill) ?? {
      skill: r.skill,
      subject: r.subject,
      total: 0,
      correct: 0,
      accuracy: 0,
    };
    s.total += 1;
    if (r.firstTryCorrect) s.correct += 1;
    map.set(r.skill, s);
  }
  return [...map.values()].map((s) => ({ ...s, accuracy: Math.round((s.correct / s.total) * 100) }));
}

/** 薄弱知识点：至少做过 2 题，且第一次作答正确率低于 70% */
export function weakSkills(state: ProgressState): SkillStats[] {
  return skillStats(state)
    .filter((s) => s.total >= 2 && s.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function openMistakes(state: ProgressState): MistakeEntry[] {
  return Object.values(state.mistakes)
    .filter((m) => !m.resolved)
    .sort((a, b) => b.lastWrongAt - a.lastWrongAt);
}

export function recentSessions(state: ProgressState, limit = 10): SessionRecord[] {
  return [...state.sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, limit);
}

export function isSameLocalDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export function studySecOnDay(state: ProgressState, day: number): number {
  return state.sessions.filter((s) => isSameLocalDay(s.endedAt, day)).reduce((sum, s) => sum + s.durationSec, 0);
}

/** 最近 7 天（含今天）有完成课程的天数 */
export function activeDaysLast7(state: ProgressState, now: number): number {
  let days = 0;
  for (let i = 0; i < 7; i++) {
    const day = now - i * 24 * 3600 * 1000;
    if (state.sessions.some((s) => isSameLocalDay(s.endedAt, day))) days += 1;
  }
  return days;
}

export function completedSubjectToday(state: ProgressState, subject: Subject, now: number): boolean {
  return state.sessions.some((s) => s.subject === subject && isSameLocalDay(s.endedAt, now));
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} 秒`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟`;
  return `${Math.floor(min / 60)} 小时 ${min % 60} 分钟`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 今天到期、需要复习的错题（按盒子从低到高、错得越近越靠前） */
export function dueMistakes(state: ProgressState, now: number): MistakeEntry[] {
  return Object.values(state.mistakes)
    .filter((m) => isDue(m.srs, now))
    .sort((a, b) => a.srs.box - b.srs.box || b.lastWrongAt - a.lastWrongAt);
}
