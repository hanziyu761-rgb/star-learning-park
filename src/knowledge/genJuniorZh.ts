/**
 * 七～九年级语文：由积累资料（juniorZhData.ts）程序出题（V5.2.4，本项目原创，已通过教师审核）。
 *
 * 每条资料能出几种题：
 * - 作品：作者是谁 / 哪一篇是某人的作品 / 哪个时代（哪国）的作品        签名 w:编号:题型
 * - 名句：下一句 / 上一句 / 出自哪里                                    签名 l:编号:题型
 * - 文言：句子中某个字词的意思                                          签名 v:编号
 * 干扰项从全部资料里按签名固定地挑（同一道题每次一样），并排除“也算对”的选项
 * （同一作者的其他作品、同一时代、名句同时出自整部书和其中一篇等）。
 */
import type { UpperGen } from './genUpper';
import { ZH_DATA, ZH_IDIOMS, ZH_SETS, ZH_SETS_OF } from './juniorZhData';

type Built = ReturnType<UpperGen['build']>;
const zhSay = (text: string) => ({ text, lang: 'zh-CN' as const });

function rows(block: string | undefined, n: number): string[][] {
  if (!block) return [];
  const out = block
    .trim()
    .split('\n')
    .map((l) => l.trim().split('|'));
  for (const r of out) if (r.length !== n) throw new Error(`语文资料格式错误：${r.join('|')}`);
  return out;
}

interface Work { title: string; author: string; era: string }
interface Line { up: string; down: string; src: string }
interface Wen { sent: string; word: string; mean: string; wrongs: string[] }

const UNITS = Object.keys(ZH_DATA);
const WORKS: Record<string, Work[]> = {};
const LINES: Record<string, Line[]> = {};
const WENS: Record<string, Wen[]> = {};
for (const u of UNITS) {
  WORKS[u] = rows(ZH_DATA[u].works, 3).map(([title, author, era]) => ({ title, author, era }));
  LINES[u] = rows(ZH_DATA[u].lines, 3).map(([up, down, src]) => ({ up, down, src }));
  WENS[u] = rows(ZH_DATA[u].wenyan, 4).map(([sent, word, mean, w]) => ({ sent, word, mean, wrongs: w.split('/') }));
}
const ALL_WORKS = UNITS.flatMap((u) => WORKS[u]);
/** 知识例句：每组 [句子, 类别]，单元按登记取单号或双号 */
const SETS = Object.fromEntries(
  Object.entries(ZH_SETS).map(([k, v]) => [k, rows(v.lines, 2)]),
) as Record<string, string[][]>;
/** 成语：[成语, 意思, 类] */
const IDIOMS = rows(ZH_IDIOMS, 3);
/** 每个单元的知识题：[组名, 在这一组里的编号] */
const SKILL: Record<string, [string, number][]> = {};
for (const [u, specs] of Object.entries(ZH_SETS_OF)) {
  SKILL[u] = [];
  for (const spec of specs.split(',')) {
    const [set, part] = spec.split(':');
    const n = set === '成语' ? IDIOMS.length : SETS[set]?.length;
    if (!n) throw new Error(`没有这组知识例句：${spec}`);
    const [k, m] = part ? part.split('/').map(Number) : [0, 1];
    for (let i = 0; i < n; i++) if (i % m === k) SKILL[u].push([set, i]);
  }
}
const QAS: Record<string, string[][]> = Object.fromEntries(UNITS.map((u) => [u, rows(ZH_DATA[u].qa, 4)]));
const ALL_LINES = UNITS.flatMap((u) => LINES[u]);

/* ── 分类 ── */
const FOREIGN = ['印度', '美国', '英国', '法国', '德国', '丹麦', '奥地利', '俄国', '苏联', '日本'];
const MODERN = ['现代', '当代', '近代'];
type Kind = 'foreign' | 'modern' | 'classic';
const kindOf = (w: Work): Kind => (FOREIGN.includes(w.era) ? 'foreign' : MODERN.includes(w.era) ? 'modern' : 'classic');
/** 作者是一个人（不是书名、说明或“民歌”） */
const isPerson = (a: string) => !/^[《（]/.test(a) && !a.endsWith('民歌') && !a.includes('及其');
const isBook = (a: string) => a.startsWith('《');
const book = (t: string) => (t.startsWith('《') ? t : `《${t}》`);
/** 这几部是“编”的，问编者 */
const EDITED = ['世说新语', '资治通鉴'];
/** 成书年代有争议的（《列子》），不出“哪个时代”题 */
const NO_ERA = ['愚公移山'];

/** 古代的时代干扰项（不用“编定”这类说法） */
const ERAS = ['先秦', '西汉', '东汉', '东晋', '唐代', '北宋', '南宋', '元代', '明代', '清代'];
const PRE_QIN = ['先秦', '春秋', '战国'];
/** 两个时代说法会不会“都算对” */
function eraClash(a: string, b: string): boolean {
  if (a === b) return true;
  if (PRE_QIN.includes(a) && PRE_QIN.includes(b)) return true;
  if ((a === '三国' && b.startsWith('东汉')) || (b === '三国' && a.startsWith('东汉'))) return true;
  return [...'秦汉晋宋唐元明清'].some((ch) => a.includes(ch) && b.includes(ch));
}
/** 国别：俄国、苏联容易混，阿西莫夫生在俄国 */
function nationClash(a: string, b: string, author: string): boolean {
  if (a === b) return true;
  if (['俄国', '苏联'].includes(a) && ['俄国', '苏联'].includes(b)) return true;
  return author === '阿西莫夫' && ['俄国', '苏联'].includes(b);
}
/** 整部书和书里的篇目（名句“出自哪里”时两个都算对，不能同时做选项） */
const BOOK_SOURCES = ['《论语》', '《孟子》', '《礼记》', '《庄子》', '《老子》'];

/* ── 固定的“随机”：由签名决定 ── */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** 从候选里挑 n 个干扰项：去掉答案和重复，优先挑 prefer 的，顺序由 key 固定 */
function pickWrongs(cands: string[], ans: string, key: string, n = 3, prefer?: (c: string) => boolean): string[] {
  const uniq = [...new Set(cands)].filter((c) => c && c !== ans);
  const order = (c: string) => hashStr(`${key}#${c}`);
  uniq.sort((x, y) => order(x) - order(y));
  if (prefer) uniq.sort((x, y) => Number(prefer(y)) - Number(prefer(x)));
  return uniq.slice(0, n);
}
function built(q: string, ans: string, wrongs: string[], ex: string, key: string): Built {
  const all = [ans, ...wrongs];
  const k = hashStr(key) % all.length;
  const list = [...all.slice(k), ...all.slice(0, k)];
  return {
    prompt: { text: q, speak: zhSay(q) },
    options: list.map((t) => ({ id: t, text: t, speak: zhSay(t) })),
    answerId: ans,
    explanation: ex,
    wrongHint: { text: '再想一想', speak: zhSay('再想一想') },
  };
}

/* ── 作品题 ── */
function workForms(w: Work): number[] {
  const f: number[] = [];
  if (isPerson(w.author) || isBook(w.author)) f.push(0);
  if (isPerson(w.author)) f.push(1);
  const k = kindOf(w);
  if (k === 'foreign' || (k === 'classic' && !w.era.includes('编') && !NO_ERA.includes(w.title))) f.push(2);
  return f;
}
function authorIntro(w: Work): string {
  // 现代作者里有科学家、航天员，不统称“作家”
  return kindOf(w) === 'modern' ? w.author : `${w.era}的${w.author}`;
}
function buildWork(w: Work, form: number, key: string): Built | null {
  const k = kindOf(w);
  if (form === 0 && isBook(w.author)) {
    const cands = [...ALL_WORKS.filter((x) => isBook(x.author)).map((x) => x.author), '《史记》', '《论语》', '《礼记》'];
    return built(`${book(w.title)}选自哪部书？`, w.author, pickWrongs(cands, w.author, key), `${book(w.title)}选自${w.author}。`, key);
  }
  if (form === 0) {
    const others = ALL_WORKS.filter((x) => isPerson(x.author) && x.author !== w.author);
    const cands = others.map((x) => x.author);
    const word = EDITED.includes(w.title) ? '编者' : '作者';
    return built(
      `${book(w.title)}的${word}是谁？`,
      w.author,
      pickWrongs(cands, w.author, key, 3, (c) => others.some((x) => x.author === c && kindOf(x) === k)),
      `${book(w.title)}的${word}是${authorIntro(w)}。`,
      key,
    );
  }
  if (form === 1) {
    // 这个作者的全部作品都不能当干扰项
    const mine = new Set(ALL_WORKS.filter((x) => x.author === w.author).map((x) => book(x.title)));
    const others = ALL_WORKS.filter((x) => !mine.has(book(x.title)));
    return built(
      `下面哪一篇（部）是${w.author}的作品？`,
      book(w.title),
      pickWrongs(others.map((x) => book(x.title)), book(w.title), key, 3, (c) => others.some((x) => book(x.title) === c && kindOf(x) === k)),
      `${book(w.title)}的作者是${authorIntro(w)}。`,
      key,
    );
  }
  if (form === 2 && k === 'foreign') {
    const cands = FOREIGN.filter((c) => !nationClash(w.era, c, w.author));
    return built(`${book(w.title)}的作者${w.author}是哪国人？`, w.era, pickWrongs(cands, w.era, key), `${w.author}是${w.era}人。`, key);
  }
  if (form === 2) {
    const cands = ERAS.filter((c) => !eraClash(w.era, c));
    const by = isPerson(w.author) ? `，作者是${w.author}` : '';
    return built(`${book(w.title)}是哪个时代的作品？`, w.era, pickWrongs(cands, w.era, key), `${book(w.title)}是${w.era}的作品${by}。`, key);
  }
  return null;
}

/* ── 名句题 ── */
const len = (s: string) => [...s.replace(/[，。、；！？]/g, '')].length;
function buildLine(l: Line, form: number, key: string): Built | null {
  const src = book(l.src);
  const ex = `出自${src}：“${l.up}，${l.down}。”`;
  if (form === 0) {
    const cands = ALL_LINES.filter((x) => x.up !== l.up).map((x) => x.down);
    return built(`“${l.up}”的下一句是？`, l.down, pickWrongs(cands, l.down, key, 3, (c) => len(c) === len(l.down)), ex, key);
  }
  if (form === 1) {
    const cands = ALL_LINES.filter((x) => x.down !== l.down).map((x) => x.up);
    return built(`“${l.down}”的上一句是？`, l.up, pickWrongs(cands, l.up, key, 3, (c) => len(c) === len(l.up)), ex, key);
  }
  if (form === 2) {
    const isB = BOOK_SOURCES.includes(src);
    const cands = isB ? BOOK_SOURCES : [...new Set(ALL_LINES.map((x) => book(x.src)))].filter((s) => !BOOK_SOURCES.includes(s));
    return built(`“${l.up}，${l.down}”出自哪里？`, src, pickWrongs(cands, src, key), ex, key);
  }
  return null;
}

/* ── 文言词义题 ── */
function buildWen(v: Wen, key: string): Built {
  return built(`“${v.sent}”中的“${v.word}”是什么意思？`, v.mean, v.wrongs, `“${v.sent}”中，“${v.word}”是“${v.mean}”的意思。`, key);
}

/* ── 阅读写作知识题 ── */
function buildSkill(kp: string, i: number, key: string): Built | null {
  const ref = SKILL[kp]?.[i];
  if (!ref) return null;
  const [set, j] = ref;
  if (set === '成语') {
    const [w, mean, cls] = IDIOMS[j];
    const others = IDIOMS.filter((r) => r[2] !== cls).map((r) => r[1]);
    return built(`成语“${w}”的意思是？`, mean, pickWrongs(others, mean, key), `“${w}”：${mean}。`, key);
  }
  const [sent, cat] = SETS[set][j];
  const cats = [...new Set(SETS[set].map((r) => r[1]))];
  const ex = set === '病句' ? `这个句子的毛病是${cat}。${ZH_SETS[set].ex}` : `这句话用了${cat}。${ZH_SETS[set].ex}`;
  return built(`${ZH_SETS[set].q}“${sent}”`, cat, pickWrongs(cats, cat, key), ex, key);
}
function buildQa(kp: string, i: number, key: string): Built | null {
  const r = QAS[kp]?.[i];
  if (!r) return null;
  const [q, ans, w, ex] = r;
  return built(q, ans, w.split('/'), ex, key);
}

/** 这个单元能出的全部资料题签名 */
export function zhDataSigs(kp: string): string[] {
  const out: string[] = [];
  (WORKS[kp] ?? []).forEach((w, i) => workForms(w).forEach((f) => out.push(`w:${i}:${f}`)));
  (LINES[kp] ?? []).forEach((_, i) => [0, 1, 2].forEach((f) => out.push(`l:${i}:${f}`)));
  (WENS[kp] ?? []).forEach((_, i) => out.push(`v:${i}`));
  (SKILL[kp] ?? []).forEach((_, i) => out.push(`k:${i}`));
  (QAS[kp] ?? []).forEach((_, i) => out.push(`q:${i}`));
  return out;
}

export function buildZhData(kp: string, sig: string): Built | null {
  const [t, a, b] = sig.split(':');
  const i = Number(a);
  const key = `${kp}:${sig}`;
  if (t === 'w') {
    const w = WORKS[kp]?.[i];
    return w && workForms(w).includes(Number(b)) ? buildWork(w, Number(b), key) : null;
  }
  if (t === 'l') {
    const l = LINES[kp]?.[i];
    return l ? buildLine(l, Number(b), key) : null;
  }
  if (t === 'k') return buildSkill(kp, i, key);
  if (t === 'q') return buildQa(kp, i, key);
  if (t === 'v') {
    const v = WENS[kp]?.[i];
    return v ? buildWen(v, key) : null;
  }
  return null;
}

/** 原来的小题库 + 资料题合成一个出题程序：每道题被抽到的机会一样 */
export function withZhData(kp: string, pool: UpperGen & { n: number }): UpperGen {
  const extra = zhDataSigs(kp);
  const total = pool.n + extra.length;
  return {
    make: (rand) => {
      const i = Math.floor(rand() * total);
      return i < pool.n ? `z:${i}` : extra[i - pool.n];
    },
    build: (sig) => {
      if (sig.startsWith('z:')) return pool.build(sig);
      const b = buildZhData(kp, sig);
      if (!b) throw new Error(`没有这道语文题：${kp}:${sig}`);
      return b;
    },
  };
}
