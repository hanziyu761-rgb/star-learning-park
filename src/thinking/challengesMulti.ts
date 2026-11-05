/**
 * V2.11 新题型（本项目原创，待教师审核）：
 * - 一题多解（多选）：哪些算式的得数是 N？答案不止一个，要全部找出来。
 * - 小侦探找错：4 道算式里只有一道算错了，找出来（练验算）。
 * 题目全部由签名决定，可以由题目 id 还原；所有答案由程序计算。
 */
import type { ChoiceOption } from '@/lesson/types';
import { hash, int, P, pick, say, seeded, shuffle, type ChallengeGen, type Level, type Rand } from './challenges';

export interface Expr {
  text: string;
  value: number;
}

const opt = (id: number, text: string): ChoiceOption => ({ id: String(id), text, speak: say(spoken(text)) });
/** 朗读用：把符号读成汉字 */
export const spoken = (t: string) =>
  t
    .replace(/\+/g, '加')
    .replace(/-/g, '减')
    .replace(/×/g, '乘')
    .replace(/÷/g, '除以')
    .replace(/=/g, '等于')
    .replace(/(\d+)\/(\d+)/g, '$2分之$1');

/** 分数 a/b 与 c/d 是否相等 */
const fracEq = (a: number, b: number, c: number, d: number) => a * d === b * c;

/* ───────── 一题多解 ───────── */

interface MultiBuilt {
  target: string;
  right: Expr[];
  wrong: Expr[];
}

function pairsSum(n: number, lo: number, hi: number) {
  const out: [number, number][] = [];
  for (let a = lo; a <= hi; a++) for (let b = a; b <= hi; b++) if (a + b === n) out.push([a, b]);
  return out;
}

function multiBuild(level: Level, n: number, rand: Rand): MultiBuilt {
  const add = ([a, b]: [number, number]): Expr => ({ text: `${a}+${b}`, value: a + b });
  if (level === 1 || level === 2) {
    const hi = level === 1 ? n - 1 : 9;
    const lo = level === 1 ? 0 : 2;
    const goods = shuffle(pairsSum(n, lo, hi), rand);
    const right: Expr[] = goods.slice(0, level === 1 ? 3 : 2).map(add);
    const wrong: Expr[] = [];
    const near = shuffle([...pairsSum(n - 1, lo + 1, hi), ...pairsSum(n + 1, lo + 1, hi)], rand);
    for (const p of near) if (wrong.length < (level === 1 ? 3 : 2)) wrong.push(add(p));
    if (level === 2) {
      // 一道减法对、一道减法错
      const d = int(rand, 1, 20 - n);
      right.push({ text: `${n + d}-${d}`, value: n });
      const e = int(rand, 1, 20 - n);
      const off = pick(rand, [-1, 1]);
      wrong.push({ text: `${n + e + off}-${e}`, value: n + off });
    }
    return { target: String(n), right, wrong };
  }
  if (level === 3) {
    const prods: [number, number][] = [];
    for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) if (a * b === n) prods.push([a, b]);
    const right: Expr[] = prods.slice(0, 2).map(([a, b]) => ({ text: `${a}×${b}`, value: n }));
    const k = int(rand, 2, 4);
    right.push({ text: `${n * k}÷${k}`, value: n });
    const near: [number, number][] = [];
    for (let a = 2; a <= 9; a++)
      for (let b = a; b <= 9; b++) if (a * b !== n && Math.abs(a * b - n) <= 4) near.push([a, b]);
    const wrong: Expr[] = shuffle(near, rand)
      .slice(0, 2)
      .map(([a, b]) => ({ text: `${a}×${b}`, value: a * b }));
    const k2 = int(rand, 2, 4);
    wrong.push({ text: `${(n + 1) * k2}÷${k2}`, value: n + 1 });
    return { target: String(n), right, wrong };
  }
  // level 4：和某个分数一样大的分数
  const [num, den] = FRACS[n];
  const ks = shuffle([2, 3, 4, 5, 6], rand).slice(0, 3);
  const right: Expr[] = ks.map((k) => ({ text: `${num * k}/${den * k}`, value: num / den }));
  const cands: [number, number][] = [];
  for (const k of [2, 3, 4]) cands.push([num * k + 1, den * k], [num * k, den * k + 1], [num + k, den + k]);
  const wrong: Expr[] = [];
  for (const [a, b] of shuffle(cands, rand))
    if (wrong.length < 3 && a < b && !fracEq(a, b, num, den) && !wrong.some((w) => w.text === `${a}/${b}`))
      wrong.push({ text: `${a}/${b}`, value: a / b });
  return { target: `${num}/${den}`, right, wrong };
}

/** 五六年级用的分数（下标存在签名里） */
export const FRACS: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [2, 5],
];
const PRODUCT_TARGETS = [12, 16, 18, 24, 36];

export const multiway: ChallengeGen = {
  type: 'multiway',
  subject: 'math',
  name: '一题多解',
  dims: ['strategy', 'reason'],
  sig: (rand, level) => {
    const n =
      level === 1
        ? int(rand, 6, 10)
        : level === 2
          ? int(rand, 11, 16)
          : level === 3
            ? pick(rand, PRODUCT_TARGETS)
            : int(rand, 0, FRACS.length - 1);
    return `multiway:${level}:${n}:${int(rand, 0, 9999)}`;
  },
  build: (sig) => {
    const [, l, n] = sig.split(':');
    const level = Number(l) as Level;
    const rand = seeded(hash(sig));
    const { target, right, wrong } = multiBuild(level, Number(n), rand);
    const all = shuffle([...right.map((e) => ({ e, ok: true })), ...wrong.map((e) => ({ e, ok: false }))], rand);
    const options = all.map((x, i) => opt(i, x.e.text));
    const answerIds = all.flatMap((x, i) => (x.ok ? [String(i)] : []));
    const frac = level === 4;
    return {
      kind: 'multi',
      prompt: frac
        ? P(`哪些分数和 ${target} 一样大？`, 'nǎ xiē fēn shù hé yí yàng dà')
        : P(`哪些算式的得数是 ${target}？`, 'nǎ xiē suàn shì de dé shù shì'),
      options,
      answerIds,
      wrongHint: frac
        ? P(
            '分子、分母同时乘同一个数，分数大小不变。',
            'fēn zǐ fēn mǔ tóng shí chéng tóng yí gè shù fēn shù dà xiǎo bú biàn',
          )
        : P('把每道算式都算一算，再选。', 'bǎ měi dào suàn shì dōu suàn yi suàn zài xuǎn'),
      explanation: `${right.map((e) => e.text).join('、')} 都${frac ? '和' : '等于'} ${target}${frac ? '一样大' : ''}。`,
    };
  },
};

/* ───────── 小侦探找错 ───────── */

interface Eq {
  a: number;
  b: number;
  op: '+' | '-' | '×';
}
const calc = ({ a, b, op }: Eq) => (op === '+' ? a + b : op === '-' ? a - b : a * b);

function detectiveEq(level: Level, rand: Rand): Eq {
  if (level === 1) {
    const s = int(rand, 3, 10);
    const a = int(rand, 1, s - 1);
    return rand() < 0.5 ? { a, b: s - a, op: '+' } : { a: s, b: a, op: '-' };
  }
  if (level === 2) {
    const a = int(rand, 3, 9);
    const b = int(rand, 11 - a, 9);
    return rand() < 0.5 ? { a, b, op: '+' } : { a: a + b, b, op: '-' };
  }
  if (level === 3) {
    // 两位数加两位数，个位要进位
    const a = int(rand, 1, 6) * 10 + int(rand, 3, 9);
    const b = int(rand, 1, 3) * 10 + int(rand, 11 - (a % 10), 9);
    return { a, b, op: '+' };
  }
  // 两位数乘一位数，要进位
  const b = int(rand, 3, 9);
  let a = int(rand, 12, 49);
  while ((a % 10) * b < 10) a += 1;
  return { a, b, op: '×' };
}

/** 错误的得数：一、二档差 1（数错了），三、四档忘了进位（少 10） */
function wrongResult(level: Level, e: Eq, rand: Rand) {
  const r = calc(e);
  return level <= 2 ? r + pick(rand, [-1, 1]) : r - 10;
}

export const detective: ChallengeGen = {
  type: 'detective',
  subject: 'math',
  name: '小侦探找错',
  dims: ['reason', 'observe'],
  sig: (rand, level) => `detective:${level}:${int(rand, 0, 9999)}`,
  build: (sig) => {
    const level = Number(sig.split(':')[1]) as Level;
    const rand = seeded(hash(sig));
    const eqs: Eq[] = [];
    while (eqs.length < 4) {
      const e = detectiveEq(level, rand);
      if (!eqs.some((x) => x.a === e.a && x.b === e.b && x.op === e.op)) eqs.push(e);
    }
    const bad = int(rand, 0, 3);
    const shown = eqs.map((e, i) => (i === bad ? wrongResult(level, e, rand) : calc(e)));
    const text = (e: Eq, r: number) => `${e.a}${e.op}${e.b}=${r}`;
    const e = eqs[bad];
    return {
      kind: 'choice',
      prompt: P('小侦探：哪一道算错了？', 'xiǎo zhēn tàn nǎ yí dào suàn cuò le'),
      options: eqs.map((x, i) => opt(i, text(x, shown[i]))),
      answerId: String(bad),
      wrongHint: P('每一道都验算一下。', 'měi yí dào dōu yàn suàn yí xià'),
      explanation: `${text(e, shown[bad])} 算错了，正确的是 ${text(e, calc(e))}${level >= 3 ? '（忘了进位）' : ''}。`,
    };
  },
};

export const MATH_MULTI: ChallengeGen[] = [multiway, detective];
