/**
 * “每天不一样”实测（V5.2.4 起，V5.2.5 扩到一～九年级三科）：
 * 模拟孩子连续每天做一套“今日一练”（10 题），或再加一轮单元练习（8 题，按顺序轮换单元），
 * 数一数遇到做过的题有多少。“自己填数”的变体（:in）算同一道题。
 * 门槛按实测结果设定（写在更新记录里），以后内容变少会报错。
 */
import { dailyMix } from '@/knowledge/dailyMix';
import { hasGenerator } from '@/knowledge/generators';
import { kpsFor } from '@/knowledge/graph';
import { kpRoundWithReview } from '@/knowledge/refill';
import type { Exercise, Subject } from '@/lesson/types';
import { createEmptyProgress, type ProgressState } from '@/progress/model';
import { seeded } from '@/thinking/challenges';

const DAY = 24 * 3600 * 1000;
const START = Date.UTC(2026, 10, 14, 10);
const dayStr = (t: number) => new Date(t).toISOString().slice(0, 10);
const base = (id: string) => id.replace(/:in$/, '');

function simulate(subject: Subject, grade: number, days: number, unitPractice: boolean) {
  const s: ProgressState = createEmptyProgress();
  s.settings.grade = grade;
  const kps = kpsFor(subject, grade)
    .filter((k) => hasGenerator(k.id))
    .map((k) => k.id);
  const seen = new Set<string>();
  let total = 0;
  let repeats = 0;
  let firstRepeat = 0;
  const answer = (list: Exercise[], now: number, d: number, rand: () => number) => {
    for (const e of list) {
      total++;
      if (seen.has(base(e.id))) {
        repeats++;
        if (!firstRepeat) firstRepeat = d + 1;
      }
      seen.add(base(e.id));
      const kp = e.id.split(':')[1];
      s.results.push({ lessonId: `kp:${kp}`, exerciseId: e.id, subject, skill: kp, firstTryCorrect: rand() < 0.8, attempts: 1, at: now, source: 'lesson' });
    }
  };
  for (let d = 0; d < days; d++) {
    const now = START + d * DAY;
    const rand = seeded(d * 7919 + grade);
    answer(dailyMix(s, subject, grade, dayStr(now), now), now, d, rand);
    // 单元练习是另一次打开，前面今日一练的记录已经存下
    if (unitPractice && kps.length) answer(kpRoundWithReview(s, kps[d % kps.length], 8, seeded(d * 31 + grade)), now + 3600 * 1000, d, rand);
  }
  return { total, repeats, firstRepeat };
}

const log = (t: string) => {
  // 实测记录
  // eslint-disable-next-line no-console
  console.log(t);
};
const show = (r: { total: number; repeats: number; firstRepeat: number }) =>
  `${r.total} 题，重复 ${r.repeats} 道，第一次重复：${r.firstRepeat ? `第 ${r.firstRepeat} 天` : '没有'}`;

/** [学科, 年级, 只做今日一练多少天不重样, 加单元练习时至少多少天不重样] */
const CASES: [Subject, number, number, number][] = [
  ['math', 1, 50, 2],
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((g) => ['math', g, 60, 15] as [Subject, number, number, number]),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => ['chinese', g, 40, 12] as [Subject, number, number, number]),
  ...[3, 4, 5, 6, 7, 8, 9].map((g) => ['english', g, g === 3 ? 55 : 60, 20] as [Subject, number, number, number]),
];

describe('一～九年级三科：连续每天做题，不出重样的题（按实测设定门槛）', () => {
  it.each(CASES)('%s %i 年级', (subject, grade, mixDays, unitDays) => {
    const a = simulate(subject, grade, mixDays, false);
    log(`${subject} ${grade} 年级 只做今日一练 ${mixDays} 天：${show(a)}`);
    expect(a.total).toBe(mixDays * 10);
    expect(a.repeats).toBe(0);
    const b = simulate(subject, grade, 30, true);
    log(`${subject} ${grade} 年级 今日一练 + 单元练习 30 天：${show(b)}`);
    expect(b.firstRepeat === 0 || b.firstRepeat > unitDays).toBe(true);
  });
});
