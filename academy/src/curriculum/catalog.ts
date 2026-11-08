import type { Grade, GradePlan, Lesson, KnowledgePoint } from './types';
import { GRADE1 } from './grade1';

export const CURRICULUM_VERSION = '1.0.0';

// The six-year map. Grades 2–6 list their lessons but have no playable content
// yet (V2.0). They are shown as "即将上线", never with placeholder lessons.
export const GRADE_PLANS: GradePlan[] = [
  {
    grade: 1, theme: 'AI 小小探索家', goal: '认识人工智能', project: '设计我的智能机器人', available: true,
    lessonTitles: GRADE1.map((l) => l.title),
  },
  {
    grade: 2, theme: 'AI 小小训练师', goal: '理解 AI 学习的基本过程', project: '模拟训练水果识别 AI', available: false,
    lessonTitles: ['数据是什么？', '数据分类', '图片标签', 'AI 如何认识动物？', '语音识别体验', '简单条件判断', '如何给 AI 下指令'],
  },
  {
    grade: 3, theme: 'AI 小小应用师', goal: '学会有效使用 AI', project: '制作 AI 故事助手（家长陪同）', available: false,
    lessonTitles: ['如何提出好问题？', '提示词是什么？', '如何优化提示词？', 'AI 辅助语文学习', 'AI 辅助数学学习', 'AI 辅助英语学习', '算法和逻辑', 'AI 生成内容的判断', '图形化编程入门'],
  },
  {
    grade: 4, theme: 'AI 小小研究员', goal: '理解人工智能基本原理', project: '制作智能分类游戏', available: false,
    lessonTitles: ['机器学习', '训练数据与测试数据', '模型和预测', '数据偏差', 'AI 为什么会犯错？', 'AI 信息验证', '图形化编程进阶', '简单分类算法'],
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

export const LESSONS: Lesson[] = [...GRADE1];

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
