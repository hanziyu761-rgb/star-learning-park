import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react';
import { App } from '../src/App';
import { appendEvent, eventsForLearner, getSettings, resetDbConnection, saveLearner, saveSettings, setActiveLearnerId, worksForLearner } from '../src/store/db';
import { compress, expand, run, shortestSolution, type Block } from '../src/learning/blocks';
import { labAccuracy, labPredict, PRESETS } from '../src/learning/trainlab';
import { ANIMALS, evaluate, type TreeNode } from '../src/learning/tree';
import { findLesson } from '../src/curriculum/catalog';
import type { BlocksActivity } from '../src/curriculum/types';
import type { LearningEvent } from '../src/store/types';

const click = (el: HTMLElement) => fireEvent.click(el);

describe('loop blocks', () => {
  const levels = (findLesson('g4-l7')!.steps.find((s) => s.kind === 'blocks') as BlocksActivity).levels;

  it('a repeat block repeats the next block', () => {
    const ex = expand(['repeat3', 'forward', 'left']);
    expect('moves' in ex && ex.moves.map((m) => m.move)).toEqual(['forward', 'forward', 'forward', 'left']);
  });

  it('a repeat with nothing after it is an error at that block', () => {
    expect(run(levels[0], ['forward', 'repeat2'])).toMatchObject({ ok: false, reason: 'bad-repeat', failedAt: 1 });
    expect(run(levels[0], ['repeat2', 'repeat3', 'forward'])).toMatchObject({ ok: false, reason: 'bad-repeat', failedAt: 0 });
  });

  it('a wall hit inside a loop points at the repeated block', () => {
    const r = run(levels[1], ['right', 'repeat2', 'forward']);
    expect(r).toMatchObject({ ok: false, reason: 'wall', failedAt: 2 });
  });

  it('every loop level needs loops (plain moves exceed the limit) and is solvable with them', () => {
    for (const lv of levels) {
      const sol = shortestSolution(lv)!;
      expect(sol.length).toBeGreaterThan(lv.maxBlocks);
      const short = compress(sol);
      expect(short.length).toBeLessThanOrEqual(lv.maxBlocks);
      expect(run(lv, short).ok).toBe(true);
    }
  });
});

describe('training lab (simulation)', () => {
  it('exam: testing on training data is always 100%, new data is not', () => {
    const p = PRESETS.exam;
    expect(labAccuracy(labPredict(p.train, p.train, p.weights))).toBe(1);
    const b = labPredict(p.train, p.test, p.weights);
    expect(labAccuracy(b)).toBe(0.75);
    expect(b.find((x) => x.sample.name === '黄苹果')).toMatchObject({ predicted: '香蕉', correct: false });
  });

  it('exam: test items never appear in the training data', () => {
    const p = PRESETS.exam;
    const key = (s: { features: Record<string, string> }) => JSON.stringify(s.features);
    const train = new Set(p.train.map(key));
    for (const t of p.test) expect(train.has(key(t))).toBe(false);
  });

  it('bias: a colour-biased training set fails, adding the missing colours fixes it, more red apples do not', () => {
    const p = PRESETS.bias;
    expect(labAccuracy(labPredict(p.train, p.test, p.weights))).toBe(0.5);
    const redOnly = [...p.train, p.pool.find((x) => x.id === 'p3')!];
    expect(labAccuracy(labPredict(redOnly, p.test, p.weights))).toBe(0.5);
    const fixed = [...p.train, ...p.pool.filter((x) => x.id !== 'p3')];
    expect(labAccuracy(labPredict(fixed, p.test, p.weights))).toBe(1);
  });
});

describe('decision tree (real algorithm)', () => {
  const good: TreeNode = { q: 'feathers', yes: { leaf: '鸟类' }, no: { q: 'gills', yes: { leaf: '鱼类' }, no: { leaf: '哺乳动物' } } };
  const flies: TreeNode = { q: 'flies', yes: { leaf: '鸟类' }, no: { q: 'fourLegs', yes: { leaf: '哺乳动物' }, no: { leaf: '鱼类' } } };

  it('feathers then gills classifies all 11 animals', () => {
    expect(evaluate(good)).toMatchObject({ correct: 11, total: 11 });
  });

  it('"会飞吗" first gets bats, penguins, whales and dolphins wrong', () => {
    const r = evaluate(flies);
    expect(r.correct).toBe(7);
    expect(r.rows.filter((x) => !x.correct).map((x) => x.animal.name).sort()).toEqual(['企鹅', '海豚', '蝙蝠', '鲸鱼'].sort());
  });

  it('animal facts are consistent (only birds have feathers, only fish have gills)', () => {
    for (const a of ANIMALS) {
      expect(a.answers.feathers).toBe(a.truth === '鸟类');
      expect(a.answers.gills).toBe(a.truth === '鱼类');
    }
  });
});

describe('grade 4 in the app', () => {
  beforeEach(async () => {
    cleanup();
    await resetDbConnection();
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
    window.location.hash = '';
    await saveSettings({ ...(await getSettings()), pinyin: false, readAloud: false });
    await saveLearner({ id: 'L', nickname: '机器人迷', avatar: '🐼', grade: 4, createdAt: '2026-11-01T00:00:00Z' });
    await setActiveLearnerId('L');
  });

  async function seedStepsBefore(lessonId: string, stepId: string) {
    let i = 0;
    for (const s of findLesson(lessonId)!.steps) {
      if (s.id === stepId) break;
      await appendEvent({ id: 'seed' + i++, learnerId: 'L', at: new Date().toISOString(), lessonId, activeMs: 0, mode: 'local', type: 'step_done', stepId: s.id, kind: s.kind } as LearningEvent);
    }
  }

  it('home offers grade-4 lessons', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: /今天学：机器学习/ })).toBeTruthy();
  });

  it('exam mode: both exams run, choosing B is recorded as correct and simulated', async () => {
    await seedStepsBefore('g4-l2', 'a1');
    window.location.hash = '#/play/g4-l2';
    render(<App />);
    await screen.findByText(/不是真正的 AI 模型/);
    click(screen.getByRole('button', { name: /考试 A/ }));
    click(screen.getByRole('button', { name: /考试 B/ }));
    expect(await screen.findByText(/5\/5/)).toBeTruthy();
    expect(screen.getByText(/3\/4/)).toBeTruthy();
    click(screen.getByRole('button', { name: /考试 B，用的是没见过的水果/ }));
    await screen.findByText(/对！/);
    const exp = (await eventsForLearner('L')).find((e) => e.type === 'experiment');
    expect(exp).toMatchObject({ kind: 'simulate', mistakes: 0, mode: 'simulated' });
  });

  it('bias mode: adding only a red apple does not help; adding green and yellow apples reaches 100%', async () => {
    await seedStepsBefore('g4-l4', 'a1');
    window.location.hash = '#/play/g4-l4';
    render(<App />);
    expect(await screen.findByText(/2\/4/)).toBeTruthy();
    click(screen.getByRole('button', { name: /又一个红苹果/ }));
    click(screen.getByRole('button', { name: /重新训练并测试/ }));
    expect(await screen.findByText(/第 1 次重新训练后的测试/)).toBeTruthy();
    expect(screen.getByText(/2\/4/)).toBeTruthy();
    click(screen.getByRole('button', { name: /^🍏青苹果/ }));
    click(screen.getByRole('button', { name: /^🍎黄苹果/ }));
    click(screen.getByRole('button', { name: /重新训练并测试/ }));
    expect(await screen.findByText(/4\/4/)).toBeTruthy();
    const exp = (await eventsForLearner('L')).find((e) => e.type === 'experiment');
    expect(exp).toMatchObject({ kind: 'simulate', mistakes: 1 });
  });

  it('loop maze level 1 cannot be finished without a loop, and works with one', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await seedStepsBefore('g4-l7', 'a1');
      window.location.hash = '#/play/g4-l7';
      render(<App />);
      await screen.findByText(/第 1\/3 关/);
      const btn = (re: RegExp) => screen.getByRole('button', { name: re });
      for (let i = 0; i < 4; i++) click(btn(/前进一格/));
      expect((btn(/前进一格/) as HTMLButtonElement).disabled).toBe(true); // limit reached at 4 blocks
      click(btn(/清空/));
      const prog: Block[] = ['repeat3', 'forward', 'forward', 'forward'];
      const label: Record<string, RegExp> = { repeat3: /重复 3 次/, forward: /前进一格/ };
      for (const b of prog) click(btn(label[b]));
      click(btn(/运行程序/));
      await act(async () => { await vi.advanceTimersByTimeAsync(400 * 8); });
      expect(await screen.findByText(/成功了！/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('tree game: a weak tree, then an improved one, saved with the improvement and a program-computed result', async () => {
    await seedStepsBefore('g4-l8', 'p1');
    window.location.hash = '#/play/g4-l8';
    render(<App />);
    await screen.findByText(/真正的分类算法/);
    click(within(screen.getByRole('group', { name: /第一个问题/ })).getByRole('button', { name: '会飞吗？' }));
    const yes = screen.getByRole('group', { name: /回答是$/ });
    click(within(yes).getByRole('button', { name: '鸟类' }));
    const no = screen.getByRole('group', { name: /回答不是$/ });
    click(within(no).getByRole('button', { name: '再问一个问题' }));
    click(within(no).getByRole('button', { name: '有四条腿吗？' }));
    click(within(screen.getByRole('group', { name: /回答不是·是$/ })).getByRole('button', { name: '哺乳动物' }));
    click(within(screen.getByRole('group', { name: /回答不是·不是$/ })).getByRole('button', { name: '鱼类' }));
    click(screen.getByRole('button', { name: /用动物卡片测试/ }));
    expect(await screen.findByText(/7\/11/)).toBeTruthy();

    // Improve: start with feathers, then gills.
    click(within(screen.getByRole('group', { name: /第一个问题/ })).getByRole('button', { name: '有羽毛吗？' }));
    click(within(screen.getByRole('group', { name: /回答不是$/ })).getByRole('button', { name: '用鳃呼吸吗？' }));
    click(within(screen.getByRole('group', { name: /回答不是·是$/ })).getByRole('button', { name: '鱼类' }));
    click(within(screen.getByRole('group', { name: /回答不是·不是$/ })).getByRole('button', { name: '哺乳动物' }));
    click(screen.getByRole('button', { name: /用新规则再测一次/ }));
    expect(await screen.findByText(/11\/11/)).toBeTruthy();
    click(screen.getByRole('button', { name: /保存我的分类游戏/ }));
    await screen.findByText(/已保存到我的作品/);
    const [work] = await worksForLearner('L');
    expect(work.result).toBe('11 张动物卡片答对 11 张');
    expect(work.parts.find((p) => p.field === 'improvement')!.value).toMatch(/从 7 个增加到 11 个/);
    expect(work.parts.every((p) => p.by === 'child')).toBe(true);
    const exp = (await eventsForLearner('L')).filter((e) => e.type === 'experiment');
    expect(exp).toHaveLength(1);
    expect(exp[0]).toMatchObject({ kind: 'classifier', total: 11, mistakes: 4 });
  });
});
