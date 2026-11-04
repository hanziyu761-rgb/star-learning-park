/**
 * 前置知识诊断引擎（原创实现，纯函数，会话可序列化）
 *
 * 触发条件（避免因一两道错题武断下结论）：某知识点累计 ≥ 3 次作答、最近 5 次答对率 < 60%。
 *
 * 流程：先用 2–3 道题确认目标知识点本身；只有确认“薄弱”时，才沿 hard 先修关系往前查。
 * 每个知识点的判定：
 *   - 前两题都对                → 掌握（不再往前查）
 *   - 前两题都错                → 薄弱（往前查它的 hard 先修）
 *   - 一对一错 → 再出第 3 题：对 → 不稳（不往前查，一次错可能是粗心）；错 → 薄弱
 * 已有“较稳定掌握”记录的先修直接视为掌握，不再出题（减少孩子负担）。
 * 题量上限默认 12 题；到上限仍未判定的点记为“未测”。
 * 根因 = 判为薄弱、且其已测的 hard 先修都不薄弱的知识点。
 */
import { getKp, topoOrder } from './graph';
import { hasGenerator } from './generators';
import type { MasteryState } from './mastery';

export type Verdict = 'mastered' | 'shaky' | 'weak';

export interface DiagAnswer {
  kpId: string;
  exerciseId: string;
  correct: boolean;
}

export interface DiagSession {
  target: string;
  limit: number;
  /** 待检查的知识点（栈，末尾先查） */
  stack: string[];
  current: string | null;
  currentAnswers: boolean[];
  verdicts: Record<string, Verdict>;
  /** 因已有稳定掌握记录而跳过的知识点 */
  skipped: string[];
  answers: DiagAnswer[];
  done: boolean;
}

export const STRUGGLE_MIN_ATTEMPTS = 3;
export const STRUGGLE_MAX_ACCURACY = 0.6;

export function isStruggling(m: { attempts: number; recentCorrect: number; recentTotal: number }): boolean {
  return m.attempts >= STRUGGLE_MIN_ATTEMPTS && m.recentTotal > 0 && m.recentCorrect / m.recentTotal < STRUGGLE_MAX_ACCURACY;
}

export function startDiagnosis(target: string, limit = 12): DiagSession {
  if (!getKp(target)) throw new Error(`未知知识点：${target}`);
  return { target, limit, stack: [target], current: null, currentAnswers: [], verdicts: {}, skipped: [], answers: [], done: false };
}

/** 判定一个知识点：返回结论，或 null 表示还要再出题 */
export function judge(answers: boolean[]): Verdict | null {
  if (answers.length >= 2 && answers[0] && answers[1]) return 'mastered';
  if (answers.length >= 2 && !answers[0] && !answers[1]) return 'weak';
  if (answers.length >= 3) return answers.filter(Boolean).length >= 2 ? 'shaky' : 'weak';
  return null;
}

/**
 * 下一道题考哪个知识点；返回 null 表示诊断结束。
 * mastery：已有的掌握状态，用来跳过“较稳定掌握”的先修。
 */
export function nextKp(s: DiagSession, mastery: Record<string, { state: MasteryState }> = {}): { session: DiagSession; kpId: string | null } {
  let session = { ...s, stack: [...s.stack], skipped: [...s.skipped], verdicts: { ...s.verdicts } };
  if (session.done) return { session, kpId: null };
  if (session.answers.length >= session.limit) return { session: { ...session, done: true, current: null }, kpId: null };
  if (session.current) return { session, kpId: session.current };
  while (session.stack.length) {
    const kp = session.stack.pop()!;
    if (session.verdicts[kp]) continue;
    if (kp !== session.target && mastery[kp]?.state === 'stable') {
      session.verdicts[kp] = 'mastered';
      session.skipped.push(kp);
      continue;
    }
    if (!hasGenerator(kp)) continue; // 没有题目可出的知识点不诊断（结果中列为未测）
    session = { ...session, current: kp, currentAnswers: [] };
    return { session, kpId: kp };
  }
  return { session: { ...session, done: true, current: null }, kpId: null };
}

/** 记录一题的作答 */
export function answer(s: DiagSession, exerciseId: string, correct: boolean): DiagSession {
  if (!s.current) throw new Error('当前没有在诊断的知识点');
  const kp = s.current;
  const currentAnswers = [...s.currentAnswers, correct];
  const answers = [...s.answers, { kpId: kp, exerciseId, correct }];
  const v = judge(currentAnswers);
  if (!v) return { ...s, currentAnswers, answers };
  const verdicts = { ...s.verdicts, [kp]: v };
  let stack = s.stack;
  if (v === 'weak') {
    // 薄弱：把它的 hard 先修压栈，按知识顺序从后往前查（最近的先修先查）
    const pres = (getKp(kp)?.prerequisites ?? []).filter((p) => p.strength === 'hard' && !verdicts[p.id]).map((p) => p.id);
    const ordered = topoOrder(pres); // 先修在前
    stack = [...s.stack, ...ordered];
  }
  return { ...s, current: null, currentAnswers: [], answers, verdicts, stack };
}

export interface DiagSummary {
  target: string;
  targetVerdict: Verdict | 'untested';
  roots: string[];
  weak: string[];
  shaky: string[];
  mastered: string[];
  /** 根因的 hard 先修中没测到的（真正的原因可能更靠前） */
  untestedPrereqs: string[];
  /** 建议学习顺序（先修在前） */
  path: string[];
  questionCount: number;
}

export function summarize(s: DiagSession): DiagSummary {
  const by = (v: Verdict) => Object.keys(s.verdicts).filter((k) => s.verdicts[k] === v);
  const weak = by('weak');
  const shaky = by('shaky');
  const roots = weak.filter((k) =>
    (getKp(k)?.prerequisites ?? []).filter((p) => p.strength === 'hard').every((p) => s.verdicts[p.id] !== 'weak'),
  );
  const untestedPrereqs = [
    ...new Set(
      roots.flatMap((k) =>
        (getKp(k)?.prerequisites ?? []).filter((p) => p.strength === 'hard' && !s.verdicts[p.id]).map((p) => p.id),
      ),
    ),
  ];
  return {
    target: s.target,
    targetVerdict: s.verdicts[s.target] ?? 'untested',
    roots: topoOrder(roots),
    weak,
    shaky,
    mastered: by('mastered'),
    untestedPrereqs,
    path: topoOrder([...weak, ...shaky]),
    questionCount: s.answers.length,
  };
}
