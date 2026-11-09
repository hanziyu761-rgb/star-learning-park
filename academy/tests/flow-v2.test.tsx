import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from '../src/App';
import { appendEvent, eventsForLearner, getSettings, listLearners, resetDbConnection, saveLearner, saveSettings, setActiveLearnerId, worksForLearner } from '../src/store/db';
import { findLesson } from '../src/curriculum/catalog';
import { TRAINING_SET } from '../src/learning/simulator';
import type { LearningEvent } from '../src/store/types';

const click = (el: HTMLElement) => fireEvent.click(el);
const goto = (hash: string) => { window.location.hash = hash; window.dispatchEvent(new HashChangeEvent('hashchange')); };

async function freshLearner(grade: 1 | 2 = 2) {
  await saveLearner({ id: 'L', nickname: '火箭队长', avatar: '🦊', grade, createdAt: '2026-11-01T00:00:00Z' });
  await setActiveLearnerId('L');
}

beforeEach(async () => {
  cleanup();
  await resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
  window.location.hash = '';
  await saveSettings({ ...(await getSettings()), pinyin: false });
});

describe('V2 flows', () => {
  it('a grade-2 child is offered grade-2 lessons on the home page', async () => {
    await freshLearner(2);
    render(<App />);
    expect(await screen.findByRole('button', { name: /今天学：数据是什么？/ })).toBeTruthy();
  });

  it('fruit trainer: wrong label → lower accuracy → fix → 100%, saved with honest contribution', async () => {
    await freshLearner(2);
    window.location.hash = '#/play/g2-l7';
    render(<App />);
    const lesson = findLesson('g2-l7')!;
    // Move through the steps before the project.
    for (const step of lesson.steps) {
      if (step.kind === 'project') break;
      if (step.kind === 'explain') { await screen.findByRole('heading', { name: step.title }); click(screen.getByRole('button', { name: /下一步/ })); }
      if (step.kind === 'sort') {
        for (const item of step.items) {
          click(await screen.findByRole('button', { name: new RegExp(item.label) }));
          click(screen.getByRole('button', { name: `放进「${step.bins[item.bin].label}」` }));
        }
        click(await screen.findByRole('button', { name: /下一步/ }));
      }
      if (step.kind === 'quiz') {
        for (const q of step.questions) {
          await screen.findByRole('heading', { name: q.prompt });
          click(screen.getByRole('button', { name: new RegExp(q.options.find((o) => o.id === q.answer)!.label) }));
          click(await screen.findByRole('button', { name: /下一题|完成练习/ }));
        }
      }
      if (step.kind === 'think') { click(await screen.findByRole('button', { name: step.choices[0].label })); click(await screen.findByRole('button', { name: /下一步/ })); }
    }

    await screen.findByText(/不是真正的 AI 模型/);
    // Label everything, but 青苹果 as 香蕉 on purpose.
    for (const t of TRAINING_SET) {
      const group = screen.getByRole('group', { name: `${t.name}的标签` });
      const label = t.id === 't2' ? '香蕉' : t.truth;
      click([...group.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLElement);
    }
    click(screen.getByRole('button', { name: /开始训练/ }));
    expect(await screen.findByText(/3\/4/)).toBeTruthy();
    expect(screen.getByText(/模拟 AI 认错了/)).toBeTruthy();

    // Fix the label and retrain.
    const group = screen.getByRole('group', { name: '青苹果的标签' });
    click([...group.querySelectorAll('button')].find((b) => b.textContent === '苹果') as HTMLElement);
    click(screen.getByRole('button', { name: /重新训练/ }));
    expect(await screen.findByText(/4\/4/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('我发现'), { target: { value: '标签贴错了，AI 也会学错' } });
    click(screen.getByRole('button', { name: /保存到我的作品/ }));
    await screen.findByText(/作品已保存/);

    const [work] = await worksForLearner('L');
    expect(work.type).toBe('fruit-ai');
    expect(work.parts.find((p) => p.field === 'result')!.by).toBe('ai');
    expect(work.parts.find((p) => p.field === 'improvement')).toMatchObject({ by: 'child' });
    expect(work.parts.find((p) => p.field === 'improvement')!.value).toMatch(/75% 提高到 100%/);
    const events = await eventsForLearner('L');
    const sim = events.filter((e) => e.type === 'experiment' && e.kind === 'simulate');
    expect(sim).toHaveLength(1); // only the first training run counts as evidence
    expect(sim[0]).toMatchObject({ mistakes: 1, mode: 'simulated' });
  });

  it('due knowledge points show on home and a review updates the schedule', async () => {
    await freshLearner(2);
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const wrong = { id: 'old', learnerId: 'L', at: yesterday, lessonId: 'g2-l1', activeMs: 0, mode: 'local', type: 'answer', stepId: 'q1', questionId: 'q21-1', knowledgePoints: ['g2-kp-data'], choice: 'b', correct: false, attemptNo: 1 } as LearningEvent;
    await appendEvent(wrong);
    render(<App />);
    click(await screen.findByRole('button', { name: /今日复习：1 个知识点/ }));
    await screen.findByText(/今日复习 1\/1 · 数据是记录下来的信息/);
    const heading = await screen.findByRole('heading', { level: 1 });
    const q = findLesson('g2-l1')!.review!.find((x) => x.prompt === heading.textContent)!;
    click(screen.getByRole('button', { name: new RegExp(q.options.find((o) => o.id === q.answer)!.label) }));
    click(await screen.findByRole('button', { name: /完成复习/ }));
    await screen.findByText(/复习完成！一次答对 1\/1 题/);
    const events = await eventsForLearner('L');
    expect(events.filter((e) => e.type === 'answer' && e.stepId === 'review')).toHaveLength(1);
    goto('#/');
    await screen.findByRole('button', { name: /今天学/ });
    expect(screen.queryByRole('button', { name: /今日复习/ })).toBeNull();
  });

  it('a weak prerequisite offers a warm-up before the lesson', async () => {
    await freshLearner(2);
    await appendEvent({ id: 'w', learnerId: 'L', at: new Date().toISOString(), lessonId: 'g1-l5', activeMs: 0, mode: 'local', type: 'answer', stepId: 'q1', questionId: 'q5-2', knowledgePoints: ['g1-kp-labels'], choice: 'b', correct: false, attemptNo: 1 } as LearningEvent);
    window.location.hash = '#/lesson/g2-l3';
    render(<App />);
    const warm = await screen.findByRole('button', { name: /先热身复习 1 个知识点/ });
    click(warm);
    expect(await screen.findByText(/热身复习 1\/1 · AI 从带名字的图片里学习/)).toBeTruthy();
  });

  it('parent knowledge map lists knowledge points with their status', async () => {
    await freshLearner(2);
    await appendEvent({ id: 'w', learnerId: 'L', at: new Date().toISOString(), lessonId: 'g2-l1', activeMs: 0, mode: 'local', type: 'answer', stepId: 'q1', questionId: 'q21-1', knowledgePoints: ['g2-kp-data'], choice: 'b', correct: false, attemptNo: 1 } as LearningEvent);
    window.location.hash = '#/parent';
    render(<App />);
    const q = (await screen.findByText(/× .* = \?/)).textContent!;
    const [a, b] = q.match(/\d+/g)!.map(Number);
    fireEvent.change(screen.getByLabelText('答案'), { target: { value: String(a * b) } });
    click(screen.getByRole('button', { name: '进入家长中心' }));
    expect(await screen.findByText('知识点图谱')).toBeTruthy();
    expect(screen.getByText(/现在有 1 个知识点需要巩固/)).toBeTruthy();
    expect((await listLearners())).toHaveLength(1);
  });
});
