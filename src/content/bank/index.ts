/**
 * 题库运行时：把导入的题目转换成 APP 的练习组件数据（Exercise）。
 * 题目来源：ChinaStudyFree（MIT, © 2026 tanle-mtr），AI 生成、经自动质检，未经人工逐题审核。
 */
import type { Exercise, PinyinSeg, Prompt, Subject, ZhText } from '@/lesson/types';
import { zh } from '../zh';
import indexData from './index.json';
import { BANK_LOADERS } from './loaders';
import type { BankBook, BankIndexEntry, BankQuestion, BankUnit } from './types';

export type { BankBook, BankIndexEntry, BankQuestion, BankUnit } from './types';

export const BANK_INDEX = indexData as BankIndexEntry[];
export const BANK_SOURCE = 'ChinaStudyFree 题库（AI 生成，已自动质检，未逐题人工审核）';

const cache = new Map<string, BankBook>();

export function booksFor(subject: Subject, grade: number): BankIndexEntry[] {
  return BANK_INDEX.filter((b) => b.subject === subject && b.grade === grade);
}

export function loadBook(id: string): BankBook | undefined {
  if (cache.has(id)) return cache.get(id);
  const loader = BANK_LOADERS[id];
  if (!loader) return undefined;
  const book = loader();
  cache.set(id, book);
  return book;
}

/** 单元 id 形如 math-g1a-u3 */
export function findUnit(unitId: string): { book: BankBook; unit: BankUnit } | undefined {
  const bookId = unitId.replace(/-u\d+$/, '');
  const book = loadBook(bookId);
  const unit = book?.units.find((u) => u.id === unitId);
  return book && unit ? { book, unit } : undefined;
}

export const bankLessonId = (unitId: string) => `bank:${unitId}`;
export const isBankLessonId = (id: string) => id.startsWith('bank:');
export const bankSkill = (subject: Subject, kp: string) => `bank:${subject}:${kp}`;

/** 把自动拼音（空格分隔）与文字合成上注音文本；没有拼音时返回普通文字 */
export function withPinyin(text: string, py?: string): string | ZhText {
  if (!py) return text;
  const pys = py.split(' ');
  const segs: PinyinSeg[] = [];
  let i = 0;
  for (const ch of Array.from(text)) {
    if (/\p{Script=Han}/u.test(ch)) segs.push({ char: ch, py: pys[i++] });
    else segs.push({ char: ch });
  }
  return i === pys.length ? segs : text;
}

const hasHan = (s: string) => /\p{Script=Han}/u.test(s);

function speakOf(subject: Subject, text: string) {
  // 朗读时把填空括号读成停顿
  const t = text.replace(/（\s*[？?]?\s*）|\(\s*\)|_{2,}/g, '，');
  return { text: t, lang: subject === 'english' && !hasHan(text) ? ('en-US' as const) : ('zh-CN' as const) };
}

function promptOf(subject: Subject, text: string, py?: string): Prompt {
  return { text: withPinyin(text, py), speak: speakOf(subject, text) };
}

function retryHint(subject: Subject): Prompt {
  return subject === 'english'
    ? { text: 'Read it again.', speak: { text: 'Read it again.', lang: 'en-US' } }
    : { text: zh('再仔细读一读题目', 'zài zǐ xì dú yi dú tí mù'), speak: { text: '再仔细读一读题目', lang: 'zh-CN' } };
}

export function bankExercise(book: BankBook, q: BankQuestion): Exercise {
  const skill = bankSkill(book.subject, q.kp);
  const base = { id: q.id, skill, wrongHint: retryHint(book.subject), explanation: q.ex };
  if (q.t === 'tf') {
    return {
      ...base,
      kind: 'truefalse',
      prompt:
        book.subject === 'english'
          ? { text: 'True or false?', speak: { text: 'True or false?', lang: 'en-US' }, hintZh: '判断对错' }
          : { text: zh('判断对错', 'pàn duàn duì cuò'), speak: { text: '判断对错', lang: 'zh-CN' } },
      statement: { text: withPinyin(q.q, q.qpy), speak: speakOf(book.subject, q.q) },
      answer: q.a as boolean,
    };
  }
  if (q.t === 'order') {
    const order = q.a as number[];
    return {
      ...base,
      kind: 'sort',
      prompt: promptOf(book.subject, q.q, q.qpy),
      items: (q.o ?? []).map((o, i) => ({ id: String(i), text: withPinyin(o, q.opy?.[i] || undefined) })),
      order: order.map(String),
    };
  }
  return {
    ...base,
    kind: 'choice',
    prompt: promptOf(book.subject, q.q, q.qpy),
    options: (q.o ?? []).map((o, i) => ({ id: String(i), text: withPinyin(o, q.opy?.[i] || undefined) })),
    answerId: String(q.a),
  };
}

/** 题库中的某道题（用于今日复习） */
export function findBankExercise(lessonId: string, exerciseId: string) {
  if (!isBankLessonId(lessonId)) return null;
  const found = findUnit(lessonId.slice(5));
  const q = found?.unit.questions.find((x) => x.id === exerciseId);
  return found && q ? { book: found.book, unit: found.unit, exercise: bankExercise(found.book, q) } : null;
}

/**
 * 抽一轮练习题：优先没做过的，其次做错过的，最后随机；排除家长屏蔽的题目。
 */
export function pickRound(
  unit: BankUnit,
  opts: { done: Set<string>; hidden: Set<string>; count?: number; rand?: () => number },
): BankQuestion[] {
  const rand = opts.rand ?? Math.random;
  const count = opts.count ?? 10;
  const pool = unit.questions.filter((q) => !opts.hidden.has(q.id));
  const shuffle = <T,>(a: T[]) => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const fresh = shuffle(pool.filter((q) => !opts.done.has(q.id)));
  const old = shuffle(pool.filter((q) => opts.done.has(q.id)));
  return [...fresh, ...old].slice(0, count);
}
