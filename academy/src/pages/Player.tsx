import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/state';
import { go } from '../app/router';
import { findLesson } from '../curriculum/catalog';
import { lessonProgress } from '../learning/progress';
import { ActiveTimer, LessonRecorder } from '../learning/recorder';
import { stopSpeaking } from '../ui/speech';
import { Shell } from '../ui/Shell';
import { Txt } from '../ui/Txt';
import { ExplainView } from '../activities/Explain';
import { SortView } from '../activities/Sort';
import { OrderView } from '../activities/Order';
import { QuizView } from '../activities/Quiz';
import { ThinkView, TaskView } from '../activities/Think';
import { RobotDesigner } from '../activities/RobotDesigner';
import { FruitTrainer } from '../activities/FruitTrainer';

export function Player({ id }: { id: string }) {
  const { learner, events, refresh } = useApp();
  const lesson = findLesson(id);
  const timer = useMemo(() => new ActiveTimer(), []);
  const recorder = useMemo(() => (learner && lesson ? new LessonRecorder(learner.id, lesson.id, timer) : null), [learner, lesson, timer]);
  const started = useRef(false);
  const [index, setIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!lesson || !recorder || started.current) return;
    started.current = true;
    const p = lessonProgress(lesson, events);
    const firstOpen = p.completed ? 0 : Math.max(0, lesson.steps.findIndex((s) => !p.stepsDone.has(s.id)));
    setIndex(firstOpen);
    void recorder.record({ type: 'lesson_start' });
  }, [lesson, recorder, events]);

  useEffect(() => {
    timer.start();
    return () => { timer.stop(); stopSpeaking(); };
  }, [timer]);

  if (!lesson || !learner) return <Shell back="/"><p className="notice">没有找到这节课。</p></Shell>;
  if (index === null || !recorder) return <Shell back={`/lesson/${lesson.id}`}><p className="muted center">准备中…</p></Shell>;

  const step = lesson.steps[index];

  async function next() {
    if (!recorder || !lesson || index === null) return;
    stopSpeaking();
    await recorder.record({ type: 'step_done', stepId: step.id, kind: step.kind });
    if (index + 1 >= lesson.steps.length) {
      await recorder.record({ type: 'lesson_complete' });
      await refresh();
      setFinished(true);
    } else {
      setIndex(index + 1);
      void refresh();
    }
    window.scrollTo?.({ top: 0 });
  }

  if (finished) {
    return (
      <Shell back={`/map/${lesson.grade}`} title={lesson.title}>
        <section className="celebrate">
          <div className="big-star" aria-hidden>⭐</div>
          <h1><Txt>{`太棒了！你学完了「${lesson.title}」`}</Txt></h1>
          <p><Txt>获得一颗学习星星</Txt></p>
          <button className="big-btn" onClick={() => go(`/map/${lesson.grade}`)}>🗺️ <Txt>回到课程地图</Txt></button>
          <button className="big-btn secondary" onClick={() => go('/growth')}>🌱 <Txt>看看我的成长</Txt></button>
        </section>
      </Shell>
    );
  }

  const props = { lessonId: lesson.id, recorder, onDone: () => void next() };
  return (
    <Shell back={`/lesson/${lesson.id}`} title={lesson.title}>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={lesson.steps.length} aria-valuenow={index + 1} aria-label="学习进度">
        {lesson.steps.map((s, i) => <span key={s.id} className={i < index ? 'done' : i === index ? 'now' : ''} />)}
      </div>
      <div className="step" key={step.id}>
        {step.kind === 'explain' && <ExplainView step={step} {...props} />}
        {step.kind === 'sort' && <SortView step={step} {...props} />}
        {step.kind === 'order' && <OrderView step={step} {...props} />}
        {step.kind === 'quiz' && <QuizView step={step} {...props} />}
        {step.kind === 'think' && <ThinkView step={step} {...props} />}
        {step.kind === 'task' && <TaskView step={step} {...props} />}
        {step.kind === 'project' && step.editor === 'robot-designer' && <RobotDesigner step={step} {...props} />}
        {step.kind === 'project' && step.editor === 'fruit-trainer' && <FruitTrainer step={step} {...props} />}
      </div>
    </Shell>
  );
}
