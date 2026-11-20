import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app/state';
import { go } from '../app/router';
import { LESSONS, findKnowledgePoint } from '../curriculum/catalog';
import { buildReviewSession, dueKnowledgePoints, type ReviewItem } from '../learning/review';
import { localDay } from '../learning/progress';
import { ActiveTimer, LessonRecorder } from '../learning/recorder';
import { speak, stopSpeaking } from '../ui/speech';
import { Shell } from '../ui/Shell';
import { SpeakButton, Txt } from '../ui/Txt';

// Today's review (or a warm-up for chosen knowledge points). Every answer is a
// real first-attempt record and moves mastery and the review schedule.
export function Review({ kps }: { kps: string[] | null }) {
  const { learner, events, refresh, settings } = useApp();
  const timer = useMemo(() => new ActiveTimer(), []);
  const [items] = useState<ReviewItem[]>(() => {
    const ids = kps ?? dueKnowledgePoints(events, localDay(new Date().toISOString())).map((s) => s.kpId);
    return buildReviewSession(ids, LESSONS, events);
  });
  const [i, setI] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstRight, setFirstRight] = useState(0);

  useEffect(() => { timer.start(); return () => { timer.stop(); stopSpeaking(); }; }, [timer]);

  if (!learner) return null;
  const title = kps ? '热身复习' : '今日复习';
  if (items.length === 0) {
    return (
      <Shell back="/" title={title}>
        <section className="celebrate"><div className="big-star" aria-hidden>🌈</div><h1><Txt>今天没有需要复习的知识点</Txt></h1>
          <button className="big-btn" onClick={() => go('/')}><Txt>回到首页</Txt></button></section>
      </Shell>
    );
  }
  if (i >= items.length) {
    return (
      <Shell back="/" title={title}>
        <section className="celebrate">
          <div className="big-star" aria-hidden>🧠</div>
          <h1><Txt>{`复习完成！一次答对 ${firstRight}/${items.length} 题`}</Txt></h1>
          <p className="muted">答错的知识点明天会再出现，答对的会隔几天再复习。</p>
          <button className="big-btn" onClick={() => go('/')}><Txt>回到首页</Txt></button>
        </section>
      </Shell>
    );
  }

  const { question: q, lessonId, kpId } = items[i];
  const kp = findKnowledgePoint(kpId);

  async function pick(optionId: string) {
    if (solved || wrong.includes(optionId) || !learner) return;
    const correct = optionId === q.answer;
    await new LessonRecorder(learner.id, lessonId, timer).record({ type: 'answer', stepId: 'review', questionId: q.id, knowledgePoints: q.knowledgePoints, choice: optionId, correct, attemptNo: attempt });
    if (correct) {
      setSolved(true);
      if (attempt === 1) setFirstRight((n) => n + 1);
      if (settings.readAloud) speak('答对啦！' + q.explain);
    } else {
      setWrong((w) => [...w, optionId]);
      setAttempt((a) => a + 1);
    }
  }

  async function next() {
    await refresh();
    setI(i + 1); setAttempt(1); setWrong([]); setSolved(false);
  }

  return (
    <Shell back="/" title={title}>
      <div className="progress" aria-label="复习进度">{items.map((it, k) => <span key={it.question.id} className={k < i ? 'done' : k === i ? 'now' : ''} />)}</div>
      <section className="activity">
        <p className="kind-tag">{title} {i + 1}/{items.length}{kp ? ` · ${kp.name}` : ''}</p>
        <h1><Txt>{q.prompt}</Txt></h1>
        <SpeakButton text={q.prompt + '。' + q.options.map((o) => o.label).join('，')} />
        <div className="options">
          {q.options.map((o) => (
            <button key={o.id} className={'option' + (wrong.includes(o.id) ? ' wrong' : '') + (solved && o.id === q.answer ? ' right' : '')}
              disabled={wrong.includes(o.id) || solved} onClick={() => void pick(o.id)}>
              {o.icon && <span className="opt-icon">{o.icon}</span>}<Txt>{o.label}</Txt>
            </button>
          ))}
        </div>
        {wrong.length > 0 && !solved && <p className="hint try" role="status"><Txt>再想想，你可以的！</Txt></p>}
        {solved && (
          <div className="result">
            <p className="hint ok" role="status"><Txt>{(attempt === 1 ? '一次答对！' : '答对啦！') + q.explain}</Txt></p>
            <button className="big-btn" onClick={() => void next()}><Txt>{i + 1 === items.length ? '完成复习' : '下一题'}</Txt> →</button>
          </div>
        )}
      </section>
    </Shell>
  );
}
