import type { Grade } from '../curriculum/types';

export interface Learner {
  id: string;
  /** A nickname only — never a real name. */
  nickname: string;
  avatar: string;
  grade: Grade;
  createdAt: string;
}

/** How a result was produced. V1 has only local (no AI involved). */
export type RunMode = 'local' | 'simulated' | 'demo' | 'model';

interface EventBase {
  id: string;
  learnerId: string;
  at: string;
  lessonId: string;
  /** Milliseconds the child was actively on screen since the previous event of this lesson session. */
  activeMs: number;
  mode: RunMode;
}

export type LearningEvent = EventBase & (
  | { type: 'lesson_start' }
  | { type: 'step_done'; stepId: string; kind: string }
  | { type: 'answer'; stepId: string; questionId: string; knowledgePoints: string[]; choice: string; correct: boolean; attemptNo: number }
  | { type: 'experiment'; stepId: string; kind: 'sort' | 'order' | 'simulate' | 'blocks'; knowledgePoints: string[]; total: number; mistakes: number }
  | { type: 'think'; stepId: string; choiceId: string }
  | { type: 'task'; stepId: string; selfReported: true }
  | { type: 'project_saved'; stepId: string; workId: string }
  | { type: 'lesson_complete' }
);

export type LearningEventType = LearningEvent['type'];

/** Who produced each part of a work. Only child parts count toward the child's creation ability. */
export type Contributor = 'child' | 'ai' | 'template' | 'child_edited_ai';

export interface WorkPart {
  field: string;
  label: string;
  value: string;
  by: Contributor;
}

export interface Work {
  id: string;
  learnerId: string;
  lessonId: string;
  type: 'robot' | 'fruit-ai' | 'prompt-card';
  title: string;
  parts: WorkPart[];
  /** Made with a parent present (accompanied mode). Always false in V1. */
  accompanied: boolean;
  /** Sharing is off by default and cannot be turned on in V1. */
  shared: false;
  createdAt: string;
  updatedAt: string;
}

export interface ParentSettings {
  /** Daily study reminder in minutes; 0 = no reminder. */
  dailyMinutes: number;
  readAloud: boolean;
  pinyin: boolean;
  /** Features below are locked off in V1 and shown as such. */
  voiceInput: false;
  imageUpload: false;
  sharing: false;
  accompaniedMode: false;
}

export const DEFAULT_SETTINGS: ParentSettings = {
  dailyMinutes: 20,
  readAloud: true,
  pinyin: true,
  voiceInput: false,
  imageUpload: false,
  sharing: false,
  accompaniedMode: false,
};

export interface SafetyEvent {
  id: string;
  learnerId: string | null;
  at: string;
  /** Category only; the child's original input is never stored. */
  category: 'privacy';
  where: string;
}
