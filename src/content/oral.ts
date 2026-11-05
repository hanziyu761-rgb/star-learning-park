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
  titlePy: string;
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
];

export function topicsForGrade(grade: number): OralTopic[] {
  // 高年级也可以复习低年级口算
  return ORAL_TOPICS.filter((t) => t.grade <= grade);
}

export const oralLessonId = (topicId: string) => `oral:${topicId}`;
export const isOralLessonId = (id: string) => id.startsWith('oral:');

export function evalExpr(expr: string): number {
  const m = expr.match(/^(\d+)([+\-×÷])(\d+)$/);
  if (!m) throw new Error(`算式格式错误：${expr}`);
  const a = Number(m[1]);
  const b = Number(m[3]);
  switch (m[2]) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    default:
      return a / b;
  }
}

const OP_SAY: Record<string, string> = { '+': '加', '-': '减', '×': '乘', '÷': '除以' };

/** 口算题；题目 id 以 #in 结尾时改成自己填数（V2.9） */
export function oralExercise(topicId: string, expr: string): ChoiceExercise | InputExercise {
  if (expr.endsWith('#in')) return asInput(oralExercise(topicId, expr.slice(0, -3)), expr)!;
  const ans = evalExpr(expr);
  const set = new Set<number>([ans]);
  for (const d of [1, -1, 2, -2, 10, -10, 3]) {
    if (set.size >= 4) break;
    if (ans + d >= 0) set.add(ans + d);
  }
  const options = [...set].sort((a, b) => a - b);
  const m = expr.match(/^(\d+)([+\-×÷])(\d+)$/)!;
  const display = expr.replace('-', ' − ').replace('+', ' + ').replace('×', ' × ').replace('÷', ' ÷ ');
  return {
    kind: 'choice',
    id: expr,
    skill: `oral.${topicId}`,
    prompt: { text: zh('算一算', 'suàn yi suàn'), speak: { text: `${m[1]}${OP_SAY[m[2]]}${m[3]}等于几？`, lang: 'zh-CN' } },
    stem: { text: `${display} = ?` },
    options: options.map((n) => ({ id: String(n), text: String(n) })),
    answerId: String(ans),
    wrongHint: { text: zh('再算一算', 'zài suàn yi suàn'), speak: { text: '再算一算', lang: 'zh-CN' } },
  };
}

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
