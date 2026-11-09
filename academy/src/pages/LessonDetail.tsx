import { useApp } from '../app/state';
import { go } from '../app/router';
import { allKnowledgePoints, findLesson, findKnowledgePoint, LESSONS } from '../curriculum/catalog';
import { weakPrerequisites } from '../learning/review';
import { DIMENSIONS, MODULES } from '../curriculum/types';
import { lessonProgress, missingPrerequisites, formatMinutes } from '../learning/progress';
import { Shell } from '../ui/Shell';
import { SpeakButton, Txt } from '../ui/Txt';

export function LessonDetail({ id }: { id: string }) {
  const { events } = useApp();
  const lesson = findLesson(id);
  if (!lesson) return <Shell back="/"><p className="notice">没有找到这节课。</p></Shell>;
  const p = lessonProgress(lesson, events);
  const missing = missingPrerequisites(lesson, LESSONS, events);
  const mod = MODULES.find((m) => m.id === lesson.module)!;
  const weak = weakPrerequisites(lesson, allKnowledgePoints(), events).filter((w) => w.reason === 'weak');
  const experiments = lesson.steps.filter((s) => s.kind === 'sort' || s.kind === 'order').length;
  const quizCount = lesson.steps.reduce((n, s) => n + (s.kind === 'quiz' ? s.questions.length : 0), 0);

  return (
    <Shell back={`/map/${lesson.grade}`} title="课程详情">
      <section className="lesson-hero">
        <span className="lesson-icon">{lesson.icon}</span>
        <div>
          <p className="tag">{lesson.grade} 年级 · 第 {lesson.order} 课 · {mod.icon} {mod.name}</p>
          <h1><Txt>{lesson.title}</Txt></h1>
          <p className="muted">约 {lesson.minutes} 分钟 · {lesson.steps.length} 步 · {experiments} 个互动实验 · {quizCount} 道练习题</p>
        </div>
      </section>

      {missing.length > 0 && (
        <div className="notice">
          建议先学：{missing.map((m) => (
            <button key={m.id} className="link" onClick={() => go(`/lesson/${m.id}`)}>「{m.title}」</button>
          ))}。也可以直接开始。
        </div>
      )}

      {weak.length > 0 && (
        <div className="notice">
          这节课会用到 {weak.map((w) => `「${w.kp.name}」`).join('')}，上次练习还不太稳。
          <button className="big-btn secondary" onClick={() => go(`/review/${weak.map((w) => w.kp.id).join(',')}`)}>🔥 先热身复习 {weak.length} 个知识点</button>
        </div>
      )}

      <button className="big-btn" onClick={() => go(`/play/${lesson.id}`)}>
        {p.completed ? '🔁 再学一遍' : p.started ? `▶ 继续学习（已完成 ${p.stepsDone.size}/${lesson.steps.length} 步）` : '▶ 开始学习'}
      </button>
      {p.activeMs > 0 && <p className="muted center">这节课已经学了 {formatMinutes(p.activeMs)}</p>}

      <section className="card">
        <h2><Txt>这节课要学会</Txt> <SpeakButton text={lesson.goals.join('。')} /></h2>
        <ul className="goals">{lesson.goals.map((g) => <li key={g}><Txt>{g}</Txt></li>)}</ul>
      </section>

      <section className="card">
        <h2><Txt>生活中的例子</Txt></h2>
        <ul className="examples">{lesson.lifeExamples.map((e) => <li key={e.text}><span>{e.icon}</span><Txt>{e.text}</Txt></li>)}</ul>
      </section>

      <section className="card">
        <h2>知识点</h2>
        <ul className="kps">
          {lesson.knowledgePoints.map((k) => (
            <li key={k.id}><b>{k.name}</b><span className="muted"> · {DIMENSIONS.find((d) => d.id === k.dimension)!.name}</span>
              {k.prerequisites.length > 0 && <span className="muted small"> · 基于：{k.prerequisites.map((x) => findKnowledgePoint(x)?.name ?? x).join('、')}</span>}
            </li>
          ))}
        </ul>
      </section>

      <details className="card parent-tip">
        <summary>给家长</summary>
        <p>{lesson.parentGuide.summary}</p>
        <p><b>在家可以做：</b>{lesson.parentGuide.homeActivity}</p>
      </details>
    </Shell>
  );
}
