/**
 * 口算闯关：程序生成的计算题（原创，答案由程序计算，保证正确），题量不限。
 * 题目 id 就是算式本身（如 "7+5"），复习时可以由 id 还原题目。
 */
import { asInput } from '@/knowledge/inputs';
import type { ChoiceExercise, InputExercise } from '@/lesson/types';
import { zh } from './zh';

export interface OralTopic {
  id: string;
  grade: number;
  title: string;
  /** 三年级起的主题不注拼音（不填） */
  titlePy?: string;
  emoji: string;
  make: (rand: () => number) => string;
}

const r = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

export const ORAL_TOPICS: OralTopic[] = [
  {
    id: 'add10',
    grade: 1,
    title: '10以内加法',
    titlePy: 'yǐ nèi jiā fǎ',
    emoji: '➕',
    make: (rand) => {
      const a = r(rand, 0, 9);
      return `${a}+${r(rand, 0, 10 - a)}`;
    },
  },
  {
    id: 'sub10',
    grade: 1,
    title: '10以内减法',
    titlePy: 'yǐ nèi jiǎn fǎ',
    emoji: '➖',
    make: (rand) => {
      const a = r(rand, 1, 10);
      return `${a}-${r(rand, 0, a)}`;
    },
  },
  {
    id: 'add20',
    grade: 1,
    title: '20以内进位加法',
    titlePy: 'yǐ nèi jìn wèi jiā fǎ',
    emoji: '🚀',
    make: (rand) => {
      const a = r(rand, 2, 9);
      return `${a}+${r(rand, 11 - a, 9)}`;
    },
  },
  {
    id: 'sub20',
    grade: 1,
    title: '20以内退位减法',
    titlePy: 'yǐ nèi tuì wèi jiǎn fǎ',
    emoji: '🎯',
    make: (rand) => {
      const b = r(rand, 2, 9);
      return `${r(rand, 11, 9 + b)}-${b}`;
    },
  },
  {
    id: 'add100',
    grade: 2,
    title: '100以内加法',
    titlePy: 'yǐ nèi jiā fǎ',
    emoji: '➕',
    make: (rand) => {
      const a = r(rand, 10, 89);
      return `${a}+${r(rand, 1, 99 - a)}`;
    },
  },
  {
    id: 'sub100',
    grade: 2,
    title: '100以内减法',
    titlePy: 'yǐ nèi jiǎn fǎ',
    emoji: '➖',
    make: (rand) => {
      const a = r(rand, 20, 99);
      return `${a}-${r(rand, 1, a - 1)}`;
    },
  },
  {
    id: 'mul99',
    grade: 2,
    title: '乘法口诀',
    titlePy: 'chéng fǎ kǒu jué',
    emoji: '✖️',
    make: (rand) => `${r(rand, 1, 9)}×${r(rand, 1, 9)}`,
  },
  {
    id: 'div99',
    grade: 2,
    title: '表内除法',
    titlePy: 'biǎo nèi chú fǎ',
    emoji: '➗',
    make: (rand) => {
      const b = r(rand, 1, 9);
      return `${b * r(rand, 1, 9)}÷${b}`;
    },
  },
  // ───── 三～六年级（V2.14） ─────
  {
    id: 'mul10',
    grade: 3,
    title: '整十整百乘一位数',
    emoji: '✖️',
    make: (rand) => `${r(rand, 2, 9) * (rand() < 0.5 ? 10 : 100)}×${r(rand, 2, 9)}`,
  },
  {
    id: 'div10',
    grade: 3,
    title: '整十整百除以一位数',
    emoji: '➗',
    make: (rand) => {
      const b = r(rand, 2, 9);
      const q = r(rand, 1, 9) * (rand() < 0.6 ? 10 : 100);
      return `${b * q}÷${b}`;
    },
  },
  {
    id: 'mul2d10',
    grade: 4,
    title: '两位数乘整十数',
    emoji: '✖️',
    make: (rand) => `${r(rand, 11, 39)}×${r(rand, 2, 9) * 10}`,
  },
  {
    id: 'decaddsub',
    grade: 4,
    title: '一位小数加减法',
    emoji: '🔢',
    make: (rand) => {
      const a = r(rand, 11, 99);
      const b = r(rand, 11, 99);
      const d = (n: number) => (n / 10).toFixed(1);
      return rand() < 0.5 ? `${d(a)}+${d(b)}` : `${d(Math.max(a, b))}-${d(Math.min(a, b))}`;
    },
  },
  {
    id: 'decmul',
    grade: 5,
    title: '小数乘整数',
    emoji: '✖️',
    make: (rand) => `${(r(rand, 1, 25) / 10).toFixed(1)}×${r(rand, 2, 9)}`,
  },
  {
    id: 'decdiv',
    grade: 5,
    title: '小数除以整数',
    emoji: '➗',
    make: (rand) => {
      const b = r(rand, 2, 9);
      return `${((b * r(rand, 1, 9)) / 10).toFixed(1)}÷${b}`;
    },
  },
  {
    id: 'fracadd',
    grade: 5,
    title: '同分母分数加减',
    emoji: '🍕',
    make: (rand) => {
      const d = r(rand, 5, 12);
      const a = r(rand, 1, d - 2);
      const b = r(rand, 1, d - 1 - a);
      return rand() < 0.5 ? `${a}/${d}+${b}/${d}` : `${a + b}/${d}-${b}/${d}`;
    },
  },
  {
    id: 'fracmul',
    grade: 6,
    title: '分数乘法',
    emoji: '🍰',
    make: (rand) => {
      if (rand() < 0.5) {
        const d = r(rand, 3, 12);
        return `${r(rand, 1, d - 1)}/${d}×${r(rand, 2, 6)}`;
      }
      const b = r(rand, 2, 9);
      const d = r(rand, 2, 9);
      return `${r(rand, 1, b - 1)}/${b}×${r(rand, 1, d - 1)}/${d}`;
    },
  },
  {
    id: 'fracdiv',
    grade: 6,
    title: '分数除法',
    emoji: '🔄',
    make: (rand) => {
      const b = r(rand, 2, 9);
      const d = r(rand, 2, 9);
      return rand() < 0.5
        ? `${r(rand, 1, b - 1)}/${b}÷${r(rand, 2, 5)}`
        : `${r(rand, 1, b - 1)}/${b}÷${r(rand, 1, d - 1)}/${d}`;
    },
  },
  /* ── 初中（V5.2）：题目 id 以 n: / p: / r: / c: 开头，可以有负数 ── */
  { id: 'ratadd', grade: 7, title: '有理数加法', emoji: '➕', make: (rand) => `n:${nz(rand, 30)}:+:${nz(rand, 30)}` },
  { id: 'ratsub', grade: 7, title: '有理数减法', emoji: '➖', make: (rand) => `n:${nz(rand, 30)}:-:${nz(rand, 30)}` },
  { id: 'ratmul', grade: 7, title: '有理数乘法', emoji: '✖️', make: (rand) => `n:${nz(rand, 12)}:×:${nz(rand, 12)}` },
  {
    id: 'ratdiv',
    grade: 7,
    title: '有理数除法',
    emoji: '➗',
    make: (rand) => {
      const b = nz(rand, 9);
      return `n:${b * nz(rand, 9)}:÷:${b}`;
    },
  },
  { id: 'ratpow', grade: 7, title: '有理数乘方', emoji: '🔺', make: (rand) => `p:${nz(rand, 5)}:${r(rand, 2, rand() < 0.7 ? 3 : 4)}` },
  {
    id: 'roots',
    grade: 7,
    title: '平方根与立方根',
    emoji: '√',
    make: (rand) => (rand() < 0.6 ? `r:${r(rand, 1, 20) ** 2}` : `c:${nz(rand, 6) ** 3}`),
  },
];

/** 不为 0 的整数，−m～m */
function nz(rand: () => number, m: number): number {
  const v = r(rand, -m, m - 1);
  return v >= 0 ? v + 1 : v;
}
const JUNIOR_EXPR = /^([nprc]):(-?\d+)(?::([+\-×÷]|\d+))?(?::(-?\d+))?$/;
const isJuniorExpr = (expr: string) => JUNIOR_EXPR.test(expr);
const M = '−';
const show = (n: number, paren: boolean) => (n < 0 ? (paren ? `(${M}${-n})` : `${M}${-n}`) : String(n));
const SUP: Record<string, string> = { 2: '²', 3: '³', 4: '⁴' };

/** 初中口算：得数和显示 */
function juniorCalc(expr: string): { value: number; display: string; speak: string } {
  const m = expr.match(JUNIOR_EXPR);
  if (!m) throw new Error(`算式格式错误：${expr}`);
  const a = Number(m[2]);
  const sayN = (n: number) => (n < 0 ? `负${-n}` : String(n));
  if (m[1] === 'n') {
    const b = Number(m[4]);
    const op = m[3];
    const value = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
    return { value, display: `${show(a, false)} ${op === '-' ? M : op} ${show(b, true)}`, speak: `${sayN(a)}${OP_SAY[op]}${sayN(b)}等于多少？` };
  }
  if (m[1] === 'p') {
    const n = Number(m[3]);
    return { value: a ** n, display: `${show(a, true)}${SUP[n]}`, speak: `${sayN(a)}的${n}次方等于多少？` };
  }
  if (m[1] === 'r') return { value: Math.sqrt(a), display: `√${a}`, speak: `根号${a}等于多少？` };
  return { value: Math.round(Math.cbrt(a)), display: `³√${show(a, false)}`, speak: `${sayN(a)}的立方根等于多少？` };
}

/** 初中口算题：干扰项是常见错误（符号错、把加减弄反、乘方当乘法） */
function juniorExercise(topicId: string, expr: string): ChoiceExercise {
  const { value, display, speak } = juniorCalc(expr);
  const m = expr.match(JUNIOR_EXPR)!;
  const a = Number(m[2]);
  const wrong =
    m[1] === 'n'
      ? [-value, m[3] === '+' ? a - Number(m[4]) : m[3] === '-' ? a + Number(m[4]) : value + 1, Math.abs(value) + 1]
      : m[1] === 'p'
        ? [-value, a * Number(m[3]), value + 1]
        : [-value, value * 2, value + 1];
  const set = [...new Set([value, ...wrong])].slice(0, 4);
  for (const d of [1, -1, 2, -2]) if (set.length < 4 && !set.includes(value + d)) set.push(value + d);
  const ans = String(value);
  return {
    kind: 'choice',
    id: expr,
    skill: `oral.${topicId}`,
    prompt: { text: '算一算', speak: { text: speak, lang: 'zh-CN' } },
    stem: { text: `${display} = ?` },
    options: set.sort((x, y) => x - y).map((n) => ({ id: String(n), text: show(n, false) })),
    answerId: ans,
    wrongHint: { text: '再算一算', speak: { text: '再算一算', lang: 'zh-CN' } },
  };
}

export function topicsForGrade(grade: number): OralTopic[] {
  // 初中：初中口算 + 六年级分数口算复习（V5.2）
  if (grade >= 7) return ORAL_TOPICS.filter((t) => t.grade <= grade && t.grade >= 6);
  // 高年级也可以复习低年级口算
  return ORAL_TOPICS.filter((t) => t.grade <= grade);
}

export const oralLessonId = (topicId: string) => `oral:${topicId}`;
export const isOralLessonId = (id: string) => id.startsWith('oral:');

/* 精确计算：整数、一位小数、分数都换成分数算，避免小数误差 */
type Frac = [number, number];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const norm = ([n, d]: Frac): Frac => {
  const g = gcd(n, d) || 1;
  return d < 0 ? [-n / g, -d / g] : [n / g, d / g];
};
function parseNum(t: string): Frac {
  const f = t.match(/^(\d+)\/(\d+)$/);
  if (f) return norm([Number(f[1]), Number(f[2])]);
  const [i, dec = ''] = t.split('.');
  return norm([Number(i + dec), 10 ** dec.length]);
}
const OPERAND = String.raw`(\d+(?:\.\d+)?|\d+\/\d+)`;
const EXPR = new RegExp(`^${OPERAND}([+\\-×÷])${OPERAND}$`);

function calcFrac(expr: string): Frac {
  const m = expr.match(EXPR);
  if (!m) throw new Error(`算式格式错误：${expr}`);
  const [a, b] = [parseNum(m[1]), parseNum(m[3])];
  switch (m[2]) {
    case '+':
      return norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
    case '-':
      return norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
    case '×':
      return norm([a[0] * b[0], a[1] * b[1]]);
    default:
      return norm([a[0] * b[1], a[1] * b[0]]);
  }
}

export function evalExpr(expr: string): number {
  const [n, d] = calcFrac(expr);
  return n / d;
}

/** 得数的写法：有分数参与写成最简分数（整数就写整数）；否则写整数或小数 */
export function oralAnswer(expr: string): string {
  const [n, d] = calcFrac(expr);
  if (d === 1) return String(n);
  if (expr.includes('/')) return `${n}/${d}`;
  // 小数：分母只含 2、5 才是有限小数（本项目的题都是）
  let k = 0;
  while ((d * 10 ** k) % 1 === 0 && 10 ** k % d !== 0 && k < 6) k++;
  return (n / d).toFixed(k);
}

/** 干扰项：整数和小数差一点或小数点错位；分数分子差一点或分母算错 */
function distractors(expr: string, ans: string): string[] {
  const out: string[] = [];
  if (ans.includes('/')) {
    const [n, d] = ans.split('/').map(Number);
    for (const [a, b] of [
      [n + 1, d],
      [n - 1, d],
      [n, d + 1],
      [n * 2, d],
      [n + 2, d],
      [n, d - 1],
    ] as Frac[]) {
      if (a <= 0 || b <= 1) continue;
      const [x, y] = norm([a, b]);
      const t = y === 1 ? String(x) : `${x}/${y}`;
      if (t !== ans && !out.includes(t)) out.push(t);
    }
    return out;
  }
  const v = Number(ans);
  const dec = ans.includes('.') ? ans.split('.')[1].length : 0;
  // 整十整百的得数：常见错误是少写或多写一个 0
  const zeros = !dec && v >= 100 && v % 10 === 0;
  const steps = dec
    ? [10 ** -dec, -(10 ** -dec), v * 9, -v * 0.9, 1, -1]
    : zeros
      ? [v * 9, -v * 0.9, 10, -10, 1]
      : [1, -1, 2, -2, 10, -10, 3];
  for (const s of steps) {
    const w = Number((v + s).toFixed(dec + (dec && Math.abs(s) >= Math.abs(v) ? 1 : 0)));
    const t = String(w);
    if (w >= 0 && t !== ans && !out.includes(t)) out.push(t);
  }
  return out;
}

const OP_SAY: Record<string, string> = { '+': '加', '-': '减', '×': '乘', '÷': '除以' };

/** 口算题；题目 id 以 #in 结尾时改成自己填数（V2.9） */
export function oralExercise(topicId: string, expr: string): ChoiceExercise | InputExercise {
  if (expr.endsWith('#in')) return asInput(oralExercise(topicId, expr.slice(0, -3)), expr)!;
  if (isJuniorExpr(expr)) return juniorExercise(topicId, expr);
  const ans = oralAnswer(expr);
  const set = [ans, ...distractors(expr, ans)].slice(0, 4);
  const options = set.sort((a, b) => evalNum(a) - evalNum(b));
  const m = expr.match(EXPR)!;
  const display = `${m[1]} ${m[2] === '-' ? '−' : m[2]} ${m[3]}`;
  const sayNum = (t: string) => t.replace(/^(\d+)\/(\d+)$/, '$2分之$1').replace('.', '点');
  // 三年级起不注拼音
  const plain = (ORAL_TOPICS.find((t) => t.id === topicId)?.grade ?? 1) >= 3;
  return {
    kind: 'choice',
    id: expr,
    skill: `oral.${topicId}`,
    prompt: {
      text: plain ? '算一算' : zh('算一算', 'suàn yi suàn'),
      speak: { text: `${sayNum(m[1])}${OP_SAY[m[2]]}${sayNum(m[3])}等于多少？`, lang: 'zh-CN' },
    },
    stem: { text: `${display} = ?` },
    options: options.map((n) => ({ id: n, text: n })),
    answerId: ans,
    wrongHint: {
      text: plain ? '再算一算' : zh('再算一算', 'zài suàn yi suàn'),
      speak: { text: '再算一算', lang: 'zh-CN' },
    },
  };
}

const evalNum = (t: string) => {
  const [n, d] = parseNum(t);
  return n / d;
};

/** 生成一轮口算题（不重复） */
export function oralRound(topic: OralTopic, count = 10, rand: () => number = Math.random): string[] {
  const out = new Set<string>();
  let guard = 0;
  while (out.size < count && guard++ < 500) out.add(topic.make(rand));
  return [...out];
}

export function findOralExercise(lessonId: string, exerciseId: string) {
  if (!isOralLessonId(lessonId)) return null;
  const topicId = lessonId.slice(5);
  const topic = ORAL_TOPICS.find((t) => t.id === topicId);
  if (!topic) return null;
  try {
    return { topic, exercise: oralExercise(topicId, exerciseId) };
  } catch {
    return null;
  }
}
