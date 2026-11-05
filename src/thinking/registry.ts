/**
 * 每日挑战总表（V2.6：数学、语文、英语）。
 * 每天推荐一科：周一、周四数学，周二、周五语文，周三、周六英语，周日数学；孩子也可以自己换一科。
 * 同一科里题型按天轮换；题目由日期决定，同一天打开几次都是同一道。
 */
import type { Subject } from '@/lesson/types';
import {
  challengeId,
  hash,
  MATH_CHALLENGES,
  seeded,
  type ChallengeExercise,
  type ChallengeGen,
  type ChallengeType,
} from './challenges';
import { CHINESE_CHALLENGES, ENGLISH_CHALLENGES } from './challengesLang';

export { challengeId, seeded } from './challenges';

export const CHALLENGES_BY_SUBJECT: Record<Subject, ChallengeGen[]> = {
  math: MATH_CHALLENGES,
  chinese: CHINESE_CHALLENGES,
  english: ENGLISH_CHALLENGES,
};
export const CHALLENGES: ChallengeGen[] = [...MATH_CHALLENGES, ...CHINESE_CHALLENGES, ...ENGLISH_CHALLENGES];
export const CHALLENGE_BY_TYPE = Object.fromEntries(CHALLENGES.map((g) => [g.type, g])) as Record<
  ChallengeType,
  ChallengeGen
>;

/** 由题目 id 还原题目 */
export function challengeFromId(id: string): ChallengeExercise | null {
  if (!id.startsWith('ch:')) return null;
  const sig = id.slice(3);
  const gen = CHALLENGE_BY_TYPE[sig.split(':')[0] as ChallengeType];
  if (!gen) return null;
  try {
    return { ...gen.build(sig), id, skill: `thinking:${gen.type}`, type: gen.type } as ChallengeExercise;
  } catch {
    return null;
  }
}

/** 挑战记录属于哪一科（V2.5 的记录没有 subject 字段，按题型判断） */
export const subjectOfType = (type: string): Subject => CHALLENGE_BY_TYPE[type as ChallengeType]?.subject ?? 'math';

const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
const WEEKDAY_SUBJECT: Subject[] = ['math', 'math', 'chinese', 'english', 'math', 'chinese', 'english']; // 周日…周六

/** 某一天推荐的学科 */
export const recommendedSubject = (day: string): Subject => WEEKDAY_SUBJECT[new Date(`${day}T00:00:00Z`).getUTCDay()];

/**
 * 某一天某一科的挑战；extra > 0 为“再玩一道”的第几道。
 * 学科不填时用当天推荐的学科。
 */
export function dailyChallenge(day: string, grade: number, extra = 0, subject?: Subject): ChallengeExercise {
  const subj = subject ?? recommendedSubject(day);
  const gens = CHALLENGES_BY_SUBJECT[subj];
  const level: 1 | 2 = grade <= 1 ? 1 : 2;
  const d = dayNumber(day);
  const gen = gens[(((d + extra * 3) % gens.length) + gens.length) % gens.length];
  const seedKey = subj === 'math' ? `${day}#${extra}#${grade}` : `${day}#${extra}#${grade}#${subj}`;
  const sig = gen.sig(seeded(hash(seedKey)), level);
  return challengeFromId(challengeId(sig))!;
}
