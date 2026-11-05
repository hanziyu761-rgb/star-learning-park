/**
 * 每日挑战：三～六年级新增题型（V2.7，本项目原创）。
 *
 * 数学：逻辑推理（谁喜欢什么）、幻方填数、找不同（数的特点）；五六年级加鸡兔同笼、植树问题、年龄问题。
 * 语文：成语填空、关联词、选出没有毛病的句子。
 * 英语：短文阅读（Read and answer）、比较推理（Who is the tallest?）。
 * 三年级起的中文不注拼音（与教材一致）。答案全部由程序计算或按数据给出；逻辑题用穷举确认答案唯一。
 * 状态：待教师审核。
 */
import { enPrompt, enS } from '@/content/zh';
import type { ChoiceOption, Figure, Prompt, Visual } from '@/lesson/types';
import { hash, int, numberChoice, pick, say, seeded, shuffle, type ChallengeGen, type Rand } from './challenges';
import { enGuess, enOdd, enPattern, enSentence, zhInfer, zhRiddle, zhStory, zhWords } from './challengesLang';
import {
  CONNECT_ITEMS,
  DAYS,
  EN_CATS_UPPER,
  EN_READ,
  GUESS_HIGH,
  GUESS_MID,
  IDIOMS,
  INFERS_HIGH,
  INFERS_MID,
  MONTHS,
  ORDINALS,
  RIDDLES_HIGH,
  SENTENCE_CORRECT,
  SENTENCE_WRONG,
  SENTENCES_HIGH,
  SENTENCES_MID,
  STORIES_HIGH,
  STORIES_MID,
  TENS,
} from './contentUpper';

const T = (text: string, speakText?: string): Prompt => ({ text, speak: say(speakText ?? text) });
const opt = (id: string, text: string): ChoiceOption => ({ id, text, speak: say(text) });
const grid = (cells: string[][], alt: string): Visual => ({
  emoji: '',
  figure: { type: 'puzzle', puzzle: { kind: 'grid', cells }, alt } as Figure,
});
function ordered<T>(sig: string, answer: T, others: T[]): { list: T[]; answerIndex: number } {
  const list = shuffle([answer, ...others], seeded(hash(sig)));
  return { list, answerIndex: list.indexOf(answer) };
}
function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  for (const p of permutations(n - 1))
    for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}

/* ═════════════ 数学 ═════════════ */

/* 1. 逻辑推理：几个小朋友各喜欢一样东西，根据线索推出谁喜欢什么 */
const KIDS = ['小明', '小红', '小刚', '小丽'];
const THEMES = [
  { name: '运动', items: ['足球', '篮球', '跳绳', '游泳'] },
  { name: '水果', items: ['苹果', '香蕉', '葡萄', '西瓜'] },
  { name: '动物', items: ['小猫', '小狗', '小兔', '金鱼'] },
];
/** 线索：[小朋友, 东西, 是/不是] */
export type LogicClue = [number, number, boolean];
export const logicSatisfies = (perm: number[], clues: LogicClue[]) =>
  clues.every(([k, it, yes]) => (perm[k] === it) === yes);

/** 由签名还原线索与问题（同一签名每次一样）；线索保证答案唯一，并去掉多余线索 */
export function logicPuzzle(n: number, perm: number[], seed: number): { clues: LogicClue[]; ask: number } {
  const rand = seeded(seed);
  const all: LogicClue[] = [];
  for (let k = 0; k < n; k++) for (let it = 0; it < n; it++) all.push([k, it, perm[k] === it]);
  // 多用“不是”的线索，最多一条“是”的线索
  const negs = shuffle(
    all.filter((c) => !c[2]),
    rand,
  );
  const pos = shuffle(
    all.filter((c) => c[2]),
    rand,
  );
  const perms = permutations(n);
  const count = (cl: LogicClue[]) => perms.filter((p) => logicSatisfies(p, cl)).length;
  let clues: LogicClue[] = n === 4 ? [pos[0]] : [];
  for (const c of negs) {
    if (count(clues) === 1) break;
    clues.push(c);
  }
  if (count(clues) !== 1) clues = [...clues, ...pos.slice(clues.some((c) => c[2]) ? 1 : 0, 2)];
  // 去掉多余线索
  for (const c of [...clues]) {
    const rest = clues.filter((x) => x !== c);
    if (count(rest) === 1) clues = rest;
  }
  // 问一个线索里没有直接说出答案的小朋友
  const told = new Set(clues.filter((c) => c[2]).map((c) => c[0]));
  const candidates = [...Array(n).keys()].filter((k) => !told.has(k));
  const ask = candidates[Math.floor(rand() * candidates.length)] ?? 0;
  return { clues: shuffle(clues, rand), ask };
}

const logic: ChallengeGen = {
  type: 'logic',
  subject: 'math',
  name: '逻辑推理',
  dims: ['reason'],
  levels: [3, 4],
  sig: (rand, level) => {
    const n = level === 3 ? 3 : 4;
    const perm = shuffle([...Array(n).keys()], rand);
    return `logic:${n}:${int(rand, 0, THEMES.length - 1)}:${perm.join('')}:${int(rand, 1, 999999)}`;
  },
  build: (sig) => {
    const [, ns, th, ps, seed] = sig.split(':');
    const n = Number(ns);
    const theme = THEMES[Number(th)];
    const perm = Array.from(ps, Number);
    const { clues, ask } = logicPuzzle(n, perm, Number(seed));
    const kids = KIDS.slice(0, n);
    const items = theme.items.slice(0, n);
    const lines = clues.map(([k, it, yes]) => `${kids[k]}最喜欢的${yes ? '是' : '不是'}${items[it]}。`);
    const { list, answerIndex } = ordered(
      sig,
      items[perm[ask]],
      items.filter((_, i) => i !== perm[ask]),
    );
    return {
      kind: 'choice',
      prompt: T(
        `${kids.join('、')}每人最喜欢一种${theme.name}（${items.join('、')}），各不相同。${kids[ask]}最喜欢什么？`,
      ),
      stem: { text: lines.join('\n') },
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('可以画一张表：一行一个人，一列一种东西，根据线索把“不是”的格子打叉。'),
      explanation: `排除法：${kids.map((k, i) => `${k}—${items[perm[i]]}`).join('，')}。`,
    };
  },
};

/* 2. 幻方：每行、每列、两条斜线上的三个数和相等 */
const BASE_MAGIC = [2, 7, 6, 9, 5, 1, 4, 3, 8];
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
function transform(g: number[], t: number): number[] {
  const at = (r: number, c: number) => g[r * 3 + c];
  const out: number[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const [rr, cc] = [
        [r, c],
        [c, 2 - r],
        [2 - r, 2 - c],
        [2 - c, r],
        [r, 2 - c],
        [2 - r, c],
        [c, r],
        [2 - c, 2 - r],
      ][t];
      out.push(at(rr, cc));
    }
  return out;
}
/** 只用“某条线只差一个数”一步步填，能否填出 target（保证不用猜） */
export function magicSolvable(g: (number | null)[], sum: number, target: number): boolean {
  const x = [...g];
  for (let changed = true; changed && x[target] === null;) {
    changed = false;
    for (const line of LINES) {
      const blanks = line.filter((i) => x[i] === null);
      if (blanks.length === 1) {
        x[blanks[0]] = sum - line.reduce((s, i) => s + (x[i] ?? 0), 0);
        changed = true;
      }
    }
  }
  return x[target] !== null;
}

const magic: ChallengeGen = {
  type: 'magic',
  subject: 'math',
  name: '幻方填数',
  dims: ['reason', 'observe'],
  levels: [3, 4],
  sig: (rand, level) => {
    const t = int(rand, 0, 7);
    const k = level === 3 ? 0 : int(rand, 1, 10);
    const full = transform(BASE_MAGIC, t).map((v) => v + k);
    const sum = 15 + 3 * k;
    for (;;) {
      const hide = shuffle([...Array(9).keys()], rand).slice(0, level === 3 ? 4 : 5);
      const target = hide[0];
      const g = full.map((v, i) => (hide.includes(i) ? null : v));
      // 问号处所在的线都不能只差它一个（要先填别的格）
      const direct = LINES.some((l) => l.includes(target) && l.filter((i) => g[i] === null).length === 1);
      if (magicSolvable(g, sum, target) && !direct) return `magic:${t}:${k}:${hide.join('')}`;
    }
  },
  build: (sig) => {
    const [, ts, ks, hs] = sig.split(':');
    const k = Number(ks);
    const full = transform(BASE_MAGIC, Number(ts)).map((v) => v + k);
    const hide = Array.from(hs, Number);
    const target = hide[0];
    const sum = 15 + 3 * k;
    const cells = [0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => {
        const i = r * 3 + c;
        return i === target ? '?' : hide.includes(i) ? '' : String(full[i]);
      }),
    );
    const ans = full[target];
    return {
      kind: 'choice',
      prompt: T(`在九宫格里，每一横行、每一竖列、两条斜线上的三个数加起来都等于 ${sum}。问号处是几？`),
      stem: { visual: grid(cells, `九宫格，每行每列每条斜线三个数的和都是 ${sum}，有几个空格`) },
      ...numberChoice(sig, ans, [ans + 2, ans - 1, sum - ans]),
      wrongHint: T('先找一条只差一个数的线，把那个空格填出来，再接着往下填。'),
      explanation: `完整的九宫格：${[0, 1, 2].map((r) => full.slice(r * 3, r * 3 + 3).join(' ')).join(' / ')}，问号处是 ${ans}。`,
    };
  },
};

/* 3. 找不同（数的特点） */
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
export const NUM_PROPS: Record<string, { name: string; test: (n: number) => boolean; levels: number[] }> = {
  even: { name: '双数（偶数）', test: (n) => n % 2 === 0, levels: [3, 4] },
  mult5: { name: '5 的倍数', test: (n) => n % 5 === 0, levels: [3, 4] },
  mult3: { name: '3 的倍数', test: (n) => n % 3 === 0, levels: [4] },
  mult9: { name: '9 的倍数', test: (n) => n % 9 === 0, levels: [4] },
  prime: { name: '质数', test: isPrime, levels: [4] },
};
/** 这组数里，按某个特点“只有一个不同”的数有哪些（用来保证答案唯一） */
export function oddCandidates(nums: number[], level: number): Set<number> {
  const out = new Set<number>();
  for (const p of Object.values(NUM_PROPS)) {
    if (!p.levels.includes(level)) continue;
    const yes = nums.filter(p.test);
    const no = nums.filter((x) => !p.test(x));
    if (yes.length === 1) out.add(yes[0]);
    if (no.length === 1) out.add(no[0]);
  }
  return out;
}

const numOdd: ChallengeGen = {
  type: 'numOdd',
  subject: 'math',
  name: '找不同（数）',
  dims: ['classify', 'reason'],
  levels: [3, 4],
  sig: (rand, level) => {
    const keys = Object.keys(NUM_PROPS).filter((k) => NUM_PROPS[k].levels.includes(level));
    for (;;) {
      const key = pick(rand, keys);
      const p = NUM_PROPS[key];
      const yes: number[] = [];
      while (yes.length < 3) {
        const v = int(rand, 10, 99);
        if (p.test(v) && !yes.includes(v)) yes.push(v);
      }
      let odd = int(rand, 10, 99);
      while (p.test(odd) || yes.includes(odd)) odd = int(rand, 10, 99);
      const nums = [...yes, odd];
      const c = oddCandidates(nums, level);
      if (c.size === 1 && c.has(odd)) return `numOdd:${key}:${level}:${nums.join(',')}`;
    }
  },
  build: (sig) => {
    const [, key, , ns] = sig.split(':');
    const nums = ns.split(',').map(Number);
    const p = NUM_PROPS[key];
    const odd = nums[3];
    const { list, answerIndex } = ordered(sig, odd, nums.slice(0, 3));
    return {
      kind: 'choice',
      prompt: T('下面四个数里，哪一个和其他三个不一样？'),
      options: list.map((x, i) => opt(String(i), String(x))),
      answerId: String(answerIndex),
      wrongHint: T('想一想：是不是双数？是不是 3 或 5 的倍数？有几个因数？'),
      explanation: `${nums.slice(0, 3).join('、')} 都是${p.name}，${odd} 不是。`,
    };
  },
};

/* 4. 鸡兔同笼（五、六年级） */
const chicken: ChallengeGen = {
  type: 'chicken',
  subject: 'math',
  name: '鸡兔同笼',
  dims: ['reason'],
  levels: [4],
  sig: (rand) => {
    const rabbits = int(rand, 1, 12);
    const chickens = int(rand, 1, 12);
    return `chicken:${chickens}:${rabbits}`;
  },
  build: (sig) => {
    const [, c, r] = sig.split(':').map(Number);
    const heads = c + r;
    const legs = 2 * c + 4 * r;
    return {
      kind: 'choice',
      prompt: T(`笼子里有鸡和兔，从上面数有 ${heads} 个头，从下面数有 ${legs} 条腿。兔有几只？`),
      stem: { text: '🐔 🐰' },
      ...numberChoice(sig, r, [c, Math.floor(legs / 4), heads - 1]),
      wrongHint: T('假设全是鸡，一共有几条腿？比实际少了多少条？每把一只鸡换成兔，多 2 条腿。'),
      explanation: `假设 ${heads} 只全是鸡，有 ${heads * 2} 条腿，比实际少 ${legs - heads * 2} 条；每只兔比鸡多 2 条腿，兔有 ${legs - heads * 2} ÷ 2 = ${r} 只。`,
    };
  },
};

/* 5. 植树问题 */
export const treeCount = (length: number, gap: number, mode: string) =>
  length / gap + (mode === 'both' ? 1 : mode === 'none' ? -1 : 0);

const tree: ChallengeGen = {
  type: 'tree',
  subject: 'math',
  name: '植树问题',
  dims: ['reason', 'spatial'],
  levels: [4],
  sig: (rand) => {
    const gap = pick(rand, [2, 3, 4, 5, 10]);
    const segs = int(rand, 4, 20);
    return `tree:${gap * segs}:${gap}:${pick(rand, ['both', 'one', 'none'])}`;
  },
  build: (sig) => {
    const [, ls, gs, mode] = sig.split(':');
    const [L, g] = [Number(ls), Number(gs)];
    const ans = treeCount(L, g, mode);
    const how = { both: '两端都要种', one: '只在一端种', none: '两端都不种' }[mode]!;
    return {
      kind: 'choice',
      prompt: T(`在一条长 ${L} 米的小路一边种树，每隔 ${g} 米种一棵，${how}。一共要种几棵树？`),
      stem: { text: '🌳——🌳——🌳——🌳' },
      ...numberChoice(
        sig,
        ans,
        [L / g, L / g + 1, L / g - 1].filter((x) => x !== ans),
      ),
      wrongHint: T('先算一共有几段（间隔），再想想：两端都种、只种一端、两端都不种，树的棵数和段数有什么关系？'),
      explanation: `${L} ÷ ${g} = ${L / g} 段；${how}，所以是 ${L / g}${mode === 'both' ? ' + 1' : mode === 'none' ? ' − 1' : ''} = ${ans} 棵。`,
    };
  },
};

/* 6. 年龄问题 */
const age: ChallengeGen = {
  type: 'age',
  subject: 'math',
  name: '年龄问题',
  dims: ['reason'],
  levels: [4],
  sig: (rand) => {
    for (;;) {
      const child = int(rand, 4, 12);
      const k = int(rand, 2, 4);
      const years = int(rand, 1, 10);
      const father = k * (child + years) - years;
      if (father - child >= 22 && father - child <= 40) return `age:${father}:${child}:${k}`;
    }
  },
  build: (sig) => {
    const [, f, c, k] = sig.split(':').map(Number);
    const diff = f - c;
    // (f + n) = k (c + n)  →  n = (f − k c) / (k − 1)
    const ans = (f - k * c) / (k - 1);
    return {
      kind: 'choice',
      prompt: T(`今年爸爸 ${f} 岁，小明 ${c} 岁。几年后，爸爸的年龄正好是小明的 ${k} 倍？`),
      ...numberChoice(sig, ans, [ans + 1, ans + 2, Math.max(1, ans - 1)]),
      wrongHint: T('年龄差永远不变。到那时，爸爸比小明大的岁数，正好是小明年龄的几倍？'),
      explanation: `年龄差 ${diff} 岁不变；那时爸爸是小明的 ${k} 倍，差是小明的 ${k - 1} 倍，小明那时 ${diff} ÷ ${k - 1} = ${diff / (k - 1)} 岁，所以是 ${diff / (k - 1)} − ${c} = ${ans} 年后。`,
    };
  },
};

export const MATH_UPPER: ChallengeGen[] = [logic, magic, numOdd, chicken, tree, age];

/* ═════════════ 语文 ═════════════ */

const zhIdiom: ChallengeGen = {
  type: 'zhIdiom',
  subject: 'chinese',
  name: '成语填空',
  dims: ['observe', 'reason'],
  levels: [3, 4],
  sig: (rand, level) => `zhIdiom:${int(rand, 0, level === 3 ? 9 : IDIOMS.length - 1)}`,
  build: (sig) => {
    const it = IDIOMS[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    return {
      kind: 'choice',
      prompt: T('填一个字，把成语补完整。'),
      stem: { text: it.blank },
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('想一想这个成语讲的故事或意思。'),
      explanation: `${it.blank.replace('（ ）', it.ans)}：${it.meaning}`,
    };
  },
};

const zhConnect: ChallengeGen = {
  type: 'zhConnect',
  subject: 'chinese',
  name: '关联词',
  dims: ['reason'],
  levels: [3, 4],
  sig: (rand) => `zhConnect:${int(rand, 0, CONNECT_ITEMS.length - 1)}`,
  build: (sig) => {
    const it = CONNECT_ITEMS[Number(sig.split(':')[1])];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    const [a, b] = it.ans.split('…');
    return {
      kind: 'choice',
      prompt: T('选一组关联词填进括号里，句子最通顺。'),
      stem: { text: it.sentence },
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('想一想前后两部分是什么关系：原因和结果？转折？假设？还是并列？'),
      explanation: it.sentence.replace('（ ）', a).replace('（ ）', b),
    };
  },
};

const zhSentence: ChallengeGen = {
  type: 'zhSentence',
  subject: 'chinese',
  name: '火眼金睛',
  dims: ['observe', 'reason'],
  levels: [3, 4],
  sig: (rand, level) => {
    const pool = SENTENCE_WRONG.map((_, i) => i).filter((i) => level === 4 || !SENTENCE_WRONG[i].hard);
    const wrongs = shuffle(pool, rand).slice(0, 3);
    return `zhSentence:${int(rand, 0, SENTENCE_CORRECT.length - 1)}:${wrongs.join(',')}`;
  },
  build: (sig) => {
    const [, cs, ws] = sig.split(':');
    const right = SENTENCE_CORRECT[Number(cs)];
    const wrongs = ws.split(',').map((i) => SENTENCE_WRONG[Number(i)]);
    const { list, answerIndex } = ordered(
      sig,
      right,
      wrongs.map((w) => w.text),
    );
    return {
      kind: 'choice',
      prompt: T('下面哪个句子没有毛病？'),
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('一句一句读：有没有缺少“谁”？词语能不能搭配？有没有意思重复或前后矛盾？'),
      explanation: `其他句子的毛病：${wrongs.map((w) => `“${w.text}”${w.why}`).join('；')}。`,
    };
  },
};

export const CHINESE_UPPER: ChallengeGen[] = [zhIdiom, zhConnect, zhSentence];

/* ═════════════ 英语 ═════════════ */

const enRead: ChallengeGen = {
  type: 'enRead',
  subject: 'english',
  name: 'Read and answer',
  dims: ['reason'],
  levels: [3, 4],
  sig: (rand, level) => {
    const pool = level === 3 ? EN_READ.mid : EN_READ.high;
    return `enRead:${level === 3 ? 'm' : 'h'}:${int(rand, 0, pool.length - 1)}`;
  },
  build: (sig) => {
    const [, band, is] = sig.split(':');
    const it = (band === 'm' ? EN_READ.mid : EN_READ.high)[Number(is)];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    return {
      kind: 'choice',
      prompt: enPrompt(it.q, it.zh),
      stem: { text: it.text },
      options: list.map((x, i) => ({ id: String(i), text: x, speak: enS(x) })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Read the story again. Find the clue.', '再读一遍短文，找找线索。'),
      explanation: `${it.ans}（${it.why}）`,
    };
  },
};

/* 比较推理：Amy is taller than Ben. … Who is the tallest? */
const NAMES = ['Amy', 'Ben', 'Cindy', 'Dave'];
const RELS = [
  { er: 'taller', most: 'tallest', least: 'shortest', zh: ['最高', '最矮'] },
  { er: 'older', most: 'oldest', least: 'youngest', zh: ['年龄最大', '年龄最小'] },
  { er: 'faster', most: 'fastest', least: 'slowest', zh: ['跑得最快', '跑得最慢'] },
];
/** 根据“X 比 Y 更……”的线索，穷举所有排名，返回满足的排名（第一个是最“……”的） */
export function rankings(n: number, clues: [number, number][]): number[][] {
  return permutations(n).filter((order) => clues.every(([a, b]) => order.indexOf(a) < order.indexOf(b)));
}

const enLogic: ChallengeGen = {
  type: 'enLogic',
  subject: 'english',
  name: 'Who is the tallest?',
  dims: ['reason'],
  levels: [3, 4],
  sig: (rand: Rand, level) => {
    const n = level === 3 ? 3 : 4;
    const order = shuffle([...Array(n).keys()], rand);
    return `enLogic:${n}:${int(rand, 0, RELS.length - 1)}:${order.join('')}:${pick(rand, ['most', 'least'])}:${int(rand, 1, 9999)}`;
  },
  build: (sig) => {
    const [, ns, rs, os, which, seed] = sig.split(':');
    const n = Number(ns);
    const rel = RELS[Number(rs)];
    const order = Array.from(os, Number); // 从“最……”到“最不……”
    // 相邻两人一条线索，顺序打乱
    const clues = shuffle(
      order.slice(0, -1).map((a, i) => [a, order[i + 1]] as [number, number]),
      seeded(Number(seed)),
    );
    const ans = which === 'most' ? NAMES[order[0]] : NAMES[order[n - 1]];
    const names = NAMES.slice(0, n);
    const word = which === 'most' ? rel.most : rel.least;
    const { list, answerIndex } = ordered(
      sig,
      ans,
      names.filter((x) => x !== ans),
    );
    return {
      kind: 'choice',
      prompt: enPrompt(`Who is the ${word}?`, `谁${which === 'most' ? rel.zh[0] : rel.zh[1]}？`),
      stem: { text: clues.map(([a, b]) => `${NAMES[a]} is ${rel.er} than ${NAMES[b]}.`).join('\n') },
      options: list.map((x, i) => ({ id: String(i), text: x, speak: enS(x) })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Put them in a line, from the most to the least.', '把他们从“最……”到“最不……”排成一排。'),
      explanation: `${order.map((i) => NAMES[i]).join(' > ')}，所以是 ${ans}。`,
    };
  },
};

export const ENGLISH_UPPER: ChallengeGen[] = [enRead, enLogic];

/* ═════════════ 原有题型的三～六年级题库（签名第二段为 h / m，旧签名不变） ═════════════ */

/** 三、四年级用 m，五、六年级用 h；一、二年级沿用原来的题 */
function banded(
  base: ChallengeGen,
  bands: (level: 3 | 4, rand: Rand) => string,
  build: (sig: string) => ReturnType<ChallengeGen['build']>,
): ChallengeGen {
  return {
    ...base,
    levels: [1, 2, 3, 4],
    sig: (rand, level) => (level >= 3 ? bands(level as 3 | 4, rand) : base.sig(rand, level)),
    build: (sig) => (/^[a-zA-Z]+:[mhu]:/.test(sig) ? build(sig) : base.build(sig)),
  };
}
const idx = (sig: string) => Number(sig.split(':')[2]);
function scrambledOrder(sig: string, n: number): number[] {
  const rand = seeded(hash(`${sig}#sort`));
  for (;;) {
    const order = shuffle([...Array(n).keys()], rand);
    if (order.some((v, i) => v !== i)) return order;
  }
}

export const zhRiddleAll = banded(
  zhRiddle,
  (_, rand) => `zhRiddle:h:${int(rand, 0, RIDDLES_HIGH.length - 1)}`,
  (sig) => {
    const it = RIDDLES_HIGH[idx(sig)];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    return {
      kind: 'choice',
      prompt: T(`猜字谜：${it.riddle}（打一字）`),
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('把谜面里的字拆开、拼合，想想能组成什么字。'),
      explanation: `${it.riddle}——${it.ans}：${it.why}。`,
    };
  },
);

export const zhStoryAll = banded(
  zhStory,
  (level, rand) =>
    `zhStory:${level === 3 ? 'm' : 'h'}:${int(rand, 0, (level === 3 ? STORIES_MID : STORIES_HIGH).length - 1)}`,
  (sig) => {
    const story = (sig.split(':')[1] === 'm' ? STORIES_MID : STORIES_HIGH)[idx(sig)];
    const show = scrambledOrder(sig, story.length);
    return {
      kind: 'sort',
      prompt: T('按事情发生的先后顺序，把句子排一排。'),
      items: show.map((k) => ({ id: String(k), text: story[k] })),
      order: story.map((_, k) => String(k)),
      wrongHint: T('找时间词（早上、春天、最后……）和前因后果。'),
      explanation: story.join(''),
    };
  },
);

export const zhInferAll = banded(
  zhInfer,
  (level, rand) =>
    `zhInfer:${level === 3 ? 'm' : 'h'}:${int(rand, 0, (level === 3 ? INFERS_MID : INFERS_HIGH).length - 1)}`,
  (sig) => {
    const it = (sig.split(':')[1] === 'm' ? INFERS_MID : INFERS_HIGH)[idx(sig)];
    const { list, answerIndex } = ordered(sig, it.ans, it.others);
    return {
      kind: 'choice',
      prompt: T(it.q, `${it.text}${it.q}`),
      stem: { text: it.text },
      options: list.map((x, i) => opt(String(i), x)),
      answerId: String(answerIndex),
      wrongHint: T('再读一读短文，找一找能说明问题的词句。'),
      explanation: `从短文中的线索可以推断：${it.ans}。`,
    };
  },
);

export const zhWordsLow: ChallengeGen = { ...zhWords, levels: [1, 2] };

export const enGuessAll = banded(
  enGuess,
  (level, rand) =>
    `enGuess:${level === 3 ? 'm' : 'h'}:${int(rand, 0, (level === 3 ? GUESS_MID : GUESS_HIGH).length - 1)}`,
  (sig) => {
    const g = (sig.split(':')[1] === 'm' ? GUESS_MID : GUESS_HIGH)[idx(sig)];
    const { list, answerIndex } = ordered(sig, g.ans, g.others);
    return {
      kind: 'choice',
      prompt: enPrompt(`${g.clue} What is it?`, `${g.zh}它是什么？`),
      options: list.map((x, i) => ({
        id: String(i),
        text: x.w,
        visual: x.e ? { emoji: x.e } : undefined,
        speak: enS(x.w),
      })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Read the clues again.', '再读一遍线索。'),
      explanation: `${g.clue} → ${g.ans.w}`,
    };
  },
);

export const enOddAll = banded(
  enOdd,
  (level, rand) => `enOdd:${level === 3 ? 'm' : 'h'}:${int(rand, 1, 999999)}`,
  (sig) => {
    // 签名：enOdd:m|h:随机数 → 由随机数决定类别和词（同一签名每次一样）
    const band = sig.split(':')[1];
    const rand = seeded(hash(sig));
    const cats = EN_CATS_UPPER.filter((c) => band === 'h' || !c.high);
    const a = Math.floor(rand() * cats.length);
    let b = Math.floor(rand() * (cats.length - 1));
    if (b >= a) b++;
    const three = shuffle(cats[a].items, rand).slice(0, 3);
    const odd = cats[b].items[Math.floor(rand() * cats[b].items.length)];
    const { list, answerIndex } = ordered(sig, odd, three);
    return {
      kind: 'choice',
      prompt: enPrompt('Which one is different?', '哪一个和其他三个不是一类？'),
      options: list.map((x, i) => ({ id: String(i), text: x, speak: enS(x) })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('What are the other three?', '其他三个都属于哪一类？'),
      explanation: `${odd} 属于“${cats[b].zh}”，其他三个都属于“${cats[a].zh}”。`,
    };
  },
);

/** 文字接龙：星期、月份、序数词、整十数（五、六年级还有“隔一个”） */
export function enUpperSeq(sig: string): { shown: string[]; ans: string; choices: string[]; rule: string } {
  const rand = seeded(hash(sig));
  const band = sig.split(':')[1];
  const kinds =
    band === 'h'
      ? ['days', 'months', 'ordinal', 'tens', 'daysSkip', 'monthsSkip']
      : ['days', 'months', 'ordinal', 'tens'];
  const kind = kinds[Math.floor(rand() * kinds.length)];
  const list = kind.startsWith('days')
    ? DAYS
    : kind.startsWith('months')
      ? MONTHS
      : kind === 'ordinal'
        ? ORDINALS
        : TENS;
  const step = kind.endsWith('Skip') ? 2 : 1;
  const wrap = kind.startsWith('days') || kind.startsWith('months');
  const maxStart = wrap ? list.length - 1 : list.length - 1 - 4 * step;
  const start = Math.floor(rand() * (maxStart + 1));
  const at = (i: number) => list[(start + i * step) % list.length];
  const shown = [0, 1, 2, 3].map(at);
  const ans = at(4);
  const choices = [
    list[(start + 4 * step + 1) % list.length],
    at(3),
    list[(start + 4 * step + list.length - 1) % list.length],
  ].filter((c, i, arr) => c !== ans && arr.indexOf(c) === i);
  const rule = {
    days: '星期顺序',
    months: '月份顺序',
    ordinal: '序数词顺序',
    tens: '整十数从小到大',
    daysSkip: '星期隔一天',
    monthsSkip: '月份隔一个月',
  }[kind]!;
  return { shown, ans, choices, rule };
}

export const enPatternAll = banded(
  enPattern,
  (level, rand) => `enPattern:${level === 3 ? 'u' : 'h'}:${int(rand, 1, 999999)}`,
  (sig) => {
    const sig2 = sig.replace(':u:', ':m:');
    const { shown, ans, choices, rule } = enUpperSeq(sig2);
    const { list, answerIndex } = ordered(sig, ans, choices);
    return {
      kind: 'choice',
      prompt: enPrompt('What comes next?', '找规律，接下来是什么？'),
      stem: { text: `${shown.join(', ')}, ❓` },
      options: list.map((x, i) => ({ id: String(i), text: x, speak: enS(x) })),
      answerId: String(answerIndex),
      wrongHint: enPrompt('Say them in order. What comes next?', '按顺序读一读，下一个是什么？'),
      explanation: `${rule}：${[...shown, ans].join(', ')}`,
    };
  },
);

export const enSentenceAll = banded(
  enSentence,
  (level, rand) =>
    `enSentence:${level === 3 ? 'm' : 'h'}:${int(rand, 0, (level === 3 ? SENTENCES_MID : SENTENCES_HIGH).length - 1)}`,
  (sig) => {
    const s = (sig.split(':')[1] === 'm' ? SENTENCES_MID : SENTENCES_HIGH)[idx(sig)];
    const show = scrambledOrder(sig, s.words.length);
    return {
      kind: 'sort',
      prompt: enPrompt('Put the words in order.', `把单词排成一句话：${s.zh}`),
      items: show.map((k) => ({ id: String(k), text: s.words[k] })),
      order: s.words.map((_, k) => String(k)),
      wrongHint: enPrompt('Which word comes first? Look for the capital letter.', '哪个词放在最前面？找找大写字母。'),
      explanation: `${s.words.join(' ')}（${s.zh}）`,
    };
  },
);
