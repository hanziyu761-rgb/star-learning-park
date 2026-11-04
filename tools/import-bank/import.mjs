/**
 * 题库导入：ChinaStudyFree（MIT, © 2026 tanle-mtr）小学 1–6 年级 → 星星学习乐园题库格式
 *
 * 用法：node tools/import-bank/import.mjs <ChinaStudyFree 仓库目录>
 *
 * 只导入默认版本教材（人教版 / 统编版 / PEP），避免同一知识点出现多个互相冲突的版本。
 * 自动质检规则（不合格的题目丢弃，并在 src/content/bank/report.json 中按原因统计）：
 *   - 只保留能用现有交互完成的题型：选择、判断、连词成句（排序）、数字填空/计算（转为数字选择）
 *   - 连线题（抽查发现答案对应错误）、文字填空题（需要手写输入）暂不导入
 *   - 公式代码（LaTeX）能转成普通符号的就转换，转换不了的丢弃
 *   - 答案不在选项中、选项重复、判断题答案不是“对/错”的丢弃
 *   - 能自动计算的算式题，答案算错的丢弃
 *   - 含不适合儿童的词语的丢弃
 *   - 一、二年级：题干过长、选项过长的丢弃；一年级数学含超纲内容（乘除、分针、秒等）的丢弃
 *   - 同一本书内题干相同的去重
 * 一、二年级的中文题目自动生成拼音（pinyin-pro，多音字可能有误，界面上会标注“自动拼音”）。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pinyin } from 'pinyin-pro';

const src = process.argv[2];
if (!src || !fs.existsSync(path.join(src, 'output'))) {
  console.error('用法：node tools/import-bank/import.mjs <ChinaStudyFree 仓库目录>');
  process.exit(1);
}
const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'src', 'content', 'bank');
fs.mkdirSync(outDir, { recursive: true });

const GRADE_CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
const SUBJECTS = { math: 'math', chinese: 'chinese', english: 'english' };
const UNSAFE = /死|杀|血|尸|鬼|枪|毒|自杀|跳楼|离婚|打架|坟|葬|酒|烟|赌|色情|恐怖/;
const G1_MATH_OUT = /乘|除|×|÷|分针|秒针|秒|厘米|毫米|千克|克/;
const HAN = /\p{Script=Han}/u;

const drop = {};
const kept = {};
const bump = (o, k) => (o[k] = (o[k] ?? 0) + 1);

function cleanLatex(s) {
  if (typeof s !== 'string') return s;
  if (!s.includes('$') && !s.includes('\\')) return s;
  let t = s.replace(/\$([^$]*)\$/g, (_, inner) =>
    inner
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\le(q)?/g, '≤')
      .replace(/\\ge(q)?/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\pi/g, 'π')
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\left|\\right/g, '')
      .replace(/\^\{?2\}?/g, '²')
      .replace(/\^\{?3\}?/g, '³')
      .replace(/\\[,;! ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  return t;
}
// 公式残留：源数据里 "\\times" 被 JSON 转义成制表符 + "imes" 等
const hasCode = (s) =>
  typeof s === 'string' && (/[\\${}]/.test(s) || /[\u0000-\u0009\u000b-\u001f]/.test(s) || /(^|[^tT])imes|rac\{|sqrt|==/.test(s));

/** 自动拼音：返回与汉字一一对应的拼音（空格分隔） */
function autoPy(text) {
  const chars = Array.from(text).filter((c) => HAN.test(c));
  if (chars.length === 0) return undefined;
  const arr = pinyin(text, { type: 'array', toneType: 'symbol', nonZh: 'removed' });
  if (arr.length !== chars.length) return undefined;
  return arr.join(' ');
}

/** 能直接计算的简单算式：a op b (op c) = ? */
function evalArith(q) {
  const m = q.replace(/\s/g, '').match(/^(?:计算[:：])?(\d+(?:[+\-×÷＋－]\d+){1,3})[=＝](?:\?|？|___|（）|\(\))?[。.]?$/);
  if (!m) return null;
  const expr = m[1].replace(/[＋]/g, '+').replace(/[－]/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  // eslint-disable-next-line no-new-func
  const v = Function(`"use strict";return (${expr})`)();
  return Number.isFinite(v) ? v : null;
}

function numericChoices(n) {
  const set = new Set([n]);
  for (const d of [1, -1, 2, -2, 10, 3]) {
    if (set.size >= 4) break;
    if (n + d >= 0) set.add(n + d);
  }
  return [...set].sort((a, b) => a - b).map(String);
}

function convert(q, ctx) {
  const reasonType = `题型 ${q.type}`;
  let question = cleanLatex(String(q.question ?? '').trim());
  let options = Array.isArray(q.options) ? q.options.map((o) => cleanLatex(String(o).trim())) : [];
  let answer = cleanLatex(typeof q.answer === 'string' ? q.answer.trim() : String(q.answer ?? '').trim());
  if (!question) return [null, '题干为空'];
  if (hasCode(question) || options.some(hasCode) || hasCode(answer)) return [null, '含无法转换的公式代码'];
  if (UNSAFE.test(question) || options.some((o) => UNSAFE.test(o))) return [null, '含不适合儿童的词语'];
  if (ctx.grade <= 2) {
    if (Array.from(question).length > 50) return [null, '一二年级题干过长'];
    if (options.some((o) => Array.from(o).length > 14)) return [null, '一二年级选项过长'];
  }
  if (ctx.subject === 'math' && ctx.grade === 1 && G1_MATH_OUT.test(question + options.join(''))) {
    return [null, '一年级数学超纲'];
  }
  const computed = evalArith(question);
  let out;
  switch (q.type) {
    case 'choice': {
      if (options.length < 2) return [null, '选项不足'];
      if (new Set(options).size !== options.length) return [null, '选项重复'];
      let idx = options.indexOf(answer);
      if (idx < 0 && /^[A-D]$/.test(answer)) idx = answer.charCodeAt(0) - 65;
      if (idx < 0 || idx >= options.length) return [null, '答案不在选项中'];
      if (computed !== null && String(computed) !== options[idx]) return [null, '算式答案错误'];
      out = { t: 'choice', o: options, a: idx };
      break;
    }
    case 'true_false': {
      if (!['对', '错', '正确', '错误', '√', '×'].includes(answer)) return [null, '判断题答案不合法'];
      out = { t: 'tf', a: ['对', '正确', '√'].includes(answer) };
      break;
    }
    case 'fill_blank':
    case 'calculation': {
      if (!/^\d{1,4}$/.test(answer)) return [null, `${reasonType}（非整数答案）`];
      const n = Number(answer);
      if (computed !== null && computed !== n) return [null, '算式答案错误'];
      const o = numericChoices(n);
      out = { t: 'choice', o, a: o.indexOf(String(n)) };
      question = question.replace(/___+|（\s*）|\(\s*\)/g, '（？）');
      break;
    }
    case 'word_order': {
      const toks = answer.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
      if (options.length < 2 || new Set(options).size !== options.length) return [null, '排序题选项重复'];
      if (toks.length !== options.length || [...toks].sort().join('|') !== [...options].sort().join('|')) {
        return [null, '排序题答案与选项不一致'];
      }
      out = { t: 'order', o: options, a: toks.map((t) => options.indexOf(t)) };
      break;
    }
    default:
      return [null, reasonType];
  }
  out.q = question;
  out.kp = String(q.knowledge_point ?? '').trim() || ctx.unit;
  if (q.explanation) {
    const ex = cleanLatex(String(q.explanation).trim());
    if (!hasCode(ex)) out.ex = ex;
  }
  // 一二年级中文自动拼音（英语题不注音）
  if (ctx.grade <= 2 && ctx.subject !== 'english') {
    out.qpy = autoPy(question);
    if (out.o) out.opy = out.o.map((o) => autoPy(o) ?? '');
  }
  out.id = crypto.createHash('sha1').update(`${ctx.bookId}|${question}`).digest('hex').slice(0, 10);
  return [out, null];
}

const books = new Map();
for (const subj of Object.keys(SUBJECTS)) {
  const dir = path.join(src, 'output', subj, 'quizzes');
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.startsWith('义务教育教科书')) continue; // 只要默认版本
    const m = file.match(/([一二三四五六])年级([上下])册_unit(\d+)\.json$/);
    if (!m) continue;
    const grade = GRADE_CN[m[1]];
    const term = m[2];
    const unitNo = Number(m[3]);
    const bookId = `${subj}-g${grade}${term === '上' ? 'a' : 'b'}`;
    const d = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!books.has(bookId)) {
      books.set(bookId, {
        id: bookId,
        subject: subj,
        grade,
        term,
        title: String(d.textbook || `${grade}年级${term}册`),
        units: [],
      });
    }
    const book = books.get(bookId);
    const unitTitle = String(d.unit || `第${unitNo}单元`).trim();
    const seen = new Set();
    const qs = [];
    const all = [...(d.unit_test?.questions ?? []), ...(d.exam?.questions ?? [])];
    for (const q of all) {
      const [conv, reason] = convert(q, { grade, subject: subj, unit: unitTitle, bookId });
      if (!conv) {
        bump(drop, reason);
        continue;
      }
      if (seen.has(conv.q)) {
        bump(drop, '重复题目');
        continue;
      }
      seen.add(conv.q);
      qs.push(conv);
      bump(kept, `${subj}-${grade}`);
    }
    if (qs.length) book.units.push({ no: unitNo, id: `${bookId}-u${unitNo}`, title: unitTitle, questions: qs });
  }
}

const index = [];
for (const b of books.values()) {
  b.units.sort((x, y) => x.no - y.no);
  const count = b.units.reduce((s, u) => s + u.questions.length, 0);
  if (!count) continue;
  fs.writeFileSync(path.join(outDir, `${b.id}.json`), JSON.stringify(b));
  index.push({ id: b.id, subject: b.subject, grade: b.grade, term: b.term, title: b.title, units: b.units.length, questions: count });
}
index.sort((a, b) => a.subject.localeCompare(b.subject) || a.grade - b.grade || a.term.localeCompare(b.term));

// 生成静态 require 表（Metro 打包需要静态路径）
const loader =
  `// 自动生成：tools/import-bank/import.mjs，请勿手改\n` +
  `import type { BankBook } from './types';\n\n` +
  `export const BANK_LOADERS: Record<string, () => BankBook> = {\n` +
  index.map((b) => `  '${b.id}': () => require('./${b.id}.json') as BankBook,`).join('\n') +
  `\n};\n`;
fs.writeFileSync(path.join(outDir, 'loaders.ts'), loader);
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 1));

const totalKept = Object.values(kept).reduce((a, b) => a + b, 0);
const totalDrop = Object.values(drop).reduce((a, b) => a + b, 0);
const report = {
  source: 'https://github.com/tanle-mtr/ChinaStudyFree (MIT)',
  importedAt: new Date().toISOString(),
  kept: totalKept,
  dropped: totalDrop,
  keptBySubjectGrade: kept,
  droppedByReason: Object.fromEntries(Object.entries(drop).sort((a, b) => b[1] - a[1])),
};
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
