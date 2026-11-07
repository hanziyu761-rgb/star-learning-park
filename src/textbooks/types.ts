/**
 * 多版本教材资源库的数据结构（V4.0）。
 *
 * 层次：Edition（教材版本，如统编版语文）→ Volume（某年级某册，如四年级上册 2024 修订版）→ Unit（单元）
 *      → LessonEntry（课时：课文、口语交际、习作、语文园地……）→ 知识点（引用知识图谱 id）→ 例题 / 练习（引用题目 id）
 *
 * 每个对象有全局唯一 id。每条目录都标明来源类别：
 *   A verified  已核实教材内容：与官方来源（出版社 / 国家中小学智慧教育平台电子课本 / 教育部门文件）逐条核对过，记录来源和核实日期
 *   B original  按课程标准原创的教学资源：本项目编写，不是任何出版社的原版内容
 *   C pending   待核实目录：来自二手资料或开源题库，未与官方来源核对
 * 三者不能混为一谈；界面上的“已核实”只统计 A。
 *
 * 现有数据（开源题库、原创课程、知识图谱、学习记录）不改格式，通过 adapters.ts 接入；学习记录仍按原来的课程 id / 题目 id 保存。
 */
import type { Subject } from '@/lesson/types';

export type Provenance = 'verified' | 'original' | 'pending';

export interface SourceRef {
  /** 来源名称，如“国家中小学智慧教育平台 统编版语文四年级上册电子课本 目录页” */
  title: string;
  url?: string;
  /** official 官方；secondary 二手（报道、教辅网站） */
  kind: 'official' | 'secondary';
  /** 核对日期 YYYY-MM-DD */
  checkedAt: string;
  note?: string;
}

/** 教材版本（一个出版社的一套教材） */
export interface Edition {
  /** 如 chinese.tongbian、math.pep、english.pep */
  id: string;
  subject: Subject;
  /** 常用名称，如“统编版” */
  name: string;
  /** 其他叫法（用于查重：同一套教材不能登记两次） */
  aliases: string[];
  publisher: string;
  /** 用户需求中的建设优先级 */
  priority: 1 | 2;
  /** 使用状态（必须有来源才能写 current / historical） */
  status: 'current' | 'historical' | 'unknown';
  statusNote: string;
  sources: SourceRef[];
}

export type Term = '上' | '下';

/** 课时 / 目录条目 */
export interface LessonEntry {
  /** 全局唯一，如 chinese.tongbian.2024.g4a.u1.l1 */
  id: string;
  order: number;
  /** 课文编号（如 3），没有编号的（口语交际、习作、语文园地）留空 */
  no?: number;
  title: string;
  kind: 'text' | 'poem' | 'literacy' | 'pinyin' | 'oral' | 'writing' | 'garden' | 'reading' | 'example' | 'lesson' | 'review' | 'other';
  /** 略读课文（教材目录中带 * 号） */
  starred?: boolean;
  /** 一课里的几篇（如《古诗三首》里的三首） */
  parts?: string[];
  provenance: Provenance;
  /** 本项目对这一课时已建设的内容（原创课程 id、知识点 id、练习题 id） */
  lessonIds?: string[];
  kpIds?: string[];
  exerciseIds?: string[];
}

export interface Unit {
  /** 全局唯一，如 chinese.tongbian.2024.g4a.u1 */
  id: string;
  order: number;
  /** 教材上的单元名（没有正式单元名的写“第一单元”） */
  title: string;
  provenance: Provenance;
  /** 单元学习目标、语文要素等（本项目编写的标 original） */
  objectives?: { text: string; provenance: Provenance }[];
  lessons: LessonEntry[];
  /** 本单元关联的知识图谱知识点 */
  kpIds: string[];
  /** 现有开源题库单元 id（如 chinese-g4a-u3）：本单元的练习题来自这里 */
  bankUnitIds: string[];
}

export interface Volume {
  /** 全局唯一，如 chinese.tongbian.2024.g4a */
  id: string;
  editionId: string;
  subject: Subject;
  grade: number;
  term: Term;
  /** 正式名称，如“义务教育教科书·语文 四年级上册” */
  officialName: string;
  /** 修订版次：如 2024（根据 2022 年版课程标准修订）、2019（旧版）；未知填 null */
  revision: number | null;
  /** 第一次使用的学期，如“2026秋”；有来源才写 */
  firstUse?: string;
  status: 'current' | 'historical' | 'upcoming' | 'unknown';
  statusNote?: string;
  /** 适用地区（全国 / 某省）；未核实留空 */
  regions?: string[];
  /** 目录（单元、课时）的整体来源类别 */
  tocProvenance: Provenance | 'none';
  sources: SourceRef[];
  units: Unit[];
  /** 现有 APP 里对应的题库书 id（如 chinese-g4a），用于接入练习、错题、复习 */
  bankBookId?: string;
  /** 版权说明：目录只录单元名和课题名，不录课文正文、习题和教参 */
  copyright: string;
}

/** 一册教材的建设完整度（只按真实数据统计） */
export interface Completeness {
  volumeId: string;
  tocProvenance: Volume['tocProvenance'];
  units: number;
  /** 课时条目数（按来源分开） */
  lessons: { verified: number; original: number; pending: number };
  /** 已关联的知识点数 */
  kps: number;
  /** 原创互动课程数 */
  courses: number;
  /** 可用练习题数（开源题库 + 原创） */
  exercises: number;
  /** 典型例题数（带详细解析的例题，V4.4 建设） */
  examples: number;
  /** 待补充内容 */
  todo: string[];
}
