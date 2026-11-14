/**
 * V2.9 自己作答：填数判定、选择题→填数转换、口算填数、选错冷却、描红写字的笔画判定与数据。
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ORAL_TOPICS, oralExercise, topicsForGrade } from '@/content/oral';
import { resolveExercise } from '@/content/resolve';
import {
  ALL_WRITE_SETS,
  traceExercise,
  WRITE_CHARS,
  WRITE_CHARS_G2,
  WRITE_SETS,
  writeSetGrade,
} from '@/content/writing';
import { zh } from '@/content/zh';
import { ChoiceExercise } from '@/exercises/ChoiceExercise';
import { InputExercise, inputMatches, keysFor } from '@/exercises/InputExercise';
import { checkStroke, TraceExercise } from '@/exercises/TraceExercise';
import { exerciseFromKpId, kpRound } from '@/knowledge/generators';
import { asInput } from '@/knowledge/inputs';
import { seeded } from '@/thinking/challenges';
import type { ChoiceExercise as ChoiceData, InputExercise as InputData } from '@/lesson/types';

jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual('react-native');
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    usePanGesture: () => ({}),
    View,
  };
});

const P = { text: zh('算一算', 'suàn yi suàn'), speak: { text: '算一算', lang: 'zh-CN' as const } };

describe('填数判定', () => {
  it('整数、小数、分数按数值判断；有余数的除法按“商……余数”判断', () => {
    expect(inputMatches('12', '12')).toBe(true);
    expect(inputMatches('13', '12')).toBe(false);
    expect(inputMatches('2.50', '2.5')).toBe(true);
    expect(inputMatches('6/8', '3/4')).toBe(true);
    expect(inputMatches('3/5', '3/4')).toBe(false);
    expect(inputMatches('7……2', '7……2')).toBe(true);
    expect(inputMatches('7……3', '7……2')).toBe(false);
    expect(inputMatches('', '0')).toBe(false);
    expect(keysFor('3/4')).toEqual(['/']);
    expect(keysFor('7……2')).toEqual(['余']);
    expect(keysFor('12')).toEqual([]);
  });

  it('只把答案是数的选择题换成填数；带图选项、听音题不换', () => {
    const base: ChoiceData = {
      kind: 'choice',
      id: 'x',
      skill: 's',
      prompt: P,
      stem: { text: '3 + 4 = ?' },
      options: ['6', '7', '8'].map((t) => ({ id: t, text: t })),
      answerId: '7',
      wrongHint: P,
    };
    expect(asInput(base)).toMatchObject({ kind: 'input', id: 'x:in', answer: '7' });
    expect(asInput({ ...base, options: [{ id: '7', visual: { emoji: '🍎' } }] })).toBeNull();
    expect(asInput({ ...base, listen: { text: 'seven', lang: 'en-US' } })).toBeNull();
    expect(asInput({ ...base, options: [{ id: '7', text: '>' }], answerId: '7' })).toBeNull();
  });

  it('知识点练习每隔一道是填数题，填数答案就是原题答案，题目 id 可以还原', () => {
    for (const kp of ['m1.add10', 'm1.carry20', 'm2.mul1', 'm2.remainder', 'm3.fraction1', 'm5.decmul']) {
      let seed = 7;
      const round = kpRound(kp, 10, () => (seed = (seed * 16807) % 2147483647) / 2147483647);
      if (!round.length) continue;
      const inputs = round.filter((e) => e.kind === 'input') as InputData[];
      expect(inputs.length).toBeGreaterThanOrEqual(3);
      for (const e of inputs) {
        expect(e.id.endsWith(':in')).toBe(true);
        expect(exerciseFromKpId(e.id)).toEqual(e);
        const base = exerciseFromKpId(e.id.slice(0, -3)) as ChoiceData;
        expect(base.options.find((o) => o.id === base.answerId)!.text).toBe(e.answer);
      }
    }
  });

  it('口算题：#in 结尾是填数题，答案和选择题一样', () => {
    const c = oralExercise('add20', '8+7') as ChoiceData;
    const i = oralExercise('add20', '8+7#in') as InputData;
    expect(i.kind).toBe('input');
    expect(i.answer).toBe(c.answerId);
    expect(i.id).toBe('8+7#in');
  });
});

describe('填数界面', () => {
  it('按数字键填答案；填错清空并提示，填对后报告（不算一次答对）', async () => {
    const onSolved = jest.fn();
    const onFeedback = jest.fn();
    const ex: InputData = {
      kind: 'input',
      id: 'i',
      skill: 's',
      prompt: P,
      stem: { text: '9 + 6 = ?' },
      answer: '15',
      wrongHint: P,
    };
    await render(<InputExercise exercise={ex} lang="zh" onFeedback={onFeedback} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('num-1'));
    await fireEvent.press(screen.getByTestId('num-4'));
    await fireEvent.press(screen.getByTestId('num-ok'));
    expect(onSolved).not.toHaveBeenCalled();
    expect(onFeedback).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'wrong' }));
    await fireEvent.press(screen.getByTestId('num-1'));
    await fireEvent.press(screen.getByTestId('num-5'));
    await fireEvent.press(screen.getByTestId('num-ok'));
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });
});

describe('选择题防乱点', () => {
  it('同一题第二次选错后，选项暂停 1.5 秒；暂停时点了也不算', async () => {
    jest.useFakeTimers();
    const onSolved = jest.fn();
    const ex: ChoiceData = {
      kind: 'choice',
      id: 'c',
      skill: 's',
      prompt: P,
      options: ['1', '2', '3', '4'].map((t) => ({ id: t, text: t })),
      answerId: '4',
      wrongHint: P,
    };
    await render(<ChoiceExercise exercise={ex} lang="zh" onFeedback={() => {}} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('option-1'));
    expect(screen.queryByTestId('choice-cooldown')).toBeNull();
    await fireEvent.press(screen.getByTestId('option-2'));
    expect(screen.getByTestId('choice-cooldown')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('option-4'));
    expect(onSolved).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(screen.queryByTestId('choice-cooldown')).toBeNull();
    await fireEvent.press(screen.getByTestId('option-4'));
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 3 });
    jest.useRealTimers();
  });
});

describe('描红写字', () => {
  const H: [number, number][] = [
    [15, 50],
    [85, 50],
  ];
  const HZ: [number, number][] = [
    [25, 25],
    [75, 25],
    [75, 78],
  ];
  it('笔画判定：顺着写对；倒着写提示方向反了；没写到位不算；折笔要经过拐点', () => {
    expect(
      checkStroke(
        [
          [16, 49],
          [50, 51],
          [84, 50],
        ],
        H,
      ),
    ).toBe('ok');
    expect(
      checkStroke(
        [
          [84, 50],
          [50, 50],
          [16, 50],
        ],
        H,
      ),
    ).toBe('reversed');
    expect(
      checkStroke(
        [
          [16, 50],
          [40, 50],
        ],
        H,
      ),
    ).toBe('off');
    expect(
      checkStroke(
        [
          [50, 10],
          [50, 90],
        ],
        H,
      ),
    ).toBe('off');
    expect(
      checkStroke(
        [
          [25, 25],
          [74, 26],
          [75, 50],
          [75, 77],
        ],
        HZ,
      ),
    ).toBe('ok');
    expect(
      checkStroke(
        [
          [25, 25],
          [50, 50],
          [75, 78],
        ],
        HZ,
      ),
    ).toBe('off'); // 斜着划过去，没有经过拐点
  });

  it('16 个字的笔画数正确、笔画名称规范、坐标在田字格内；4 个一组', () => {
    const count: Record<string, number> = {
      一: 1,
      二: 2,
      三: 3,
      十: 2,
      土: 3,
      王: 4,
      上: 3,
      下: 3,
      口: 3,
      日: 4,
      田: 5,
      中: 4,
      人: 2,
      大: 3,
      木: 4,
      山: 3,
    };
    expect(WRITE_CHARS.map((c) => c.char).sort()).toEqual(Object.keys(count).sort());
    for (const c of WRITE_CHARS) {
      expect(c.strokes).toHaveLength(count[c.char]);
      for (const [name, pts] of c.strokes) {
        expect(['横', '竖', '撇', '捺', '点', '横折', '竖折']).toContain(name);
        expect(pts.length).toBe(
          name.endsWith('折') ? 3 : name === '撇' || name === '捺' ? (pts.length === 3 ? 3 : 2) : 2,
        );
        for (const [x, y] of pts) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true);
      }
    }
    // 几个常考字的笔顺
    const order = (ch: string) =>
      WRITE_CHARS.find((c) => c.char === ch)!
        .strokes.map((s) => s[0])
        .join('');
    expect(order('口')).toBe('竖横折横');
    expect(order('山')).toBe('竖竖折竖');
    expect(order('木')).toBe('横竖撇点');
    expect(order('上')).toBe('竖横横');
    expect(WRITE_SETS.map((s) => s.length)).toEqual([4, 4, 4, 4]);
  });

  it('二年级 16 个字（V2.14）：笔画数、笔顺、坐标；4 个一组，接在一年级 4 组后面', () => {
    const count: Record<string, number> = {
      工: 3,
      士: 3,
      千: 3,
      午: 4,
      正: 5,
      古: 5,
      门: 3,
      广: 3,
      文: 4,
      方: 4,
      万: 3,
      力: 2,
      川: 3,
      斤: 4,
      片: 4,
      用: 5,
    };
    expect(WRITE_CHARS_G2.map((c) => c.char).sort()).toEqual(Object.keys(count).sort());
    for (const c of WRITE_CHARS_G2) {
      expect(c.strokes).toHaveLength(count[c.char]);
      for (const [name, pts] of c.strokes) {
        expect(['横', '竖', '撇', '捺', '点', '横折', '竖折', '横折钩']).toContain(name);
        if (name === '横折') expect(pts).toHaveLength(3);
        if (name === '横折钩') expect(pts).toHaveLength(4);
        for (const [x, y] of pts) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true);
      }
    }
    const order = (ch: string) =>
      WRITE_CHARS_G2.find((c) => c.char === ch)!
        .strokes.map((s) => s[0])
        .join('');
    // 常考笔顺：正（横竖横竖横）、方（点横横折钩撇）、万（横横折钩撇）、门（点竖横折钩）、片（撇竖横横折）
    expect(order('正')).toBe('横竖横竖横');
    expect(order('方')).toBe('点横横折钩撇');
    expect(order('万')).toBe('横横折钩撇');
    expect(order('门')).toBe('点竖横折钩');
    expect(order('片')).toBe('撇竖横横折');
    expect(order('力')).toBe('横折钩撇');
    expect(ALL_WRITE_SETS.map((s) => s.length)).toEqual([4, 4, 4, 4, 4, 4, 4, 4]);
    expect([1, 4, 5, 8].map(writeSetGrade)).toEqual([1, 1, 2, 2]);
    expect(resolveExercise('write:6', 'write-方')?.exercise.kind).toBe('trace');
    // 横折钩：顺着写对，只写到拐弯处不算
    const fang = traceExercise('方').strokes[2];
    expect(checkStroke(fang.points, fang.points)).toBe('ok');
    expect(checkStroke(fang.points.slice(0, 2), fang.points)).not.toBe('ok');
  });

  it('描红题可以从记录还原（今日复习）；界面显示当前是第几笔', async () => {
    const r = resolveExercise('write:3', 'write-日');
    expect(r?.exercise.kind).toBe('trace');
    expect(r?.subject).toBe('chinese');
    await render(<TraceExercise exercise={traceExercise('口')} lang="zh" onFeedback={() => {}} onSolved={() => {}} />);
    expect(screen.getByTestId('trace-step')).toBeTruthy();
  });
});

describe('口算闯关三～六年级（V2.14）', () => {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  /** 独立核对：把得数和算式都化成分数比较 */
  const frac = (t: string): [number, number] => {
    const f = t.match(/^(\d+)\/(\d+)$/);
    if (f) return [Number(f[1]), Number(f[2])];
    const [i, d = ''] = t.split('.');
    return [Number(i + d), 10 ** d.length];
  };
  const value = (expr: string) => {
    const m = expr.match(/^([\d./]+)([+\-×÷])([\d./]+)$/)!;
    const [a, b] = [frac(m[1]), frac(m[3])];
    const [n, d] =
      m[2] === '+'
        ? [a[0] * b[1] + b[0] * a[1], a[1] * b[1]]
        : m[2] === '-'
          ? [a[0] * b[1] - b[0] * a[1], a[1] * b[1]]
          : m[2] === '×'
            ? [a[0] * b[0], a[1] * b[1]]
            : [a[0] * b[1], a[1] * b[0]];
    return [n, d] as [number, number];
  };

  it('每个年级都有口算主题；高年级也能复习低年级', () => {
    for (const g of [3, 4, 5, 6]) {
      const own = ORAL_TOPICS.filter((t) => t.grade === g);
      expect(own.length).toBeGreaterThanOrEqual(2);
      for (const t of own) expect(topicsForGrade(g)).toContain(t);
    }
    expect(topicsForGrade(2).some((t) => t.grade >= 3)).toBe(false);
  });

  it('各主题 300 道：得数正确（分数为最简分数）、正确答案在选项中、选项不重复且不为负；填数版本答案相同', () => {
    const rand = seeded(9);
    for (const t of ORAL_TOPICS.filter((x) => x.grade >= 3 && x.grade <= 6)) // 初中口算（可以有负数）见 junior-content.test.ts
      for (let k = 0; k < 300; k++) {
        const expr = t.make(rand);
        const e = oralExercise(t.id, expr) as ChoiceData;
        const [n, d] = value(expr);
        expect(n).toBeGreaterThanOrEqual(0);
        const [an, ad] = frac(e.answerId);
        expect(an * d).toBe(n * ad);
        if (e.answerId.includes('/')) expect(gcd(an, ad)).toBe(1);
        if (expr.includes('/')) expect(e.answerId.includes('.')).toBe(false);
        expect(e.options.map((o) => o.id)).toContain(e.answerId);
        expect(e.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(e.options.map((o) => o.id)).size).toBe(e.options.length);
        for (const o of e.options) expect(o.id.startsWith('-')).toBe(false);
        const inp = oralExercise(t.id, `${expr}#in`) as InputData;
        expect(inp.kind).toBe('input');
        expect(inputMatches(e.answerId, inp.answer)).toBe(true);
        // 三年级起题目不注拼音
        expect(typeof e.prompt.text).toBe('string');
      }
  });

  it('整十整百的干扰项是“多一个 0、少一个 0”；分数朗读为“几分之几”', () => {
    const e = oralExercise('mul10', '700×3') as ChoiceData;
    expect(e.options.map((o) => o.id)).toEqual(expect.arrayContaining(['210', '2100', '21000']));
    expect((oralExercise('fracmul', '2/9×3') as ChoiceData).answerId).toBe('2/3');
    expect(oralExercise('fracmul', '2/9×3').prompt.speak.text).toContain('9分之2');
    expect((oralExercise('decaddsub', '0.6+0.7') as ChoiceData).answerId).toBe('1.3');
  });
});
