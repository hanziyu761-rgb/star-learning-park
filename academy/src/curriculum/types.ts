// Curriculum data model. Course content is read-only, versioned and shipped
// with the code. Learning data is produced only by the child's real actions
// (see store/), never by this file.

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

/** The five ability dimensions (五维能力). */
export type Dimension = 'cognition' | 'application' | 'computational' | 'critical' | 'creation';

export const DIMENSIONS: { id: Dimension; name: string }[] = [
  { id: 'cognition', name: 'AI 认知能力' },
  { id: 'application', name: 'AI 应用能力' },
  { id: 'computational', name: '计算思维能力' },
  { id: 'critical', name: '批判性思维能力' },
  { id: 'creation', name: 'AI 创造能力' },
];

/** The four growth levels; 0 means not started. */
export const LEVEL_NAMES = ['未开始', '初步接触', '基本掌握', '独立应用', '创造迁移'] as const;
export type Level = 0 | 1 | 2 | 3 | 4;

/** The nine top-level modules (一级功能模块). */
export type ModuleId =
  | 'enlighten' | 'apply' | 'principle' | 'coding' | 'agent' | 'create' | 'safety';

export const MODULES: { id: ModuleId; name: string; icon: string }[] = [
  { id: 'enlighten', name: 'AI 启蒙课堂', icon: '🌱' },
  { id: 'apply', name: 'AI 应用学院', icon: '🧰' },
  { id: 'principle', name: 'AI 原理实验室', icon: '🔬' },
  { id: 'coding', name: 'AI 编程学院', icon: '🧩' },
  { id: 'agent', name: 'AI 智能体工坊', icon: '🤖' },
  { id: 'create', name: 'AI 创造中心', icon: '🎨' },
  { id: 'safety', name: 'AI 安全学院', icon: '🛡️' },
];

export interface KnowledgePoint {
  id: string;
  name: string;
  dimension: Dimension;
  prerequisites: string[];
}

/** One screen of explanation, read aloud for younger grades. */
export interface ExplainStep {
  kind: 'explain';
  id: string;
  title: string;
  text: string;
  /** Emoji illustration: the visual explanation for this step. */
  visual: string;
}

export interface SortItem { id: string; label: string; icon: string; bin: 'a' | 'b'; why: string }
export interface SortActivity {
  kind: 'sort';
  id: string;
  title: string;
  instruction: string;
  bins: { a: { label: string; icon: string }; b: { label: string; icon: string } };
  items: SortItem[];
  knowledgePoints: string[];
}

export interface OrderActivity {
  kind: 'order';
  id: string;
  title: string;
  instruction: string;
  /** Steps in the correct order. Shown shuffled. */
  steps: { id: string; label: string; icon: string }[];
  explain: string;
  knowledgePoints: string[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string; icon?: string }[];
  answer: string;
  explain: string;
  knowledgePoints: string[];
}
export interface QuizActivity { kind: 'quiz'; id: string; title: string; questions: QuizQuestion[] }

/** An open thinking question. The child's choice is recorded, never graded. */
export interface ThinkActivity {
  kind: 'think';
  id: string;
  title: string;
  question: string;
  choices: { id: string; label: string }[];
  /** What a teacher would say after the child answers. */
  discussion: string;
}

/** A hands-on task done away from the screen; completion is self-reported. */
export interface TaskActivity {
  kind: 'task';
  id: string;
  title: string;
  instruction: string;
}

export type Activity = ExplainStep | SortActivity | OrderActivity | QuizActivity | ThinkActivity | TaskActivity | ProjectActivity;

export interface ProjectActivity {
  kind: 'project';
  id: string;
  title: string;
  instruction: string;
  /** Which built-in project editor to open. */
  editor: 'robot-designer' | 'fruit-trainer';
  /** Knowledge points this project gives evidence for. */
  knowledgePoints?: string[];
}

/** Rubric: what each of the four growth levels looks like for this lesson. */
export type Rubric = [string, string, string, string];

export interface Lesson {
  id: string;
  grade: Grade;
  order: number;
  module: ModuleId;
  title: string;
  icon: string;
  minutes: number;
  /** 课程目标 */
  goals: string[];
  /** 前置知识：lesson ids */
  prerequisites: string[];
  /** 知识点 */
  knowledgePoints: KnowledgePoint[];
  /** 生活案例 */
  lifeExamples: { icon: string; text: string }[];
  /** 教学内容 + 可视化讲解 (explain steps) followed by activities. */
  steps: Activity[];
  /** 评价标准 */
  rubric: Rubric;
  /** 家长指导 */
  parentGuide: { summary: string; homeActivity: string };
  /** Lessons whose wording passed the accuracy checklist. */
  reviewed: boolean;
  /** Extra questions used only in review sessions, so review is not just a repeat of the lesson quiz. */
  review?: QuizQuestion[];
}

export interface GradePlan {
  grade: Grade;
  theme: string;
  goal: string;
  project: string;
  /** Lesson titles from the six-year map. Lessons without content are listed here only. */
  lessonTitles: string[];
  available: boolean;
}
