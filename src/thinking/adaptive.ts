/**
 * 每日挑战难度跟着孩子走（V2.11）。
 * 起点：家长设的年级对应的难度档（一年级 1 档、二年级 2 档、三四年级 3 档、五六年级 4 档）。
 * 看这一科最近 5 道挑战：一次答对 4 道以上 → 难一档；最多一次答对 1 道（至少做了 3 道）→ 容易一档。
 * 只在年级起点上下各一档内调整；一、二年级不升到三档（三档题目不注拼音）。
 */
import type { Subject } from '@/lesson/types';
import type { ChallengeRecord, ProgressState } from '@/progress/model';
import { levelOfGrade, type Level } from './challenges';
import { subjectOfType } from './registry';
import { contentGrade } from '@/progress/grade';

export const RECENT = 5;

/** 每个年级可以调整的范围 */
export function levelRange(grade: number): [Level, Level] {
  const base = levelOfGrade(grade);
  if (base <= 2) return [1, 2];
  return [(base - 1) as Level, 4];
}

export interface AdaptiveLevel {
  level: Level;
  base: Level;
  change: 'up' | 'down' | 'keep';
  recent: number;
  recentCorrect: number;
}

export function adaptiveLevel(grade: number, records: ChallengeRecord[], subject: Subject): AdaptiveLevel {
  const base = levelOfGrade(grade);
  const [lo, hi] = levelRange(grade);
  const mine = records.filter((r) => (r.subject ?? subjectOfType(r.type)) === subject).slice(-RECENT);
  const recentCorrect = mine.filter((r) => r.firstTryCorrect).length;
  let change: AdaptiveLevel['change'] = 'keep';
  if (mine.length >= 4 && recentCorrect >= 4) change = 'up';
  else if (mine.length >= 3 && recentCorrect <= 1) change = 'down';
  const want = base + (change === 'up' ? 1 : change === 'down' ? -1 : 0);
  const level = Math.min(hi, Math.max(lo, want)) as Level;
  return { level, base, change: level === base ? 'keep' : change, recent: mine.length, recentCorrect };
}

export const LEVEL_NAME: Record<Level, string> = {
  1: '一年级难度',
  2: '二年级难度',
  3: '三四年级难度',
  4: '五六年级难度',
};

/** 实际使用的难度档：家长关掉“跟着孩子调整”时固定按年级 */
export function challengeLevel(state: ProgressState, subject: Subject): AdaptiveLevel {
  if (state.settings.adaptiveChallenge === false) {
    const base = levelOfGrade(contentGrade(state.settings.grade));
    return { level: base, base, change: 'keep', recent: 0, recentCorrect: 0 };
  }
  return adaptiveLevel(contentGrade(state.settings.grade), state.challenges, subject);
}
