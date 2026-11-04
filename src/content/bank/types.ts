/** 题库数据格式（由 tools/import-bank/import.mjs 生成） */
import type { Subject } from '@/lesson/types';

export interface BankQuestion {
  id: string;
  /** choice 选择 / tf 判断 / order 连词成句 */
  t: 'choice' | 'tf' | 'order';
  q: string;
  /** 题干自动拼音（一二年级），与汉字一一对应，空格分隔 */
  qpy?: string;
  o?: string[];
  opy?: string[];
  /** choice：正确选项下标；tf：对错；order：正确顺序（选项下标） */
  a: number | boolean | number[];
  /** 知识点 */
  kp: string;
  /** 讲解 */
  ex?: string;
}

export interface BankUnit {
  no: number;
  id: string;
  title: string;
  questions: BankQuestion[];
}

export interface BankBook {
  id: string;
  subject: Subject;
  grade: number;
  term: '上' | '下';
  title: string;
  units: BankUnit[];
}

export interface BankIndexEntry {
  id: string;
  subject: Subject;
  grade: number;
  term: '上' | '下';
  title: string;
  units: number;
  questions: number;
}
