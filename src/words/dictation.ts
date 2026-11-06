/**
 * 听写（V2.18，纯函数）：从单元（或生词本）随机抽 10 个词；每题读单词、显示中文，孩子拼写，提交后判断对错。
 * 拼写方式：大字母按键（本词字母打乱 + 3 个干扰字母）或普通输入框。
 */
export const DICTATION_SIZE = 10;
export const STREAK_TO_CLEAR = 3;

export function pickDictation<T extends { w: string }>(cards: T[], rand: () => number, n = DICTATION_SIZE): T[] {
  const seen = new Set<string>();
  const unique = cards.filter((c) => (seen.has(c.w.toLowerCase()) ? false : (seen.add(c.w.toLowerCase()), true)));
  const a = [...unique];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** 拼写比较：不分大小写，忽略首尾空格，多个空格算一个，弯撇号和直撇号一样 */
export function normalizeSpelling(s: string): string {
  return s.trim().replace(/\s+/g, ' ').replace(/[’‘]/g, "'").toLowerCase();
}
export const isCorrectSpelling = (answer: string, word: string) => normalizeSpelling(answer) === normalizeSpelling(word);

/** 字母按键：本词用到的每个字母（按出现次数）打乱，再加 3 个本词没有的字母；空格、撇号、连字符单独成键 */
export function letterTiles(word: string, rand: () => number): string[] {
  const letters = [...word.toLowerCase()].filter((c) => c !== ' ');
  const pool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !letters.includes(c));
  const extra: string[] = [];
  while (extra.length < 3 && pool.length) extra.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  const tiles = [...letters, ...extra];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}
export const needsSpaceKey = (word: string) => word.includes(' ');
