/**
 * 复习与学习推荐（可解释的规则引擎）
 * 每条推荐都带“理由”，可追溯到知识点和具体练习记录。
 */
import type { ProgressState } from '@/progress/model';
import { ancestors, getKp, KNOWLEDGE_POINTS } from './graph';
import { hasGenerator } from './generators';
import { isMastered, type KpMastery } from './mastery';
import { isStruggling } from './diagnose';
import { kpForRecord } from './mapping';

export type KpRec =
  | { kind: 'diagnose'; kpId: string; reason: string }
  | { kind: 'review'; kpId: string; reason: string }
  | { kind: 'consolidate'; kpId: string; reason: string }
  | { kind: 'new'; kpId: string; reason: string };

const DAY = 24 * 3600 * 1000;

export function recommendKps(
  state: ProgressState,
  mastery: Record<string, KpMastery>,
  now: number,
  limit = 6,
): KpRec[] {
  const out: KpRec[] = [];
  const used = new Set<string>();
  const add = (r: KpRec) => {
    if (used.has(r.kpId)) return;
    used.add(r.kpId);
    out.push(r);
  };
  const ordered = [...KNOWLEDGE_POINTS].sort((a, b) => a.order - b.order);
  const recentDiag = (kpId: string) => state.diagnoses.some((d) => d.target === kpId && now - d.at < 3 * DAY);

  // 1. 反复出错 → 找原因（3 天内诊断过的不再推荐）
  for (const k of ordered) {
    const m = mastery[k.id];
    if (isStruggling(m) && hasGenerator(k.id) && !recentDiag(k.id)) {
      add({
        kind: 'diagnose',
        kpId: k.id,
        reason: `最近 ${m.recentTotal} 题只对了 ${m.recentCorrect} 题，先找找是哪一步没弄懂`,
      });
    }
  }
  // 2. 需要复习
  for (const k of ordered) {
    const m = mastery[k.id];
    if (m.state === 'needs-review') add({ kind: 'review', kpId: k.id, reason: m.reasons[m.reasons.length - 1] });
  }
  // 3. 诊断出的薄弱根因（最近一次诊断）
  const lastDiag = [...state.diagnoses].reverse()[0];
  for (const kpId of lastDiag?.roots ?? []) {
    if (!isMastered(mastery[kpId]?.state ?? 'not-started'))
      add({ kind: 'review', kpId, reason: `上次找原因时发现：${getKp(kpId)?.name} 还不太熟` });
  }
  // 根因都已补上 → 回到原来的知识点再练
  if (lastDiag && lastDiag.roots.length && !isMastered(mastery[lastDiag.target]?.state ?? 'not-started')) {
    if (lastDiag.roots.every((r) => isMastered(mastery[r]?.state ?? 'not-started'))) {
      add({
        kind: 'review',
        kpId: lastDiag.target,
        reason: `需要先补的「${lastDiag.roots.map((r) => getKp(r)?.name).join('、')}」已经练好，回来再练一次`,
      });
    }
  }
  // 4. 初步掌握 → 多练巩固
  for (const k of ordered) {
    const m = mastery[k.id];
    if (m.state === 'emerging' && hasGenerator(k.id))
      add({ kind: 'consolidate', kpId: k.id, reason: '已经初步掌握，换一天再练几题会更牢固' });
  }
  // 5. 可以学的新知识：hard 先修都已掌握；后续知识已经会了的（说明它也会）不推荐
  const masteredIds = ordered.filter((k) => isMastered(mastery[k.id].state)).map((k) => k.id);
  const impliedKnown = new Set(masteredIds.flatMap((id) => ancestors(id, true)));
  for (const k of ordered) {
    const m = mastery[k.id];
    if (m.state !== 'not-started' || !hasGenerator(k.id) || impliedKnown.has(k.id)) continue;
    const pres = k.prerequisites.filter((p) => p.strength === 'hard');
    if (pres.every((p) => isMastered(mastery[p.id]?.state ?? 'not-started'))) {
      add({
        kind: 'new',
        kpId: k.id,
        reason: pres.length ? `需要的本领（${pres.map((p) => getKp(p.id)?.name).join('、')}）已经掌握` : '这是起点知识',
      });
    }
  }
  return out.slice(0, limit);
}

/** 家长端：经常做错的题型（按练习形式和知识点统计第一次答错次数） */
export function frequentMistakeTypes(
  state: ProgressState,
  limit = 5,
): { label: string; wrong: number; total: number }[] {
  const add = (key: string, correct: boolean) => {
    const s = (stats[key] ??= { wrong: 0, total: 0 });
    s.total++;
    if (!correct) s.wrong++;
  };
  const stats: Record<string, { wrong: number; total: number }> = {};
  for (const r of state.results) {
    const kp = kpForRecord(r.lessonId, r.exerciseId, r.skill);
    if (!kp) continue;
    const form = r.lessonId.startsWith('oral:')
      ? '口算'
      : r.exerciseId.includes('fly') || r.exerciseId.includes('eat') || r.exerciseId.includes('join')
        ? '看图解决问题'
        : r.lessonId.startsWith('bank:')
          ? '题库题'
          : '课堂练习';
    add(`${getKp(kp)?.name} · ${form}`, r.firstTryCorrect);
  }
  return Object.entries(stats)
    .filter(([, s]) => s.wrong >= 2)
    .map(([label, s]) => ({ label, ...s }))
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
    .slice(0, limit);
}
