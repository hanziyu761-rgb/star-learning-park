/**
 * 英语 · 拼词泡泡（V2.19）：播放单词读音、显示中文，按顺序戳破字母泡泡把单词拼出来。
 * 戳错的泡泡抖一下、不扣分，但这个词算没有一次拼对，并放进生词本。
 * 单词取自单词卡：一、二年级用启蒙单元，三～六年级用本年级及以下的 PEP 单元；只取全是小写字母的单个单词。
 * 难度档：1 3～4 个字母（2 个干扰字母） 2 5～6 个（3 个） 3 7 个以上（4 个）
 */
import type { ChoiceExercise } from '@/lesson/types';
import { ALL_CARDS, CARD_BY_ID, WORD_UNITS, type WordCard } from '@/words/catalog';
import { safeId } from './common';

const LEN: Record<number, [number, number]> = { 1: [3, 4], 2: [5, 6], 3: [7, 12] };
const EXTRA: Record<number, number> = { 1: 2, 2: 3, 3: 4 };

/** 这个年级能用的单词（同一个词只取一次） */
export function bubbleWords(grade: number, level: number): WordCard[] {
  // 初中（V5.2.3）只用初中话题单元的词（本年级及以下的初中单元）；小学不变
  const units = WORD_UNITS.filter((u) =>
    grade <= 2 ? u.book === '启蒙' : grade >= 7 ? u.grade >= 7 && u.grade <= grade : u.book !== '启蒙' && u.grade <= grade,
  );
  const [lo, hi] = LEN[level] ?? LEN[1];
  const seen = new Set<string>();
  const out: WordCard[] = [];
  for (const u of units)
    for (const c of u.cards)
      if (/^[a-z]+$/.test(c.w) && c.w.length >= lo && c.w.length <= hi && !seen.has(c.w)) {
        seen.add(c.w);
        out.push(c);
      }
  return out;
}

export interface Bubble {
  id: string;
  letter: string;
}
export interface BubbleQuestion {
  card: WordCard;
  bubbles: Bubble[];
  level: number;
}

export function bubbleRound(grade: number, level: number, rand: () => number, n: number): BubbleQuestion[] {
  let words = bubbleWords(grade, level);
  if (words.length < n) words = [...words, ...bubbleWords(grade, Math.max(1, level - 1))];
  const picked: WordCard[] = [];
  const pool = [...words];
  while (picked.length < n && pool.length) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return picked.map((card, qi) => {
    const letters = [...card.w];
    const others = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !letters.includes(c));
    const extra: string[] = [];
    while (extra.length < (EXTRA[level] ?? 2)) extra.push(others.splice(Math.floor(rand() * others.length), 1)[0]);
    const all = [...letters, ...extra];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return { card, level, bubbles: all.map((letter, i) => ({ id: `b${qi}-${i}`, letter })) };
  });
}

/** 戳一个泡泡：是下一个该戳的字母就接受 */
export function acceptsBubble(word: string, typed: string, letter: string): boolean {
  return word[typed.length] === letter;
}

/* ───── 错题复习：选出正确的拼写 ───── */
export const BUBBLE_LESSON = 'game:bubble';
export const bubbleExerciseId = (card: WordCard) => safeId(`bubble:${card.id}`);

/** 拼错的样子：交换相邻两个字母、去掉一个字母（与原词不同、互不相同） */
export function misspellings(w: string): string[] {
  const out = new Set<string>();
  for (let i = 0; i + 1 < w.length && out.size < 2; i++) {
    if (w[i] === w[i + 1]) continue;
    const s = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
    if (s !== w) out.add(s);
    i += 1;
  }
  for (let i = 1; i < w.length && out.size < 3; i++) {
    const s = w.slice(0, i) + w.slice(i + 1);
    if (s !== w && !ALL_CARDS.some((c) => c.w === s)) out.add(s);
  }
  return [...out].slice(0, 3);
}

export function bubbleExercise(exerciseId: string): ChoiceExercise | null {
  const m = /^bubble:(.+)$/.exec(exerciseId);
  if (!m) return null;
  const card = CARD_BY_ID.get(m[1].replace(/∕/g, '/'));
  if (!card) return null;
  const options = [card.w, ...misspellings(card.w)].sort();
  return {
    kind: 'choice',
    id: exerciseId,
    skill: 'game.bubble',
    prompt: { text: 'Choose the right spelling.', speak: { text: card.w, lang: 'en-US' }, hintZh: `选出“${card.zh}”的正确拼写` },
    listen: { text: card.w, lang: 'en-US' },
    options: options.map((w) => ({ id: w, text: w })),
    answerId: card.w,
    wrongHint: { text: 'Listen again.', speak: { text: card.w, lang: 'en-US' } },
  };
}
