/**
 * 把现有数据接入新的教材资源库（V4.0），不改原有数据格式：
 * - 开源题库 ChinaStudyFree 的每一册 → 一册“旧版单元（待核实）”教材：单元名来自题库，未与官方目录核对（pending）
 * - 题库单元 → 知识图谱知识点（UNIT_TO_KP）、练习题（题库题）
 * - 原创互动课程按学科、年级计入
 * 学习记录仍按原来的课程 id、题目 id 保存，接入不会改动任何记录。
 */
import { LESSONS } from '@/content';
import { BANK_INDEX, loadRawBook } from '@/content/bank';
import { NEW_EDITION } from '@/content/bank/edition';
import { UNIT_TO_KP } from '@/knowledge/graph';
import type { Volume } from './types';

const EDITION_OF = { chinese: 'chinese.tongbian', math: 'math.pep', english: 'english.pep' } as const;
const REV_NOTE = {
  chinese: '开源题库按统编版旧版（2016～2019 年起用）的主题单元整理，单元名不是教材原名。',
  math: '开源题库按人教版旧版（2012 版）单元整理。',
  english: '开源题库按人教 PEP 旧版（2012 版）单元整理。',
} as const;

/** 现有题库各册（旧版单元），id 形如 bank.chinese-g4a */
export function bankVolumes(): Volume[] {
  // 七～九年级题库（V5.2）按题库自己的单元分组，不对应哪一版课本，不放进教材资源库
  return BANK_INDEX.filter((b) => b.grade <= 6).map((b): Volume => {
    const raw = loadRawBook(b.id);
    return {
      id: `bank.${b.id}`,
      editionId: EDITION_OF[b.subject],
      subject: b.subject,
      grade: b.grade,
      term: b.term,
      officialName: `${b.title}（开源题库旧版单元）`,
      revision: null,
      status: 'unknown',
      statusNote: `${REV_NOTE[b.subject]}${NEW_EDITION[b.id] ? ` 已另按 ${NEW_EDITION[b.id].name} 单元重排（V2.4），重排所依据的目录未记录来源，待核实。` : ''}`,
      tocProvenance: 'pending',
      sources: [],
      bankBookId: b.id,
      copyright: '题库为 ChinaStudyFree（MIT 许可，AI 生成、自动质检、已通过教师审核）。',
      units: (raw?.units ?? []).map((u) => ({
        id: `bank.${b.id}.u${u.no}`,
        order: u.no,
        title: u.title,
        provenance: 'pending' as const,
        lessons: [],
        kpIds: UNIT_TO_KP[u.id] ? [UNIT_TO_KP[u.id]] : [],
        bankUnitIds: [u.id],
      })),
    };
  });
}

/** 原创互动课程数：按学科、年级（低年级课程大多没有分上下册，计入上册） */
export function courseCount(subject: Volume['subject'], grade: number, term: Volume['term']): number {
  return LESSONS.filter((l) => l.subject === subject && (l.grade ?? 1) === grade && term === '上').length;
}
