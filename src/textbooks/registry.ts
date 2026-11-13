/**
 * 教材资源库总表（V4.0）：版本清单 + 各册教材 + 完整度统计 + 数据校验 + JSON 导入。
 */
import type { Subject } from '@/lesson/types';
import { bankVolumes, courseCount } from './adapters';
import { TONGBIAN_2024, TONGBIAN_LEGACY } from './data/chineseTongbian';
import { MATH_PEP_2024, MATH_PEP_LEGACY } from './data/mathPep';
import { MATH_BSD_2024, MATH_BSD_LEGACY } from './data/mathBsd';
import { MATH_SUJIAO_2024, MATH_SUJIAO_LEGACY } from './data/mathSujiao';
import { MATH_JIJIAO_2024, MATH_JIJIAO_LEGACY } from './data/mathJijiao';
import { MATH_BEIJING_2024, MATH_BEIJING_LEGACY } from './data/mathBeijing';
import { ENGLISH_BSD } from './data/englishBsd';
import { ENGLISH_FLTRP_LIU } from './data/englishFltrpLiu';
import { ENGLISH_FLTRP_ZHANG } from './data/englishFltrpZhang';
import { ENGLISH_HUJIAO } from './data/englishHujiao';
import { ENGLISH_JIJIAO } from './data/englishJijiao';
import { ENGLISH_JIJIAO_JUNIOR } from './data/englishJijiaoJunior';
import { CHINESE_TONGBIAN_JUNIOR } from './data/chineseTongbianJunior';
import { MATH_PEP_JUNIOR } from './data/mathPepJunior';
import { ENGLISH_XIANGSHAO } from './data/englishXiangshao';
import { ENGLISH_YILIN } from './data/englishYilin';
import { MATH_QINGDAO } from './data/mathQingdao';
import { MATH_XISHI } from './data/mathXishi';
import { ENGLISH_PEP_2024, ENGLISH_PEP_LEGACY } from './data/englishPep';
import { ENGLISH_FLTRP_2024 } from './data/englishFltrp';
import { EDITION_BY_ID, EDITIONS } from './editions';
import type { Completeness, Edition, LessonEntry, Provenance, Unit, Volume } from './types';
import { loadRawBook } from '@/content/bank';

/** 导入的教材数据（tools/textbooks/import.review.ts 生成到 data/imported/） */
import { IMPORTED } from './data/imported';

let cached: Volume[] | null = null;
export function allVolumes(): Volume[] {
  cached ??= [...TONGBIAN_2024, ...TONGBIAN_LEGACY, ...MATH_PEP_2024, ...MATH_PEP_LEGACY, ...MATH_BSD_2024, ...MATH_BSD_LEGACY, ...MATH_SUJIAO_2024, ...MATH_SUJIAO_LEGACY, ...MATH_JIJIAO_2024, ...MATH_JIJIAO_LEGACY, ...MATH_BEIJING_2024, ...MATH_BEIJING_LEGACY, ...MATH_QINGDAO, ...MATH_XISHI, ...ENGLISH_PEP_2024, ...ENGLISH_PEP_LEGACY, ...ENGLISH_FLTRP_2024, ...ENGLISH_FLTRP_LIU, ...ENGLISH_FLTRP_ZHANG, ...ENGLISH_YILIN, ...ENGLISH_BSD, ...ENGLISH_HUJIAO, ...ENGLISH_JIJIAO, ...ENGLISH_XIANGSHAO, ...CHINESE_TONGBIAN_JUNIOR, ...MATH_PEP_JUNIOR, ...ENGLISH_JIJIAO_JUNIOR, ...IMPORTED, ...bankVolumes()];
  return cached;
}

export function volumesFor(filter: { subject?: Subject; grade?: number; editionId?: string } = {}): Volume[] {
  return allVolumes().filter(
    (v) =>
      (!filter.subject || v.subject === filter.subject) &&
      (!filter.grade || v.grade === filter.grade) &&
      (!filter.editionId || v.editionId === filter.editionId),
  );
}

export function editionOf(v: Volume): Edition | undefined {
  return EDITION_BY_ID[v.editionId];
}

const allLessons = (v: Volume): LessonEntry[] => v.units.flatMap((u) => u.lessons);

/** 一册教材的完整度：只按真实存在的数据统计 */
export function completeness(v: Volume): Completeness {
  const lessons = { verified: 0, original: 0, pending: 0 };
  for (const l of allLessons(v)) lessons[l.provenance] += 1;
  const kps = new Set(v.units.flatMap((u) => [...u.kpIds, ...u.lessons.flatMap((l) => l.kpIds ?? [])]));
  // 练习题：本册单元关联的题库单元题数；没有单元的（新版只登记了册次）按对应题库整册计
  const bankUnits = new Set(v.units.flatMap((u) => u.bankUnitIds));
  const raw = v.bankBookId ? loadRawBook(v.bankBookId) : undefined;
  const exercises = raw
    ? raw.units.filter((u) => bankUnits.size === 0 || bankUnits.has(u.id)).reduce((s, u) => s + u.questions.length, 0)
    : 0;
  const todo: string[] = [];
  if (v.tocProvenance === 'none') todo.push('单元目录未录入');
  else if (v.tocProvenance === 'pending') todo.push('单元目录待与官方来源核实');
  if (v.units.length && allLessons(v).length === 0) todo.push(v.subject === 'math' ? '教材目录只列单元；课时（小节）待按课本内容录入' : '课时目录未录入');
  if (kps.size === 0) todo.push('知识点未关联');
  todo.push('典型例题未建设');
  if (exercises === 0) todo.push('练习题未建设');
  else if (v.units.length === 0 || v.tocProvenance !== 'verified') todo.push('练习题暂按旧版题库单元，未对应本册目录');
  else todo.push('练习题按内容从旧版题库对应到本册单元（不是本册原题），逐课原创练习待建设');
  return {
    volumeId: v.id,
    tocProvenance: v.tocProvenance,
    units: v.units.length,
    lessons,
    kps: kps.size,
    courses: v.id.startsWith('bank.') ? courseCount(v.subject, v.grade, v.term) : 0,
    exercises,
    examples: 0,
    todo,
  };
}

/** 一册教材算“完整”：目录已核实、每个单元都有课时和知识点、有例题和练习 */
export function isComplete(c: Completeness, v: Volume): boolean {
  return (
    c.tocProvenance === 'verified' &&
    v.units.length > 0 &&
    v.units.every((u) => u.lessons.length > 0 && u.kpIds.length > 0) &&
    c.examples > 0 &&
    c.exercises > 0
  );
}

/* ───────── 数据校验 ───────── */

export interface Problem {
  level: 'error' | 'warn';
  where: string;
  msg: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateVolume(v: Volume, editions: Record<string, Edition> = EDITION_BY_ID): Problem[] {
  const out: Problem[] = [];
  const err = (where: string, msg: string) => out.push({ level: 'error', where, msg });
  if (!editions[v.editionId]) err(v.id, `教材版本 ${v.editionId} 不在版本清单里`);
  else if (editions[v.editionId].subject !== v.subject) err(v.id, '学科与教材版本不一致');
  if (!(v.grade >= 1 && v.grade <= 9)) err(v.id, '年级必须是 1～9');
  if (v.term !== '上' && v.term !== '下') err(v.id, '册次必须是 上 / 下');
  if (!v.officialName) err(v.id, '缺少正式名称');
  if (!v.copyright) err(v.id, '缺少版权说明');
  for (const s of v.sources) if (!DATE.test(s.checkedAt)) err(v.id, `来源“${s.title}”缺少核对日期`);
  // 已核实必须有官方来源
  const hasVerified = v.tocProvenance === 'verified' || v.units.some((u) => u.provenance === 'verified' || u.lessons.some((l) => l.provenance === 'verified'));
  if (hasVerified && !v.sources.some((s) => s.kind === 'official')) err(v.id, '标为“已核实”的目录必须有官方来源（出版社 / 国家平台 / 教育部门）');
  if ((v.status === 'current' || v.status === 'historical') && v.sources.length === 0) err(v.id, '写了现行 / 历史状态，但没有来源');
  if (v.tocProvenance === 'none' && v.units.length) err(v.id, '目录来源写的是“未录入”，却有单元');
  if (v.tocProvenance !== 'none' && v.units.length === 0) err(v.id, '目录来源不是“未录入”，但没有单元');
  const ids = new Set<string>();
  const seen = (id: string, where: string) => {
    if (ids.has(id)) err(where, `编号重复：${id}`);
    ids.add(id);
  };
  seen(v.id, v.id);
  const checkOrder = (items: { order: number }[], where: string) => {
    const orders = items.map((i) => i.order);
    if (new Set(orders).size !== orders.length) err(where, '顺序号重复');
    if (orders.some((o, i) => i > 0 && o <= orders[i - 1])) err(where, '顺序号没有从小到大');
  };
  checkOrder(v.units, v.id);
  v.units.forEach((u: Unit) => {
    seen(u.id, u.id);
    if (!u.id.startsWith(`${v.id}.`)) err(u.id, `单元编号应以册编号 ${v.id}. 开头`);
    if (!u.title.trim()) err(u.id, '单元缺少名称');
    if (u.provenance === 'verified' && v.tocProvenance !== 'verified') err(u.id, '单元标为已核实，但整册目录不是已核实');
    checkOrder(u.lessons, u.id);
    u.lessons.forEach((l) => {
      seen(l.id, l.id);
      if (!l.id.startsWith(`${u.id}.`)) err(l.id, `课时编号应以单元编号 ${u.id}. 开头`);
      if (!l.title.trim()) err(l.id, '课时缺少名称');
    });
  });
  return out;
}

/** 整个资源库：每册校验 + 版本清单查重 + 全局编号唯一 */
export function validateAll(volumes: Volume[] = allVolumes(), editions: Edition[] = EDITIONS): Problem[] {
  const out: Problem[] = [];
  // 版本查重：同一学科里名称 / 别名不能出现在两个版本里
  const names = new Map<string, string>();
  for (const e of editions)
    for (const n of [e.name, ...e.aliases]) {
      const key = `${e.subject}:${n.replace(/\s/g, '')}`;
      const other = names.get(key);
      if (other && other !== e.id) out.push({ level: 'error', where: e.id, msg: `“${n}”与 ${other} 重复，同一套教材不能登记两次` });
      names.set(key, e.id);
    }
  const byId = Object.fromEntries(editions.map((e) => [e.id, e]));
  const global = new Set<string>();
  for (const v of volumes) {
    out.push(...validateVolume(v, byId));
    for (const id of [v.id, ...v.units.flatMap((u) => [u.id, ...u.lessons.map((l) => l.id)])]) {
      if (global.has(id)) out.push({ level: 'error', where: id, msg: '编号在不同册之间重复' });
      global.add(id);
    }
  }
  // 同一版本、同一修订版、同一年级册次只能有一册
  const slot = new Map<string, string>();
  for (const v of volumes) {
    if (v.id.startsWith('bank.')) continue;
    const key = `${v.editionId}|${v.revision}|${v.grade}${v.term}`;
    if (slot.has(key)) out.push({ level: 'error', where: v.id, msg: `与 ${slot.get(key)} 是同一册教材，重复登记` });
    slot.set(key, v.id);
  }
  return out;
}

/** 统计：给汇报和界面用 */
export function summary(volumes: Volume[] = allVolumes()) {
  const count = (p: Provenance) => volumes.reduce((s, v) => s + v.units.flatMap((u) => u.lessons).filter((l) => l.provenance === p).length, 0);
  return {
    editions: EDITIONS.length,
    volumes: volumes.filter((v) => !v.id.startsWith('bank.')).length,
    bankVolumes: volumes.filter((v) => v.id.startsWith('bank.')).length,
    verifiedVolumes: volumes.filter((v) => v.tocProvenance === 'verified').length,
    verifiedUnits: volumes.reduce((s, v) => s + v.units.filter((u) => u.provenance === 'verified').length, 0),
    lessons: { verified: count('verified'), original: count('original'), pending: count('pending') },
  };
}
