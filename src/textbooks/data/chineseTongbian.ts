/**
 * 第一批：统编版小学语文 一至六年级 上下册（根据 2022 年版课程标准修订的版本）——版本登记（V4.0）。
 *
 * 目前只登记了册次、使用状态和来源；目录（单元、课时）尚未与官方电子课本核对，units 为空、tocProvenance = 'none'。
 * 核实方式：国家中小学智慧教育平台 统编版语文电子课本的目录页，逐条录入后标 verified 并记录日期。
 * 不录课文正文、习题、教参，只录单元名和课题名。
 */
import { CHECKED, SRC_ROLLOUT } from '../editions';
import type { Term, Volume } from '../types';

const CN = ['', '一', '二', '三', '四', '五', '六'];

interface Plan {
  grade: number;
  term: Term;
  firstUse?: string;
  status: Volume['status'];
  statusNote: string;
}

const PLANS: Plan[] = [
  { grade: 1, term: '上', firstUse: '2024秋', status: 'current', statusNote: '2024 秋起一年级使用修订教材（报道）。' },
  { grade: 1, term: '下', status: 'current', statusNote: '与一年级上册同一轮修订，推算 2025 春启用（待核实）。' },
  { grade: 2, term: '上', firstUse: '2025秋', status: 'current', statusNote: '2025 秋起二年级使用修订教材（报道）。' },
  { grade: 2, term: '下', status: 'current', statusNote: '推算 2026 春启用（待核实）。' },
  { grade: 3, term: '上', firstUse: '2025秋', status: 'current', statusNote: '2025 秋起三年级使用修订教材（报道）。' },
  { grade: 3, term: '下', status: 'current', statusNote: '推算 2026 春启用（待核实）。' },
  { grade: 4, term: '上', firstUse: '2026秋', status: 'current', statusNote: '2026 秋起四年级语文使用修订教材（报道）。' },
  { grade: 4, term: '下', status: 'upcoming', statusNote: '修订版推算 2027 春启用；目录可能尚未公开（待核实）。' },
  { grade: 5, term: '上', firstUse: '2026秋', status: 'current', statusNote: '2026 秋起五年级语文使用修订教材（报道）。' },
  { grade: 5, term: '下', status: 'upcoming', statusNote: '修订版推算 2027 春启用；目录可能尚未公开（待核实）。' },
  { grade: 6, term: '上', firstUse: '2026秋', status: 'current', statusNote: '2026 秋起六年级语文使用修订教材（报道）。' },
  { grade: 6, term: '下', status: 'upcoming', statusNote: '修订版推算 2027 春启用；目录可能尚未公开（待核实）。' },
];

export const TONGBIAN_2024: Volume[] = PLANS.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  return {
    id: `chinese.tongbian.2024.g${p.grade}${t}`,
    editionId: 'chinese.tongbian',
    subject: 'chinese',
    grade: p.grade,
    term: p.term,
    officialName: `义务教育教科书·语文 ${CN[p.grade]}年级${p.term}册（根据2022年版课程标准修订）`,
    revision: 2024,
    firstUse: p.firstUse,
    status: p.status,
    statusNote: p.statusNote,
    regions: ['全国'],
    tocProvenance: 'none',
    sources: [{ ...SRC_ROLLOUT, checkedAt: CHECKED }],
    units: [],
    // 练习暂用现有开源题库同年级同册（按旧版主题单元整理），见 adapters.ts
    bankBookId: `chinese-g${p.grade}${t}`,
    copyright: '目录只录单元名和课题名；课文正文、插图、习题和教师用书版权归人民教育出版社，不复制。',
  };
});
