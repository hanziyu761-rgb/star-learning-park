import { abilityLevels, childShare, knowledgePointMastery } from '../src/learning/abilities';
import { ActiveTimer } from '../src/learning/recorder';
import { lessonProgress, nextLesson, missingPrerequisites, dailyMinutes, localDay } from '../src/learning/progress';
import { achievements } from '../src/learning/achievements';
import { allKnowledgePoints, lessonsForGrade, LESSONS, findLesson } from '../src/curriculum/catalog';
import type { LearningEvent, Work } from '../src/store/types';

let n = 0;
const base = (over: object) => ({ id: 'e' + ++n, learnerId: 'L', at: new Date(2026, 10, 9, 10, n).toISOString(), lessonId: 'g1-l1', activeMs: 60000, mode: 'local', ...over }) as LearningEvent;
const answer = (q: string, kps: string[], correct: boolean, attemptNo = 1, lessonId = 'g1-l1') => base({ type: 'answer', stepId: 'q1', questionId: q, knowledgePoints: kps, choice: 'a', correct, attemptNo, lessonId });

describe('progress', () => {
  const g1 = lessonsForGrade(1);
  it('a lesson is complete only after lesson_complete', () => {
    const l = g1[0];
    const events = [base({ type: 'lesson_start' }), base({ type: 'step_done', stepId: 's1', kind: 'explain' })];
    expect(lessonProgress(l, events)).toMatchObject({ started: true, completed: false, activeMs: 120000 });
    expect(lessonProgress(l, [...events, base({ type: 'lesson_complete' })]).completed).toBe(true);
  });

  it('continue-learning picks the unfinished lesson, then the first not completed', () => {
    expect(nextLesson(g1, [])).toEqual({ lesson: g1[0], resume: false });
    const started = [base({ type: 'lesson_start', lessonId: 'g1-l3' })];
    expect(nextLesson(g1, started)!.lesson.id).toBe('g1-l3');
    const done = g1.map((l) => base({ type: 'lesson_complete', lessonId: l.id }));
    expect(nextLesson(g1, done)).toBeNull();
  });

  it('reports prerequisites that are not completed', () => {
    const l7 = findLesson('g1-l7')!;
    expect(missingPrerequisites(l7, LESSONS, []).map((l) => l.id)).toEqual(['g1-l2']);
    expect(missingPrerequisites(l7, LESSONS, [base({ type: 'lesson_complete', lessonId: 'g1-l2' })])).toEqual([]);
  });

  it('daily minutes come only from recorded active time', () => {
    const now = new Date(2026, 10, 9, 20);
    const today = base({ type: 'lesson_start', at: new Date(2026, 10, 9, 9).toISOString(), activeMs: 5 * 60000 });
    const week = dailyMinutes([today], 7, now);
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toEqual({ day: localDay(now.toISOString()), minutes: 5 });
    expect(week.slice(0, 6).every((d) => d.minutes === 0)).toBe(true);
  });
});

describe('active time', () => {
  it('counts visible, recently-interacted time only', () => {
    let t = 0, visible = true;
    const timer = new ActiveTimer(() => t, () => visible);
    t = 3000; timer.tick();
    expect(timer.take()).toBe(3000);
    visible = false; t = 6000; timer.tick();
    expect(timer.take()).toBe(0);
    visible = true; t = 70000; timer.tick(); // idle for > 60s since last interaction
    expect(timer.take()).toBe(0);
    timer.interact(); t = 72000; timer.tick();
    expect(timer.take()).toBe(2000);
  });
});

describe('mastery and abilities', () => {
  const kps = allKnowledgePoints();

  it('only first attempts count toward mastery', () => {
    const events = [answer('q1-1', ['g1-kp-ai-program'], false, 1), answer('q1-1', ['g1-kp-ai-program'], true, 2)];
    const m = knowledgePointMastery(kps, events).get('g1-kp-ai-program')!;
    expect(m).toMatchObject({ attempts: 1, correct: 0, score: 0 });
  });

  it('no evidence means level 0, never a made-up level', () => {
    expect(abilityLevels(kps, [], []).every((r) => r.level === 0)).toBe(true);
  });

  it('cognition rises with first-try answers and a clean experiment', () => {
    const solid = [
      answer('a', ['g1-kp-ai-program'], true), answer('b', ['g1-kp-ai-program'], true),
      answer('c', ['g1-kp-ai-patterns'], true), answer('d', ['g1-kp-ai-patterns'], true),
    ];
    expect(abilityLevels(kps, solid, []).find((r) => r.dimension === 'cognition')!.level).toBe(2);
    const exp = base({ type: 'experiment', stepId: 'a1', kind: 'sort', knowledgePoints: ['g1-kp-ai-program'], total: 6, mistakes: 0 });
    const r = abilityLevels(kps, [...solid, exp], []).find((x) => x.dimension === 'cognition')!;
    expect(r.level).toBe(3);
    expect(r.evidence.length).toBeGreaterThan(0);
  });

  it('only the child\'s own parts count for creation', () => {
    const mk = (by: Work['parts'][number]['by'][]): Work => ({ id: 'w', learnerId: 'L', lessonId: 'g1-l7', type: 'robot', title: 't', accompanied: false, shared: false, createdAt: 'x', updatedAt: 'x',
      parts: by.map((b, i) => ({ field: i === 0 ? 'rule' : 'f' + i, label: '', value: 'abcd', by: b })) });
    const aiMade = mk(['ai', 'ai', 'ai', 'child']);
    expect(childShare(aiMade)).toBe(0.25);
    expect(abilityLevels(kps, [], [aiMade]).find((r) => r.dimension === 'creation')!.level).toBe(1);
    const own = mk(['child', 'child', 'child', 'template']);
    expect(abilityLevels(kps, [], [own]).find((r) => r.dimension === 'creation')!.level).toBe(3);
  });
});

describe('achievements', () => {
  it('are earned only from real events', () => {
    expect(achievements([], []).every((a) => a.earnedAt === null)).toBe(true);
    const a = achievements([base({ type: 'lesson_complete' })], []);
    expect(a.find((x) => x.id === 'first-lesson')!.earnedAt).not.toBeNull();
    expect(a.find((x) => x.id === 'grade1')!.earnedAt).toBeNull();
  });
});
