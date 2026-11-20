import type { Dimension, Level, KnowledgePoint } from '../curriculum/types';
import type { LearningEvent, Work } from '../store/types';

// Five-dimension evaluation. Every level carries the evidence it was based on,
// so a parent can see exactly why. Only the child's own actions count:
// - quiz answers count on the FIRST attempt only (retries after seeing the answer don't count)
// - experiments count when finished
// - works count only the parts the child made (not AI or template text)

export interface KpMastery {
  kpId: string;
  attempts: number;
  correct: number;
  /** 0..1, or null when there is no evidence yet. */
  score: number | null;
}

export function knowledgePointMastery(kps: KnowledgePoint[], events: LearningEvent[]): Map<string, KpMastery> {
  const m = new Map<string, KpMastery>();
  for (const kp of kps) m.set(kp.id, { kpId: kp.id, attempts: 0, correct: 0, score: null });
  // Latest first-attempt answer per question (a re-done lesson replaces the older evidence).
  const latestFirst = new Map<string, Extract<LearningEvent, { type: 'answer' }>>();
  for (const e of events) if (e.type === 'answer' && e.attemptNo === 1) latestFirst.set(e.questionId, e);
  const add = (kpIds: string[], ok: boolean) => {
    for (const id of kpIds) {
      const x = m.get(id);
      if (!x) continue;
      x.attempts += 1;
      if (ok) x.correct += 1;
    }
  };
  for (const e of latestFirst.values()) add(e.knowledgePoints, e.correct);
  const latestExp = new Map<string, Extract<LearningEvent, { type: 'experiment' }>>();
  for (const e of events) if (e.type === 'experiment') latestExp.set(e.lessonId + '/' + e.stepId, e);
  for (const e of latestExp.values()) add(e.knowledgePoints, e.mistakes === 0);
  for (const x of m.values()) x.score = x.attempts ? x.correct / x.attempts : null;
  return m;
}

export function childShare(work: Work): number {
  if (!work.parts.length) return 0;
  return work.parts.filter((p) => p.by === 'child' || p.by === 'child_edited_ai').length / work.parts.length;
}

export interface AbilityResult {
  dimension: Dimension;
  level: Level;
  reason: string;
  evidence: string[];
}

export function abilityLevels(kps: KnowledgePoint[], events: LearningEvent[], works: Work[]): AbilityResult[] {
  const mastery = knowledgePointMastery(kps, events);
  const dims: Dimension[] = ['cognition', 'application', 'computational', 'critical', 'creation'];
  return dims.map((dim) => {
    if (dim === 'creation') return creationLevel(works);
    const dimKps = kps.filter((k) => k.dimension === dim);
    const ids = new Set(dimKps.map((k) => k.id));
    const evidenceEvents = events.filter((e) =>
      (e.type === 'answer' || e.type === 'experiment') && e.knowledgePoints.some((k) => ids.has(k)));
    if (!evidenceEvents.length) return { dimension: dim, level: 0, reason: '还没有这方面的学习记录', evidence: [] };
    const solid = dimKps.filter((k) => { const x = mastery.get(k.id)!; return x.score !== null && x.attempts >= 2 && x.score >= 0.75; });
    const cleanExperiments = events.filter((e) =>
      e.type === 'experiment' && e.mistakes === 0 && e.knowledgePoints.some((k) => ids.has(k)));
    const evidence = evidenceEvents.map((e) => e.id);
    if (solid.length >= 2 && cleanExperiments.length >= 1) {
      return { dimension: dim, level: 3, reason: `${solid.length} 个知识点首次作答正确率 ≥ 75%，并独立一次做对互动实验`, evidence };
    }
    if (solid.length >= 2) return { dimension: dim, level: 2, reason: `${solid.length} 个知识点首次作答正确率 ≥ 75%`, evidence };
    return { dimension: dim, level: 1, reason: `已有 ${evidenceEvents.length} 条练习或实验记录`, evidence };
    // Level 4 (创造迁移) for these dimensions needs transfer tasks, which arrive in V2.
  });
}

function creationLevel(works: Work[]): AbilityResult {
  const own = works.filter((w) => childShare(w) >= 0.5);
  if (!works.length) return { dimension: 'creation', level: 0, reason: '还没有作品', evidence: [] };
  if (!own.length) return { dimension: 'creation', level: 1, reason: '有作品，但孩子自己完成的部分不到一半', evidence: works.map((w) => w.id) };
  // A rule the child designed, or an improvement the child made after testing.
  const hasRule = own.filter((w) => w.parts.some((p) => (p.field === 'rule' || p.field === 'improvement') && p.by === 'child'));
  const hasReason = hasRule.filter((w) => w.parts.some((p) => p.field === 'reason' && p.by === 'child' && p.value.trim().length >= 4));
  if (hasReason.length) return { dimension: 'creation', level: 4, reason: '独立设计或改进了作品，并用自己的话说明了理由', evidence: hasReason.map((w) => w.id) };
  if (hasRule.length) return { dimension: 'creation', level: 3, reason: '独立设计了带规则的作品，或测试后自己改进了作品', evidence: hasRule.map((w) => w.id) };
  return { dimension: 'creation', level: 2, reason: '独立完成了一件作品', evidence: own.map((w) => w.id) };
}
