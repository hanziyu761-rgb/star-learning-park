/**
 * 题库自动核查（V2.12）：导入的题库是 AI 生成的，未逐题人工审核。程序能验算的部分逐题检查：
 * 1. 结构：选择题答案下标有效、选项不重复；判断题答案是对/错；连词成句的顺序是完整排列；题干拼音个数与汉字个数一致。
 * 2. 算式：题干、讲解里出现的“a + b = c”“a − b = c”“a × b = c”“a ÷ b = c（……r）”逐个验算（支持小数）。
 *    选项里的算式不查（错误选项本来就可能是错的）；判断题题干只有一个算式时，算式对错必须与答案一致。
 * 3. 比较：讲解里的“a < b”“a > b”逐个验算。
 * 查不出来的（应用题意思、语文内容、拼音多音字读法）仍需老师审核。
 */
import type { BankBook, BankQuestion } from './types';

export type AuditKind = 'structure' | 'pinyin-count' | 'equation' | 'compare' | 'tf-equation' | 'choice-answer';

export interface AuditIssue {
  book: string;
  unit: string;
  id: string;
  kind: AuditKind;
  detail: string;
}

const NUM = String.raw`\d+(?:\.\d+)?`;
// 算式：前面不能紧挨数字、小数点、冒号（避免把 10:30、0.48 截断）；后面可以跟单位和“……余数”
const EQ = new RegExp(
  String.raw`(?<!\d[:：]|[\d./^])(${NUM})\s*([+\-−＋－×xX*÷])\s*(${NUM})\s*[=＝]\s*(${NUM})(?![\d.:：/^²³]|\s+\d+\/\d)(\s*(?:[（(][^）)]{0,6}[）)]|\p{Script=Han}{1,3})?\s*(?:……|\.{3,6}|…)\s*(${NUM}))?`,
  'gu',
);
// 比较：数前后紧挨分数线、乘方、根号、运算符的不查（分数、指数、根式比较由老师审核；√5 < 3 不能读成 5 < 3）
const CMP = new RegExp(String.raw`(?<!\d[:：]|[\d./^+\-−×÷√])(${NUM})\s*([<>＜＞])\s*(${NUM})(?![\d.:：/^²³+\-−×÷])`, 'g');

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

function calc(a: number, op: string, b: number): number | null {
  if ('+＋'.includes(op)) return a + b;
  if ('-−－'.includes(op)) return a - b;
  if ('×xX*'.includes(op)) return a * b;
  return b === 0 ? null : a / b;
}

/** 文字里所有能验算的算式：返回错的那些 */
export function wrongEquations(text: string): string[] {
  return checkEquations(text).bad;
}

/** 验算文字里的算式：checked 为验算了几个，bad 为算错的 */
export function checkEquations(text: string): { checked: number; bad: string[] } {
  const bad: string[] = [];
  let checked = 0;
  for (const m of text.matchAll(EQ)) {
    const before = text.slice(Math.max(0, m.index! - 3), m.index!);
    // 讲解里故意引用错误算式（“……确实是错的”“如果算成……”）不算
    const ctx =
      text.slice(m.index! + m[0].length, m.index! + m[0].length + 8) + text.slice(Math.max(0, m.index! - 6), m.index!);
    if (/错|不对|如果|若|误/.test(ctx)) continue;
    // 连续算式（如 3 + 4 + 5 = 12）或括号里的一段：只查完整的二元算式
    if (/[+\-−×÷*/=＝(（]\s*$/.test(before)) continue;
    const after = text.slice(m.index! + m[0].length, m.index! + m[0].length + 2);
    if (!m[6] && /^\s*[+\-−×÷*/]/.test(after)) continue;
    const [a, op, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
    if ('÷/'.includes(op)) {
      if (b === 0) continue;
      // 有余数：a = c × b + r；没写余数：整除或商为小数都要相等
      const r = m[6] !== undefined ? Number(m[6]) : null;
      const ok = r !== null ? near(c * b + r, a) && r < b : near(a / b, c);
      checked += 1;
      if (!ok) bad.push(m[0].trim());
      continue;
    }
    const v = calc(a, op, b);
    checked += 1;
    if (v !== null && !near(v, c)) bad.push(m[0].trim());
  }
  return { checked, bad };
}

export function wrongComparisons(text: string): string[] {
  const bad: string[] = [];
  for (const m of text.matchAll(CMP)) {
    const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
    const ok = '<＜'.includes(op) ? a < b : a > b;
    if (!ok) bad.push(m[0].trim());
  }
  return bad;
}

const HAN = /\p{Script=Han}/gu;

export function auditQuestion(book: string, unit: string, q: BankQuestion): AuditIssue[] {
  const out: AuditIssue[] = [];
  const add = (kind: AuditKind, detail: string) => out.push({ book, unit, id: q.id, kind, detail });
  const opts = q.o ?? [];
  if (q.t === 'choice') {
    if (typeof q.a !== 'number' || !Number.isInteger(q.a) || q.a < 0 || q.a >= opts.length)
      add('structure', '选择题答案下标无效');
    if (opts.length < 2) add('structure', '选项少于 2 个');
    if (new Set(opts.map((o) => o.trim())).size !== opts.length) add('structure', `选项重复：${opts.join(' / ')}`);
  } else if (q.t === 'tf') {
    if (typeof q.a !== 'boolean') add('structure', '判断题答案不是对/错');
  } else if (q.t === 'order') {
    const a = q.a as number[];
    if (!Array.isArray(a) || a.length !== opts.length || [...a].sort((x, y) => x - y).some((v, i) => v !== i))
      add('structure', '连词成句的正确顺序不是完整排列');
  }
  if (q.qpy) {
    const han = q.q.match(HAN)?.length ?? 0;
    const py = q.qpy.trim().split(/\s+/).filter(Boolean).length;
    if (han !== py) add('pinyin-count', `题干 ${han} 个汉字，拼音 ${py} 个`);
  }
  // 判断题题干只有一个算式：算式对错 = 答案
  if (q.t === 'tf') {
    const bare = q.q.replace(/[。？?！!\s]/g, '').replace(/\.$/, '');
    const m = bare.match(new RegExp(String.raw`^(${NUM})([+\-−×÷])(${NUM})[=＝](${NUM})$`));
    if (m) {
      const v = calc(Number(m[1]), m[2], Number(m[3]));
      const truth = v !== null && near(v, Number(m[4]));
      if (truth !== q.a) add('tf-equation', `“${q.q}”实际${truth ? '正确' : '错误'}，答案却是${q.a ? '对' : '错'}`);
    }
  }
  // 选择题题干是“a + b = （ ）”：正确选项必须等于算出来的数
  if (q.t === 'choice' && typeof q.a === 'number') {
    const m = q.q
      .replace(/\s/g, '')
      .match(
        new RegExp(String.raw`(?:^|[：:])(${NUM})([+\-−×÷])(${NUM})[=＝](?:（）|\(\)|[？?]|_+|（[？?]）)[。？?]?$`),
      );
    const ans = opts[q.a]?.trim();
    if (m && ans !== undefined && /^\d+(?:\.\d+)?$/.test(ans)) {
      const v = calc(Number(m[1]), m[2], Number(m[3]));
      if (v !== null && !near(v, Number(ans))) add('choice-answer', `“${q.q}”应得 ${v}，标的答案是 ${ans}`);
    }
  }
  if (q.ex) {
    for (const e of wrongEquations(q.ex)) add('equation', `讲解里的算式算错：${e}`);
    for (const e of wrongComparisons(q.ex)) add('compare', `讲解里的比较不对：${e}`);
  }
  return out;
}

/** 验算覆盖情况：多少道题的讲解里有能验算的算式、一共验算了多少个算式 */
export function auditCoverage(book: BankBook) {
  let questions = 0;
  let equations = 0;
  for (const u of book.units)
    for (const q of u.questions) {
      const n = checkEquations(`${q.ex ?? ''}`).checked;
      if (n) questions += 1;
      equations += n;
    }
  return { questions, equations };
}

export function auditBook(book: BankBook): AuditIssue[] {
  return book.units.flatMap((u) => u.questions.flatMap((q) => auditQuestion(book.id, u.id, q)));
}
