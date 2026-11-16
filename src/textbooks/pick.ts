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

/** 家长没选过时用这一科第一套已核实的版本；给了年级时优先选有这个年级的版本（初中生默认看初中课本） */
export function defaultEdition(subject: Subj, saved?: string, grade?: number): string {
  // 记住的版本里没有孩子现在的年级（例如以前选的小学课本、现在是七年级）时，改开有这个年级的版本（V5.2.3）
  const savedOk = saved && EDITIONS.some((e) => e.id === saved && e.subject === subject);
  if (savedOk && (!grade || bookVolumes(saved).some((v) => v.grade === grade))) return saved;
  const ok = EDITIONS.filter((e) => e.subject === subject && hasVerifiedToc(e.id));
  const fit = grade ? ok.find((e) => bookVolumes(e.id).some((v) => v.grade === grade)) : undefined;
  return (fit ?? ok[0] ?? EDITIONS.find((e) => e.subject === subject)!).id;
}

/** 这套书有哪些年级（英语多数三年级起） */
export function gradesOf(editionId: string): number[] {
  const g = [...new Set(bookVolumes(editionId).map((v) => v.grade))].sort((a, b) => a - b);
  return g.length ? g : [1, 2, 3, 4, 5, 6];
}

/** 小学版本和对应的初中版本：x ↔ x-jh（统编版 ↔ 统编版（初中）等，V5.2.6） */
const exists = (id: string) => EDITIONS.some((e) => e.id === id);
const isJuniorEdition = (id: string) => id.endsWith('-jh');
function primaryOf(subject: Subj, editionId: string): string {
  const base = editionId.replace(/-jh$/, '');
  return isJuniorEdition(editionId) ? (exists(base) ? base : defaultEdition(subject, undefined, 1)) : editionId;
}
function juniorOf(subject: Subj, editionId: string): string | null {
  const jh = `${editionId.replace(/-jh$/, '')}-jh`;
  if (exists(jh)) return jh;
  const any = EDITIONS.find((e) => e.subject === subject && isJuniorEdition(e.id) && hasVerifiedToc(e.id));
  return any?.id ?? null;
}

/** 年级下拉框：小学这套书的年级 + 初中（七～九年级，用对应的初中课本） */
export function gradeOptions(subject: Subj, editionId: string): number[] {
  const jh = juniorOf(subject, editionId);
  const all = [...gradesOf(primaryOf(subject, editionId)), ...(jh ? gradesOf(jh) : [])];
  return [...new Set(all)].sort((a, b) => a - b);
}

/** 选了某个年级时实际打开哪套书：七～九年级换成对应的初中版本，一～六年级换回小学版本 */
export function editionForGrade(subject: Subj, editionId: string, grade: number): string {
  if (grade >= 7) {
    if (isJuniorEdition(editionId)) return editionId;
    return juniorOf(subject, editionId) ?? editionId;
  }
  return isJuniorEdition(editionId) ? primaryOf(subject, editionId) : editionId;
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
