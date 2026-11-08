import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { App } from '../src/App';
import { resetDbConnection, saveSettings, getSettings, eventsForLearner, listLearners } from '../src/store/db';
import { findLesson } from '../src/curriculum/catalog';
import type { SortActivity, QuizActivity, ThinkActivity } from '../src/curriculum/types';
import { LEGACY_KEY } from '../src/store/legacy';

// Walks a child through a whole lesson in the real UI, then reopens the app and
// checks the record is still there (V1 acceptance step 2).

beforeEach(async () => {
  cleanup();
  await resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
  window.location.hash = '';
  // Pinyin splits characters into <ruby>; turn it off so text queries stay simple.
  await saveSettings({ ...(await getSettings()), pinyin: false });
  await resetDbConnection();
});

const click = (el: HTMLElement) => fireEvent.click(el);
const next = async () => click(await screen.findByRole('button', { name: /下一步|下一题|完成练习/ }));

describe('child learning flow', () => {
  it('setup → lesson 1 → complete → reopen keeps progress', async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ grade: 1 }));
    const legacyBefore = localStorage.getItem(LEGACY_KEY);
    render(<App />);

    // First run: setup
    click(await screen.findByRole('button', { name: '小星星' }));
    click(screen.getByRole('button', { name: /开始学习/ }));

    // Home: today's task
    click(await screen.findByRole('button', { name: /今天学：AI 是什么？/ }));

    const lesson = findLesson('g1-l1')!;
    for (const step of lesson.steps) {
      if (step.kind === 'explain') {
        await screen.findByRole('heading', { name: step.title });
        await next();
      } else if (step.kind === 'sort') {
        const s = step as SortActivity;
        await screen.findByRole('heading', { name: s.title });
        for (const item of s.items) {
          click(screen.getByRole('button', { name: new RegExp(item.label) }));
          click(screen.getByRole('button', { name: `放进「${s.bins[item.bin].label}」` }));
        }
        await screen.findByText(/全部一次分对/);
        await next();
      } else if (step.kind === 'think') {
        const t = step as ThinkActivity;
        click(await screen.findByRole('button', { name: t.choices[1].label }));
        await next();
      } else if (step.kind === 'quiz') {
        for (const q of (step as QuizActivity).questions) {
          await screen.findByRole('heading', { name: q.prompt });
          const right = q.options.find((o) => o.id === q.answer)!;
          click(screen.getByRole('button', { name: new RegExp(right.label) }));
          await next();
        }
      } else if (step.kind === 'task') {
        click(await screen.findByRole('button', { name: /我和家长完成了/ }));
      }
    }
    await screen.findByText(/太棒了！你学完了「AI 是什么？」/);

    // Stored record
    const [learner] = await listLearners();
    const events = await eventsForLearner(learner.id);
    expect(events.some((e) => e.type === 'lesson_complete' && e.lessonId === 'g1-l1')).toBe(true);
    const firstTry = events.filter((e) => e.type === 'answer' && e.attemptNo === 1 && e.correct);
    expect(firstTry).toHaveLength(4);
    expect(events.find((e) => e.type === 'experiment')).toMatchObject({ mistakes: 0, total: 6 });
    expect(events.every((e) => e.mode === 'local')).toBe(true);
    expect(localStorage.getItem(LEGACY_KEY)).toBe(legacyBefore);

    // Reopen the app (new mount, new DB connection)
    cleanup();
    await resetDbConnection();
    window.location.hash = '#/lesson/g1-l1';
    render(<App />);
    expect(await screen.findByRole('button', { name: /再学一遍/ })).toBeTruthy();
    window.location.hash = '#/growth';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    const stats = await screen.findByText('完成的课');
    expect(within(stats.parentElement!).getByText(/⭐ 1/)).toBeTruthy();
  });

  it('a wrong answer is recorded as wrong even after the child corrects it', async () => {
    render(<App />);
    click(await screen.findByRole('button', { name: '火箭队长' }));
    click(screen.getByRole('button', { name: /开始学习/ }));
    await screen.findByRole('button', { name: /今天学/ });
    window.location.hash = '#/play/g1-l2';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    const lesson = findLesson('g1-l2')!;
    // Skip to the quiz by finishing earlier steps quickly
    for (const step of lesson.steps) {
      if (step.kind === 'quiz') break;
      if (step.kind === 'explain') { await screen.findByRole('heading', { name: step.title }); await next(); }
      if (step.kind === 'sort') {
        for (const item of step.items) {
          click(await screen.findByRole('button', { name: new RegExp(item.label) }));
          click(screen.getByRole('button', { name: `放进「${step.bins[item.bin].label}」` }));
        }
        await next();
      }
      if (step.kind === 'think') { click(await screen.findByRole('button', { name: step.choices[0].label })); await next(); }
    }
    const quiz = lesson.steps.find((s) => s.kind === 'quiz') as QuizActivity;
    const q = quiz.questions[0];
    const wrongOpt = q.options.find((o) => o.id !== q.answer)!;
    click(await screen.findByRole('button', { name: new RegExp(wrongOpt.label) }));
    await screen.findByText(/再想想/);
    click(screen.getByRole('button', { name: new RegExp(q.options.find((o) => o.id === q.answer)!.label) }));
    await screen.findByText(/答对啦/);
    const [learner] = await listLearners();
    const answers = (await eventsForLearner(learner.id)).filter((e) => e.type === 'answer');
    expect(answers.map((a) => a.type === 'answer' && [a.attemptNo, a.correct])).toEqual([[1, false], [2, true]]);
  });

  it('parent center needs the parent check first', async () => {
    render(<App />);
    click(await screen.findByRole('button', { name: '彩虹豆' }));
    click(screen.getByRole('button', { name: /开始学习/ }));
    await screen.findByRole('button', { name: /今天学/ });
    window.location.hash = '#/parent';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await screen.findByRole('heading', { name: '家长确认' });
    expect(screen.queryByText('安全设置')).toBeNull();
    const q = screen.getByText(/× .* = \?/).textContent!;
    const [a, b] = q.match(/\d+/g)!.map(Number);
    fireEvent.change(screen.getByLabelText('答案'), { target: { value: '1' } });
    click(screen.getByRole('button', { name: '进入家长中心' }));
    await screen.findByText(/答案不对/);
    fireEvent.change(screen.getByLabelText('答案'), { target: { value: String(a * b) } });
    click(screen.getByRole('button', { name: '进入家长中心' }));
    expect(await screen.findByText('安全设置')).toBeTruthy();
    expect(screen.getByText(/以下功能默认关闭/)).toBeTruthy();
  });

  it('a nickname with private information is refused', async () => {
    render(<App />);
    const input = await screen.findByLabelText('昵称');
    fireEvent.change(input, { target: { value: '我叫王小明' } });
    click(screen.getByRole('button', { name: /开始学习/ }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringMatching(/个人信息/));
    expect(await listLearners()).toHaveLength(0);
  });
});
