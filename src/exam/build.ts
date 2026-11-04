/**
 * 试卷生成（纯函数，可测试）：按学科、年级、上下册、单元、题量组一套卷。
 *
 * 题目来源：
 * - 数学：本项目原创生成器（答案由程序计算）+ ChinaStudyFree 题库对应单元
 * - 语文、英语：ChinaStudyFree 题库对应单元（AI 生成，已自动质检，未逐题人工审核）
 * 只选能印在纸上的题型（选择、判断、排序、计算填空）；拖动、拨钟等互动题不进试卷。
 * 同一个编号（种子）组出的试卷完全相同，方便重印。家长屏蔽的题目不会出现。
 */
import { bankExercise, BANK_INDEX, editionText, loadBook, NEW_EDITION } from '@/content/bank';
import { plainText, zh } from '@/content/zh';
import { hasOriginalGenerator, kpRound } from '@/knowledge/generators';
import { KNOWLEDGE_POINTS, kpSubject, type KpSubject } from '@/knowledge/graph';
import type { DisplayText, Exercise, Visual } from '@/lesson/types';

export type ExamSize = 20 | 25 | 50;
export type ExamKind = 'calc' | 'choice' | 'tf' | 'order';

export interface ExamConfig {
  subject: KpSubject;
  grade: number;
  term: '上' | '下';
  /** 选中的单元 id；不填或空 = 全册 */
  units?: string[];
  size: ExamSize;
  seed: number;
  /** 家长屏蔽的题目 id */
  hidden?: string[];
}

export interface ExamItem {
  id: string;
  kind: ExamKind;
  source: 'original' | 'bank';
  /** 分组（单元或知识点），用来让题目覆盖更均匀 */
  group: string;
  stem: DisplayText[];
  stemVisual?: Visual;
  options?: { text?: DisplayText; visual?: Visual }[];
  /** 参考答案（文字） */
  answer: string;
}

export interface ExamSection {
  kind: ExamKind;
  title: DisplayText;
  instruction: DisplayText;
  items: ExamItem[];
}

export interface Exam {
  config: ExamConfig;
  code: string;
  title: DisplayText;
  subtitle: string;
  scopeText: string;
  perPoint: number;
  total: number;
  sections: ExamSection[];
  sourceNote: string;
}

export const SIZE_INFO: Record<ExamSize, { name: string; py: string }> = {
  20: { name: '随堂小测', py: 'suí táng xiǎo cè' },
  25: { name: '单元测试', py: 'dān yuán cè shì' },
  50: { name: '期末模拟卷', py: 'qī mò mó nǐ juàn' },
};
const GRADE_CN = ['', '一', '二', '三', '四', '五', '六'];
const GRADE_PY = ['', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù'];
const SUBJECT_CN: Record<KpSubject, [string, string]> = {
  math: ['数学', 'shù xué'],
  chinese: ['语文', 'yǔ wén'],
  english: ['英语', 'yīng yǔ'],
};

/** 一、二年级的题目说明带拼音 */
const SECTION_TEXT: Record<ExamKind, { title: [string, string]; ins: [string, string] }> = {
  calc: { title: ['计算题', 'jì suàn tí'], ins: ['直接写出得数。', 'zhí jiē xiě chū dé shù'] },
  choice: {
    title: ['选择题', 'xuǎn zé tí'],
    ins: ['把正确答案的序号填在括号里。', 'bǎ zhèng què dá àn de xù hào tián zài kuò hào lǐ'],
  },
  tf: { title: ['判断题', 'pàn duàn tí'], ins: ['对的打“√”，错的打“×”。', 'duì de dǎ cuò de dǎ'] },
  order: { title: ['排序题', 'pái xù tí'], ins: ['按正确的顺序写出序号。', 'àn zhèng què de shùn xù xiě chū xù hào'] },
};
const ORDER: ExamKind[] = ['calc', 'choice', 'tf', 'order'];
const RATIO: Record<KpSubject, Partial<Record<ExamKind, number>>> = {
  math: { calc: 0.3, choice: 0.45, tf: 0.25 },
  chinese: { choice: 0.6, tf: 0.3, order: 0.1 },
  english: { choice: 0.6, tf: 0.3, order: 0.1 },
};

export const bookIdOf = (c: Pick<ExamConfig, 'subject' | 'grade' | 'term'>) =>
  `${c.subject}-g${c.grade}${c.term === '上' ? 'a' : 'b'}`;
export const hasBook = (c: Pick<ExamConfig, 'subject' | 'grade' | 'term'>) =>
  BANK_INDEX.some((b) => b.id === bookIdOf(c));

/** 可复现的随机数（mulberry32） */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const LETTERS = 'ABCD';
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩';
const optText = (o: { text?: DisplayText; visual?: Visual }) =>
  o.text !== undefined
    ? plainText(o.text)
    : o.visual?.figure?.type === 'clock'
      ? `${o.visual.figure.hour}时`
      : (o.visual?.emoji ?? '');

/** 把练习题转成试卷题；不能印在纸上的题型返回 null */
export function toExamItem(e: Exercise, source: ExamItem['source'], group: string): ExamItem | null {
  const base = { id: e.id, source, group };
  if (e.kind === 'choice') {
    const stemText = typeof e.stem?.text === 'string' ? e.stem.text : '';
    const calc = source === 'original' && /^.+ = \?$/.test(stemText) && !e.stem?.visual;
    const answerOpt = e.options.find((o) => o.id === e.answerId)!;
    if (calc) {
      return { ...base, kind: 'calc', stem: [stemText.replace(/ = \?$/, ' =')], answer: optText(answerOpt) };
    }
    const stem: DisplayText[] = [e.prompt.text];
    if (e.stem?.text !== undefined) stem.push(e.stem.text);
    const idx = e.options.findIndex((o) => o.id === e.answerId);
    return {
      ...base,
      kind: 'choice',
      stem,
      stemVisual: e.stem?.visual,
      options: e.options.map((o) => ({ text: o.text, visual: o.visual })),
      answer: `${LETTERS[idx]}（${optText(answerOpt)}）`,
    };
  }
  if (e.kind === 'truefalse') {
    return {
      ...base,
      kind: 'tf',
      stem: [e.statement.text],
      stemVisual: e.statement.visual,
      answer: e.answer ? '√' : '×',
    };
  }
  if (e.kind === 'sort') {
    const pos = (id: string) => e.items.findIndex((it) => it.id === id);
    return {
      ...base,
      kind: 'order',
      stem: [e.prompt.text],
      options: e.items.map((it) => ({ text: it.text })),
      answer: e.order.map((id) => CIRCLED[pos(id)]).join(''),
    };
  }
  return null;
}

/** 新版单元 → 对应的一年级原创知识点 */
function editionKpUnits(c: Pick<ExamConfig, 'subject' | 'grade' | 'term'>): [string, string[]][] {
  const id = bookIdOf(c);
  return (NEW_EDITION[id]?.units ?? []).map((u) => [`${id}-n${u.no}`, u.kps ?? []]);
}

/** 本次组卷可用的全部题目 */
export function examPool(c: ExamConfig, rand: () => number): ExamItem[] {
  const out: ExamItem[] = [];
  const seen = new Set<string>();
  const add = (it: ExamItem | null) => {
    if (!it) return;
    const key = it.stem.map((s) => plainText(s)).join('|') + (it.stemVisual ? JSON.stringify(it.stemVisual) : '');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(it);
  };
  const units = c.units?.length ? new Set(c.units) : null;
  const hidden = new Set(c.hidden ?? []);

  // 原创题：本学期、有原创生成器的知识点；选了单元时只取对应单元的知识点
  for (const k of KNOWLEDGE_POINTS) {
    if (kpSubject(k) !== c.subject || k.grade !== c.grade || k.term !== c.term || !hasOriginalGenerator(k.id)) continue;
    if (units && !(k.units ?? []).some((u) => units.has(u)) && !editionKpUnits(c).some(([u, kps]) => units.has(u) && kps.includes(k.id)))
      continue;
    for (const e of kpRound(k.id, 8, rand)) add(toExamItem(e, 'original', k.id));
  }
  // 题库题
  const book = loadBook(bookIdOf(c));
  for (const u of book?.units ?? []) {
    if (units && !units.has(u.id)) continue;
    for (const q of u.questions) if (!hidden.has(q.id)) add(toExamItem(bankExercise(book!, q), 'bank', u.id));
  }
  return out;
}

/** 在一类题里轮流从各单元/知识点取题，让试卷覆盖更均匀 */
function pickSpread(items: ExamItem[], n: number, rand: () => number): ExamItem[] {
  const groups = new Map<string, ExamItem[]>();
  for (const it of shuffle(items, rand)) groups.set(it.group, [...(groups.get(it.group) ?? []), it]);
  const queues = shuffle([...groups.values()], rand);
  const out: ExamItem[] = [];
  while (out.length < n && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (out.length >= n) break;
      const it = q.shift();
      if (it) out.push(it);
    }
  }
  return out;
}

export function buildExam(c: ExamConfig): Exam {
  if (!hasBook(c)) throw new Error(`${GRADE_CN[c.grade]}年级${c.term}册${SUBJECT_CN[c.subject][0]}暂无题目`);
  const rand = seededRandom(c.seed);
  const pool = examPool(c, rand);
  const byKind = Object.fromEntries(ORDER.map((k) => [k, pool.filter((p) => p.kind === k)])) as Record<
    ExamKind,
    ExamItem[]
  >;

  // 按比例分配题量；某类题不够时，由其它题型补足
  const ratio = RATIO[c.subject];
  const want: Record<ExamKind, number> = { calc: 0, choice: 0, tf: 0, order: 0 };
  for (const k of ORDER) want[k] = Math.min(byKind[k].length, Math.floor(c.size * (ratio[k] ?? 0)));
  let left = c.size - ORDER.reduce((s, k) => s + want[k], 0);
  for (const k of ['choice', 'tf', 'calc', 'order'] as ExamKind[]) {
    const add = Math.min(left, byKind[k].length - want[k]);
    want[k] += add;
    left -= add;
  }

  const sections: ExamSection[] = [];
  const low = c.grade <= 2;
  for (const k of ORDER) {
    if (!want[k]) continue;
    const t = SECTION_TEXT[k];
    sections.push({
      kind: k,
      title: low ? zh(t.title[0], t.title[1]) : t.title[0],
      instruction: low ? zh(t.ins[0], t.ins[1]) : t.ins[0],
      items: pickSpread(byKind[k], want[k], rand),
    });
  }
  const count = sections.reduce((s, x) => s + x.items.length, 0);
  const size = SIZE_INFO[c.size];
  const [subj, subjPy] = SUBJECT_CN[c.subject];
  const titleText = `${GRADE_CN[c.grade]}年级${c.term}册${subj}${size.name}`;
  const book = loadBook(bookIdOf(c))!;
  const unitTitles = c.units?.length ? book.units.filter((u) => c.units!.includes(u.id)).map((u) => u.title) : [];
  const hasOriginal = sections.some((s) => s.items.some((i) => i.source === 'original'));
  return {
    config: c,
    code: `${c.subject[0].toUpperCase()}${c.grade}${c.term === '上' ? 'A' : 'B'}-${c.size}-${String(c.seed).padStart(6, '0')}`,
    title: low
      ? zh(titleText, `${GRADE_PY[c.grade]} nián jí ${c.term === '上' ? 'shàng' : 'xià'} cè ${subjPy} ${size.py}`)
      : titleText,
    subtitle: `依据${editionText(bookIdOf(c))}教材单元编排 · 非官方试卷`,
    scopeText: unitTitles.length ? `范围：${unitTitles.join('、')}` : '范围：全册',
    perPoint: count ? Math.round((100 / count) * 10) / 10 : 0,
    total: 100,
    sections,
    sourceNote: hasOriginal
      ? '题目来源：星星学习乐园原创题（答案由程序计算）+ ChinaStudyFree 题库（MIT，AI 生成，已自动质检，未逐题人工审核）。'
      : '题目来源：ChinaStudyFree 题库（MIT，AI 生成，已自动质检，未逐题人工审核）。',
  };
}

/** 新的随机编号（6 位数） */
export const newSeed = () => 100000 + Math.floor(Math.random() * 900000);
