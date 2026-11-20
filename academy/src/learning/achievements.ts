import type { LearningEvent, Work } from '../store/types';
import { LESSONS } from '../curriculum/catalog';
import { lessonProgress } from './progress';

export interface Achievement { id: string; icon: string; name: string; how: string; earnedAt: string | null }

// Achievements reward real actions only and record when they happened.
export function achievements(events: LearningEvent[], works: Work[]): Achievement[] {
  const completes = events.filter((e) => e.type === 'lesson_complete');
  const firstCompleteOf = (lessonIds: string[]) => {
    const done = lessonIds.map((id) => events.find((e) => e.type === 'lesson_complete' && e.lessonId === id)?.at ?? null);
    return done.every(Boolean) ? done.sort().at(-1)! : null;
  };
  const clean = events.filter((e) => e.type === 'experiment' && e.mistakes === 0);
  const g1 = LESSONS.filter((l) => l.grade === 1).map((l) => l.id);
  const doneCount = LESSONS.filter((l) => lessonProgress(l, events).completed).length;
  return [
    { id: 'first-lesson', icon: '🌟', name: '第一颗星', how: '学完第一节课', earnedAt: completes[0]?.at ?? null },
    { id: 'clean-experiment', icon: '🔬', name: '实验小能手', how: '一次做对一个互动实验', earnedAt: clean[0]?.at ?? null },
    { id: 'three-lessons', icon: '🚀', name: '起飞啦', how: '学完 3 节课', earnedAt: doneCount >= 3 ? completes.map((e) => e.at).sort()[2] ?? null : null },
    { id: 'first-work', icon: '🎨', name: '小小创造家', how: '保存第一件自己的作品', earnedAt: works.map((w) => w.createdAt).sort()[0] ?? null },
    { id: 'grade1', icon: '🎓', name: '一年级毕业', how: '学完一年级全部 7 节课', earnedAt: firstCompleteOf(g1) },
  ];
}
