import { useApp } from '../app/state';
import { go } from '../app/router';
import { gradePlan, lessonsForGrade, LESSONS } from '../curriculum/catalog';
import { MODULES, LEVEL_NAMES, type Grade } from '../curriculum/types';
import { activeMsOnDay, completedCount, localDay, nextLesson, formatMinutes } from '../learning/progress';
import { abilityLevels } from '../learning/abilities';
import { Shell } from '../ui/Shell';
import { SpeakButton, Txt } from '../ui/Txt';
import { allKnowledgePoints } from '../curriculum/catalog';

export function Home() {
  const { learner, events, works, settings } = useApp();
  if (!learner) return null;
  const plan = gradePlan(learner.grade);
  // Grade 1 is the only grade with content in V1; other grades start there, said plainly.
  const studyGrade: Grade = plan.available ? learner.grade : 1;
  const lessons = lessonsForGrade(studyGrade);
  const next = nextLesson(lessons, events);
  const done = completedCount(LESSONS, events);
  const todayMs = activeMsOnDay(events, localDay(new Date().toISOString()));
  const abilities = abilityLevels(allKnowledgePoints(), events, works);
  const topLevel = Math.max(...abilities.map((a) => a.level));
  const lower = learner.grade <= 2;
  const greeting = `你好，${learner.nickname}！欢迎来到 AI 少年学院。`;

  return (
    <Shell>
      <section className="hero">
        <div className="hero-bot" aria-hidden>{learner.avatar}</div>
        <h1><Txt>{`你好，${learner.nickname}！`}</Txt></h1>
        <p className="tag">{learner.grade} 年级 · {plan.theme}</p>
        <SpeakButton text={greeting} />
      </section>

      {!plan.available && (
        <div className="notice">
          {learner.grade} 年级的课程<b>即将上线</b>。现在可以先学一年级的「AI 小小探索家」，打好基础。
        </div>
      )}

      <section className="card today">
        <h2><Txt>今日学习任务</Txt></h2>
        {next ? (
          <button className="big-btn" onClick={() => go(`/play/${next.lesson.id}`)}>
            <span className="big-icon">{next.lesson.icon}</span>
            <span><Txt>{next.resume ? `继续学习：${next.lesson.title}` : `今天学：${next.lesson.title}`}</Txt></span>
          </button>
        ) : (
          <p><Txt>{`一年级的课全部学完啦！`}</Txt></p>
        )}
        <p className="muted">今天已学 {formatMinutes(todayMs)}{settings.dailyMinutes ? ` · 家长建议每天 ${settings.dailyMinutes} 分钟` : ''}</p>
      </section>

      <section className="stats">
        <button className="stat" onClick={() => go('/growth')}>
          <span className="stat-num">⭐ {done}</span><span className="stat-label"><Txt>完成的课</Txt></span>
        </button>
        <button className="stat" onClick={() => go('/growth')}>
          <span className="stat-num">🏅</span><span className="stat-label"><Txt>{LEVEL_NAMES[topLevel]}</Txt></span>
        </button>
        <button className="stat" onClick={() => go('/growth')}>
          <span className="stat-num">🎨 {works.length}</span><span className="stat-label"><Txt>我的作品</Txt></span>
        </button>
      </section>

      {lower ? (
        <button className="big-btn secondary" onClick={() => go(`/map/${studyGrade}`)}>🗺️ <Txt>课程地图</Txt></button>
      ) : (
        <section className="card">
          <h2>学习中心</h2>
          <div className="module-grid">
            {MODULES.map((m) => {
              const has = lessons.some((l) => l.module === m.id);
              return (
                <button key={m.id} className={'module' + (has ? '' : ' soon')} onClick={() => go(`/map/${studyGrade}`)}>
                  <span className="module-icon">{m.icon}</span>
                  <span>{m.name}</span>
                  <span className="module-sub">{has ? `${lessons.filter((l) => l.module === m.id).length} 节课` : '即将上线'}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </Shell>
  );
}
