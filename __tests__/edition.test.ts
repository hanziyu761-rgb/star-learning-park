/**
 * V2.4：一年级按新版教材（2024）单元编排。
 * 单元名称与顺序、题目来源、删去课文的题不出现、旧记录仍能找到、试卷按新单元出题。
 */
import {
  BANK_INDEX,
  findBankExercise,
  findUnit,
  loadBook,
  loadRawBook,
  NEW_EDITION,
} from '@/content/bank';
import { mentionsRemoved } from '@/content/bank/edition';
import { buildExam } from '@/exam/build';
import { kpExercise } from '@/knowledge/generators';
import { UNIT_TO_KP } from '@/knowledge/graph';
import { kpForRecord } from '@/knowledge/mapping';

jest.mock('expo-print', () => ({ printAsync: jest.fn(() => Promise.resolve()) }));

const titles = (id: string) => loadBook(id)!.units.map((u) => u.title);

describe('一年级新版单元', () => {
  it('数学上册：数学游戏开头，5以内 → 6～10 → 立体图形 → 11～20 → 进位加法 → 复习与关联', () => {
    expect(titles('math-g1a')).toEqual([
      '数学游戏（数一数、位置、认钟表）',
      '5以内数的认识和加、减法',
      '6～10的认识和加、减法',
      '认识立体图形',
      '11～20的认识',
      '20以内的进位加法',
      '复习与关联',
    ]);
  });

  it('数学下册：新增笔算、数量间的加减关系；找规律、分类与整理不再单列', () => {
    const t = titles('math-g1b');
    expect(t).toEqual([
      '认识平面图形',
      '20以内的退位减法',
      '100以内数的认识',
      '100以内的口算加、减法',
      '100以内的笔算加、减法',
      '数量间的加减关系 · 欢乐购物街（认识人民币）',
      '复习与关联',
    ]);
    expect(t.some((x) => /找规律|分类/.test(x))).toBe(false);
  });

  it('语文：上册开篇+识字+拼音+阅读；下册 8 个单元，含新课文《热爱中国共产党》《浪花》', () => {
    expect(titles('chinese-g1a')[0]).toBe('开篇：我上学了');
    expect(titles('chinese-g1a')).toHaveLength(8);
    expect(titles('chinese-g1b')).toHaveLength(8);
    expect(titles('chinese-g1b').join()).toContain('热爱中国共产党');
    expect(titles('chinese-g1b').join()).toContain('浪花');
  });

  it('每道题都来自声明的旧版单元；删去课文的题不出现；每个新单元都有足够的题', () => {
    for (const [bookId, ed] of Object.entries(NEW_EDITION)) {
      const book = loadBook(bookId)!;
      for (const [i, eu] of ed.units.entries()) {
        const unit = book.units[i];
        const src = new Map(
          eu.from.flatMap((s) => loadRawBook(s.replace(/-u\d+$/, ''))!.units.find((u) => u.id === s)!.questions.map((q) => [q.id, q])),
        );
        for (const q of unit.questions) {
          expect(src.get(q.id)).toBe(q);
          expect(mentionsRemoved(q, ed.removedTexts)).toBe(false);
        }
        expect(unit.questions.length).toBeGreaterThanOrEqual(20);
      }
    }
    const all = loadBook('chinese-g1b')!.units.flatMap((u) => u.questions.map((q) => q.q + (q.ex ?? '')));
    expect(all.some((x) => x.includes('《四个太阳》'))).toBe(false);
    // 原始题库里确实有，说明是被筛掉的
    expect(
      loadRawBook('chinese-g1b')!.units.some((u) => u.questions.some((q) => q.q.includes('《四个太阳》'))),
    ).toBe(true);
  });

  it('题库目录的单元数、题数按新版统计', () => {
    for (const id of Object.keys(NEW_EDITION)) {
      const entry = BANK_INDEX.find((b) => b.id === id)!;
      const book = loadBook(id)!;
      expect(entry.units).toBe(book.units.length);
      expect(entry.questions).toBe(book.units.reduce((s, u) => s + u.questions.length, 0));
    }
  });
});

describe('旧记录兼容', () => {
  it('旧版单元 id 仍能找到原题（今日复习、学习记录）', () => {
    const q = loadRawBook('math-g1b')!.units[6].questions[0]; // 旧版“找规律”
    expect(findUnit('math-g1b-u7')?.unit.title).toBe('找规律');
    expect(findBankExercise('bank:math-g1b-u7', q.id)?.exercise.id).toBe(q.id);
  });

  it('旧版语文单元的记录归到新版对应的知识点；旧签名的题仍能出', () => {
    expect(UNIT_TO_KP['chinese-g1a-n5']).toBe('c1.a5');
    expect(UNIT_TO_KP['chinese-g1a-u5']).toBe('c1.a5');
    expect(UNIT_TO_KP['chinese-g1b-u8']).toBe('c1.b8');
    const q = loadRawBook('chinese-g1a')!.units[4].questions[0];
    expect(kpForRecord('bank:chinese-g1a-u5', q.id, 'bank:chinese:x')).toBe('c1.a5');
    expect(kpExercise('c1.a5', `b:chinese-g1a-u5:${q.id}`).skill).toBe('c1.a5');
  });
});

describe('试卷按新版单元', () => {
  it('一年级下册只选“笔算”单元也能出卷；副标题写明新版', () => {
    const e = buildExam({ subject: 'math', grade: 1, term: '下', units: ['math-g1b-n5'], size: 20, seed: 9 });
    expect(e.sections.flatMap((s) => s.items)).toHaveLength(20);
    expect(e.scopeText).toBe('范围：100以内的笔算加、减法');
    expect(e.subtitle).toContain('人教版（2024年新版）');
  });

  it('一年级上册选“20以内的进位加法”：原创计算题只来自该单元的知识点', () => {
    const e = buildExam({ subject: 'math', grade: 1, term: '上', units: ['math-g1a-n5'], size: 25, seed: 3 });
    const items = e.sections.flatMap((s) => s.items);
    const orig = items.filter((i) => i.source === 'original');
    expect(orig.length).toBeGreaterThan(0);
    for (const it of orig) expect(['m1.make10', 'm1.carry20']).toContain(it.group);
    for (const it of items.filter((i) => i.source === 'bank')) expect(it.group).toBe('math-g1a-n5');
  });

  it('二～六年级如实写明仍是旧版单元', () => {
    const e = buildExam({ subject: 'chinese', grade: 3, term: '上', size: 20, seed: 1 });
    expect(e.subtitle).toContain('旧版');
  });
});
