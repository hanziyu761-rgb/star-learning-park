import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createEmptyProgress,
  MAX_SESSION_SEC,
  parseProgress,
  progressReducer,
  starsForAccuracy,
  type ProgressAction,
  type ProgressState,
} from '@/progress/model';
import {
  activeDaysLast7,
  completedSubjectToday,
  openMistakes,
  subjectStats,
  weakSkills,
} from '@/progress/stats';
import { CORRUPT_BACKUP_KEY, flushProgressWrites, loadProgress, saveProgress, STORAGE_KEY } from '@/progress/storage';

const T0 = new Date(2026, 10, 4, 9, 0, 0).getTime();
const DAY = 24 * 3600_000;

function run(actions: ProgressAction[], start = createEmptyProgress()): ProgressState {
  return actions.reduce(progressReducer, start);
}

const answer = (exerciseId: string, ok: boolean, now: number, skill = 'math.add10'): ProgressAction => ({
  type: 'exercise/result',
  lessonId: 'math-1',
  exerciseId,
  subject: 'math',
  skill,
  firstTryCorrect: ok,
  attempts: ok ? 1 : 2,
  now,
});

describe('星星规则', () => {
  it('按第一次作答正确率给 1–3 颗星', () => {
    expect(starsForAccuracy(10, 10)).toBe(3);
    expect(starsForAccuracy(9, 10)).toBe(3);
    expect(starsForAccuracy(6, 10)).toBe(2);
    expect(starsForAccuracy(5, 10)).toBe(1);
    expect(starsForAccuracy(0, 0)).toBe(3);
  });
});

describe('进度记录', () => {
  it('完整学习一节课后记录完成、星星、时长和正确率', () => {
    const s = run([
      { type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0, resume: false },
      answer('q1', true, T0 + 60_000),
      answer('q2', false, T0 + 120_000, 'math.compare'),
      answer('q3', true, T0 + 180_000),
      { type: 'lesson/complete', lessonId: 'math-1', subject: 'math', now: T0 + 300_000 },
    ]);
    expect(s.lessons['math-1'].completedCount).toBe(1);
    expect(s.lessons['math-1'].startCount).toBe(1);
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0].durationSec).toBe(300);
    expect(s.sessions[0].firstTryCorrect).toBe(2);
    expect(s.sessions[0].exerciseCount).toBe(3);
    expect(s.sessions[0].stars).toBe(2); // 2/3 ≈ 67%
    expect(s.totalStars).toBe(2);
    expect(s.active).toBeNull();

    const math = subjectStats(s, 'math');
    expect(math.accuracy).toBe(67);
    expect(math.completedLessons).toBe(1);
    expect(subjectStats(s, 'english').accuracy).toBeNull();
  });

  it('错题被记录；之后需要按间隔复习答对 2 次才算掌握', () => {
    let s = run([
      { type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0, resume: false },
      answer('q2', false, T0 + 1000),
    ]);
    expect(openMistakes(s)).toHaveLength(1);
    expect(openMistakes(s)[0].wrongCount).toBe(1);
    expect(s.mistakes['math-1/q2'].srs.box).toBe(1);
    s = run([answer('q2', true, T0 + 2000)], s);
    expect(s.mistakes['math-1/q2'].srs.box).toBe(2);
    expect(openMistakes(s)).toHaveLength(1);
    s = run([answer('q2', true, T0 + 2 * DAY)], s);
    expect(s.mistakes['math-1/q2'].resolved).toBe(true);
    expect(openMistakes(s)).toHaveLength(0);
  });

  it('继续上次学习时保留步骤位置，不重复计入学习次数', () => {
    let s = run([
      { type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0, resume: false },
      { type: 'lesson/step', lessonId: 'math-1', stepIndex: 4, now: T0 + 1000 },
    ]);
    expect(s.active?.stepIndex).toBe(4);
    s = run([{ type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0 + 5000, resume: true }], s);
    expect(s.active?.stepIndex).toBe(4);
    expect(s.lessons['math-1'].startCount).toBe(1);
    // 重新开始则回到第一步
    s = run([{ type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0 + 6000, resume: false }], s);
    expect(s.active?.stepIndex).toBe(0);
    expect(s.lessons['math-1'].startCount).toBe(2);
  });

  it('单次学习时长有上限', () => {
    const s = run([
      { type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0, resume: false },
      { type: 'lesson/complete', lessonId: 'math-1', subject: 'math', now: T0 + 5 * 3600_000 },
    ]);
    expect(s.sessions[0].durationSec).toBe(MAX_SESSION_SEC);
  });

  it('薄弱知识点：至少 2 题且正确率低于 70%', () => {
    const s = run([
      answer('a', false, T0, 'math.compare'),
      answer('b', false, T0, 'math.compare'),
      answer('c', true, T0, 'math.add10'),
      answer('d', true, T0, 'math.add10'),
      answer('e', false, T0, 'math.count'), // 只有 1 题，不足以判断
    ]);
    expect(weakSkills(s).map((x) => x.skill)).toEqual(['math.compare']);
  });

  it('今日任务和最近 7 天活跃天数来自真实记录', () => {
    const s = run([
      { type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0, resume: false },
      { type: 'lesson/complete', lessonId: 'math-1', subject: 'math', now: T0 + 1000 },
    ]);
    expect(completedSubjectToday(s, 'math', T0 + 2000)).toBe(true);
    expect(completedSubjectToday(s, 'english', T0 + 2000)).toBe(false);
    expect(completedSubjectToday(s, 'math', T0 + 24 * 3600_000)).toBe(false);
    expect(activeDaysLast7(s, T0 + 3 * 24 * 3600_000)).toBe(1);
    expect(activeDaysLast7(createEmptyProgress(), T0)).toBe(0);
  });

  it('重置后清空全部记录', () => {
    const s = run([answer('a', false, T0), { type: 'reset' }]);
    expect(s).toEqual(createEmptyProgress());
  });
});

describe('本地存储（模拟关闭后重新打开 APP）', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('首次打开时没有记录，返回空进度', async () => {
    const res = await loadProgress();
    expect(res.ok).toBe(true);
    expect(res.state).toEqual(createEmptyProgress());
  });

  it('保存后重新读取，进度完全一致', async () => {
    const s = run([
      { type: 'lesson/start', lessonId: 'math-1', subject: 'math', now: T0, resume: false },
      answer('q1', true, T0 + 1000),
      { type: 'lesson/complete', lessonId: 'math-1', subject: 'math', now: T0 + 2000 },
    ]);
    await saveProgress(s);
    await flushProgressWrites();
    const res = await loadProgress();
    expect(res.ok).toBe(true);
    expect(res.state).toEqual(s);
    expect(res.state.totalStars).toBe(3);
  });

  it('连续多次保存，最后一次生效', async () => {
    const a = run([answer('q1', true, T0)]);
    const b = run([answer('q2', false, T0 + 1)], a);
    saveProgress(a);
    saveProgress(b);
    await flushProgressWrites();
    const res = await loadProgress();
    expect(res.state.results).toHaveLength(2);
  });

  it('数据损坏时备份原始数据并返回空进度，不会崩溃', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{not json');
    const res = await loadProgress();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('corrupt');
    expect(res.state).toEqual(createEmptyProgress());
    expect(await AsyncStorage.getItem(CORRUPT_BACKUP_KEY)).toBe('{not json');
  });
});

describe('V5.4 护眼设置迁移', () => {
  it('旧记录没有护眼设置：每天不限、连续 20 分钟提醒休息；乱写的值也用默认；正常值保留', () => {
    const old = { ...createEmptyProgress() } as Record<string, unknown>;
    const settings = { ...(old.settings as object) } as Record<string, unknown>;
    delete settings.dailyMinutes;
    delete settings.breakMinutes;
    const a = parseProgress(JSON.stringify({ ...old, settings }))!;
    expect([a.settings.dailyMinutes, a.settings.breakMinutes]).toEqual([0, 20]);
    const b = parseProgress(JSON.stringify({ ...old, settings: { ...settings, dailyMinutes: '很多', breakMinutes: -3 } }))!;
    expect([b.settings.dailyMinutes, b.settings.breakMinutes]).toEqual([0, 20]);
    const c = parseProgress(JSON.stringify({ ...old, settings: { ...settings, dailyMinutes: 40, breakMinutes: 0 } }))!;
    expect([c.settings.dailyMinutes, c.settings.breakMinutes]).toEqual([40, 0]);
  });
});
