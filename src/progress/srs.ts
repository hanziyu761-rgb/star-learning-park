/**
 * 错题间隔复习（Leitner 三盒法）
 *
 * 算法移植自 ChinaStudyFree `packages/core/src/srs.ts`
 * （MIT License, Copyright (c) 2026 tanle-mtr, https://github.com/tanle-mtr/ChinaStudyFree），
 * 改为纯函数：时间由调用方传入，便于测试和在 reducer 中使用。
 *
 * 规则：
 * - 答错 → 回到第 1 盒，当天再练，累计答对清零
 * - 答对 → 第 1 盒升到第 2 盒（明天复习）→ 第 3 盒（3 天后）→ 留在第 3 盒（7 天后）
 * - 第 3 盒且累计答对 ≥ 2 次 → 已掌握（毕业），不再出现在复习中
 */

export type SrsBox = 1 | 2 | 3;

export interface SrsState {
  box: SrsBox;
  correctCount: number;
  /** 下次复习日期（本地日期 YYYY-MM-DD） */
  nextReviewDay: string;
  lastReviewedAt?: number;
}

export const SRS_GRADUATE_MIN_BOX = 3;
export const SRS_GRADUATE_MIN_CORRECT = 2;

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(ts: number, n: number): string {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
}

export function newSrs(now: number): SrsState {
  return { box: 1, correctCount: 0, nextReviewDay: dayKey(now) };
}

export function reviewSrs(s: SrsState, correct: boolean, now: number): SrsState {
  if (!correct) return { box: 1, correctCount: 0, nextReviewDay: dayKey(now), lastReviewedAt: now };
  const correctCount = s.correctCount + 1;
  switch (s.box) {
    case 1:
      return { box: 2, correctCount, nextReviewDay: addDays(now, 1), lastReviewedAt: now };
    case 2:
      return { box: 3, correctCount, nextReviewDay: addDays(now, 3), lastReviewedAt: now };
    default:
      return { box: 3, correctCount, nextReviewDay: addDays(now, 7), lastReviewedAt: now };
  }
}

export function isGraduated(s: SrsState): boolean {
  return s.box >= SRS_GRADUATE_MIN_BOX && s.correctCount >= SRS_GRADUATE_MIN_CORRECT;
}

export function isDue(s: SrsState, now: number): boolean {
  return !isGraduated(s) && s.nextReviewDay <= dayKey(now);
}
