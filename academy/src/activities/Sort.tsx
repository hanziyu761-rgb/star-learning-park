import { useMemo, useRef, useState } from 'react';
import type { SortActivity, SortItem } from '../curriculum/types';
import { speak } from '../ui/speech';
import { useApp } from '../app/state';
import { SpeakButton, Txt } from '../ui/Txt';
import { seededShuffle, type ActivityProps } from './common';

// Tap a card, then tap a basket. Works with fingers on phones and with a
// mouse; no drag needed (hard for six-year-olds on small screens).
export function SortView({ step, recorder, onDone }: ActivityProps<SortActivity>) {
  const { settings } = useApp();
  const items = useMemo(() => seededShuffle(step.items, step.id), [step]);
  const [placed, setPlaced] = useState<Record<string, 'a' | 'b'>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState<{ text: string; ok: boolean } | null>(null);
  const mistakes = useRef(0);
  const [saved, setSaved] = useState(false);
  const remaining = items.filter((i) => !placed[i.id]);
  const allDone = remaining.length === 0;

  function choose(item: SortItem) {
    setSelected(item.id);
    setHint(null);
    if (settings.readAloud) speak(item.label);
  }

  async function drop(bin: 'a' | 'b') {
    const item = items.find((i) => i.id === selected);
    if (!item) { setHint({ text: '先点一张卡片哦。', ok: false }); return; }
    if (item.bin !== bin) {
      mistakes.current += 1;
      setHint({ text: `再想想：${item.why}`, ok: false });
      if (settings.readAloud) speak('再想想。' + item.why);
      return;
    }
    const next = { ...placed, [item.id]: bin };
    setPlaced(next);
    setSelected(null);
    setHint({ text: `对啦！${item.why}`, ok: true });
    if (settings.readAloud) speak('对啦！' + item.why);
    if (Object.keys(next).length === items.length && !saved) {
      setSaved(true);
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'sort', knowledgePoints: step.knowledgePoints, total: items.length, mistakes: mistakes.current });
    }
  }

  const bin = (key: 'a' | 'b') => (
    <button className={'bin' + (selected ? ' ready' : '')} onClick={() => void drop(key)} aria-label={`放进「${step.bins[key].label}」`}>
      <span className="bin-head">{step.bins[key].icon} <Txt>{step.bins[key].label}</Txt></span>
      <span className="bin-items">{items.filter((i) => placed[i.id] === key).map((i) => <span key={i.id} title={i.label}>{i.icon}</span>)}</span>
    </button>
  );

  return (
    <section className="activity">
      <p className="kind-tag">互动实验</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.title + '。' + step.instruction} /></p>
      <div className="cards">
        {remaining.map((i) => (
          <button key={i.id} className={'card-item' + (selected === i.id ? ' picked' : '')} onClick={() => choose(i)} aria-pressed={selected === i.id}>
            <span className="card-icon">{i.icon}</span><Txt>{i.label}</Txt>
          </button>
        ))}
      </div>
      <div className="bins">{bin('a')}{bin('b')}</div>
      {hint && <p className={'hint ' + (hint.ok ? 'ok' : 'try')} role="status"><Txt>{hint.text}</Txt></p>}
      {allDone && (
        <div className="result">
          <p><Txt>{mistakes.current === 0 ? '全部一次分对，真厉害！' : `全部分好啦！中间改正了 ${mistakes.current} 次，没关系，改正也是学习。`}</Txt></p>
          <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
        </div>
      )}
    </section>
  );
}
