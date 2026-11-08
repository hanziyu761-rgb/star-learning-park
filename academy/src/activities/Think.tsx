import { useState } from 'react';
import type { ThinkActivity, TaskActivity } from '../curriculum/types';
import { useApp } from '../app/state';
import { speak } from '../ui/speech';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

// Thinking questions are not graded: the child's choice is recorded, then a
// teacher-style discussion is shown.
export function ThinkView({ step, recorder, onDone }: ActivityProps<ThinkActivity>) {
  const { settings } = useApp();
  const [choice, setChoice] = useState<string | null>(null);
  async function pick(id: string) {
    if (choice) return;
    setChoice(id);
    await recorder.record({ type: 'think', stepId: step.id, choiceId: id });
    if (settings.readAloud) speak(step.discussion);
  }
  return (
    <section className="activity">
      <p className="kind-tag">思考题</p>
      <h1><Txt>{step.question}</Txt></h1>
      <SpeakButton text={step.question} />
      <div className="options">
        {step.choices.map((c) => (
          <button key={c.id} className={'option' + (choice === c.id ? ' chosen' : '')} disabled={!!choice} onClick={() => void pick(c.id)}><Txt>{c.label}</Txt></button>
        ))}
      </div>
      {choice && (
        <div className="result">
          <p className="discussion">💬 <Txt>{step.discussion}</Txt></p>
          <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
        </div>
      )}
    </section>
  );
}

export function TaskView({ step, recorder, onDone }: ActivityProps<TaskActivity>) {
  const [busy, setBusy] = useState(false);
  async function report() {
    setBusy(true);
    await recorder.record({ type: 'task', stepId: step.id, selfReported: true });
    onDone();
  }
  return (
    <section className="activity">
      <p className="kind-tag">实践任务</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="task-text"><Txt>{step.instruction}</Txt></p>
      <SpeakButton text={step.instruction} />
      <button className="big-btn" disabled={busy} onClick={() => void report()}>✅ <Txt>我和家长完成了</Txt></button>
      <button className="big-btn secondary" disabled={busy} onClick={onDone}>⏭ <Txt>以后再做</Txt></button>
      <p className="muted small center">"完成了"由孩子和家长自己确认，家长中心里会显示为"自报完成"。</p>
    </section>
  );
}
