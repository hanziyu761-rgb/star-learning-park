/**
 * V2.1 图形类互动题：题目数据正确性、五类题量、id 还原、钟表换算、
 * 掌握度/推荐/诊断接入，以及各互动组件的真实作答流程（含答错重试、不残留状态）。
 */
import 'react-native-gesture-handler/jestSetup';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClockSetExercise, clockParts, dragHourHand, dragMinuteHand } from '@/exercises/ClockSetExercise';
import { ExerciseView } from '@/exercises/ExerciseView';
import { GridPlaceExercise, GridTapExercise } from '@/exercises/GridExercises';
import { PatternFillExercise } from '@/exercises/PatternFillExercise';
import { BinsExercise, RotateExercise, ShapePickExercise } from '@/exercises/ShapeExercises';
import { startDiagnosis, nextKp } from '@/knowledge/diagnose';
import { exerciseFromKpId, hasGenerator, kpExercise, kpRound } from '@/knowledge/generators';
import { getKp } from '@/knowledge/graph';
import { GRAPHICS_GENERATORS, GRAPHICS_KPS } from '@/knowledge/graphics';
import { kpForRecord } from '@/knowledge/mapping';
import { computeMastery } from '@/knowledge/mastery';
import { recommendKps } from '@/knowledge/recommend';
import { resolveExercise } from '@/content/resolve';
import type { Exercise, PatternToken } from '@/lesson/types';
import { createEmptyProgress, parseProgress, progressReducer, type ProgressAction } from '@/progress/model';

// 测试环境没有原生动画引擎（reanimated 无法在 Jest 中加载）：组件测试里用最简拖动层替代，
// 只验证“点选 → 放置”的业务逻辑；真实手指拖动在网页端到端测试（graphics.py）中用鼠标验证。
jest.mock('@/drag/DragArea', () => {
  const { View } = require('react-native');
  return {
    DragArea: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <View style={style}>{children}</View>
    ),
    DropZone: ({ children, style, testID }: { children: React.ReactNode; style?: object; testID?: string }) => (
      <View style={style} testID={testID}>
        {children}
      </View>
    ),
    Draggable: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    justDragged: () => false,
  };
});

const T0 = new Date(2026, 10, 4, 9, 0, 0).getTime();
const DAY = 24 * 3600_000;
const all = (kpId: string) => GRAPHICS_GENERATORS[kpId].sigs.map((s) => kpExercise(kpId, s));
const kinds = (kpIds: string[]) => new Set(kpIds.flatMap((k) => all(k).map((e) => e.kind)));
const run = (a: ProgressAction[]) => a.reduce(progressReducer, createEmptyProgress());
const res = (exerciseId: string, ok: boolean, at: number): ProgressAction => ({
  type: 'exercise/result',
  lessonId: `kp:${exerciseId.split(':')[1]}`,
  exerciseId,
  subject: 'math',
  skill: exerciseId.split(':')[1],
  firstTryCorrect: ok,
  attempts: ok ? 1 : 2,
  now: at,
});
const tokenKey = (t: PatternToken) => t.id;

describe('图形类题目数据', () => {
  it('六个知识点都已开放练习，并且使用已有知识点编号', () => {
    for (const k of GRAPHICS_KPS) {
      expect(getKp(k)?.practicable).toBe(true);
      expect(hasGenerator(k)).toBe(true);
    }
  });

  it('五类内容每类至少 5 道，并包含要求的真实互动题型', () => {
    const cats: Record<string, string[]> = {
      位置与方向: ['m1.position'],
      平面立体图形: ['m1.shapes2d', 'm1.shapes3d'],
      钟表整时: ['m1.clock'],
      分类与整理: ['m1.classify'],
      找规律: ['m1.pattern'],
    };
    for (const kps of Object.values(cats)) {
      expect(kps.reduce((n, k) => n + GRAPHICS_GENERATORS[k].sigs.length, 0)).toBeGreaterThanOrEqual(5);
    }
    expect([...kinds(cats.位置与方向)]).toEqual(expect.arrayContaining(['grid-place', 'grid-tap', 'choice']));
    expect([...kinds(cats.平面立体图形)]).toEqual(expect.arrayContaining(['shape-pick', 'bins', 'rotate', 'choice']));
    expect([...kinds(cats.钟表整时)]).toEqual(expect.arrayContaining(['clock-set', 'choice']));
    expect([...kinds(cats.分类与整理)]).toEqual(expect.arrayContaining(['bins', 'truefalse', 'choice']));
    expect([...kinds(cats.找规律)]).toEqual(expect.arrayContaining(['pattern-fill']));
    // 拨钟题至少 5 道（含生活情境）
    expect(all('m1.clock').filter((e) => e.kind === 'clock-set').length).toBeGreaterThanOrEqual(5);
  });

  it('每道题数据自洽、答案唯一可达，并能由题目 id 还原', () => {
    for (const k of GRAPHICS_KPS) {
      const ids = new Set<string>();
      for (const e of all(k)) {
        expect(ids.has(e.id)).toBe(false);
        ids.add(e.id);
        expect(e.skill).toBe(k);
        expect(exerciseFromKpId(e.id)).toEqual(e);
        expect(resolveExercise(`kp:${k}`, e.id)?.exercise).toEqual(e); // 复习本可以还原
        expect(kpForRecord(`kp:${k}`, e.id, k)).toBe(k); // 作答记录能归到知识点
        checkExercise(e);
      }
    }
  });

  it('kpRound 每轮题目不重复，优先出没做过的题', () => {
    const r1 = kpRound('m1.position', 6, () => 0.3);
    expect(new Set(r1.map((e) => e.id)).size).toBe(r1.length);
    const done = new Set(r1.map((e) => e.id));
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const r2 = kpRound('m1.position', 3, rand, done);
    expect(r2.every((e) => !done.has(e.id))).toBe(true);
  });
});

/** 逐题型检查数据正确性 */
function checkExercise(e: Exercise) {
  switch (e.kind) {
    case 'choice':
      expect(e.options.map((o) => o.id)).toContain(e.answerId);
      expect(new Set(e.options.map((o) => o.id)).size).toBe(e.options.length);
      if (e.stem?.visual?.figure?.type === 'clock' && e.skill === 'm1.clock') {
        expect(e.answerId).toBe(String(e.stem.visual.figure.hour)); // 读钟题：答案 = 钟面整时
      }
      break;
    case 'grid-place': {
      const inGrid = e.target.row < e.rows && e.target.col < e.cols;
      expect(inGrid).toBe(true);
      expect(e.fixed.some((f) => f.row === e.target.row && f.col === e.target.col)).toBe(false);
      break;
    }
    case 'grid-tap':
      expect(e.target.row < e.rows && e.target.col < e.cols).toBe(true);
      break;
    case 'shape-pick': {
      const ids = e.figures.map((f) => f.id);
      expect(e.answerIds.length).toBeGreaterThan(0);
      expect(e.answerIds.every((a) => ids.includes(a))).toBe(true);
      // 答案图形是同一类，其余都不是这一类
      const cls = (id: string) => {
        const s = e.figures.find((f) => f.id === id)!.visual.figure;
        return s?.type === 'shape' ? (s.shape === 'rtri' ? 'triangle' : s.shape) : '?';
      };
      const answerCls = new Set(e.answerIds.map(cls));
      expect(answerCls.size).toBe(1);
      for (const id of ids) expect(e.answerIds.includes(id)).toBe(answerCls.has(cls(id)));
      break;
    }
    case 'bins':
      for (const i of e.items) expect(e.bins.map((b) => b.id)).toContain(i.bin);
      for (const b of e.bins) expect(e.items.some((i) => i.bin === b.id)).toBe(true);
      break;
    case 'rotate':
      expect(e.start % 90).toBe(0);
      expect(e.target % 90).toBe(0);
      expect(e.start % 360).not.toBe(e.target % 360);
      break;
    case 'clock-set':
      expect(e.targetHour).toBeGreaterThanOrEqual(1);
      expect(e.targetHour).toBeLessThanOrEqual(12);
      expect(clockParts(e.startMinutes)).not.toEqual({ hour: e.targetHour, minute: 0 }); // 起点不是答案
      break;
    case 'pattern-fill': {
      const blanks = e.sequence.filter((t) => t === null).length;
      expect(e.answers.length).toBe(blanks);
      const pal = e.palette.map(tokenKey);
      for (const a of e.answers) expect(pal).toContain(a);
      // 填上答案后，整个序列必须符合规律：数字为等差数列，图案为周期 2～3 的重复
      let k = 0;
      const full = e.sequence.map((t) => (t ? t.id : e.answers[k++]));
      if (full.every((x) => /^\d+$/.test(x))) {
        const n = full.map(Number);
        const d = n[1] - n[0];
        expect(n.every((v, i) => i === 0 || v - n[i - 1] === d)).toBe(true);
        expect(Math.max(...n)).toBeLessThanOrEqual(100); // 一年级范围
      } else {
        const period = [2, 3].find((pd) => full.every((x, i) => i < pd || x === full[i - pd]));
        expect(period).toBeDefined();
        // 已给出的部分足以确定规律：至少出现一个完整周期
        expect(e.sequence.slice(0, period!).every((t) => t !== null)).toBe(true);
      }
      break;
    }
    case 'truefalse':
      expect(typeof e.answer).toBe('boolean');
      break;
    default:
      throw new Error(`未检查的题型 ${e.kind}`);
  }
}

describe('钟表换算（时针分针关系）', () => {
  it('拨分针：时针跟着走，顺时针越过 12 进一小时，逆时针退一小时', () => {
    expect(dragMinuteHand(7 * 60 + 55, 0)).toBe(8 * 60); // 7:55 → 8:00
    expect(dragMinuteHand(8 * 60, 330)).toBe(7 * 60 + 55); // 8:00 → 7:55
    expect(dragMinuteHand(3 * 60, 90)).toBe(3 * 60 + 15); // 角度 90° = 15 分
    expect(dragMinuteHand(11 * 60 + 55, 2)).toBe(0); // 11:55 → 12:00
    expect(clockParts(0)).toEqual({ hour: 12, minute: 0 });
  });
  it('拨时针：吸附到整时，分针不变', () => {
    expect(dragHourHand(3 * 60, 212)).toBe(7 * 60);
    expect(dragHourHand(3 * 60 + 30, 105)).toBe(3 * 60 + 30); // 3:30 时针在 3 和 4 中间
    expect(dragHourHand(5 * 60, 0)).toBe(0);
  });
});

describe('学习记录接入：掌握度、推荐、诊断、持久化', () => {
  const ids = (k: string) => GRAPHICS_GENERATORS[k].sigs.map((s) => `kp:${k}:${s}`);

  it('答对多题 → 掌握度上升；推荐里出现新知识点', () => {
    const before = computeMastery(createEmptyProgress(), T0);
    expect(before['m1.clock'].state).toBe('not-started');
    const s = run(
      ids('m1.clock')
        .slice(0, 6)
        .map((id, i) => res(id, true, T0 + i * 1000)),
    );
    const m = computeMastery(s, T0 + DAY);
    expect(m['m1.clock'].state).not.toBe('not-started');
    expect(m['m1.clock'].recentCorrect).toBe(m['m1.clock'].recentTotal); // 最近几题全对
    expect(m['m1.clock'].recentTotal).toBeGreaterThanOrEqual(5);
    // 起点知识（无先修的位置、立体图形）应作为新知识推荐
    const recs = recommendKps(createEmptyProgress(), before, T0, 30);
    expect(recs.some((r) => r.kpId === 'm1.position')).toBe(true);
  });

  it('反复出错 → 推荐“找原因”，诊断沿必需先修（认识 11～20）回溯', () => {
    const s = run(
      ids('m1.clock')
        .slice(0, 4)
        .map((id, i) => res(id, i === 2, T0 + i)),
    );
    const m = computeMastery(s, T0 + 10);
    const recs = recommendKps(s, m, T0 + 10, 10);
    expect(recs.find((r) => r.kpId === 'm1.clock')?.kind).toBe('diagnose');
    const d = startDiagnosis('m1.clock');
    expect(nextKp(d).kpId).toBe('m1.clock'); // 先确认目标本身
    expect(getKp('m1.clock')!.prerequisites.some((p) => p.id === 'm1.count20' && p.strength === 'hard')).toBe(true);
  });

  it('图形题作答记录写入、序列化后重新读取不丢失', () => {
    const s = run([res('kp:m1.pattern:t1', false, T0), res('kp:m1.position:p1', true, T0 + 1)]);
    expect(Object.values(s.mistakes).some((x) => x.exerciseId === 'kp:m1.pattern:t1')).toBe(true);
    const back = parseProgress(JSON.stringify(s), T0 + 2)!;
    expect(back.results.map((r) => r.exerciseId)).toEqual(['kp:m1.pattern:t1', 'kp:m1.position:p1']);
    expect(Object.values(back.mistakes).map((x) => x.exerciseId)).toContain('kp:m1.pattern:t1');
  });
});

/* ───────────── 组件：真实交互 ───────────── */

const props = () => ({ lang: 'zh' as const, onFeedback: jest.fn(), onSolved: jest.fn() });
const lastKind = (f: jest.Mock) => f.mock.calls.filter((c) => c[0]).at(-1)?.[0].kind;

describe('互动组件', () => {
  it('拖到位置：点小动物再点格子（拖动的替代操作）；点错格子提示、可重试', async () => {
    const e = kpExercise('m1.position', 'p1');
    if (e.kind !== 'grid-place') throw new Error();
    const p = props();
    await render(<GridPlaceExercise exercise={e} {...p} />);
    await fireEvent.press(screen.getByLabelText('拖我到格子里，或点我再点格子'));
    await fireEvent.press(screen.getByTestId('cell-1-2').children[0] as never);
    expect(lastKind(p.onFeedback)).toBe('wrong');
    expect(p.onSolved).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('拖我到格子里，或点我再点格子'));
    await fireEvent.press(screen.getByTestId('cell-0-1').children[0] as never);
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });

  it('地图找位置：点对一次答对', async () => {
    const e = kpExercise('m1.position', 'p5');
    if (e.kind !== 'grid-tap') throw new Error();
    const p = props();
    await render(<GridTapExercise exercise={e} {...p} />);
    await fireEvent.press(screen.getByTestId('cell-1-0'));
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: true, attempts: 1 });
  });

  it('点出所有三角形：点错有提示，全部找到才算完成', async () => {
    const e = kpExercise('m1.shapes2d', 's1');
    if (e.kind !== 'shape-pick') throw new Error();
    const p = props();
    await render(<ShapePickExercise exercise={e} {...p} />);
    await fireEvent.press(screen.getByTestId('fig-a'));
    expect(screen.getByTestId('pick-left')).toHaveTextContent('还要找 2 个');
    await fireEvent.press(screen.getByTestId('fig-b'));
    expect(lastKind(p.onFeedback)).toBe('wrong');
    await fireEvent.press(screen.getByTestId('fig-c'));
    expect(p.onSolved).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('fig-e'));
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });

  it('分类：选物品再点区域；放错弹回提示，全部放对完成', async () => {
    const e = kpExercise('m1.classify', 'k1');
    if (e.kind !== 'bins') throw new Error();
    const p = props();
    await render(<BinsExercise exercise={e} {...p} />);
    const put = async (item: string, bin: string) => {
      await fireEvent.press(screen.getByTestId(`item-${item}`).children[0] as never);
      await fireEvent.press(screen.getByTestId(`bin-${bin}`).children[0] as never);
    };
    await put('i1', 'blue'); // 放错
    expect(lastKind(p.onFeedback)).toBe('wrong');
    expect(screen.getByTestId('item-i1')).toBeTruthy(); // 弹回原处
    for (const it of e.items) await put(it.id, it.bin);
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
    expect(screen.queryByTestId('item-i1')).toBeNull();
  });

  it('旋转：点一下转 90°，转对再放进去', async () => {
    const e = kpExercise('m1.shapes2d', 's6');
    if (e.kind !== 'rotate') throw new Error();
    const p = props();
    await render(<RotateExercise exercise={e} {...p} />);
    await fireEvent.press(screen.getByTestId('rotate-check'));
    expect(lastKind(p.onFeedback)).toBe('wrong');
    await fireEvent.press(screen.getByTestId('rotate-piece'));
    expect(screen.getByTestId('rotate-angle')).toHaveTextContent('90');
    await fireEvent.press(screen.getByTestId('rotate-piece'));
    await fireEvent.press(screen.getByTestId('rotate-check'));
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });

  it('拨钟：分针不在 12 → 提示分针；调到整时完成；时针分针关系正确', async () => {
    const e = kpExercise('m1.clock', 'set:7'); // 起点 10:30
    if (e.kind !== 'clock-set') throw new Error();
    const p = props();
    await render(
      <GestureHandlerRootView>
        <ClockSetExercise exercise={e} {...p} />
      </GestureHandlerRootView>,
    );
    expect(screen.getByTestId('clock-value')).toHaveTextContent('10:30');
    await fireEvent.press(screen.getByTestId('clock-check'));
    expect(p.onFeedback.mock.calls.at(-1)[0].hint.speak.text).toContain('分针');
    // 分针前进 30 分 → 11:00（时针跟着进一格）
    for (let i = 0; i < 6; i++) await fireEvent.press(screen.getByTestId('clock-minute-plus'));
    expect(screen.getByTestId('clock-value')).toHaveTextContent('11:00');
    for (let i = 0; i < 4; i++) await fireEvent.press(screen.getByTestId('clock-hour-minus'));
    expect(screen.getByTestId('clock-value')).toHaveTextContent('7:00');
    await fireEvent.press(screen.getByTestId('clock-check'));
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });

  it('找规律：两个空按顺序填对才完成，填错提示', async () => {
    const e = kpExercise('m1.pattern', 't5');
    if (e.kind !== 'pattern-fill') throw new Error();
    const p = props();
    await render(<PatternFillExercise exercise={e} {...p} />);
    const fill = async (tok: string, slot: number) => {
      await fireEvent.press(screen.getByTestId(`token-${tok}`).children[0] as never);
      await fireEvent.press(screen.getByTestId(`slot-${slot}`).children[0] as never);
    };
    await fill('apple', 5);
    expect(lastKind(p.onFeedback)).toBe('wrong');
    await fill('grape', 5);
    expect(p.onSolved).not.toHaveBeenCalled();
    await fill('apple', 6);
    expect(p.onSolved).toHaveBeenCalledWith({ firstTryCorrect: false, attempts: 2 });
  });

  it('换下一题时不残留上一题状态（以新 key 重新挂载）', async () => {
    const a = kpExercise('m1.shapes2d', 's1');
    const b = kpExercise('m1.shapes2d', 's2');
    const p = props();
    const { rerender } = await render(<ExerciseView key={`ex-0-${a.id}`} exercise={a} {...p} />);
    await fireEvent.press(screen.getByTestId('fig-a'));
    await rerender(<ExerciseView key={`ex-1-${b.id}`} exercise={b} {...p} />);
    expect(screen.getByTestId('pick-left')).toHaveTextContent('还要找 2 个');
    expect(screen.queryByText('✓')).toBeNull();
  });
});
