/**
 * “接着学”（V4.2）：每一科下一步该学什么。首页“今天的任务”和学科页顶部都用它，
 * 不再总是指向第一节（已经学完的）课。纯函数，只看真实学习记录。
 *
 * 顺序：1. 学到一半的课 → 2. 还没学过的课（按课程顺序）→ 3. 知识图谱推荐的知识点
 *（需要复习的优先，其次没学过的新本领）→ 4. 都学完了：回到第一节课温习。
 */
import { lessonsFor } from '@/content';
import { zh } from '@/content/zh';
import { getKp } from '@/knowledge/graph';
import { computeMastery } from '@/knowledge/mastery';
import { recommendKps } from '@/knowledge/recommend';
import type { DisplayText, Subject } from '@/lesson/types';
import type { Route } from '@/nav/Nav';
import type { ProgressState } from './model';

export type NextKind = 'resume' | 'lesson' | 'review' | 'new' | 'again';

export interface NextUp {
  kind: NextKind;
  emoji: string;
  title: DisplayText;
  route: Route;
}

export const NEXT_LABEL: Record<NextKind, ReturnType<typeof zh>> = {
  resume: zh('继续学习', 'jì xù xué xí'),
  lesson: zh('开始学习', 'kāi shǐ xué xí'),
  review: zh('再练一练', 'zài liàn yi liàn'),
  new: zh('学新本领', 'xué xīn běn lǐng'),
  again: zh('再学一次', 'zài xué yí cì'),
};

export function nextUp(state: ProgressState, subject: Subject, now: number): NextUp | null {
  const lessons = lessonsFor(subject);
  const active = lessons.find((l) => l.id === state.active?.lessonId);
  if (active) return { kind: 'resume', emoji: active.emoji, title: active.title, route: { name: 'lesson', id: active.id, resume: true } };

  const fresh = lessons.find((l) => !(state.lessons[l.id]?.completedCount ?? 0));
  if (fresh) return { kind: 'lesson', emoji: fresh.emoji, title: fresh.title, route: { name: 'lesson', id: fresh.id } };

  const recs = recommendKps(state, computeMastery(state, now), now, 12, { subject });
  const rec = recs.find((r) => r.kind === 'review' || r.kind === 'consolidate') ?? recs.find((r) => r.kind === 'new');
  const kp = rec && getKp(rec.kpId);
  if (rec && kp) {
    return {
      kind: rec.kind === 'new' ? 'new' : 'review',
      emoji: kp.emoji,
      title: kp.kidPy ? zh(kp.kidName, kp.kidPy) : kp.kidName,
      route: { name: 'practice', id: `kp:${kp.id}` },
    };
  }
  const first = lessons[0];
  return first ? { kind: 'again', emoji: first.emoji, title: first.title, route: { name: 'lesson', id: first.id } } : null;
}
