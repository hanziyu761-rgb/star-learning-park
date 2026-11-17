/**
 * 二～六年级数学知识点题目生成器（本项目原创）。
 *
 * 只出“答案可以由程序算出来”的计算、换算、公式类题目；概念/图形/统计/数学广角类知识点用题库单元练习。
 * 每道题由签名唯一确定（题目 id = kp:知识点:签名），复习、诊断时由 id 还原。
 * 小数、分数一律用整数运算，避免浮点误差。
 * 二年级题目带拼音；三年级起不再注音（与题库一致）。
 * 状态：已通过教师审核；题型参考课程标准与人教版单元目录（未核对教材原题）。
 */
import { zh } from '@/content/zh';
import type { ChoiceExercise, DisplayText, Prompt, Visual } from '@/lesson/types';

type Rand = () => number;
export interface UpperGen {
  make: (rand: Rand) => string;
  build: (sig: string) => Omit<ChoiceExercise, 'id' | 'skill' | 'kind' | 'wrongHint'> & { wrongHint?: Prompt };
}

const r = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = <T>(rand: Rand, a: readonly T[]) => a[Math.floor(rand() * a.length)];
const say = (text: string) => ({ text, lang: 'zh-CN' as const });
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

/** 定点小数格式化：fmt(305, 2) = "3.05"，fmt(320, 2) = "3.2" */
export function fmt(n: number, scale: number): string {
  if (scale === 0) return String(n);
  const neg = n < 0;
  const s = String(Math.abs(n)).padStart(scale + 1, '0');
  const int = s.slice(0, s.length - scale);
  const dec = s.slice(s.length - scale).replace(/0+$/, '');
  return `${neg ? '-' : ''}${int}${dec ? `.${dec}` : ''}`;
}
/** 最简分数文字：frac(6, 8) = "3/4"，frac(4, 2) = "2" */
export function frac(n: number, d: number): string {
  const g = gcd(n, d);
  const a = n / g;
  const b = d / g;
  return b === 1 ? String(a) : `${a}/${b}`;
}

/** 选项：正确答案 + 干扰项（去重、去掉空/负数），不足 4 个时用 ±1、±2 补齐数字答案 */
function opts(ans: string, wrongs: (string | number)[]): ChoiceExercise['options'] {
  const set: string[] = [ans];
  for (const w of wrongs.map(String)) {
    if (set.length >= 4) break;
    if (w && !set.includes(w) && !w.startsWith('-') && w !== 'NaN') set.push(w);
  }
  const n = Number(ans);
  if (Number.isInteger(n)) {
    for (const d of [1, -1, 2, -2, 10]) {
      if (set.length >= 4) break;
      const w = String(n + d);
      if (n + d >= 0 && !set.includes(w)) set.push(w);
    }
  }
  const numeric = set.every((x) => /^-?\d+(\.\d+)?$/.test(x));
  if (numeric) set.sort((a, b) => Number(a) - Number(b));
  return set.map((t) => ({ id: t, text: t }));
}

/** 三年级起：普通文字题目 */
function q(text: string, ans: string, wrongs: (string | number)[], stem?: string): ReturnType<UpperGen['build']> {
  return {
    prompt: { text, speak: say(text) },
    stem: stem ? { text: stem } : undefined,
    options: opts(ans, wrongs),
    answerId: ans,
  };
}
/** 应用题的分步讲解（V5.4）：每一步都用这道题自己的数算出来 */
const withSteps = (b: ReturnType<UpperGen['build']>, steps: string[]): ReturnType<UpperGen['build']> => ({ ...b, steps });

/** 二年级：带拼音的题目（拼音只对应汉字，数字和符号不注音） */
function qz(
  chars: string,
  py: string,
  ans: string,
  wrongs: (string | number)[],
  stem?: DisplayText,
  speakText?: string,
) {
  return {
    prompt: { text: zh(chars, py), speak: say(speakText ?? chars) },
    stem: stem ? { text: stem } : undefined,
    options: opts(ans, wrongs),
    answerId: ans,
  };
}
const CALC = { text: zh('算一算', 'suàn yi suàn'), speak: say('算一算') };
/** 竖式/口算题：题干 “a op b = ?” */
function calc(
  a: number,
  op: '+' | '−' | '×' | '÷',
  b: number,
  ans: number,
  wrongs: number[],
): ReturnType<UpperGen['build']> {
  return {
    prompt: CALC,
    stem: { text: `${a} ${op} ${b} = ?` },
    options: opts(String(ans), wrongs),
    answerId: String(ans),
  };
}
const sigOf = (...xs: (string | number)[]) => xs.join(':');
const parts = (sig: string) => sig.split(':');
const nums = (sig: string) => sig.split(':').map(Number);

/* ═══════════════════════ 二年级 ═══════════════════════ */

const LEN_ITEMS = [
  { chars: '一支铅笔长约18', py: 'yì zhī qiān bǐ cháng yuē', unit: '厘米' },
  { chars: '教室门高约2', py: 'jiào shì mén gāo yuē', unit: '米' },
  { chars: '一块橡皮长约4', py: 'yí kuài xiàng pí cháng yuē', unit: '厘米' },
  { chars: '旗杆高约10', py: 'qí gān gāo yuē', unit: '米' },
];
const UNIT_OPTS: Record<string, DisplayText> = { 厘米: zh('厘米', 'lí mǐ'), 米: zh('米', 'mǐ') };

export const UPPER_GENERATORS: Record<string, UpperGen> = {
  'm2.length': {
    make: (rand) => (rand() < 0.5 ? sigOf('m2cm', r(rand, 1, 9)) : sigOf('unit', r(rand, 0, LEN_ITEMS.length - 1))),
    build: (sig) => {
      const [t, a] = parts(sig);
      if (t === 'm2cm') {
        const m = Number(a);
        return qz('填一填', 'tián yi tián', String(m * 100), [m * 10, m, m * 1000], zh(`${m}米 = ?厘米`, 'mǐ lí mǐ'));
      }
      const it = LEN_ITEMS[Number(a)];
      return {
        prompt: { text: zh(`${it.chars}（ ）。`, it.py), speak: say(`${it.chars}什么？`) },
        options: [
          { id: '厘米', text: UNIT_OPTS['厘米'] },
          { id: '米', text: UNIT_OPTS['米'] },
        ],
        answerId: it.unit,
      };
    },
  },
  'm2.addsub100': {
    make: (rand) => {
      // 本单元重点：进位加、退位减
      if (rand() < 0.5) {
        const a1 = r(rand, 1, 9);
        const at = r(rand, 1, 7);
        return `${at * 10 + a1}+${r(rand, 1, 8 - at) * 10 + r(rand, 10 - a1, 9)}`;
      }
      const a1 = r(rand, 0, 8);
      const at = r(rand, 2, 9);
      return `${at * 10 + a1}-${r(rand, 1, at - 1) * 10 + r(rand, a1 + 1, 9)}`;
    },
    build: (sig) => {
      const m = sig.match(/^(\d+)([+-])(\d+)$/)!;
      const a = Number(m[1]);
      const b = Number(m[3]);
      // 常见错误：进位/退位忘了处理（±10）
      return m[2] === '+'
        ? calc(a, '+', b, a + b, [a + b - 10, a + b + 10, a + b + 1])
        : calc(a, '−', b, a - b, [a - b + 10, a - b - 10, a - b + 1]);
    },
  },
  'm2.mul1': mulTable(2, 6),
  'm2.mul2': mulTable(7, 9),
  'm2.div1': divTable(2, 6),
  'm2.div2': divTable(7, 9),
  'm2.time': {
    make: (rand) => sigOf(r(rand, 1, 12), r(rand, 1, 11) * 5),
    build: (sig) => {
      const [h, m] = nums(sig);
      const label = (hh: number, mm: number) => `${hh}时${mm}分`;
      const nextH = (h % 12) + 1;
      const fig: Visual = { emoji: '🕐', figure: { type: 'clock', hour: h, minute: m } };
      // 干扰项：分针指的数当成分（25 分读成 5 分）、过半时读成下一时
      const wrongs = [label(h, m / 5), label(nextH, m), label(h, 60 - m)];
      return {
        prompt: {
          text: zh('钟面上是几时几分？', 'zhōng miàn shàng shì jǐ shí jǐ fēn'),
          speak: say('钟面上是几时几分？'),
        },
        stem: { visual: fig },
        options: opts(label(h, m), wrongs).map((o) => ({ id: o.id, text: zh(o.id, 'shí fēn') })),
        answerId: label(h, m),
      };
    },
  },
  'm2.mixed': {
    make: (rand) => {
      const form = r(rand, 0, 3);
      if (form === 0) return sigOf(form, r(rand, 2, 40), r(rand, 2, 9), r(rand, 2, 9)); // a + b × c
      if (form === 1) return sigOf(form, r(rand, 2, 9), r(rand, 2, 9), r(rand, 2, 9)); // (a + b) × c 结果 ≤ 81
      if (form === 2) {
        const c = r(rand, 2, 9);
        const q2 = r(rand, 2, 9);
        return sigOf(form, r(rand, 1, 30), q2 * c, c); // a + b ÷ c
      }
      const c = r(rand, 2, 9);
      const qq = r(rand, 2, 9);
      const b = r(rand, 1, 30);
      return sigOf(form, qq * c + b, b, c); // (a − b) ÷ c
    },
    build: (sig) => {
      const [f, a, b, c] = nums(sig);
      if (f === 0) return mixed(`${a} + ${b} × ${c}`, a + b * c, [(a + b) * c]);
      if (f === 1) return mixed(`(${a} + ${b}) × ${c}`, (a + b) * c, [a + b * c]);
      if (f === 2) return mixed(`${a} + ${b} ÷ ${c}`, a + b / c, [Math.floor((a + b) / c)]);
      return mixed(`(${a} − ${b}) ÷ ${c}`, (a - b) / c, [a - b / c]);
    },
  },
  'm2.remainder': {
    make: (rand) => {
      const d = r(rand, 2, 9);
      return sigOf(d * r(rand, 1, 9) + r(rand, 1, d - 1), d);
    },
    build: (sig) => {
      const [a, d] = nums(sig);
      const qq = Math.floor(a / d);
      const rem = a % d;
      const s = (x: number, y: number) => `${x}……${y}`;
      // 常见错误：余数比除数大（商少 1）、商多 1
      const wrongs = [qq > 1 ? s(qq - 1, rem + d) : '', s(qq + 1, rem), s(qq, rem + 1 < d ? rem + 1 : rem - 1)];
      return {
        prompt: CALC,
        stem: { text: `${a} ÷ ${d} = ?` },
        options: opts(s(qq, rem), wrongs),
        answerId: s(qq, rem),
      };
    },
  },
  'm2.count10000': {
    make: (rand) => sigOf(r(rand, 1, 9), r(rand, 0, 9), r(rand, 0, 9), r(rand, 0, 9)),
    build: (sig) => {
      const [th, h, t, o] = nums(sig);
      const n = th * 1000 + h * 100 + t * 10 + o;
      const chars = `${th}个千、${h}个百、${t}个十和${o}个一组成的数是多少？`;
      // 干扰：漏掉 0 占位、数位错位
      const wrongs = [Number(`${th}${h || ''}${t || ''}${o}`), th * 1000 + t * 100 + h * 10 + o, th * 100 + h * 10 + t];
      return qz(chars, 'gè qiān gè bǎi gè shí hé gè yī zǔ chéng de shù shì duō shao', String(n), wrongs);
    },
  },
  'm2.mass': {
    make: (rand) => (rand() < 0.5 ? sigOf('kg', r(rand, 1, 9)) : sigOf('g', r(rand, 2, 9))),
    build: (sig) => {
      const [t, a] = parts(sig);
      const n = Number(a);
      if (t === 'kg')
        return qz('填一填', 'tián yi tián', String(n * 1000), [n * 100, n * 10, n], zh(`${n}千克 = ?克`, 'qiān kè kè'));
      return qz(
        '填一填',
        'tián yi tián',
        String(n),
        [n * 10, n * 100, n * 1000],
        zh(`${n * 1000}克 = ?千克`, 'kè qiān kè'),
      );
    },
  },

  /* ═══════════════════════ 三年级 ═══════════════════════ */
  'm3.hms': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('min', r(rand, 2, 9));
      if (t === 1) return sigOf('hour', r(rand, 2, 5));
      const h = r(rand, 7, 10);
      const m1 = r(rand, 1, 10) * 5;
      return sigOf('span', h, m1, r(rand, 3, 10) * 5);
    },
    build: (sig) => {
      const [t, a, b, c] = parts(sig);
      if (t === 'min')
        return q(`${a}分 = ( )秒`, String(Number(a) * 60), [Number(a) * 100, Number(a) * 10, Number(a) * 6]);
      if (t === 'hour')
        return q(`${a}时 = ( )分`, String(Number(a) * 60), [Number(a) * 100, Number(a) * 24, Number(a) * 6]);
      const start = Number(a) * 60 + Number(b);
      const end = start + Number(c);
      const tt = (x: number) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
      return withSteps(
        q(`从 ${tt(start)} 到 ${tt(end)}，经过了几分钟？`, String(Number(c)), [Number(c) + 40, Number(c) + 10, 60 - Number(c)]),
        [
          `把时刻都换成“几时几分”：开始 ${tt(start)}，结束 ${tt(end)}。`,
          Math.floor(start / 60) === Math.floor(end / 60)
            ? `同一个小时里，直接用分相减：${end % 60} − ${start % 60} = ${Number(c)}（分钟）。`
            : `先算到整点：${tt(start)} 到 ${Math.floor(end / 60)}:00 是 ${60 - (start % 60)} 分钟；再加上 ${tt(end)} 多出的 ${end % 60} 分钟：${60 - (start % 60)} + ${end % 60} = ${Number(c)}（分钟）。`,
          `答：经过了 ${Number(c)} 分钟。`,
        ],
      );
    },
  },
  'm3.addsub1': {
    make: (rand) => {
      const a = r(rand, 11, 79) * 10;
      return rand() < 0.5 ? `${a}+${r(rand, 11, 99 - a / 10) * 10}` : `${a + 200}-${r(rand, 11, a / 10) * 10}`;
    },
    build: (sig) => {
      const m = sig.match(/^(\d+)([+-])(\d+)$/)!;
      const a = Number(m[1]);
      const b = Number(m[3]);
      return m[2] === '+'
        ? calc(a, '+', b, a + b, [a + b - 100, a + b + 100, a + b + 10])
        : calc(a, '−', b, a - b, [a - b + 100, a - b - 100, a - b + 10]);
    },
  },
  'm3.measure': {
    make: (rand) => sigOf(r(rand, 0, 5), r(rand, 2, 9)),
    build: (sig) => {
      const [t, n] = nums(sig);
      const F: [string, string, number, boolean][] = [
        ['厘米', '毫米', 10, true],
        ['分米', '厘米', 10, true],
        ['米', '分米', 10, true],
        ['千米', '米', 1000, true],
        ['吨', '千克', 1000, true],
        ['毫米', '厘米', 10, false],
      ];
      const [from, to, k, big] = F[t];
      const v = big ? n : n * k;
      const ans = big ? n * k : n;
      return q(`${v}${from} = ( )${to}`, String(ans), [ans * 10, ans / 10, ans * 100].filter(Number.isInteger));
    },
  },
  'm3.addsub2': {
    make: (rand) => {
      if (rand() < 0.5) {
        const a = r(rand, 105, 799);
        return `${a}+${r(rand, 105, 999 - a)}`;
      }
      const a = r(rand, 300, 999);
      return `${a}-${r(rand, 101, a - 1)}`;
    },
    build: (sig) => {
      const m = sig.match(/^(\d+)([+-])(\d+)$/)!;
      const a = Number(m[1]);
      const b = Number(m[3]);
      return m[2] === '+'
        ? calc(a, '+', b, a + b, [a + b - 10, a + b - 100, a + b + 10])
        : calc(a, '−', b, a - b, [a - b + 10, a - b + 100, a - b - 10]);
    },
  },
  'm3.times': {
    make: (rand) =>
      rand() < 0.5 ? sigOf('how', r(rand, 2, 9), r(rand, 2, 9)) : sigOf('of', r(rand, 2, 9), r(rand, 2, 9)),
    build: (sig) => {
      const [t, a, b] = parts(sig);
      const x = Number(a);
      const k = Number(b);
      if (t === 'how')
        return withSteps(q(`🔵 有 ${x} 个，🔴 有 ${x * k} 个。🔴 的个数是 🔵 的几倍？`, String(k), [x * k - x, x * k + x, k + 1]), [
          `求“🔴 是 🔵 的几倍”，就是看 ${x * k} 里面有几个 ${x}，用除法。`,
          `${x * k} ÷ ${x} = ${k}。`,
          `答：🔴 的个数是 🔵 的 ${k} 倍。`,
        ]);
      return q(`${x} 的 ${k} 倍是多少？`, String(x * k), [x + k, x * k + x, x * (k - 1)]);
    },
  },
  'm3.mul1d': {
    make: (rand) => `${r(rand, 12, 999)}×${r(rand, 2, 9)}`,
    build: (sig) => {
      const [a, b] = sig.split('×').map(Number);
      const p = a * b;
      return calc(a, '×', b, p, [p - 10, p + 10, p - 100 > 0 ? p - 100 : p + 100]);
    },
  },
  'm3.perimeter': {
    make: (rand) => (rand() < 0.6 ? sigOf('rect', r(rand, 4, 20), r(rand, 2, 12)) : sigOf('sq', r(rand, 2, 25))),
    build: (sig) => {
      const [t, a, b] = parts(sig);
      if (t === 'rect') {
        const l = Math.max(Number(a), Number(b) + 1);
        const w = Number(b);
        return withSteps(q(`长方形长 ${l} 厘米、宽 ${w} 厘米，周长是多少厘米？`, String((l + w) * 2), [l + w, l * w, l * 2 + w]), [
          '长方形的周长 =（长 + 宽）× 2。',
          `先算一条长加一条宽：${l} + ${w} = ${l + w}（厘米）。`,
          `再乘 2：${l + w} × 2 = ${(l + w) * 2}（厘米）。`,
          `答：周长是 ${(l + w) * 2} 厘米。`,
        ]);
      }
      const s = Number(a);
      return withSteps(q(`正方形边长 ${s} 厘米，周长是多少厘米？`, String(s * 4), [s * 2, s * s, s + 4]), [
        '正方形的 4 条边一样长，周长 = 边长 × 4。',
        `${s} × 4 = ${s * 4}（厘米）。`,
        `答：周长是 ${s * 4} 厘米。`,
      ]);
    },
  },
  'm3.fraction1': {
    make: (rand) => {
      const t = r(rand, 0, 3);
      const d = r(rand, 3, 10);
      if (t === 0) {
        const a = r(rand, 1, d - 1);
        let b = r(rand, 1, d - 1);
        if (b === a) b = a === 1 ? 2 : a - 1;
        return sigOf('sameD', a, b, d);
      }
      if (t === 1) {
        const d1 = r(rand, 2, 9);
        let d2 = r(rand, 2, 9);
        if (d2 === d1) d2 = d1 === 9 ? 8 : d1 + 1;
        return sigOf('unit', d1, d2);
      }
      const a = r(rand, 1, d - 2);
      return sigOf(t === 2 ? 'add' : 'sub', a, r(rand, 1, d - 1 - a), d);
    },
    build: (sig) => {
      const [t, x, y, z] = parts(sig);
      const [a, b, d] = [Number(x), Number(y), Number(z)];
      const cmp = [
        { id: '>', text: '>' },
        { id: '<', text: '<' },
        { id: '=', text: '=' },
      ];
      if (t === 'sameD')
        return {
          prompt: { text: '比较大小', speak: say('比较大小') },
          stem: { text: `${a}/${d} ○ ${b}/${d}` },
          options: cmp,
          answerId: a > b ? '>' : '<',
        };
      if (t === 'unit')
        return {
          prompt: { text: '比较大小', speak: say('比较大小') },
          stem: { text: `1/${a} ○ 1/${b}` },
          options: cmp,
          answerId: a < b ? '>' : '<',
        };
      if (t === 'add')
        return q(
          '算一算',
          `${a + b}/${d}`,
          [`${a + b}/${d + d}`, `${a + b + 1}/${d}`, `${Math.abs(a - b) || 1}/${d}`],
          `${a}/${d} + ${b}/${d} = ?`,
        );
      // 1 − a/d（这里 b 只用于签名唯一）
      return q('算一算', `${d - a}/${d}`, [`${a}/${d}`, `${d - a}/${d + 1}`, `${1}/${d}`], `1 − ${a}/${d} = ?`);
    },
  },
  'm3.div1d': {
    make: (rand) => {
      const d = r(rand, 2, 9);
      return `${d * r(rand, 12, 120)}÷${d}`;
    },
    build: (sig) => {
      const [a, d] = sig.split('÷').map(Number);
      const qq = a / d;
      return calc(a, '÷', d, qq, [qq * 10 > 999 ? qq + 10 : qq * 10, qq - 10 > 0 ? qq - 10 : qq + 20, qq + 1]);
    },
  },
  'm3.mul2d': {
    make: (rand) => `${r(rand, 11, 99)}×${r(rand, 11, 99)}`,
    build: (sig) => {
      const [a, b] = sig.split('×').map(Number);
      const p = a * b;
      // 常见错误：第二部分积没有错位（十位数字 × a 当作个位）
      const wrong = a * (b % 10) + a * Math.floor(b / 10);
      return calc(a, '×', b, p, [wrong, p + 10, p - 100 > 0 ? p - 100 : p + 100]);
    },
  },
  'm3.area': {
    make: (rand) => {
      const t = r(rand, 0, 3);
      if (t === 0) return sigOf('rect', r(rand, 3, 20), r(rand, 2, 12));
      if (t === 1) return sigOf('sq', r(rand, 2, 15));
      return sigOf(t === 2 ? 'm2dm' : 'cm2dm', r(rand, 2, 9));
    },
    build: (sig) => {
      const [t, a, b] = parts(sig);
      const x = Number(a);
      if (t === 'rect') {
        const l = Math.max(x, Number(b) + 1);
        const w = Number(b);
        return withSteps(q(`长方形长 ${l} 米、宽 ${w} 米，面积是多少平方米？`, String(l * w), [(l + w) * 2, l + w, l * w + l]), [
          '长方形的面积 = 长 × 宽（注意不是周长）。',
          `${l} × ${w} = ${l * w}（平方米）。`,
          `答：面积是 ${l * w} 平方米。`,
        ]);
      }
      if (t === 'sq')
        return withSteps(q(`正方形边长 ${x} 分米，面积是多少平方分米？`, String(x * x), [x * 4, x * 2, x * x + x]), [
          '正方形的面积 = 边长 × 边长。',
          `${x} × ${x} = ${x * x}（平方分米）。`,
          `答：面积是 ${x * x} 平方分米。`,
        ]);
      if (t === 'm2dm') return q(`${x}平方米 = ( )平方分米`, String(x * 100), [x * 10, x * 1000, x]);
      return q(`${x * 100}平方厘米 = ( )平方分米`, String(x), [x * 10, x * 100, x * 1000]);
    },
  },
  'm3.calendar': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('feb', r(rand, 2019, 2030));
      if (t === 1) return sigOf('month', pick(rand, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
      return sigOf('24h', r(rand, 1, 11));
    },
    build: (sig) => {
      const [t, a] = parts(sig);
      const n = Number(a);
      if (t === 'feb') {
        const leap = (n % 4 === 0 && n % 100 !== 0) || n % 400 === 0;
        return q(`${n} 年的 2 月有多少天？`, leap ? '29' : '28', [leap ? 28 : 29, 30, 31]);
      }
      if (t === 'month') {
        const big = [1, 3, 5, 7, 8, 10, 12].includes(n);
        return q(`${n} 月有多少天？`, big ? '31' : '30', [big ? 30 : 31, 28, 29]);
      }
      return q(`下午 ${n} 时，用 24 时计时法表示是几时？`, `${n + 12}时`, [`${n}时`, `${n + 10}时`, `${n + 2}时`]);
    },
  },
  'm3.decimal1': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) {
        const a = r(rand, 1, 9);
        let b = r(rand, 1, 9);
        if (b === a) b = a === 9 ? 8 : a + 1;
        return sigOf('cmp', a, b);
      }
      if (t === 1) return sigOf('yuan', r(rand, 1, 9), r(rand, 1, 9));
      const a = r(rand, 1, 8);
      return sigOf('add', a, r(rand, 1, 9 - a));
    },
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [a, b] = [Number(x), Number(y)];
      if (t === 'cmp') return q(`0.${a} 和 0.${b}，哪个大？`, `0.${Math.max(a, b)}`, [`0.${Math.min(a, b)}`]);
      if (t === 'yuan') return q(`${a}元${b}角 = ( )元`, `${a}.${b}`, [`${a}.0${b}`, `${a}${b}`, `${b}.${a}`]);
      return q('算一算', `0.${a + b}`, [`0.${a}${b}`, `${a + b}`, `0.${a + b + 1}`], `0.${a} + 0.${b} = ?`);
    },
  },

  /* ═══════════════════════ 四年级 ═══════════════════════ */
  'm4.bignum': {
    make: (rand) =>
      rand() < 0.5 ? sigOf('wan', r(rand, 11, 9999)) : sigOf('yi', r(rand, 1, 99), r(rand, 0, 99999999)),
    build: (sig) => {
      const [t, a, b] = parts(sig);
      if (t === 'wan') {
        const n = Number(a);
        return q(`把 ${n}0000 改写成用“万”作单位的数。`, `${n}万`, [
          `${n}0万`,
          `${Math.floor(n / 10) || n + 1}万`,
          `${n}00万`,
        ]);
      }
      const n = Number(a) * 1e8 + Number(b);
      const ans = Math.round(n / 1e8);
      return q(`${n} 省略亿位后面的尾数约是多少亿？`, `${ans}亿`, [
        `${ans === Number(a) ? ans + 1 : ans - 1}亿`,
        `${ans * 10}亿`,
        `${ans}万`,
      ]);
    },
  },
  'm4.hectare': {
    make: (rand) => sigOf(r(rand, 0, 2), r(rand, 2, 9)),
    build: (sig) => {
      const [t, n] = nums(sig);
      if (t === 0) return q(`${n}公顷 = ( )平方米`, String(n * 10000), [n * 1000, n * 100, n * 100000]);
      if (t === 1) return q(`${n}平方千米 = ( )公顷`, String(n * 100), [n * 10, n * 1000, n * 10000]);
      return q(`${n * 10000}平方米 = ( )公顷`, String(n), [n * 10, n * 100, n * 1000]);
    },
  },
  'm4.angle': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('clock', r(rand, 1, 11));
      return sigOf(t === 1 ? 'flat' : 'right', r(rand, 1, 17) * 5);
    },
    build: (sig) => {
      const [t, a] = parts(sig);
      const n = Number(a);
      if (t === 'clock') {
        const deg = Math.min(n * 30, 360 - n * 30);
        return q(`${n} 时整，钟面上时针和分针所成的较小的角是多少度？`, `${deg}°`, [
          `${n * 6}°`,
          `${360 - deg}°`,
          `${deg + 30}°`,
        ]);
      }
      if (t === 'flat')
        return q(`∠1 和 ∠2 合起来是一个平角，∠1 = ${n}°，∠2 = ?`, `${180 - n}°`, [
          `${90 - n > 0 ? 90 - n : 90 + n}°`,
          `${360 - n}°`,
          `${180 + n}°`,
        ]);
      const m = n % 90 === 0 ? 45 : n % 90;
      return q(`∠1 和 ∠2 合起来是一个直角，∠1 = ${m}°，∠2 = ?`, `${90 - m}°`, [`${180 - m}°`, `${90 + m}°`, `${m}°`]);
    },
  },
  'm4.mul3x2': {
    make: (rand) => `${r(rand, 101, 999)}×${r(rand, 11, 99)}`,
    build: (sig) => {
      const [a, b] = sig.split('×').map(Number);
      const p = a * b;
      return calc(a, '×', b, p, [a * (b % 10) + a * Math.floor(b / 10), p + 100, p - 1000 > 0 ? p - 1000 : p + 1000]);
    },
  },
  'm4.div2d': {
    make: (rand) => {
      const d = r(rand, 11, 99);
      return `${d * r(rand, 2, 60)}÷${d}`;
    },
    build: (sig) => {
      const [a, d] = sig.split('÷').map(Number);
      const qq = a / d;
      return calc(a, '÷', d, qq, [qq + 1, qq - 1 > 0 ? qq - 1 : qq + 2, qq * 10]);
    },
  },
  'm4.ops': {
    make: (rand) => {
      const f = r(rand, 0, 2);
      const c = r(rand, 2, 9);
      if (f === 0) return sigOf(f, r(rand, 400, 900), r(rand, 11, 40), c); // a − b × c
      if (f === 1) return sigOf(f, r(rand, 30, 200), r(rand, 1, 20) * c, c); // a − b ÷ c
      const b = r(rand, 1, 9);
      return sigOf(f, b + c * r(rand, 2, 20), b, c); // (a − b) ÷ c × 2 → 简化为 (a − b) ÷ c
    },
    build: (sig) => {
      const [f, a, b, c] = nums(sig);
      if (f === 0) return mixed(`${a} − ${b} × ${c}`, a - b * c, [(a - b) * c > 0 ? (a - b) * c : a + b * c], true);
      if (f === 1)
        return mixed(`${a} − ${b} ÷ ${c}`, a - b / c, [Number.isInteger((a - b) / c) ? (a - b) / c : a + b / c], true);
      return mixed(`(${a} − ${b}) ÷ ${c}`, (a - b) / c, [a - b / c], true);
    },
  },
  'm4.laws': {
    make: (rand) => {
      const f = r(rand, 0, 3);
      if (f === 0) return sigOf(f, r(rand, 11, 99)); // 25 × a × 4
      if (f === 1) return sigOf(f, r(rand, 3, 99)); // 125 × a × 8
      if (f === 2) return sigOf(f, r(rand, 11, 99)); // a × 99 + a
      const a = r(rand, 11, 89);
      return sigOf(f, a, 100 - (a % 100 === 0 ? 50 : a % 100), r(rand, 11, 99)); // a + b + c，a+b 凑整百
    },
    build: (sig) => {
      const [f, a, b, c] = nums(sig);
      if (f === 0) return mixed(`25 × ${a} × 4`, a * 100, [a * 29, a * 10], true, '用简便方法计算');
      if (f === 1) return mixed(`125 × ${a} × 8`, a * 1000, [a * 133, a * 100], true, '用简便方法计算');
      if (f === 2) return mixed(`${a} × 99 + ${a}`, a * 100, [a * 99, a * 98], true, '用简便方法计算');
      return mixed(`${a} + ${c} + ${b}`, a + b + c, [a + b + c + 10, a + c], true, '用简便方法计算');
    },
  },
  'm4.decimal': {
    make: (rand) => {
      const t = r(rand, 0, 3);
      if (t === 0) return sigOf('cmp', r(rand, 1, 9), r(rand, 1, 9), r(rand, 1, 9));
      if (t === 1) return sigOf('x10', r(rand, 11, 999), pick(rand, [10, 100, 1000]));
      if (t === 2) return sigOf('d10', r(rand, 11, 999), pick(rand, [10, 100]));
      return sigOf('mcm', r(rand, 1, 9), r(rand, 1, 9));
    },
    build: (sig) => {
      const [t, x, y, z] = parts(sig);
      const [a, b, c] = [Number(x), Number(y), Number(z)];
      if (t === 'cmp') {
        // 0.ab 与 0.c 比较：常见错误是“位数多的大”
        const u = a * 10 + b;
        const v = c * 10;
        const big = u >= v ? fmt(u, 2) : fmt(v, 2);
        const small = u >= v ? fmt(v, 2) : fmt(u, 2);
        return q(`${fmt(u, 2)} 和 ${fmt(v, 2)}，哪个大？`, big, [small, '一样大']);
      }
      if (t === 'x10')
        return q('算一算', fmt(a * b, 2), [fmt(a * b * 10, 2), fmt(a * b, 3), fmt(a, 2)], `${fmt(a, 2)} × ${b} = ?`);
      if (t === 'd10')
        return q(
          '算一算',
          fmt(a, b === 10 ? 1 : 2),
          [fmt(a, b === 10 ? 2 : 1), fmt(a, 3), String(a * b)],
          `${a} ÷ ${b} = ?`,
        );
      // a 米 b 厘米 = ? 米
      return q(`${a}米${b}厘米 = ( )米`, fmt(a * 100 + b, 2), [`${a}.${b}`, fmt(a * 1000 + b, 3), `${a}${b}`]);
    },
  },
  'm4.triangle': {
    make: (rand) => {
      if (rand() < 0.5) {
        const a = r(rand, 20, 100);
        return sigOf('third', a, r(rand, 20, 160 - a));
      }
      return sigOf('iso', r(rand, 10, 80) * 2);
    },
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [a, b] = [Number(x), Number(y)];
      if (t === 'third')
        return withSteps(
          q(`三角形的两个角分别是 ${a}° 和 ${b}°，第三个角是多少度？`, `${180 - a - b}°`, [`${360 - a - b}°`, `${90 - Math.min(a, b)}°`, `${180 - a - b + 10}°`]),
          ['三角形的三个内角加起来是 180°。', `已知两个角一共：${a}° + ${b}° = ${a + b}°。`, `第三个角：180° − ${a + b}° = ${180 - a - b}°。`],
        );
      return withSteps(
        q(`等腰三角形的顶角是 ${a}°，一个底角是多少度？`, `${(180 - a) / 2}°`, [`${180 - a}°`, `${a / 2}°`, `${(180 - a) / 2 + 10}°`]),
        ['三角形内角和是 180°，等腰三角形的两个底角相等。', `两个底角一共：180° − ${a}° = ${180 - a}°。`, `一个底角：${180 - a}° ÷ 2 = ${(180 - a) / 2}°。`],
      );
    },
  },
  'm4.decaddsub': {
    make: (rand) => {
      const a = r(rand, 101, 999);
      return rand() < 0.5 ? sigOf('+', a, r(rand, 11, 999)) : sigOf('-', a + 500, r(rand, 11, a));
    },
    build: (sig) => {
      const [op, x, y] = parts(sig);
      const [a, b] = [Number(x), Number(y)];
      const ans = op === '+' ? a + b : a - b;
      // 常见错误：末位对齐而不是小数点对齐（把 0.b 当成 0.0b）
      return q(
        '算一算',
        fmt(ans, 2),
        [fmt(op === '+' ? a + b * 10 : a - Math.floor(b / 10), 2), fmt(ans + 10, 2), fmt(ans + 100, 2)],
        `${fmt(a, 2)} ${op === '+' ? '+' : '−'} ${fmt(b, 2)} = ?`,
      );
    },
  },
  'm4.average': {
    make: (rand) => {
      const n = r(rand, 3, 5);
      const avg = r(rand, 60, 95);
      const xs = Array.from({ length: n - 1 }, () => avg + r(rand, -10, 10));
      xs.push(avg * n - xs.reduce((s, x) => s + x, 0));
      return xs.join(':');
    },
    build: (sig) => {
      const xs = nums(sig);
      const avg = xs.reduce((s, x) => s + x, 0) / xs.length;
      return q(`小明几次测验的成绩是 ${xs.join('、')} 分，平均成绩是多少分？`, String(avg), [
        Math.max(...xs),
        Math.min(...xs),
        avg + 2,
      ]);
    },
  },
  'm4.chicken': {
    make: (rand) => {
      const chicken = r(rand, 2, 15);
      const rabbit = r(rand, 2, 15);
      return sigOf(chicken + rabbit, chicken * 2 + rabbit * 4);
    },
    build: (sig) => {
      const [h, l] = nums(sig);
      const rabbit = (l - 2 * h) / 2;
      return withSteps(q(`笼子里有鸡和兔共 ${h} 只，脚共 ${l} 只。兔有几只？`, String(rabbit), [h - rabbit, (4 * h - l) / 2 + 1, rabbit + 2]), [
        `假设 ${h} 只全是鸡，应该有 ${h} × 2 = ${2 * h} 只脚。`,
        `实际有 ${l} 只脚，少算了 ${l} − ${2 * h} = ${l - 2 * h} 只脚。`,
        `每把 1 只鸡换成 1 只兔，脚多 4 − 2 = 2 只，所以兔有 ${l - 2 * h} ÷ 2 = ${rabbit}（只）。`,
        `检查：鸡有 ${h - rabbit} 只，${h - rabbit} × 2 + ${rabbit} × 4 = ${l}（只脚），对了。`,
      ]);
    },
  },

  /* ═══════════════════════ 五年级 ═══════════════════════ */
  'm5.decmul': {
    make: (rand) =>
      rand() < 0.5 ? sigOf('int', r(rand, 11, 99), r(rand, 2, 9)) : sigOf('dec', r(rand, 2, 9), r(rand, 2, 9)),
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [a, b] = [Number(x), Number(y)];
      if (t === 'int')
        return q(
          '算一算',
          fmt(a * b, 1),
          [fmt(a * b, 2), String(a * b), fmt(a * b + 10, 1)],
          `${fmt(a, 1)} × ${b} = ?`,
        );
      // 0.a × 0.b：积的小数位数 = 两个因数小数位数之和
      return q('算一算', fmt(a * b, 2), [fmt(a * b, 1), String(a * b), fmt(a * b, 3)], `0.${a} × 0.${b} = ?`);
    },
  },
  'm5.decdiv': {
    make: (rand) =>
      rand() < 0.5 ? sigOf('int', r(rand, 11, 99), r(rand, 2, 9)) : sigOf('dec', r(rand, 2, 9), r(rand, 2, 9)),
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [qq, d] = [Number(x), Number(y)];
      if (t === 'int')
        return q('算一算', fmt(qq, 1), [String(qq), fmt(qq, 2), fmt(qq + 1, 1)], `${fmt(qq * d, 1)} ÷ ${d} = ?`);
      // 除数是小数：a.b ÷ 0.d = qq
      return q('算一算', String(qq), [fmt(qq, 1), String(qq * 10), fmt(qq, 2)], `${fmt(qq * d, 1)} ÷ 0.${d} = ?`);
    },
  },
  'm5.equation': {
    make: (rand) => {
      const f = r(rand, 0, 2);
      const x = r(rand, 2, 30);
      if (f === 0) return sigOf(f, x, r(rand, 3, 60));
      if (f === 1) return sigOf(f, x, r(rand, 2, 9));
      return sigOf(f, x, r(rand, 2, 9), r(rand, 1, 30));
    },
    build: (sig) => {
      const [f, x, a, b] = nums(sig);
      if (f === 0)
        return q('解方程，x = ?', String(x), [x + 2 * a, Math.abs(x - a) || x + 1, x + 1], `x + ${a} = ${x + a}`);
      if (f === 1) return q('解方程，x = ?', String(x), [x * a * a, x + a, x * a], `${a}x = ${a * x}`);
      return q(
        '解方程，x = ?',
        String(x),
        [x + b, Math.abs(a * x - b) || x + 2, (a * x + 2 * b) / a].filter(Number.isInteger),
        `${a}x + ${b} = ${a * x + b}`,
      );
    },
  },
  'm5.polyarea': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('para', r(rand, 3, 20), r(rand, 2, 15));
      if (t === 1) return sigOf('tri', r(rand, 2, 20) * 2, r(rand, 2, 15));
      const a = r(rand, 2, 10);
      const b = a + r(rand, 1, 10);
      return sigOf('trap', a, b, (a + b) % 2 === 0 ? r(rand, 2, 12) : r(rand, 1, 6) * 2);
    },
    build: (sig) => {
      const [t, x, y, z] = parts(sig);
      const [a, b, h] = [Number(x), Number(y), Number(z)];
      if (t === 'para')
        return q(
          `平行四边形的底是 ${a} 厘米，高是 ${b} 厘米，面积是多少平方厘米？`,
          String(a * b),
          [(a * b) / 2, (a + b) * 2, a * b + a].filter(Number.isInteger),
        );
      if (t === 'tri')
        return withSteps(q(`三角形的底是 ${a} 厘米，高是 ${b} 厘米，面积是多少平方厘米？`, String((a * b) / 2), [a * b, a + b, (a * b) / 2 + b]), [
          '三角形的面积 = 底 × 高 ÷ 2（两个一样的三角形能拼成一个平行四边形）。',
          `底 × 高：${a} × ${b} = ${a * b}。`,
          `再除以 2：${a * b} ÷ 2 = ${(a * b) / 2}（平方厘米）。`,
        ]);
      return withSteps(
        q(`梯形的上底是 ${a} 米，下底是 ${b} 米，高是 ${h} 米，面积是多少平方米？`, String(((a + b) * h) / 2), [(a + b) * h, a * b * h, ((a + b) * h) / 2 + h]),
        ['梯形的面积 =（上底 + 下底）× 高 ÷ 2。', `上底 + 下底：${a} + ${b} = ${a + b}。`, `乘高：${a + b} × ${h} = ${(a + b) * h}。`, `再除以 2：${(a + b) * h} ÷ 2 = ${((a + b) * h) / 2}（平方米）。`],
      );
    },
  },
  'm5.trees': {
    make: (rand) => {
      const d = pick(rand, [2, 3, 4, 5, 10]);
      return sigOf(r(rand, 0, 2), d * r(rand, 5, 30), d);
    },
    build: (sig) => {
      const [t, len, d] = nums(sig);
      const n = len / d;
      if (t === 0)
        return withSteps(q(`一条小路长 ${len} 米，每隔 ${d} 米种一棵树，两端都种，一共种几棵？`, String(n + 1), [n, n - 1, n + 2]), [
          `先算这条路被分成几段：${len} ÷ ${d} = ${n}（段）。`,
          '两端都种：棵数 = 段数 + 1。',
          `${n} + 1 = ${n + 1}（棵）。`,
        ]);
      if (t === 1)
        return withSteps(q(`一条小路长 ${len} 米，每隔 ${d} 米种一棵树，两端都不种，一共种几棵？`, String(n - 1), [n, n + 1, n - 2]), [
          `先算这条路被分成几段：${len} ÷ ${d} = ${n}（段）。`,
          '两端都不种：棵数 = 段数 − 1。',
          `${n} − 1 = ${n - 1}（棵）。`,
        ]);
      return withSteps(q(`一个圆形花坛周长 ${len} 米，每隔 ${d} 米摆一盆花，一共摆几盆？`, String(n), [n + 1, n - 1, n + 2]), [
        `先算一圈被分成几段：${len} ÷ ${d} = ${n}（段）。`,
        '围成一圈（封闭图形）：盆数 = 段数。',
        `答：一共摆 ${n} 盆。`,
      ]);
    },
  },
  'm5.factors': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('count', pick(rand, [12, 16, 18, 20, 24, 28, 30, 36]));
      if (t === 1) return sigOf('prime', pick(rand, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]));
      return sigOf('mul', pick(rand, [2, 3, 5]), r(rand, 0, 99));
    },
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const n = Number(x);
      if (t === 'count') {
        const c = Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0).length;
        return q(`${n} 一共有几个因数？`, String(c), [c - 2, c + 1, c - 1]);
      }
      if (t === 'prime') {
        // 选项：一个质数 + 三个合数（都在 50 以内，且是常见易混的奇数合数）
        const composites = [9, 15, 21, 25, 27, 33, 35, 39, 49, 51].filter((c) => c !== n);
        const k = n % composites.length;
        return q('下面哪个数是质数？', String(n), [
          composites[k],
          composites[(k + 3) % composites.length],
          composites[(k + 6) % composites.length],
        ]);
      }
      // 是 2/3/5 的倍数的数：从 4 个数中选
      const base = 100 + Number(y);
      const cand = [base, base + 1, base + 2, base + 3, base + 4, base + 5];
      const ok = cand.find((c) => c % n === 0)!;
      const bad = cand.filter((c) => c % n !== 0).slice(0, 3);
      return q(`下面哪个数是 ${n} 的倍数？`, String(ok), bad);
    },
  },
  'm5.cuboid': {
    make: (rand) => {
      const t = r(rand, 0, 3);
      if (t === 0) return sigOf('vol', r(rand, 2, 12), r(rand, 2, 10), r(rand, 2, 10));
      if (t === 1) return sigOf('cubeS', r(rand, 2, 12));
      if (t === 2) return sigOf('surf', r(rand, 3, 10), r(rand, 2, 8), r(rand, 2, 6));
      return sigOf('L', r(rand, 2, 9));
    },
    build: (sig) => {
      const [t, x, y, z] = parts(sig);
      const [a, b, c] = [Number(x), Number(y), Number(z)];
      if (t === 'vol')
        return withSteps(
          q(`长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，体积是多少立方厘米？`, String(a * b * c), [2 * (a * b + a * c + b * c), a * b, a + b + c]),
          ['长方体的体积 = 长 × 宽 × 高。', `${a} × ${b} = ${a * b}，${a * b} × ${c} = ${a * b * c}（立方厘米）。`],
        );
      if (t === 'cubeS')
        return withSteps(q(`正方体棱长 ${a} 分米，表面积是多少平方分米？`, String(6 * a * a), [a * a * a, 4 * a * a, 12 * a]), [
          '正方体有 6 个面，每个面都是一样大的正方形。',
          `一个面的面积：${a} × ${a} = ${a * a}（平方分米）。`,
          `6 个面：${a * a} × 6 = ${6 * a * a}（平方分米）。`,
        ]);
      if (t === 'surf')
        return q(
          `长方体长 ${a} 米、宽 ${b} 米、高 ${c} 米，表面积是多少平方米？`,
          String(2 * (a * b + a * c + b * c)),
          [a * b * c, a * b + a * c + b * c, 4 * (a + b + c)],
        );
      return q(`${a}升 = ( )毫升`, String(a * 1000), [a * 100, a * 10, a * 10000]);
    },
  },
  'm5.fraction': {
    make: (rand) => {
      const t = r(rand, 0, 3);
      if (t === 0) {
        const k = r(rand, 2, 6);
        const d = r(rand, 3, 9);
        return sigOf('simp', r(rand, 1, d - 1) * k, d * k);
      }
      if (t === 1) return sigOf('gcd', r(rand, 2, 9) * r(rand, 2, 5), r(rand, 2, 9) * r(rand, 2, 5));
      if (t === 2) return sigOf('lcm', r(rand, 2, 12), r(rand, 2, 12));
      return sigOf('cmp', r(rand, 1, 4), r(rand, 5, 9), r(rand, 1, 4), r(rand, 5, 9));
    },
    build: (sig) => {
      const [t, x, y, z, w] = parts(sig);
      const [a, b, c, d] = [Number(x), Number(y), Number(z), Number(w)];
      if (t === 'simp') {
        const g = gcd(a, b);
        return q(`把 ${a}/${b} 化成最简分数。`, frac(a, b), [
          g > 2 && b % 2 === 0 && a % 2 === 0 ? `${a / 2}/${b / 2}` : `${a}/${b + 1}`,
          `${b / g}/${a / g}`,
          `${a / g + 1}/${b / g}`,
        ]);
      }
      if (t === 'gcd') return q(`${a} 和 ${b} 的最大公因数是多少？`, String(gcd(a, b)), [lcm(a, b), Math.min(a, b), 1]);
      if (t === 'lcm') return q(`${a} 和 ${b} 的最小公倍数是多少？`, String(lcm(a, b)), [gcd(a, b), a * b, a + b]);
      const cmp = [
        { id: '>', text: '>' },
        { id: '<', text: '<' },
        { id: '=', text: '=' },
      ];
      const l = a * d;
      const rr = c * b;
      return {
        prompt: { text: '比较大小', speak: say('比较大小') },
        stem: { text: `${a}/${b} ○ ${c}/${d}` },
        options: cmp,
        answerId: l > rr ? '>' : l < rr ? '<' : '=',
      };
    },
  },
  'm5.fracaddsub': {
    make: (rand) => {
      const b = r(rand, 2, 9);
      let d = r(rand, 2, 9);
      if (d === b) d = b === 9 ? 8 : b + 1;
      const a = r(rand, 1, b - 1);
      const c = r(rand, 1, d - 1);
      return sigOf(rand() < 0.6 || a * d <= c * b ? '+' : '-', a, b, c, d);
    },
    build: (sig) => {
      const [op, x, y, z, w] = parts(sig);
      const [a, b, c, d] = [Number(x), Number(y), Number(z), Number(w)];
      const n = op === '+' ? a * d + c * b : a * d - c * b;
      const ans = frac(n, b * d);
      // 常见错误：分子加分子、分母加分母
      const wrong1 = op === '+' ? frac(a + c, b + d) : frac(Math.abs(a - c) || 1, Math.abs(b - d) || 1);
      return q(
        '算一算（结果化成最简分数）',
        ans,
        [wrong1, `${n}/${b * d}` === ans ? frac(n + 1, b * d) : `${n}/${b * d}`, frac(n + b, b * d)],
        `${a}/${b} ${op === '+' ? '+' : '−'} ${c}/${d} = ?`,
      );
    },
  },

  /* ═══════════════════════ 六年级 ═══════════════════════ */
  'm6.fracmul': {
    make: (rand) => {
      if (rand() < 0.5) {
        const b = r(rand, 2, 9);
        return sigOf('of', b * r(rand, 2, 12), r(rand, 1, b - 1), b);
      }
      return sigOf('ff', r(rand, 1, 8), r(rand, 2, 9), r(rand, 1, 8), r(rand, 2, 9));
    },
    build: (sig) => {
      const [t, x, y, z, w] = parts(sig);
      if (t === 'of') {
        const [n, a, b] = [Number(x), Number(y), Number(z)];
        return q(
          `${n} 的 ${a}/${b} 是多少？`,
          String((n * a) / b),
          [n * a, n / b, (n * b) / a].filter(Number.isInteger),
        );
      }
      const [a, b, c, d] = [Number(x), Number(y), Number(z), Number(w)];
      return q(
        '算一算（结果化成最简分数）',
        frac(a * c, b * d),
        [frac(a * d, b * c), frac(a + c, b + d), frac(a * c, b + d)],
        `${a}/${b} × ${c}/${d} = ?`,
      );
    },
  },
  'm6.fracdiv': {
    make: (rand) => {
      if (rand() < 0.5) {
        const a = r(rand, 1, 8);
        return sigOf('whole', a * r(rand, 2, 9), a, r(rand, a + 1, 10));
      }
      return sigOf('ff', r(rand, 1, 8), r(rand, 2, 9), r(rand, 1, 8), r(rand, 2, 9));
    },
    build: (sig) => {
      const [t, x, y, z, w] = parts(sig);
      if (t === 'whole') {
        const [m, a, b] = [Number(x), Number(y), Number(z)];
        return withSteps(q(`一个数的 ${a}/${b} 是 ${m}，这个数是多少？`, String((m * b) / a), [frac(m * a, b), String(m * b), String(m)]), [
          `已知一个数的几分之几是多少，求这个数，用除法：这个数 = ${m} ÷ ${a}/${b}。`,
          `除以一个分数等于乘它的倒数：${m} × ${b}/${a}。`,
          `${m} × ${b} ÷ ${a} = ${(m * b) / a}。`,
        ]);
      }
      const [a, b, c, d] = [Number(x), Number(y), Number(z), Number(w)];
      // 常见错误：直接分子除分子（用乘法而没有取倒数）
      return q(
        '算一算（结果化成最简分数）',
        frac(a * d, b * c),
        [frac(a * c, b * d), frac(b * c, a * d), frac(a * d + 1, b * c)],
        `${a}/${b} ÷ ${c}/${d} = ?`,
      );
    },
  },
  'm6.ratio': {
    make: (rand) => {
      if (rand() < 0.5) {
        const k = r(rand, 2, 9);
        return sigOf('simp', r(rand, 1, 9) * k, r(rand, 1, 9) * k);
      }
      const a = r(rand, 1, 5);
      const b = r(rand, 1, 5);
      return sigOf('share', a, b === a ? b + 1 : b, r(rand, 2, 12));
    },
    build: (sig) => {
      const [t, x, y, z] = parts(sig);
      const [a, b, k] = [Number(x), Number(y), Number(z)];
      if (t === 'simp') {
        const g = gcd(a, b);
        return q(`化简比 ${a} : ${b}。`, `${a / g} : ${b / g}`, [
          `${b / g} : ${a / g}`,
          frac(a, b),
          `${a / g + 1} : ${b / g}`,
        ]);
      }
      const total = (a + b) * k;
      return q(
        `把 ${total} 个苹果按 ${a} : ${b} 分给甲、乙两人，甲分到几个？`,
        String(a * k),
        [b * k, total / 2, a * k + 1].filter(Number.isInteger),
      );
    },
  },
  'm6.circle': {
    make: (rand) => sigOf(r(rand, 0, 2), r(rand, 1, 10)),
    build: (sig) => {
      const [t, n] = nums(sig);
      if (t === 0)
        return withSteps(q(`圆的半径是 ${n} 厘米，周长是多少厘米？（π 取 3.14）`, fmt(314 * 2 * n, 2), [fmt(314 * n, 2), fmt(314 * n * n, 2), fmt(314 * 4 * n, 2)]), [
          '圆的周长 = 2 × π × 半径。',
          `2 × 3.14 × ${n} = ${fmt(314 * 2 * n, 2)}（厘米）。`,
        ]);
      if (t === 1)
        return withSteps(q(`圆的直径是 ${n} 米，周长是多少米？（π 取 3.14）`, fmt(314 * n, 2), [fmt(314 * 2 * n, 2), fmt(314 * n * n, 2), fmt(314 * (n + 1), 2)]), [
          '圆的周长 = π × 直径。',
          `3.14 × ${n} = ${fmt(314 * n, 2)}（米）。`,
        ]);
      return withSteps(q(`圆的半径是 ${n} 分米，面积是多少平方分米？（π 取 3.14）`, fmt(314 * n * n, 2), [fmt(314 * 2 * n, 2), fmt(314 * n, 2), fmt(314 * 4 * n * n, 2)]), [
        '圆的面积 = π × 半径 × 半径（不是乘 2）。',
        `半径 × 半径：${n} × ${n} = ${n * n}。`,
        `3.14 × ${n * n} = ${fmt(314 * n * n, 2)}（平方分米）。`,
      ]);
    },
  },
  'm6.percent1': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('of', r(rand, 1, 20) * 20, pick(rand, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]));
      if (t === 1) {
        const b = pick(rand, [4, 5, 10, 20, 25, 50]);
        return sigOf('ratio', r(rand, 1, b - 1), b);
      }
      return sigOf('dec', r(rand, 1, 99));
    },
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [a, b] = [Number(x), Number(y)];
      if (t === 'of')
        return q(
          `${a} 的 ${b}% 是多少？`,
          String((a * b) / 100),
          [a * b, (a * b) / 10, a - (a * b) / 100].filter(Number.isInteger),
        );
      if (t === 'ratio')
        return q(`${a} 是 ${b} 的百分之几？`, `${(a * 100) / b}%`, [
          `${(b * 100) / a}%`.replace(/\.\d+/, ''),
          `${a}%`,
          `${(a * 100) / b + 10}%`,
        ]);
      return q(`${fmt(a, 2)} = ( )%`, `${a}%`, [`${a / 10}%`, `${a * 10}%`, `${fmt(a, 2)}%`]);
    },
  },
  'm6.negative': {
    make: (rand) => {
      if (rand() < 0.5) {
        const a = r(rand, 1, 20);
        let b = r(rand, 1, 20);
        if (b === a) b = a + 1;
        return sigOf('cmp', a, b);
      }
      return sigOf('temp', r(rand, 1, 15), r(rand, 1, 15));
    },
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [a, b] = [Number(x), Number(y)];
      if (t === 'cmp') {
        // −a 和 −b 比较：绝对值大的反而小
        const big = a < b ? `-${a}` : `-${b}`;
        const small = a < b ? `-${b}` : `-${a}`;
        return {
          prompt: { text: '哪个数大？', speak: say('哪个数大？') },
          options: [
            { id: `n${a}`, text: `−${a}` },
            { id: `n${b}`, text: `−${b}` },
          ],
          answerId: `n${big.slice(1)}`,
          explanation: `在数轴上，${big.replace('-', '−')} 在 ${small.replace('-', '−')} 的右边。`,
        };
      }
      return q(`白天气温是 ${a}℃，夜里是 −${b}℃，白天比夜里高多少摄氏度？`, `${a + b}℃`, [
        `${Math.abs(a - b)}℃`,
        `${a}℃`,
        `${a + b + 1}℃`,
      ]);
    },
  },
  'm6.percent2': {
    make: (rand) => {
      const t = r(rand, 0, 2);
      if (t === 0) return sigOf('zhe', r(rand, 2, 30) * 10, r(rand, 5, 9));
      if (t === 1) return sigOf('rate', r(rand, 1, 10) * 1000, pick(rand, [2, 3, 4, 5]), r(rand, 1, 3));
      const p = r(rand, 2, 20) * 10;
      return sigOf('which', p, r(rand, 5, 9));
    },
    build: (sig) => {
      const [t, x, y, z] = parts(sig);
      const [p, k, n] = [Number(x), Number(y), Number(z)];
      if (t === 'zhe')
        return withSteps(
          q(`一件衣服原价 ${p} 元，打 ${k} 折出售，现价多少元？`, String((p * k) / 10), [p - k, (p * (10 - k)) / 10, (p * k) / 100].filter(Number.isInteger)),
          [`打 ${k} 折就是按原价的 ${k * 10}% 卖（${k}/10）。`, `${p} × ${k}/10 = ${(p * k) / 10}（元）。`, `答：现价 ${(p * k) / 10} 元。`],
        );
      if (t === 'rate')
        return withSteps(
          q(`把 ${p} 元存入银行，年利率 ${k}%，存 ${n} 年，到期利息是多少元？`, String((p * k * n) / 100), [(p * k) / 100, p + (p * k * n) / 100, (p * k * n) / 10]),
          ['利息 = 本金 × 利率 × 存期（问的是利息，不加本金）。', `一年的利息：${p} × ${k}% = ${(p * k) / 100}（元）。`, `${n} 年：${(p * k) / 100} × ${n} = ${(p * k * n) / 100}（元）。`],
        );
      const now = (p * k) / 10;
      return withSteps(q(`原价 ${p} 元的书包，现价 ${now} 元，打了几折？`, `${k}折`, [`${10 - k}折`, `${k + 1}折`, `${k - 1}折`]), [
        '现价是原价的百分之几，就是打几折。',
        `${now} ÷ ${p} = ${k / 10}，也就是 ${k * 10}%。`,
        `${k * 10}% 就是 ${k} 折。`,
      ]);
    },
  },
  'm6.cylinder': {
    make: (rand) =>
      rand() < 0.5 ? sigOf('cyl', r(rand, 1, 5), r(rand, 2, 10)) : sigOf('cone', r(rand, 1, 5), r(rand, 1, 4) * 3),
    build: (sig) => {
      const [t, x, y] = parts(sig);
      const [rad, h] = [Number(x), Number(y)];
      const cyl = 314 * rad * rad * h; // ×100
      if (t === 'cyl')
        return withSteps(
          q(`圆柱的底面半径是 ${rad} 厘米，高是 ${h} 厘米，体积是多少立方厘米？（π 取 3.14）`, fmt(cyl, 2), [fmt(cyl / 3, 2), fmt(314 * 2 * rad * h, 2), fmt(314 * rad * h, 2)]),
          ['圆柱的体积 = 底面积 × 高。', `底面积：3.14 × ${rad} × ${rad} = ${fmt(314 * rad * rad, 2)}（平方厘米）。`, `乘高：${fmt(314 * rad * rad, 2)} × ${h} = ${fmt(cyl, 2)}（立方厘米）。`],
        );
      return withSteps(
        q(`圆锥的底面半径是 ${rad} 米，高是 ${h} 米，体积是多少立方米？（π 取 3.14）`, fmt(cyl / 3, 2), [fmt(cyl, 2), fmt(314 * rad * h, 2), fmt((cyl * 2) / 3, 2)]),
        ['圆锥的体积 = 底面积 × 高 ÷ 3（是等底等高圆柱的三分之一）。', `底面积：3.14 × ${rad} × ${rad} = ${fmt(314 * rad * rad, 2)}（平方米）。`, `${fmt(314 * rad * rad, 2)} × ${h} ÷ 3 = ${fmt(cyl / 3, 2)}（立方米）。`],
      );
    },
  },
  'm6.proportion': {
    make: (rand) => {
      const a = r(rand, 2, 9);
      const k = r(rand, 2, 6);
      return sigOf(a, r(rand, 2, 9), k);
    },
    build: (sig) => {
      // x : a = (b·k) : (a·k)… 改写为 x : a = c : d，其中 c = b·k、d = a·k，x = b
      const [a, b, k] = nums(sig);
      const c = b * k;
      const d = a * k;
      return q('解比例，x = ?', String(b), [c, d, b + k], `x : ${a} = ${c} : ${d}`);
    },
  },
};

/* ───────── 公共构造 ───────── */

function mulTable(lo: number, hi: number): UpperGen {
  return {
    make: (rand) => (rand() < 0.5 ? `${r(rand, lo, hi)}×${r(rand, 1, 9)}` : `${r(rand, 1, 9)}×${r(rand, lo, hi)}`),
    build: (sig) => {
      const [a, b] = sig.split('×').map(Number);
      const p = a * b;
      return calc(a, '×', b, p, [p + a, p - b, a + b]);
    },
  };
}

function divTable(lo: number, hi: number): UpperGen {
  return {
    make: (rand) => {
      const d = r(rand, lo, hi);
      return `${d * r(rand, 1, 9)}÷${d}`;
    },
    build: (sig) => {
      const [a, d] = sig.split('÷').map(Number);
      const qq = a / d;
      return calc(a, '÷', d, qq, [qq + 1, qq - 1, a - d]);
    },
  };
}

/** 混合运算：题干是算式，常见错误是“从左往右算”或漏了括号 */
function mixed(
  expr: string,
  ans: number,
  wrongs: number[],
  upper = false,
  title?: string,
): ReturnType<UpperGen['build']> {
  return {
    prompt: upper ? { text: title ?? '先算什么？算一算', speak: say(title ?? '算一算') } : CALC,
    stem: { text: `${expr} = ?` },
    options: opts(
      String(ans),
      [...wrongs, ans + 10, ans - 1].filter((x) => Number.isInteger(x) && x >= 0),
    ),
    answerId: String(ans),
  };
}
