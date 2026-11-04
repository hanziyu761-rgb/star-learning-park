/**
 * V2.5 思维训练：数据迁移、星星规则、7 类挑战题答案（独立计算核对）、每日轮换、思路选择、家长统计、界面。
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ChoiceExercise, PuzzleFigure } from '@/lesson/types';
import { NavProvider } from '@/nav/Nav';
import {
  createEmptyProgress,
  parseProgress,
  progressReducer,
  type ChallengeRecord,
  type ProgressState,
} from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { dayKey } from '@/progress/srs';
import ChallengeScreen from '@/screens/ChallengeScreen';
import {
  CHALLENGES,
  challengeFromId,
  challengeId,
  dailyChallenge,
  seeded,
  type ChallengeType,
} from '@/thinking/challenges';
import { MIN_SAMPLES, thinkingProfile } from '@/thinking/profile';
import { shouldAskStrategy, STRATEGIES, STRATEGY_SETS, strategyOptions } from '@/thinking/strategies';

jest.mock('@/components/FeedbackBar', () => ({ FeedbackBar: () => null }));
jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));
jest.mock('@/drag/DragArea', () => {
  const { View } = jest.requireActual('react-native');
  return { DragArea: View, DropZone: View, Draggable: View };
});

const answerOf = (e: ChoiceExercise) => e.options.find((o) => o.id === e.answerId)!;
const puzzleOf = (e: ChoiceExercise): PuzzleFigure => {
  const f = e.stem?.visual?.figure;
  if (!f || f.type !== 'puzzle') throw new Error('no puzzle');
  return f.puzzle;
};

describe('学习记录 v5', () => {
  it('v4 旧数据升级：保留原有记录，新增空的思路和挑战记录', () => {
    const v4 = { ...createEmptyProgress(), version: 4, totalStars: 7 } as Partial<ProgressState>;
    delete v4.strategies;
    delete v4.challenges;
    const s = parseProgress(JSON.stringify(v4))!;
    expect(s.version).toBe(5);
    expect(s.totalStars).toBe(7);
    expect(s.strategies).toEqual([]);
    expect(s.challenges).toEqual([]);
  });

  it('每日挑战：当天第一道答对 2 颗星、答错 1 颗星；同一天再做不给星', () => {
    const rec = (over: Partial<ChallengeRecord>): ChallengeRecord => ({
      at: 1,
      day: '2026-11-05',
      id: 'ch:x',
      type: 'odd',
      dims: ['classify'],
      firstTryCorrect: true,
      attempts: 1,
      daily: true,
      ...over,
    });
    let s = progressReducer(createEmptyProgress(), { type: 'challenge/complete', record: rec({}) });
    expect(s.totalStars).toBe(2);
    s = progressReducer(s, { type: 'challenge/complete', record: rec({ daily: true }) }); // 同一天又标成 daily
    expect(s.totalStars).toBe(2);
    expect(s.challenges[1].daily).toBe(false);
    s = progressReducer(s, { type: 'challenge/complete', record: rec({ day: '2026-11-06', firstTryCorrect: false }) });
    expect(s.totalStars).toBe(3);
    // 挑战不进入正确率和复习本
    expect(s.results).toHaveLength(0);
    expect(Object.keys(s.mistakes)).toHaveLength(0);
  });

  it('选思路：记入 strategies', () => {
    const s = progressReducer(createEmptyProgress(), {
      type: 'strategy/choose',
      record: { at: 1, kp: 'm1.carry20', lessonId: 'kp:m1.carry20', exerciseId: 'e', choice: 'make10' },
    });
    expect(s.strategies).toHaveLength(1);
  });
});

/** 独立核对每类题的答案（不调用生成器里的计算函数） */
function verify(type: ChallengeType, sig: string, e: ChoiceExercise) {
  const parts = sig.split(':');
  const ans = answerOf(e);
  const num = Number(ans.text);
  switch (type) {
    case 'balance': {
      const [k1, k2] = [Number(parts[4]), Number(parts[5])];
      const p = puzzleOf(e);
      if (p.kind !== 'balance') throw new Error();
      expect(p.rows[0].rightCount).toBe(k1);
      expect(p.rows[1].rightCount).toBe(k2);
      // 1 C = k2 B，1 B = k1 A
      expect(num).toBe(k2 * k1);
      break;
    }
    case 'queue': {
      const [a, b] = [Number(parts[2]), Number(parts[3])];
      // 摆一队验证：fb = 前 a + 自己 + 后 b；pos = 第 a 个且倒数第 b 个
      const n = parts[1] === 'fb' ? [...Array(a).fill(0), 1, ...Array(b).fill(0)].length : a + b - 1;
      if (parts[1] === 'pos') {
        const line = Array.from({ length: n }, (_, i) => i);
        expect(line[a - 1]).toBe(line[line.length - b]);
      }
      expect(num).toBe(n);
      break;
    }
    case 'sudoku': {
      const p = puzzleOf(e);
      if (p.kind !== 'grid') throw new Error();
      const n = p.cells.length;
      const icons = ['🍎', '🍌', '🍇', '🍓'].slice(0, n);
      // 独立穷举：把所有空格和问号格填上，保留每行每列不重复的填法
      const flat = p.cells.flat();
      const holes = flat.map((c, i) => (c === '' || c === '?' ? i : -1)).filter((i) => i >= 0);
      const target = flat.indexOf('?');
      const found = new Set<string>();
      const total = icons.length ** holes.length;
      for (let m = 0; m < total; m++) {
        const g = [...flat];
        let x = m;
        for (const h of holes) {
          g[h] = icons[x % n];
          x = Math.floor(x / n);
        }
        let ok = true;
        for (let r = 0; r < n && ok; r++) {
          if (new Set(g.slice(r * n, r * n + n)).size !== n) ok = false;
          if (new Set(Array.from({ length: n }, (_, k) => g[k * n + r])).size !== n) ok = false;
        }
        if (ok) found.add(g[target]);
      }
      expect([...found]).toEqual([ans.visual!.emoji]);
      break;
    }
    case 'rects': {
      const [r, c, sq] = [Number(parts[1]), Number(parts[2]), parts[3] === '1'];
      let count = 0;
      for (let r1 = 0; r1 < r; r1++)
        for (let r2 = r1; r2 < r; r2++)
          for (let c1 = 0; c1 < c; c1++) for (let c2 = c1; c2 < c; c2++) if (!sq || r2 - r1 === c2 - c1) count++;
      expect(num).toBe(count);
      break;
    }
    case 'seq': {
      const shown = String(e.stem!.text).split('，').slice(0, 4).map(Number);
      const d = shown.map((v, i) => (i ? v - shown[i - 1] : 0)).slice(1);
      const next = parts[1] === 'grow' ? shown[3] + (d[2] + 1) : shown[3] + d[2];
      if (parts[1] === 'grow') expect(d).toEqual([d[0], d[0] + 1, d[0] + 2]);
      else expect(new Set(d).size).toBe(1);
      expect(num).toBe(next);
      expect(num).toBeGreaterThan(0);
      break;
    }
    case 'pattern': {
      const shown = String(e.stem!.text).replace(' ❓', '').split(' ');
      const unit = { AB: 2, AAB: 3, ABB: 3, ABC: 3 }[parts[1]]!;
      for (let i = unit; i < shown.length; i++) expect(shown[i]).toBe(shown[i - unit]);
      expect(ans.visual!.emoji).toBe(shown[7 - unit]);
      break;
    }
    case 'odd': {
      const cats = [
        ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑'],
        ['🐶', '🐱', '🐰', '🐼', '🐯', '🐸'],
        ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢'],
        ['✏️', '📏', '✂️', '📒', '🖍️', '📐'],
      ];
      const catOf = (x: string) => cats.findIndex((c) => c.includes(x));
      const others = e.options.filter((o) => o.id !== e.answerId).map((o) => catOf(o.visual!.emoji));
      expect(new Set(others).size).toBe(1);
      expect(catOf(ans.visual!.emoji)).not.toBe(others[0]);
      break;
    }
  }
}

describe('挑战题', () => {
  it('7 类题 × 两个难度 × 各 120 道：答案独立核对正确；选项不重复；可由题目 id 还原同一道题', () => {
    const rand = seeded(42);
    let n = 0;
    for (const g of CHALLENGES)
      for (const level of [1, 2] as const)
        for (let k = 0; k < 120; k++) {
          const sig = g.sig(rand, level);
          const e = g.build(sig);
          expect(e.options.length).toBeGreaterThanOrEqual(3);
          const keys = e.options.map((o) => o.text ?? o.visual?.emoji);
          expect(new Set(keys).size).toBe(keys.length);
          expect(e.options.some((o) => o.id === e.answerId)).toBe(true);
          verify(g.type, sig, e as ChoiceExercise);
          const back = challengeFromId(challengeId(sig))!;
          expect(back.type).toBe(g.type);
          expect(back.options).toEqual(e.options);
          expect(back.wrongHint.text.length).toBeGreaterThan(0);
          n++;
        }
    expect(n).toBe(7 * 2 * 120);
  });

  it('难度：一年级填格子 3×3，二年级 4×4；一年级排队人数不超过 11', () => {
    const r = seeded(7);
    const g = CHALLENGES.find((x) => x.type === 'sudoku')!;
    expect(g.sig(r, 1).split(':')[1]).toBe('3');
    expect(g.sig(r, 2).split(':')[1]).toBe('4');
    const q = CHALLENGES.find((x) => x.type === 'queue')!;
    for (let i = 0; i < 100; i++)
      expect(Number(answerOf(q.build(q.sig(r, 1)) as ChoiceExercise).text)).toBeLessThanOrEqual(11);
  });

  it('每日挑战：同一天同一道；连续 7 天 7 种题型；“再玩一道”是另一道', () => {
    const a = dailyChallenge('2026-11-05', 1);
    expect(dailyChallenge('2026-11-05', 1).id).toBe(a.id);
    const types = new Set(
      Array.from({ length: 7 }, (_, i) => dailyChallenge(`2026-11-${String(5 + i).padStart(2, '0')}`, 1).type),
    );
    expect(types.size).toBe(7);
    expect(dailyChallenge('2026-11-05', 1, 1).id).not.toBe(a.id);
  });
});

describe('你是怎么想的', () => {
  it('每轮第 1、4、7、10 道一次答对的题问；只问有思路选项的知识点', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((n) => shouldAskStrategy('m1.carry20', n))).toEqual([
      true,
      false,
      false,
      true,
      false,
      false,
      true,
    ]);
    expect(shouldAskStrategy('m1.shapes2d', 1)).toBe(false);
    expect(shouldAskStrategy(null, 1)).toBe(false);
    for (const ids of Object.values(STRATEGY_SETS)) for (const id of ids) expect(STRATEGIES[id]).toBeDefined();
    expect(strategyOptions('m1.carry20').map((o) => o.id)).toContain('make10');
  });
});

describe('家长中心统计', () => {
  const base = createEmptyProgress();
  const strat = (choice: string, i: number) => ({
    at: i,
    kp: 'm1.carry20',
    lessonId: 'l',
    exerciseId: `e${i}`,
    choice,
  });

  it('记录少于 5 次不下结论；多数靠数数时给出建议；多数用凑十时说明已用较快方法', () => {
    const few = { ...base, strategies: [strat('count', 1), strat('count', 2)] };
    expect(thinkingProfile(few).strategies[0].advice).toBeNull();
    const counting = { ...base, strategies: [1, 2, 3, 4].map((i) => strat('count', i)).concat([strat('make10', 5)]) };
    expect(counting.strategies.length).toBeGreaterThanOrEqual(MIN_SAMPLES);
    expect(thinkingProfile(counting).strategies[0].advice).toContain('一个一个地数');
    const fast = { ...base, strategies: [1, 2, 3, 4, 5].map((i) => strat(i % 2 ? 'make10' : 'recall', i)) };
    expect(thinkingProfile(fast).strategies[0].advice).toContain('较快的方法');
  });

  it('按思维方面统计挑战记录；连续天数', () => {
    const now = new Date(2026, 10, 5, 10).getTime();
    const day = (k: number) => dayKey(now - k * 86_400_000);
    const ch = (k: number, type: string, dims: string[], ok: boolean): ChallengeRecord => ({
      at: now - k * 86_400_000,
      day: day(k),
      id: `ch:${type}`,
      type,
      dims,
      firstTryCorrect: ok,
      attempts: ok ? 1 : 2,
      daily: true,
    });
    const s = {
      ...base,
      challenges: [
        ch(0, 'balance', ['reason'], true),
        ch(1, 'odd', ['classify'], false),
        ch(2, 'sudoku', ['reason', 'observe'], true),
        ch(4, 'seq', ['observe'], true),
      ],
    };
    const p = thinkingProfile(s, now);
    expect(p.dims.find((d) => d.dim === 'reason')).toEqual({ dim: 'reason', tried: 2, firstTryCorrect: 2 });
    expect(p.dims.find((d) => d.dim === 'classify')).toEqual({ dim: 'classify', tried: 1, firstTryCorrect: 0 });
    expect(p.streak).toBe(3);
    expect(p.doneToday).toBe(true);
    expect(p.challengeDays).toBe(4);
  });
});

describe('每日挑战页面', () => {
  it('显示今天的题；答对后给星星并可以再玩一道', async () => {
    const nav = { push: jest.fn(), back: jest.fn(), home: jest.fn() };
    await render(
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 820 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          }}
        >
          <ProgressProvider>
            <NavProvider nav={nav}>
              <ChallengeScreen />
            </NavProvider>
          </ProgressProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>,
    );
    await screen.findByTestId('challenge-screen');
    const ex = dailyChallenge(dayKey(Date.now()), 1);
    expect(screen.getByTestId('challenge-type').props.children).toBe(CHALLENGES.find((g) => g.type === ex.type)!.name);
    await fireEvent.press(screen.getByTestId(`option-${ex.answerId}`));
    expect(await screen.findByTestId('challenge-result')).toBeTruthy();
    expect(screen.getByTestId('challenge-stars').props.children.join('')).toContain('⭐⭐');
    await fireEvent.press(screen.getByTestId('challenge-more'));
    expect(screen.queryByTestId('challenge-result')).toBeNull();
  });
});
