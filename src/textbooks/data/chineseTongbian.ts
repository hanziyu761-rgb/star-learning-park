/**
 * 第一批：统编版小学语文 一至六年级 上下册（根据 2022 年版课程标准修订的版本）——版本登记（V4.0）。
 *
 * 一、二年级上下册目录已与官方电子课本核对（chineseTongbianG1.ts、G2.ts）；其余各册目录尚未核对，units 为空、tocProvenance = 'none'。
 * 核实方式：国家中小学智慧教育平台 统编版语文电子课本的目录页，逐条录入后标 verified 并记录日期。
 * 不录课文正文、习题、教参，只录单元名和课题名。
 */
import { CHECKED, SRC_ROLLOUT } from '../editions';
import type { Term, Volume } from '../types';
import { G1A_UNITS, G1B_UNITS, SRC_G1A, SRC_G1B } from './chineseTongbianG1';
import { G2A_UNITS, G2B_UNITS, SRC_G2A, SRC_G2B } from './chineseTongbianG2';

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

/** 已与官方电子课本核对过目录的册 */
const VERIFIED: Record<string, { units: (id: string) => Volume['units']; src: Volume['sources'][number] }> = {
  g1a: { units: G1A_UNITS, src: SRC_G1A },
  g1b: { units: G1B_UNITS, src: SRC_G1B },
  g2a: { units: G2A_UNITS, src: SRC_G2A },
  g2b: { units: G2B_UNITS, src: SRC_G2B },
};

export const TONGBIAN_2024: Volume[] = PLANS.map((p) => {
  const t = p.term === '上' ? 'a' : 'b';
  const id = `chinese.tongbian.2024.g${p.grade}${t}`;
  const ver = VERIFIED[`g${p.grade}${t}`];
  return {
    id,
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
    tocProvenance: ver ? 'verified' : 'none',
    sources: [...(ver ? [ver.src] : []), { ...SRC_ROLLOUT, checkedAt: CHECKED }],
    units: ver ? ver.units(id) : [],
    // 练习暂用现有开源题库同年级同册（按旧版主题单元整理），见 adapters.ts
    bankBookId: `chinese-g${p.grade}${t}`,
    copyright: '目录只录单元名和课题名；课文正文、插图、习题和教师用书版权归人民教育出版社，不复制。',
  };
});
