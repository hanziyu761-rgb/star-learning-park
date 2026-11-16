/**
 * 知识点题目生成器（原创）：用于“知识点练习”和“前置知识诊断”。
 * 每道题由“签名”（如 7+5、fly-in:4:3）唯一确定，复习时可由题目 id 还原。
 * 答案全部由程序计算。
 */
import { asInput } from './inputs';
import { zh } from '@/content/zh';
import type { ChoiceExercise, Exercise, Prompt } from '@/lesson/types';
import { bankExercise, findUnit } from '@/content/bank';
import { getKp, UNIT_TO_KP } from './graph';
import { GRAPHICS_GENERATORS, pickSig } from './graphics';
import { UPPER_GENERATORS } from './genUpper';
import { JUNIOR_GENERATORS as JUNIOR_MATH } from './genJunior';
import { JUNIOR_LANG_GENERATORS } from './genJuniorLang';
import { isWordSig, wordExercise, wordSigs } from './genWords';

/** 七～九年级（V5.2）：数学出题程序 + 语文、英语原创小题库 */
const JUNIOR_GENERATORS = { ...JUNIOR_MATH, ...JUNIOR_LANG_GENERATORS };

type Rand = () => number;
const r = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const NUM_SAY = (n: number) => String(n);

interface Gen {
  make: (rand: Rand) => string;
  build: (sig: string) => Omit<ChoiceExercise, 'id' | 'skill' | 'kind' | 'wrongHint'> & { wrongHint?: Prompt };
}

/** 选项：正确答案附近的几个数，去重、非负、从小到大 */
function numOptions(ans: number, spread: number[] = [1, -1, 2, -2, 10, -10]): ChoiceExercise['options'] {
  const set = new Set<number>([ans]);
  for (const d of spread) {
    if (set.size >= 4) break;
    if (ans + d >= 0) set.add(ans + d);
  }
  return [...set].sort((a, b) => a - b).map((n) => ({ id: String(n), text: String(n) }));
}

const say = (text: string) => ({ text, lang: 'zh-CN' as const });

function countGen(lo: number, hi: number, emojis: string[]): Gen {
  return {
    make: (rand) => `${r(rand, lo, hi)}:${r(rand, 0, emojis.length - 1)}`,
    build: (sig) => {
      const [n, e] = sig.split(':').map(Number);
      return {
        prompt: { text: zh('数一数，有几个？', 'shǔ yi shǔ yǒu jǐ gè'), speak: say('数一数，有几个？') },
        stem: { visual: { emoji: emojis[e] ?? emojis[0], count: n } },
        options: numOptions(n),
        answerId: String(n),
      };
    },
  };
}

function tensOnesGen(minTens: number, maxTens: number): Gen {
  return {
    make: (rand) => `${r(rand, minTens, maxTens)}:${r(rand, 0, 9)}`,
    build: (sig) => {
      const [t, o] = sig.split(':').map(Number);
      const ans = t * 10 + o;
      // 干扰项：十位个位颠倒（常见错误）、相差 1、相差 10
      const opts = new Set<number>([ans]);
      for (const x of [o * 10 + t, ans + 1, ans - 1, ans + 10, ans - 10]) if (opts.size < 4 && x >= 0) opts.add(x);
      return {
        prompt: {
          text: zh(`${t}个十和${o}个一是多少？`, 'gè shí hé gè yī shì duō shao'),
          speak: say(`${NUM_SAY(t)}个十和${NUM_SAY(o)}个一是多少？`),
        },
        stem: { text: `${'🔟'.repeat(t)} ${'🟡'.repeat(o)}` },
        options: [...opts].sort((a, b) => a - b).map((n) => ({ id: String(n), text: String(n) })),
        answerId: String(ans),
      };
    },
  };
}

function arithGen(make: (rand: Rand) => [number, '+' | '-', number]): Gen {
  return {
    make: (rand) => {
      const [a, op, b] = make(rand);
      return `${a}${op}${b}`;
    },
    build: (sig) => {
      const m = sig.match(/^(\d+)([+-])(\d+)$/)!;
      const a = Number(m[1]);
      const b = Number(m[3]);
      const ans = m[2] === '+' ? a + b : a - b;
      return {
        prompt: { text: zh('算一算', 'suàn yi suàn'), speak: say(`${a}${m[2] === '+' ? '加' : '减'}${b}等于几？`) },
        stem: { text: `${a} ${m[2] === '+' ? '+' : '−'} ${b} = ?` },
        options: numOptions(ans),
        answerId: String(ans),
      };
    },
  };
}

function composeGen(lo: number, hi: number): Gen {
  return {
    make: (rand) => {
      const n = r(rand, lo, hi);
      return `${n}:${r(rand, 1, n - 1)}`;
    },
    build: (sig) => {
      const [n, a] = sig.split(':').map(Number);
      return {
        prompt: { text: zh(`${n}可以分成${a}和几？`, 'kě yǐ fēn chéng hé jǐ'), speak: say(`${n}可以分成${a}和几？`) },
        stem: { text: `${n} → ${a} + ?` },
        options: numOptions(n - a),
        answerId: String(n - a),
      };
    },
  };
}

const STORIES = [
  {
    id: 'fly-in',
    op: '+',
    emoji: '🐦',
    zhText: (a: number, b: number) => [
      `树上有${a}只小鸟，又飞来${b}只，一共有几只？`,
      'shù shàng yǒu zhī xiǎo niǎo yòu fēi lái zhī yí gòng yǒu jǐ zhī',
    ],
  },
  {
    id: 'fly-away',
    op: '-',
    emoji: '🐦',
    zhText: (a: number, b: number) => [
      `树上有${a}只小鸟，飞走了${b}只，还剩几只？`,
      'shù shàng yǒu zhī xiǎo niǎo fēi zǒu le zhī hái shèng jǐ zhī',
    ],
  },
  {
    id: 'eat',
    op: '-',
    emoji: '🍎',
    zhText: (a: number, b: number) => [
      `盘子里有${a}个苹果，吃了${b}个，还剩几个？`,
      'pán zi lǐ yǒu gè píng guǒ chī le gè hái shèng jǐ gè',
    ],
  },
  {
    id: 'join',
    op: '+',
    emoji: '🐟',
    zhText: (a: number, b: number) => [
      `左边有${a}条鱼，右边有${b}条鱼，一共有几条？`,
      'zuǒ biān yǒu tiáo yú yòu biān yǒu tiáo yú yí gòng yǒu jǐ tiáo',
    ],
  },
] as const;

const GENERATORS: Record<string, Gen> = {
  'm1.count5': countGen(1, 5, ['🍎', '⭐', '🐟', '🌸']),
  'm1.count10': countGen(6, 10, ['🍓', '🎈', '🐞', '🍬']),
  'm1.count20': tensOnesGen(1, 1),
  'm1.count100': tensOnesGen(2, 9),
  'm1.zero': {
    make: (rand) => String(r(rand, 1, 5)),
    build: (sig) => {
      const n = Number(sig);
      return {
        prompt: {
          text: zh(`${n}个苹果都吃完了，还剩几个？`, 'gè píng guǒ dōu chī wán le hái shèng jǐ gè'),
          speak: say(`${n}个苹果都吃完了，还剩几个？`),
        },
        stem: { text: `${n} − ${n} = ?` },
        options: numOptions(0, [1, 2, n]),
        answerId: '0',
      };
    },
  },
  'm1.compose5': composeGen(2, 5),
  'm1.compose10': composeGen(6, 10),
  'm1.make10': {
    make: (rand) => String(r(rand, 1, 9)),
    build: (sig) => {
      const a = Number(sig);
      return {
        prompt: { text: zh(`${a}再加几就是10？`, 'zài jiā jǐ jiù shì'), speak: say(`${a}再加几就是10？`) },
        stem: { text: `${a} + ? = 10` },
        options: numOptions(10 - a),
        answerId: String(10 - a),
      };
    },
  },
  'm1.compare10': {
    make: (rand) => {
      const a = r(rand, 1, 10);
      let b = r(rand, 1, 10);
      if (b === a) b = a === 10 ? 9 : a + 1;
      return `${a}:${b}`;
    },
    build: (sig) => {
      const [a, b] = sig.split(':').map(Number);
      return {
        prompt: { text: zh('哪个数大？', 'nǎ ge shù dà'), speak: say(`${a}和${b}，哪个数大？`) },
        options: [
          { id: String(a), text: String(a) },
          { id: String(b), text: String(b) },
        ],
        answerId: String(Math.max(a, b)),
      };
    },
  },
  'm1.add5': arithGen((rand) => {
    const a = r(rand, 0, 4);
    return [a, '+', r(rand, 1, 5 - a)];
  }),
  'm1.sub5': arithGen((rand) => {
    const a = r(rand, 1, 5);
    return [a, '-', r(rand, 0, a)];
  }),
  'm1.add10': arithGen((rand) => {
    const a = r(rand, 1, 9);
    return [a, '+', r(rand, 1, 10 - a)];
  }),
  'm1.sub10': arithGen((rand) => {
    const a = r(rand, 5, 10);
    return [a, '-', r(rand, 1, a)];
  }),
  'm1.carry20': arithGen((rand) => {
    const a = r(rand, 2, 9);
    return [a, '+', r(rand, 11 - a, 9)];
  }),
  'm1.borrow20': arithGen((rand) => {
    const b = r(rand, 2, 9);
    return [r(rand, 11, 9 + b), '-', b];
  }),
  'm1.addsub100': arithGen((rand) => {
    if (rand() < 0.5) {
      const a = r(rand, 2, 9) * 10 + r(rand, 0, 9);
      return [a, '+', r(rand, 1, 9)];
    }
    const a = r(rand, 2, 9) * 10 + r(rand, 0, 9);
    return [a, '-', r(rand, 1, 9)];
  }),
  'm1.wordprob10': {
    make: (rand) => {
      const s = STORIES[r(rand, 0, STORIES.length - 1)];
      if (s.op === '+') {
        const a = r(rand, 1, 8);
        return `${s.id}:${a}:${r(rand, 1, 10 - a)}`;
      }
      const a = r(rand, 3, 10);
      return `${s.id}:${a}:${r(rand, 1, a - 1)}`;
    },
    build: (sig) => {
      const [id, as, bs] = sig.split(':');
      const a = Number(as);
      const b = Number(bs);
      const s = STORIES.find((x) => x.id === id)!;
      const [text, py] = s.zhText(a, b);
      const ans = s.op === '+' ? a + b : a - b;
      return {
        prompt: { text: zh(text, py), speak: say(text) },
        stem: { visual: { emoji: s.emoji, count: a } },
        options: numOptions(ans),
        answerId: String(ans),
      };
    },
  },
};

/** 有原创生成器（答案由程序计算） */
export function hasOriginalGenerator(kpId: string): boolean {
  return kpId in GENERATORS || kpId in GRAPHICS_GENERATORS || kpId in UPPER_GENERATORS || kpId in JUNIOR_GENERATORS;
}

/** 有题可练：原创生成器，或对应的题库单元（V2.2：二～六年级、语文、英语） */
export function hasGenerator(kpId: string): boolean {
  return hasOriginalGenerator(kpId) || (getKp(kpId)?.units?.length ?? 0) > 0;
}

/** 题库题的签名：b:单元id:题目id；三～六年级英语再加单词卡出的题 w:编号:题型（V5.2.5） */
function bankSigs(kpId: string): string[] {
  return [
    ...(getKp(kpId)?.units ?? []).flatMap((u) => (findUnit(u)?.unit.questions ?? []).map((q) => `b:${u}:${q.id}`)),
    ...wordSigs(kpId),
  ];
}

function bankKpExercise(kpId: string, sig: string): Exercise {
  const [, unitId, ...rest] = sig.split(':');
  const qid = rest.join(':');
  const found = findUnit(unitId);
  const q = found?.unit.questions.find((x) => x.id === qid);
  // 旧版单元 id（V2.4 前的记录）也认，只要它现在归这个知识点
  const ours = (getKp(kpId)?.units ?? []).includes(unitId) || UNIT_TO_KP[unitId] === kpId;
  if (!found || !q || !ours) throw new Error(`没有这道题：${sig}`);
  return { ...bankExercise(found.book, q), id: kpExerciseId(kpId, sig), skill: kpId };
}

export const kpExerciseId = (kpId: string, sig: string) => `kp:${kpId}:${sig}`;

/** 由知识点和签名生成题目（计算类为选择题；图形/规律类为各种互动题） */
export function kpExercise(kpId: string, sig: string): Exercise {
  // “:in” 结尾：同一道题改成自己填数（V2.9）
  if (sig.endsWith(':in')) {
    const base = kpExercise(kpId, sig.slice(0, -3));
    const inp = asInput(base, kpExerciseId(kpId, sig));
    if (!inp) throw new Error(`这道题不能改成填数：${sig}`);
    return inp;
  }
  if (sig.startsWith('b:')) return bankKpExercise(kpId, sig);
  if (isWordSig(kpId, sig)) return wordExercise(kpId, sig, kpExerciseId(kpId, sig));
  const full = GRAPHICS_GENERATORS[kpId];
  if (full) return { ...full.build(sig), id: kpExerciseId(kpId, sig), skill: kpId } as Exercise;
  const g = GENERATORS[kpId] ?? UPPER_GENERATORS[kpId] ?? JUNIOR_GENERATORS[kpId];
  if (!g) throw new Error(`知识点 ${kpId} 没有题目生成器`);
  const built = g.build(sig);
  return {
    kind: 'choice',
    id: kpExerciseId(kpId, sig),
    skill: kpId,
    wrongHint: built.wrongHint ?? { text: zh('再想一想', 'zài xiǎng yi xiǎng'), speak: say('再想一想') },
    ...built,
  };
}

/** 生成若干道不重复的题（题库不够时题数可能少于 count） */
export function kpRound(
  kpId: string,
  count: number,
  rand: Rand = Math.random,
  avoid: Set<string> = new Set(),
): Exercise[] {
  const full = GRAPHICS_GENERATORS[kpId];
  let make = full ? (rd: Rand) => pickSig(full, rd) : (GENERATORS[kpId] ?? UPPER_GENERATORS[kpId] ?? JUNIOR_GENERATORS[kpId])?.make;
  if (!make) {
    // 只有题库的知识点：从对应单元抽题（题库题为 AI 生成、已通过教师审核）
    const pool = bankSigs(kpId);
    if (!pool.length) return [];
    make = (rd: Rand) => pool[Math.floor(rd() * pool.length)];
  }
  const sigs = new Set<string>();
  let guard = 0;
  while (sigs.size < count && guard++ < 300) {
    const s = make(rand);
    if (!avoid.has(kpExerciseId(kpId, s)) || guard > 150) sigs.add(s);
  }
  // 每隔一道题改成自己填数（答案是数的题才改）
  return [...sigs].map((s, i) => {
    const e = kpExercise(kpId, s);
    return i % 2 === 1 && !s.startsWith('b:') && asInput(e) ? kpExercise(kpId, `${s}:in`) : e;
  });
}

/** 从题目 id（kp:知识点:签名）还原 */
export function exerciseFromKpId(exerciseId: string): Exercise | null {
  const m = exerciseId.match(/^kp:([a-z]\d\.[\w]+):(.+)$/);
  if (!m || !hasGenerator(m[1])) return null;
  try {
    return kpExercise(m[1], m[2]);
  } catch {
    return null;
  }
}
