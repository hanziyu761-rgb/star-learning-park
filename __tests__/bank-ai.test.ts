/**
 * 题库（ChinaStudyFree 导入）、口算生成、AI 客户端。
 */
import type { ChoiceExercise } from '@/lesson/types';
import { describeExercise } from '@/ai/describe';
import { AiError, aiChat, aiHealth, aiHint } from '@/ai/client';
import { BANK_INDEX, bankExercise, findBankExercise, loadBook, pickRound, withPinyin } from '@/content/bank';
import { evalExpr, findOralExercise, ORAL_TOPICS, oralExercise, oralRound } from '@/content/oral';
import { resolveExercise } from '@/content/resolve';
import { createEmptyProgress, progressReducer, type ProgressAction } from '@/progress/model';

const run = (a: ProgressAction[]) => a.reduce(progressReducer, createEmptyProgress());
const HAN = /\p{Script=Han}/gu;

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

describe('题库', () => {
  const books = BANK_INDEX.map((b) => loadBook(b.id)!);

  it('题量：语文、数学 1–6 年级、英语 3–6 年级，共 8000 题以上', () => {
    const total = BANK_INDEX.reduce((s, b) => s + b.questions, 0);
    expect(total).toBeGreaterThan(8000);
    for (const g of [1, 2, 3, 4, 5, 6]) {
      expect(BANK_INDEX.some((b) => b.subject === 'math' && b.grade === g)).toBe(true);
      expect(BANK_INDEX.some((b) => b.subject === 'chinese' && b.grade === g)).toBe(true);
    }
    expect(BANK_INDEX.some((b) => b.subject === 'english' && b.grade <= 2)).toBe(false);
  });

  it('每道题结构合法：答案有效、无公式残留、一二年级拼音与汉字一一对应', () => {
    const problems: string[] = [];
    for (const b of books) {
      for (const u of b.units) {
        for (const q of u.questions) {
          const where = `${b.id}/${u.no}/${q.id}`;
          if (/[\\${}]|(^|[^tT])imes/.test(q.q + (q.o ?? []).join(''))) problems.push(`${where} 公式残留`);
          if (q.t === 'choice') {
            const a = q.a as number;
            if (!q.o || a < 0 || a >= q.o.length || new Set(q.o).size !== q.o.length) problems.push(`${where} 选择题答案无效`);
          } else if (q.t === 'tf') {
            if (typeof q.a !== 'boolean') problems.push(`${where} 判断题答案无效`);
          } else if (q.t === 'order') {
            const a = q.a as number[];
            if (!q.o || [...a].sort().join() !== q.o.map((_, i) => i).join()) problems.push(`${where} 排序题答案无效`);
          }
          if (q.qpy && q.qpy.split(' ').length !== (q.q.match(HAN) ?? []).length) problems.push(`${where} 拼音数量不一致`);
        }
      }
    }
    expect(problems.slice(0, 20)).toEqual([]);
  });

  it('算式题答案正确（能自动计算的全部核对）', () => {
    let checked = 0;
    for (const b of books.filter((x) => x.subject === 'math')) {
      for (const u of b.units) {
        for (const q of u.questions) {
          const m = q.q.replace(/\s/g, '').match(/^(?:计算[:：])?(\d+)([+\-])(\d+)[=＝](?:\?|？|（？）)?$/);
          if (m && q.t === 'choice') {
            const v = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
            expect(q.o![q.a as number]).toBe(String(v));
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('转换成练习组件：选择、判断、排序都能生成合法的题目', () => {
    const b = loadBook('chinese-g1a')!;
    const kinds = new Set<string>();
    for (const u of b.units) for (const q of u.questions) {
      const e = bankExercise(b, q);
      kinds.add(e.kind);
      if (e.kind === 'choice') expect(e.options.map((o) => o.id)).toContain(e.answerId);
      if (e.kind === 'sort') expect([...e.order].sort()).toEqual(e.items.map((i) => i.id).sort());
    }
    expect([...kinds].sort()).toEqual(['choice', 'sort', 'truefalse']);
  });

  it('一二年级题干带拼音', () => {
    const t = withPinyin('小猫', 'xiǎo māo');
    expect(t).toEqual([{ char: '小', py: 'xiǎo' }, { char: '猫', py: 'māo' }]);
    expect(withPinyin('abc', undefined)).toBe('abc');
  });

  it('抽题：优先没做过的，排除屏蔽题', () => {
    const u = loadBook('math-g1a')!.units[0];
    const done = new Set(u.questions.slice(0, 5).map((q) => q.id));
    const hidden = new Set([u.questions[6].id]);
    const round = pickRound(u, { done, hidden, count: 10, rand: seeded(1) });
    expect(round).toHaveLength(Math.min(10, u.questions.length - 1));
    expect(round.some((q) => hidden.has(q.id))).toBe(false);
    const freshCount = u.questions.length - 5 - 1;
    expect(round.slice(0, Math.min(10, freshCount)).every((q) => !done.has(q.id))).toBe(true);
  });

  it('复习时可由 id 找回题库题目', () => {
    const b = loadBook('math-g2a')!;
    const u = b.units[0];
    const q = u.questions[0];
    expect(findBankExercise(`bank:${u.id}`, q.id)?.exercise.id).toBe(q.id);
    expect(resolveExercise(`bank:${u.id}`, q.id)?.subject).toBe('math');
  });
});

describe('口算闯关', () => {
  it('计算正确', () => {
    expect(evalExpr('7+5')).toBe(12);
    expect(evalExpr('13-8')).toBe(5);
    expect(evalExpr('6×7')).toBe(42);
    expect(evalExpr('56÷8')).toBe(7);
  });

  it('各主题题目范围正确（随机 500 次）', () => {
    const rand = seeded(42);
    const get = (id: string) => ORAL_TOPICS.find((t) => t.id === id)!;
    for (let i = 0; i < 500; i++) {
      const [a, b] = get('add10').make(rand).split('+').map(Number);
      expect(a + b).toBeLessThanOrEqual(10);
      const [c, d] = get('add20').make(rand).split('+').map(Number);
      expect(c).toBeLessThan(10);
      expect(d).toBeLessThan(10);
      expect(c + d).toBeGreaterThan(10); // 进位
      const [e, f] = get('sub20').make(rand).split('-').map(Number);
      expect(e).toBeGreaterThan(10);
      expect(e - f).toBeLessThan(10); // 退位
      expect(e % 10).toBeLessThan(f);
      const [g, h] = get('sub10').make(rand).split('-').map(Number);
      expect(g - h).toBeGreaterThanOrEqual(0);
      const [p, q] = get('div99').make(rand).split('÷').map(Number);
      expect(Number.isInteger(p / q)).toBe(true);
    }
  });

  it('每轮 10 题不重复，正确答案在选项中', () => {
    const t = ORAL_TOPICS[0];
    const round = oralRound(t, 10, seeded(3));
    expect(new Set(round).size).toBe(10);
    for (const expr of round) {
      const e = oralExercise(t.id, expr) as ChoiceExercise;
      expect(e.answerId).toBe(String(evalExpr(expr)));
      expect(e.options.map((o) => o.id)).toContain(e.answerId);
      // 同一道题的“自己填数”版本，答案相同
      const inp = oralExercise(t.id, `${expr}#in`);
      expect(inp.kind).toBe('input');
      expect(inp.kind === 'input' && inp.answer).toBe(String(evalExpr(expr)));
    }
    expect((findOralExercise('oral:add10', '3+4')?.exercise as ChoiceExercise).answerId).toBe('7');
  });
});

describe('练习记录与设置', () => {
  it('完成题库练习不影响“继续学习”的课程，并记录星星', () => {
    const s = run([
      { type: 'lesson/start', lessonId: 'L', subject: 'math', now: 1, resume: false },
      { type: 'exercise/result', lessonId: 'bank:math-g1a-u1', exerciseId: 'q', subject: 'math', skill: 'bank:math:x', firstTryCorrect: true, attempts: 1, now: 10 },
      { type: 'practice/complete', lessonId: 'bank:math-g1a-u1', subject: 'math', startedAt: 5, now: 20 },
    ]);
    expect(s.active?.lessonId).toBe('L');
    expect(s.lessons['bank:math-g1a-u1'].bestStars).toBe(3);
    expect(s.totalStars).toBe(3);
  });

  it('年级、AI 开关、屏蔽题目', () => {
    let s = run([
      { type: 'settings/set', settings: { grade: 3, aiEnabled: true } },
      { type: 'bank/hide', questionId: 'abc' },
      { type: 'bank/hide', questionId: 'abc' },
    ]);
    expect(s.settings).toEqual({ grade: 3, aiEnabled: true, aiBaseUrl: '', adaptiveChallenge: true, voiceGender: 'female', voiceZh: '', voiceEn: '', speechRate: 'slow', voiceInput: false });
    expect(s.hidden).toEqual(['abc']);
    s = progressReducer(s, { type: 'bank/unhide-all' });
    expect(s.hidden).toEqual([]);
  });
});

describe('AI 老师客户端', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });
  const mockFetch = (status: number, body: unknown) => {
    const fn = jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as unknown as Response);
    global.fetch = fn as unknown as typeof fetch;
    return fn;
  };

  it('家长未开启 / 未填写地址时不发请求', async () => {
    const fn = mockFetch(200, { ok: true });
    await expect(aiHealth({ enabled: false, baseUrl: 'http://x' })).rejects.toMatchObject({ code: 'DISABLED' });
    await expect(aiHealth({ enabled: true, baseUrl: '' })).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('请求只包含题目、科目、年级，不包含身份信息', async () => {
    const fn = mockFetch(200, { ok: true, text: '想一想' });
    const text = await aiHint(
      { enabled: true, baseUrl: 'http://ai.test/' },
      { subject: 'math', grade: 1, mode: 'hint', question: '2+3=?', options: ['4', '5'], answer: '5' },
    );
    expect(text).toBe('想一想');
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://ai.test/api/tutor/hint');
    expect(Object.keys(JSON.parse(String(init.body))).sort()).toEqual(['answer', 'grade', 'mode', 'options', 'question', 'subject']);
  });

  it('服务端错误映射为孩子能懂的提示', async () => {
    mockFetch(501, { ok: false, code: 'LLM_NOT_CONFIGURED' });
    await expect(aiChat({ enabled: true, baseUrl: 'http://x' }, { subject: 'math', grade: 1, messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({
      code: 'LLM_NOT_CONFIGURED',
    });
    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const err = await aiChat({ enabled: true, baseUrl: 'http://x' }, { subject: 'math', grade: 1, messages: [{ role: 'user', content: 'hi' }] }).catch((e) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err.code).toBe('NETWORK');
  });

  it('把练习题整理成文字：选择题带选项和答案', () => {
    const e = oralExercise('add10', '3+4');
    const d = describeExercise(e);
    expect(d.question).toContain('3 + 4 = ?');
    expect(d.answer).toBe('7');
    expect(d.options).toContain('7');
  });
});
