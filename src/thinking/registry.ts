/**
 * 每日挑战总表（V2.6：数学、语文、英语；V2.7：按年级分四档——一年级、二年级、三四年级、五六年级）。
 * 每天推荐一科：周一、周四数学，周二、周五语文，周三、周六英语，周日数学；孩子也可以自己换一科。
 * 同一科里题型按天轮换；题目由日期决定，同一天打开几次都是同一道。
 */
import type { DisplayText, Subject } from '@/lesson/types';
import { plainText } from '@/content/zh';
import {
  challengeId,
  hash,
  levelOfGrade,
  MATH_CHALLENGES,
  seeded,
  type ChallengeExercise,
  type ChallengeGen,
  type ChallengeType,
  type Level,
} from './challenges';
import {
  CHINESE_UPPER,
  ENGLISH_UPPER,
  enGuessAll,
  enOddAll,
  enPatternAll,
  enSentenceAll,
  MATH_UPPER,
  zhInferAll,
  zhRiddleAll,
  zhStoryAll,
  zhWordsLow,
} from './challengesUpper';
import { MATH_MULTI } from './challengesMulti';

export { challengeId, levelOfGrade, seeded } from './challenges';

export const CHALLENGES_BY_SUBJECT: Record<Subject, ChallengeGen[]> = {
  math: [...MATH_CHALLENGES, ...MATH_MULTI, ...MATH_UPPER],
  chinese: [zhRiddleAll, zhStoryAll, zhInferAll, zhWordsLow, ...CHINESE_UPPER],
  english: [enGuessAll, enOddAll, enPatternAll, enSentenceAll, ...ENGLISH_UPPER],
};
export const CHALLENGES: ChallengeGen[] = Object.values(CHALLENGES_BY_SUBJECT).flat();

/** 某一档难度可以出的题型 */
export const gensFor = (subject: Subject, level: Level) =>
  CHALLENGES_BY_SUBJECT[subject].filter((g) => !g.levels || g.levels.includes(level));

/** 三年级起不注拼音（与教材一致）：把带拼音的文字换成普通文字 */
export function withoutPinyin(e: ChallengeExercise): ChallengeExercise {
  const t = (x: DisplayText | undefined) => (x === undefined || typeof x === 'string' ? x : plainText(x));
  const out = {
    ...e,
    prompt: { ...e.prompt, text: t(e.prompt.text)! },
    wrongHint: { ...e.wrongHint, text: t(e.wrongHint.text)! },
  };
  if (out.kind === 'choice' || out.kind === 'multi') {
    return {
      ...out,
      stem: out.stem ? { ...out.stem, text: t(out.stem.text) } : undefined,
      options: out.options.map((o) => ({ ...o, text: t(o.text) })),
    };
  }
  return { ...out, items: out.items.map((it) => ({ ...it, text: t(it.text)! })) };
}
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
 * 学科不填时用当天推荐的学科。二档及以下注拼音，三档起不注。
 */
export function dailyChallenge(
  day: string,
  grade: number,
  extra = 0,
  subject?: Subject,
  /** 难度档（V2.11 跟着孩子调整）；不填按年级 */
  levelOverride?: Level,
): ChallengeExercise {
  const subj = subject ?? recommendedSubject(day);
  const level = levelOverride ?? levelOfGrade(grade);
  const gens = gensFor(subj, level);
  const d = dayNumber(day);
  // “再玩一道”每次跳过几种题型；步长与题型数互质，连着玩就能轮到每一种
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const step = [3, 5, 7, 1].find((k) => gcd(k, gens.length) === 1)!;
  const gen = gens[(((d + extra * step) % gens.length) + gens.length) % gens.length];
  const base = subj === 'math' ? `${day}#${extra}#${grade}` : `${day}#${extra}#${grade}#${subj}`;
  // 难度档不是按年级来的（调整过）时换一个种子，避免与原档同一道题
  const seedKey = level === levelOfGrade(grade) ? base : `${base}#L${level}`;
  const sig = gen.sig(seeded(hash(seedKey)), level);
  const ex = challengeFromId(challengeId(sig))!;
  return level >= 3 ? withoutPinyin(ex) : ex;
}
