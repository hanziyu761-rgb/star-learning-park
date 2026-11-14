/**
 * 今日一练（V5.2.3）：按家长选的年级，每天自动组一套这一科的混合练习（默认 10 题），每天不一样。
 *
 * - 只取这个年级（上、下册）有题可练的知识点
 * - 选知识点：先“要复习 / 在学”的，再“学过的”巩固，最后按教学顺序补“还没学的”（每天最多 2 个新的）
 * - 同一类里按日期打乱，所以每天轮到的知识点不同；每个知识点出题时优先出没做过的题
 * - V5.2.4：选中的知识点没有新题了，就从本年级别的知识点补新题，都做过了才出旧题
 * - 题目 id 仍是 kp:知识点:签名，所以记录照常归到知识点（掌握度、错题本、复习都能用）
 * 纯函数，只看真实学习记录。
 */
import type { Exercise, Subject } from '@/lesson/types';
import type { ProgressState } from '@/progress/model';
import { hash, seeded, shuffle } from '@/thinking/challenges';
import { hasGenerator, kpRound } from './generators';
import { kpsFor } from './graph';
import { computeMastery } from './mastery';

export const DAILY_COUNT = 10;

/** 今日一练的练习 id：mix:学科:年级:日期 */
export const dailyMixId = (subject: Subject, grade: number, day: string) => `mix:${subject}:${grade}:${day}`;
export const isDailyMixId = (id: string) => id.startsWith('mix:');
export function parseDailyMixId(id: string): { subject: Subject; grade: number; day: string } | null {
  const m = /^mix:(math|chinese|english):(\d):(\d{4}-\d{2}-\d{2})$/.exec(id);
  return m ? { subject: m[1] as Subject, grade: Number(m[2]), day: m[3] } : null;
}

/** 今天选哪几个知识点（按顺序） */
export function dailyMixKps(state: ProgressState, subject: Subject, grade: number, day: string, now: number): string[] {
  const kps = kpsFor(subject, grade).filter((k) => hasGenerator(k.id));
  if (!kps.length) return [];
  const m = computeMastery(state, now);
  const rand = seeded(hash(`${day}#${subject}#${grade}`));
  const st = (id: string) => m[id]?.state ?? 'not-started';
  const weak = shuffle(kps.filter((k) => ['needs-review', 'learning'].includes(st(k.id))).map((k) => k.id), rand);
  const known = shuffle(kps.filter((k) => ['emerging', 'stable'].includes(st(k.id))).map((k) => k.id), rand);
  const fresh = kps.filter((k) => st(k.id) === 'not-started').map((k) => k.id);
  // 新知识点按教学顺序，但每天从不同的位置开始，免得天天都是第一章
  const start = fresh.length ? Math.floor(rand() * Math.min(fresh.length, 3)) : 0;
  const newOnes = fresh.slice(start, start + 2);
  const picked = [...weak.slice(0, 3), ...known.slice(0, 2), ...newOnes];
  // 还不够 4 个时，从剩下的知识点里按日期补
  for (const id of shuffle(kps.map((k) => k.id), rand)) {
    if (picked.length >= 4) break;
    if (!picked.includes(id)) picked.push(id);
  }
  return picked.slice(0, 5);
}

/** 今天这一套题（同一天打开几次，在没做新题时是同一套） */
export function dailyMix(state: ProgressState, subject: Subject, grade: number, day: string, now: number): Exercise[] {
  const ids = dailyMixKps(state, subject, grade, day, now);
  if (!ids.length) return [];
  // 做过的题（“自己填数”的变体算同一道）
  const base = (id: string) => id.replace(/:in$/, '');
  const done = new Set(state.results.filter((r) => r.exerciseId.startsWith('kp:')).map((r) => base(r.exerciseId)));
  const rand = seeded(hash(`${day}#mix#${subject}#${grade}`));
  const per = Math.ceil(DAILY_COUNT / ids.length);
  const out: Exercise[] = [];
  const seen = new Set<string>();
  const take = (list: Exercise[], max: number, allowDone: boolean) => {
    let n = 0;
    for (const e of list) {
      if (out.length >= DAILY_COUNT || n >= max) break;
      if (seen.has(base(e.id)) || (!allowDone && done.has(base(e.id)))) continue;
      seen.add(base(e.id));
      out.push(e);
      n++;
    }
  };
  // V5.2.4：先出选中知识点里没做过的题；某个知识点的题都做过了，就换本年级别的知识点补上
  for (const id of ids) take(kpRound(id, per, rand, done), per, false);
  const rest = shuffle(
    kpsFor(subject, grade)
      .filter((k) => hasGenerator(k.id) && !ids.includes(k.id))
      .map((k) => k.id),
    rand,
  );
  for (const id of rest) {
    if (out.length >= DAILY_COUNT) break;
    take(kpRound(id, per, rand, done), per, false);
  }
  // 全部都做过了，才出做过的题
  for (const id of ids) take(kpRound(id, per, rand), per, true);
  // 打乱顺序，几个知识点交替出现
  return shuffle(out, rand);
}
