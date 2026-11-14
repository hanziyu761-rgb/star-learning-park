/**
 * 初中题库导入（V5.2）：ChinaStudyFree（MIT, © 2026 tanle-mtr）七～九年级 → 星星学习乐园题库格式
 *
 * 用法：node tools/import-bank/import-junior.mjs <ChinaStudyFree 仓库目录>
 *
 * 只追加七～九年级的册，一～六年级的题库文件一个字也不改（index.json 里一～六年级的条目原样保留）。
 * 版本：数学“义务教育教科书”（人教版，旧版单元）、语文“统编版”、英语“人教版”。
 * 自动质检（不合格的丢弃，原因统计写入 src/content/bank/report-junior.json）：
 *   - 只保留选择、判断，以及答案是数（整数、负数、小数、分数）的填空/计算题（转为数字选择题）
 *   - 公式代码（LaTeX）转成普通符号（√、³√、²、³、分数线、∠、π 等），转不了的丢弃
 *   - 答案不在选项中、选项重复、判断题答案不合法的丢弃
 *   - 能自动计算的算式（含负数、括号、乘方、开方），答案算错的丢弃
 *   - 同一本书内题干相同的去重
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const src = process.argv[2];
if (!src || !fs.existsSync(path.join(src, 'output'))) {
  console.error('用法：node tools/import-bank/import-junior.mjs <ChinaStudyFree 仓库目录>');
  process.exit(1);
}
const outDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'src', 'content', 'bank');

const GRADE_CN = { 七: 7, 八: 8, 九: 9 };
const PREFIX = { math: '义务教育教科书', chinese: '统编版', english: '人教版' };
const TITLE = { math: '人教版初中数学', chinese: '统编版初中语文', english: '人教版初中英语' };
const UNSAFE = /自杀|跳楼|色情|恐怖|赌/;

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', n: 'ⁿ', m: 'ᵐ', '-': '⁻' };
const sup = (s) => (/^[\dnm-]+$/.test(s) ? [...s].map((c) => SUP[c]).join('') : null);

function cleanMath(inner) {
  let t = inner;
  for (let i = 0; i < 3; i++) {
    t = t
      .replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_, b) => `（${b.split(/\\\\/).map((x) => x.trim()).join('，')}）`)
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => (/^[\w.]+$/.test(a) && /^[\w.]+$/.test(b) ? `${a}/${b}` : `(${a})/(${b})`))
      .replace(/\\d?frac(\d)(\d)/g, '$1/$2')
      .replace(/\\d?frac(\w)\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\d?frac\{([^{}]*)\}(\w)/g, '$1/$2')
      .replace(/\\d?frac(\d)(\w)/g, '$1/$2')
      .replace(/\\sqrt\[3\]\{([^{}]*)\}/g, '³√$1')
      .replace(/\\sqrt\{([^{}]*)\}/g, (_, a) => (/^[\w.]+$/.test(a) ? `√${a}` : `√(${a})`))
      .replace(/\\sqrt(\d+|\w)/g, '√$1');
  }
  t = t
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\pi/g, 'π')
    .replace(/\\angle/g, '∠')
    .replace(/\\triangle/g, '△')
    .replace(/\\circ/g, '°')
    .replace(/\\parallel/g, '∥')
    .replace(/\\perp/g, '⊥')
    .replace(/\\cong/g, '≌')
    .replace(/\\sim/g, '∽')
    .replace(/\\(sin|cos|tan)/g, '$1')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;! ]/g, ' ')
    .replace(/\^\{([^{}]*)\}/g, (m, e) => sup(e) ?? m)
    .replace(/\^([\dnm])/g, (m, e) => sup(e) ?? m)
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}
function clean(s) {
  if (typeof s !== 'string') return s;
  let t = s.replace(/\$([^$]*)\$/g, (_, inner) => cleanMath(inner));
  if (t.includes('\\')) t = cleanMath(t);
  return t.replace(/−/g, '-').trim();
}
const hasCode = (s) => typeof s === 'string' && (/[\\$^]/.test(s) || /[\u0000-\u0009\u000b-\u001f]/.test(s) || /(^|[^tT])imes|rac\{|sqrt/.test(s));

/* ── 自动验算：只认纯数字算式（负数、括号、+ − × ÷、² ³ 乘方、√、³√） ── */
function evalExpr(expr) {
  const s = expr.replace(/\s/g, '').replace(/[＋]/g, '+').replace(/[－−]/g, '-');
  if (!/^[\d+\-×÷().√³²]+$/.test(s) || !/\d/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];
  function num() {
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (!m) throw new Error('num');
    i += m[0].length;
    return Number(m[0]);
  }
  function atom() {
    if (peek() === '(') {
      i++;
      const v = add();
      if (s[i++] !== ')') throw new Error(')');
      return v;
    }
    if (s.startsWith('³√', i)) {
      i += 2;
      return Math.cbrt(atom());
    }
    if (peek() === '√') {
      i++;
      return Math.sqrt(atom());
    }
    return num();
  }
  function power() {
    let v = atom();
    while (peek() === '²' || peek() === '³') v = v ** (s[i++] === '²' ? 2 : 3);
    return v;
  }
  function unary() {
    if (peek() === '-') {
      i++;
      return -unary();
    }
    if (peek() === '+') {
      i++;
      return unary();
    }
    return power();
  }
  function mul() {
    let v = unary();
    while (peek() === '×' || peek() === '÷') v = s[i++] === '×' ? v * unary() : v / unary();
    return v;
  }
  function add() {
    let v = mul();
    while (peek() === '+' || peek() === '-') v = s[i++] === '+' ? v + mul() : v - mul();
    return v;
  }
  try {
    const v = add();
    return i === s.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
/** 题干里的算式：“计算：……= ？”“……= ___” */
function questionExpr(q) {
  const m = q.match(/^(?:计算[:：]?)?\s*(.+?)\s*[=＝]\s*(?:\?|？|___+|（\s*）)?\s*[。.]?$/);
  return m ? evalExpr(m[1]) : null;
}

const NUM = /^-?\d{1,5}(\.\d{1,3})?$|^-?\d{1,3}\/\d{1,3}$/;
const valueOf = (t) => (t.includes('/') ? Number(t.split('/')[0]) / Number(t.split('/')[1]) : Number(t));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** 数字选项：答案 + 常见错误（符号错、差 1、分数分子分母颠倒等） */
function numericChoices(ans, question = '') {
  // 题目里没有负数时不放“符号写反”的干扰项（例如边长、角度）
  const signed = ans.startsWith('-') || /-\s*\d|-\(|负/.test(question);
  const set = [ans];
  const push = (t) => {
    if (set.length < 4 && !set.includes(t)) set.push(t);
  };
  if (ans.includes('/')) {
    const neg = ans.startsWith('-');
    const [n, d] = ans.replace('-', '').split('/').map(Number);
    const f = (a, b) => {
      const g = gcd(a, b);
      const x = a / g;
      const y = b / g;
      return `${neg ? '-' : ''}${y === 1 ? x : `${x}/${y}`}`;
    };
    if (n !== d) push(f(d, n));
    push(f(n + 1, d));
    if (signed) push(neg ? `${n}/${d}` : `-${n}/${d}`);
    push(f(n, d + 1));
    push(f(n * 2, d));
  } else {
    const v = Number(ans);
    const dec = ans.includes('.') ? ans.split('.')[1].length : 0;
    if (v !== 0 && signed) push(String(-v));
    for (const d of [1, -1, 2, -2, 10]) if (signed || v + d * 10 ** -dec >= 0) push(String(Number((v + d * 10 ** -dec).toFixed(dec))));
  }
  return set.sort((a, b) => valueOf(a) - valueOf(b));
}

function convert(q, ctx) {
  const question = clean(String(q.question ?? '').trim());
  const options = Array.isArray(q.options) ? q.options.map((o) => clean(String(o).trim())) : [];
  const answer = clean(typeof q.answer === 'string' ? q.answer.trim() : String(q.answer ?? '').trim());
  if (!question) return [null, '题干为空'];
  if (hasCode(question) || options.some(hasCode) || hasCode(answer)) return [null, '含无法转换的公式代码'];
  if (UNSAFE.test(question) || options.some((o) => UNSAFE.test(o))) return [null, '含不适合的词语'];
  const computed = questionExpr(question);
  let out;
  switch (q.type) {
    case 'choice': {
      if (options.length < 2) return [null, '选项不足'];
      if (new Set(options).size !== options.length) return [null, '选项重复'];
      let idx = options.indexOf(answer);
      if (idx < 0 && /^[A-D]$/.test(answer)) idx = answer.charCodeAt(0) - 65;
      if (idx < 0 || idx >= options.length) return [null, '答案不在选项中'];
      if (computed !== null && NUM.test(options[idx]) && Math.abs(computed - valueOf(options[idx])) > 1e-9)
        return [null, '算式答案错误'];
      out = { t: 'choice', o: options, a: idx };
      break;
    }
    case 'true_false': {
      if (!['对', '错', '正确', '错误', '√', '×', 'True', 'False', 'T', 'F'].includes(answer)) return [null, '判断题答案不合法'];
      out = { t: 'tf', a: ['对', '正确', '√', 'True', 'T'].includes(answer) };
      break;
    }
    case 'fill_blank':
    case 'calculation': {
      if (!NUM.test(answer)) return [null, `填空题（答案不是数）`];
      if (computed !== null && Math.abs(computed - valueOf(answer)) > 1e-9) return [null, '算式答案错误'];
      const o = numericChoices(answer, question);
      out = { t: 'choice', o, a: o.indexOf(answer) };
      break;
    }
    default:
      return [null, `题型 ${q.type}`];
  }
  out.q = q.type === 'fill_blank' || q.type === 'calculation' ? question.replace(/___+|（\s*）|\(\s*\)/g, '（？）') : question;
  out.kp = String(q.knowledge_point ?? '').trim() || ctx.unit;
  if (q.explanation) {
    const ex = clean(String(q.explanation).trim());
    if (!hasCode(ex)) out.ex = ex;
  }
  out.id = crypto.createHash('sha1').update(`${ctx.bookId}|${out.q}`).digest('hex').slice(0, 10);
  return [out, null];
}


/** 人工抽查发现有错的题（题目 id → 原因），导入时剔除（V5.2 逐题看过全部语文、英语题） */
const REJECT = {
  '87d37f37bd': '新闻六要素指时间、地点、人物、起因、经过、结果，选项给的是新闻结构',
  f636d4ac16: '选项有错别字（取取消）',
  b49f09a044: '判断句标志的说法不准确',
  '0ec1bc1e4b': '与单元内容无关',
  db2ac01c8d: '说法错误（“是、标志、说明”不是判断句标志）',
  f95a0d60fa: '说法不准确',
  '64a787856d': '说法错误',
  c68cd33ccc: '答案错误：应选 will（will be rain 不通）',
  '91f6010cd7': '答案错误：空前已有 the，应选 tallest',
  '15d65078ca': '几个选项都说得通，答案不唯一',
  '448d075dc0': '说法不准确',
  '71e15a4194': '中文句子本身不通',
  '9bcdf9e5ba': '答案错误：than 前应用比较级 longer',
  '06b79268f5': '说法不准确',
  '43490a61ff': '答案不唯一（saw 也常用）',
  '7727a8b576': '题目句子不通',
  '6acb3aa74d': '说法不准确',
};

const drop = {};
const kept = {};
const bump = (o, k) => (o[k] = (o[k] ?? 0) + 1);
const books = new Map();
for (const subj of Object.keys(PREFIX)) {
  const dir = path.join(src, 'output', subj, 'quizzes');
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.startsWith(PREFIX[subj])) continue;
    const m = file.match(/([七八九])年级([上下])册_unit(\d+)\.json$/);
    if (!m) continue;
    const grade = GRADE_CN[m[1]];
    const term = m[2];
    const unitNo = Number(m[3]);
    const bookId = `${subj}-g${grade}${term === '上' ? 'a' : 'b'}`;
    const d = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!books.has(bookId))
      books.set(bookId, { id: bookId, subject: subj, grade, term, title: `${TITLE[subj]}${m[1]}年级${term}册`, units: [] });
    const book = books.get(bookId);
    const unitTitle = String(d.unit || `第${unitNo}单元`).trim();
    const seen = new Set();
    const qs = [];
    for (const q of [...(d.unit_test?.questions ?? []), ...(d.exam?.questions ?? [])]) {
      const [conv, reason] = convert(q, { unit: unitTitle, bookId });
      if (!conv) {
        bump(drop, reason);
        continue;
      }
      if (REJECT[conv.id]) {
        bump(drop, '人工抽查有错');
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
    // 剔除错题后不足 4 道的单元不放进题库闯关（V5.2：语文九年级上册“文言文与古诗”只剩 1 道）
    if (qs.length >= 4) book.units.push({ no: unitNo, id: `${bookId}-u${unitNo}`, title: unitTitle, questions: qs });
    else if (qs.length) {
      drop[`所在单元不足 4 道（${bookId}-u${unitNo}）`] = qs.length;
      kept[`${subj}-${grade}`] -= qs.length;
    }
  }
}

// 保留一～六年级条目原样，只替换七～九年级
const index = JSON.parse(fs.readFileSync(path.join(outDir, 'index.json'), 'utf8')).filter((b) => b.grade <= 6);
for (const b of books.values()) {
  b.units.sort((x, y) => x.no - y.no);
  const count = b.units.reduce((s, u) => s + u.questions.length, 0);
  if (!count) continue;
  fs.writeFileSync(path.join(outDir, `${b.id}.json`), JSON.stringify(b));
  index.push({ id: b.id, subject: b.subject, grade: b.grade, term: b.term, title: b.title, units: b.units.length, questions: count });
}
index.sort((a, b) => a.subject.localeCompare(b.subject) || a.grade - b.grade || a.term.localeCompare(b.term));

const loader =
  `// 自动生成：tools/import-bank/import.mjs（一～六年级）、import-junior.mjs（七～九年级），请勿手改\n` +
  `import type { BankBook } from './types';\n\n` +
  `export const BANK_LOADERS: Record<string, () => BankBook> = {\n` +
  [...index]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `  '${b.id}': () => require('./${b.id}.json') as BankBook,`)
    .join('\n') +
  `\n};\n`;
fs.writeFileSync(path.join(outDir, 'loaders.ts'), loader);
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 1) + '\n');

const report = {
  source: 'https://github.com/tanle-mtr/ChinaStudyFree (MIT)，七～九年级',
  importedAt: new Date().toISOString(),
  kept: Object.values(kept).reduce((a, b) => a + b, 0),
  dropped: Object.values(drop).reduce((a, b) => a + b, 0),
  keptBySubjectGrade: kept,
  droppedByReason: Object.fromEntries(Object.entries(drop).sort((a, b) => b[1] - a[1])),
};
fs.writeFileSync(path.join(outDir, 'report-junior.json'), JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify(report, null, 1));
