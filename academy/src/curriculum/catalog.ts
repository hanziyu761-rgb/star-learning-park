import type { Grade, GradePlan, Lesson, KnowledgePoint } from './types';
import { GRADE1 } from './grade1';
import { GRADE1_REVIEW } from './grade1-review';
import { GRADE2 } from './grade2';
import { GRADE2_REVIEW } from './grade2-review';
import { GRADE3 } from './grade3';
import { GRADE3_REVIEW } from './grade3-review';
import { GRADE4 } from './grade4';
import { GRADE4_REVIEW } from './grade4-review';

export const CURRICULUM_VERSION = '2.0.0-g4';

// The six-year map. Grades 5–6 list their lessons but have no playable content
// yet (later V2.x rounds). They are shown as "即将上线", never with placeholder lessons.
export const GRADE_PLANS: GradePlan[] = [
  {
    grade: 1, theme: 'AI 小小探索家', goal: '认识人工智能', project: '设计我的智能机器人', available: true,
    lessonTitles: GRADE1.map((l) => l.title),
  },
  {
    grade: 2, theme: 'AI 小小训练师', goal: '理解 AI 学习的基本过程', project: '模拟训练水果识别 AI', available: true,
    lessonTitles: GRADE2.map((l) => l.title),
  },
  {
    grade: 3, theme: 'AI 小小应用师', goal: '学会有效使用 AI', project: '设计我的 AI 故事助手（提示词卡片）', available: true,
    lessonTitles: GRADE3.map((l) => l.title),
  },
  {
    grade: 4, theme: 'AI 小小研究员', goal: '理解人工智能基本原理', project: '制作智能分类游戏', available: true,
    lessonTitles: GRADE4.map((l) => l.title),
  },
  {
    grade: 5, theme: 'AI 小小工程师', goal: '学习编程和 AI 应用开发', project: '制作 AI 英语学习助手', available: false,
    lessonTitles: ['Python 入门', '变量', '数据类型', '条件判断', '循环', '函数', '算法', '神经网络基础概念', '大语言模型', 'API 基础', 'AI 应用开发'],
  },
  {
    grade: 6, theme: 'AI 小小创造家', goal: '能够独立完成 AI 项目', project: '设计并完成一个自己的 AI 产品', available: false,
    lessonTitles: ['Python 项目开发', '机器学习进阶', '大语言模型原理', '多模态 AI', 'AI Agent', '工具调用', '知识库', 'RAG 入门', 'AI 产品设计', '数据安全', 'AI 伦理'],
  },
];

const REVIEW: Record<string, Lesson['review']> = { ...GRADE1_REVIEW, ...GRADE2_REVIEW, ...GRADE3_REVIEW, ...GRADE4_REVIEW };

export const LESSONS: Lesson[] = [...GRADE1, ...GRADE2, ...GRADE3, ...GRADE4].map((l) => ({ ...l, review: REVIEW[l.id] ?? l.review }));

export function lessonsForGrade(grade: Grade): Lesson[] {
  return LESSONS.filter((l) => l.grade === grade).sort((a, b) => a.order - b.order);
}

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function gradePlan(grade: Grade): GradePlan {
  return GRADE_PLANS.find((g) => g.grade === grade)!;
}

export function allKnowledgePoints(): KnowledgePoint[] {
  return LESSONS.flatMap((l) => l.knowledgePoints);
}

export function findKnowledgePoint(id: string): KnowledgePoint | undefined {
  return allKnowledgePoints().find((k) => k.id === id);
}
