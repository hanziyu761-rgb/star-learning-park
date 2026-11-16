/**
 * 每日挑战：思维题生成器（V2.5，本项目原创）。
 *
 * 题型：天平推理、排队问题、填格子（迷你数独）、数图形、数字找规律、图案找规律、找不同类。
 * 每道题由“签名”唯一确定（题目 id = ch:签名），答案全部由程序根据签名计算；
 * 选错时先给“想一想”的提示，不直接给答案。题目、情境均为原创，未复制任何教材或第三方题库。
 * 状态：已通过教师审核。
 */
import { zh } from '@/content/zh';
import type {
  ChoiceExercise,
  ChoiceOption,
  Figure,
  MultiExercise,
  Prompt,
  PuzzleFigure,
  SortExercise,
  Subject,
  Visual,
} from '@/lesson/types';
import type { ThinkDim } from './dims';

export type Rand = () => number;
export type ChallengeBody =
  Omit<ChoiceExercise, 'id' | 'skill'> | Omit<SortExercise, 'id' | 'skill'> | Omit<MultiExercise, 'id' | 'skill'>;
export type ChallengeExercise = (ChoiceExercise | SortExercise | MultiExercise) & { type: ChallengeType };

export type ChallengeType =
  | 'balance'
  | 'queue'
  | 'sudoku'
  | 'rects'
  | 'seq'
  | 'pattern'
  | 'odd'
  // 语文（V2.6）
  | 'zhRiddle'
  | 'zhStory'
  | 'zhInfer'
  | 'zhWords'
  // 英语（V2.6）
  | 'enGuess'
  | 'enOdd'
  | 'enPattern'
  | 'enSentence'
  // 三～六年级（V2.7）
  | 'logic'
  | 'magic'
  | 'numOdd'
  | 'chicken'
  | 'tree'
  | 'age'
  | 'zhIdiom'
  | 'zhConnect'
  | 'zhSentence'
  | 'enRead'
  | 'enLogic'
  // V2.11
  | 'multiway'
  | 'detective'
  // 初中（V5.2）
  | 'jnSeq'
  | 'jnCount'
  | 'jnEq'
  | 'jnPoem'
  | 'jnRhet'
  | 'jnRiddle'
  | 'jnRead';

/** 难度档：1 = 一年级，2 = 二年级，3 = 三、四年级，4 = 五、六年级，5 = 初中（V5.2） */
export type Level = 1 | 2 | 3 | 4 | 5;
export const levelOfGrade = (grade: number): Level => (grade <= 1 ? 1 : grade === 2 ? 2 : grade <= 4 ? 3 : grade <= 6 ? 4 : 5);

export interface ChallengeGen {
  type: ChallengeType;
  subject: Subject;
  name: string;
  dims: ThinkDim[];
  /** 适用的难度档（不填 = 所有年级） */
  levels?: Level[];
  /** 按难度档出题：数更大、格子更多、内容更长 */
  sig: (rand: Rand, level: Level) => string;
  build: (sig: string) => ChallengeBody;
}

/* ───────── 工具 ───────── */

export function seeded(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const int = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
export const pick = <T>(rand: Rand, a: readonly T[]): T => a[Math.floor(rand() * a.length)];
export function shuffle<T>(a: T[], rand: Rand): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const say = (chars: string) => ({ text: chars, lang: 'zh-CN' as const });
export const P = (chars: string, py: string): Prompt => ({ text: zh(chars, py), speak: say(chars) });
const puzzle = (p: PuzzleFigure, alt: string): Visual => ({
  emoji: '',
  figure: { type: 'puzzle', puzzle: p, alt } as Figure,
});

/** 数字选项：正确答案 + 干扰项，顺序由签名决定（同一道题每次一样） */
export function numberChoice(
  sig: string,
  answer: number,
  distractors: number[],
): { options: ChoiceOption[]; answerId: string } {
  const set = [answer];
  for (const d of [...distractors, answer + 1, answer - 1, answer + 2, answer + 3])
    if (d > 0 && !set.includes(d) && set.length < 4) set.push(d);
  const rand = seeded(hash(sig));
  const options = shuffle(set, rand).map((n) => ({ id: String(n), text: String(n), speak: say(String(n)) }));
  return { options, answerId: String(answer) };
}
export function emojiChoice(
  sig: string,
  answer: string,
  others: string[],
): { options: ChoiceOption[]; answerId: string } {
  const rand = seeded(hash(sig));
  const all = shuffle([answer, ...others.filter((o) => o !== answer)], rand);
  return {
    options: all.map((e, i) => ({ id: String(i), visual: { emoji: e } })),
    answerId: String(all.indexOf(answer)),
  };
}

/* ───────── 1. 天平推理 ───────── */

/** 由轻到重 */
const WEIGHTS = [
  { e: '🍓', zh: '草莓', py: 'cǎo méi' },
  { e: '🍎', zh: '苹果', py: 'píng guǒ' },
  { e: '🍐', zh: '梨', py: 'lí' },
  { e: '🍍', zh: '菠萝', py: 'bō luó' },
  { e: '🎃', zh: '南瓜', py: 'nán guā' },
  { e: '🍉', zh: '西瓜', py: 'xī guā' },
] as const;

const balance: ChallengeGen = {
  type: 'balance',
  subject: 'math',
  name: '天平推理',
  dims: ['reason'],
  sig: (rand, level) => {
    const a = int(rand, 0, WEIGHTS.length - 3);
    const b = int(rand, a + 1, WEIGHTS.length - 2);
    const c = int(rand, b + 1, WEIGHTS.length - 1);
    const max = level === 1 ? 3 : level === 4 ? 5 : 4;
    if (level >= 3) {
      // 三、四年级起：三步换算（四种东西）
      const [x, y, z, w] = shuffle([...WEIGHTS.keys()], rand)
        .slice(0, 4)
        .sort((m, n) => m - n);
      return `balance:${x}:${y}:${z}:${int(rand, 2, max)}:${int(rand, 2, max)}:${w}:${int(rand, 2, 3)}`;
    }
    return `balance:${a}:${b}:${c}:${int(rand, 2, max)}:${int(rand, 2, max)}`;
  },
  build: (sig) => {
    const [, a, b, c, k1, k2, d, k3] = sig.split(':').map(Number);
    const [A, B, C] = [WEIGHTS[a], WEIGHTS[b], WEIGHTS[c]];
    if (d !== undefined && !Number.isNaN(d)) {
      const D = WEIGHTS[d];
      const ans3 = k1 * k2 * k3;
      return {
        kind: 'choice',
        prompt: { text: `1个${D.zh}和几个${A.zh}一样重？`, speak: say(`1个${D.zh}和几个${A.zh}一样重？`) },
        stem: {
          visual: puzzle(
            {
              kind: 'balance',
              rows: [
                { left: B.e, leftCount: 1, right: A.e, rightCount: k1 },
                { left: C.e, leftCount: 1, right: B.e, rightCount: k2 },
                { left: D.e, leftCount: 1, right: C.e, rightCount: k3 },
              ],
            },
            `天平：1个${B.zh}=${k1}个${A.zh}；1个${C.zh}=${k2}个${B.zh}；1个${D.zh}=${k3}个${C.zh}`,
          ),
        },
        ...numberChoice(sig, ans3, [k1 * k2 + k3, k1 + k2 + k3, k2 * k3]),
        wrongHint: {
          text: `从下往上一步步换：1个${D.zh}能换几个${C.zh}？再换成${B.zh}，最后换成${A.zh}。`,
          speak: say(`从下往上一步步换。`),
        },
        explanation: `1个${D.zh} = ${k3}个${C.zh} = ${k3}×${k2} = ${k2 * k3}个${B.zh} = ${k2 * k3}×${k1} = ${ans3}个${A.zh}。`,
      };
    }
    const ans = k1 * k2;
    return {
      kind: 'choice',
      prompt: P(`一个${C.zh}和几个${A.zh}一样重？`, `yí gè ${C.py} hé jǐ gè ${A.py} yí yàng zhòng`),
      stem: {
        visual: puzzle(
          {
            kind: 'balance',
            rows: [
              { left: B.e, leftCount: 1, right: A.e, rightCount: k1 },
              { left: C.e, leftCount: 1, right: B.e, rightCount: k2 },
            ],
          },
          `天平：1个${B.zh}和${k1}个${A.zh}一样重；1个${C.zh}和${k2}个${B.zh}一样重`,
        ),
      },
      ...numberChoice(sig, ans, [k1 + k2, k1, k2]),
      wrongHint: P(
        `想一想：一个${C.zh}可以换成几个${B.zh}？每个${B.zh}又能换成几个${A.zh}？`,
        `xiǎng yi xiǎng yí gè ${C.py} kě yǐ huàn chéng jǐ gè ${B.py} měi gè ${B.py} yòu néng huàn chéng jǐ gè ${A.py}`,
      ),
      explanation: `1个${C.zh} = ${k2}个${B.zh}，每个${B.zh} = ${k1}个${A.zh}，所以是 ${Array(k2).fill(k1).join(' + ')} = ${ans} 个${A.zh}。`,
    };
  },
};

/* ───────── 2. 排队问题 ───────── */

const ANIMALS = [
  { e: '🐰', zh: '小兔', py: 'xiǎo tù' },
  { e: '🐱', zh: '小猫', py: 'xiǎo māo' },
  { e: '🐶', zh: '小狗', py: 'xiǎo gǒu' },
  { e: '🐻', zh: '小熊', py: 'xiǎo xióng' },
] as const;

const queue: ChallengeGen = {
  type: 'queue',
  subject: 'math',
  name: '排队问题',
  dims: ['reason'],
  sig: (rand, level) => {
    const max = [5, 9, 15, 30][level - 1];
    return `queue:${pick(rand, ['fb', 'pos'])}:${int(rand, 1, max)}:${int(rand, 1, max)}:${int(rand, 0, ANIMALS.length - 1)}`;
  },
  build: (sig) => {
    const [, mode, as, bs, xs] = sig.split(':');
    const [a, b] = [Number(as), Number(bs)];
    const X = ANIMALS[Number(xs)];
    const head = '小动物排成一队，';
    const headPy = 'xiǎo dòng wù pái chéng yí duì';
    const tail = '这一队一共有几只？';
    const tailPy = 'zhè yí duì yí gòng yǒu jǐ zhī';
    if (mode === 'fb') {
      const ans = a + b + 1;
      return {
        kind: 'choice',
        prompt: P(
          `${head}${X.zh}前面有${a}只，后面有${b}只。${tail}`,
          `${headPy} ${X.py} qián miàn yǒu zhī hòu miàn yǒu zhī ${tailPy}`,
        ),
        stem: { visual: { emoji: X.e } },
        ...numberChoice(sig, ans, [a + b, a + b + 2]),
        wrongHint: P(`别忘了${X.zh}自己也在队里！`, `bié wàng le ${X.py} zì jǐ yě zài duì lǐ`),
        explanation: `前面 ${a} 只 + ${X.zh}自己 1 只 + 后面 ${b} 只 = ${ans} 只。`,
      };
    }
    const ans = a + b - 1;
    return {
      kind: 'choice',
      prompt: P(
        `${head}从前往后数，${X.zh}排第${a}；从后往前数，${X.zh}排第${b}。${tail}`,
        `${headPy} cóng qián wǎng hòu shǔ ${X.py} pái dì cóng hòu wǎng qián shǔ ${X.py} pái dì ${tailPy}`,
      ),
      stem: { visual: { emoji: X.e } },
      ...numberChoice(sig, ans, [a + b, a + b + 1]),
      wrongHint: P(`${X.zh}被数了两次，要去掉一次。`, `${X.py} bèi shǔ le liǎng cì yào qù diào yí cì`),
      explanation: `${a} + ${b} = ${a + b}，${X.zh}被数了两次，再减去 1，一共 ${ans} 只。`,
    };
  },
};

/* ───────── 3. 填格子（迷你数独） ───────── */

const SUDOKU_ICONS = ['🍎', '🍌', '🍇', '🍓'];

/** 列出所有填法（空格少，直接穷举） */
export function sudokuSolutions(n: number, grid: number[]): number[][] {
  const blanks = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  const out: number[][] = [];
  const g = [...grid];
  const ok = (i: number, v: number) => {
    const r = Math.floor(i / n);
    const c = i % n;
    for (let k = 0; k < n; k++) if (g[r * n + k] === v || g[k * n + c] === v) return false;
    return true;
  };
  const go = (k: number) => {
    if (k === blanks.length) return void out.push([...g]);
    const i = blanks[k];
    for (let v = 1; v <= n; v++)
      if (ok(i, v)) {
        g[i] = v;
        go(k + 1);
        g[i] = 0;
      }
  };
  go(0);
  return out;
}

const sudoku: ChallengeGen = {
  type: 'sudoku',
  subject: 'math',
  name: '填格子',
  dims: ['reason', 'observe'],
  sig: (rand, level) => {
    const n = level === 1 ? 3 : 4;
    for (;;) {
      // 拉丁方：循环排列后打乱行、列和图案
      const rows = shuffle([...Array(n).keys()], rand);
      const cols = shuffle([...Array(n).keys()], rand);
      const syms = shuffle(
        [...Array(n).keys()].map((x) => x + 1),
        rand,
      );
      const full = Array.from({ length: n * n }, (_, i) => syms[(rows[Math.floor(i / n)] + cols[i % n]) % n]);
      const target = int(rand, 0, n * n - 1);
      const extra = shuffle(
        [...Array(n * n).keys()].filter((i) => i !== target),
        rand,
      ).slice(0, [3, 6, 7, 8][level - 1]);
      const g = full.map((v, i) => (i === target || extra.includes(i) ? 0 : v));
      const sols = sudokuSolutions(n, g);
      // 问号处的答案必须唯一；同时问号所在的行和列都不能只差它一个（要多想一步）
      const r = Math.floor(target / n);
      const c = target % n;
      const rowBlank = [...Array(n).keys()].filter((k) => g[r * n + k] === 0).length;
      const colBlank = [...Array(n).keys()].filter((k) => g[k * n + c] === 0).length;
      if (sols.length && sols.every((s) => s[target] === full[target]) && (rowBlank > 1 || colBlank > 1))
        return `sudoku:${n}:${g.map((v, i) => (i === target ? 'x' : v)).join('')}:${full[target]}`;
    }
  },
  build: (sig) => {
    const [, ns, gs, as] = sig.split(':');
    const n = Number(ns);
    const icon = (v: number) => SUDOKU_ICONS[v - 1];
    const cells = Array.from({ length: n }, (_, r) =>
      Array.from(gs.slice(r * n, r * n + n), (ch) => (ch === 'x' ? '?' : ch === '0' ? '' : icon(Number(ch)))),
    );
    const ans = Number(as);
    return {
      kind: 'choice',
      prompt: P(
        '每一行、每一列里，每种水果都只出现一次。问号处应该是什么？',
        'měi yì háng měi yí liè lǐ měi zhǒng shuǐ guǒ dōu zhǐ chū xiàn yí cì wèn hào chù yīng gāi shì shén me',
      ),
      stem: {
        visual: puzzle({ kind: 'grid', cells }, `${n}×${n} 的格子，每行每列每种水果只出现一次，问号处要填一种水果`),
      },
      ...emojiChoice(sig, icon(ans), SUDOKU_ICONS.slice(0, n)),
      wrongHint: P(
        '先看问号这一行和这一列，已经有哪些水果了？',
        'xiān kàn wèn hào zhè yì háng hé zhè yí liè yǐ jīng yǒu nǎ xiē shuǐ guǒ le',
      ),
      explanation: `问号所在的行和列里已经出现的水果不能再用，剩下的只有 ${icon(ans)}。`,
    };
  },
};

/* ───────── 4. 数图形 ───────── */

/** 1×n 的长方形条里一共有几个长方形；a×b 的方格里一共有几个正方形 */
export function countRects(rows: number, cols: number, square: boolean): number {
  let total = 0;
  if (square) {
    for (let k = 1; k <= Math.min(rows, cols); k++) total += (rows - k + 1) * (cols - k + 1);
    return total;
  }
  // 所有长方形（含正方形）= C(rows+1,2) × C(cols+1,2)
  return ((rows * (rows + 1)) / 2) * ((cols * (cols + 1)) / 2);
}

const rects: ChallengeGen = {
  type: 'rects',
  subject: 'math',
  name: '数图形',
  dims: ['observe', 'spatial'],
  sig: (rand, level) => {
    if (level === 1) return pick(rand, ['rects:1:2:0', 'rects:1:3:0', 'rects:2:2:1']);
    if (level === 2) return pick(rand, ['rects:1:3:0', 'rects:1:4:0', 'rects:2:2:1', 'rects:2:3:1']);
    if (level === 3) return pick(rand, ['rects:1:5:0', 'rects:2:2:0', 'rects:2:3:1', 'rects:2:4:1']);
    return pick(rand, ['rects:1:6:0', 'rects:2:3:0', 'rects:3:3:1', 'rects:3:4:1']);
  },
  build: (sig) => {
    const [, r, c, sq] = sig.split(':').map(Number);
    const square = sq === 1;
    const ans = countRects(r, c, square);
    const name = square ? '正方形' : '长方形';
    const namePy = square ? 'zhèng fāng xíng' : 'cháng fāng xíng';
    return {
      kind: 'choice',
      prompt: P(`数一数，图中一共有几个${name}？`, `shǔ yi shǔ tú zhōng yí gòng yǒu jǐ gè ${namePy}`),
      stem: {
        visual: puzzle(
          { kind: 'rects', rows: r, cols: c, square },
          square
            ? `${r}行${c}列的小正方形拼成的图形`
            : r === 1
              ? `${c}个小长方形排成一排拼成的图形`
              : `${r}行${c}列的小长方形拼成的大长方形`,
        ),
      },
      ...numberChoice(sig, ans, [r * c, r * c + 1]),
      wrongHint: P(
        `先数单个的小${name}，再数两个、三个合在一起的大${name}。`,
        `xiān shǔ dān gè de xiǎo ${namePy} zài shǔ liǎng gè sān gè hé zài yì qǐ de dà ${namePy}`,
      ),
      explanation: square
        ? `单个的小正方形 ${r * c} 个，大一些的正方形 ${ans - r * c} 个，一共 ${ans} 个。`
        : r > 1
          ? `横着看有 ${(c * (c + 1)) / 2} 种取法，竖着看有 ${(r * (r + 1)) / 2} 种取法，${(c * (c + 1)) / 2} × ${(r * (r + 1)) / 2} = ${ans} 个。`
          : `单个的 ${c} 个，两个合起来的 ${c - 1} 个${c >= 3 ? `，三个合起来的 ${c - 2} 个` : ''}${c >= 4 ? '，四个合起来的 1 个' : ''}，一共 ${ans} 个。`,
    };
  },
};

/* ───────── 5. 数字找规律 ───────── */

export function seqTerms(kind: string, start: number, step: number): number[] {
  const t = [kind === 'square' ? start * start : start];
  for (let i = 1; i < 5; i++) {
    const prev = t[i - 1];
    t.push(
      kind === 'add'
        ? prev + step
        : kind === 'sub'
          ? prev - step
          : kind === 'mul'
            ? prev * step
            : kind === 'square'
              ? (start + i) * (start + i)
              : kind === 'fib'
                ? i === 1
                  ? step
                  : prev + t[i - 2]
                : kind === 'alt'
                  ? i % 2
                    ? prev + step
                    : prev - 1
                  : prev + i,
    );
  }
  return t;
}

const seq: ChallengeGen = {
  type: 'seq',
  subject: 'math',
  name: '数字找规律',
  dims: ['observe', 'reason'],
  sig: (rand, level) => {
    if (level >= 3) {
      const kind = pick(rand, level === 3 ? ['add', 'sub', 'mul', 'square'] : ['mul', 'square', 'fib', 'alt', 'grow']);
      if (kind === 'mul') return `seq:mul:${int(rand, 1, 4)}:${int(rand, 2, 3)}`;
      if (kind === 'square') return `seq:square:${int(rand, 1, 4)}:0`;
      if (kind === 'fib') return `seq:fib:${int(rand, 1, 3)}:${int(rand, 1, 4)}`;
      if (kind === 'alt') return `seq:alt:${int(rand, 2, 10)}:${int(rand, 3, 6)}`;
      if (kind === 'sub') {
        const step = int(rand, 6, 15);
        return `seq:sub:${int(rand, 4 * step + 1, 4 * step + 50)}:${step}`;
      }
      return `seq:${kind}:${int(rand, 10, 60)}:${int(rand, 6, 15)}`;
    }
    const kind = pick(rand, level === 1 ? ['add', 'sub', 'add', 'grow'] : ['add', 'sub', 'grow']);
    const step = kind === 'grow' ? 0 : int(rand, 2, level === 1 ? 3 : 5);
    const start =
      kind === 'sub' ? int(rand, 4 * step + 1, 4 * step + (level === 1 ? 6 : 20)) : int(rand, 1, level === 1 ? 5 : 15);
    return `seq:${kind}:${start}:${step}`;
  },
  build: (sig) => {
    const [, kind, s, d] = sig.split(':');
    const t = seqTerms(kind, Number(s), Number(d));
    const ans = t[4];
    return {
      kind: 'choice',
      prompt: P('找规律，问号处是几？', 'zhǎo guī lǜ wèn hào chù shì jǐ'),
      stem: { text: `${t.slice(0, 4).join('，')}，❓` },
      ...numberChoice(sig, ans, [t[3] + (t[3] - t[2]) + 1, t[3]]),
      wrongHint: ['mul', 'square', 'fib', 'alt'].includes(kind)
        ? {
            text: '看看相邻两个数是什么关系：加？减？乘？还是和前面两个数都有关？',
            speak: say('看看相邻两个数是什么关系。'),
          }
        : P(
            '看看每两个相邻的数，后一个比前一个多几或少几？',
            'kàn kan měi liǎng gè xiāng lín de shù hòu yí gè bǐ qián yí gè duō jǐ huò shǎo jǐ',
          ),
      explanation:
        kind === 'add'
          ? `每次多 ${d}：${t.join('，')}。`
          : kind === 'sub'
            ? `每次少 ${d}：${t.join('，')}。`
            : kind === 'mul'
              ? `每次乘 ${d}：${t.join('，')}。`
              : kind === 'square'
                ? `依次是 ${t.map((v) => `${Math.round(Math.sqrt(v))}×${Math.round(Math.sqrt(v))}`).join('、')}：${t.join('，')}。`
                : kind === 'fib'
                  ? `从第三个数起，每个数等于前两个数的和：${t.join('，')}。`
                  : kind === 'alt'
                    ? `加 ${d}、减 1 交替进行：${t.join('，')}。`
                    : `每次多的数也在变大：+1、+2、+3、+4，所以是 ${t.join('，')}。`,
    };
  },
};

/* ───────── 6. 图案找规律 ───────── */

const PATTERN_ICONS = ['⭐', '🌙', '☀️', '❤️', '🔺', '🔵'];
const PATTERNS: Record<string, number[]> = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2] };

const pattern: ChallengeGen = {
  type: 'pattern',
  subject: 'math',
  name: '图案找规律',
  dims: ['observe'],
  levels: [1, 2],
  sig: (rand, level) => {
    const kind = pick(rand, level === 1 ? ['AB', 'AAB', 'ABB', 'ABC'] : ['AAB', 'ABB', 'ABC']);
    const icons = shuffle([...PATTERN_ICONS.keys()], rand).slice(0, 3);
    // 显示 7 个，问第 8 个；第 8 个落在单元里的位置由长度决定
    return `pattern:${kind}:${icons.join(',')}`;
  },
  build: (sig) => {
    const [, kind, is] = sig.split(':');
    const icons = is.split(',').map((i) => PATTERN_ICONS[Number(i)]);
    const unit = PATTERNS[kind];
    const seqIcons = Array.from({ length: 8 }, (_, i) => icons[unit[i % unit.length]]);
    const ans = seqIcons[7];
    return {
      kind: 'choice',
      prompt: P('找规律，接下来应该是哪一个？', 'zhǎo guī lǜ jiē xià lái yīng gāi shì nǎ yí gè'),
      stem: { text: `${seqIcons.slice(0, 7).join(' ')} ❓` },
      ...emojiChoice(sig, ans, icons),
      wrongHint: P(
        '找一找，哪几个图案一组，在不停地重复？',
        'zhǎo yi zhǎo nǎ jǐ gè tú àn yì zǔ zài bù tíng de chóng fù',
      ),
      explanation: `${unit.map((k) => icons[k]).join('')} 是一组，一直重复，所以下一个是 ${ans}。`,
    };
  },
};

/* ───────── 7. 找不同类 ───────── */

const CATS = [
  { zh: '水果', py: 'shuǐ guǒ', items: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑'] },
  { zh: '动物', py: 'dòng wù', items: ['🐶', '🐱', '🐰', '🐼', '🐯', '🐸'] },
  { zh: '交通工具', py: 'jiāo tōng gōng jù', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢'] },
  { zh: '文具', py: 'wén jù', items: ['✏️', '📏', '✂️', '📒', '🖍️', '📐'] },
] as const;

const odd: ChallengeGen = {
  type: 'odd',
  subject: 'math',
  name: '找不同类',
  dims: ['classify'],
  levels: [1, 2],
  sig: (rand) => {
    const a = int(rand, 0, CATS.length - 1);
    let b = int(rand, 0, CATS.length - 2);
    if (b >= a) b++;
    const three = shuffle([...CATS[a].items.keys()], rand).slice(0, 3);
    return `odd:${a}:${three.join(',')}:${b}:${int(rand, 0, CATS[b].items.length - 1)}`;
  },
  build: (sig) => {
    const [, as, is, bs, js] = sig.split(':');
    const [A, B] = [CATS[Number(as)], CATS[Number(bs)]];
    const three = is.split(',').map((i) => A.items[Number(i)]);
    const ans = B.items[Number(js)];
    return {
      kind: 'choice',
      prompt: P('哪一个和其他三个不是一类？', 'nǎ yí gè hé qí tā sān gè bú shì yí lèi'),
      ...emojiChoice(sig, ans, three),
      wrongHint: P('想一想，其中三个都是什么？', 'xiǎng yi xiǎng qí zhōng sān gè dōu shì shén me'),
      explanation: `${ans} 是${B.zh}，其他三个都是${A.zh}。`,
    };
  },
};

/* ───────── 汇总 ───────── */

/** 数学思维题（V2.5）；语文、英语见 challengesLang.ts，总表见 registry.ts */
export const MATH_CHALLENGES: ChallengeGen[] = [balance, queue, sudoku, rects, seq, pattern, odd];

export const challengeId = (sig: string) => `ch:${sig}`;
