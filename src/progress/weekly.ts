/**
 * 家长周报与连续打卡（V5.4，纯函数，只用真实学习记录）：
 * - 打卡：哪天至少做过 1 道题或完成过 1 次学习就算学了；连续天数从今天（今天还没学就从昨天）往回数
 * - 奖章：最长连续天数达到 3 / 7 / 14 / 30 / 100 天
 * - 周报：最近 7 天（含今天）与之前 7 天比较：学了几天、多少分钟、做了几题、一次答对率；
 *   进步 / 要加油的本领（这 7 天和以前各至少 4 题，一次答对率相差 15 个百分点以上）；这 7 天错得最多的本领
 */
import type { ProgressState } from './model';
import { dayKey } from './srs';

const DAY = 24 * 3600 * 1000;
export const STREAK_BADGES = [3, 7, 14, 30, 100];

/** 有学习的日子（本地日期） */
export function studyDays(state: ProgressState): Set<string> {
  const days = new Set<string>();
  for (const r of state.results) days.add(dayKey(r.at));
  for (const s of state.sessions) days.add(dayKey(s.endedAt));
  return days;
}

/** 某一天往前 n 天的日期 */
const back = (now: number, n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return dayKey(d.getTime());
};

export interface Streak {
  /** 现在连续了几天 */
  current: number;
  /** 今天学了没有 */
  today: boolean;
  /** 最长连续 */
  best: number;
  /** 最近 7 天（从 6 天前到今天）每天学了没有 */
  last7: boolean[];
  /** 已经拿到的奖章（天数） */
  badges: number[];
}

export function streak(state: ProgressState, now: number): Streak {
  const days = studyDays(state);
  const today = days.has(dayKey(now));
  let current = 0;
  for (let i = today ? 0 : 1; days.has(back(now, i)); i++) current++;
  // 最长连续：把日期排好，数连着的
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of sorted) {
    const p = new Date(`${d}T12:00:00`);
    p.setDate(p.getDate() - 1);
    run = prev === dayKey(p.getTime()) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return {
    current,
    today,
    best,
    last7: Array.from({ length: 7 }, (_, i) => days.has(back(now, 6 - i))),
    badges: STREAK_BADGES.filter((b) => best >= b),
  };
}

export interface SkillChange {
  skill: string;
  before: number;
  now: number;
  total: number;
}

export interface Weekly {
  days: number;
  minutes: number;
  questions: number;
  /** 一次答对率（%），没做题时为 null */
  accuracy: number | null;
  prev: { days: number; minutes: number; questions: number; accuracy: number | null };
  improved: SkillChange[];
  slipped: SkillChange[];
  /** 这 7 天错得最多的本领：[skill, 错几次] */
  topWrong: [string, number][];
}

export function weekly(state: ProgressState, now: number): Weekly {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const from = start.getTime() - 6 * DAY;
  const prevFrom = from - 7 * DAY;
  const span = (a: number, b: number) => {
    const rs = state.results.filter((r) => r.at >= a && r.at < b);
    const ss = state.sessions.filter((s) => s.endedAt >= a && s.endedAt < b);
    const days = new Set([...rs.map((r) => dayKey(r.at)), ...ss.map((s) => dayKey(s.endedAt))]).size;
    const ok = rs.filter((r) => r.firstTryCorrect).length;
    return {
      days,
      minutes: Math.round(ss.reduce((t, s) => t + s.durationSec, 0) / 60),
      questions: rs.length,
      accuracy: rs.length ? Math.round((ok / rs.length) * 100) : null,
    };
  };
  const end = now + 1;
  const cur = span(from, end);
  const prev = span(prevFrom, from);

  // 每个本领：这 7 天 vs 以前
  const by = new Map<string, { a: [number, number]; b: [number, number] }>();
  for (const r of state.results) {
    if (r.at >= end) continue;
    const x = by.get(r.skill) ?? { a: [0, 0], b: [0, 0] };
    const slot = r.at >= from ? x.a : x.b;
    slot[0] += r.firstTryCorrect ? 1 : 0;
    slot[1] += 1;
    by.set(r.skill, x);
  }
  const changes: SkillChange[] = [];
  for (const [skill, { a, b }] of by)
    if (a[1] >= 4 && b[1] >= 4) changes.push({ skill, now: Math.round((a[0] / a[1]) * 100), before: Math.round((b[0] / b[1]) * 100), total: a[1] });
  const wrong = new Map<string, number>();
  for (const r of state.results) if (r.at >= from && r.at < end && !r.firstTryCorrect) wrong.set(r.skill, (wrong.get(r.skill) ?? 0) + 1);

  return {
    ...cur,
    prev,
    improved: changes.filter((c) => c.now - c.before >= 15).sort((x, y) => y.now - y.before - (x.now - x.before)).slice(0, 3),
    slipped: changes.filter((c) => c.before - c.now >= 15).sort((x, y) => y.before - y.now - (x.before - x.now)).slice(0, 3),
    topWrong: [...wrong].sort((x, y) => y[1] - x[1]).slice(0, 3),
  };
}
