/**
 * 单词卡目录（V2.18）：启蒙 15 个单元 + PEP 三～六年级 47 个单元，全部单词一次整理好；V5.2 加初中七～九年级 18 个话题单元。
 * 音标由 tools/words/phonetics.py 从 CMU 发音词典自动生成（美式），不手写。
 */
import { IPA } from './data/ipa.gen';
import { PEP_34 } from './data/pep34';
import { PEP_56 } from './data/pep56';
import { JUNIOR_WORDS } from './data/junior';
import { STARTER_DICT, STARTER_UNITS } from './data/starter';
import type { UnitTheme } from './data/types';

export interface WordCard {
  /** 单元内唯一：单元id/单词 */
  id: string;
  w: string;
  zh: string;
  /** 中文意思的拼音（启蒙单元，一、二年级用） */
  py?: string;
  ipa: string;
  ex: string;
  exZh: string;
  unitId: string;
}

export interface WordUnit {
  id: string;
  grade: number;
  book: string;
  title: string;
  theme?: UnitTheme;
  /** 原创配套 / 按 PEP 单词表整理（未核对课本） */
  source: 'original' | 'pep-unverified';
  cards: WordCard[];
}

function ipaOf(unitId: string, w: string): string {
  return IPA[`${unitId}:${w}`] ?? IPA[w] ?? '';
}

const starterDict = new Map(
  STARTER_DICT.trim()
    .split('\n')
    .map((line) => {
      const [w, zh, py, ex, exZh] = line.split('|');
      return [w, { w, zh, py, ex, exZh }] as const;
    }),
);

function starterUnits(): WordUnit[] {
  return STARTER_UNITS.map((u) => {
    const list = u.words.includes('|') ? u.words.split('|') : u.words.split(' ');
    return {
      id: u.id,
      grade: 1,
      book: '启蒙',
      title: u.title,
      theme: 'theme' in u ? u.theme : undefined,
      source: 'original' as const,
      cards: list.map((w) => {
        const d = starterDict.get(w);
        if (!d) throw new Error(`启蒙单词缺少释义：${w}`);
        return { id: `${u.id}/${w}`, ...d, ipa: ipaOf(u.id, w), unitId: u.id };
      }),
    };
  });
}

function pepUnits(): WordUnit[] {
  return [...PEP_34, ...PEP_56].map((u) => ({
    id: u.id,
    grade: u.grade,
    book: u.book,
    title: u.title,
    theme: u.theme,
    source: 'pep-unverified' as const,
    cards: u.lines
      .trim()
      .split('\n')
      .map((line) => {
        const [w, zh, ex, exZh] = line.split('|');
        return { id: `${u.id}/${w}`, w, zh, ex, exZh, ipa: ipaOf(u.id, w), unitId: u.id };
      }),
  }));
}

/** 初中（V5.2）：按话题原创分组的常用词，不对应某一版课本 */
function juniorUnits(): WordUnit[] {
  return JUNIOR_WORDS.map((u) => ({
    id: u.id,
    grade: u.grade,
    book: u.book,
    title: u.title,
    theme: u.theme,
    source: 'original' as const,
    cards: u.lines
      .trim()
      .split('\n')
      .map((line) => {
        const [w, zh, ex, exZh] = line.split('|');
        return { id: `${u.id}/${w}`, w, zh, ex, exZh, ipa: ipaOf(u.id, w), unitId: u.id };
      }),
  }));
}

export const WORD_UNITS: WordUnit[] = [...starterUnits(), ...pepUnits(), ...juniorUnits()];
export const UNIT_BY_ID = new Map(WORD_UNITS.map((u) => [u.id, u]));
export const ALL_CARDS: WordCard[] = WORD_UNITS.flatMap((u) => u.cards);
export const CARD_BY_ID = new Map(ALL_CARDS.map((c) => [c.id, c]));

/** 一、二年级显示启蒙单元；三年级起显示本年级及以下的 PEP 单元（也能切到全部） */
export function unitsForGrade(grade: number): WordUnit[] {
  if (grade <= 2) return WORD_UNITS.filter((u) => u.book === '启蒙');
  return WORD_UNITS.filter((u) => u.grade === grade);
}

/** 生词本里的词按“单词”记（同一个词出现在多个单元只记一次）；找到它的第一张卡 */
export function firstCardOf(word: string): WordCard | undefined {
  return ALL_CARDS.find((c) => c.w === word);
}

/** 用于朗读的语言：全部按美式英语 */
export const WORD_LANG = 'en-US' as const;
