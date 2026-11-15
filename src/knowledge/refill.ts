/**
 * 新题用完以后出哪些旧题（V5.2.5）：不再随便挑，而是
 *   1. 最近一次做错的题（错题回炉）
 *   2. 做错过、后来做对了的题（巩固）
 *   3. 一直做对的题里，隔得最久没做的
 * 纯函数，只看真实学习记录。“自己填数”的变体（:in）算同一道题。
 */
import type { Exercise } from '@/lesson/types';
import type { ProgressState } from '@/progress/model';
import { exerciseFromKpId, kpRound } from './generators';

const base = (id: string) => id.replace(/:in$/, '');
type Rand = () => number;

interface Seen {
  id: string;
  lastAt: number;
  lastWrong: boolean;
  everWrong: boolean;
}

/** 某几个知识点里做过的题，按“该先复习的在前”排好 */
export function reviewOrder(state: ProgressState, kpIds: string[]): string[] {
  const want = new Set(kpIds);
  const map = new Map<string, Seen>();
  for (const r of state.results) {
    if (!r.exerciseId.startsWith('kp:')) continue;
    const id = base(r.exerciseId);
    if (!want.has(id.split(':')[1])) continue;
    const s = map.get(id) ?? { id, lastAt: 0, lastWrong: false, everWrong: false };
    if (r.at >= s.lastAt) {
      s.lastAt = r.at;
      s.lastWrong = !r.firstTryCorrect;
    }
    if (!r.firstTryCorrect) s.everWrong = true;
    map.set(id, s);
  }
  const rank = (s: Seen) => (s.lastWrong ? 0 : s.everWrong ? 1 : 2);
  return [...map.values()].sort((a, b) => rank(a) - rank(b) || a.lastAt - b.lastAt).map((s) => s.id);
}

/** 从做过的题里按复习顺序挑 count 道（跳过 skip 里的） */
export function reviewPicks(state: ProgressState, kpIds: string[], count: number, skip: Set<string> = new Set()): Exercise[] {
  const out: Exercise[] = [];
  for (const id of reviewOrder(state, kpIds)) {
    if (out.length >= count) break;
    if (skip.has(id)) continue;
    const e = exerciseFromKpId(id);
    if (e) {
      out.push(e);
      skip.add(id);
    }
  }
  return out;
}

/** 知识点练习一轮：先出没做过的；新题不够时，用该复习的旧题补（而不是随便重复） */
export function kpRoundWithReview(state: ProgressState, kpId: string, count: number, rand: Rand): Exercise[] {
  const done = new Set(state.results.filter((r) => r.exerciseId.startsWith('kp:')).map((r) => base(r.exerciseId)));
  const fresh = kpRound(kpId, count, rand, done).filter((e) => !done.has(base(e.id)));
  if (fresh.length >= count) return fresh;
  const skip = new Set(fresh.map((e) => base(e.id)));
  const out = [...fresh, ...reviewPicks(state, [kpId], count - fresh.length, skip)];
  // 题目本来就少、记录里也没有的（极少见），照旧随机补足
  for (const e of kpRound(kpId, count, rand)) {
    if (out.length >= count) break;
    if (!skip.has(base(e.id))) {
      skip.add(base(e.id));
      out.push(e);
    }
  }
  return out;
}
