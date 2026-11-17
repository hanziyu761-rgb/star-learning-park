/** V5.4 家长周报与连续打卡 */
import { createEmptyProgress, type ExerciseResult, type ProgressState } from '@/progress/model';
import { streak, weekly } from '@/progress/weekly';

const day = (d: number, h = 10) => new Date(2026, 10, d, h).getTime(); // 2026 年 11 月 d 日
const NOW = day(16, 20);
function res(at: number, skill: string, ok: boolean): ExerciseResult {
  return { lessonId: `kp:${skill}`, exerciseId: `kp:${skill}:${at}`, subject: 'math', skill, firstTryCorrect: ok, attempts: 1, at };
}
function state(results: ExerciseResult[]): ProgressState {
  return { ...createEmptyProgress(), results };
}

describe('连续打卡', () => {
  it('从今天往回数；今天还没学就从昨天数；最近 7 天的格子；奖章按最长连续', () => {
    const s = state([16, 15, 14, 12, 11, 10, 9, 8, 7, 6].map((d) => res(day(d), 'm3.a1', true)));
    expect(streak(s, NOW)).toMatchObject({ current: 3, today: true, best: 7, badges: [3, 7] });
    expect(streak(s, NOW).last7).toEqual([true, true, true, false, true, true, true]); // 10～16 日，13 日没学
    const noToday = state([15, 14].map((d) => res(day(d), 'm3.a1', true)));
    expect(streak(noToday, NOW)).toMatchObject({ current: 2, today: false });
    expect(streak(state([]), NOW)).toMatchObject({ current: 0, best: 0, badges: [] });
  });
});

describe('家长周报', () => {
  it('最近 7 天和之前 7 天：天数、题数、一次答对率；进步和要加油的本领；错得最多的', () => {
    const rs: ExerciseResult[] = [];
    // 之前一周：m3.a1 4 题错 3 题；m3.b2 4 题全对
    for (let i = 0; i < 4; i++) rs.push(res(day(5 + i), 'm3.a1', i === 0), res(day(5 + i, 11), 'm3.b2', true));
    // 这一周：m3.a1 4 题全对（进步）；m3.b2 4 题错 3 题（要加油）；m3.c3 错 2 题
    for (let i = 0; i < 4; i++) rs.push(res(day(12 + i), 'm3.a1', true), res(day(12 + i, 11), 'm3.b2', i === 0));
    rs.push(res(day(16), 'm3.c3', false), res(day(16, 12), 'm3.c3', false));
    const w = weekly(state(rs), NOW);
    expect(w.days).toBe(5);
    expect(w.questions).toBe(10);
    expect(w.accuracy).toBe(50);
    expect(w.prev).toMatchObject({ days: 4, questions: 8, accuracy: 63 });
    expect(w.improved.map((c) => [c.skill, c.before, c.now])).toEqual([['m3.a1', 25, 100]]);
    expect(w.slipped.map((c) => [c.skill, c.before, c.now])).toEqual([['m3.b2', 100, 25]]);
    expect(w.topWrong).toEqual([['m3.b2', 3], ['m3.c3', 2]]);
  });
  it('没有记录时都是 0，答对率为空', () => {
    expect(weekly(state([]), NOW)).toMatchObject({ days: 0, questions: 0, accuracy: null, improved: [], slipped: [], topWrong: [] });
  });
});
