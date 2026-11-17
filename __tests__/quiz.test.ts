/** V5.4 单元小测 */
import { resolveExercise, sourceName } from '@/content/resolve';
import { getKp } from '@/knowledge/graph';
import { kpForRecord } from '@/knowledge/mapping';
import { parseQuizId, quizId, quizResult, quizRound, termKps, termQuizId } from '@/knowledge/quiz';
import { createEmptyProgress } from '@/progress/model';

const NOW = new Date(2026, 10, 17, 9).getTime();

describe('单元小测', () => {
  it('单个单元：10 道这个知识点的题，题目不重复', () => {
    const r = quizRound(quizId('m7.a2'), createEmptyProgress(), NOW)!;
    expect(r.subject).toBe('math');
    expect(r.exercises).toHaveLength(10);
    expect(new Set(r.exercises.map((e) => e.id.replace(/:in$/, ''))).size).toBe(10);
    expect(r.exercises.every((e) => e.id.startsWith('kp:m7.a2:'))).toBe(true);
  });
  it('本学期综合：只出这一册的知识点，最多 10 道', () => {
    for (const [subject, grade, term] of [['math', 8, '上'], ['chinese', 3, '下'], ['english', 9, '上']] as const) {
      const r = quizRound(termQuizId(subject, grade, term), createEmptyProgress(), NOW)!;
      expect(r.exercises.length).toBeGreaterThanOrEqual(8);
      expect(r.exercises.length).toBeLessThanOrEqual(10);
      const ok = new Set(termKps(subject, grade, term).map((k) => k.id));
      for (const e of r.exercises) expect(ok.has(e.id.split(':')[1])).toBe(true);
    }
  });
  it('得分按第一次作答算百分制；每个知识点答对几道，错得多的排前面', () => {
    const r = quizResult([
      { exerciseId: 'kp:m7.a2:add:1:2', firstTryCorrect: true },
      { exerciseId: 'kp:m7.a2:add:3:4', firstTryCorrect: false },
      { exerciseId: 'kp:m7.a1:x', firstTryCorrect: true },
      { exerciseId: 'kp:m7.a1:y', firstTryCorrect: true },
    ]);
    expect(r.score).toBe(75);
    expect(r.kps.map((k) => [k.kp, k.right, k.total])).toEqual([['m7.a2', 1, 2], ['m7.a1', 2, 2]]);
  });
  it('小测的记录归到知识点；错题本能还原题目、显示来源', () => {
    const id = termQuizId('math', 7, '上');
    const ex = quizRound(id, createEmptyProgress(), NOW)!.exercises[0];
    const kp = ex.id.split(':')[1];
    expect(kpForRecord(id, ex.id, ex.skill)).toBe(kp);
    const r = resolveExercise(id, ex.id.replace(/:in$/, ''))!;
    expect(r.subject).toBe('math');
    expect(sourceName(id)).toBe('本学期综合小测（7年级上册）');
    expect(sourceName(quizId('m7.a2'))).toBe(`单元小测 · ${getKp('m7.a2')!.name}`);
    expect(parseQuizId('quiz:乱写')).toBeNull();
  });
});
