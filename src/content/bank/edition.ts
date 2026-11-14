/**
 * 新版教材单元编排（V2.4）。
 *
 * 2024 年秋季起，小学一年级换用新修订教材（数学：人教版 2024；语文：统编版 2024），
 * 2026 年秋季起一～六年级全部换成新教材。题库 ChinaStudyFree 是按旧版（2012/2016 版）单元整理的，
 * 这里把题库题目按新版教材的单元重新分组：
 * - 单元名称、顺序依据公开的新版教材目录（只用单元名和课题名，不用教材正文和习题）；
 * - 每个新单元的题目来自内容对应的旧版题库单元（按内容归类，不是新教材原题）；
 * - 新版已删去的课文（如《四个太阳》《彩虹》），题目中提到它们的题不再出现；
 * - 旧版有、新版一年级不再单列的单元（找规律、分类与整理）不在新版一年级中出现。
 *
 * 目前只完成了一年级（数学、语文）；二～六年级仍按旧版单元，见 editionText()。
 * 旧单元 id（如 math-g1a-u3）仍能找到原题，保证以前的练习记录和复习不受影响。
 */
import type { BankBook, BankQuestion, BankUnit } from './types';

export interface EditionUnit {
  no: number;
  /** 单元名称（新版教材目录） */
  title: string;
  /** 题目来自哪些旧版题库单元 */
  from: string[];
  /** 本单元对应的一年级原创知识点（用于试卷按单元出原创计算题） */
  kps?: string[];
}

export interface EditionBook {
  /** 例如“人教版（2024年新版）” */
  name: string;
  /** 新版删去的课文：题目里用书名号提到它们的不再出现 */
  removedTexts: string[];
  units: EditionUnit[];
}

export const NEW_EDITION: Record<string, EditionBook> = {
  'math-g1a': {
    name: '人教版（2024年新版）',
    removedTexts: [],
    units: [
      { no: 0, title: '数学游戏（数一数、位置、认钟表）', from: ['math-g1a-u1', 'math-g1a-u2', 'math-g1a-u7'], kps: ['m1.position', 'm1.clock'] },
      { no: 1, title: '5以内数的认识和加、减法', from: ['math-g1a-u3'], kps: ['m1.count5', 'm1.zero', 'm1.compose5', 'm1.add5', 'm1.sub5'] },
      { no: 2, title: '6～10的认识和加、减法', from: ['math-g1a-u5'], kps: ['m1.count10', 'm1.compare10', 'm1.compose10', 'm1.add10', 'm1.sub10', 'm1.wordprob10'] },
      { no: 3, title: '认识立体图形', from: ['math-g1a-u4'], kps: ['m1.shapes3d'] },
      { no: 4, title: '11～20的认识', from: ['math-g1a-u6'], kps: ['m1.count20'] },
      { no: 5, title: '20以内的进位加法', from: ['math-g1a-u8'], kps: ['m1.make10', 'm1.carry20'] },
      { no: 6, title: '复习与关联', from: ['math-g1a-u9'] },
    ],
  },
  'math-g1b': {
    name: '人教版（2024年新版）',
    removedTexts: [],
    units: [
      { no: 1, title: '认识平面图形', from: ['math-g1b-u1'], kps: ['m1.shapes2d'] },
      { no: 2, title: '20以内的退位减法', from: ['math-g1b-u2'], kps: ['m1.borrow20'] },
      { no: 3, title: '100以内数的认识', from: ['math-g1b-u4'], kps: ['m1.count100'] },
      { no: 4, title: '100以内的口算加、减法', from: ['math-g1b-u6'], kps: ['m1.addsub100'] },
      // 新版把两位数的笔算加减从二年级提前到一年级下册，题目取自旧版二年级上册对应单元
      { no: 5, title: '100以内的笔算加、减法', from: ['math-g2a-u2'] },
      { no: 6, title: '数量间的加减关系 · 欢乐购物街（认识人民币）', from: ['math-g1b-u5'], kps: ['m1.money'] },
      { no: 7, title: '复习与关联', from: ['math-g1b-u8'] },
    ],
  },
  'chinese-g1a': {
    name: '统编版（2024年新版）',
    removedTexts: ['画', '青蛙写诗'],
    units: [
      { no: 0, title: '开篇：我上学了', from: ['chinese-g1a-u1'] },
      { no: 1, title: '识字：天地人、金木水火土、口耳目手足、日月山川', from: ['chinese-g1a-u2'] },
      { no: 2, title: '汉语拼音：单韵母和声母（第二、三单元）', from: ['chinese-g1a-u3'] },
      { no: 4, title: '汉语拼音：复韵母和鼻韵母（第四单元）', from: ['chinese-g1a-u4'] },
      { no: 5, title: '阅读：秋天、江南、雪地里的小画家、四季', from: ['chinese-g1a-u5'] },
      { no: 6, title: '识字：对韵歌、日月明、小书包、升国旗', from: ['chinese-g1a-u6'] },
      { no: 7, title: '阅读：小小的船、影子、两件宝、比尾巴、乌鸦喝水、雨点儿（第七、八单元）', from: ['chinese-g1a-u7'] },
      { no: 99, title: '综合复习（不对应教材单元）', from: ['chinese-g1a-u8'] },
    ],
  },
  'chinese-g1b': {
    name: '统编版（2024年新版）',
    removedTexts: ['四个太阳', '彩虹', '一个接一个'],
    units: [
      { no: 1, title: '识字：春夏秋冬、姓氏歌、小青蛙、猜字谜', from: ['chinese-g1b-u1'] },
      { no: 2, title: '阅读：热爱中国共产党、吃水不忘挖井人、我多想去看看', from: ['chinese-g1b-u2'] },
      { no: 3, title: '阅读：小公鸡和小鸭子、树和喜鹊、怎么都快乐', from: ['chinese-g1b-u3'] },
      { no: 4, title: '阅读：静夜思、夜色、端午粽', from: ['chinese-g1b-u4'] },
      { no: 5, title: '识字：动物儿歌、古对今、操场上、人之初', from: ['chinese-g1b-u5'] },
      { no: 6, title: '阅读：古诗二首（池上、小池）、浪花、荷叶圆圆、要下雨了', from: ['chinese-g1b-u6'] },
      { no: 7, title: '阅读：文具的家、一分钟、动物王国开大会、小猴子下山', from: ['chinese-g1b-u7'] },
      { no: 8, title: '阅读：棉花姑娘、咕咚、小壁虎借尾巴', from: ['chinese-g1b-u8'] },
    ],
  },
};

/** 新版单元 id，例如 math-g1a-n0 */
export const editionUnitId = (bookId: string, no: number) => `${bookId}-n${no}`;
/** 单元 id → 所在册 id（旧版 -u3、新版 -n3 都可以） */
export const bookIdOfUnit = (unitId: string) => unitId.replace(/-[un]\d+$/, '');

/** 题目是否提到新版已删去的课文 */
export function mentionsRemoved(q: BankQuestion, removed: string[]): boolean {
  if (!removed.length) return false;
  const text = [q.q, ...(q.o ?? []), q.ex ?? ''].join(' ');
  return removed.some((t) => text.includes(`《${t}》`));
}

/**
 * 按新版单元重新分组。loadRaw 读取旧版题库册。
 * 同一道题在一个新单元里只出现一次；不同来源册的题目 id 如有重复，加上来源单元前缀区分。
 */
export function regroup(book: BankBook, ed: EditionBook, loadRaw: (id: string) => BankBook | undefined): BankBook {
  const units: BankUnit[] = ed.units.map((eu) => {
    const seen = new Set<string>();
    const questions: BankQuestion[] = [];
    for (const src of eu.from) {
      const raw = loadRaw(bookIdOfUnit(src))?.units.find((u) => u.id === src);
      if (!raw) throw new Error(`新版单元 ${eu.title} 的来源单元 ${src} 不存在`);
      for (const q of raw.questions) {
        if (mentionsRemoved(q, ed.removedTexts)) continue;
        const id = seen.has(q.id) ? `${src}:${q.id}` : q.id;
        seen.add(id);
        questions.push(id === q.id ? q : { ...q, id });
      }
    }
    return { no: eu.no, id: editionUnitId(book.id, eu.no), title: eu.title, questions };
  });
  return { ...book, title: `${book.title}（按${ed.name}单元编排）`, units };
}

const OLD_EDITION: Record<string, string> = { math: '人教版', chinese: '统编版', english: '人教版 PEP' };
const JUNIOR_EDITION: Record<string, string> = { math: '人教版', chinese: '统编版', english: '人教版' };

/** 试卷、题库页上的“依据哪个版本”说明 */
export function editionText(bookId: string): string {
  const ed = NEW_EDITION[bookId];
  if (ed) return ed.name;
  const subject = bookId.split('-')[0];
  // 初中题库（V5.2）：按题库自己的单元分组，不是某一册课本的章节
  const g = Number(/-g(\d)/.exec(bookId)?.[1]);
  if (g >= 7) return `${JUNIOR_EDITION[subject] ?? ''}（初中，按题库单元分组）`;
  return `${OLD_EDITION[subject] ?? ''}（旧版，新版单元待更新）`;
}

/** 单元序号的显示：数学游戏/开篇显示 ★，综合复习显示“复” */
export const unitBadge = (u: Pick<BankUnit, 'no'>) => (u.no === 0 ? '★' : u.no >= 90 ? '复' : String(u.no));
