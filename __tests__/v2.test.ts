/**
 * V2 整合功能：间隔复习（移植自 ChinaStudyFree）、学习建议（规则来自 EduAgent）、v1 数据迁移。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LESSONS } from '@/content';
import { resolveExercise } from '@/content/resolve';
import { createEmptyProgress, parseProgress, progressReducer, PROGRESS_VERSION, type ProgressAction, type ProgressState } from '@/progress/model';
import { lessonSkills, suggestNext } from '@/progress/plan';
import { dayKey, isDue, isGraduated, newSrs, reviewSrs } from '@/progress/srs';
import { dueMistakes, subjectStats } from '@/progress/stats';
import { loadProgress, STORAGE_KEY } from '@/progress/storage';

const T0 = new Date(2026, 10, 4, 9, 0, 0).getTime();
const DAY = 24 * 3600_000;
const run = (a: ProgressAction[], s: ProgressState = createEmptyProgress()) => a.reduce(progressReducer, s);
const res = (lessonId: string, exerciseId: string, skill: string, ok: boolean, now: number, source?: 'lesson' | 'review'): ProgressAction => ({
  type: 'exercise/result', lessonId, exerciseId, subject: 'math', skill, firstTryCorrect: ok, attempts: ok ? 1 : 2, now, source,
});

describe('间隔复习 SRS', () => {
  it('答对依次升盒：明天 → 3 天后 → 7 天后；答错回第 1 盒', () => {
    let s = newSrs(T0);
    expect(s).toMatchObject({ box: 1, nextReviewDay: dayKey(T0) });
    s = reviewSrs(s, true, T0);
    expect(s).toMatchObject({ box: 2, nextReviewDay: dayKey(T0 + DAY) });
    s = reviewSrs(s, true, T0 + DAY);
    expect(s).toMatchObject({ box: 3, nextReviewDay: dayKey(T0 + 4 * DAY) });
    expect(isGraduated(s)).toBe(true);
    const wrong = reviewSrs(s, false, T0 + 5 * DAY);
    expect(wrong).toMatchObject({ box: 1, correctCount: 0, nextReviewDay: dayKey(T0 + 5 * DAY) });
  });

  it('到期判断：未到日期不复习，已毕业不复习', () => {
    const s = reviewSrs(newSrs(T0), true, T0); // 明天复习
    expect(isDue(s, T0)).toBe(false);
    expect(isDue(s, T0 + DAY)).toBe(true);
  });

  it('错题当天进入复习队列；复习答对后明天才再出现', () => {
    let s = run([res('L', 'q1', 'math.add', false, T0)]);
    expect(dueMistakes(s, T0)).toHaveLength(1);
    s = run([res('L', 'q1', 'math.add', true, T0 + 1000, 'review')], s);
    expect(dueMistakes(s, T0 + 2000)).toHaveLength(0);
    expect(dueMistakes(s, T0 + DAY)).toHaveLength(1);
  });

  it('复习作答不计入学科正确率，也不影响课程星星；完成复习奖励 1 颗星', () => {
    let s = run([res('L', 'q1', 'math.add', true, T0), res('L', 'q2', 'math.add', false, T0, 'review')]);
    expect(subjectStats(s, 'math').accuracy).toBe(100);
    s = run([{ type: 'review/complete', now: T0, count: 1, firstTryCorrect: 0 }], s);
    expect(s.totalStars).toBe(1);
    expect(s.reviews).toHaveLength(1);
    s = run([{ type: 'review/complete', now: T0, count: 0, firstTryCorrect: 0 }], s);
    expect(s.totalStars).toBe(1);
  });
});

describe('v1 → v2 数据迁移（旧进度不丢失）', () => {
  const v1 = {
    version: 1,
    totalStars: 5,
    lessons: { L: { lessonId: 'L', subject: 'math', startCount: 2, completedCount: 2, bestStars: 3, lastStudiedAt: T0 } },
    results: [{ lessonId: 'L', exerciseId: 'q1', subject: 'math', skill: 'math.add', firstTryCorrect: false, attempts: 2, at: T0 }],
    mistakes: {
      'L/q1': { key: 'L/q1', lessonId: 'L', exerciseId: 'q1', subject: 'math', skill: 'math.add', wrongCount: 1, lastWrongAt: T0, resolved: false },
      'L/q2': { key: 'L/q2', lessonId: 'L', exerciseId: 'q2', subject: 'math', skill: 'math.add', wrongCount: 1, lastWrongAt: T0, resolved: true },
    },
    sessions: [{ lessonId: 'L', subject: 'math', startedAt: T0, endedAt: T0 + 60000, durationSec: 60, firstTryCorrect: 1, exerciseCount: 2, stars: 2 }],
    active: null,
  };

  it('保留全部旧记录，未掌握的错题今天可复习，已掌握的保持掌握', () => {
    const s = parseProgress(JSON.stringify(v1), T0)!;
    expect(s.version).toBe(PROGRESS_VERSION);
    expect(s.settings).toEqual({ grade: 1, aiEnabled: false, aiBaseUrl: '', adaptiveChallenge: true, voiceGender: 'female', voiceZh: '', voiceEn: '', speechRate: 'slow', voiceInput: false });
    expect(s.diagnoses).toEqual([]);
    expect(s.hidden).toEqual([]);
    expect(s.totalStars).toBe(5);
    expect(s.sessions).toHaveLength(1);
    expect(s.results).toHaveLength(1);
    expect(s.reviews).toEqual([]);
    expect(s.mistakes['L/q1'].srs.box).toBe(1);
    expect(dueMistakes(s, T0).map((m) => m.key)).toEqual(['L/q1']);
    expect(s.mistakes['L/q2'].resolved).toBe(true);
    // 旧记录没有 source，按课程作答统计
    expect(subjectStats(s, 'math').exercises).toBe(1);
  });

  it('从存储读取 v1 数据自动升级', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(v1));
    const r = await loadProgress();
    expect(r.ok).toBe(true);
    expect(r.state.version).toBe(PROGRESS_VERSION);
    expect(r.state.mistakes['L/q1'].srs).toBeDefined();
  });
});

describe('学习建议', () => {
  const math = LESSONS.find((l) => l.subject === 'math')!;

  it('新用户：推荐还没学过的课', () => {
    const sug = suggestNext(createEmptyProgress(), LESSONS, resolveExercise, T0);
    expect(sug.every((s) => s.kind === 'new')).toBe(true);
    expect(sug).toHaveLength(3);
  });

  it('优先级：继续学习 → 今日复习 → 薄弱知识点 → 新课', () => {
    const s = run([
      { type: 'lesson/start', lessonId: math.id, subject: 'math', now: T0, resume: false },
      res(math.id, 'compare-fish', 'math.compare', false, T0),
      res(math.id, 'x2', 'math.compare', false, T0),
      { type: 'lesson/complete', lessonId: math.id, subject: 'math', now: T0 + 1000 },
      { type: 'lesson/start', lessonId: 'chinese-ri-yue-shui-huo', subject: 'chinese', now: T0 + 2000, resume: false },
    ]);
    const sug = suggestNext(s, LESSONS, resolveExercise, T0 + 3000, 5);
    expect(sug[0]).toEqual({ kind: 'continue', lessonId: 'chinese-ri-yue-shui-huo' });
    // x2 不是可单独重做的题目（不存在于课程中），只有 compare-fish 进入复习
    expect(sug[1]).toEqual({ kind: 'review', count: 1 });
    expect(sug[2]).toMatchObject({ kind: 'weak', lessonId: math.id, skill: 'math.compare', accuracy: 0 });
    expect(sug[3]).toEqual({ kind: 'new', lessonId: 'en-talk-1' }); // V2.8：英语按三条主线排序，第一课是交流第 1 单元
  });

  it('课程知识点索引来自课程数据', () => {
    expect(lessonSkills(math)).toEqual(expect.arrayContaining(['math.add', 'math.compare', 'math.count', 'math.compose']));
  });
});
