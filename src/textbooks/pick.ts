/**
 * 教材资源库简单视图（V4.1）：家长用下拉框选 科目 → 教材版本 → 年级 → 上/下册，直接看这一册的单元。
 * 纯函数，便于测试。只显示官方来源逐条核对过的目录；没核对的版本只提示，不显示单元。
 */
import { EDITIONS } from './editions';
import { volumesFor } from './registry';
import type { Edition, Term, Unit, Volume } from './types';

type Subj = Edition['subject'];

/** 不含开源题库那几册（它们按旧版单元排，不是某本课本） */
const bookVolumes = (editionId: string) => volumesFor({ editionId }).filter((v) => !v.id.startsWith('bank.'));

export const hasVerifiedToc = (editionId: string) => bookVolumes(editionId).some((v) => v.tocProvenance === 'verified' && v.units.length > 0);

/** 版本下拉选项：先列目录已核实的版本，再列还没核对的 */
export function editionOptions(subject: Subj): { value: string; label: string; hint?: string; group?: string }[] {
  const list = EDITIONS.filter((e) => e.subject === subject);
  const ok = list.filter((e) => hasVerifiedToc(e.id));
  const wait = list.filter((e) => !hasVerifiedToc(e.id));
  return [
    ...ok.map((e, i) => ({ value: e.id, label: e.name, hint: e.publisher, ...(i === 0 ? { group: '可以查看目录' } : {}) })),
    ...wait.map((e, i) => ({ value: e.id, label: `${e.name}（目录还没核对）`, hint: e.publisher, ...(i === 0 ? { group: '目录还没核对' } : {}) })),
  ];
}

/** 家长没选过时用这一科第一套已核实的版本 */
export function defaultEdition(subject: Subj, saved?: string): string {
  if (saved && EDITIONS.some((e) => e.id === saved && e.subject === subject)) return saved;
  return EDITIONS.find((e) => e.subject === subject && hasVerifiedToc(e.id))?.id ?? EDITIONS.find((e) => e.subject === subject)!.id;
}

/** 这套书有哪些年级（英语多数三年级起） */
export function gradesOf(editionId: string): number[] {
  const g = [...new Set(bookVolumes(editionId).map((v) => v.grade))].sort((a, b) => a - b);
  return g.length ? g : [1, 2, 3, 4, 5, 6];
}

/** 2～7 月是下册，8 月～次年 1 月是上册 */
export function currentTerm(d = new Date()): Term {
  const m = d.getMonth() + 1;
  return m >= 2 && m <= 7 ? '下' : '上';
}

/** 选中的那一册：优先目录已核实的、优先修订版 */
export function pickVolume(editionId: string, grade: number, term: Term): Volume | null {
  const vs = bookVolumes(editionId).filter((v) => v.grade === grade && v.term === term);
  const score = (v: Volume) => (v.tocProvenance === 'verified' && v.units.length ? 2 : 0) + (v.revision ? 1 : 0);
  return vs.sort((a, b) => score(b) - score(a))[0] ?? null;
}

/** 单元能不能练：有原创出题程序的知识点优先，其次题库单元；都没有返回 null */
export function unitPracticeId(u: Unit, hasGenerator: (kpId: string) => boolean): string | null {
  const kp = u.kpIds.find(hasGenerator);
  if (kp) return `kp:${kp}`;
  return u.bankUnitIds[0] ? `bank:${u.bankUnitIds[0]}` : null;
}
