import { addDays, buildReviewSession, dueKnowledgePoints, reviewStates, weakPrerequisites } from '../src/learning/review';
import { accuracy, distance, mislabeled, predict, TEST_SET, TRAINING_SET, type FruitLabel } from '../src/learning/simulator';
import { allKnowledgePoints, findLesson, LESSONS } from '../src/curriculum/catalog';
import type { LearningEvent } from '../src/store/types';

let n = 0;
const at = (day: string) => new Date(`${day}T10:00:00`).toISOString();
const answer = (day: string, kp: string, correct: boolean, attemptNo = 1, q = 'q' + ++n): LearningEvent =>
  ({ id: 'e' + ++n, learnerId: 'L', at: at(day), lessonId: 'g2-l1', activeMs: 0, mode: 'local', type: 'answer', stepId: 's', questionId: q, knowledgePoints: [kp], choice: 'a', correct, attemptNo });

describe('spaced review', () => {
  it('adds calendar days correctly across months', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02');
  });

  it('a passed day schedules tomorrow, then 3, 7, 14, 30 days', () => {
    const kp = 'g2-kp-data';
    const days = ['2026-11-01', '2026-11-02', '2026-11-05', '2026-11-12', '2026-11-26'];
    const expected = ['2026-11-02', '2026-11-05', '2026-11-12', '2026-11-26', '2026-12-26'];
    const events: LearningEvent[] = [];
    days.forEach((d, i) => {
      events.push(answer(d, kp, true));
      expect(reviewStates(events).get(kp)!.dueDay).toBe(expected[i]);
    });
  });

  it('a failed day resets to tomorrow', () => {
    const kp = 'g2-kp-data';
    const s = reviewStates([answer('2026-11-01', kp, true), answer('2026-11-02', kp, true), answer('2026-11-05', kp, false)]).get(kp)!;
    expect(s).toMatchObject({ streak: 0, lastPassed: false, dueDay: '2026-11-06' });
  });

  it('a day passes at 75% first-attempt accuracy; retries do not count', () => {
    const kp = 'g2-kp-data';
    const day = '2026-11-01';
    const three = [answer(day, kp, true), answer(day, kp, true), answer(day, kp, true), answer(day, kp, false)];
    expect(reviewStates(three).get(kp)!.lastPassed).toBe(true);
    const half = [answer(day, kp, true), answer(day, kp, false), answer(day, kp, true, 2)];
    expect(reviewStates(half).get(kp)!.lastPassed).toBe(false);
  });

  it('only due knowledge points are offered, overdue first', () => {
    const events = [answer('2026-11-01', 'g2-kp-data', false), answer('2026-11-03', 'g2-kp-label', true)];
    expect(dueKnowledgePoints(events, '2026-11-02').map((s) => s.kpId)).toEqual(['g2-kp-data']);
    expect(dueKnowledgePoints(events, '2026-11-04').map((s) => s.kpId)).toEqual(['g2-kp-data', 'g2-kp-label']);
  });

  it('a session picks one question per knowledge point, preferring unseen review questions', () => {
    const items = buildReviewSession(['g2-kp-data', 'g2-kp-label'], LESSONS, []);
    expect(items.map((i) => i.kpId)).toEqual(['g2-kp-data', 'g2-kp-label']);
    expect(items[0].question.id.startsWith('r')).toBe(true);
    const seen = answer('2026-11-01', 'g2-kp-data', true, 1, items[0].question.id);
    expect(buildReviewSession(['g2-kp-data'], LESSONS, [seen])[0].question.id).not.toBe(items[0].question.id);
  });

  it('weak prerequisites are found across lessons', () => {
    const lesson = findLesson('g2-l3')!; // needs g1-kp-labels and g2-kp-data
    const weak = weakPrerequisites(lesson, allKnowledgePoints(), [answer('2026-11-01', 'g1-kp-labels', false)]);
    expect(weak.find((w) => w.kp.id === 'g1-kp-labels')?.reason).toBe('weak');
    expect(weak.find((w) => w.kp.id === 'g2-kp-data')?.reason).toBe('not-learned');
  });
});

describe('fruit training simulator', () => {
  const correct = Object.fromEntries(TRAINING_SET.map((t) => [t.id, t.truth])) as Record<string, FruitLabel>;

  it('test fruits are not in the training set', () => {
    const seen = new Set(TRAINING_SET.map((t) => `${t.color}${t.shape}${t.size}`));
    for (const x of TEST_SET) expect(seen.has(`${x.color}${x.shape}${x.size}`)).toBe(false);
  });

  it('correct labels give 100% on the unseen test fruits', () => {
    const p = predict(correct);
    expect(accuracy(p)).toBe(1);
    expect(mislabeled(correct)).toHaveLength(0);
  });

  it('a wrong label makes accuracy drop, and fixing it brings it back', () => {
    const wrong = { ...correct, t2: '香蕉' as FruitLabel }; // 青苹果 labelled as banana
    const p = predict(wrong);
    expect(accuracy(p)).toBe(0.75);
    expect(p.find((x) => x.sample.id === 'x1')).toMatchObject({ predicted: '香蕉', correct: false });
    expect(mislabeled(wrong).map((t) => t.name)).toEqual(['青苹果']);
    expect(accuracy(predict(correct))).toBe(1);
  });

  it('distance treats colour and shape as stronger than size', () => {
    const [redApple, , bigRed, banana] = TRAINING_SET;
    expect(distance(redApple, bigRed)).toBe(0.5);
    expect(distance(redApple, banana)).toBe(2);
  });
});
