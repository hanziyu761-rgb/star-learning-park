/**
 * 知识点掌握度（可解释的规则，不使用大模型）
 *
 * 证据：所有能映射到该知识点的练习记录（课程、口算、题库、知识点练习、复习、诊断），按“第一次是否答对”计。
 * 规则（按顺序判断）：
 *   1. 没有任何记录                                   → 尚未学习
 *   2. 少于 3 次作答                                   → 正在学习（证据太少，不下结论）
 *   3. 最近 5 次答对率 < 60%                           → 以前曾达到初步掌握：需要复习；否则：正在学习
 *   4. 最近 5 次答对率 ≥ 80%、累计 ≥ 5 次、在 ≥ 2 天练过 → 较稳定掌握（但 21 天没练：需要复习）
 *   5. 其余（答对率 ≥ 60%）                            → 初步掌握（但 7 天没练：需要复习）
 *   6. 若有以前留下、今天到期的错题，“初步掌握 / 较稳定掌握”降为需要复习
 */
import type { ProgressState } from '@/progress/model';
import { dayKey, isDue } from '@/progress/srs';
import { KNOWLEDGE_POINTS } from './graph';
import { kpForRecord } from './mapping';

export type MasteryState = 'not-started' | 'learning' | 'emerging' | 'needs-review' | 'stable';

export const MASTERY_LABEL: Record<MasteryState, string> = {
  'not-started': '尚未学习',
  learning: '正在学习',
  emerging: '初步掌握',
  'needs-review': '需要复习',
  stable: '较稳定掌握',
};

export interface Evidence {
  at: number;
  correct: boolean;
  lessonId: string;
  exerciseId: string;
  source: string;
}

export interface KpMastery {
  kpId: string;
  state: MasteryState;
  attempts: number;
  recentCorrect: number;
  recentTotal: number;
  days: number;
  lastAt: number | null;
  /** 判断依据（给家长看，可追溯） */
  reasons: string[];
  /** 最近的证据（最多 10 条） */
  evidence: Evidence[];
}

const DAY = 24 * 3600 * 1000;
const dayOf = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function evidenceByKp(state: ProgressState): Record<string, Evidence[]> {
  const out: Record<string, Evidence[]> = {};
  for (const r of state.results) {
    const kp = kpForRecord(r.lessonId, r.exerciseId, r.skill);
    if (!kp) continue;
    (out[kp] ??= []).push({ at: r.at, correct: r.firstTryCorrect, lessonId: r.lessonId, exerciseId: r.exerciseId, source: r.source ?? 'lesson' });
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.at - b.at);
  return out;
}

export function masteryOf(kpId: string, ev: Evidence[], now: number, dueMistake = false): KpMastery {
  const attempts = ev.length;
  const recent = ev.slice(-5);
  const recentCorrect = recent.filter((e) => e.correct).length;
  const days = new Set(ev.map((e) => dayOf(e.at))).size;
  const lastAt = attempts ? ev[attempts - 1].at : null;
  const base = { kpId, attempts, recentCorrect, recentTotal: recent.length, days, lastAt, evidence: ev.slice(-10) };
  if (attempts === 0) return { ...base, state: 'not-started', reasons: ['还没有练习记录'] };

  const acc = recentCorrect / recent.length;
  const since = Math.floor((now - (lastAt ?? now)) / DAY);
  const accText = `最近 ${recent.length} 题第一次答对 ${recentCorrect} 题`;
  // 历史上是否曾达到过“初步掌握”（任意时刻最近 5 次 ≥ 60% 且累计 ≥ 3 次）
  let hadGood = false;
  for (let i = 3; i < attempts; i++) {
    const w = ev.slice(Math.max(0, i - 5), i);
    if (w.filter((e) => e.correct).length / w.length >= 0.6) hadGood = true;
  }

  let state: MasteryState;
  const reasons = [accText, `共练习 ${attempts} 次，分布在 ${days} 天`, since === 0 ? '今天练过' : `${since} 天前最后一次练习`];
  if (attempts < 3) {
    state = 'learning';
    reasons.push('练习次数还少，暂不下结论');
  } else if (acc < 0.6) {
    state = hadGood ? 'needs-review' : 'learning';
    reasons.push(hadGood ? '以前做得不错，最近错得多' : '答对率还不到 60%');
  } else if (acc >= 0.8 && attempts >= 5 && days >= 2) {
    state = since > 21 ? 'needs-review' : 'stable';
    if (since > 21) reasons.push('超过 21 天没练，需要复习');
  } else {
    state = since > 7 ? 'needs-review' : 'emerging';
    if (since > 7) reasons.push('超过 7 天没练，需要复习');
    else if (attempts < 5 || days < 2) reasons.push('还需要在不同的日子多练几次才算稳定');
  }
  if (dueMistake && (state === 'emerging' || state === 'stable')) {
    state = 'needs-review';
    reasons.push('有到期需要复习的错题');
  }
  return { ...base, state, reasons };
}

export function computeMastery(state: ProgressState, now: number): Record<string, KpMastery> {
  const ev = evidenceByKp(state);
  const dueKps = new Set<string>();
  for (const m of Object.values(state.mistakes)) {
    // 今天刚做错的题已经体现在答对率里，只看以前留下、今天到期的错题
    if (!isDue(m.srs, now) || dayKey(m.lastWrongAt) >= dayKey(now)) continue;
    const kp = kpForRecord(m.lessonId, m.exerciseId, m.skill);
    if (kp) dueKps.add(kp);
  }
  return Object.fromEntries(KNOWLEDGE_POINTS.map((k) => [k.id, masteryOf(k.id, ev[k.id] ?? [], now, dueKps.has(k.id))]));
}

export function countByState(m: Record<string, KpMastery>): Record<MasteryState, number> {
  const out: Record<MasteryState, number> = { 'not-started': 0, learning: 0, emerging: 0, 'needs-review': 0, stable: 0 };
  for (const x of Object.values(m)) out[x.state]++;
  return out;
}

/** “已掌握”= 初步掌握 + 较稳定掌握 */
export const isMastered = (s: MasteryState) => s === 'emerging' || s === 'stable';
