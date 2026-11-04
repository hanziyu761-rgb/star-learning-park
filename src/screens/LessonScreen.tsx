import React from 'react';
import { getLesson } from '@/content';
import { Header, LoadingView, Notice, Screen } from '@/components/Screen';
import { LessonPlayer } from '@/lesson/LessonPlayer';
import { useNav } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';

export default function LessonScreen({ id, resume }: { id: string | undefined; resume: boolean }) {
  const nav = useNav();
  const { status } = useProgress();
  const lesson = getLesson(String(id));
  const exit = nav.back;

  // 必须等学习记录读取完成，才能正确“继续上次学习”
  if (status === 'loading') return <LoadingView />;
  if (!lesson) {
    return (
      <Screen>
        <Header title="找不到这节课" onBack={exit} />
        <Notice tone="warn" text="这节课不存在或已下线，请返回首页。" />
      </Screen>
    );
  }
  return <LessonPlayer key={`${lesson.id}-${resume}`} lesson={lesson} resume={resume} onExit={exit} onHome={nav.home} />;
}
