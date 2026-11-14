/**
 * V5.2 七～九年级内容：知识点、出题程序、语文英语题库、初中题库导入。
 */
import { BANK_INDEX, loadBook } from '@/content/bank';
import { plainText } from '@/content/zh';
import { CHINESE_JUNIOR, ENGLISH_JUNIOR, MATH_JUNIOR } from '@/knowledge/curriculum/junior';
import { JUNIOR_GENERATORS, frac, lin, quad, simplifySqrt } from '@/knowledge/genJunior';
import { JUNIOR_LANG_GENERATORS } from '@/knowledge/genJuniorLang';
import { exerciseFromKpId, hasOriginalGenerator, kpExercise, kpRound } from '@/knowledge/generators';
import { KP_BY_ID, kpsFor, topoOrder } from '@/knowledge/graph';
import type { ChoiceExercise } from '@/lesson/types';
import { seeded } from '@/thinking/challenges';

const JUNIOR = [...MATH_JUNIOR, ...CHINESE_JUNIOR, ...ENGLISH_JUNIOR];
const txt = (e: ChoiceExercise) => [plainText(e.prompt.text), e.stem?.text ? plainText(e.stem.text) : ''].join(' ');

describe('初中知识点', () => {
  it('三科七～九年级都有知识点，每个都有出题程序', () => {
    for (const g of [7, 8, 9]) {
      expect(kpsFor('math', g).length).toBeGreaterThanOrEqual(10);
      expect(kpsFor('chinese', g).length).toBe(12);
      expect(kpsFor('english', g).length).toBeGreaterThanOrEqual(10);
    }
    for (const k of JUNIOR) {
      expect(hasOriginalGenerator(k.id)).toBe(true);
      expect(k.kidPy).toBeUndefined(); // 初中不注拼音
    }
    expect(Object.keys({ ...JUNIOR_GENERATORS, ...JUNIOR_LANG_GENERATORS }).sort()).toEqual(JUNIOR.map((k) => k.id).sort());
  });

  it('先修知识点都存在，且在前面学；图里没有环', () => {
    for (const k of JUNIOR)
      for (const p of k.prerequisites) {
        expect(KP_BY_ID[p.id]).toBeDefined();
        const a = KP_BY_ID[p.id];
        expect(a.grade * 1000 + a.order).toBeLessThan(k.grade * 1000 + k.order);
      }
    expect(() => topoOrder()).not.toThrow();
  });

  it('对应的题库单元都存在', () => {
    for (const k of JUNIOR)
      for (const u of k.units ?? []) {
        const book = loadBook(u.replace(/-u\d+$/, ''));
        expect(book?.units.some((x) => x.id === u)).toBe(true);
      }
  });
});

describe('初中出题：每个知识点出 200 道题自检', () => {
  it.each(JUNIOR.map((k) => k.id))('%s', (id) => {
    const rand = seeded(id.length * 977 + id.charCodeAt(1));
    const g = { ...JUNIOR_GENERATORS, ...JUNIOR_LANG_GENERATORS }[id];
    const sigs = new Set<string>();
    for (let i = 0; i < 200; i++) sigs.add(g.make(rand));
    for (const s of sigs) {
      const e = kpExercise(id, s) as ChoiceExercise;
      expect(e.kind).toBe('choice');
      const ids = e.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(ids.length).toBeLessThanOrEqual(4);
      expect(ids).toContain(e.answerId);
      for (const o of e.options) {
        const t = plainText(o.text!);
        expect(t).not.toMatch(/NaN|undefined|Infinity|null/);
        expect(t.trim()).not.toBe('');
      }
      expect(txt(e)).not.toMatch(/NaN|undefined|Infinity|\+ −|− −|\+ -|(^|[^\d.])1x\b|\^/);
      // 由题目 id 能还原出同一道题（复习、错题本要用）
      expect(exerciseFromKpId(e.id)?.id).toBe(e.id);
      // 英语题指令用英文
      if (id.startsWith('e')) expect(plainText(e.prompt.text)).toMatch(/^[A-Za-z]/);
    }
    // 不能只出一两种题
    expect(sigs.size).toBeGreaterThanOrEqual(id.startsWith('m') && id !== 'm9.b4' ? 15 : 5); // m9.b4 投影与视图是概念小题库
  });

  it('知识点练习一轮 8 道不重复，隔一道改成自己填数（答案是数的才改）', () => {
    const round = kpRound('m7.a2', 8, seeded(5));
    expect(new Set(round.map((e) => e.id)).size).toBe(8);
    expect(round.some((e) => e.kind === 'input')).toBe(true);
  });
});

describe('初中数学：独立验算', () => {
  const ans = (id: string, sig: string) => (kpExercise(id, sig) as ChoiceExercise).answerId;
  it('有理数运算', () => {
    expect(ans('m7.a2', 'add:-8:-6')).toBe('-14');
    expect(ans('m7.a2', 'sub:5:-3')).toBe('8');
    expect(ans('m7.a2', 'mul:-15:-3')).toBe('45');
    expect(ans('m7.a2', 'div:-24:6')).toBe('-4');
    expect(ans('m7.a2', 'pow:-2:3:0')).toBe('-8');
    expect(ans('m7.a2', 'pow:-3:2:0')).toBe('9');
    expect(ans('m7.a2', 'pow:-3:2:1')).toBe('-9'); // −3² = −9
  });
  it('方程、不等式、方程组', () => {
    expect(ans('m7.a5', 'one:3:-4:11')).toBe('5');
    expect(ans('m7.a5', 'two:4:3:2:9')).toBe('3'); // 4x + 3 = 2x + 9
    expect(ans('m7.b4', 'sd:10:2:0')).toBe('6');
    expect(ans('m7.b4', 'sd:10:2:1')).toBe('4');
    expect(ans('m7.b5', 'solve:-2:3:-5')).toBe('x < 4'); // −2x + 3 > −5
    expect(ans('m7.b5', 'min:3:1:8')).toBe('3'); // 3x + 1 ≥ 8 → x ≥ 7/3
    expect(ans('m9.a1', 'root:2:1')).toBe('2');
    expect(ans('m9.a1', 'disc:-4:4')).toBe('有两个相等的实数根');
  });
  it('几何与函数', () => {
    expect(ans('m8.b2', 'hyp:0:2')).toBe('10');
    expect(ans('m8.b2', 'leg:1:1')).toBe('12');
    expect(ans('m8.b3', 'sum:5')).toBe('540');
    expect(ans('m8.a3', 'iso:40:0')).toBe('70');
    expect(ans('m8.a3', 'peri:3:7')).toBe('17');
    expect(ans('m9.a2', 'vertex:1:1:2')).toBe('(1, 2)');
    expect(ans('m9.a3', 'k:2:3')).toBe('6');
    expect(ans('m9.a5', 'chord:0:1')).toBe('8'); // 半径 5、弦心距 3
    expect(ans('m9.a5', 'arc:60:6')).toBe('2');
    expect(ans('m9.b3', 'sp:0')).toBe('1/2');
    expect(ans('m9.b5', 'dice:4:1')).toBe('1/3');
    expect(ans('m8.b1', 'simp:2:3')).toBe('2√3');
  });
  it('工具函数', () => {
    expect(frac(-6, 8)).toBe('-3/4');
    expect(frac(6, -3)).toBe('-2');
    expect(lin(3, 'x', -5)).toBe('3x − 5');
    expect(lin(-1, 'x', 0)).toBe('−x');
    expect(quad(1, -3, 2)).toBe('x² − 3x + 2');
    expect(quad(-2, 0, 1)).toBe('−2x² + 1');
    expect(simplifySqrt(72)).toEqual([6, 2]);
  });
  it('全部数学题的数字答案都能用自己算的结果复核', () => {
    // 抽查：有理数四则运算的签名逐个重新计算
    const rand = seeded(42);
    for (let i = 0; i < 300; i++) {
      const s = JUNIOR_GENERATORS['m7.a2'].make(rand);
      const [k, a, b, c] = s.split(':');
      const x = Number(a);
      const y = Number(b);
      const want =
        k === 'add' ? x + y : k === 'sub' ? x - y : k === 'mul' ? x * y : k === 'div' ? x / y : c === '1' ? -((-x) ** y) : x ** y;
      expect(ans('m7.a2', s)).toBe(String(want));
    }
  });
});

describe('初中题库（ChinaStudyFree 七～九年级）', () => {
  it('三科都有题，一～六年级的册不变', () => {
    const junior = BANK_INDEX.filter((b) => b.grade >= 7);
    expect(new Set(junior.map((b) => b.subject))).toEqual(new Set(['math', 'chinese', 'english']));
    expect(junior.reduce((s, b) => s + b.questions, 0)).toBeGreaterThan(300);
    expect(BANK_INDEX.filter((b) => b.grade <= 6)).toHaveLength(32);
  });
  it('人工抽查有错的题已剔除', () => {
    const all = BANK_INDEX.filter((b) => b.grade >= 7).flatMap((b) => loadBook(b.id)!.units.flatMap((u) => u.questions));
    for (const bad of ['c68cd33ccc', '91f6010cd7', '9bcdf9e5ba', '87d37f37bd']) expect(all.find((q) => q.id === bad)).toBeUndefined();
    for (const q of all) expect(q.q).not.toMatch(/[\\$]|\^\{|frac|sqrt\{/);
  });
});

describe('初中讲解', () => {
  it('每个初中知识点都有讲解，英语讲解读英语', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { KP_TEACH } = require('@/knowledge/teach');
    for (const k of JUNIOR) {
      const slides = KP_TEACH[k.id];
      expect(slides?.length).toBeGreaterThanOrEqual(1);
      for (const s of slides) {
        expect(typeof s.text).toBe('string'); // 初中不注拼音
        if (k.subject === 'english') expect(s.lang).toBe('en-US');
      }
    }
  });
});

describe('语文、英语小题库', () => {
  it('同一个知识点里题目不重复，正确答案不在干扰项里，每个语文单元至少 9 道', () => {
    for (const k of [...CHINESE_JUNIOR, ...ENGLISH_JUNIOR]) {
      const g = JUNIOR_LANG_GENERATORS[k.id];
      const stems = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const sig = k.subject === 'chinese' ? `z:${i}` : `p:${i}`;
        let e: ChoiceExercise;
        try {
          e = kpExercise(k.id, sig) as ChoiceExercise;
        } catch {
          continue; // 题号超出范围，或这是只有模板题的知识点
        }
        if (!e || !e.options) break;
        const key = txt(e);
        stems.add(key);
        expect(e.options.filter((o) => o.id === e.answerId)).toHaveLength(1);
      }
      if (k.subject === 'chinese') expect(stems.size).toBeGreaterThanOrEqual(9);
    }
  });
});

describe('初中口算（V5.2）', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ORAL_TOPICS, oralExercise, topicsForGrade } = require('@/content/oral');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { inputMatches, keysFor } = require('@/exercises/InputExercise');
  it('六个主题各 300 道：得数由独立计算核对，答案在选项里，填数版有负号键', () => {
    const rand = seeded(11);
    const junior = ORAL_TOPICS.filter((t: { grade: number }) => t.grade >= 7);
    expect(junior.map((t: { id: string }) => t.id)).toEqual(['ratadd', 'ratsub', 'ratmul', 'ratdiv', 'ratpow', 'roots']);
    for (const t of junior)
      for (let k = 0; k < 300; k++) {
        const expr: string = t.make(rand);
        const [kind, a0, op, b0] = expr.split(':');
        const a = Number(a0);
        const b = Number(b0);
        const want =
          kind === 'n'
            ? { '+': a + b, '-': a - b, '×': a * b, '÷': a / b }[op]!
            : kind === 'p'
              ? a ** Number(op)
              : kind === 'r'
                ? Math.sqrt(a)
                : Math.round(Math.cbrt(a));
        expect(Number.isInteger(want)).toBe(true);
        const e = oralExercise(t.id, expr);
        expect(e.answerId).toBe(String(want));
        expect(e.options.map((o: { id: string }) => o.id)).toContain(e.answerId);
        expect(new Set(e.options.map((o: { id: string }) => o.id)).size).toBe(e.options.length);
        const inp = oralExercise(t.id, `${expr}#in`);
        expect(inp.kind).toBe('input');
        expect(inputMatches(String(want), inp.answer)).toBe(true);
        expect(keysFor(inp.answer, inp.signed)).toContain('-'); // 正数答案也有负号键，不提前“泄露”符号
      }
  });
  it('初中显示初中口算和六年级分数口算', () => {
    const ids = topicsForGrade(8).map((t: { id: string }) => t.id);
    expect(ids).toContain('ratadd');
    expect(ids).toContain('fracmul');
    expect(ids).not.toContain('add10');
    expect(topicsForGrade(6).some((t: { grade: number }) => t.grade >= 7)).toBe(false);
  });
});

describe('初中每日挑战（第 5 档）', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { dailyChallenge, gensFor, challengeFromId } = require('@/thinking/registry');
  it('七年级起用第 5 档：有初中题型，也有五六年级题型；连续 60 天每天三科都能出题、可还原', () => {
    for (const subj of ['math', 'chinese', 'english']) {
      const types = gensFor(subj, 5).map((g: { type: string }) => g.type);
      expect(types.some((t: string) => t.startsWith('jn'))).toBe(true);
      expect(gensFor(subj, 4).some((g: { type: string }) => g.type.startsWith('jn'))).toBe(false); // 小学不出初中题
    }
    const seen = new Set<string>();
    for (let d = 1; d <= 60; d++) {
      const day = `2026-12-${String(((d - 1) % 28) + 1).padStart(2, '0')}`;
      for (const subj of ['math', 'chinese', 'english']) {
        const e = dailyChallenge(day, 8, Math.floor((d - 1) / 28), subj);
        seen.add(e.type);
        expect(challengeFromId(e.id)?.id).toBe(e.id);
        if (e.kind === 'choice') expect(e.options.map((o: { id: string }) => o.id)).toContain(e.answerId);
      }
    }
    expect([...seen].filter((t) => t.startsWith('jn')).length).toBeGreaterThanOrEqual(5);
  });
});

describe('初中阅读小屋', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { lessonsFor } = require('@/content');
  it('七～九年级各 4 篇，不注拼音', () => {
    for (const g of [7, 8, 9]) {
      const ls = lessonsFor('chinese').filter((l: { track?: string; grade?: number }) => l.track === 'zhread' && l.grade === g);
      expect(ls).toHaveLength(4);
      for (const l of ls) expect(typeof l.title).toBe('string');
    }
  });
});

describe('初中数学朗读（V5.2）', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sayMath } = require('@/knowledge/genJunior');
  it('数学符号读成中文；题目连同算式一起读', () => {
    expect(sayMath('|−15| 等于多少？')).toBe('负15的绝对值 等于多少？');
    expect(sayMath('x² − 3x + 2 = 0')).toBe('x的平方 减 3x 加 2 等于 0');
    expect(sayMath('△ABC ≌ △DEF')).toBe('三角形ABC 全等于 三角形DEF');
    expect(sayMath('x ≥ −3')).toBe('x 大于或等于 负3');
    expect(sayMath('-3/4')).toBe('负4分之3');
    expect(sayMath('(−3)³ = ?')).toBe('(负3)的立方等于多少');
    const e = kpExercise('m9.a1', 'root:2:1') as ChoiceExercise;
    expect(e.prompt.speak.text).toBe('解方程，较大的根是多少：x的平方 减 3x 加 2 等于 0');
    // 屏幕上仍显示原来的符号
    expect(e.stem?.text).toBe('x² − 3x + 2 = 0');
    // 所有初中数学题的朗读里不再有读不出的符号
    const rand = seeded(3);
    for (const k of MATH_JUNIOR)
      for (let i = 0; i < 40; i++) {
        const ex = kpExercise(k.id, JUNIOR_GENERATORS[k.id].make(rand)) as ChoiceExercise;
        expect(ex.prompt.speak.text).not.toMatch(/[≌∽∠△⊙≥≤≠·√⁰¹²³⁴⁵⁶⁷⁸⁹|±°π−×÷=+]/);
      }
  });
});

describe('家长中心显示知识点名称和题目（V5.2 修正）', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { skillLabel } = require('@/content');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mistakeLabel } = require('@/content/resolve');
  it('知识点练习的错题显示题目，不显示编号；skill 显示知识点名称（小学也一样）', () => {
    expect(skillLabel('m8.b2')).toBe('勾股定理');
    expect(skillLabel('m2.addsub100')).toBe('100 以内的加法和减法（二）');
    expect(mistakeLabel('kp:m8.b2', 'kp:m8.b2:hyp:0:1')).toBe('直角三角形两条直角边长 3 和 4，斜边长多少？');
    expect(mistakeLabel('kp:m9.a1', 'kp:m9.a1:root:2:1')).toBe('解方程，较大的根是多少？ x² − 3x + 2 = 0');
    expect(mistakeLabel('kp:c8.a3', 'kp:c8.a3:z:0')).toBe('《三峡》的作者是谁？');
    expect(mistakeLabel('kp:m2.addsub100', 'kp:m2.addsub100:35+28')).toBe('35 + 28 = ?');
  });
});

it('英语错题只显示句子，不带统一的英文指令', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mistakeLabel } = require('@/content/resolve');
  expect(mistakeLabel('kp:e8.a1', 'kp:e8.a1:p:0')).toBe('This box is ___ than that one.');
});
