import { useApp } from '../app/state';
import { go } from '../app/router';
import { allKnowledgePoints, LESSONS } from '../curriculum/catalog';
import { DIMENSIONS, LEVEL_NAMES } from '../curriculum/types';
import { abilityLevels, childShare } from '../learning/abilities';
import { achievements } from '../learning/achievements';
import { completedCount, formatMinutes, lessonProgress, totalActiveMs } from '../learning/progress';
import { Radar } from '../ui/Radar';
import { Shell } from '../ui/Shell';
import { Txt } from '../ui/Txt';

export function Growth() {
  const { learner, events, works } = useApp();
  if (!learner) return null;
  const results = abilityLevels(allKnowledgePoints(), events, works);
  const done = completedCount(LESSONS, events);
  const badges = achievements(events, works);
  const myLessons = LESSONS.filter((l) => lessonProgress(l, events).started);

  return (
    <Shell back="/" title="我的成长中心">
      <section className="hero small">
        <div className="hero-bot" aria-hidden>{learner.avatar}</div>
        <h1>{learner.nickname}</h1>
        <p className="tag">{learner.grade} 年级</p>
      </section>

      <section className="stats">
        <div className="stat"><span className="stat-num">⭐ {done}</span><span className="stat-label"><Txt>完成的课</Txt></span></div>
        <div className="stat"><span className="stat-num">⏱ {Math.round(totalActiveMs(events) / 60000)}</span><span className="stat-label"><Txt>学习分钟</Txt></span></div>
        <div className="stat"><span className="stat-num">🎨 {works.length}</span><span className="stat-label"><Txt>作品</Txt></span></div>
      </section>

      <section className="card">
        <h2>能力雷达图</h2>
        <Radar results={results} />
        <ul className="ability-list">
          {results.map((r) => (
            <li key={r.dimension}>
              <span>{DIMENSIONS.find((d) => d.id === r.dimension)!.name}</span>
              <b className={'lv lv' + r.level}>{LEVEL_NAMES[r.level]}</b>
            </li>
          ))}
        </ul>
        <p className="muted small">等级只根据你自己完成的练习、实验和作品来计算。</p>
      </section>

      <section className="card">
        <h2>我的成就</h2>
        <div className="badges">
          {badges.map((b) => (
            <div key={b.id} className={'badge-item' + (b.earnedAt ? ' earned' : '')}>
              <span className="badge-icon">{b.earnedAt ? b.icon : '🔒'}</span>
              <b>{b.name}</b>
              <span className="muted small">{b.how}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>我的作品</h2>
        {works.length === 0 ? <p className="muted">还没有作品。学到第 7 课，就能设计自己的机器人啦！</p> : (
          <ul className="works">
            {works.map((w) => (
              <li key={w.id} className="work">
                <div className="work-head"><span>{w.type === 'fruit-ai' ? '🍎' : '🤖'}</span><b>{w.title}</b><span className="share-badge">{Math.round(childShare(w) * 100)}% 自己完成</span></div>
                <dl>{w.parts.map((p) => <div key={p.field}><dt>{p.label}</dt><dd>{p.value}{p.by === 'ai' && <span className="by-ai">模拟 AI 生成</span>}</dd></div>)}</dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>我的课程</h2>
        {myLessons.length === 0 ? <p className="muted">还没有开始学习。</p> : (
          <ul className="my-lessons">
            {myLessons.map((l) => {
              const p = lessonProgress(l, events);
              return <li key={l.id}><button className="link" onClick={() => go(`/lesson/${l.id}`)}>{l.icon} {l.title}</button><span>{p.completed ? '⭐ 已完成' : '进行中'} · {formatMinutes(p.activeMs)}</span></li>;
            })}
          </ul>
        )}
      </section>
    </Shell>
  );
}
