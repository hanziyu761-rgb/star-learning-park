import { useEffect } from 'react';
import type { ExplainStep } from '../curriculum/types';
import { useApp } from '../app/state';
import { speak } from '../ui/speech';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

export function ExplainView({ step, onDone }: ActivityProps<ExplainStep>) {
  const { learner, settings } = useApp();
  useEffect(() => {
    // Younger children get each screen read aloud automatically (the tap on
    // "下一步" is the user gesture browsers require before speaking).
    if (settings.readAloud && learner && learner.grade <= 2) speak(`${step.title}。${step.text}`);
  }, [step, settings.readAloud, learner]);
  return (
    <section className="explain">
      <div className="visual" aria-hidden>{step.visual}</div>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="explain-text"><Txt>{step.text}</Txt></p>
      <SpeakButton text={`${step.title}。${step.text}`} label="再听一遍" />
      <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
    </section>
  );
}
