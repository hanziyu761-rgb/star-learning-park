import { validateCurriculum } from '../src/curriculum/validate';
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

  it('grades 2–6 are marked unavailable and have no placeholder lessons', () => {
    for (const g of [2, 3, 4, 5, 6] as const) {
      expect(GRADE_PLANS.find((p) => p.grade === g)!.available).toBe(false);
      expect(LESSONS.filter((l) => l.grade === g)).toHaveLength(0);
    }
  });

  it('grade 3 includes the added visual-programming intro lesson', () => {
    expect(GRADE_PLANS.find((p) => p.grade === 3)!.lessonTitles).toContain('图形化编程入门');
  });
});
