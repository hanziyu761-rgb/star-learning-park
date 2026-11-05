/**
 * V2.11 思维训练：难度跟着孩子走；一题多解（多选）；小侦探找错。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { zh } from '@/content/zh';
import { MultiExercise } from '@/exercises/MultiExercise';
import type { MultiExercise as MultiData } from '@/lesson/types';
import { createEmptyProgress, parseProgress, type ChallengeRecord } from '@/progress/model';
import { adaptiveLevel, challengeLevel, levelRange } from '@/thinking/adaptive';
import { seeded, type Level } from '@/thinking/challenges';
import { detective, FRACS, multiway } from '@/thinking/challengesMulti';
import { dailyChallenge, gensFor } from '@/thinking/registry';

jest.mock('@/components/FeedbackBar', () => ({ FeedbackBar: () => null }));

const rec = (ok: boolean, subject: ChallengeRecord['subject'] = 'math', i = 0): ChallengeRecord => ({
  at: i,
  day: '2026-11-01',
  id: 'ch:seq:x',
  type: 'seq',
  dims: ['observe'],
  firstTryCorrect: ok,
  attempts: ok ? 1 : 2,
  daily: false,
  subject,
});

/** 计算算式或分数的值（只含 + - × ÷ 和 a/b） */
function evalExpr(t: string): number {
  const f = t.match(/^(\d+)\/(\d+)$/);
  if (f) return Number(f[1]) / Number(f[2]);
  const m = t.match(/^(\d+)([+\-×÷])(\d+)$/)!;
  const a = Number(m[1]);
  const b = Number(m[3]);
  return m[2] === '+' ? a + b : m[2] === '-' ? a - b : m[2] === '×' ? a * b : a / b;
}

describe('难度跟着孩子走', () => {
  it('最近 5 道答对 4 道以上升一档，最多答对 1 道降一档，否则不变', () => {
    expect(adaptiveLevel(1, [], 'math')).toMatchObject({ level: 1, change: 'keep' });
    const good = [true, true, false, true, true].map((ok, i) => rec(ok, 'math', i));
    expect(adaptiveLevel(1, good, 'math')).toMatchObject({ level: 2, change: 'up', recentCorrect: 4 });
    // 只看本科
    expect(adaptiveLevel(1, good, 'chinese').level).toBe(1);
    const bad = [false, true, false].map((ok, i) => rec(ok, 'math', i));
    expect(adaptiveLevel(4, bad, 'math')).toMatchObject({ level: 2, change: 'down' });
    const mid = [true, false, true, false, true].map((ok, i) => rec(ok, 'math', i));
    expect(adaptiveLevel(4, mid, 'math')).toMatchObject({ level: 3, change: 'keep' });
    // 只看最近 5 道
    const old = [...[1, 2, 3, 4, 5].map((i) => rec(true, 'math', i)), ...[6, 7, 8].map((i) => rec(false, 'math', i))];
    expect(adaptiveLevel(4, old, 'math').recent).toBe(5);
  });

  it('只在年级起点上下一档内调整；一、二年级不升到三档', () => {
    expect(levelRange(1)).toEqual([1, 2]);
    expect(levelRange(2)).toEqual([1, 2]);
    expect(levelRange(3)).toEqual([2, 4]);
    expect(levelRange(6)).toEqual([3, 4]);
    const good = [1, 2, 3, 4, 5].map((i) => rec(true, 'math', i));
    expect(adaptiveLevel(2, good, 'math').level).toBe(2);
    expect(adaptiveLevel(6, good, 'math').level).toBe(4);
    const bad = [1, 2, 3].map((i) => rec(false, 'math', i));
    expect(adaptiveLevel(1, bad, 'math').level).toBe(1);
  });

  it('二档及以下的题注拼音，三档起不注；指定难度档就按这一档出题', () => {
    const low = dailyChallenge('2026-11-02', 3, 0, 'chinese', 2);
    const high = dailyChallenge('2026-11-02', 3, 0, 'chinese', 3);
    expect(JSON.stringify(low)).toContain('"py"');
    expect(JSON.stringify(high)).not.toContain('"py"');
  });

  it('家长关掉“跟着孩子调整”后固定按年级', () => {
    const state = createEmptyProgress();
    state.challenges = [1, 2, 3, 4, 5].map((i) => rec(true, 'math', i));
    expect(challengeLevel(state, 'math').level).toBe(2);
    state.settings = { ...state.settings, adaptiveChallenge: false };
    expect(challengeLevel(state, 'math')).toMatchObject({ level: 1, change: 'keep' });
  });

  it('旧记录没有 level 字段也能读；新记录保存难度档', () => {
    const raw = JSON.stringify({
      version: 5,
      totalStars: 0,
      lessons: {},
      results: [],
      sessions: [],
      mistakes: {},
      challenges: [rec(true), { ...rec(false), level: 2 }],
    });
    const p = parseProgress(raw)!;
    expect(p.challenges).toHaveLength(2);
    expect(p.challenges[1].level).toBe(2);
    expect(p.challenges[0].level).toBeUndefined();
    // 旧设置没有这个开关：读入后默认开启
    expect(p.settings.adaptiveChallenge).toBe(true);
  });
});

describe('一题多解', () => {
  it('每档都有，正确答案全部等于目标、错误答案都不等于，至少 2 个正确 2 个错误', () => {
    const rand = seeded(7);
    for (const level of [1, 2, 3, 4] as Level[]) {
      expect(gensFor('math', level).map((g) => g.type)).toEqual(expect.arrayContaining(['multiway', 'detective']));
      for (let k = 0; k < 60; k++) {
        const sig = multiway.sig(rand, level);
        const ex = multiway.build(sig);
        if (ex.kind !== 'multi') throw new Error('应为多选题');
        const n = sig.split(':')[2];
        const target = level === 4 ? FRACS[Number(n)][0] / FRACS[Number(n)][1] : Number(n);
        const texts = ex.options.map((o) => String(o.text));
        expect(new Set(texts).size).toBe(texts.length);
        expect(ex.answerIds.length).toBeGreaterThanOrEqual(2);
        expect(ex.options.length - ex.answerIds.length).toBeGreaterThanOrEqual(2);
        for (const o of ex.options) {
          const v = evalExpr(String(o.text));
          expect(Math.abs(v - target) < 1e-9).toBe(ex.answerIds.includes(o.id));
          if (level <= 2) expect(v).toBeGreaterThanOrEqual(0);
        }
        // 同一个签名每次一样
        expect(multiway.build(sig)).toEqual(ex);
      }
    }
  });

  it('多选界面：选错的去掉、漏选提示还有，全部选对才通过', async () => {
    const P = { text: zh('选一选', 'xuǎn yi xuǎn'), speak: { text: '选一选', lang: 'zh-CN' as const } };
    const ex: MultiData = {
      kind: 'multi',
      id: 'm',
      skill: 's',
      prompt: P,
      options: ['2+8', '3+7', '4+5', '6+4'].map((t, i) => ({ id: String(i), text: t })),
      answerIds: ['0', '1', '3'],
      wrongHint: P,
    };
    const onFeedback = jest.fn();
    const onSolved = jest.fn();
    await render(<MultiExercise exercise={ex} lang="zh" onFeedback={onFeedback} onSolved={onSolved} />);
    await fireEvent.press(screen.getByTestId('multi-0'));
    await fireEvent.press(screen.getByTestId('multi-2'));
    await fireEvent.press(screen.getByTestId('multi-ok'));
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.getByTestId('multi-2').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('multi-0').props.accessibilityState.checked).toBe(true);
    await fireEvent.press(screen.getByTestId('multi-1'));
    await fireEvent.press(screen.getByTestId('multi-ok'));
    expect(onSolved).not.toHaveBeenCalled();
    expect(JSON.stringify(onFeedback.mock.calls.at(-1))).toContain('还有别的答案');
    await fireEvent.press(screen.getByTestId('multi-3'));
    await fireEvent.press(screen.getByTestId('multi-ok'));
    expect(onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 3 });
  });
});

describe('小侦探找错', () => {
  it('4 道算式里正好一道算错（答案就是它），其余都对；三四档的错误是忘了进位', () => {
    const rand = seeded(11);
    for (const level of [1, 2, 3, 4] as Level[])
      for (let k = 0; k < 60; k++) {
        const ex = detective.build(detective.sig(rand, level));
        if (ex.kind !== 'choice') throw new Error('应为选择题');
        expect(ex.options).toHaveLength(4);
        const wrongIds = ex.options.filter((o) => {
          const [l, r] = String(o.text).split('=');
          return evalExpr(l) !== Number(r);
        });
        expect(wrongIds.map((o) => o.id)).toEqual([ex.answerId]);
        const [l, r] = String(wrongIds[0].text).split('=');
        const diff = evalExpr(l) - Number(r);
        if (level >= 3) expect(diff).toBe(10);
        else expect(Math.abs(diff)).toBe(1);
        expect(Number(r)).toBeGreaterThanOrEqual(0);
      }
  });
});
