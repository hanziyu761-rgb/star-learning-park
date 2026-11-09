import { validateCurriculum, validateLesson } from '../src/curriculum/validate';
import { GRADE_PLANS, LESSONS, lessonsForGrade } from '../src/curriculum/catalog';

describe('curriculum', () => {
  it('every lesson passes the 12-field and reference checks', () => {
    expect(validateCurriculum()).toEqual([]);
  });

  it('grade 1 has all 7 lessons and the grade project', () => {
    const g1 = lessonsForGrade(1);
    expect(g1).toHaveLength(7);
    expect(g1.some((l) => l.steps.some((s) => s.kind === 'project'))).toBe(true);
  });

  it('the six-year map has 53 lessons in total', () => {
    expect(GRADE_PLANS.reduce((n, p) => n + p.lessonTitles.length, 0)).toBe(53);
  });

  it('grade 2 has all 7 lessons and the simulated training project', () => {
    const g2 = lessonsForGrade(2);
    expect(g2).toHaveLength(7);
    expect(g2.some((l) => l.steps.some((s) => s.kind === 'project' && s.editor === 'fruit-trainer'))).toBe(true);
  });

  it('every lesson in grades 1–2 has review-only questions', () => {
    for (const l of LESSONS) expect((l.review ?? []).length, l.id).toBeGreaterThanOrEqual(2);
  });

  it('grade 3 has all 9 lessons, the prompt-card project and a block-programming maze', () => {
    const g3 = lessonsForGrade(3);
    expect(g3).toHaveLength(9);
    expect(g3.some((l) => l.steps.some((s) => s.kind === 'project' && s.editor === 'prompt-card'))).toBe(true);
    expect(g3.some((l) => l.steps.some((s) => s.kind === 'blocks'))).toBe(true);
  });

  it('the validator catches an unlabelled AI answer and an unsolvable maze', () => {
    const base = lessonsForGrade(3).find((l) => l.id === 'g3-l9')!;
    const ids = new Set(LESSONS.map((l) => l.id));
    const kps = new Set(LESSONS.flatMap((l) => l.knowledgePoints.map((k) => k.id)));
    const unlabelled = { ...base, lifeExamples: [{ icon: '🤖', text: 'AI 回答：地球是方的。' }] };
    expect(validateLesson(unlabelled, ids, kps).join()).toMatch(/示例/);
    const blocked = { ...base, steps: base.steps.map((s) => s.kind === 'blocks'
      ? { ...s, levels: [{ id: 'bad', width: 3, height: 1, start: { x: 0, y: 0, dir: 1 as const }, goal: { x: 2, y: 0 }, walls: [{ x: 1, y: 0 }], maxBlocks: 5 }] }
      : s) };
    expect(validateLesson(blocked, ids, kps).join()).toMatch(/cannot be solved/);
  });

  it('grade 4 has all 8 lessons, both training-lab modes, a loop maze and the decision-tree project', () => {
    const g4 = lessonsForGrade(4);
    expect(g4).toHaveLength(8);
    const steps = g4.flatMap((l) => l.steps);
    expect(steps.filter((s) => s.kind === 'trainlab').map((s) => s.kind === 'trainlab' && s.preset).sort()).toEqual(['bias', 'exam']);
    expect(steps.some((s) => s.kind === 'blocks' && s.allowRepeat)).toBe(true);
    expect(steps.some((s) => s.kind === 'project' && s.editor === 'tree-game')).toBe(true);
  });

  it('grades 5 and 6 have 11 lessons each with their projects', () => {
    expect(lessonsForGrade(5)).toHaveLength(11);
    expect(lessonsForGrade(6)).toHaveLength(11);
    const steps = [...lessonsForGrade(5), ...lessonsForGrade(6)].flatMap((l) => l.steps);
    expect(steps.some((s) => s.kind === 'project' && s.editor === 'python-project')).toBe(true);
    expect(steps.some((s) => s.kind === 'project' && s.editor === 'product-canvas')).toBe(true);
    expect(steps.some((s) => s.kind === 'minilm')).toBe(true);
    expect(steps.some((s) => s.kind === 'retrieval')).toBe(true);
  });

  it('all six grades are available, 53 lessons in total', () => {
    expect(GRADE_PLANS.every((p) => p.available)).toBe(true);
    expect(LESSONS).toHaveLength(53);
  });

  it('grade 3 includes the added visual-programming intro lesson', () => {
    expect(GRADE_PLANS.find((p) => p.grade === 3)!.lessonTitles).toContain('图形化编程入门');
  });
});
