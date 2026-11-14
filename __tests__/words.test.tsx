/**
 * V2.18 英语单词卡：数据齐全、记忆窍门（程序计算）、刷卡规则、生词本、听写、页面交互。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PHONICS_GROUPS, PHONICS_WORDS, TALK_UNITS } from '@/content/englishStarter';
import { NavProvider } from '@/nav/Nav';
import { createEmptyProgress, parseProgress, progressReducer } from '@/progress/model';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import WordCardsScreen from '@/screens/WordCardsScreen';
import { ALL_CARDS, CARD_BY_ID, UNIT_BY_ID, WORD_UNITS } from '@/words/catalog';
import { isCorrectSpelling, letterTiles, pickDictation } from '@/words/dictation';
import { forget, isDone, randomNext, remember, startRound, timesShown } from '@/words/session';
import { COLOR_WORDS, confusables, families, hiddenWords, LOOK_WORDS, oneLetterDiff, segments } from '@/words/tricks';
import { setCloudVoice } from '@/speech/speech';

jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));
jest.mock('@/speech/voiceClips', () => ({ CLIP_VOICES: {}, CLIPS: { f: {}, m: {}, c: {} } }));

function seeded(n: number) {
  let s = n;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('单词数据', () => {
  it('启蒙 15 个单元 + PEP 三～六年级 46 个单元 + 初中 18 个话题单元（V5.2），单词卡 id 唯一', () => {
    expect(WORD_UNITS.filter((u) => u.book === '启蒙')).toHaveLength(15);
    for (const g of [3, 4, 5, 6, 7, 8, 9]) expect(WORD_UNITS.filter((u) => u.grade === g && u.book !== '启蒙').length).toBeGreaterThanOrEqual(4);
    expect(WORD_UNITS.filter((u) => u.grade >= 7)).toHaveLength(18);
    expect(WORD_UNITS.filter((u) => u.grade >= 7).every((u) => u.source === 'original')).toBe(true);
    expect(WORD_UNITS).toHaveLength(79);
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(ALL_CARDS.length);
    expect(ALL_CARDS.length).toBeGreaterThan(900);
  });

  it('APP 英语启蒙课里出现的单词全部都有卡片，一个不少', () => {
    const starter = new Set(WORD_UNITS.filter((u) => u.book === '启蒙').flatMap((u) => u.cards.map((c) => c.w)));
    const used = [
      ...TALK_UNITS.flatMap((u) => u.words.map((w) => w.w)),
      ...PHONICS_GROUPS.flatMap((g) => g.sounds.map((s) => s.ex.w)),
      ...Object.values(PHONICS_WORDS).flatMap((ws) => ws.map((w) => w.w)),
    ];
    expect(used.filter((w) => !starter.has(w))).toEqual([]);
  });

  it('每张卡都有中文意思、美式音标、例句和例句中文；例句里用到了这个词；同一单元不重复', () => {
    for (const c of ALL_CARDS) {
      expect(c.zh && c.ipa && c.ex && c.exZh).toBeTruthy();
      expect(c.ipa).not.toMatch(/[A-Z0-9]/); // 不是 ARPAbet 原始符号
      const ex = c.ex.toLowerCase();
      const ok = ex.includes(c.w.toLowerCase()) || c.w.toLowerCase().split(/[\s-]/).every((p) => ex.includes(p.slice(0, Math.max(3, p.length - 2))));
      expect([c.id, ok]).toEqual([c.id, true]);
    }
    for (const u of WORD_UNITS) expect(new Set(u.cards.map((c) => c.w)).size).toBe(u.cards.length);
  });

  it('同形不同音按单元区分：五年级 read /riːd/，六年级下册过去式 read /rɛd/', () => {
    expect(CARD_BY_ID.get('pep5a-2/read')!.ipa).toBe('riːd');
    expect(CARD_BY_ID.get('pep6b-2/read')!.ipa).toBe('rɛd');
    expect(CARD_BY_ID.get('pep5a-5/live')!.ipa).toBe('lɪv');
  });
});

describe('分段与样子', () => {
  it('分段拼起来就是原词', () => {
    for (const c of ALL_CARDS) expect(segments(c.w).join('')).toBe(c.w);
  });
  it('按音节分段：一段一段记', () => {
    expect(segments('bear')).toEqual(['b', 'ear']);
    expect(segments('grandmother')).toEqual(['grand', 'mo', 'ther']);
    expect(segments('umbrella')).toEqual(['um', 'brel', 'la']);
    expect(segments('purple')).toEqual(['pur', 'ple']);
    expect(segments('vegetable')).toEqual(['ve', 'ge', 'ta', 'ble']);
    expect(segments('classroom')).toEqual(['class', 'room']);
    expect(segments('teddy bear')).toEqual(['ted', 'dy', ' ', 'b', 'ear']);
  });
  it('颜色词有本色；big、small、tall、fast 有特别的样子', () => {
    expect(COLOR_WORDS.red.color).toBe('#E53935');
    expect(COLOR_WORDS.green.color).toBeTruthy();
    expect(COLOR_WORDS.yellow.outline).toBe(true);
    expect([LOOK_WORDS.big, LOOK_WORDS.small, LOOK_WORDS.tall, LOOK_WORDS.fast]).toEqual(['big', 'small', 'tall', 'fast']);
  });
});

describe('记忆窍门（程序计算）', () => {
  it('藏词：bear 里藏着 ear；被更长的藏词包住的不重复列', () => {
    expect(hiddenWords('bear').map((h) => h.word)).toEqual(['ear']);
    expect(hiddenWords('bear')[0].start).toBe(1);
    expect(hiddenWords('grandmother').map((h) => h.word)).toContain('mother');
    expect(hiddenWords('cat')).toEqual([]);
  });
  it('拼读家族：字母组合相同、读音也相同才算一家', () => {
    const tree = ALL_CARDS.find((c) => c.w === 'tree')!;
    const ee = families(tree, 1).find((f) => f.key === 'ee:iː')!;
    expect(ee.members.map((m) => m.w)).not.toContain('tree');
    expect(ee.members.length).toBeGreaterThan(2);
    // bread 的 ea 读 /ɛ/，和 eat 的 /iː/ 不是一家
    const bread = ALL_CARDS.find((c) => c.w === 'bread')!;
    expect(families(bread, 3).map((f) => f.key)).toContain('ea:ɛ');
    const eat = ALL_CARDS.find((c) => c.w === 'eat')!;
    expect(families(eat, 3).find((f) => f.key === 'ea:iː')!.members.map((m) => m.w)).not.toContain('bread');
    // book /ʊ/ 和 moon /uː/ 分开
    const book = ALL_CARDS.find((c) => c.w === 'book')!;
    expect(families(book, 1).map((f) => f.key)).toEqual(['oo:ʊ']);
  });
  it('别搞混：只差一个字母，标出不同的字母', () => {
    expect(confusables('cat').map((c) => c.word)).toEqual(expect.arrayContaining(['hat', 'fat']));
    expect(oneLetterDiff('cat', 'hat')).toEqual({ redIn: 'other', at: 0 });
    expect(oneLetterDiff('hat', 'that')).toEqual({ redIn: 'other', at: 0 });
    expect(oneLetterDiff('that', 'hat')).toEqual({ redIn: 'self', at: 0 });
    expect(oneLetterDiff('cat', 'dog')).toBeNull();
  });
});

describe('刷卡规则', () => {
  it('没记住：隔 3 张再出现，标“第 2 次出现”；记住了：这一轮不再出现；全部记住为完成', () => {
    let r = startRound(['a', 'b', 'c', 'd', 'e']);
    expect(timesShown(r, 'a')).toBe(1);
    r = forget(r); // a 没记住
    expect(r.queue).toEqual(['b', 'c', 'd', 'a', 'e']);
    r = remember(remember(remember(r))); // b c d
    expect(r.queue[0]).toBe('a');
    expect(timesShown(r, 'a')).toBe(2);
    r = remember(remember(r)); // a e
    expect(isDone(r)).toBe(true);
    expect(r.queue).toEqual([]);
  });
  it('剩下不到 3 张时排到最后；随机下一个不会换回同一张', () => {
    let r = startRound(['a', 'b']);
    r = forget(r);
    expect(r.queue).toEqual(['b', 'a']);
    const r2 = randomNext(startRound(['a', 'b', 'c']), () => 0.99);
    expect(r2.queue[0]).not.toBe('a');
    expect(r2.queue).toHaveLength(3);
  });
});

describe('生词本与听写', () => {
  it('收藏、移除；听写拼错自动加入；连续拼对 3 次移出，拼错清零', () => {
    let s = createEmptyProgress();
    s = progressReducer(s, { type: 'wordbook/add', w: 'cat', now: 1 });
    s = progressReducer(s, { type: 'wordbook/add', w: 'cat', now: 2 });
    expect(s.wordbook).toEqual([{ w: 'cat', streak: 0, addedAt: 1 }]);
    s = progressReducer(s, { type: 'wordbook/dictation', w: 'dog', correct: false, now: 3 });
    expect(s.wordbook.map((e) => e.w)).toEqual(['cat', 'dog']);
    s = progressReducer(s, { type: 'wordbook/dictation', w: 'cat', correct: true, now: 4 });
    s = progressReducer(s, { type: 'wordbook/dictation', w: 'cat', correct: true, now: 5 });
    expect(s.wordbook[0].streak).toBe(2);
    s = progressReducer(s, { type: 'wordbook/dictation', w: 'cat', correct: false, now: 6 });
    expect(s.wordbook[0].streak).toBe(0);
    for (let k = 0; k < 3; k++) s = progressReducer(s, { type: 'wordbook/dictation', w: 'cat', correct: true, now: 7 });
    expect(s.wordbook.map((e) => e.w)).toEqual(['dog']);
    // 不在生词本里的词拼对了：不加入
    s = progressReducer(s, { type: 'wordbook/dictation', w: 'pig', correct: true, now: 8 });
    expect(s.wordbook.map((e) => e.w)).toEqual(['dog']);
    s = progressReducer(s, { type: 'wordbook/remove', w: 'dog' });
    expect(s.wordbook).toEqual([]);
  });
  it('旧数据（v5）读入：保留记录，生词本为空', () => {
    const v5 = { ...createEmptyProgress(), version: 5, totalStars: 3 } as Record<string, unknown>;
    delete v5.wordbook;
    const p = parseProgress(JSON.stringify(v5))!;
    expect(p.wordbook).toEqual([]);
    expect(p.totalStars).toBe(3);
  });
  it('听写抽 10 个不重复的词；拼写不分大小写；字母键含全部字母和 3 个干扰字母', () => {
    const cards = UNIT_BY_ID.get('pep3a-4')!.cards;
    const picked = pickDictation(cards, seeded(3));
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((c) => c.w)).size).toBe(10);
    expect(pickDictation(UNIT_BY_ID.get('talk-1')!.cards, seeded(1))).toHaveLength(4);
    expect(isCorrectSpelling(' Elephant ', 'elephant')).toBe(true);
    expect(isCorrectSpelling('teacher’s desk', "teacher's desk")).toBe(true);
    expect(isCorrectSpelling('elefant', 'elephant')).toBe(false);
    const tiles = letterTiles('apple', seeded(2));
    expect(tiles).toHaveLength(8);
    expect(tiles.filter((t) => t === 'p')).toHaveLength(2);
    expect(tiles.filter((t) => !'apple'.includes(t))).toHaveLength(3);
  });
});

async function renderPage(grade = 1) {
  const p = createEmptyProgress();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, settings: { ...p.settings, grade } }));
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 820 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProgressProvider>
        <NavProvider nav={{ push: jest.fn(), back: jest.fn(), home: jest.fn() }}>
          <WordCardsScreen />
        </NavProvider>
      </ProgressProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('wc-screen');
}
const frontWord = () => screen.getByTestId('wc-word').props.children?.props?.accessibilityLabel as string | undefined;

afterEach(async () => {
  setCloudVoice(null);
  await AsyncStorage.clear();
});

describe('单词卡页面', () => {
  it('一年级默认显示启蒙单元；点喇叭用美式英语读；翻转、收藏红心、没记住隔 3 张再出现', async () => {
    await renderPage(1);
    const cloud = jest.fn(async () => 'https://oss.example/w.mp3');
    setCloudVoice(cloud);
    expect(screen.getByTestId('wc-unit-talk-1').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('wc-progress')).toHaveTextContent(/本单元已记住 0\/4/);
    expect(screen.getByTestId('wc-ipa')).toHaveTextContent(/\/bɔɪ\//);
    await fireEvent.press(within(screen.getByTestId('wc-front')).getByTestId('wc-speak'));
    expect(cloud).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'boy', lang: 'en-US' }));
    expect(Speech.speak).not.toHaveBeenCalled();
    // 翻转 → 背面出现中文和“没记住/记住了”
    expect(screen.queryByTestId('wc-forget')).toBeNull();
    await fireEvent.press(screen.getByTestId('wc-flip'));
    expect(within(screen.getByTestId('wc-back')).getByTestId('wc-zh')).toHaveTextContent(/男.*孩/);
    // 收藏
    // 背面朝上时正面对读屏隐藏，用背面的红心
    await fireEvent.press(within(screen.getByTestId('wc-back')).getByTestId('wc-heart'));
    await waitFor(() => expect(within(screen.getByTestId('wc-back')).getByTestId('wc-heart').props.accessibilityState.selected).toBe(true));
    await fireEvent.press(within(screen.getByTestId('wc-back')).getByTestId('wc-heart'));
    await waitFor(() => expect(within(screen.getByTestId('wc-back')).getByTestId('wc-heart').props.accessibilityState.selected).toBe(false));
    // 没记住：自动加入生词本，4 张里剩 3 张，排到最后（第 4 位）
    await fireEvent.press(screen.getByTestId('wc-forget'));
    expect(screen.getByTestId('wc-book')).toHaveTextContent(/（1）/);
    for (let k = 0; k < 3; k++) {
      await fireEvent.press(screen.getByTestId('wc-flip'));
      await fireEvent.press(screen.getByTestId('wc-remember'));
    }
    expect(screen.getByTestId('wc-progress')).toHaveTextContent(/本单元已记住 3\/4/);
    expect(screen.getByTestId('wc-times')).toHaveTextContent(/第 2 次出现/);
    expect(within(screen.getByTestId('wc-front')).getByTestId('wc-heart').props.accessibilityState.selected).toBe(true);
    // 记住最后一张 → 庆祝，可选再刷一遍 / 听写本单元
    await fireEvent.press(screen.getByTestId('wc-flip'));
    await fireEvent.press(screen.getByTestId('wc-remember'));
    expect(await screen.findByTestId('celebrate')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('celebrate-again'));
    expect(screen.getByTestId('wc-progress')).toHaveTextContent(/本单元已记住 0\/4/);
  });

  it('生词本弹窗：显示收藏的词、3 个小圆点、移除', async () => {
    await renderPage(1);
    await fireEvent.press(within(screen.getByTestId('wc-front')).getByTestId('wc-heart'));
    await fireEvent.press(screen.getByTestId('wc-book'));
    expect(await screen.findByTestId('wb-item-boy')).toHaveTextContent(/男孩/);
    expect(screen.getByTestId('wb-dots-boy').props.accessibilityLabel).toBe('连续拼对 0 次');
    await fireEvent.press(screen.getByTestId('wb-remove-boy'));
    await waitFor(() => expect(screen.queryByTestId('wb-item-boy')).toBeNull());
  });

  it('按单元筛选；三年级切到“颜色”单元，串起来看是色卡，点单词跳到那张卡', async () => {
    await renderPage(3);
    expect(screen.getByTestId('wc-unit-pep3a-1').props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByTestId('wc-unit-pep3a-2'));
    expect(screen.getByTestId('wc-progress')).toHaveTextContent(/0\/8/);
    await fireEvent.press(screen.getByTestId('wc-map'));
    expect(await screen.findByTestId('map-colors')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('map-word-brown'));
    await waitFor(() => expect(screen.getByTestId('wc-ipa')).toHaveTextContent(/\/braʊn\//));
    // 切到“家人”单元：家谱树
    await fireEvent.press(screen.getByTestId('wc-unit-pep3b-2'));
    await fireEvent.press(screen.getByTestId('wc-map'));
    expect(await screen.findByTestId('map-family')).toBeTruthy();
  });

  it('背面的记忆窍门：bear 显示藏词 ear；点窍门里的词跳到那张卡', async () => {
    await renderPage(3);
    await fireEvent.press(screen.getByTestId('wc-unit-pep3a-4'));
    // 跳到 bear
    await fireEvent.press(screen.getByTestId('wc-map'));
    await fireEvent.press(await screen.findByTestId('map-word-bear'));
    await fireEvent.press(screen.getByTestId('wc-flip'));
    const back = screen.getByTestId('wc-back');
    expect(within(back).getByTestId('trick-hidden')).toHaveTextContent(/藏着/);
    await fireEvent.press(within(within(back).getByTestId('trick-hidden')).getByTestId('trick-word-ear'));
    await waitFor(() => expect(screen.getByTestId('wc-ipa')).toHaveTextContent(/\/ɪr\//));
  });

  it('听写：字母按键拼对、输入框拼错（显示正确拼写，自动进生词本）', async () => {
    await renderPage(1);
    const cloud = jest.fn(async () => 'https://oss.example/w.mp3');
    setCloudVoice(cloud);
    await fireEvent.press(screen.getByTestId('wc-dictation'));
    const modal = await screen.findByTestId('dict-modal');
    expect(within(modal).getByTestId('dict-progress')).toHaveTextContent(/第 1 \/ 4 题/);
    const zhText = String(within(modal).getByTestId('dict-zh').props.children);
    const answerOf = (z: string) => UNIT_BY_ID.get('talk-1')!.cards.find((c) => c.zh === z)!.w;
    const word = answerOf(zhText);
    expect(cloud).toHaveBeenLastCalledWith(expect.objectContaining({ text: word, lang: 'en-US' }));
    // 按字母键拼出正确答案
    const tiles = within(modal).getAllByTestId(/^dict-tile-/);
    const used = new Set<number>();
    for (const ch of word) {
      const k = tiles.findIndex((t, idx) => !used.has(idx) && t.props.accessibilityLabel === ch);
      used.add(k);
      await fireEvent.press(tiles[k]);
    }
    await fireEvent.press(within(modal).getByTestId('dict-submit'));
    expect(within(modal).getByTestId('dict-result')).toHaveTextContent(/拼对了/);
    await fireEvent.press(within(modal).getByTestId('dict-next'));
    // 第 2 题：换成输入框，故意拼错
    await fireEvent.press(within(modal).getByTestId('dict-mode-input'));
    const word2 = answerOf(String(within(modal).getByTestId('dict-zh').props.children));
    await fireEvent.changeText(within(modal).getByTestId('dict-input'), word2 + 'x');
    await fireEvent.press(within(modal).getByTestId('dict-submit'));
    expect(within(modal).getByTestId('dict-result')).toHaveTextContent(/正确拼写/);
    expect(within(modal).getByTestId('dict-correct')).toBeTruthy();
    await fireEvent.press(within(modal).getByTestId('dict-close'));
    await waitFor(() => expect(screen.getByTestId('wc-book')).toHaveTextContent(/（1）/));
    expect(frontWord()).toBeDefined();
  });

  it('生词本一键听写：3 次拼对后自动移出', async () => {
    await renderPage(1);
    await fireEvent.press(within(screen.getByTestId('wc-front')).getByTestId('wc-heart'));
    for (let round = 0; round < 3; round++) {
      await fireEvent.press(screen.getByTestId('wc-book'));
      await fireEvent.press(await screen.findByTestId('wb-dictate'));
      const modal = await screen.findByTestId('dict-modal');
      await fireEvent.press(within(modal).getByTestId('dict-mode-input'));
      await fireEvent.changeText(within(modal).getByTestId('dict-input'), 'boy');
      await fireEvent.press(within(modal).getByTestId('dict-submit'));
      await fireEvent.press(within(modal).getByTestId('dict-next'));
      await fireEvent.press(within(modal).getByTestId('dict-done'));
      await act(async () => undefined);
    }
    await waitFor(() => expect(screen.getByTestId('wc-book')).not.toHaveTextContent(/（/));
  });
});
