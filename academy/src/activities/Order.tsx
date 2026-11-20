import { useMemo, useRef, useState } from 'react';
import type { OrderActivity } from '../curriculum/types';
import { speak } from '../ui/speech';
import { useApp } from '../app/state';
import { SpeakButton, Txt } from '../ui/Txt';
import { seededShuffle, type ActivityProps } from './common';

export function OrderView({ step, recorder, onDone }: ActivityProps<OrderActivity>) {
  const { settings } = useApp();
  const shuffled = useMemo(() => seededShuffle(step.steps, step.id), [step]);
  const [done, setDone] = useState<string[]>([]);
  const [hint, setHint] = useState<{ text: string; ok: boolean } | null>(null);
  const mistakes = useRef(0);
  const finished = done.length === step.steps.length;

  async function tap(id: string) {
    if (finished || done.includes(id)) return;
    const expected = step.steps[done.length];
    if (id !== expected.id) {
      mistakes.current += 1;
      setHint({ text: `第 ${done.length + 1} 步还不是它。想一想，先要做什么？`, ok: false });
      if (settings.readAloud) speak('还不是它，想一想先要做什么。');
      return;
    }
    const next = [...done, id];
    setDone(next);
    setHint({ text: `第 ${next.length} 步：${expected.label}`, ok: true });
    if (settings.readAloud) speak(`第${next.length}步，${expected.label}`);
    if (next.length === step.steps.length) {
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'order', knowledgePoints: step.knowledgePoints, total: step.steps.length, mistakes: mistakes.current });
    }
  }

  return (
    <section className="activity">
      <p className="kind-tag">互动实验</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.title + '。' + step.instruction} /></p>
      <ol className="sequence" aria-label="已经排好的步骤">
        {step.steps.map((s, i) => (
          <li key={s.id} className={i < done.length ? 'filled' : ''}>
            <span className="seq-no">{i + 1}</span>{i < done.length ? <span>{s.icon} <Txt>{s.label}</Txt></span> : <span className="muted">？</span>}
          </li>
        ))}
      </ol>
      <div className="cards">
        {shuffled.filter((s) => !done.includes(s.id)).map((s) => (
          <button key={s.id} className="card-item" onClick={() => void tap(s.id)}><span className="card-icon">{s.icon}</span><Txt>{s.label}</Txt></button>
        ))}
      </div>
      {hint && <p className={'hint ' + (hint.ok ? 'ok' : 'try')} role="status"><Txt>{hint.text}</Txt></p>}
      {finished && (
        <div className="result">
          <p><Txt>{step.explain}</Txt></p>
          <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
        </div>
      )}
    </section>
  );
}
