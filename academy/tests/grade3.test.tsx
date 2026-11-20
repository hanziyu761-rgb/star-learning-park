import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { App } from '../src/App';
import { eventsForLearner, getSettings, resetDbConnection, saveLearner, saveSettings, setActiveLearnerId, worksForLearner, appendEvent } from '../src/store/db';
import { run, shortestSolution, type Block } from '../src/learning/blocks';
import { promptChecks, promptText } from '../src/activities/PromptCard';
import { findLesson } from '../src/curriculum/catalog';
import type { BlocksActivity } from '../src/curriculum/types';
import type { LearningEvent } from '../src/store/types';

const click = (el: HTMLElement) => fireEvent.click(el);

describe('block interpreter', () => {
  const maze = (findLesson('g3-l9')!.steps.find((s) => s.kind === 'blocks') as BlocksActivity).levels;

  it('turns do not move, forward moves one cell', () => {
    const r = run(maze[0], ['left', 'right', 'forward']);
    expect(r.trace.map((p) => [p.x, p.y, p.dir])).toEqual([[0, 1, 1], [0, 1, 0], [0, 1, 1], [1, 1, 1]]);
  });

  it('reports a wall hit at the exact block', () => {
    const r = run(maze[1], ['right', 'forward']); // (0,3) facing right → (1,3) ok
    expect(r.ok).toBe(false);
    const hit = run(maze[1], ['forward', 'right', 'forward']); // (0,2) facing right → wall at (1,2)
    expect(hit).toMatchObject({ ok: false, reason: 'wall', failedAt: 2 });
  });

  it('reports leaving the map and stopping short', () => {
    expect(run(maze[0], ['left', 'forward', 'forward'])).toMatchObject({ ok: false, reason: 'edge', failedAt: 2 });
    expect(run(maze[0], ['forward'])).toMatchObject({ ok: false, reason: 'not-at-goal' });
    expect(run(maze[0], [])).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('every level is solvable within its block limit, and the found solution really works', () => {
    for (const lv of maze) {
      const sol = shortestSolution(lv)!;
      expect(sol.length).toBeLessThanOrEqual(lv.maxBlocks);
      expect(run(lv, sol).ok).toBe(true);
    }
  });
});

describe('prompt card', () => {
  it('builds the prompt text and checks all parts', () => {
    const p = { role: '童话作家', audience: '三年级小朋友', topic: '勇敢的小蚂蚁', reqs: ['不超过 300 字', '故事里有一个道理'] };
    expect(promptText(p)).toMatch(/请你扮演童话作家，给三年级小朋友讲一个关于"勇敢的小蚂蚁"的故事/);
    expect(promptChecks(p).every((c) => c.ok)).toBe(true);
    expect(promptChecks({ ...p, reqs: ['不超过 300 字'] }).find((c) => c.id === 'reqs')!.ok).toBe(false);
    expect(promptChecks({ ...p, topic: '我叫王小明' }).find((c) => c.id === 'privacy')!.ok).toBe(false);
  });
});

describe('grade 3 in the app', () => {
  beforeEach(async () => {
    cleanup();
    await resetDbConnection();
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
    window.location.hash = '';
    await saveSettings({ ...(await getSettings()), pinyin: false, readAloud: false });
    await saveLearner({ id: 'L', nickname: '闪电兔', avatar: '🐯', grade: 3, createdAt: '2026-11-01T00:00:00Z' });
    await setActiveLearnerId('L');
  });

  async function seedStepsBefore(lessonId: string, stepId: string) {
    const lesson = findLesson(lessonId)!;
    let i = 0;
    for (const s of lesson.steps) {
      if (s.id === stepId) break;
      await appendEvent({ id: 'seed' + i++, learnerId: 'L', at: new Date().toISOString(), lessonId, activeMs: 0, mode: 'local', type: 'step_done', stepId: s.id, kind: s.kind } as LearningEvent);
    }
  }

  it('a grade-3 child is offered grade-3 lessons on the home page', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: /今天学：如何提出好问题？/ })).toBeTruthy();
  });

  it('block maze: a failed run is counted, then all three levels are solved', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await seedStepsBefore('g3-l9', 'a1');
      window.location.hash = '#/play/g3-l9';
      render(<App />);
      const step = findLesson('g3-l9')!.steps.find((s) => s.kind === 'blocks') as BlocksActivity;
      const label: Record<Block, RegExp> = { forward: /前进一格/, left: /向左转/, right: /向右转/, repeat2: /重复 2 次/, repeat3: /重复 3 次/ };
      const runProgram = async (prog: Block[]) => {
        for (const b of prog) click(screen.getByRole('button', { name: label[b] }));
        click(screen.getByRole('button', { name: /运行程序/ }));
        await act(async () => { await vi.advanceTimersByTimeAsync(400 * (prog.length + 2)); });
      };
      await screen.findByText(/第 1\/3 关/);
      // A wrong first try on level 1: only two steps forward.
      await runProgram(['forward', 'forward']);
      expect(screen.getByText(/还没到星星那里/)).toBeTruthy();
      click(screen.getByRole('button', { name: /清空/ }));
      for (let i = 0; i < step.levels.length; i++) {
        await runProgram(shortestSolution(step.levels[i])!);
        if (i < step.levels.length - 1) click(await screen.findByRole('button', { name: /下一关/ }));
      }
      expect(await screen.findByText(/全部过关/)).toBeTruthy();
      const exp = (await eventsForLearner('L')).find((e) => e.type === 'experiment');
      expect(exp).toMatchObject({ kind: 'blocks', total: 3, mistakes: 1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('prompt card is saved with child parts and a template safety rule, and nothing is sent anywhere', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await seedStepsBefore('g3-l3', 'p1');
    window.location.hash = '#/play/g3-l3';
    render(<App />);
    await screen.findByText(/不会发送给任何 AI/);
    const save = screen.getByRole('button', { name: /保存提示词卡片/ });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    click(screen.getByRole('button', { name: '童话作家' }));
    click(screen.getByRole('button', { name: '三年级小朋友' }));
    fireEvent.change(screen.getByLabelText('故事主题'), { target: { value: '勇敢的小蚂蚁' } });
    click(screen.getByRole('button', { name: '不超过 300 字' }));
    click(screen.getByRole('button', { name: '故事里有一个道理' }));
    expect((save as HTMLButtonElement).disabled).toBe(false);
    click(save);
    await screen.findByText(/提示词卡片已保存/);
    const [work] = await worksForLearner('L');
    expect(work.type).toBe('prompt-card');
    expect(work.parts.find((p) => p.field === 'safety')!.by).toBe('template');
    expect(work.parts.filter((p) => p.by === 'child')).toHaveLength(4);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
