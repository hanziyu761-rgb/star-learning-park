/**
 * V2.12 题库自动核查：能验算的算式、结构、拼音个数；多音字拼音纠正。
 */
import { BANK_INDEX, loadRawBook, withPinyin } from '@/content/bank';
import { auditBook, auditCoverage, auditQuestion, checkEquations, wrongComparisons } from '@/content/bank/audit';
import type { BankQuestion } from '@/content/bank/types';
import { fixBankPinyin, polyphonesOf } from '@/content/bank/pyfix';

const Q = (over: Partial<BankQuestion>): BankQuestion => ({
  id: 'x',
  t: 'choice',
  q: '题',
  o: ['1', '2'],
  a: 0,
  kp: 'k',
  ...over,
});

describe('验算规则', () => {
  it('能查出算错的加减乘除（含小数、带余数的除法），不误报对的', () => {
    expect(checkEquations('3 + 4 = 7，9 - 5 = 4，6 × 7 = 42，0.3 + 0.7 = 1').bad).toEqual([]);
    expect(checkEquations('3 + 4 = 8').bad).toEqual(['3 + 4 = 8']);
    expect(checkEquations('32 ÷ 6 = 5（条）……2（人）').bad).toEqual([]);
    expect(checkEquations('32 ÷ 6 = 5 条......2 人').bad).toEqual([]);
    expect(checkEquations('32 ÷ 6 = 4……8').bad).toHaveLength(1);
    expect(checkEquations('19 ÷ 3 = 6……2').bad).toHaveLength(1);
    expect(checkEquations('12 × 3 = 26').bad).toHaveLength(1);
  });

  it('不把时间、分数、连加、故意举出的错算式当成算式', () => {
    expect(checkEquations('10:30 - 15 = 10:15').checked).toBe(0);
    expect(checkEquations('1/12 : 1/15 = 15 : 12').checked).toBe(0);
    expect(checkEquations('3 + 4 + 5 = 12').bad).toEqual([]);
    expect(checkEquations('100 ÷ 3 = 33 1/3（带分数）').bad).toEqual([]);
    expect(checkEquations('所以 800-356=544 确实是错的').bad).toEqual([]);
    expect(wrongComparisons('1/10 < 1/8，3/10 < 7/10，3² < 12')).toEqual([]);
    expect(wrongComparisons('因为 5 > 3，7 < 2')).toEqual(['7 < 2']);
  });

  it('结构和答案检查', () => {
    const kinds = (q: BankQuestion) => auditQuestion('b', 'u', q).map((i) => i.kind);
    expect(kinds(Q({}))).toEqual([]);
    expect(kinds(Q({ a: 5 }))).toContain('structure');
    expect(kinds(Q({ o: ['1', '1'] }))).toContain('structure');
    expect(kinds(Q({ t: 'order', o: ['a', 'b', 'c'], a: [0, 0, 2] }))).toContain('structure');
    expect(kinds(Q({ q: '小明有书', qpy: 'xiǎo míng yǒu' }))).toContain('pinyin-count');
    expect(kinds(Q({ t: 'tf', q: '3 + 4 = 8', a: true }))).toContain('tf-equation');
    expect(kinds(Q({ t: 'tf', q: '0.6 + 0.4 = 1', a: true }))).toEqual([]);
    expect(kinds(Q({ q: '8 + 5 = （ ）', o: ['12', '13'], a: 0 }))).toContain('choice-answer');
    expect(kinds(Q({ q: '8 + 5 = （ ）', o: ['12', '13'], a: 1 }))).toEqual([]);
    expect(kinds(Q({ ex: '验算：5 + 3 = 9' }))).toContain('equation');
  });
});

describe('全部题库', () => {
  it('所有册（一～六年级）结构、能验算的算式、判断题算式、选择题答案全部通过', () => {
    const issues = BANK_INDEX.flatMap((b) => auditBook(loadRawBook(b.id)!));
    expect(issues).toEqual([]);
  });

  it('数学题库讲解里确实验算到了大量算式（检查不是空转）', () => {
    const g1 = ['math-g1a', 'math-g1b'].map((id) => auditCoverage(loadRawBook(id)!));
    expect(g1.reduce((s, c) => s + c.equations, 0)).toBeGreaterThan(300);
  });
});

describe('多音字拼音纠正', () => {
  it('按词纠正，原文里不连着的字不动', () => {
    expect(fixBankPinyin('数数时', ['shuò', 'shuò', 'shí'])).toEqual({ pys: ['shǔ', 'shù', 'shí'], fixed: 1 });
    expect(fixBankPinyin('小树长高了', ['xiǎo', 'shù', 'cháng', 'gāo', 'le']).pys[2]).toBe('zhǎng');
    expect(fixBankPinyin('长8厘米，高5厘米', ['cháng', 'lí', 'mǐ', 'gāo', 'lí', 'mǐ']).fixed).toBe(0);
    expect(fixBankPinyin('数学', ['shù', 'xué']).fixed).toBe(0);
  });

  it('题库显示时已纠正，并列出需要老师核对的多音字', () => {
    const t = withPinyin('数数时', 'shuò shuò shí');
    expect(typeof t === 'string' ? t : t.map((s) => s.py)).toEqual(['shǔ', 'shù', 'shí']);
    expect(polyphonesOf('数数时，应按', ['shuò', 'shuò', 'shí', 'yìng', 'àn'])).toBe('数(shǔ)、数(shù)、应(yìng)');
  });

  it('一年级题库里“数数、数到、数一数”等被注错的词全部纠正', () => {
    let left = 0;
    for (const id of ['math-g1a', 'math-g1b', 'chinese-g1a', 'chinese-g1b'])
      for (const u of loadRawBook(id)!.units)
        for (const q of u.questions) {
          if (!q.qpy) continue;
          const segs = withPinyin(q.q, q.qpy);
          if (typeof segs === 'string') continue;
          const s = segs.filter((x) => x.py);
          const text = s.map((x) => x.char).join('');
          for (const m of text.matchAll(/数数|数到|数一数/g)) if (s[m.index!].py !== 'shǔ') left++;
        }
    expect(left).toBe(0);
  });
});
