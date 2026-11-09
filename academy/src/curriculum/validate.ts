import type { Lesson } from './types';
import { GRADE_PLANS, LESSONS } from './catalog';
import { compress, shortestSolution } from '../learning/blocks';

// Phrases the accuracy checklist forbids (they teach a wrong idea of AI).
const FORBIDDEN_PHRASES = ['什么都知道', '像人一样看懂', '永远正确', 'AI 有感情', 'AI 是活的'];

/** Checks every lesson has the 12 required fields and consistent references. Returns problems; empty = valid. */
export function validateLesson(lesson: Lesson, allLessonIds: Set<string>, allKpIds: Set<string>): string[] {
  const p: string[] = [];
  const at = (msg: string) => p.push(`${lesson.id}: ${msg}`);
  if (!lesson.title) at('missing title');
  if (lesson.goals.length < 1) at('课程目标 missing');
  for (const pre of lesson.prerequisites) if (!allLessonIds.has(pre)) at(`前置课 ${pre} does not exist`);
  if (lesson.knowledgePoints.length < 2 || lesson.knowledgePoints.length > 4) at('知识点 must be 2–4');
  for (const kp of lesson.knowledgePoints) for (const pre of kp.prerequisites) if (!allKpIds.has(pre)) at(`knowledge point ${kp.id} prerequisite ${pre} does not exist`);
  if (lesson.lifeExamples.length < 1) at('生活案例 missing');
  const kinds = lesson.steps.map((s) => s.kind);
  if (!kinds.includes('explain')) at('教学内容 (explain) missing');
  if (lesson.steps.some((s) => s.kind === 'explain' && !s.visual)) at('可视化讲解 missing on an explain step');
  if (!['sort', 'order', 'blocks', 'trainlab'].some((k) => kinds.includes(k as never))) at('互动实验 (sort/order/blocks/trainlab) missing');
  if (!kinds.includes('think')) at('思考题 missing');
  if (!kinds.includes('task') && !kinds.includes('project')) at('实践任务 missing');
  if (!kinds.includes('quiz')) at('练习题 missing');
  if (lesson.rubric.length !== 4 || lesson.rubric.some((r) => !r)) at('评价标准 must have 4 levels');
  if (!lesson.parentGuide.summary || !lesson.parentGuide.homeActivity) at('家长指导 missing');

  const stepIds = new Set<string>();
  for (const s of lesson.steps) {
    if (stepIds.has(s.id)) at(`duplicate step id ${s.id}`);
    stepIds.add(s.id);
    if (s.kind === 'quiz') {
      if (s.questions.length < 4 || s.questions.length > 8) at(`quiz ${s.id} must have 4–8 questions`);
      for (const q of s.questions) {
        if (!q.options.some((o) => o.id === q.answer)) at(`question ${q.id} answer not among options`);
        if (new Set(q.options.map((o) => o.id)).size !== q.options.length) at(`question ${q.id} duplicate option ids`);
        for (const kp of q.knowledgePoints) if (!allKpIds.has(kp)) at(`question ${q.id} unknown knowledge point ${kp}`);
      }
    }
    if (s.kind === 'sort') {
      if (!s.items.some((i) => i.bin === 'a') || !s.items.some((i) => i.bin === 'b')) at(`sort ${s.id} must use both bins`);
      for (const kp of s.knowledgePoints) if (!allKpIds.has(kp)) at(`sort ${s.id} unknown knowledge point ${kp}`);
    }
    if (s.kind === 'trainlab') for (const kp of s.knowledgePoints) if (!allKpIds.has(kp)) at(`trainlab ${s.id} unknown knowledge point ${kp}`);
    if (s.kind === 'blocks') {
      for (const kp of s.knowledgePoints) if (!allKpIds.has(kp)) at(`blocks ${s.id} unknown knowledge point ${kp}`);
      for (const lv of s.levels) {
        const sol = shortestSolution(lv);
        if (!sol) at(`blocks level ${lv.id} cannot be solved`);
        else {
          const need = s.allowRepeat ? compress(sol).length : sol.length;
          if (need > lv.maxBlocks) at(`blocks level ${lv.id} needs ${need} blocks but allows ${lv.maxBlocks}`);
        }
      }
    }
    if (s.kind === 'order') {
      if (s.steps.length < 3) at(`order ${s.id} needs at least 3 steps`);
      for (const kp of s.knowledgePoints) if (!allKpIds.has(kp)) at(`order ${s.id} unknown knowledge point ${kp}`);
    }
  }
  for (const q of lesson.review ?? []) {
    if (!q.options.some((o) => o.id === q.answer)) at(`review question ${q.id} answer not among options`);
    if (!q.knowledgePoints.length) at(`review question ${q.id} has no knowledge point`);
    for (const kp of q.knowledgePoints) if (!allKpIds.has(kp)) at(`review question ${q.id} unknown knowledge point ${kp}`);
  }
  for (const s of lesson.steps) if (s.kind === 'project') for (const kp of s.knowledgePoints ?? []) if (!allKpIds.has(kp)) at(`project ${s.id} unknown knowledge point ${kp}`);
  const text = JSON.stringify(lesson);
  // Any AI answer shown to children must be a labelled, pre-written example.
  for (const m of text.matchAll(/AI 回答[：:]/g)) {
    const before = text.slice(Math.max(0, (m.index ?? 0) - 4), m.index);
    if (!before.includes('示例')) at('an "AI 回答" is shown without the "示例" label');
  }
  for (const phrase of FORBIDDEN_PHRASES) if (text.includes(phrase)) at(`contains forbidden phrase "${phrase}"`);
  if (!lesson.reviewed) at('not yet reviewed against the accuracy checklist');
  return p;
}

export function validateCurriculum(): string[] {
  const ids = new Set(LESSONS.map((l) => l.id));
  const kpIds = new Set(LESSONS.flatMap((l) => l.knowledgePoints.map((k) => k.id)));
  const problems: string[] = [];
  if (ids.size !== LESSONS.length) problems.push('duplicate lesson ids');
  const allKps = LESSONS.flatMap((l) => l.knowledgePoints.map((k) => k.id));
  if (new Set(allKps).size !== allKps.length) problems.push('duplicate knowledge point ids');
  for (const lesson of LESSONS) problems.push(...validateLesson(lesson, ids, kpIds));
  const questionIds = LESSONS.flatMap((l) => [...l.steps.flatMap((s) => (s.kind === 'quiz' ? s.questions.map((q) => q.id) : [])), ...(l.review ?? []).map((q) => q.id)]);
  const dupQ = questionIds.filter((id, i) => questionIds.indexOf(id) !== i);
  if (dupQ.length) problems.push(`duplicate question ids: ${dupQ.join(', ')}`);
  // Creation knowledge points are evidenced by the child's works, not by questions.
  const creationKps = new Set(LESSONS.flatMap((l) => l.knowledgePoints.filter((k) => k.dimension === 'creation').map((k) => k.id)));
  for (const kp of kpIds) {
    if (creationKps.has(kp)) continue;
    const hasReview = LESSONS.some((l) => (l.review ?? []).some((q) => q.knowledgePoints.includes(kp)) || l.steps.some((s) => s.kind === 'quiz' && s.questions.some((q) => q.knowledgePoints.includes(kp))));
    if (!hasReview) problems.push(`knowledge point ${kp} has no question, so it can never be reviewed`);
  }
  for (const plan of GRADE_PLANS) {
    const count = LESSONS.filter((l) => l.grade === plan.grade).length;
    if (plan.available && count !== plan.lessonTitles.length) problems.push(`grade ${plan.grade} is available but has ${count}/${plan.lessonTitles.length} lessons`);
    if (!plan.available && count > 0) problems.push(`grade ${plan.grade} has lessons but is marked unavailable`);
  }
  return problems;
}
