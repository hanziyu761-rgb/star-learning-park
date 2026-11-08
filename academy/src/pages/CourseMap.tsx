import { useApp } from '../app/state';
import { go } from '../app/router';
import { GRADE_PLANS, gradePlan, lessonsForGrade } from '../curriculum/catalog';
import { MODULES, type Grade } from '../curriculum/types';
import { lessonProgress } from '../learning/progress';
import { Shell } from '../ui/Shell';
import { Txt } from '../ui/Txt';

export function Grades() {
  const { learner } = useApp();
  return (
    <Shell back="/" title="选择年级">
      <p className="lead">六年成长路线：从认识 AI，到用自己的想法创造 AI 产品。</p>
      <div className="grade-list">
        {GRADE_PLANS.map((p) => (
          <button key={p.grade} className={'grade-card' + (p.available ? '' : ' soon') + (learner?.grade === p.grade ? ' mine' : '')} onClick={() => go(`/map/${p.grade}`)}>
            <span className="grade-no">{p.grade}<small>年级</small></span>
            <span className="grade-body">
              <b>{p.theme}</b>
              <span>{p.goal}</span>
              <span className="muted">项目：{p.project}</span>
            </span>
            <span className="badge">{p.available ? `${p.lessonTitles.length} 课` : '即将上线'}</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function CourseMap({ grade }: { grade: number | null }) {
  const { learner, events } = useApp();
  const g = (grade && grade >= 1 && grade <= 6 ? grade : learner?.grade ?? 1) as Grade;
  const plan = gradePlan(g);
  const lessons = lessonsForGrade(g);
  return (
    <Shell back="/" title="课程地图">
      <nav className="grade-tabs" aria-label="年级">
        {GRADE_PLANS.map((p) => (
          <button key={p.grade} className={'tab' + (p.grade === g ? ' on' : '') + (p.available ? '' : ' soon')} aria-current={p.grade === g} onClick={() => go(`/map/${p.grade}`)}>{p.grade} 年级</button>
        ))}
      </nav>
      <section className="map-head">
        <h1><Txt>{plan.theme}</Txt></h1>
        <p><Txt>{`目标：${plan.goal}`}</Txt></p>
      </section>

      {plan.available ? (
        <ol className="path">
          {lessons.map((l, i) => {
            const p = lessonProgress(l, events);
            const mod = MODULES.find((m) => m.id === l.module)!;
            const state = p.completed ? 'done' : p.started ? 'doing' : 'new';
            return (
              <li key={l.id} className={'node ' + state + (i % 2 ? ' right' : '')}>
                <button onClick={() => go(`/lesson/${l.id}`)} aria-label={`第 ${l.order} 课 ${l.title}`}>
                  <span className="node-icon">{p.completed ? '⭐' : l.icon}</span>
                  <span className="node-text">
                    <span className="node-no">第 {l.order} 课 · {mod.name}</span>
                    <b><Txt>{l.title}</Txt></b>
                    <span className="node-state">{p.completed ? '已完成' : p.started ? `学到第 ${p.stepsDone.size} 步` : `${l.minutes} 分钟`}</span>
                  </span>
                </button>
              </li>
            );
          })}
          <li className="node project">
            <div><span className="node-icon">🏆</span><span className="node-text"><span className="node-no">年级项目（在第 7 课里完成）</span><b><Txt>{plan.project}</Txt></b></span></div>
          </li>
        </ol>
      ) : (
        <section className="card soon-card">
          <p className="notice"><b>即将上线</b>：{g} 年级课程正在按同样的 12 项标准编写，下一个版本（V2.0）开放。下面是将要学习的内容。</p>
          <ol className="soon-list">
            {plan.lessonTitles.map((t, i) => <li key={t}><span className="node-no">第 {i + 1} 课</span> {t}</li>)}
          </ol>
          <p className="muted">年级项目：{plan.project}</p>
        </section>
      )}
    </Shell>
  );
}
