/**
 * 试卷生成：每册都能组卷、题量准确、编号可复现、范围与屏蔽生效、答案正确、打印版式完整、打印调用。
 */
import * as Print from 'expo-print';
import { BANK_INDEX, loadBook } from '@/content/bank';
import { plainText } from '@/content/zh';
import { buildExam, examPool, hasBook, seededRandom, type ExamConfig, type ExamSize } from '@/exam/build';
import { examHtml } from '@/exam/html';
import { printHtml } from '@/exam/print';

jest.mock('expo-print', () => ({ printAsync: jest.fn(() => Promise.resolve()) }));

const cfg = (c: Partial<ExamConfig>): ExamConfig => ({
  subject: 'math',
  grade: 3,
  term: '上',
  size: 25,
  seed: 123456,
  ...c,
});
const items = (e: ReturnType<typeof buildExam>) => e.sections.flatMap((s) => s.items);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** 单元 id + 题目 id → 原题，用来核对答案（不同册的题目 id 可能相同，所以带上单元） */
const BANK_Q = new Map<string, { a: unknown; o?: string[]; t: string }>();
for (const b of BANK_INDEX)
  for (const u of loadBook(b.id)!.units) for (const q of u.questions) BANK_Q.set(`${u.id}/${q.id}`, q);

describe('组卷', () => {
  it('32 册 × 3 种题量都能组卷，题量准确，只含能印在纸上的题型', () => {
    let books = 0;
    for (const b of BANK_INDEX) {
      for (const size of [20, 25, 50] as ExamSize[]) {
        const c = cfg({
          subject: b.subject as ExamConfig['subject'],
          grade: b.grade,
          term: b.term as '上' | '下',
          size,
        });
        expect(hasBook(c)).toBe(true);
        const e = buildExam(c);
        const all = items(e);
        expect(all).toHaveLength(size);
        expect(new Set(all.map((i) => i.id)).size).toBe(size);
        expect(all.every((i) => ['calc', 'choice', 'tf', 'order'].includes(i.kind))).toBe(true);
        expect(e.perPoint * size).toBeCloseTo(100, 5);
      }
      books++;
    }
    expect(books).toBe(32);
    // 一、二年级英语没有教材
    expect(hasBook(cfg({ subject: 'english', grade: 1 }))).toBe(false);
    expect(() => buildExam(cfg({ subject: 'english', grade: 2 }))).toThrow('暂无题目');
  });

  it('同一个编号组出同一套卷；换编号是另一套', () => {
    const a = buildExam(cfg({ seed: 777777 }));
    const b = buildExam(cfg({ seed: 777777 }));
    const c = buildExam(cfg({ seed: 777778 }));
    expect(items(a).map((i) => i.id)).toEqual(items(b).map((i) => i.id));
    expect(items(a).map((i) => i.id)).not.toEqual(items(c).map((i) => i.id));
    expect(a.code).toBe('M3A-25-777777');
  });

  it('数学卷有计算题、选择题、判断题，并混合原创题和题库题；语文卷按比例出选择、判断、排序', () => {
    const m = buildExam(cfg({ size: 50 }));
    expect(m.sections.map((s) => s.kind)).toEqual(['calc', 'choice', 'tf']);
    expect(m.sections[0].items).toHaveLength(15);
    expect(items(m).some((i) => i.source === 'original')).toBe(true);
    expect(items(m).some((i) => i.source === 'bank')).toBe(true);
    const zhExam = buildExam(cfg({ subject: 'chinese', grade: 1, term: '下', size: 50 }));
    expect(zhExam.sections[0].kind).toBe('choice');
    expect(items(zhExam).every((i) => i.source === 'bank')).toBe(true);
  });

  it('只选部分单元时，题目只来自这些单元；覆盖每个选中的单元', () => {
    const units = ['math-g4b-u3', 'math-g4b-u6'];
    const e = buildExam(cfg({ grade: 4, term: '下', units, size: 25 }));
    for (const it of items(e)) {
      if (it.source === 'bank') expect(units).toContain(it.group);
      else expect(['m4.laws', 'm4.decaddsub']).toContain(it.group);
    }
    const groups = new Set(items(e).map((i) => i.group));
    expect(groups.has('math-g4b-u3') || groups.has('m4.laws')).toBe(true);
    expect(groups.has('math-g4b-u6') || groups.has('m4.decaddsub')).toBe(true);
    expect(e.scopeText).toBe('范围：运算定律、小数的加法和减法');
  });

  it('家长屏蔽的题目不会出现', () => {
    const c = cfg({ subject: 'english', grade: 5, units: ['english-g5a-u1'], size: 20 });
    const all = examPool(c, seededRandom(1)).map((i) => i.id);
    const hidden = all.slice(0, 10);
    const e = buildExam({ ...c, hidden });
    expect(items(e).some((i) => hidden.includes(i.id))).toBe(false);
  });

  it('参考答案正确：题库题与原题一致；计算题按算式独立计算', () => {
    let bank = 0;
    let calc = 0;
    for (const b of BANK_INDEX) {
      const e = buildExam(
        cfg({
          subject: b.subject as ExamConfig['subject'],
          grade: b.grade,
          term: b.term as '上' | '下',
          size: 50,
          seed: 42,
        }),
      );
      for (const it of items(e)) {
        if (it.source === 'bank') {
          const q = BANK_Q.get(`${it.group}/${it.id}`)!;
          if (q.t === 'tf') expect(it.answer).toBe(q.a ? '√' : '×');
          else if (q.t === 'order') expect(it.answer).toBe((q.a as number[]).map((i) => '①②③④⑤⑥⑦⑧⑨⑩'[i]).join(''));
          else expect(it.answer).toBe(`${'ABCD'[q.a as number]}（${q.o![q.a as number]}）`);
          bank++;
        } else if (it.kind === 'calc') {
          const expr = plainText(it.stem[0]).replace(/ =$/, '');
          let m = expr.match(/^([\d.]+) ([+−×÷]) ([\d.]+)$/);
          if (m) {
            if (it.answer.includes('……')) {
              const [q, r] = it.answer.split('……').map(Number);
              expect(q * Number(m[3]) + r).toBe(Number(m[1]));
            } else {
              const [a, c] = [Number(m[1]), Number(m[3])];
              const v = { '+': a + c, '−': a - c, '×': a * c, '÷': a / c }[m[2] as '+'];
              expect(Number(it.answer)).toBeCloseTo(v, 9);
            }
            calc++;
            continue;
          }
          m = expr.match(/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+)$/);
          if (m) {
            const [p, q, r, s] = [m[1], m[2], m[4], m[5]].map(Number);
            const [n, d] = {
              '+': [p * s + r * q, q * s],
              '−': [p * s - r * q, q * s],
              '×': [p * r, q * s],
              '÷': [p * s, q * r],
            }[m[3] as '+'];
            const [x, y] = it.answer.split('/').map(Number);
            expect(x * d).toBe(n * (y ?? 1));
            if (!it.group.startsWith('m3.')) expect(gcd(x, y ?? 1)).toBe(1); // 三年级还没学约分
            calc++;
            continue;
          }
          // 其它算式（混合运算、简便计算等）：用 JS 计算核对
          const js = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
          expect(/^[\d+\-*/(). ]+$/.test(js)).toBe(true);
          const num = it.answer.includes('/')
            ? Number(it.answer.split('/')[0]) / Number(it.answer.split('/')[1])
            : Number(it.answer);
          expect(num).toBeCloseTo(Function(`return (${js})`)() as number, 9);
          calc++;
        }
      }
    }
    expect(bank).toBeGreaterThan(1000);
    expect(calc).toBeGreaterThan(100);
  });
});

describe('打印版式', () => {
  it('A4 版式：标题、学生信息栏、各大题、每题分值、编号与来源说明；答案页另起一页', () => {
    const e = buildExam(cfg({ size: 25 }));
    const html = examHtml(e, { withAnswers: true, date: '2026-11-04' });
    expect(html).toContain('@page { size: A4');
    expect(html).toContain('三年级上册数学单元测试');
    expect(html).toContain('姓名：');
    expect(html).toContain('一、计算题');
    expect(html).toContain('（每题 4 分');
    expect(html).toContain(e.code);
    expect(html).toContain('未逐题人工审核');
    expect(html).toContain('page-break-before: always');
    expect(html).toContain('参考答案');
    const esc = (x: string) =>
      x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    for (const it of items(e)) expect(html).toContain(esc(it.answer));
    const noAns = examHtml(e, { withAnswers: false });
    expect(noAns).not.toContain('参考答案');
    expect((noAns.match(/class="(item|calc)"/g) ?? []).length).toBe(25);
  });

  it('一年级：汉字注音（ruby）、钟面和图形画成 SVG；特殊字符被转义', () => {
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      const e = buildExam(cfg({ grade: 1, term: '上', size: 50, seed }));
      const html = examHtml(e, { withAnswers: false });
      expect(html).toContain('<ruby>');
      expect(html).toContain('<rt>');
      found = html.includes('<svg');
    }
    expect(found).toBe(true);
    const e = buildExam(cfg({}));
    e.sections[1].items[0].stem = ['a < b & "c"'];
    expect(examHtml(e, { withAnswers: false })).toContain('a &lt; b &amp; &quot;c&quot;');
  });

  it('打印：手机上调用系统打印，传入整份试卷', async () => {
    const html = examHtml(buildExam(cfg({})), { withAnswers: true });
    await printHtml(html);
    expect(Print.printAsync).toHaveBeenCalledWith({ html });
    expect(globalThis.__lastPrintHtml).toBe(html);
  });
});
