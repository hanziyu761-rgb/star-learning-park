/**
 * 单元小测（V5.4）：孩子在 APP 里做 10 道题，计时，只算第一次作答；交卷后给出得分和每个知识点的情况。
 * 练习 id：quiz:知识点（这一个单元）或 quiz:term:学科:年级:上/下（本学期综合，最多 5 个知识点各 2 道）。
 * 题目 id 仍是 kp:知识点:签名，记录照常归到知识点（掌握度、错题本、复习都算）。
 */
import type { Exercise, Subject } from '@/lesson/types';
import type { ProgressState } from '@/progress/model';
import { hash, seeded, shuffle } from '@/thinking/challenges';
import { hasGenerator } from './generators';
import { getKp, kpsFor, kpSubject } from './graph';
import { kpRoundWithReview } from './refill';

export const QUIZ_SIZE = 10;
/** 建议用时（分钟），只做提示，到时间不强制交卷 */
export const QUIZ_MINUTES = 15;

export const quizId = (kpId: string) => `quiz:${kpId}`;
export const termQuizId = (subject: Subject, grade: number, term: '上' | '下') => `quiz:term:${subject}:${grade}:${term}`;
export const isQuizId = (id: string) => id.startsWith('quiz:');

export function parseQuizId(id: string): { kind: 'kp'; kp: string } | { kind: 'term'; subject: Subject; grade: number; term: '上' | '下' } | null {
  const t = /^quiz:term:(math|chinese|english):(\d):(上|下)$/.exec(id);
  if (t) return { kind: 'term', subject: t[1] as Subject, grade: Number(t[2]), term: t[3] as '上' | '下' };
  const k = /^quiz:([a-z]\d\.[\w]+)$/.exec(id);
  return k && getKp(k[1]) ? { kind: 'kp', kp: k[1] } : null;
}

export function quizTitle(id: string): string {
  const q = parseQuizId(id);
  if (!q) return '单元小测';
  return q.kind === 'kp' ? `单元小测 · ${getKp(q.kp)!.name}` : `本学期综合小测（${q.grade}年级${q.term}册）`;
}

/** 本学期（上 / 下册）有题可做的知识点 */
export const termKps = (subject: Subject, grade: number, term: '上' | '下') =>
  kpsFor(subject, grade).filter((k) => k.term === term && hasGenerator(k.id));

/** 出题：单元小测出这一个知识点的 10 道（先出没做过的）；综合小测按日期挑 5 个知识点各 2 道 */
export function quizRound(id: string, state: ProgressState, now: number): { subject: Subject; exercises: Exercise[] } | null {
  const q = parseQuizId(id);
  if (!q) return null;
  const rand = seeded(hash(`${id}#${now}`));
  if (q.kind === 'kp') return { subject: kpSubject(getKp(q.kp)!), exercises: kpRoundWithReview(state, q.kp, QUIZ_SIZE, rand) };
  const kps = shuffle(termKps(q.subject, q.grade, q.term), rand).slice(0, 5);
  if (!kps.length) return null;
  const per = Math.ceil(QUIZ_SIZE / kps.length);
  const out: Exercise[] = [];
  for (const k of kps) out.push(...kpRoundWithReview(state, k.id, per, rand));
  return { subject: q.subject, exercises: shuffle(out.slice(0, QUIZ_SIZE), rand) };
}

export interface QuizAnswer {
  exerciseId: string;
  firstTryCorrect: boolean;
}

/** 交卷：百分制得分、每个知识点答对几道 */
export function quizResult(answers: QuizAnswer[]) {
  const right = answers.filter((a) => a.firstTryCorrect).length;
  const byKp = new Map<string, { right: number; total: number }>();
  for (const a of answers) {
    const kp = /^kp:([a-z]\d\.[\w]+):/.exec(a.exerciseId)?.[1] ?? '其他';
    const x = byKp.get(kp) ?? { right: 0, total: 0 };
    x.total++;
    if (a.firstTryCorrect) x.right++;
    byKp.set(kp, x);
  }
  return {
    score: answers.length ? Math.round((right / answers.length) * 100) : 0,
    right,
    total: answers.length,
    kps: [...byKp].map(([kp, x]) => ({ kp, name: getKp(kp)?.name ?? kp, ...x })).sort((a, b) => a.right / a.total - b.right / b.total),
  };
}
