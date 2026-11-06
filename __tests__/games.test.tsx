/**
 * V2.19 游戏乐园：出题与答案（程序计算）、易混拼音都是真实音节、多音字读音与词库核对、难度升降、每日时长上限、
 * 错题进错题本并能在今日复习里还原、三个游戏的界面交互。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { pinyin } from 'pinyin-pro';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { resolveExercise } from '@/content/resolve';
import { bubbleExercise, bubbleRound, bubbleWords, misspellings } from '@/games/bubble';
import { canStartGame, gameLevel, LEVEL_RANGE, playedToday, starsFor } from '@/games/common';
import { CHAR_POOL } from '@/games/data/charPool.gen';
import { SYLLABLES } from '@/games/data/syllables.gen';
import { addTone, confusablePinyin, fishExercise, fishRound, POLY, splitTone } from '@/games/fish';
import { fmt, kitchenExercise, makeOrder, orderExerciseId, potState, solvable, sumUnits } from '@/games/kitchen';
import { kpForRecord } from '@/knowledge/mapping';
import { NavProvider } from '@/nav/Nav';
import { createEmptyProgress, parseProgress, progressReducer, type GameRecord, type ProgressState } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import GameScreen from '@/screens/GameScreen';
import GamesScreen from '@/screens/GamesScreen';

jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));
jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));
// 测试环境没有原生动画引擎：拖动层换成最简实现（真实拖动在网页端到端测试里验证）
jest.mock('@/drag/DragArea', () => {
  const { View } = require('react-native');
  return {
    DragArea: ({ children, style }: { children: React.ReactNode; style?: object }) => <View style={style}>{children}</View>,
    DropZone: ({ children, style, testID }: { children: React.ReactNode; style?: object; testID?: string }) => (
      <View style={style} testID={testID}>
        {children}
      </View>
    ),
    Draggable: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    justDragged: () => false,
  };
});

function seeded(n: number) {
  let s = n;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('凑数小厨房：出题', () => {
  it('8 个难度档各出 300 单：都能凑出来，答案之和等于目标，食材互不重复、都比目标小', () => {
    for (let level = 1; level <= 8; level++) {
      const rand = seeded(level * 7);
      for (let k = 0; k < 300; k++) {
        const o = makeOrder(level, rand, k);
        expect(solvable(o)).toBe(true);
        expect(o.solution.reduce((a, b) => a + b, 0)).toBe(o.target);
        const vals = o.items.map((i) => i.units);
        // 答案里可以有两样一样多的（5 + 5 = 10）；干扰食材和答案、彼此都不重复
        const extra = [...vals];
        for (const v of o.solution) extra.splice(extra.indexOf(v), 1);
        expect(extra).toHaveLength(2);
        expect(new Set([...new Set(o.solution), ...extra]).size).toBe(new Set(o.solution).size + 2);
        for (const v of vals) expect(v > 0 && v < o.target).toBe(true);
        expect(o.items).toHaveLength(o.solution.length + 2);
      }
    }
  });
  it('每档的目标：凑 10、凑 20、凑 100、小数凑 1、凑整百', () => {
    const r = seeded(3);
    expect(makeOrder(1, r).target).toBe(10);
    expect(makeOrder(3, r).target).toBe(20);
    expect(makeOrder(5, r).target).toBe(100);
    const d = makeOrder(6, r);
    expect(fmt(d.target, d.scale)).toBe('1');
    expect(d.items.every((i) => /^0\.\d$/.test(fmt(i.units, d.scale)))).toBe(true);
    const h = makeOrder(8, r);
    expect(h.target % 100).toBe(0);
  });
  it('锅里的状态：差一点 / 刚好 / 放多了；小数按百分之一精确计算', () => {
    const it = (units: number) => ({ id: String(units), units, emoji: '🍎' });
    expect(potState([it(3)], 10)).toBe('short');
    expect(potState([it(3), it(7)], 10)).toBe('exact');
    expect(potState([it(3), it(8)], 10)).toBe('over');
    expect(sumUnits([it(10), it(20)])).toBe(30); // 0.1 + 0.2 = 0.3，没有误差
    expect(fmt(30, 100)).toBe('0.3');
    expect(fmt(25, 100)).toBe('0.25');
  });
  it('没做好的一单变成复习题：“3 + ? = 10”，答案在选项里', () => {
    const e = kitchenExercise('kitchen:1:1:10:3,7')!;
    expect(e.stem?.text).toBe('3 + ? = 10');
    expect(e.answerId).toBe('7');
    expect(e.options.map((o) => o.id)).toContain('7');
    const d = kitchenExercise('kitchen:6:100:100:30,70')!;
    expect(d.stem?.text).toBe('0.3 + ? = 1');
    expect(d.answerId).toBe('0.7');
    expect(kitchenExercise('kitchen:1:1:10:3,6')).toBeNull(); // 和不对的 id 不出题
    const o = makeOrder(2, seeded(9));
    const e2 = kitchenExercise(orderExerciseId(o))!;
    expect(e2.options.map((x) => x.id)).toContain(e2.answerId);
  });
});

describe('拼音钓鱼：读音', () => {
  it('声调规则：有 a 标 a、ou 标 o、iu 标 u', () => {
    expect(addTone('hao', 3)).toBe('hǎo');
    expect(addTone('gou', 4)).toBe('gòu');
    expect(addTone('liu', 2)).toBe('liú');
    expect(addTone('lü', 4)).toBe('lǜ');
    expect(splitTone('zhǎng')).toEqual({ base: 'zhang', tone: 3 });
  });
  it('干扰鱼都是真实存在的读音，并且容易混：声调、前后鼻音、平翘舌', () => {
    expect(confusablePinyin('mā', 1)).toEqual(expect.arrayContaining(['má', 'mǎ', 'mà']));
    expect(confusablePinyin('jīn', 2)).toContain('jīng');
    expect(confusablePinyin('zhǎo', 3)).toContain('zǎo');
    for (const [, py] of CHAR_POOL)
      for (let lv = 1; lv <= 3; lv++) for (const d of confusablePinyin(py, lv)) expect([d, SYLLABLES.has(d)]).toEqual([d, true]);
  });
  it('一、二年级的字都是课程里人工注音、词库里只有一个读音的字', () => {
    expect(CHAR_POOL.length).toBeGreaterThan(200);
    for (const [ch, py] of CHAR_POOL) expect(pinyin(ch, { multiple: true, type: 'array' })).toEqual([py]);
  });
  it('每一局 6 题，正确答案在选项里，选项不重复', () => {
    for (let lv = 1; lv <= 4; lv++) {
      const qs = fishRound(lv, seeded(lv), 6);
      expect(qs).toHaveLength(6);
      for (const q of qs) {
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(lv >= 4 ? 2 : 3);
      }
    }
  });
});

describe('多音字（人工编写，与词库核对）', () => {
  // 词库对少数轻声读法不单列，人工确认的读法登记在这里
  const ACCEPTED: Record<string, string> = { '得:de': '结构助词读轻声', '着:zhe': '助词读轻声' };
  it('每个字至少两种读音；每种读音都是这个字在词库里的读音；句子里这个字只出现一次', () => {
    const chars = [...new Set(POLY.map((p) => p.char))];
    expect(chars.length).toBeGreaterThanOrEqual(25);
    for (const c of chars) expect(new Set(POLY.filter((p) => p.char === c).map((p) => p.py)).size).toBeGreaterThanOrEqual(2);
    const problems: string[] = [];
    for (const p of POLY) {
      const readings = pinyin(p.char, { multiple: true, type: 'array' });
      if (!readings.includes(p.py) && !ACCEPTED[`${p.char}:${p.py}`]) problems.push(`${p.char}:${p.py}（词库：${readings.join('/')}）`);
      expect([...p.sentence].filter((x) => x === p.char)).toHaveLength(1);
    }
    expect(problems).toEqual([]);
  });
  it('错题复习：多音字题给出整句话，选项是这个字的几种读音', () => {
    const q = fishRound(4, seeded(5), 1)[0];
    const e = fishExercise(q.id)!;
    expect(e.stem?.text).toBe(q.sentence);
    expect(e.answerId).toBe(q.answer);
    expect(e.options.map((o) => o.id)).toContain(q.answer);
  });
});

describe('拼词泡泡', () => {
  it('一、二年级只用启蒙单词，三年级起用本年级及以下 PEP 单词；都是小写单个单词', () => {
    const g1 = bubbleWords(1, 1);
    expect(g1.every((c) => c.unitId.startsWith('talk-') || c.unitId.startsWith('phonics-'))).toBe(true);
    const g4 = bubbleWords(4, 2);
    expect(g4.every((c) => /^pep[34]/.test(c.unitId) && /^[a-z]{5,6}$/.test(c.w))).toBe(true);
  });
  it('泡泡里有单词的全部字母和干扰字母；拼错的样子和原词不同', () => {
    for (const q of bubbleRound(3, 2, seeded(2), 6)) {
      const letters = q.bubbles.map((b) => b.letter);
      for (const ch of q.card.w) expect(letters).toContain(ch);
      expect(letters.length).toBe(q.card.w.length + 3);
    }
    expect(misspellings('apple').every((m) => m !== 'apple')).toBe(true);
    const e = bubbleExercise('bubble:pep3a-4∕panda')!;
    expect(e.answerId).toBe('panda');
    expect(e.options.map((o) => o.id)).toContain('panda');
  });
});

describe('难度、星星、时长上限', () => {
  const rec = (level: number, correct: number, at = Date.now(), sec = 120): GameRecord => ({ game: 'kitchen', at, sec, stars: 2, correct, total: 6, level });
  it('最近两局都好 → 升一档；一局很差 → 降一档；不超出本年级范围', () => {
    expect(gameLevel([], 'kitchen', 1)).toBe(1);
    expect(gameLevel([rec(1, 6), rec(1, 6)], 'kitchen', 1)).toBe(2);
    expect(gameLevel([rec(2, 6), rec(2, 2)], 'kitchen', 1)).toBe(1);
    expect(gameLevel([rec(3, 6), rec(3, 6)], 'kitchen', 1)).toBe(3); // 一年级最高 3 档
    expect(gameLevel([rec(2, 6), rec(2, 4)], 'kitchen', 1)).toBe(2); // 4/6 不升不降
    expect(LEVEL_RANGE.fish(3)).toEqual([4, 4]);
    expect([starsFor(6, 6), starsFor(4, 6), starsFor(1, 6)]).toEqual([3, 2, 1]);
  });
  it('每天时长上限默认 15 分钟：玩满后不能开新局；设成“不限制”可以继续', () => {
    const now = Date.now();
    let s: ProgressState = createEmptyProgress();
    expect(s.settings.gameMinutes).toBe(15);
    s = { ...s, games: [rec(1, 6, now - 1000, 300), rec(1, 6, now - 500, 300), rec(1, 6, now - 100, 300)] };
    expect(playedToday(s, now)).toBe(900);
    expect(canStartGame(s, now)).toBe(false);
    expect(canStartGame({ ...s, settings: { ...s.settings, gameMinutes: 0 } }, now)).toBe(true);
    expect(canStartGame({ ...s, settings: { ...s.settings, gameMinutes: 20 } }, now)).toBe(true);
  });
  it('玩完一局：保存记录、加星星；用时最多计 5 分钟；旧数据（v6）读入后游戏记录为空', () => {
    const s = progressReducer(createEmptyProgress(), { type: 'game/complete', record: rec(1, 6, 1, 9999) });
    expect(s.totalStars).toBe(2);
    expect(s.games[0].sec).toBe(300);
    const v6 = { ...createEmptyProgress(), version: 6 } as Record<string, unknown>;
    delete v6.games;
    expect(parseProgress(JSON.stringify(v6))!.games).toEqual([]);
  });
  it('游戏错题能在今日复习里还原；一年级凑数归到知识点“10 以内分与合”', () => {
    for (const [lesson, id] of [
      ['game:kitchen', 'kitchen:1:1:10:3,7'],
      ['game:fish', fishRound(1, seeded(1), 1)[0].id],
      ['game:bubble', 'bubble:talk-7∕cat'],
    ]) {
      const r = resolveExercise(lesson, id);
      expect(r).not.toBeNull();
    }
    expect(kpForRecord('game:kitchen', 'kitchen:1:1:10:3,7', 'game.kitchen')).toBe('m1.compose10');
  });
});

async function renderWith(node: React.ReactElement, patch: Partial<ProgressState> = {}, settings: Record<string, unknown> = {}) {
  const p = createEmptyProgress();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, ...patch, settings: { ...p.settings, ...settings } }));
  const nav = { push: jest.fn(), back: jest.fn(), home: jest.fn() };
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 820 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProgressProvider>
        <NavProvider nav={nav}>{node}</NavProvider>
      </ProgressProvider>
    </SafeAreaProvider>,
  );
  return nav;
}

afterEach(async () => {
  await AsyncStorage.clear();
});

describe('界面', () => {
  it('游戏乐园：三个游戏；今天玩满 15 分钟后不能开新局', async () => {
    const nav = await renderWith(<GamesScreen />);
    await screen.findByTestId('games-screen');
    await fireEvent.press(screen.getByTestId('games-start-fish'));
    expect(nav.push).toHaveBeenCalledWith({ name: 'game', id: 'fish' });
    screen.unmount();
    const now = Date.now();
    await renderWith(<GamesScreen />, { games: [{ game: 'fish', at: now - 1000, sec: 300, stars: 3, correct: 6, total: 6, level: 1 }, { game: 'fish', at: now - 900, sec: 300, stars: 3, correct: 6, total: 6, level: 1 }, { game: 'fish', at: now - 800, sec: 300, stars: 3, correct: 6, total: 6, level: 1 }] });
    expect(await screen.findByTestId('games-locked')).toBeTruthy();
    expect(screen.getByTestId('games-time')).toHaveTextContent(/15 分钟/);
  });

  it('拼音钓鱼：钓错一次（这题不算一次做对）再钓对；玩完 6 题看到星星，错题进错题本', async () => {
    jest.spyOn(Math, 'random').mockImplementation(seeded(42));
    await renderWith(<GameScreen id="fish" />);
    await screen.findByTestId('game-fish');
    for (let k = 0; k < 6; k++) {
      const ch = String(screen.getByTestId('fish-char').props.children);
      const py = CHAR_POOL.find(([c]) => c === ch)![1];
      const pond = screen.getByTestId('fish-pond');
      if (k === 0) {
        const wrong = within(pond).getAllByRole('button').find((b) => b.props.accessibilityLabel !== py)!;
        await fireEvent.press(wrong);
        expect(screen.getByTestId('fish-status')).toHaveTextContent(/再找一找|zhǎo/);
      }
      await fireEvent.press(within(pond).getByTestId(`fish-${py}`));
      await fireEvent.press(screen.getByTestId('fish-next'));
    }
    expect(await screen.findByTestId('game-summary')).toBeTruthy();
    expect(screen.getByTestId('game-score')).toHaveTextContent('一次做对 5 / 6');
    expect(screen.getByTestId('game-stars')).toHaveTextContent('⭐⭐⭐');
    (Math.random as jest.Mock).mockRestore();
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
    await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!).games).toHaveLength(1));
    expect(saved).toBeTruthy();
    const latest = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
    const keys = Object.keys(latest.mistakes);
    expect(keys).toHaveLength(1);
    expect(keys[0].startsWith('game:fish/')).toBe(true);
    expect(latest.results.every((r: { source: string }) => r.source === 'game')).toBe(true);
  });

  it('凑数小厨房：放多了锅冒烟（这一单不算一次做对），拿出来后凑对', async () => {
    jest.spyOn(Math, 'random').mockImplementation(seeded(7));
    await renderWith(<GameScreen id="kitchen" />);
    await screen.findByTestId('game-kitchen');
    expect(screen.getByTestId('kitchen-target')).toHaveTextContent('10');
    // 找出这单的食材数值
    const foods = screen.getAllByTestId(/^food-/);
    const vals = foods.map((f) => Number(f.props.accessibilityLabel));
    // 先放两个加起来超过 10 的
    const big = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    await fireEvent.press(foods[big[0][1]]);
    await fireEvent.press(screen.getAllByTestId(/^food-/).find((f) => Number(f.props.accessibilityLabel) === big[1][0])!);
    if (big[0][0] + big[1][0] > 10) {
      expect(screen.getByTestId('kitchen-status')).toHaveTextContent(/太多|tài/);
      // 拿出来
      for (const chip of screen.getAllByTestId(/^pot-/)) await fireEvent.press(chip);
    }
    // 找一组刚好凑 10 的
    const now = screen.getAllByTestId(/^food-/).map((f) => Number(f.props.accessibilityLabel));
    let pair: [number, number] | null = null;
    for (let i = 0; i < now.length && !pair; i++) for (let j = i + 1; j < now.length; j++) if (now[i] + now[j] === 10) pair = [now[i], now[j]];
    expect(pair).not.toBeNull();
    for (const v of pair!) await fireEvent.press(screen.getAllByTestId(/^food-/).find((f) => Number(f.props.accessibilityLabel) === v)!);
    expect(await screen.findByTestId('kitchen-done')).toHaveTextContent(/= 10$/);
    (Math.random as jest.Mock).mockRestore();
    expect(screen.getByTestId('kitchen-next')).toBeTruthy();
  });

  it('拼词泡泡：按顺序戳字母拼出单词；戳错的词进生词本', async () => {
    jest.spyOn(Math, 'random').mockImplementation(seeded(11));
    await renderWith(<GameScreen id="bubble" />, {}, { grade: 3 });
    await screen.findByTestId('game-bubble');
    const zhText = String(screen.getByTestId('bubble-zh').props.children);
    const word = bubbleWords(3, 1).find((c) => c.zh === zhText)!.w;
    const sky = () => screen.getByTestId('bubble-sky');
    // 先戳一个错的字母
    const wrong = within(sky()).getAllByRole('button').find((b) => b.props.accessibilityLabel !== word[0])!;
    await fireEvent.press(wrong);
    for (const ch of word) {
      const b = within(sky()).getAllByRole('button').find((x) => x.props.accessibilityLabel === ch)!;
      await fireEvent.press(b);
    }
    expect(await screen.findByTestId('bubble-done')).toHaveTextContent(new RegExp(word));
    (Math.random as jest.Mock).mockRestore();
    await act(async () => undefined);
    await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!).wordbook.map((e: { w: string }) => e.w)).toContain(word));
  });

  it('时长用完时打开游戏：显示“今天玩够啦”', async () => {
    const now = Date.now();
    const g = { game: 'kitchen' as const, at: now - 100, sec: 300, stars: 1, correct: 1, total: 6, level: 1 };
    await renderWith(<GameScreen id="kitchen" />, { games: [g, g, g] });
    expect(await screen.findByTestId('game-rest')).toBeTruthy();
  });
});
