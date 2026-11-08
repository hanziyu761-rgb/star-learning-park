import { useEffect, useState } from 'react';
import type { QuizActivity } from '../curriculum/types';
import { speak } from '../ui/speech';
import { useApp } from '../app/state';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

// Each attempt is recorded with its attempt number. Only first attempts count
// toward mastery, so a child who keeps tapping until right isn't scored as knowing it.
export function QuizView({ step, recorder, onDone }: ActivityProps<QuizActivity>) {
  const { settings, learner } = useApp();
  const [qi, setQi] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTryRight, setFirstTryRight] = useState(0);
  const q = step.questions[qi];
  const last = qi === step.questions.length - 1;

  useEffect(() => {
    if (settings.readAloud && learner && learner.grade <= 2) speak(q.prompt + '。' + q.options.map((o) => o.label).join('，'));
  }, [q, settings.readAloud, learner]);

  async function pick(optionId: string) {
    if (solved || wrong.includes(optionId)) return;
    const correct = optionId === q.answer;
    await recorder.record({ type: 'answer', stepId: step.id, questionId: q.id, knowledgePoints: q.knowledgePoints, choice: optionId, correct, attemptNo: attempt });
    if (correct) {
      setSolved(true);
      if (attempt === 1) setFirstTryRight((n) => n + 1);
      if (settings.readAloud) speak('答对啦！' + q.explain);
    } else {
      setWrong((w) => [...w, optionId]);
      setAttempt((a) => a + 1);
      if (settings.readAloud) speak('再想想。');
    }
  }

  function nextQuestion() {
    if (last) { onDone(); return; }
    setQi(qi + 1); setAttempt(1); setWrong([]); setSolved(false);
  }

  return (
    <section className="activity">
      <p className="kind-tag">练习题 {qi + 1}/{step.questions.length}</p>
      <h1><Txt>{q.prompt}</Txt></h1>
      <SpeakButton text={q.prompt + '。' + q.options.map((o) => o.label).join('，')} />
      <div className="options">
        {q.options.map((o) => (
          <button key={o.id}
            className={'option' + (wrong.includes(o.id) ? ' wrong' : '') + (solved && o.id === q.answer ? ' right' : '')}
            disabled={wrong.includes(o.id) || solved}
            onClick={() => void pick(o.id)}>
            {o.icon && <span className="opt-icon">{o.icon}</span>}<Txt>{o.label}</Txt>
          </button>
        ))}
      </div>
      {wrong.length > 0 && !solved && <p className="hint try" role="status"><Txt>再想想，你可以的！</Txt></p>}
      {solved && (
        <div className="result">
          <p className="hint ok" role="status"><Txt>{(attempt === 1 ? '一次答对！' : '答对啦！') + q.explain}</Txt></p>
          <button className="big-btn" onClick={nextQuestion}>{last ? <><Txt>{`完成练习（一次答对 ${firstTryRight} 题）`}</Txt> →</> : <><Txt>下一题</Txt> →</>}</button>
        </div>
      )}
    </section>
  );
}
