/**
 * 七～九年级数学知识点题目生成器（V5.2，本项目原创）。
 *
 * 和二～六年级一样：每道题由签名唯一确定（题目 id = kp:知识点:签名），答案全部由程序计算，干扰项取常见错误
 * （符号弄反、移项不变号、勾股定理用错边、平方根漏掉负的那个等）。
 * 概念类题目（全等的判定、三视图等）是原创的小题库，按签名里的编号取题。
 * 初中不注拼音。题型参考《义务教育数学课程标准（2022 年版）》第四学段和人教版章节目录（未核对教材原题）。
 * 状态：已通过教师审核。
 */
import type { ChoiceExercise, Prompt } from '@/lesson/types';
import type { UpperGen } from './genUpper';

type Rand = () => number;
type Built = ReturnType<UpperGen['build']>;

const r = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
/** 不为 0 的整数 */
const nz = (rand: Rand, lo: number, hi: number) => {
  const v = r(rand, lo, hi - 1);
  return v >= 0 ? v + 1 : v;
};
const pickI = (rand: Rand, n: number) => Math.floor(rand() * n);
const say = (text: string) => ({ text, lang: 'zh-CN' as const });
const sig = (...xs: (string | number)[]) => xs.join(':');
const nums = (s: string) => s.split(':').slice(1).map(Number);
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** 显示用的负号（−），答案里用普通减号，方便自己填数时比较 */
const M = '−';
/** 算式里的数：负数加括号 */
export const par = (n: number) => (n < 0 ? `(${M}${-n})` : String(n));
/** 算式开头的数：负数不加括号 */
export const lead = (n: number) => (n < 0 ? `${M}${-n}` : String(n));
/** 最简分数（带符号）：frac(-6, 8) = "-3/4"，frac(4, 2) = "2" */
export function frac(n: number, d: number): string {
  if (d < 0) return frac(-n, -d);
  const g = gcd(n, d) || 1;
  const a = n / g;
  const b = d / g;
  return b === 1 ? String(a) : `${a}/${b}`;
}
/** 一次式：lin(3, 'x', -5) = "3x − 5"；lin(-1, 'x', 0) = "−x" */
export function lin(a: number, v: string, b: number): string {
  const head = a === 0 ? '' : a === 1 ? v : a === -1 ? `${M}${v}` : `${lead(a)}${v}`;
  if (!head) return lead(b);
  return b === 0 ? head : `${head} ${b < 0 ? M : '+'} ${Math.abs(b)}`;
}
/** 二次式 ax² + bx + c */
export function quad(a: number, b: number, c: number, v = 'x'): string {
  const parts: string[] = [];
  const term = (k: number, s: string) => {
    if (k === 0) return;
    const abs = Math.abs(k);
    const body = s && abs === 1 ? s : `${abs}${s}`;
    parts.push(parts.length === 0 ? (k < 0 ? `${M}${body}` : body) : `${k < 0 ? M : '+'} ${body}`);
  };
  term(a, `${v}²`);
  term(b, v);
  term(c, '');
  return parts.join(' ') || '0';
}
const pt = (x: number, y: number) => `(${lead(x)}, ${lead(y)})`;
/** 选项的值：数、分数 */
const valueOf = (t: string) => (/^-?\d+(\.\d+)?\/\d+$/.test(t) ? Number(t.split('/')[0]) / Number(t.split('/')[1]) : Number(t));
const isNum = (t: string) => /^-?\d+(\.\d+)?(\/\d+)?$/.test(t);

/** 朗读用（V5.2）：把数学符号读成中文，屏幕上显示的文字不变。分数读“几分之几”，负号、根号、绝对值、乘方、几何符号都读出来 */
export function sayMath(t: string): string {
  return t
    .replace(/\|([^|]+)\|/g, '$1的绝对值')
    .replace(/³√\(?([^\s)]+)\)?/g, '$1的立方根')
    .replace(/√\(([^)]+)\)/g, '根号下$1')
    .replace(/(\d*)√(\d+)/g, (_, k: string, n: string) => `${k}根号${n}`)
    .replace(/(√?\d+)\/(\d+)/g, '$2分之$1')
    .replace(/([a-zA-Z0-9)])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, b: string, e: string) => {
      const n = [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('');
      return `${b}${n === '2' ? '的平方' : n === '3' ? '的立方' : `的${n}次方`}`;
    })
    .replace(/≠/g, '不等于')
    .replace(/·/g, '乘')
    .replace(/±/g, '正负')
    .replace(/≌/g, '全等于')
    .replace(/∽/g, '相似于')
    .replace(/∠/g, '角')
    .replace(/△/g, '三角形')
    .replace(/⊙/g, '圆')
    .replace(/Rt/g, '直角')
    .replace(/≥/g, '大于或等于')
    .replace(/≤/g, '小于或等于')
    .replace(/ > /g, '大于')
    .replace(/ < /g, '小于')
    .replace(/°/g, '度')
    .replace(/π/g, '派')
    .replace(/(^|[\s(（,，=：:])[-−](?=\d|[a-zA-Z])/g, '$1负')
    .replace(/[−-]/g, '减')
    .replace(/×/g, '乘')
    .replace(/÷/g, '除以')
    .replace(/ ?= ?\?/g, '等于多少')
    .replace(/\+/g, '加')
    .replace(/=/g, '等于')
    .replace(/\s+/g, ' ')
    .trim();
}
/** 选项：正确答案 + 干扰项（去重，可以有负数）；数字答案不足 4 个时用 ±1、±2 补齐，并从小到大排 */
export function opts(ans: string, wrongs: (string | number)[]): ChoiceExercise['options'] {
  const set: string[] = [ans];
  for (const w of wrongs.map(String)) {
    if (set.length >= 4) break;
    // 不要除不尽的长小数当干扰项（如 9.333…）
    if (w && w !== 'NaN' && !/\.\d{3,}/.test(w) && !set.includes(w)) set.push(w);
  }
  if (/^-?\d+$/.test(ans)) {
    const n = Number(ans);
    for (const d of [1, -1, 2, -2, 3]) {
      if (set.length >= 4) break;
      if (!set.includes(String(n + d))) set.push(String(n + d));
    }
  }
  if (set.every(isNum)) set.sort((a, b) => valueOf(a) - valueOf(b));
  // 显示时负号用 −（选项 id 保持普通减号）
  return set.map((t) => ({ id: t, text: t.replace(/^-/, M), speak: say(sayMath(t)) }));
}
/** 分步讲解（V5.4）：每一步都用这道题自己的数算出来 */
const withSteps = (b: Built, steps: string[]): Built => ({ ...b, steps });

function Q(prompt: string, stem: string | undefined, ans: string | number, wrongs: (string | number)[], explanation?: string): Built {
  const a = String(ans);
  return {
    // 朗读题目和下面的算式（算式读成中文）
    prompt: { text: prompt, speak: say(sayMath(stem ? `${prompt.replace(/[？?]$/, '')}：${stem}` : prompt)) } as Prompt,
    stem: stem ? { text: stem } : undefined,
    options: opts(a, wrongs),
    answerId: a,
    explanation,
    wrongHint: { text: '再想一想', speak: say('再想一想') },
  };
}
/** 概念题：[题目, 正确答案, 干扰项…, 讲解] */
type Concept = [string, string, string[], string];
function pool(items: Concept[]): UpperGen {
  return {
    make: (rand) => sig('c', pickI(rand, items.length)),
    build: (s) => {
      const [q, ans, wrongs, ex] = items[nums(s)[0]];
      return Q(q, undefined, ans, wrongs, ex);
    },
  };
}
/** 几种题型合成一个生成器：签名第一段是题型名 */
function mix(kinds: Record<string, { make: (rand: Rand) => string; build: (s: string) => Built }>): UpperGen {
  const names = Object.keys(kinds);
  return {
    make: (rand) => kinds[names[pickI(rand, names.length)]].make(rand),
    build: (s) => {
      const k = kinds[s.split(':')[0]];
      if (!k) throw new Error(`没有这种题型：${s}`);
      return k.build(s);
    },
  };
}
const CALC = '算一算';
const SUP_DIGIT = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** 上标数字：sup(12) = "¹²" */
export const sup = (n: number) => [...String(n)].map((c) => SUP_DIGIT[Number(c)]).join('');

/* ═══════════════ 七年级上册 ═══════════════ */

const m7a1 = mix({
  opp: {
    make: (rand) => sig('opp', nz(rand, -20, 20)),
    build: (s) => {
      const [n] = nums(s);
      return Q(`${lead(n)} 的相反数是多少？`, undefined, -n, [n, frac(1, n), frac(-1, n)], '只有符号不同的两个数互为相反数。');
    },
  },
  abs: {
    make: (rand) => sig('abs', nz(rand, -30, 30)),
    build: (s) => {
      const [n] = nums(s);
      return Q(`|${lead(n)}| 等于多少？`, undefined, Math.abs(n), [-Math.abs(n)], '绝对值是数轴上的点到原点的距离，不会是负数。');
    },
  },
  cmp: {
    make: (rand) => {
      const a = r(rand, -20, -1);
      let b = r(rand, -20, -1);
      if (b === a) b = a - 3;
      return sig('cmp', a, b);
    },
    build: (s) => {
      const [a, b] = nums(s);
      const big = Math.max(a, b);
      return Q(`${lead(a)} 和 ${lead(b)}，哪个数大？`, undefined, big, [Math.min(a, b)], '两个负数比较大小，绝对值大的反而小。');
    },
  },
  dist: {
    make: (rand) => sig('dist', r(rand, -12, -1), r(rand, 1, 12)),
    build: (s) => {
      const [a, b] = nums(s);
      return Q(`数轴上表示 ${lead(a)} 和 ${lead(b)} 的两点之间的距离是多少？`, undefined, b - a, [b + a, Math.abs(b + a), a - b], '距离 = 右边的数 − 左边的数。');
    },
  },
});

const m7a2 = mix({
  add: {
    make: (rand) => sig('add', nz(rand, -30, 30), nz(rand, -30, 30)),
    build: (s) => {
      const [a, b] = nums(s);
      return Q(CALC, `${lead(a)} + ${par(b)} = ?`, a + b, [a - b, -(a + b), Math.abs(a) + Math.abs(b)], '同号相加，取相同的符号，绝对值相加；异号相加，取绝对值大的符号，用大的绝对值减小的。');
    },
  },
  sub: {
    make: (rand) => sig('sub', nz(rand, -30, 30), nz(rand, -30, 30)),
    build: (s) => {
      const [a, b] = nums(s);
      return Q(CALC, `${lead(a)} ${M} ${par(b)} = ?`, a - b, [a + b, b - a, -(a + b)], '减去一个数，等于加上这个数的相反数。');
    },
  },
  mul: {
    make: (rand) => sig('mul', nz(rand, -12, 12), nz(rand, -12, 12)),
    build: (s) => {
      const [a, b] = nums(s);
      return Q(CALC, `${lead(a)} × ${par(b)} = ?`, a * b, [-a * b, a + b], '两数相乘，同号得正，异号得负，再把绝对值相乘。');
    },
  },
  div: {
    make: (rand) => {
      const b = nz(rand, -9, 9);
      return sig('div', b * nz(rand, -9, 9), b);
    },
    build: (s) => {
      const [a, b] = nums(s);
      return Q(CALC, `${lead(a)} ÷ ${par(b)} = ?`, a / b, [-a / b, a * b], '两数相除，同号得正，异号得负，再把绝对值相除。');
    },
  },
  pow: {
    make: (rand) => sig('pow', r(rand, -5, -2), r(rand, 2, 4), r(rand, 0, 1)),
    build: (s) => {
      const [a, n, noParen] = nums(s);
      const sup = ['', '', '²', '³', '⁴'][n];
      // noParen：−a 的 n 次方（不带括号，只有 a 乘方）
      const v = noParen ? -((-a) ** n) : a ** n;
      const stem = noParen ? `${M}${-a}${sup} = ?` : `(${M}${-a})${sup} = ?`;
      return Q(CALC, stem, v, [-v, a * n, -a * n], noParen ? `${M}${-a}${sup} 表示 ${-a}${sup} 的相反数，先算乘方再加负号。` : '负数的偶次方是正数，奇次方是负数。');
    },
  },
});

const m7a3 = mix({
  lin: {
    make: (rand) => sig('lin', nz(rand, -6, 6), nz(rand, -10, 10), nz(rand, -5, 5)),
    build: (s) => {
      const [a, b, x] = nums(s);
      return Q(`当 x = ${lead(x)} 时，代数式 ${lin(a, 'x', b)} 的值是多少？`, undefined, a * x + b, [a * x - b, -a * x + b, a + x + b], '把 x 的值代入代数式，负数代入时要加括号。');
    },
  },
  sq: {
    make: (rand) => sig('sq', nz(rand, -3, 3), nz(rand, -4, 4), r(rand, -5, 5)),
    build: (s) => {
      const [a, x, c] = nums(s);
      return Q(`当 x = ${lead(x)} 时，代数式 ${quad(a, 0, c)} 的值是多少？`, undefined, a * x * x + c, [a * -x * x + c, a * 2 * x + c, -(a * x * x) + c], '先算 x²：负数的平方是正数，再乘系数。');
    },
  },
  word: {
    make: (rand) => sig('word', r(rand, 3, 9), r(rand, 2, 6), r(rand, 2, 5)),
    build: (s) => {
      const [p, n, k] = nums(s);
      return Q(`一支笔 ${p} 元，买 n 支笔要付 ${p}n 元。当 n = ${n + k} 时，要付多少元？`, undefined, p * (n + k), [p + n + k, p * (n + k) + p], '用数代替字母 n，再计算。');
    },
  },
});

const m7a4 = mix({
  comb: {
    make: (rand) => sig('comb', nz(rand, -9, 9), nz(rand, -9, 9), nz(rand, -9, 9)),
    build: (s) => {
      const [a, b, c] = nums(s);
      const stem = `${lin(a, 'x', 0)} ${b < 0 ? M : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x ${c < 0 ? M : '+'} ${Math.abs(c) === 1 ? '' : Math.abs(c)}x`;
      const k = a + b + c;
      const show = (n: number) => (n === 0 ? '0' : lin(n, 'x', 0).replace(M, '-'));
      return Q('合并同类项，结果是多少？', stem, show(k), [show(a + b - c), show(a - b + c), show(-k), show(Math.abs(a) + Math.abs(b) + Math.abs(c))], '合并同类项：系数相加，字母和指数不变。');
    },
  },
  expand: {
    make: (rand) => sig('expand', r(rand, 2, 6), nz(rand, -6, 6), r(rand, 2, 6), nz(rand, -6, 6)),
    build: (s) => {
      const [a, b, c, d] = nums(s);
      // a(x + b) − c(x + d)
      const stem = `${a}(${lin(1, 'x', b)}) ${M} ${c}(${lin(1, 'x', d)})`;
      const k = a * b - c * d;
      return Q('化简后，常数项是多少？', stem, k, [a * b + c * d, a * b - d, b - c * d], '去括号时，括号前是减号，括号里的各项都要变号；括号前的数要乘括号里的每一项。');
    },
  },
  deg: {
    make: (rand) => sig('deg', nz(rand, -9, 9), r(rand, 1, 4), r(rand, 1, 4)),
    build: (s) => {
      const [c, m, n] = nums(s);
      const sup = (k: number) => (k === 1 ? '' : ['', '', '²', '³', '⁴'][k]);
      const mono = `${c === 1 ? '' : c === -1 ? M : lead(c)}x${sup(m)}y${sup(n)}`;
      return Q(`单项式 ${mono} 的次数是多少？`, undefined, m + n, [m * n, Math.max(m, n), Math.abs(c)], '单项式的次数是所有字母的指数的和。');
    },
  },
});

const m7a5 = mix({
  one: {
    make: (rand) => {
      const a = nz(rand, -9, 9);
      const x = nz(rand, -9, 9);
      const b = nz(rand, -15, 15);
      return sig('one', a, b, a * x + b);
    },
    build: (s) => {
      const [a, b, c] = nums(s);
      const x = (c - b) / a;
      return Q('解方程，x 等于多少？', `${lin(a, 'x', b)} = ${lead(c)}`, x, [(c + b) / a, -x, c - b], '移项要变号，再把系数化为 1。');
    },
  },
  two: {
    make: (rand) => {
      const a = r(rand, 2, 9);
      const c = r(rand, 1, a - 1);
      const x = nz(rand, -8, 8);
      const b = nz(rand, -12, 12);
      return sig('two', a, b, c, (a - c) * x + b);
    },
    build: (s) => {
      // ax + b = cx + d
      const [a, b, c, d] = nums(s);
      const x = (d - b) / (a - c);
      const w1 = (d - b) / (a + c);
      return Q('解方程，x 等于多少？', `${lin(a, 'x', b)} = ${lin(c, 'x', d)}`, x, [Number.isInteger(w1) ? w1 : -x, (d + b) / (a - c), -x], '把含 x 的项移到左边，常数项移到右边，移项要变号。');
    },
  },
  word: {
    make: (rand) => sig('word', r(rand, 2, 5), r(rand, 3, 20), r(rand, 2, 12)),
    build: (s) => {
      const [k, x, b] = nums(s);
      return withSteps(
        Q(`一个数的 ${k} 倍再加 ${b} 等于 ${k * x + b}，这个数是多少？`, undefined, x, [(k * x + b + b) / k, k * x, x + b], `设这个数为 x，列方程 ${k}x + ${b} = ${k * x + b}。`),
        [`设这个数为 x，“${k} 倍再加 ${b}”就是 ${k}x + ${b}。`, `列方程：${k}x + ${b} = ${k * x + b}。`, `移项：${k}x = ${k * x + b} − ${b} = ${k * x}。`, `系数化为 1：x = ${k * x} ÷ ${k} = ${x}。`],
      );
    },
  },
});

const m7a6 = mix({
  comp: {
    make: (rand) => sig('comp', r(rand, 10, 85), r(rand, 0, 1)),
    build: (s) => {
      const [a, sup] = nums(s);
      return sup
        ? Q(`一个角是 ${a}°，它的补角是多少度？`, undefined, 180 - a, [90 - a, 360 - a, a], '和为 180° 的两个角互为补角。')
        : Q(`一个角是 ${a}°，它的余角是多少度？`, undefined, 90 - a, [180 - a, a, 90 + a], '和为 90° 的两个角互为余角。');
    },
  },
  mid: {
    make: (rand) => sig('mid', r(rand, 2, 20) * 2, r(rand, 0, 1)),
    build: (s) => {
      const [ab, ask] = nums(s);
      return ask
        ? Q(`点 C 是线段 AB 的中点，AC = ${ab / 2} cm，AB 长多少厘米？`, undefined, ab, [ab / 2, ab / 4, ab + 2], '中点把线段分成相等的两段，AB = 2AC。')
        : Q(`点 C 是线段 AB 的中点，AB = ${ab} cm，AC 长多少厘米？`, undefined, ab / 2, [ab, ab * 2, ab / 2 + 1], '中点把线段分成相等的两段，AC = AB ÷ 2。');
    },
  },
  deg: {
    make: (rand) => sig('deg', r(rand, 1, 3)),
    build: (s) => {
      const [k] = nums(s);
      // k/4 度 = 15k 分
      return Q(`${frac(k, 4)} 度等于多少分？`, undefined, 15 * k, [25 * k, 10 * k, 60 * k], '1° = 60′，所以 1/4° = 15′。');
    },
  },
});

/* ═══════════════ 七年级下册 ═══════════════ */

const m7b1 = mix({
  vert: {
    make: (rand) => sig('vert', r(rand, 20, 160), r(rand, 0, 1)),
    build: (s) => {
      const [a, adj] = nums(s);
      return adj
        ? Q(`两条直线相交，其中一个角是 ${a}°，它的邻补角是多少度？`, undefined, 180 - a, [a, 90 - a, 360 - a], '邻补角相加等于 180°。')
        : Q(`两条直线相交，其中一个角是 ${a}°，它的对顶角是多少度？`, undefined, a, [180 - a, 90, 360 - a], '对顶角相等。');
    },
  },
  par: {
    make: (rand) => sig('par', r(rand, 30, 150), r(rand, 0, 2)),
    build: (s) => {
      const [a, k] = nums(s);
      const name = ['同位角', '内错角', '同旁内角'][k];
      const ans = k === 2 ? 180 - a : a;
      const ex = k === 2 ? '两直线平行，同旁内角互补。' : `两直线平行，${name}相等。`;
      return Q(`两条平行线被第三条直线所截，一个角是 ${a}°，它的${name}是多少度？`, undefined, ans, [k === 2 ? a : 180 - a, 90, 360 - a], ex);
    },
  },
});

const m7b2 = mix({
  sqrt: {
    make: (rand) => sig('sqrt', r(rand, 2, 20)),
    build: (s) => {
      const [n] = nums(s);
      return Q(CALC, `√${n * n} = ?`, n, [-n, n * 2, Math.round((n * n) / 2)], '算术平方根是正的那一个：因为 n × n = 被开方数。');
    },
  },
  root: {
    make: (rand) => sig('root', r(rand, 2, 15)),
    build: (s) => {
      const [n] = nums(s);
      return Q(`${n * n} 的平方根是多少？`, undefined, `±${n}`, [String(n), String(-n), String(n * 2)], '正数有两个平方根，它们互为相反数。');
    },
  },
  cube: {
    make: (rand) => sig('cube', nz(rand, -6, 6)),
    build: (s) => {
      const [n] = nums(s);
      const c = n ** 3;
      return Q(CALC, `³√${lead(c)} = ?`, n, [-n, n * 3, `±${Math.abs(n)}`], '立方根只有一个；负数的立方根是负数。');
    },
  },
  est: {
    make: (rand) => {
      const k = r(rand, 2, 12);
      return sig('est', k * k + r(rand, 1, 2 * k));
    },
    build: (s) => {
      const [n] = nums(s);
      const k = Math.floor(Math.sqrt(n));
      const lab = (a: number) => `${a} 和 ${a + 1} 之间`;
      return Q(`√${n} 在哪两个连续整数之间？`, undefined, lab(k), [lab(k - 1), lab(k + 1), lab(k + 2)], `${k}² = ${k * k}，${k + 1}² = ${(k + 1) ** 2}，${n} 在它们之间。`);
    },
  },
});

const QUAD_NAME = ['第一象限', '第二象限', '第三象限', '第四象限'];
const m7b3 = mix({
  quad: {
    make: (rand) => sig('quad', nz(rand, -9, 9), nz(rand, -9, 9)),
    build: (s) => {
      const [x, y] = nums(s);
      const q = x > 0 ? (y > 0 ? 0 : 3) : y > 0 ? 1 : 2;
      return Q(`点 ${pt(x, y)} 在第几象限？`, undefined, QUAD_NAME[q], QUAD_NAME.filter((_, i) => i !== q), '横坐标看左右，纵坐标看上下：(+,+) 一、(−,+) 二、(−,−) 三、(+,−) 四。');
    },
  },
  move: {
    make: (rand) => sig('move', r(rand, -6, 6), r(rand, -6, 6), nz(rand, -5, 5), nz(rand, -5, 5)),
    build: (s) => {
      const [x, y, dx, dy] = nums(s);
      const dir = `${dx > 0 ? '向右' : '向左'}平移 ${Math.abs(dx)} 个单位，再${dy > 0 ? '向上' : '向下'}平移 ${Math.abs(dy)} 个单位`;
      return Q(`点 ${pt(x, y)} ${dir}，得到的点是？`, undefined, pt(x + dx, y + dy), [pt(x + dy, y + dx), pt(x - dx, y - dy), pt(x + dx, y - dy)], '左右平移改横坐标（右加左减），上下平移改纵坐标（上加下减）。');
    },
  },
  axis: {
    make: (rand) => sig('axis', nz(rand, -9, 9), nz(rand, -9, 9), r(rand, 0, 1)),
    build: (s) => {
      const [x, y, toY] = nums(s);
      return toY
        ? Q(`点 ${pt(x, y)} 到 y 轴的距离是多少？`, undefined, Math.abs(x), [Math.abs(y), x === Math.abs(x) ? -x : x], '点到 y 轴的距离是横坐标的绝对值。')
        : Q(`点 ${pt(x, y)} 到 x 轴的距离是多少？`, undefined, Math.abs(y), [Math.abs(x), y === Math.abs(y) ? -y : y], '点到 x 轴的距离是纵坐标的绝对值。');
    },
  },
});

const m7b4 = mix({
  sd: {
    make: (rand) => {
      const x = r(rand, -6, 12);
      const y = r(rand, -6, 12);
      return sig('sd', x + y, x - y, r(rand, 0, 1));
    },
    build: (s) => {
      const [sm, df, askY] = nums(s);
      const x = (sm + df) / 2;
      const y = (sm - df) / 2;
      const stem = `{ x + y = ${lead(sm)}，x ${M} y = ${lead(df)} }`;
      const steps = [
        `两个方程相加，消去 y：2x = ${lead(sm)} + ${df < 0 ? `(${lead(df)})` : df} = ${lead(sm + df)}，所以 x = ${lead(x)}。`,
        `把 x = ${lead(x)} 代入 x + y = ${lead(sm)}：y = ${lead(sm)} ${M} ${x < 0 ? `(${lead(x)})` : x} = ${lead(y)}。`,
        `检查：x ${M} y = ${lead(x)} ${M} ${y < 0 ? `(${lead(y)})` : y} = ${lead(df)}，对了。`,
      ];
      return withSteps(
        askY
          ? Q('解方程组，y 等于多少？', stem, y, [x, -y, sm - y], '两个方程相减，消去 x：2y = 两式右边相减。')
          : Q('解方程组，x 等于多少？', stem, x, [y, -x, sm + df], '两个方程相加，消去 y：2x = 两式右边相加。'),
        steps,
      );
    },
  },
  gen: {
    make: (rand) => {
      const a = r(rand, 1, 4);
      const b = r(rand, 1, 4);
      const c = r(rand, 1, 4);
      const d = r(rand, -3, -1); // d < 0：系数行列式 ad − bc 不为 0，解唯一
      return sig('gen', a, b, c, d, r(rand, -5, 5), r(rand, -5, 5));
    },
    build: (s) => {
      // { ax + by = e，cx + dy = f }，d < 0 保证有唯一解
      const [a, b, c, d, x, y] = nums(s);
      const e = a * x + b * y;
      const f = c * x + d * y;
      const term = (k: number, v: string, first: boolean) =>
        first ? lin(k, v, 0) : `${k < 0 ? M : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}${v}`;
      const stem = `{ ${term(a, 'x', true)} ${term(b, 'y', false)} = ${lead(e)}，${term(c, 'x', true)} ${term(d, 'y', false)} = ${lead(f)} }`;
      return Q('解方程组，x 等于多少？', stem, x, [y, -x, x + 1], '用代入消元法或加减消元法消去一个未知数。');
    },
  },
});

const m7b5 = mix({
  solve: {
    make: (rand) => {
      const a = nz(rand, -6, 6);
      const k = nz(rand, -8, 8);
      const b = nz(rand, -12, 12);
      return sig('solve', a, b, a * k + b);
    },
    build: (s) => {
      // ax + b > c
      const [a, b, c] = nums(s);
      const k = (c - b) / a;
      const gt = a > 0;
      const ans = `x ${gt ? '>' : '<'} ${lead(k)}`;
      return Q('解不等式，结果是？', `${lin(a, 'x', b)} > ${lead(c)}`, ans, [`x ${gt ? '<' : '>'} ${lead(k)}`, `x ${gt ? '>' : '<'} ${lead(-k)}`, `x ${gt ? '<' : '>'} ${lead(-k)}`], a < 0 ? '两边同时除以负数，不等号方向要改变。' : '移项要变号，两边同时除以正数，不等号方向不变。');
    },
  },
  min: {
    make: (rand) => {
      const a = r(rand, 2, 6);
      return sig('min', a, nz(rand, -10, 10), r(rand, -20, 20));
    },
    build: (s) => {
      // ax + b ≥ c 的最小整数解
      const [a, b, c] = nums(s);
      const ans = Math.ceil((c - b) / a);
      return Q(`不等式 ${lin(a, 'x', b)} ≥ ${lead(c)} 的最小整数解是多少？`, undefined, ans, [ans - 1, ans + 1, Math.floor((c + b) / a)], '先解出 x 的范围，再找范围里最小的整数。');
    },
  },
});

const m7b6 = mix({
  angle: {
    make: (rand) => sig('angle', r(rand, 1, 18) * 5),
    build: (s) => {
      const [p] = nums(s);
      return Q(`扇形统计图中，某部分占总体的 ${p}%，它对应的圆心角是多少度？`, undefined, p * 3.6, [p, p * 3.6 + 10, 360 - p * 3.6].map((x) => Number(x.toFixed(1))), '圆心角 = 360° × 百分比。');
    },
  },
  total: {
    make: (rand) => sig('total', r(rand, 2, 9) * 10, [10, 20, 25, 40, 50][pickI(rand, 5)]),
    build: (s) => {
      const [n, p] = nums(s);
      const total = (n * 100) / p;
      return Q(`调查中有 ${n} 人选“跑步”，占调查人数的 ${p}%，一共调查了多少人？`, undefined, total, [n * p, n + p, total / 2], '总数 = 部分数 ÷ 所占百分比。');
    },
  },
});

/* ═══════════════ 八年级上册 ═══════════════ */

const m8a1 = mix({
  third: {
    make: (rand) => {
      const a = r(rand, 20, 100);
      return sig('third', a, r(rand, 10, 160 - a));
    },
    build: (s) => {
      const [a, b] = nums(s);
      return Q(`三角形的两个内角分别是 ${a}° 和 ${b}°，第三个内角是多少度？`, undefined, 180 - a - b, [360 - a - b, a + b, 90 - a - b + 90 + 10], '三角形的内角和是 180°。');
    },
  },
  ext: {
    make: (rand) => {
      const a = r(rand, 20, 80);
      return sig('ext', a, r(rand, 20, 150 - a));
    },
    build: (s) => {
      const [a, b] = nums(s);
      return Q(`三角形的一个外角与它不相邻的两个内角分别是 ${a}° 和 ${b}°，这个外角是多少度？`, undefined, a + b, [180 - a - b, 180 - a, 180 - b], '三角形的一个外角等于与它不相邻的两个内角的和。');
    },
  },
  side: {
    make: (rand) => {
      const a = r(rand, 3, 10);
      return sig('side', a, r(rand, a + 1, a + 8));
    },
    build: (s) => {
      const [a, b] = nums(s);
      const ok = b - a + 1 + ((a * b) % (2 * a - 1));
      return Q(`三角形两边长 ${a} 和 ${b}，第三边可以是多少？`, undefined, ok, [b - a, a + b, a + b + 2], `第三边要大于两边之差 ${b - a}，小于两边之和 ${a + b}。`);
    },
  },
});

const m8a2 = mix({
  corr: {
    make: (rand) => {
      const p = r(rand, 3, 12);
      const q = r(rand, 3, 12);
      // 第三边在两边之差和两边之和之间，三条边能组成三角形
      return sig('corr', p, q, r(rand, Math.abs(p - q) + 1, p + q - 1), r(rand, 0, 2));
    },
    build: (s) => {
      const [p, q, t, k] = nums(s);
      const sides = [p, q, t];
      const ask = ['DE', 'EF', 'DF'][k];
      const given = `AB = ${p}，BC = ${q}，AC = ${t}`;
      return Q(`△ABC ≌ △DEF，${given}，${ask} 的长是多少？`, undefined, sides[k], sides.filter((_, i) => i !== k).concat([p + q]), '全等三角形对应边相等：顶点按顺序对应，A↔D，B↔E，C↔F。');
    },
  },
  rule: {
    make: (rand) => sig('rule', pickI(rand, CONGRUENT.length)),
    build: (s) => {
      const [q, ans, wrongs, ex] = CONGRUENT[nums(s)[0]];
      return Q(q, undefined, ans, wrongs, ex);
    },
  },
});
const CONGRUENT: Concept[] = [
  ['两边和它们的夹角分别相等的两个三角形全等，简称？', 'SAS', ['SSA', 'ASA', 'SSS'], '“边角边”：两边及其夹角。'],
  ['三边分别相等的两个三角形全等，简称？', 'SSS', ['SAS', 'AAA', 'HL'], '“边边边”。'],
  ['两角和它们的夹边分别相等的两个三角形全等，简称？', 'ASA', ['AAS', 'SAS', 'SSA'], '“角边角”：两角及其夹边。'],
  ['下面哪组条件不能判定两个三角形全等？', 'SSA（两边及其中一边的对角）', ['SAS', 'ASA', 'AAS'], '两边及其中一边的对角相等，三角形不一定全等。'],
  ['斜边和一条直角边分别相等的两个直角三角形全等，简称？', 'HL', ['SSS', 'AAS', 'SSA'], 'HL 只用于直角三角形。'],
  ['角平分线上的点到角两边的距离？', '相等', ['不相等', '和为 90', '无法确定'], '角平分线的性质。'],
  ['三个角分别相等的两个三角形一定全等吗？', '不一定', ['一定全等', '一定不全等', '只有直角三角形全等'], '三个角相等只能说明形状相同，大小可能不同。'],
];

const m8a3 = mix({
  sym: {
    make: (rand) => sig('sym', nz(rand, -9, 9), nz(rand, -9, 9), r(rand, 0, 1)),
    build: (s) => {
      const [x, y, aboutY] = nums(s);
      return aboutY
        ? Q(`点 ${pt(x, y)} 关于 y 轴对称的点是？`, undefined, pt(-x, y), [pt(x, -y), pt(-x, -y), pt(y, x)], '关于 y 轴对称：横坐标互为相反数，纵坐标不变。')
        : Q(`点 ${pt(x, y)} 关于 x 轴对称的点是？`, undefined, pt(x, -y), [pt(-x, y), pt(-x, -y), pt(y, x)], '关于 x 轴对称：横坐标不变，纵坐标互为相反数。');
    },
  },
  iso: {
    make: (rand) => sig('iso', r(rand, 5, 85) * 2, r(rand, 0, 1)),
    build: (s) => {
      const [top, askTop] = nums(s);
      const base = (180 - top) / 2;
      return askTop
        ? Q(`等腰三角形的一个底角是 ${base}°，顶角是多少度？`, undefined, top, [base, 180 - base, 90 - base], '等腰三角形两个底角相等：顶角 = 180° − 2 × 底角。')
        : Q(`等腰三角形的顶角是 ${top}°，每个底角是多少度？`, undefined, base, [180 - top, top, 90 - top / 4], '等腰三角形两个底角相等：底角 = (180° − 顶角) ÷ 2。');
    },
  },
  peri: {
    make: (rand) => {
      const a = r(rand, 2, 6);
      return sig('peri', a, r(rand, 2 * a + 1, 2 * a + 6));
    },
    build: (s) => {
      // 两边 a、b（b > 2a），只能 b 当腰
      const [a, b] = nums(s);
      return Q(`等腰三角形的两条边长分别是 ${a} 和 ${b}，它的周长是多少？`, undefined, a + 2 * b, [2 * a + b, a + b, `${2 * a + b} 或 ${a + 2 * b}`], `${a} 当腰时 ${a} + ${a} < ${b}，构不成三角形，所以腰只能是 ${b}。`);
    },
  },
});

const m8a4 = mix({
  exp: {
    make: (rand) => sig('exp', r(rand, 2, 9), r(rand, 2, 9), r(rand, 0, 2)),
    build: (s) => {
      const [m, n, k] = nums(s);
      if (k === 0) return Q(`a${sup(m)} · a${sup(n)} = a 的几次方？`, undefined, m + n, [m * n, Math.abs(m - n)], '同底数幂相乘，底数不变，指数相加。');
      if (k === 1) return Q(`(a${sup(m)})${sup(n)} = a 的几次方？`, undefined, m * n, [m + n, m ** n], '幂的乘方，底数不变，指数相乘。');
      const big = Math.max(m, n) + 3;
      return Q(`a${sup(big)} ÷ a${sup(m)} = a 的几次方？（a ≠ 0）`, undefined, big - m, [big + m, big / m === Math.floor(big / m) ? big / m : big * m], '同底数幂相除，底数不变，指数相减。');
    },
  },
  fo: {
    make: (rand) => sig('fo', nz(rand, -8, 8), nz(rand, -8, 8), r(rand, 0, 1)),
    build: (s) => {
      const [a, b, askConst] = nums(s);
      const stem = `(${lin(1, 'x', a)})(${lin(1, 'x', b)})`;
      return askConst
        ? Q('展开后，常数项是多少？', stem, a * b, [a + b, -a * b], '(x + a)(x + b) = x² + (a + b)x + ab。')
        : Q('展开后，x 的系数是多少？', stem, a + b, [a * b, a - b], '(x + a)(x + b) = x² + (a + b)x + ab。');
    },
  },
  sq: {
    make: (rand) => sig('sq', r(rand, 1, 9) * 10 + 100 * r(rand, 0, 1), r(rand, 1, 4)),
    build: (s) => {
      // (a + b)(a − b) = a² − b²
      const [a, b] = nums(s);
      return Q('用平方差公式计算', `${a + b} × ${a - b} = ?`, a * a - b * b, [a * a + b * b, a * a - b, a * a - 2 * b], `${a + b} × ${a - b} = (${a} + ${b})(${a} − ${b}) = ${a}² − ${b}²。`);
    },
  },
});

const m8a5 = mix({
  tri: {
    make: (rand) => {
      let a = nz(rand, -7, 7);
      let b = nz(rand, -7, 7);
      if (a === b) b = a + 1 === 0 ? a + 2 : a + 1;
      if (a === -b) a += a > 0 ? 1 : -1;
      return sig('tri', a, b);
    },
    build: (s) => {
      const [a, b] = nums(s);
      const f = (p: number, q: number) => `(${lin(1, 'x', p)})(${lin(1, 'x', q)})`;
      return Q('因式分解，结果是？', quad(1, a + b, a * b), f(a, b), [f(-a, -b), f(a, -b), f(-a, b)], `找两个数，积是 ${lead(a * b)}，和是 ${lead(a + b)}。`);
    },
  },
  diff: {
    make: (rand) => sig('diff', r(rand, 1, 12), r(rand, 1, 3)),
    build: (s) => {
      const [k, c] = nums(s);
      const cc = c === 1 ? '' : String(c);
      const sq = c * c === 1 ? '' : String(c * c);
      return Q('因式分解，结果是？', `${sq}x² ${M} ${k * k}`, `(${cc}x + ${k})(${cc}x ${M} ${k})`, [`(${cc}x ${M} ${k})²`, `(${cc}x + ${k})²`, `(x + ${k * k})(x ${M} 1)`], '平方差公式：a² − b² = (a + b)(a − b)。');
    },
  },
  common: {
    make: (rand) => sig('common', r(rand, 2, 6), nz(rand, -9, 9)),
    build: (s) => {
      const [k, b] = nums(s);
      const g = gcd(k, b);
      const ans = `${g === 1 ? '' : g}x(${lin(k / g, 'x', b / g)})`;
      return Q('提公因式，结果是？', `${quad(k, b, 0)}`, ans, [`x(${lin(k, 'x', b)})`, `${g === 1 ? '' : g}x(${lin(k / g, 'x', -b / g)})`, `${k}x²(1 + ${b}x)`], '找出每一项都有的因式，提到括号外面。');
    },
  },
});

const m8a6 = mix({
  undef: {
    make: (rand) => sig('undef', nz(rand, -9, 9), r(rand, 1, 9)),
    build: (s) => {
      const [a, n] = nums(s);
      return Q(`当 x 等于多少时，分式 ${n}/(${lin(1, 'x', -a)}) 没有意义？`, undefined, a, [-a, n, 0], '分母等于 0 时，分式没有意义。');
    },
  },
  eq: {
    make: (rand) => {
      const x = nz(rand, -9, 9);
      const b = r(rand, 1, 6);
      return sig('eq', b * x, b);
    },
    build: (s) => {
      // a / x = b
      const [a, b] = nums(s);
      return Q('解分式方程，x 等于多少？', `${lead(a)}/x = ${b}`, a / b, [a * b, b / a === Math.floor(b / a) ? b / a : -a / b, -a / b], `两边同乘 x：${lead(a)} = ${b}x，检验 x ≠ 0。`);
    },
  },
  val: {
    make: (rand) => sig('val', r(rand, 1, 6), r(rand, 1, 9)),
    build: (s) => {
      // (x² − 1)/(x − 1) 在 x = n 时（n ≠ 1）= n + 1
      const [n0] = nums(s);
      const n = n0 + 1;
      return Q(`当 x = ${n} 时，分式 (x² ${M} 1)/(x ${M} 1) 的值是多少？`, undefined, n + 1, [n - 1, n * n - 1, n], '先约分：(x² − 1)/(x − 1) = x + 1。');
    },
  },
});

/* ═══════════════ 八年级下册 ═══════════════ */

/** √n 化简：返回 [系数, 根号里的数] */
export function simplifySqrt(n: number): [number, number] {
  let out = 1;
  let inside = n;
  for (let k = Math.floor(Math.sqrt(n)); k >= 2; k--) {
    if (inside % (k * k) === 0) {
      out *= k;
      inside /= k * k;
    }
  }
  return [out, inside];
}
const rootText = (c: number, n: number) => (n === 1 ? String(c) : `${c === 1 ? '' : c}√${n}`);

const m8b1 = mix({
  simp: {
    make: (rand) => sig('simp', r(rand, 2, 6), [2, 3, 5, 6, 7][pickI(rand, 5)]),
    build: (s) => {
      const [k, b] = nums(s);
      const n = k * k * b;
      return Q('化简', `√${n} = ?`, rootText(k, b), [rootText(k * k, b), rootText(k + 1, b), rootText(b, k)], `${n} = ${k * k} × ${b}，√${k * k} = ${k}。`);
    },
  },
  mul: {
    make: (rand) => {
      const b = [2, 3, 5, 6][pickI(rand, 4)];
      return sig('mul', b, b * r(rand, 1, 6) ** 2);
    },
    build: (s) => {
      const [a, b] = nums(s);
      const v = Math.sqrt(a * b);
      return Q(CALC, `√${a} × √${b} = ?`, v, [a * b, a + b, v + 1], `√a × √b = √(ab) = √${a * b}。`);
    },
  },
  add: {
    make: (rand) => sig('add', [2, 3, 5][pickI(rand, 3)], r(rand, 1, 4), r(rand, 1, 4)),
    build: (s) => {
      // √(p²b) + √(q²b) = (p + q)√b
      const [b, p, q] = nums(s);
      return Q(CALC, `√${p * p * b} + √${q * q * b} = ?`, rootText(p + q, b), [rootText(1, p * p * b + q * q * b), rootText(p * q, b), rootText(p + q, 2 * b)], '先化成最简二次根式，被开方数相同的再合并。');
    },
  },
});

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [6, 8, 10],
  [9, 12, 15],
  [20, 21, 29],
];
const m8b2 = mix({
  hyp: {
    make: (rand) => sig('hyp', pickI(rand, TRIPLES.length), r(rand, 1, 3)),
    build: (s) => {
      const [i, k] = nums(s);
      const [a, b, c] = TRIPLES[i].map((x) => x * k);
      return Q(`直角三角形两条直角边长 ${a} 和 ${b}，斜边长多少？`, undefined, c, [a + b, Math.abs(b - a), c + 1], 'a² + b² = c²。');
    },
  },
  leg: {
    make: (rand) => sig('leg', pickI(rand, TRIPLES.length), r(rand, 1, 2)),
    build: (s) => {
      const [i, k] = nums(s);
      const [a, b, c] = TRIPLES[i].map((x) => x * k);
      return Q(`直角三角形的斜边长 ${c}，一条直角边长 ${a}，另一条直角边长多少？`, undefined, b, [c - a, c + a, b + 1], 'b² = c² − a²，斜边最长，不能把斜边当成直角边。');
    },
  },
  rev: {
    make: (rand) => sig('rev', pickI(rand, TRIPLES.length), r(rand, 0, 2)),
    build: (s) => {
      const [i, wrong] = nums(s);
      const [a, b, c] = TRIPLES[i];
      const bad = [`${a}, ${b}, ${c + 1}`, `${a + 1}, ${b}, ${c}`, `${a}, ${b + 1}, ${c + 1}`];
      return Q('下面哪组数作三角形的三边，能组成直角三角形？', undefined, `${a}, ${b}, ${c}`, bad.slice(wrong).concat(bad.slice(0, wrong)), '勾股定理的逆定理：两条短边的平方和等于最长边的平方。');
    },
  },
});

const m8b3 = mix({
  sum: {
    make: (rand) => sig('sum', r(rand, 4, 12)),
    build: (s) => {
      const [n] = nums(s);
      return Q(`${n} 边形的内角和是多少度？`, undefined, (n - 2) * 180, [n * 180, (n - 1) * 180, 360], 'n 边形内角和 = (n − 2) × 180°。');
    },
  },
  reg: {
    make: (rand) => sig('reg', [3, 4, 5, 6, 8, 9, 10, 12][pickI(rand, 8)]),
    build: (s) => {
      const [n] = nums(s);
      return Q(`正 ${n} 边形的每个外角是多少度？`, undefined, 360 / n, [180 - 360 / n, (n - 2) * 180, 180 / n], '多边形的外角和是 360°，正多边形每个外角相等。');
    },
  },
  para: {
    make: (rand) => sig('para', r(rand, 30, 150)),
    build: (s) => {
      const [a] = nums(s);
      return Q(`平行四边形的一个内角是 ${a}°，和它相邻的内角是多少度？`, undefined, 180 - a, [a, 360 - a, 90 - a / 2], '平行四边形邻角互补，对角相等。');
    },
  },
  rhom: {
    make: (rand) => sig('rhom', r(rand, 2, 12) * 2, r(rand, 2, 12) * 2),
    build: (s) => {
      const [p, q] = nums(s);
      return Q(`菱形的两条对角线长 ${p} 和 ${q}，面积是多少？`, undefined, (p * q) / 2, [p * q, p + q, (p * q) / 4], '菱形面积 = 两条对角线乘积的一半。');
    },
  },
});

const m8b4 = mix({
  val: {
    make: (rand) => sig('val', nz(rand, -5, 5), nz(rand, -9, 9), nz(rand, -5, 5)),
    build: (s) => {
      const [k, b, x] = nums(s);
      return Q(`函数 y = ${lin(k, 'x', b)}，当 x = ${lead(x)} 时，y 等于多少？`, undefined, k * x + b, [k * x - b, -k * x + b, k + b], '把自变量的值代入函数式，求出函数值。');
    },
  },
  dom: {
    make: (rand) => sig('dom', nz(rand, -9, 9)),
    build: (s) => {
      const [a] = nums(s);
      return Q(`函数 y = √(${lin(1, 'x', -a)}) 中，自变量 x 的取值范围是？`, undefined, `x ≥ ${lead(a)}`, [`x > ${lead(a)}`, `x ≥ ${lead(-a)}`, `x ≤ ${lead(a)}`], '被开方数要大于或等于 0。');
    },
  },
});

const m8b5 = mix({
  k: {
    make: (rand) => {
      const k = nz(rand, -5, 5);
      const b = r(rand, -8, 8);
      const x1 = r(rand, -4, 2);
      return sig('k', x1, k * x1 + b, x1 + r(rand, 1, 4), k, b);
    },
    build: (s) => {
      const [x1, y1, x2, k, b] = nums(s);
      const y2 = k * x2 + b;
      return Q(`一次函数的图象经过点 ${pt(x1, y1)} 和 ${pt(x2, y2)}，k 等于多少？`, undefined, k, [-k, b, y2 - y1], 'k = (y₂ − y₁) ÷ (x₂ − x₁)。');
    },
  },
  xint: {
    make: (rand) => {
      const k = nz(rand, -4, 4);
      return sig('xint', k, -k * nz(rand, -6, 6));
    },
    build: (s) => {
      const [k, b] = nums(s);
      return Q(`直线 y = ${lin(k, 'x', b)} 与 x 轴交点的横坐标是多少？`, undefined, -b / k, [b / k, b, -b], '与 x 轴相交时 y = 0，解方程 kx + b = 0。');
    },
  },
  inc: {
    make: (rand) => sig('inc', nz(rand, -6, 6), r(rand, -9, 9)),
    build: (s) => {
      const [k, b] = nums(s);
      const up = 'y 随 x 的增大而增大';
      const down = 'y 随 x 的增大而减小';
      return Q(`一次函数 y = ${lin(k, 'x', b)} 的增减性是？`, undefined, k > 0 ? up : down, [k > 0 ? down : up, 'y 不随 x 变化', '先增大后减小'], 'k > 0 时 y 随 x 增大而增大；k < 0 时 y 随 x 增大而减小。');
    },
  },
});

const m8b6 = mix({
  stat: {
    make: (rand) => {
      const n = [5, 7][pickI(rand, 2)];
      const xs = Array.from({ length: n }, () => r(rand, 1, 20));
      // 调整最后一个数，让平均数是整数
      const rest = xs.slice(0, -1).reduce((a, b) => a + b, 0);
      const last = xs[n - 1] - ((rest + xs[n - 1]) % n);
      xs[n - 1] = last >= 1 ? last : last + n;
      return sig('stat', r(rand, 0, 2), ...xs);
    },
    build: (s) => {
      const [k, ...xs] = nums(s);
      const sorted = [...xs].sort((a, b) => a - b);
      const median = sorted[(xs.length - 1) / 2];
      const range = sorted[sorted.length - 1] - sorted[0];
      const sum = xs.reduce((a, b) => a + b, 0);
      const mean = frac(sum, xs.length);
      const list = xs.join('，');
      if (k === 0) return Q(`数据 ${list} 的中位数是多少？`, undefined, median, [xs[(xs.length - 1) / 2], mean, range], '中位数：先从小到大排序，再取正中间的数。');
      if (k === 1) return Q(`数据 ${list} 的极差是多少？`, undefined, range, [sorted[sorted.length - 1], median, range + 1], '极差 = 最大值 − 最小值。');
      return Q(`数据 ${list} 的平均数是多少？`, undefined, mean, [String(median), frac(sum, xs.length - 1), frac(sum + xs.length, xs.length)], '平均数 = 总和 ÷ 个数。');
    },
  },
  mode: {
    make: (rand) => {
      const m = r(rand, 1, 9);
      const others = [r(rand, 10, 13), r(rand, 14, 16), r(rand, 17, 20)];
      return sig('mode', m, ...others);
    },
    build: (s) => {
      const [m, a, b, c] = nums(s);
      const list = [a, m, b, m, c, m].join('，');
      return Q(`数据 ${list} 的众数是多少？`, undefined, m, [a, b, 3], '众数是出现次数最多的数。');
    },
  },
});

/* ═══════════════ 九年级上册 ═══════════════ */

const m9a1 = mix({
  root: {
    make: (rand) => {
      const p = nz(rand, -9, 9);
      let q = nz(rand, -9, 9);
      if (q === p) q = -p;
      return sig('root', p, q);
    },
    build: (s) => {
      const [p, q] = nums(s);
      return Q('解方程，较大的根是多少？', `${quad(1, -(p + q), p * q)} = 0`, Math.max(p, q), [Math.min(p, q), -Math.max(p, q), -Math.min(p, q)], `因式分解：(x ${p < 0 ? '+' : M} ${Math.abs(p)})(x ${q < 0 ? '+' : M} ${Math.abs(q)}) = 0。`);
    },
  },
  vieta: {
    make: (rand) => sig('vieta', nz(rand, -9, 9), nz(rand, -9, 9), r(rand, 0, 1)),
    build: (s) => {
      const [p, q, prod] = nums(s);
      const stem = `${quad(1, -(p + q), p * q)} = 0`;
      return prod
        ? Q('方程两根的积是多少？', stem, p * q, [-(p * q), p + q], 'x₁ · x₂ = c ÷ a。')
        : Q('方程两根的和是多少？', stem, p + q, [-(p + q), p * q], 'x₁ + x₂ = −b ÷ a。');
    },
  },
  disc: {
    make: (rand) => sig('disc', nz(rand, -8, 8), r(rand, -10, 20)),
    build: (s) => {
      const [b, c] = nums(s);
      const d = b * b - 4 * c;
      const names = ['有两个不相等的实数根', '有两个相等的实数根', '没有实数根'];
      const k = d > 0 ? 0 : d === 0 ? 1 : 2;
      return Q(`方程 ${quad(1, b, c)} = 0 的根的情况是？`, undefined, names[k], names.filter((_, i) => i !== k), `判别式 b² − 4ac = ${d}，${['大于 0', '等于 0', '小于 0'][k]}。`);
    },
  },
});

const m9a2 = mix({
  axis: {
    make: (rand) => sig('axis', nz(rand, -3, 3), nz(rand, -5, 5), r(rand, -9, 9)),
    build: (s) => {
      const [a, h, c] = nums(s);
      const b = -2 * a * h;
      return Q(`抛物线 y = ${quad(a, b, c)} 的对称轴是 x = ？`, undefined, h, [-h, b, -b], '对称轴 x = −b ÷ (2a)。');
    },
  },
  vertex: {
    make: (rand) => sig('vertex', nz(rand, -2, 2), nz(rand, -5, 5), r(rand, -9, 9)),
    build: (s) => {
      const [a, h, k] = nums(s);
      const b = -2 * a * h;
      const c = a * h * h + k;
      return Q(`抛物线 y = ${quad(a, b, c)} 的顶点坐标是？`, undefined, pt(h, k), [pt(-h, k), pt(h, -k), pt(h, c)], '配方成 y = a(x − h)² + k，顶点是 (h, k)。');
    },
  },
  ext: {
    make: (rand) => sig('ext', nz(rand, -2, 2), nz(rand, -4, 4), nz(rand, -9, 9)),
    build: (s) => {
      const [a, h, k] = nums(s);
      const word = a < 0 ? '最大值' : '最小值';
      return Q(`二次函数 y = ${a === 1 ? '' : a === -1 ? M : a}(x ${h < 0 ? '+' : M} ${Math.abs(h)})² ${k < 0 ? M : '+'} ${Math.abs(k)} 的${word}是多少？`, undefined, k, [h, -k, a], `顶点式 y = a(x − h)² + k：a ${a < 0 ? '< 0 开口向下，有最大值' : '> 0 开口向上，有最小值'} k。`);
    },
  },
});

const m9a3 = mix({
  k: {
    make: (rand) => sig('k', nz(rand, -6, 6), nz(rand, -6, 6)),
    build: (s) => {
      const [x, y] = nums(s);
      return Q(`反比例函数 y = k/x 的图象经过点 ${pt(x, y)}，k 等于多少？`, undefined, x * y, [x + y, -x * y, y / x === Math.round(y / x) ? y / x : x - y], 'k = xy。');
    },
  },
  val: {
    make: (rand) => {
      const x = nz(rand, -6, 6);
      return sig('val', x * nz(rand, -6, 6), x);
    },
    build: (s) => {
      const [k, x] = nums(s);
      return Q(`反比例函数 y = ${lead(k)}/x，当 x = ${lead(x)} 时，y 等于多少？`, undefined, k / x, [k * x, -k / x, k - x], 'y = k ÷ x。');
    },
  },
  quad: {
    make: (rand) => sig('quad', nz(rand, -9, 9)),
    build: (s) => {
      const [k] = nums(s);
      const yes = k > 0 ? '第一、三象限' : '第二、四象限';
      return Q(`反比例函数 y = ${lead(k)}/x 的图象在哪两个象限？`, undefined, yes, [k > 0 ? '第二、四象限' : '第一、三象限', '第一、二象限', '第三、四象限'], 'k > 0 在第一、三象限，k < 0 在第二、四象限。');
    },
  },
});

const m9a4 = mix({
  half: {
    make: (rand) => sig('half', nz(rand, -9, 9), nz(rand, -9, 9)),
    build: (s) => {
      const [x, y] = nums(s);
      return Q(`点 ${pt(x, y)} 绕原点旋转 180°，得到的点是？`, undefined, pt(-x, -y), [pt(-x, y), pt(x, -y), pt(y, x)], '关于原点对称：横、纵坐标都变成相反数。');
    },
  },
  quarter: {
    make: (rand) => sig('quarter', nz(rand, -6, 6), nz(rand, -6, 6)),
    build: (s) => {
      const [x, y] = nums(s);
      return Q(`点 ${pt(x, y)} 绕原点逆时针旋转 90°，得到的点是？`, undefined, pt(-y, x), [pt(y, -x), pt(-x, -y), pt(y, x)], '逆时针旋转 90°：(x, y) → (−y, x)。');
    },
  },
  min: {
    make: (rand) => sig('min', [3, 4, 5, 6, 8, 10, 12][pickI(rand, 7)]),
    build: (s) => {
      const [n] = nums(s);
      return Q(`正 ${n} 边形绕它的中心至少旋转多少度，能与原来的图形重合？`, undefined, 360 / n, [180, 360, (n - 2) * 180 / n], '旋转角至少是 360° ÷ 边数。');
    },
  },
});

const m9a5 = mix({
  insc: {
    make: (rand) => sig('insc', r(rand, 10, 85) * 2, r(rand, 0, 1)),
    build: (s) => {
      const [c, askC] = nums(s);
      return askC
        ? Q(`同弧所对的圆周角是 ${c / 2}°，它所对的圆心角是多少度？`, undefined, c, [c / 2, 180 - c / 2, c / 4], '同弧所对的圆周角等于圆心角的一半。')
        : Q(`一条弧所对的圆心角是 ${c}°，它所对的圆周角是多少度？`, undefined, c / 2, [c, 180 - c, c * 2], '同弧所对的圆周角等于圆心角的一半。');
    },
  },
  chord: {
    make: (rand) => sig('chord', pickI(rand, 4), r(rand, 1, 2)),
    build: (s) => {
      const [i, k] = nums(s);
      const [d, h, rad] = TRIPLES[i].map((x) => x * k);
      return Q(`圆的半径是 ${rad}，圆心到弦的距离是 ${d}，弦长是多少？`, undefined, 2 * h, [h, rad + d, 2 * rad - d], '垂径定理：弦心距垂直平分弦，半弦长² = 半径² − 弦心距²。');
    },
  },
  arc: {
    make: (rand) => sig('arc', [30, 45, 60, 90, 120, 150, 180][pickI(rand, 7)], r(rand, 1, 12) * 2),
    build: (s) => {
      const [n, rad] = nums(s);
      const c = frac(n * rad, 180);
      return Q(`半径 ${rad}、圆心角 ${n}° 的弧长是多少个 π？`, undefined, c, [frac(n * rad * rad, 360), frac(n * rad, 360), frac(n * rad * 2, 180)], '弧长 l = nπr ÷ 180。');
    },
  },
});

const m9a6 = mix({
  pos: {
    make: (rand) => sig('pos', r(rand, 2, 12), r(rand, -2, 2)),
    build: (s) => {
      const [rad, delta] = nums(s);
      const d = rad + delta;
      const names = ['相交', '相切', '相离'];
      const k = d < rad ? 0 : d === rad ? 1 : 2;
      return Q(`⊙O 的半径是 ${rad}，圆心 O 到直线 l 的距离是 ${d}，直线 l 和 ⊙O 的位置关系是？`, undefined, names[k], names.filter((_, i) => i !== k).concat(['无法确定']), 'd < r 相交，d = r 相切，d > r 相离。');
    },
  },
  tan: {
    make: (rand) => sig('tan', pickI(rand, TRIPLES.length), r(rand, 1, 2)),
    build: (s) => {
      const [i, k] = nums(s);
      const [rad, t, d] = TRIPLES[i].map((x) => x * k);
      return Q(`⊙O 的半径是 ${rad}，从圆外一点 P 引切线，切点为 A，PO = ${d}，切线长 PA 是多少？`, undefined, t, [d - rad, d + rad, t + 1], '切线垂直于过切点的半径，用勾股定理：PA² = PO² − OA²。');
    },
  },
  hex: {
    make: (rand) => sig('hex', r(rand, 2, 20)),
    build: (s) => {
      const [rad] = nums(s);
      return Q(`⊙O 的半径是 ${rad}，它的内接正六边形的边长是多少？`, undefined, rad, [rad * 2, rad / 2, rad * 6], '正六边形可以分成 6 个等边三角形，边长等于外接圆半径。');
    },
  },
});

/* ═══════════════ 九年级下册 ═══════════════ */

const m9b2 = mix({
  peri: {
    make: (rand) => sig('peri', r(rand, 1, 4), r(rand, 2, 5), r(rand, 2, 9)),
    build: (s) => {
      const [p, q0, c] = nums(s);
      const q = p + q0;
      const big = c * q;
      return Q(`两个相似三角形的相似比是 ${p}:${q}，小三角形的周长是 ${c * p}，大三角形的周长是多少？`, undefined, big, [frac(c * p * q * q, p * p), c * p + q - p, c * q * q], '相似三角形周长的比等于相似比。');
    },
  },
  area: {
    make: (rand) => sig('area', r(rand, 1, 4), r(rand, 1, 4)),
    build: (s) => {
      const [p, q0] = nums(s);
      // 相似比化成最简（2:4 → 1:2）
      const g = gcd(p, p + q0);
      const q = (p + q0) / g;
      if (g > 1) return Q(`两个相似三角形的相似比是 ${p / g}:${q}，它们的面积比是？`, undefined, `${(p / g) ** 2}:${q * q}`, [`${p / g}:${q}`, `${(2 * p) / g}:${2 * q + 1}`, `${(p / g) ** 3}:${q ** 3}`], '相似三角形面积的比等于相似比的平方。');
      return Q(`两个相似三角形的相似比是 ${p}:${q}，它们的面积比是？`, undefined, `${p * p}:${q * q}`, [`${p}:${q}`, `${2 * p}:${2 * q + 1}`, `${p * p * p}:${q * q * q}`], '相似三角形面积的比等于相似比的平方。');
    },
  },
  shadow: {
    make: (rand) => sig('shadow', r(rand, 2, 5), r(rand, 2, 12)),
    build: (s) => {
      // 同一时刻：1 米的竿影长 k/2 米（用整数表示：竿 2 米、影 k 米），树影 k·n 米 → 树高 2n 米
      const [k, n] = nums(s);
      return Q(`同一时刻，2 米高的竹竿影长 ${k} 米，一棵树的影长 ${k * n} 米，树高多少米？`, undefined, 2 * n, [k * n, n, 2 * k * n], '同一时刻，物高与影长成正比：树高 ÷ 树影 = 竿高 ÷ 竿影。');
    },
  },
});

const TRIG: { f: string; deg: number; v: string }[] = [
  { f: 'sin', deg: 30, v: '1/2' },
  { f: 'sin', deg: 45, v: '√2/2' },
  { f: 'sin', deg: 60, v: '√3/2' },
  { f: 'cos', deg: 30, v: '√3/2' },
  { f: 'cos', deg: 45, v: '√2/2' },
  { f: 'cos', deg: 60, v: '1/2' },
  { f: 'tan', deg: 30, v: '√3/3' },
  { f: 'tan', deg: 45, v: '1' },
  { f: 'tan', deg: 60, v: '√3' },
];
const TRIG_VALUES = ['1/2', '√2/2', '√3/2', '√3/3', '1', '√3'];
const m9b3 = mix({
  sp: {
    make: (rand) => sig('sp', pickI(rand, TRIG.length)),
    build: (s) => {
      const t = TRIG[nums(s)[0]];
      return Q(`${t.f} ${t.deg}° 的值是？`, undefined, t.v, TRIG_VALUES.filter((v) => v !== t.v).slice(t.deg / 15 - 2), '记住 30°、45°、60° 角的三角函数值（可以画含这些角的直角三角形推出来）。');
    },
  },
  side: {
    make: (rand) => sig('side', pickI(rand, TRIPLES.length), r(rand, 0, 2)),
    build: (s) => {
      const [i, k] = nums(s);
      const [a, b, c] = TRIPLES[i];
      const name = ['sin A', 'cos A', 'tan A'][k];
      const ans = [frac(a, c), frac(b, c), frac(a, b)][k];
      return Q(`Rt△ABC 中，∠C = 90°，BC = ${a}，AC = ${b}，AB = ${c}，${name} 等于多少？`, undefined, ans, [frac(a, c), frac(b, c), frac(a, b), frac(b, a)].filter((x) => x !== ans), 'sin A = 对边/斜边，cos A = 邻边/斜边，tan A = 对边/邻边。');
    },
  },
  h30: {
    make: (rand) => sig('h30', r(rand, 2, 20) * 2),
    build: (s) => {
      const [c] = nums(s);
      return Q(`Rt△ABC 中，∠C = 90°，∠A = 30°，斜边 AB = ${c}，BC 长多少？`, undefined, c / 2, [c, c * 2, c / 4], '30° 角所对的直角边等于斜边的一半（sin 30° = 1/2）。');
    },
  },
});

/** 投影与视图（V5.2.5 扩充）：概念小题库（签名 c:编号，旧记录照常可用）+ 同一时刻影长计算 */
const m9b4Concepts = pool([
  ['太阳光线可以看成平行光线，它形成的投影是？', '平行投影', ['中心投影', '正投影以外的投影', '没有投影'], '太阳光下的影子是平行投影；灯光下的影子是中心投影。'],
  ['路灯下人的影子属于？', '中心投影', ['平行投影', '正投影', '三视图'], '从一点发出的光线形成的投影叫中心投影。'],
  ['三视图是指？', '主视图、左视图、俯视图', ['正视图、背视图、底视图', '前视图、后视图、侧视图', '上视图、下视图、左视图'], '从正面、左面、上面看到的图形。'],
  ['一个圆柱，从正面看到的图形是？', '长方形', ['圆', '三角形', '梯形'], '圆柱的主视图是长方形，俯视图是圆。'],
  ['一个圆锥，从上面看到的图形是？', '带圆心的圆', ['三角形', '长方形', '梯形'], '圆锥的俯视图是一个圆，中间有一个点表示顶点。'],
  ['一个球，三个视图都是？', '圆', ['长方形', '三角形', '正方形'], '球从哪个方向看都是圆。'],
  ['画三视图时，主视图和俯视图要满足？', '长对正', ['高平齐', '宽相等', '面积相等'], '主俯长对正，主左高平齐，俯左宽相等。'],
  ['同一时刻，太阳光下两根竹竿，较高的那根影子？', '较长', ['较短', '一样长', '无法比较'], '平行投影中，同一时刻物高与影长成正比。'],
  ['正方体的三视图都是？', '正方形', ['长方形', '圆', '三角形'], '正方体从正面、左面、上面看都是正方形。'],
  ['一个圆柱（竖直放置），从上面看到的图形是？', '圆', ['长方形', '三角形', '梯形'], '竖放的圆柱，俯视图是圆，主视图和左视图是长方形。'],
  ['一个圆锥（竖直放置），从正面看到的图形是？', '三角形', ['圆', '长方形', '梯形'], '竖放的圆锥，主视图和左视图是等腰三角形。'],
  ['投影线垂直于投影面产生的投影叫？', '正投影', ['中心投影', '斜投影', '三视图'], '三视图就是物体的正投影。'],
  ['主视图和左视图要满足？', '高平齐', ['长对正', '宽相等', '面积相等'], '主俯长对正，主左高平齐，俯左宽相等。'],
  ['俯视图和左视图要满足？', '宽相等', ['长对正', '高平齐', '面积相等'], '主俯长对正，主左高平齐，俯左宽相等。'],
  ['画三视图时，看不见的轮廓线画成？', '虚线', ['实线', '波浪线', '不画'], '看得见的轮廓线画实线，看不见的画虚线。'],
  ['一天中，太阳光下物体的影子大约在什么时候最短？', '正午', ['早晨', '傍晚', '上午八点'], '正午太阳最高，影子最短。'],
  ['晚上人从路灯正下方走开，影子会？', '越来越长', ['越来越短', '不变', '消失'], '离点光源越远，中心投影的影子越长。'],
]);
const m9b4 = mix({
  c: m9b4Concepts,
  shadow: {
    // 同一时刻：竹竿高 p 米、影长 q 米，树影长 q·m 米 → 树高 p·m 米
    make: (rand) => {
      const p = r(rand, 1, 6);
      let q = r(rand, 1, 5);
      if (q === p) q = p === 5 ? 4 : p + 1;
      return sig('shadow', p, q, r(rand, 2, 8));
    },
    build: (s) => {
      const [p, q, m] = nums(s);
      const ans = p * m;
      const wrongs = [...new Set([q * m, ans + p, ans - p, ans + 1].map(String))].filter((x) => x !== String(ans) && Number(x) > 0).slice(0, 3);
      return withSteps(
        Q(`同一时刻，太阳光下一根高 ${p} 米的竹竿影长 ${q} 米，旁边一棵树的影长是 ${q * m} 米。这棵树高多少米？`, undefined, String(ans), wrongs, `同一时刻物高与影长成正比：树高 = ${q * m} × ${p} ÷ ${q} = ${ans}（米）。`),
        ['同一时刻太阳光是平行光，物体的高和影长成正比：物高 ÷ 影长 相等。', `设树高 x 米，列比例：${p} ÷ ${q} = x ÷ ${q * m}。`, `x = ${q * m} × ${p} ÷ ${q} = ${ans}（米）。`],
      );
    },
  },
});

const m9b5 = mix({
  dice: {
    make: (rand) => sig('dice', r(rand, 1, 5), r(rand, 0, 1)),
    build: (s) => {
      const [k, more] = nums(s);
      const n = more ? 6 - k : k;
      const text = more ? `大于 ${k}` : `小于或等于 ${k}`;
      return Q(`掷一枚质地均匀的骰子，点数${text} 的概率是多少？`, undefined, frac(n, 6), [frac(6 - n, 6), frac(n, 5), frac(k, 6) === frac(n, 6) ? frac(n + 1, 6) : frac(k, 6)], '概率 = 符合条件的结果数 ÷ 所有可能的结果数（6 种）。');
    },
  },
  ball: {
    make: (rand) => sig('ball', r(rand, 1, 8), r(rand, 1, 8)),
    build: (s) => {
      const [red, white] = nums(s);
      return Q(`袋子里有 ${red} 个红球和 ${white} 个白球，除颜色外都相同。随机摸出一个，是红球的概率是多少？`, undefined, frac(red, red + white), [frac(white, red + white), frac(red, white), frac(1, red + white)], '红球个数 ÷ 球的总个数。');
    },
  },
  coin: {
    make: (rand) => sig('coin', r(rand, 0, 2)),
    build: (s) => {
      const [k] = nums(s);
      const text = ['都是正面', '一正一反', '至少一个正面'][k];
      const ans = ['1/4', '1/2', '3/4'][k];
      return Q(`同时抛两枚质地均匀的硬币，${text}的概率是多少？`, undefined, ans, ['1/4', '1/2', '3/4', '1/3'].filter((x) => x !== ans), '列表：正正、正反、反正、反反，共 4 种等可能的结果。');
    },
  },
});

export const JUNIOR_GENERATORS: Record<string, UpperGen> = {
  'm7.a1': m7a1,
  'm7.a2': m7a2,
  'm7.a3': m7a3,
  'm7.a4': m7a4,
  'm7.a5': m7a5,
  'm7.a6': m7a6,
  'm7.b1': m7b1,
  'm7.b2': m7b2,
  'm7.b3': m7b3,
  'm7.b4': m7b4,
  'm7.b5': m7b5,
  'm7.b6': m7b6,
  'm8.a1': m8a1,
  'm8.a2': m8a2,
  'm8.a3': m8a3,
  'm8.a4': m8a4,
  'm8.a5': m8a5,
  'm8.a6': m8a6,
  'm8.b1': m8b1,
  'm8.b2': m8b2,
  'm8.b3': m8b3,
  'm8.b4': m8b4,
  'm8.b5': m8b5,
  'm8.b6': m8b6,
  'm9.a1': m9a1,
  'm9.a2': m9a2,
  'm9.a3': m9a3,
  'm9.a4': m9a4,
  'm9.a5': m9a5,
  'm9.a6': m9a6,
  'm9.b2': m9b2,
  'm9.b3': m9b3,
  'm9.b4': m9b4,
  'm9.b5': m9b5,
};
