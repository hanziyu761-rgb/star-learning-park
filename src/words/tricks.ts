/**
 * 单词卡的“记忆窍门”和显示效果（V2.18），全部由程序按拼写和音标算出，不逐个手写：
 * - 分段：按音节把单词拆成几段，方便一段一段记
 * - 藏词：单词里藏着的另一个课本单词（3 个字母以上）
 * - 拼读家族：同一个字母组合、读音也一样的词
 * - 别搞混：只差一个字母的词
 * 只有“颜色词用自己的颜色、big 特别大……”的样式表和少数“形状窍门”是写好的规则。
 */
import { ALL_CARDS, type WordCard } from './catalog';

const VOWEL = /[aeiouy]/;
const DIGRAPHS = ['ch', 'sh', 'th', 'ph', 'wh', 'ck', 'ng', 'qu', 'tch', 'gh'];
/** 能放在音节开头的辅音组合 */
const ONSET = new Set(
  'bl br cl cr dr fl fr gl gr pl pr sc sk sl sm sn sp st sw tr tw wr kn scr spr str squ thr shr'.split(' '),
);

function isVowelAt(w: string, i: number): boolean {
  const c = w[i];
  if (!c) return false;
  if (c === 'y') return i > 0 && !VOWEL.test(w[i - 1] ?? '');
  if (c === 'u' && w[i - 1] === 'q') return false;
  return 'aeiou'.includes(c);
}

/** 一个单词（不含空格）分成几段：先按元音字母组找音节，再处理不发音的 e 和结尾的 -le */
export function syllables(word: string): string[] {
  const w = word.toLowerCase();
  if (!/^[a-z]+$/.test(w) || w.length <= 3) return onsetRime(word);
  // 元音字母组的起止位置
  const groups: [number, number][] = [];
  for (let i = 0; i < w.length; ) {
    if (isVowelAt(w, i)) {
      let j = i;
      while (j + 1 < w.length && isVowelAt(w, j + 1)) j++;
      groups.push([i, j]);
      i = j + 1;
    } else i++;
  }
  // 结尾不发音的 e（cake、kite）不算一个音节；但 -le 结尾（purple、apple）算
  const last = groups[groups.length - 1];
  if (groups.length > 1 && last[0] === w.length - 1 && w[last[0]] === 'e' && !/[^aeiou]le$/.test(w) && w.length > 3) groups.pop();
  if (groups.length <= 1) return onsetRime(word);
  const cuts: number[] = [];
  for (let g = 0; g < groups.length - 1; g++) {
    const start = groups[g][1] + 1;
    const end = groups[g + 1][0];
    const cons = w.slice(start, end);
    let cut: number;
    if (cons.length <= 1) cut = start; // V/CV：ti-ger
    else if (DIGRAPHS.some((d) => cons === d)) cut = start; // 双字母当一个辅音：mo-ther
    else if (g === groups.length - 2 && /^[^aeiou]le$/.test(w.slice(end - 2))) cut = end - 2; // ta-ble、pur-ple
    else {
      // 辅音连在一起：后一段从“能放在词首的辅音组合”开始（chil-dren、class-room、grand-mo-ther），否则只留一个辅音
      let k = cons.length - 1;
      for (let t = 1; t < cons.length; t++) {
        const tail = cons.slice(t);
        if (ONSET.has(tail) || DIGRAPHS.includes(tail)) {
          k = t;
          break;
        }
      }
      cut = start + k;
    }
    cuts.push(cut);
  }
  const out: string[] = [];
  let prev = 0;
  for (const c of cuts) {
    if (c > prev && c < w.length) {
      out.push(word.slice(prev, c));
      prev = c;
    }
  }
  out.push(word.slice(prev));
  return out.filter(Boolean);
}

/** 短词（一个音节）拆成“开头辅音 + 后面的韵”：b-ear、c-at、sh-ip */
function onsetRime(word: string): string[] {
  const w = word.toLowerCase();
  let i = 0;
  while (i < w.length && !isVowelAt(w, i)) i++;
  if (i === 0 || i >= w.length) return [word];
  return [word.slice(0, i), word.slice(i)];
}

/** 单词或短语的分段（短语按空格分词，词与词之间保留空格段） */
export function segments(text: string): string[] {
  const out: string[] = [];
  text.split(/(\s+|-)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$|^-$/.test(part)) out.push(part);
    else out.push(...syllables(part));
  });
  return out;
}

/* ───────────── 颜色、大小、形状 ───────────── */

/** 颜色词用自己的颜色显示；浅色加深色描边（在卡片上看得清） */
export const COLOR_WORDS: Record<string, { color: string; outline?: boolean }> = {
  red: { color: '#E53935' },
  green: { color: '#2E9E4F' },
  yellow: { color: '#FFD21F', outline: true },
  blue: { color: '#1E6FD9' },
  purple: { color: '#8E44AD' },
  black: { color: '#111111' },
  brown: { color: '#8B5A2B' },
  white: { color: '#FFFFFF', outline: true },
  orange: { color: '#FF8A1F' },
  pink: { color: '#FF6FAE' },
};

export type WordLook = 'big' | 'small' | 'tall' | 'fast' | 'long' | 'short' | 'fat' | 'thin';
/** 意思和“样子”有关的词：big 特别大、small 特别小、tall 拉高、fast 向前倾斜…… */
export const LOOK_WORDS: Record<string, WordLook> = {
  big: 'big', bigger: 'big', small: 'small', smaller: 'small', little: 'small', tall: 'tall', taller: 'tall',
  high: 'tall', fast: 'fast', faster: 'fast', quickly: 'fast', long: 'long', longer: 'long', short: 'short',
  shorter: 'short', fat: 'fat', thin: 'thin', thinner: 'thin',
};

/** 少数“长得像图画”的词：形状窍门（只有这几个是写好的） */
export const SHAPE_TIPS: Record<string, string> = {
  eye: 'eye 像一张脸：两个 e 是两只眼睛，中间的 y 是鼻子。',
  look: 'look 中间的 oo 像两只睁大的眼睛，正在看。',
  see: 'see 里的 ee 像两只眼睛，用眼睛“看见”。',
  bed: 'bed 像一张床：b 和 d 是两头的床架，e 是躺在中间的人。',
  moon: 'moon 中间的 oo 像天上圆圆的月亮。',
  egg: 'egg 后面的 gg 像两个挨在一起的鸡蛋。',
  tall: 'tall 后面的 ll 像两根高高的柱子。',
  wow: 'wow 像一张吃惊的脸：两个 w 是眼睛，o 是张大的嘴。',
  zoo: 'zoo 里的 oo 像动物园里动物圆圆的眼睛。',
  ball: 'ball 的 b 像一只脚踢着球，ll 是球门柱。',
};

/* ───────────── 记忆窍门（程序计算） ───────────── */

const single = (w: string) => /^[a-zA-Z]+$/.test(w);
/** 课本里的单个单词（3 个字母以上，小写去重），用来找藏词、别搞混 */
const VOCAB: string[] = [...new Set(ALL_CARDS.map((c) => c.w).filter(single).map((w) => w.toLowerCase()))].filter(
  (w) => w.length >= 3,
);

export interface HiddenWord {
  word: string;
  start: number;
}
/** 藏词：这个单词里藏着的另一个课本单词（3 个字母以上），最长的在前，最多 3 个 */
export function hiddenWords(word: string): HiddenWord[] {
  const w = word.toLowerCase();
  if (!single(w)) return [];
  const found: HiddenWord[] = [];
  for (const v of VOCAB) {
    if (v === w || v.length >= w.length) continue;
    const i = w.indexOf(v);
    if (i >= 0) found.push({ word: v, start: i });
  }
  found.sort((a, b) => b.word.length - a.word.length || a.start - b.start);
  // 被更长的藏词完全包住的不再重复列出（例如 bear 里已有 ear，就不再列 ar）
  return found.filter((h, i) => !found.slice(0, i).some((o) => o.start <= h.start && o.start + o.word.length >= h.start + h.word.length)).slice(0, 3);
}

/** 拼读家族：字母组合 + 这个组合在单词里的读音（对照音标判断） */
interface Pattern {
  id: string;
  label: string;
  re: RegExp;
  sounds: string[];
}
const PATTERNS: Pattern[] = [
  { id: 'ear', label: 'ear', re: /ear/, sounds: ['ɪr', 'ɛr', 'ɝː'] },
  { id: 'ee', label: 'ee', re: /ee/, sounds: ['iː'] },
  { id: 'ea', label: 'ea', re: /ea(?!r)/, sounds: ['iː', 'ɛ', 'eɪ'] },
  { id: 'oo', label: 'oo', re: /oo/, sounds: ['uː', 'ʊ'] },
  { id: 'a_e', label: 'a_e', re: /a[bcdfgklmnprstvz]e(s|d)?$/, sounds: ['eɪ'] },
  { id: 'i_e', label: 'i_e', re: /i[bcdfgklmnprstvz]e(s|d)?$/, sounds: ['aɪ'] },
  { id: 'ar', label: 'ar', re: /ar/, sounds: ['ɑːr'] },
  { id: 'ir/ur', label: 'ir / ur', re: /[iu]r/, sounds: ['ɝː'] },
  { id: 'ow', label: 'ow', re: /ow/, sounds: ['aʊ', 'oʊ'] },
  { id: 'sh', label: 'sh', re: /sh/, sounds: ['ʃ'] },
  { id: 'th', label: 'th', re: /th/, sounds: ['θ', 'ð'] },
  { id: 'ck', label: 'ck', re: /ck/, sounds: ['k'] },
];

export interface Family {
  key: string;
  label: string;
  sound: string;
  /** 同一家的其他词（不含自己），按单词去重 */
  members: WordCard[];
}

function familyKeys(card: WordCard): { key: string; label: string; sound: string }[] {
  const w = card.w.toLowerCase();
  if (!single(w) || !card.ipa) return [];
  const ipa = card.ipa.replace(/[ˈˌ]/g, '');
  const keys: { key: string; label: string; sound: string }[] = [];
  for (const p of PATTERNS) {
    if (!p.re.test(w)) continue;
    if (p.id === 'ea' && /ear/.test(w) && !/ea(?!r)/.test(w)) continue;
    const sound = p.sounds.find((s) => ipa.includes(s));
    if (!sound) continue; // 拼写有这个组合，但读音对不上（例如 bread 里的 ea 不读 /iː/ 就归到 /ɛ/ 家；都对不上则不算）
    keys.push({ key: `${p.id}:${sound}`, label: p.label, sound });
  }
  return keys;
}

const FAMILY_INDEX = (() => {
  const m = new Map<string, WordCard[]>();
  const seen = new Set<string>();
  for (const c of ALL_CARDS) {
    for (const k of familyKeys(c)) {
      const id = `${k.key}|${c.w.toLowerCase()}`;
      if (seen.has(id)) continue;
      seen.add(id);
      m.set(k.key, [...(m.get(k.key) ?? []), c]);
    }
  }
  return m;
})();

/** 这个词所在的拼读家族（每家最多列 6 个其他词，同年级的优先） */
export function families(card: WordCard, grade: number): Family[] {
  return familyKeys(card)
    .map((k) => {
      const others = (FAMILY_INDEX.get(k.key) ?? []).filter((c) => c.w.toLowerCase() !== card.w.toLowerCase());
      const g = (c: WordCard) => Math.abs(gradeOf(c) - grade);
      return { ...k, members: [...others].sort((a, b) => g(a) - g(b)).slice(0, 6) };
    })
    .filter((f) => f.members.length > 0);
}

function gradeOf(c: WordCard): number {
  const m = /^pep(\d)/.exec(c.unitId);
  return m ? Number(m[1]) : 1;
}

export interface Confusable {
  word: string;
  /** 标红的字母在哪个词里、第几个：换了一个字母时标在对方词里；多一个字母时标在较长的那个词里 */
  redIn: 'other' | 'self';
  at: number;
}
/** 别搞混：和它只差一个字母的课本单词（换了一个字母，或多/少一个字母），最多 4 个 */
export function confusables(word: string): Confusable[] {
  const w = word.toLowerCase();
  if (!single(w)) return [];
  const out: Confusable[] = [];
  for (const v of VOCAB) {
    if (v === w) continue;
    const d = oneLetterDiff(w, v);
    if (d) out.push({ word: v, ...d });
  }
  return out.slice(0, 4);
}

/** 只差一个字母时，返回标红的位置（在 a 还是 b 里），否则 null */
export function oneLetterDiff(a: string, b: string): { redIn: 'other' | 'self'; at: number } | null {
  if (a.length === b.length) {
    let at = -1;
    for (let i = 0; i < a.length; i++)
      if (a[i] !== b[i]) {
        if (at >= 0) return null;
        at = i;
      }
    return at >= 0 ? { redIn: 'other', at } : null;
  }
  if (Math.abs(a.length - b.length) !== 1) return null;
  const longer = a.length > b.length ? a : b;
  const shorter = longer === a ? b : a;
  for (let i = 0; i < longer.length; i++)
    if (longer.slice(0, i) + longer.slice(i + 1) === shorter) return { redIn: longer === b ? 'other' : 'self', at: i };
  return null;
}

/** 窍门里的词点了跳到哪张卡：优先同单元，其次同年级，再其次任意单元 */
export function cardForWord(word: string, from: WordCard): WordCard | undefined {
  const lw = word.toLowerCase();
  const all = ALL_CARDS.filter((c) => c.w.toLowerCase() === lw);
  return (
    all.find((c) => c.unitId === from.unitId) ?? all.find((c) => gradeOf(c) === gradeOf(from)) ?? all[0]
  );
}
