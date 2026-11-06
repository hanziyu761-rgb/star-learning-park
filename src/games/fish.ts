/**
 * 语文 · 拼音钓鱼（V2.19）
 * 一、二年级：看字（并朗读），钓起读音正确的那条鱼。干扰鱼专挑容易混的读音，并且都是真实存在的音节：
 *   1 档：声调不同（mā / má / mǎ / mà）  2 档：再加前后鼻音（in / ing、en / eng、an / ang）
 *   3 档：再加平翘舌、n / l、f / h、b / p、d / t、g / k
 * 三年级起（4 档）：多音字——给一句话，钓出这个字在句子里的读音。
 */
import { zh } from '@/content/zh';
import type { ChoiceExercise } from '@/lesson/types';
import { safeId } from './common';
import { CHAR_POOL } from './data/charPool.gen';
import { POLY_LINES } from './data/poly';
import { SYLLABLES } from './data/syllables.gen';

const MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};
const UNMARK = new Map<string, [string, number]>();
for (const [v, ms] of Object.entries(MARKS)) ms.forEach((m, i) => UNMARK.set(m, [v, i + 1]));

/** 拆成“不带调的音节 + 声调（0 为轻声）” */
export function splitTone(py: string): { base: string; tone: number } {
  let tone = 0;
  const base = [...py]
    .map((c) => {
      const u = UNMARK.get(c);
      if (!u) return c;
      tone = u[1];
      return u[0];
    })
    .join('');
  return { base, tone };
}

/** 按标调规则加声调：有 a 标 a；没有 a 有 e 标 e；ou 标 o；否则标最后一个元音 */
export function addTone(base: string, tone: number): string {
  if (tone === 0) return base;
  const idx = (() => {
    if (base.includes('a')) return base.indexOf('a');
    if (base.includes('e')) return base.indexOf('e');
    if (base.includes('ou')) return base.indexOf('o');
    for (let i = base.length - 1; i >= 0; i--) if ('iouü'.includes(base[i])) return i;
    return -1;
  })();
  if (idx < 0) return base;
  return base.slice(0, idx) + MARKS[base[idx]][tone - 1] + base.slice(idx + 1);
}

const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
const INITIAL_SWAP: Record<string, string[]> = {
  z: ['zh'], zh: ['z'], c: ['ch'], ch: ['c'], s: ['sh'], sh: ['s'], n: ['l'], l: ['n'], f: ['h'], h: ['f'],
  b: ['p'], p: ['b'], d: ['t'], t: ['d'], g: ['k'], k: ['g'],
};
const FINAL_SWAP: [string, string][] = [
  ['ing', 'in'], ['eng', 'en'], ['ang', 'an'], ['iang', 'ian'], ['uang', 'uan'], ['ong', 'on'],
];

function splitInitial(base: string): [string, string] {
  const ini = INITIALS.find((x) => base.startsWith(x)) ?? '';
  return [ini, base.slice(ini.length)];
}

/** 容易混淆、且真实存在的读音（按档位逐步增加类型） */
export function confusablePinyin(py: string, level: number): string[] {
  const { base, tone } = splitTone(py);
  const out: string[] = [];
  const add = (b: string, t: number) => {
    const s = addTone(b, t);
    if (s !== py && SYLLABLES.has(s) && !out.includes(s)) out.push(s);
  };
  for (let t = 1; t <= 4; t++) add(base, t);
  if (level >= 2) {
    const [ini, fin] = splitInitial(base);
    for (const [a, b] of FINAL_SWAP) {
      if (fin.endsWith(a)) add(ini + fin.slice(0, -a.length) + b, tone || 1);
      else if (fin.endsWith(b) && !fin.endsWith(a)) add(ini + fin.slice(0, -b.length) + a, tone || 1);
    }
  }
  if (level >= 3) {
    const [ini, fin] = splitInitial(base);
    for (const s of INITIAL_SWAP[ini] ?? []) add(s + fin, tone || 1);
  }
  return out;
}

export interface FishQuestion {
  id: string;
  /** 要读的字 */
  char: string;
  /** 多音字题：整句话（字在句中的位置 at） */
  sentence?: string;
  at?: number;
  answer: string;
  options: string[];
  level: number;
}

export const POLY = POLY_LINES.trim()
  .split('\n')
  .map((l) => {
    const [char, py, sentence] = l.split('|');
    return { char, py, sentence };
  });

function shuffle<T>(a: T[], rand: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** 一局的题：一、二年级从字表抽，三年级起从多音字句子抽；每题 3～4 条鱼 */
export function fishRound(level: number, rand: () => number, n: number): FishQuestion[] {
  if (level >= 4) {
    return shuffle(POLY, rand)
      .slice(0, n)
      .map((p) => {
        const readings = POLY.filter((x) => x.char === p.char).map((x) => x.py);
        const extra = confusablePinyin(p.py, 1).filter((x) => !readings.includes(x));
        const options = shuffle([...new Set([...readings, ...extra.slice(0, Math.max(0, 3 - readings.length))])], rand);
        return {
          id: safeId(`fish:${p.char}:${p.py}:${p.sentence}`),
          char: p.char,
          sentence: p.sentence,
          at: [...p.sentence].indexOf(p.char),
          answer: p.py,
          options,
          level,
        };
      });
  }
  const pool = shuffle(
    CHAR_POOL.filter(([, py]) => confusablePinyin(py, level).length >= 2),
    rand,
  ).slice(0, n);
  return pool.map(([char, py]) => {
    const wrong = shuffle(confusablePinyin(py, level), rand).slice(0, 3);
    return { id: safeId(`fish:${char}:${py}`), char, answer: py, options: shuffle([py, ...wrong], rand), level };
  });
}

/* ───── 错题复习 ───── */
export const FISH_LESSON = 'game:fish';
export function fishExercise(exerciseId: string): ChoiceExercise | null {
  const m = /^fish:(.):([^:]+)(?::(.+))?$/u.exec(exerciseId);
  if (!m) return null;
  const [, char, py, sentence] = m;
  if (sentence) {
    const p = POLY.find((x) => x.char === char && x.py === py && x.sentence === sentence);
    if (!p) return null;
    const readings = [...new Set(POLY.filter((x) => x.char === char).map((x) => x.py))];
    return {
      kind: 'choice',
      id: exerciseId,
      skill: 'game.fish',
      prompt: { text: `“${sentence}”里的“${char}”怎么读？`, speak: { text: `${sentence}这句话里，${char}字怎么读？`, lang: 'zh-CN' } },
      stem: { text: sentence },
      options: readings.map((r) => ({ id: r, text: r })),
      answerId: py,
      wrongHint: { text: '读一读整句话，想想意思', speak: { text: '读一读整句话，想想意思', lang: 'zh-CN' } },
    };
  }
  if (!CHAR_POOL.some(([c, p]) => c === char && p === py)) return null;
  const wrong = confusablePinyin(py, 3).slice(0, 3);
  return {
    kind: 'choice',
    id: exerciseId,
    skill: 'game.fish',
    prompt: { text: zh('选出正确的读音', 'xuǎn chū zhèng què de dú yīn'), speak: { text: `${char}，选出正确的读音`, lang: 'zh-CN' } },
    stem: { text: char },
    options: [py, ...wrong].sort().map((r) => ({ id: r, text: r })),
    answerId: py,
    hidePinyin: true,
    wrongHint: { text: zh('再读一读', 'zài dú yi dú'), speak: { text: '再读一读', lang: 'zh-CN' } },
  };
}
