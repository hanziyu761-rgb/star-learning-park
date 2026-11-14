/**
 * V5.2.4 “每天不一样”实测：七～九年级语文、英语，模拟孩子连续 30 天
 * 每天做一套“今日一练”（10 题）+ 一轮单元练习（8 题，按顺序轮换单元），数一数遇到做过的题有多少。
 * 同一道题“自己填数”的变体（:in）算同一道题。
 */
import { dailyMix } from '@/knowledge/dailyMix';
import { kpRound } from '@/knowledge/generators';
import { kpsFor } from '@/knowledge/graph';
import type { Exercise, Subject } from '@/lesson/types';
import { createEmptyProgress, type ProgressState } from '@/progress/model';
import { seeded } from '@/thinking/challenges';

const DAY = 24 * 3600 * 1000;
const START = Date.UTC(2026, 10, 14, 10);
const dayStr = (t: number) => new Date(t).toISOString().slice(0, 10);
const base = (id: string) => id.replace(/:in$/, '');

function simulate(subject: Subject, grade: number, days: number, unitPractice = true) {
  const s: ProgressState = createEmptyProgress();
  s.settings.grade = grade;
  const kps = kpsFor(subject, grade).map((k) => k.id);
  const seen = new Set<string>();
  let total = 0;
  let repeats = 0;
  const firstRepeatDay: number[] = [];
  const answer = (list: Exercise[], now: number, d: number, rand: () => number) => {
    for (const e of list) {
      total++;
      if (seen.has(base(e.id))) {
        repeats++;
        firstRepeatDay.push(d);
      }
      seen.add(base(e.id));
      const kp = e.id.split(':')[1];
      s.results.push({
        lessonId: `kp:${kp}`,
        exerciseId: e.id,
        subject,
        skill: kp,
        firstTryCorrect: rand() < 0.8,
        attempts: 1,
        at: now,
        source: 'lesson',
      });
    }
  };
  for (let d = 0; d < days; d++) {
    const now = START + d * DAY;
    const rand = seeded(d * 7919 + grade);
    answer(dailyMix(s, subject, grade, dayStr(now), now), now, d, rand);
    if (!unitPractice) continue;
    const kp = kps[d % kps.length];
    const done = new Set(s.results.map((r) => base(r.exerciseId)));
    answer(kpRound(kp, 8, seeded(d * 31 + grade), done), now + 3600 * 1000, d, rand);
  }
  return { total, repeats, firstRepeat: firstRepeatDay[0] };
}

const GRADES = [7, 8, 9];
const log = (t: string) => {
  // 实测记录（写进测试报告）
  // eslint-disable-next-line no-console
  console.log(t);
};

describe('英语：词表 + 句型程序出题，天天不重样', () => {
  it.each(GRADES)('%i 年级只做今日一练 60 天、600 题，没有一道重复', (g) => {
    const r = simulate('english', g, 60, false);
    log(`英语 ${g} 年级 今日一练 60 天 ${r.total} 题，重复 ${r.repeats} 道`);
    expect(r.total).toBe(600);
    expect(r.repeats).toBe(0);
  });
  it.each(GRADES)('%i 年级今日一练 + 每天一轮单元练习，30 天 540 题，没有一道重复', (g) => {
    const r = simulate('english', g, 30);
    log(`英语 ${g} 年级 今日一练+单元练习 30 天 ${r.total} 题，重复 ${r.repeats} 道`);
    expect(r.total).toBe(540);
    expect(r.repeats).toBe(0);
  });
});

describe('语文：题目来自整理好的资料（有限），实测能维持多少天不重样', () => {
  it.each(GRADES)('%i 年级只做今日一练，40 天 400 题没有一道重复', (g) => {
    const r = simulate('chinese', g, 40, false);
    const long = simulate('chinese', g, 60, false);
    log(`语文 ${g} 年级 今日一练 40 天重复 ${r.repeats} 道；做满 60 天第一次重复在第 ${long.firstRepeat === undefined ? '-' : long.firstRepeat + 1} 天`);
    expect(r.total).toBe(400);
    expect(r.repeats).toBe(0);
  });
  it.each(GRADES)('%i 年级今日一练 + 每天一轮单元练习，头 12 天（216 题）没有一道重复', (g) => {
    const r = simulate('chinese', g, 12);
    const long = simulate('chinese', g, 30);
    log(`语文 ${g} 年级 今日一练+单元练习 12 天重复 ${r.repeats} 道；做满 30 天（540 题）重复 ${long.repeats} 道，第一次在第 ${long.firstRepeat === undefined ? '-' : long.firstRepeat + 1} 天`);
    expect(r.repeats).toBe(0);
  });
});
