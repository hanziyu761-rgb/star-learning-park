/**
 * V2.7 二～六年级思维训练：分档、题型、每道题答案用独立方法核对（穷举 / 模拟 / 按数据）。
 */
import type { ChoiceExercise, SortExercise, ZhText } from '@/lesson/types';
import { levelOfGrade, type ChallengeExercise, type Level } from '@/thinking/challenges';
import {
  CONNECT_ITEMS,
  DAYS,
  EN_CATS_UPPER,
  IDIOMS,
  MONTHS,
  ORDINALS,
  SENTENCE_CORRECT,
  SENTENCE_WRONG,
  TENS,
} from '@/thinking/contentUpper';
import { challengeFromId, challengeId, dailyChallenge, gensFor, seeded } from '@/thinking/registry';

const answerOf = (e: ChoiceExercise) => e.options.find((o) => o.id === e.answerId)!;
const text = (t: unknown) => (typeof t === 'string' ? t : (t as ZhText).map((s) => s.char).join(''));
const nums = (s: string) => (s.match(/\d+/g) ?? []).map(Number);
const perms = (n: number): number[][] =>
  n === 1
    ? [[0]]
    : perms(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));

function sample(subject: 'math' | 'chinese' | 'english', level: Level, per: number, seed = 1) {
  const rand = seeded(seed);
  const out: { type: string; sig: string; e: ChallengeExercise }[] = [];
  for (const g of gensFor(subject, level))
    for (let k = 0; k < per; k++) {
      const sig = g.sig(rand, level);
      out.push({ type: g.type, sig, e: challengeFromId(challengeId(sig))! });
    }
  return out;
}

describe('分档', () => {
  it('一年级、二年级、三四年级、五六年级四档', () => {
    expect([1, 2, 3, 4, 5, 6].map(levelOfGrade)).toEqual([1, 2, 3, 3, 4, 4]);
  });

  it('每档的题型：数学 7 / 7 / 8 / 11，语文 4 / 4 / 6 / 6，英语 4 / 4 / 6 / 6', () => {
    const count = (s: 'math' | 'chinese' | 'english') => ([1, 2, 3, 4] as Level[]).map((l) => gensFor(s, l).length);
    expect(count('math')).toEqual([7, 7, 8, 11]);
    expect(count('chinese')).toEqual([4, 4, 6, 6]);
    expect(count('english')).toEqual([4, 4, 6, 6]);
    expect(gensFor('math', 4).map((g) => g.type)).toEqual(
      expect.arrayContaining(['logic', 'magic', 'numOdd', 'chicken', 'tree', 'age']),
    );
    expect(gensFor('math', 3).map((g) => g.type)).not.toContain('chicken');
    expect(gensFor('chinese', 3).map((g) => g.type)).not.toContain('zhWords');
  });

  it('五年级数学连续 11 天轮到全部 11 种题型；三年级起的题不注拼音', () => {
    const days = Array.from({ length: 11 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`);
    expect(new Set(days.map((d) => dailyChallenge(d, 5, 0, 'math').type)).size).toBe(11);
    const hasZh = (v: unknown): boolean =>
      Array.isArray(v)
        ? v.some((x) => (x && typeof x === 'object' && 'char' in x) || hasZh(x))
        : v && typeof v === 'object'
          ? Object.values(v).some(hasZh)
          : false;
    for (const grade of [3, 4, 5, 6])
      for (const subj of ['math', 'chinese', 'english'] as const)
        for (const d of days) expect(hasZh(dailyChallenge(d, grade, 0, subj))).toBe(false);
    // 一、二年级仍有拼音
    expect(hasZh(dailyChallenge('2026-11-10', 1, 0, 'chinese'))).toBe(true);
  });
});

describe('再玩一道', () => {
  it('每个年级、每科连着“再玩一道”，能轮到这一档的每种题型', () => {
    for (const grade of [1, 2, 3, 4, 5, 6])
      for (const subj of ['math', 'chinese', 'english'] as const) {
        const n = gensFor(subj, levelOfGrade(grade)).length;
        const types = new Set(
          Array.from({ length: n }, (_, i) => dailyChallenge('2026-11-05', grade, 5 + i, subj).type),
        );
        expect(types.size).toBe(n);
      }
  });
});

describe('每道题结构合法', () => {
  it('三科 × 三四、五六年级 × 每种题型 60 道：选项不重复、答案在选项里；排序题被打乱', () => {
    for (const level of [3, 4] as Level[])
      for (const subj of ['math', 'chinese', 'english'] as const)
        for (const { e } of sample(subj, level, 60, level * 7)) {
          if (e.kind === 'choice') {
            const keys = e.options.map((o) => text(o.text ?? o.visual?.emoji));
            expect(new Set(keys).size).toBe(keys.length);
            expect(e.options.length).toBeGreaterThanOrEqual(3);
            expect(e.options.some((o) => o.id === e.answerId)).toBe(true);
          } else {
            expect(e.order).toEqual(e.items.map((_, k) => String(k)));
            expect(e.items.map((it) => it.id)).not.toEqual(e.order);
          }
          expect(e.wrongHint.text.length).toBeGreaterThan(0);
        }
  });
});

describe('数学答案独立核对', () => {
  const math = (level: Level, type: string, per = 150) =>
    sample('math', level, per, 99 + level).filter((x) => x.type === type) as { sig: string; e: ChoiceExercise }[];

  it('逻辑推理：根据线索穷举所有对应方式，只有一种，且答案就是它', () => {
    for (const level of [3, 4] as Level[])
      for (const { e } of math(level, 'logic')) {
        const prompt = text(e.prompt.text);
        const kids = prompt.split('每人')[0].split('、');
        const items = prompt.match(/（(.+?)）/)![1].split('、');
        const ask = kids.indexOf(prompt.match(/([^。]+?)最喜欢什么？$/)![1]);
        const clues = text(e.stem!.text)
          .split('\n')
          .map((l) => {
            const m = l.match(/^(.+?)最喜欢的(是|不是)(.+?)。$/)!;
            return [kids.indexOf(m[1]), items.indexOf(m[3]), m[2] === '是'] as const;
          });
        const sols = perms(kids.length).filter((p) => clues.every(([k, it, yes]) => (p[k] === it) === yes));
        expect(sols).toHaveLength(1);
        expect(text(answerOf(e).text)).toBe(items[sols[0][ask]]);
      }
  });

  it('幻方：穷举空格的填法（每个数只用一次），问号处的答案唯一且正确', () => {
    for (const level of [3, 4] as Level[])
      for (const { e } of math(level, 'magic', 60)) {
        const f = e.stem!.visual!.figure!;
        if (f.type !== 'puzzle' || f.puzzle.kind !== 'grid') throw new Error();
        const cells = f.puzzle.cells.flat();
        const sum = nums(text(e.prompt.text))[1] ?? nums(text(e.prompt.text))[0];
        const known = cells.filter((c) => /^\d+$/.test(c)).map(Number);
        const min = Math.min(...known.concat([sum / 3 - 4]));
        const k = Math.round(sum / 3 - 5); // 九个数是 k+1…k+9，中间数是 k+5 = 和 ÷ 3
        expect(min).toBeGreaterThanOrEqual(k + 1);
        const pool = Array.from({ length: 9 }, (_, i) => k + 1 + i).filter((v) => !known.includes(v));
        const holes = cells.map((c, i) => (/^\d+$/.test(c) ? -1 : i)).filter((i) => i >= 0);
        const target = cells.indexOf('?');
        const lines = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6],
        ];
        const found = new Set<number>();
        for (const p of perms(pool.length)) {
          const g = cells.map((c) => (/^\d+$/.test(c) ? Number(c) : 0));
          holes.forEach((h, i) => (g[h] = pool[p[i]]));
          if (lines.every((l) => l.reduce((s, i) => s + g[i], 0) === sum)) found.add(g[target]);
        }
        expect([...found]).toEqual([Number(answerOf(e).text)]);
      }
  });

  it('找不同（数）：其他三个都有某个特点，答案没有；按本档所有特点检查，只有答案一个“不同”', () => {
    const props: Record<number, ((n: number) => boolean)[]> = {
      3: [(n) => n % 2 === 0, (n) => n % 5 === 0],
      4: [
        (n) => n % 2 === 0,
        (n) => n % 5 === 0,
        (n) => n % 3 === 0,
        (n) => n % 9 === 0,
        (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0),
      ],
    };
    for (const level of [3, 4] as Level[])
      for (const { e } of math(level, 'numOdd')) {
        const ns = e.options.map((o) => Number(o.text));
        const ans = Number(answerOf(e).text);
        const singles = new Set<number>();
        for (const p of props[level]) {
          const yes = ns.filter(p);
          const no = ns.filter((x) => !p(x));
          if (yes.length === 1) singles.add(yes[0]);
          if (no.length === 1) singles.add(no[0]);
        }
        expect([...singles]).toEqual([ans]);
      }
  });

  it('鸡兔同笼、植树、年龄问题：按题目文字独立推算', () => {
    for (const { e } of math(4, 'chicken')) {
      const [h, l] = nums(text(e.prompt.text));
      const r = Array.from({ length: h + 1 }, (_, i) => i).filter((x) => 2 * (h - x) + 4 * x === l);
      expect(r).toEqual([Number(answerOf(e).text)]);
    }
    for (const { e } of math(4, 'tree')) {
      const p = text(e.prompt.text);
      const [L, g] = nums(p);
      const spots = Array.from({ length: L / g + 1 }, (_, i) => i * g).filter((x) =>
        p.includes('两端都要种') ? true : p.includes('两端都不种') ? x !== 0 && x !== L : x !== L,
      );
      expect(Number(answerOf(e).text)).toBe(spots.length);
    }
    for (const { e } of math(4, 'age')) {
      const [f, c, k] = nums(text(e.prompt.text));
      const n = Array.from({ length: 60 }, (_, i) => i + 1).filter((x) => f + x === k * (c + x));
      expect(n).toEqual([Number(answerOf(e).text)]);
    }
  });

  it('三步天平、高年级数列、数图形', () => {
    for (const { e } of math(3, 'balance')) {
      const f = e.stem!.visual!.figure!;
      if (f.type !== 'puzzle' || f.puzzle.kind !== 'balance') throw new Error();
      expect(f.puzzle.rows).toHaveLength(3);
      expect(Number(answerOf(e).text)).toBe(f.puzzle.rows.reduce((s, r) => s * r.rightCount, 1));
    }
    for (const level of [3, 4] as Level[])
      for (const { sig, e } of math(level, 'seq')) {
        const shown = String(e.stem!.text).split('，').slice(0, 4).map(Number);
        const [, kind, , d] = sig.split(':');
        const step = Number(d);
        const next = {
          add: shown[3] + step,
          sub: shown[3] - step,
          mul: shown[3] * step,
          square: (Math.sqrt(shown[3]) + 1) ** 2,
          fib: shown[3] + shown[2],
          alt: shown[3] - 1,
          grow: shown[3] + (shown[3] - shown[2]) + 1,
        }[kind]!;
        if (kind === 'mul') expect(shown[1]).toBe(shown[0] * step);
        if (kind === 'fib') expect(shown[2]).toBe(shown[0] + shown[1]);
        expect(Number(answerOf(e).text)).toBe(next);
      }
    for (const level of [3, 4] as Level[])
      for (const { sig, e } of math(level, 'rects')) {
        const [, r, c, sq] = sig.split(':').map(Number);
        let n = 0;
        for (let r1 = 0; r1 < r; r1++)
          for (let r2 = r1; r2 < r; r2++)
            for (let c1 = 0; c1 < c; c1++) for (let c2 = c1; c2 < c; c2++) if (!sq || r2 - r1 === c2 - c1) n++;
        expect(Number(answerOf(e).text)).toBe(n);
      }
  });
});

describe('语文、英语答案核对', () => {
  it('成语、关联词、病句：答案与数据一致；病句题只有一句没有毛病', () => {
    for (const level of [3, 4] as Level[]) {
      for (const { type, e } of sample('chinese', level, 40, 5 + level)) {
        if (e.kind !== 'choice') continue;
        const ans = text(answerOf(e).text);
        if (type === 'zhIdiom') expect(IDIOMS.find((i) => i.blank === text(e.stem!.text))!.ans).toBe(ans);
        if (type === 'zhConnect') expect(CONNECT_ITEMS.find((i) => i.sentence === text(e.stem!.text))!.ans).toBe(ans);
        if (type === 'zhSentence') {
          expect(SENTENCE_CORRECT).toContain(ans);
          for (const o of e.options.filter((x) => x.id !== e.answerId))
            expect(SENTENCE_WRONG.map((w) => w.text)).toContain(text(o.text));
        }
      }
    }
    expect(SENTENCE_CORRECT.some((c) => SENTENCE_WRONG.some((w) => w.text === c))).toBe(false);
  });

  it('英语比较推理：按线索穷举排名，答案唯一', () => {
    for (const level of [3, 4] as Level[])
      for (const { type, e } of sample('english', level, 80, 11 + level)) {
        if (type !== 'enLogic' || e.kind !== 'choice') continue;
        const lines = String(e.stem!.text).split('\n');
        const names = e.options.map((o) => String(o.text));
        const clues = lines.map((l) => {
          const m = l.match(/^(\w+) is \w+ than (\w+)\.$/)!;
          return [names.indexOf(m[1]), names.indexOf(m[2])];
        });
        const most = /tallest|oldest|fastest/.test(String(e.prompt.text));
        const answers = new Set(
          perms(names.length)
            .filter((o) => clues.every(([a, b]) => o.indexOf(a) < o.indexOf(b)))
            .map((o) => names[most ? o[0] : o[o.length - 1]]),
        );
        expect([...answers]).toEqual([String(answerOf(e).text)]);
      }
  });

  it('英语找不同类、接龙（星期、月份、序数词、整十数）', () => {
    for (const level of [3, 4] as Level[])
      for (const { type, e } of sample('english', level, 120, 21 + level)) {
        if (e.kind !== 'choice') continue;
        if (type === 'enOdd') {
          const cat = (w: string) => EN_CATS_UPPER.findIndex((c) => c.items.includes(w));
          const others = e.options.filter((o) => o.id !== e.answerId).map((o) => cat(String(o.text)));
          expect(new Set(others).size).toBe(1);
          expect(cat(String(answerOf(e).text))).not.toBe(others[0]);
          if (level === 3) expect(e.options.every((o) => !EN_CATS_UPPER[cat(String(o.text))].high)).toBe(true);
        }
        if (type === 'enPattern') {
          const shown = String(e.stem!.text).replace(', ❓', '').split(', ');
          const list = [DAYS, MONTHS, ORDINALS, TENS].find((l) => l.includes(shown[0]))!;
          const idx = shown.map((w) => list.indexOf(w));
          const step = (idx[1] - idx[0] + list.length) % list.length;
          for (let i = 1; i < 4; i++) expect((idx[i] - idx[i - 1] + list.length) % list.length).toBe(step);
          expect(String(answerOf(e).text)).toBe(list[(idx[3] + step) % list.length]);
          if (level === 3) expect(step).toBe(1);
        }
      }
  });

  it('连词成句（高年级）：按正确顺序拼起来是完整的句子', () => {
    for (const level of [3, 4] as Level[])
      for (const { type, e } of sample('english', level, 30, 31 + level)) {
        if (type !== 'enSentence') continue;
        const s = e as SortExercise;
        const byId = Object.fromEntries(s.items.map((it) => [it.id, String(it.text)]));
        expect(/^[A-Z].*[.!?]$/.test(s.order.map((id) => byId[id]).join(' '))).toBe(true);
      }
  });
});
