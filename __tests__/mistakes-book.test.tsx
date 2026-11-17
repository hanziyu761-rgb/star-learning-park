/**
 * V2.21 三科错题本：按学科分开、还没掌握 / 已经掌握、重做错题、打印错题单（附答案可选）。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { resolveExercise } from '@/content/resolve';
import { LESSONS } from '@/content';
import type { Exercise } from '@/lesson/types';
import { mistakeBook, mistakeBookHtml, openCount, printable } from '@/mistakes/book';
import { createEmptyProgress, parseProgress, progressReducer, type ProgressState } from '@/progress/model';
import { mistakeQueue } from '@/progress/plan';
import { ProgressProvider } from '@/progress/ProgressContext';
import { STORAGE_KEY } from '@/progress/storage';
import { NavProvider } from '@/nav/Nav';
import MistakesScreen from '@/screens/MistakesScreen';

jest.mock('@/components/Mascot', () => ({ Mascot: () => null }));

/** 从课程里找出某一科、某种题型的一道题 */
function find(subject: string, pred: (e: Exercise) => boolean) {
  for (const l of LESSONS) {
    if (l.subject !== subject) continue;
    for (const s of l.steps) if (s.kind === 'exercise' && pred(s.exercise)) return { lessonId: l.id, e: s.exercise };
  }
  throw new Error(`没找到 ${subject} 题`);
}

function wrong(state: ProgressState, subject: 'math' | 'chinese' | 'english', lessonId: string, e: Exercise, now: number) {
  return progressReducer(state, {
    type: 'exercise/result',
    lessonId,
    exerciseId: e.id,
    subject,
    skill: e.skill,
    firstTryCorrect: false,
    attempts: 2,
    now,
  });
}

const mathChoice = find('math', (e) => e.kind === 'choice' && !e.listen);
const mathDrag = find('math', (e) => e.kind === 'drag-match' || e.kind === 'grid-place' || e.kind === 'clock-set');
const zhTf = find('chinese', (e) => e.kind === 'truefalse' || e.kind === 'choice');

function seeded(): ProgressState {
  let s = createEmptyProgress();
  s = wrong(s, 'math', mathChoice.lessonId, mathChoice.e, 1000);
  s = wrong(s, 'math', mathDrag.lessonId, mathDrag.e, 2000);
  s = wrong(s, 'chinese', zhTf.lessonId, zhTf.e, 3000);
  return s;
}

describe('错题本（纯函数）', () => {
  it('按学科分开，最近答错的在前；家长屏蔽的题不出现', () => {
    const s = seeded();
    const math = mistakeBook(s, 'math', resolveExercise);
    expect(math.open.map((e) => e.mistake.exerciseId)).toEqual([mathDrag.e.id, mathChoice.e.id]);
    expect(math.mastered).toEqual([]);
    expect(openCount(s, 'math')).toBe(2);
    expect(openCount(s, 'chinese')).toBe(1);
    expect(openCount(s, 'english')).toBe(0);
    const hidden = { ...s, hidden: [mathChoice.e.id] };
    expect(mistakeBook(hidden, 'math', resolveExercise).open).toHaveLength(1);
  });

  it('掌握了的题移到“已经掌握”', () => {
    const s = seeded();
    const key = `${mathChoice.lessonId}/${mathChoice.e.id}`;
    const done = { ...s, mistakes: { ...s.mistakes, [key]: { ...s.mistakes[key], resolved: true } } };
    const book = mistakeBook(done, 'math', resolveExercise);
    expect(book.open).toHaveLength(1);
    expect(book.mastered.map((e) => e.mistake.key)).toEqual([key]);
  });

  it('重做错题：只出这一科还没掌握的，不管有没有到复习日', () => {
    const s = seeded();
    const q = mistakeQueue(s, resolveExercise, 'math');
    expect(q.map((i) => i.exercise.id)).toEqual([mathDrag.e.id, mathChoice.e.id]);
    expect(mistakeQueue(s, resolveExercise, 'english')).toEqual([]);
  });

  it('打印：选择题印在纸上，互动题注明在 APP 里重做；答案页可选', () => {
    const s = seeded();
    const book = mistakeBook(s, 'math', resolveExercise);
    expect(printable(mathChoice.e)).not.toBeNull();
    expect(printable(mathDrag.e)).toBeNull();
    const html = mistakeBookHtml('math', book.open, { grade: 1, withAnswers: true, date: '2026-11-07' });
    expect(html).toContain('<h1>数学错题本</h1>');
    expect(html).toContain('请在 APP 里重做');
    expect(html).toContain('错过 1 次');
    expect(html).toContain('参考答案');
    expect(html).toContain('2026-11-07');
    const noAns = mistakeBookHtml('math', book.open, { grade: 1, withAnswers: false, date: 'x' });
    expect(noAns).not.toContain('参考答案');
  });

  it('听音题印在纸上听不到，算互动题', () => {
    const listen = LESSONS.flatMap((l) => l.steps).find(
      (st) => st.kind === 'exercise' && st.exercise.kind === 'choice' && !!st.exercise.listen,
    );
    if (listen && listen.kind === 'exercise') expect(printable(listen.exercise)).toBeNull();
  });
});

describe('V2.21 设置迁移', () => {
  it('旧记录：女声 / 男声改成童声，开机动画默认打开', () => {
    const old = createEmptyProgress() as unknown as Record<string, unknown>;
    const settings = { ...(old.settings as object), voiceGender: 'male' } as Record<string, unknown>;
    delete settings.splash;
    const p = parseProgress(JSON.stringify({ ...old, version: 7, settings }));
    expect(p?.settings.voiceGender).toBe('child');
    expect(p?.settings.splash).toBe(true);
    expect(p?.version).toBe(9); // V4.1 起为 v9（新增拍照错题）
  });
});

describe('错题本页面', () => {
  afterEach(() => AsyncStorage.clear());
  it('显示错题、切换已掌握；打印时生成错题单', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded()));
    const push = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 820 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <ProgressProvider>
          <NavProvider nav={{ push, back: jest.fn(), home: jest.fn() }}>
            <MistakesScreen subject="math" />
          </NavProvider>
        </ProgressProvider>
      </SafeAreaProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('mistakes-open-count')).toHaveTextContent('2'));
    expect(screen.getAllByTestId('mistake-entry')).toHaveLength(2);
    expect(screen.getByTestId('mistake-app-only')).toBeTruthy();
    fireEvent.press(screen.getByTestId('mistakes-redo'));
    expect(push).toHaveBeenCalledWith({ name: 'review', subject: 'math', grade: 1 }); // V5.4：默认只重做本年级的错题
    await act(async () => {
      fireEvent.press(screen.getByTestId('mistakes-print'));
    });
    expect(globalThis.__lastPrintHtml).toContain('数学错题本');
    await fireEvent.press(screen.getByTestId('mistakes-tab-mastered'));
    await waitFor(() => expect(screen.getByTestId('mistakes-empty')).toBeTruthy());
  });
});

describe('V5.4 错题本按年级', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mistakeGrade } = require('@/mistakes/grade');
  it('从题目来源判断年级：知识点、今日一练、课程、题库单元、口算、知识点 skill', () => {
    expect(mistakeGrade({ lessonId: 'kp:m7.a2', exerciseId: 'kp:m7.a2:add:1:2', skill: 'm7.a2' })).toBe(7);
    expect(mistakeGrade({ lessonId: 'mix:math:8:2026-11-16', exerciseId: 'kp:m8.b2:hyp:0:2', skill: 'm8.b2' })).toBe(8);
    expect(mistakeGrade({ lessonId: 'bank:math-g3a-u2', exerciseId: 'q12', skill: 'x' })).toBe(3);
    expect(mistakeGrade({ lessonId: 'game:fish', exerciseId: 'fish:1', skill: 'c2.a1' })).toBe(2);
    expect(mistakeGrade({ lessonId: 'game:fish', exerciseId: 'fish:1', skill: '不知道' })).toBeNull();
  });
});

describe('V5.4 只看本年级：错题本、错题数、重做错题都按年级筛', () => {
  it('七年级孩子：小学的旧错题只在“全部”里', () => {
    let s = createEmptyProgress();
    const bad = (lessonId: string, exerciseId: string, skill: string) => {
      s = progressReducer(s, { type: 'exercise/result', lessonId, exerciseId, subject: 'math', skill, firstTryCorrect: false, attempts: 2, now: 1000 });
    };
    bad('kp:m7.a2', 'kp:m7.a2:add:-8:-6', 'm7.a2');
    bad('kp:m3.mul2d', 'kp:m3.mul2d:12×13', 'm3.mul2d');
    const g7 = mistakeBook(s, 'math', resolveExercise, 7);
    const all = mistakeBook(s, 'math', resolveExercise);
    expect(g7.open.map((e) => e.mistake.exerciseId)).toEqual(['kp:m7.a2:add:-8:-6']);
    expect(all.open).toHaveLength(2);
    expect(openCount(s, 'math', 7)).toBe(1);
    expect(openCount(s, 'math')).toBe(2);
    expect(mistakeQueue(s, resolveExercise, 'math', 10, 7).map((i) => i.mistake.exerciseId)).toEqual(['kp:m7.a2:add:-8:-6']);
  });
});
