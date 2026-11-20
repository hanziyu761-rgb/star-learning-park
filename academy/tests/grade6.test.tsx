import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from '../src/App';
import { appendEvent, eventsForLearner, getSettings, resetDbConnection, saveLearner, saveSettings, setActiveLearnerId, worksForLearner } from '../src/store/db';
import { CORPUS, END, generateGreedy, nextWords, START, train } from '../src/learning/minilm';
import { answerFromKb, KB_QUESTIONS, retrieve } from '../src/learning/retrieval';
import { canvasReady, SAFETY_QUESTIONS } from '../src/activities/ProductCanvas';
import { childLines } from '../src/activities/PythonProject';
import { findLesson } from '../src/curriculum/catalog';
import type { LearningEvent } from '../src/store/types';

const click = (el: HTMLElement) => fireEvent.click(el);

describe('mini language model (real bigram counts)', () => {
  const m = train();
  it('probabilities come from counts in the corpus and add up to 1', () => {
    const c = nextWords(m, '很');
    expect(c.map((x) => [x.word, x.count])).toEqual([['好', 2], ['冷', 2], ['喜欢', 2]]);
    expect(c.reduce((s, x) => s + x.p, 0)).toBeCloseTo(1);
    expect(nextWords(m, '天气')).toEqual([{ word: '很', count: 4, p: 1 }]);
  });
  it('greedy generation is deterministic and only uses corpus words', () => {
    const words = generateGreedy(m);
    expect(words.join('')).toBe('今天天气很好。');
    const vocab = new Set(CORPUS.flatMap((l) => l.split(' ')));
    for (const w of words) expect(vocab.has(w)).toBe(true);
    expect(words.at(-1)).toBe(END);
  });
  it('a word never seen in the corpus has no continuation', () => {
    expect(nextWords(m, '下雪')).toEqual([]);
    expect(nextWords(m, START).length).toBeGreaterThan(0);
  });
});

describe('knowledge-base retrieval (real keyword matching)', () => {
  it('finds the right document for every sample question and cites it', () => {
    for (const q of KB_QUESTIONS) {
      expect(retrieve(q.text)[0].doc.id).toBe(q.expectDoc);
      expect(answerFromKb(q.text).source?.id).toBe(q.expectDoc);
    }
  });
  it('says "不知道" when nothing in the knowledge base matches well', () => {
    for (const q of ['食堂中午吃什么？', '学校几点放学？', '今天下雨吗？']) expect(answerFromKb(q)).toMatchObject({ source: null, answer: expect.stringMatching(/不知道/) });
  });
});

describe('project helpers', () => {
  it('childLines counts only lines the child wrote', () => {
    const starter = 'score = 0\n# 写在这里\nprint(score)';
    expect(childLines(starter, 'score = 0\nscore = score + 1\nprint(score)')).toEqual(['score = score + 1']);
  });
  it('the product canvas requires every safety question', () => {
    const full = { name: '口算教练', problem: '一年级口算容易粗心', users: ['同学'], features: '出题和提示，不给答案', data: '题库', abilities: ['不需要 AI'], safety: Object.fromEntries(SAFETY_QUESTIONS.map((s) => [s.id, '我的设计说明'])) };
    expect(canvasReady(full)).toBe(true);
    expect(canvasReady({ ...full, safety: { ...full.safety, fair: '' } })).toBe(false);
  });
});

describe('grade 5–6 in the app', () => {
  beforeEach(async () => {
    cleanup();
    await resetDbConnection();
    globalThis.indexedDB = new IDBFactory();
    localStorage.clear();
    window.location.hash = '';
    await saveSettings({ ...(await getSettings()), pinyin: false, readAloud: false });
  });

  async function learner(grade: 5 | 6) {
    await saveLearner({ id: 'L', nickname: '火箭队长', avatar: '🦁', grade, createdAt: '2026-11-01T00:00:00Z' });
    await setActiveLearnerId('L');
  }
  async function seedStepsBefore(lessonId: string, stepId: string) {
    let i = 0;
    for (const s of findLesson(lessonId)!.steps) {
      if (s.id === stepId) break;
      await appendEvent({ id: 'seed' + i++, learnerId: 'L', at: new Date().toISOString(), lessonId, activeMs: 0, mode: 'local', type: 'step_done', stepId: s.id, kind: s.kind } as LearningEvent);
    }
  }

  it('grade 5 and grade 6 homes offer their first lessons', async () => {
    await learner(5);
    render(<App />);
    expect(await screen.findByRole('button', { name: /今天学：Python 入门/ })).toBeTruthy();
    cleanup();
    await saveLearner({ id: 'L', nickname: '火箭队长', avatar: '🦁', grade: 6, createdAt: '2026-11-01T00:00:00Z' });
    render(<App />);
    expect(await screen.findByRole('button', { name: /今天学：Python 项目开发/ })).toBeTruthy();
  });

  it('mini LM: building a sentence shows real probabilities; the right answer is recorded', async () => {
    await learner(6);
    await seedStepsBefore('g6-l3', 'a1');
    window.location.hash = '#/play/g6-l3';
    render(<App />);
    await screen.findByText(/它只读过下面/);
    click(screen.getByRole('button', { name: /选择"天气"，概率 17%/ }));
    click(screen.getByRole('button', { name: /选择"很"，概率 100%/ }));
    click(screen.getByRole('button', { name: /选择"冷"，概率 33%/ }));
    click(screen.getByRole('button', { name: /选择"。"/ }));
    expect(await screen.findByText(/已生成：天气很冷。/)).toBeTruthy();
    click(screen.getByRole('button', { name: /哪个词常接在后面/ }));
    await screen.findByText(/对！/);
    const exp = (await eventsForLearner('L')).find((e) => e.type === 'experiment');
    expect(exp).toMatchObject({ kind: 'language-model', mistakes: 0 });
  });

  it('retrieval: answers with a cited source, says 不知道 for an unknown question, and compares with a labelled example', async () => {
    await learner(6);
    await seedStepsBefore('g6-l8', 'a1');
    window.location.hash = '#/play/g6-l8';
    render(<App />);
    click(await screen.findByRole('button', { name: '一次能借几本书？' }));
    expect(screen.getByText(/每人每次最多借 2 本书/, { selector: '.rag-answer' })).toBeTruthy();
    expect(screen.getByText(/来源：知识库「借书规定」/)).toBeTruthy();
    expect(screen.getByText(/示例 AI 回答：一般可以借 5 本书/)).toBeTruthy();
    click(screen.getByRole('button', { name: '食堂中午吃什么？' }));
    expect(screen.getByText(/知识库里没有找到相关内容，我不知道/)).toBeTruthy();
    click(screen.getByRole('button', { name: /先检索、再根据资料回答/ }));
    await screen.findByText(/对！/);
    expect((await eventsForLearner('L')).find((e) => e.type === 'experiment')).toMatchObject({ kind: 'retrieval', mistakes: 0 });
  });

  it('product canvas: cannot save until every part and every safety question is answered', async () => {
    await learner(6);
    await seedStepsBefore('g6-l9', 'p1');
    window.location.hash = '#/play/g6-l9';
    render(<App />);
    const save = await screen.findByRole('button', { name: /保存我的产品设计/ });
    const set = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
    set('产品名字', '口算小教练');
    set('2. 它要解决什么问题？', '一年级同学口算容易粗心');
    click(screen.getByRole('button', { name: '低年级小朋友' }));
    set('4. 主要功能（写 2–3 条）', '出口算题；答错给提示');
    set('5. 需要哪些数据？', '口算题库');
    click(screen.getByRole('button', { name: '不需要 AI' }));
    expect((save as HTMLButtonElement).disabled).toBe(true);
    for (const s of SAFETY_QUESTIONS) set(s.q, '我的安全设计说明');
    expect((save as HTMLButtonElement).disabled).toBe(false);
    click(save);
    await screen.findByText(/产品设计已保存/);
    const [work] = await worksForLearner('L');
    expect(work.type).toBe('product');
    expect(work.parts.every((p) => p.by === 'child')).toBe(true);
    expect(work.parts.filter((p) => p.field.startsWith('safety-'))).toHaveLength(4);
  });
});
