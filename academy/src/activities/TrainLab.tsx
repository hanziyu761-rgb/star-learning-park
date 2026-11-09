import { useRef, useState } from 'react';
import type { TrainLabActivity } from '../curriculum/types';
import { labAccuracy, labPredict, PRESETS, type LabPrediction, type LabSample } from '../learning/trainlab';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

function Card({ s, names }: { s: LabSample; names: Record<string, string> }) {
  return (
    <div className="train-card done">
      <span className="card-icon">{s.icon}</span>
      <b>{s.name}</b>
      <span className="muted small">{Object.keys(names).map((f) => s.features[f]).join(' · ')}</span>
      <span className="tag-label">标签：{s.truth}</span>
    </div>
  );
}

function Results({ preds }: { preds: LabPrediction[] }) {
  return (
    <>
      <ul className="preds">
        {preds.map((p) => (
          <li key={p.sample.id} className={p.correct ? 'ok' : 'bad'}>
            <span className="card-icon">{p.sample.icon}</span>
            <span><b>{p.sample.name}</b><br /><span className="small">模型预测：<b>{p.predicted}</b>（最像「{p.nearest.name}」）</span></span>
            <span className="pred-mark">{p.correct ? '✅' : '❌'}</span>
          </li>
        ))}
      </ul>
      <p className="accuracy">正确率：<b>{preds.filter((p) => p.correct).length}/{preds.length}</b>（{Math.round(labAccuracy(preds) * 100)}%）</p>
    </>
  );
}

export function TrainLabView({ step, recorder, onDone }: ActivityProps<TrainLabActivity>) {
  const preset = PRESETS[step.preset];
  return (
    <section className="activity">
      <p className="kind-tag">互动实验 · 模拟实验</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="sim-note">这是<b>模拟实验</b>：程序用"找最像的例子"的办法模仿 AI 模型，而且它比较看重<b>颜色</b>。它不是真正的 AI 模型。</p>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.instruction} /></p>
      {step.preset === 'exam' ? <ExamMode step={step} recorder={recorder} onDone={onDone} preset={preset} /> : <BiasMode step={step} recorder={recorder} onDone={onDone} preset={preset} />}
    </section>
  );
}

type ModeProps = Pick<ActivityProps<TrainLabActivity>, 'step' | 'recorder' | 'onDone'> & { preset: (typeof PRESETS)[keyof typeof PRESETS] };

function ExamMode({ step, recorder, onDone, preset }: ModeProps) {
  const [a, setA] = useState<LabPrediction[] | null>(null);
  const [b, setB] = useState<LabPrediction[] | null>(null);
  const [choice, setChoice] = useState<'A' | 'B' | null>(null);
  async function pick(c: 'A' | 'B') {
    if (choice) return;
    setChoice(c);
    await recorder.record({ type: 'experiment', stepId: step.id, kind: 'simulate', knowledgePoints: step.knowledgePoints, total: 1, mistakes: c === 'B' ? 0 : 1 }, 'simulated');
  }
  return (
    <>
      <h2><Txt>训练数据（模型学过的）</Txt></h2>
      <div className="train-grid">{preset.train.map((s) => <Card key={s.id} s={s} names={preset.featureNames} />)}</div>
      <div className="exam-btns">
        <button className="big-btn secondary" onClick={() => setA(labPredict(preset.train, preset.train, preset.weights))}>📝 <Txt>考试 A：用学过的水果考</Txt></button>
        <button className="big-btn secondary" onClick={() => setB(labPredict(preset.train, preset.test, preset.weights))}>🆕 <Txt>考试 B：用没见过的水果考</Txt></button>
      </div>
      {a && <div className="test-panel"><h2><Txt>考试 A 的成绩</Txt></h2><Results preds={a} /></div>}
      {b && <div className="test-panel"><h2><Txt>考试 B 的成绩</Txt></h2><Results preds={b} /></div>}
      {a && b && (
        <div className="result">
          <p className="discussion">💬 <Txt>哪次考试更能说明模型真的学会了？</Txt></p>
          <div className="options">
            <button className={'option' + (choice === 'A' ? ' chosen' : '')} disabled={!!choice} onClick={() => void pick('A')}><Txt>考试 A，分数更高</Txt></button>
            <button className={'option' + (choice === 'B' ? ' chosen' : '')} disabled={!!choice} onClick={() => void pick('B')}><Txt>考试 B，用的是没见过的水果</Txt></button>
          </div>
          {choice && (
            <>
              <p className={'hint ' + (choice === 'B' ? 'ok' : 'try')}><Txt>{(choice === 'B' ? '对！' : '再想想：') + step.explain}</Txt></p>
              <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function BiasMode({ step, recorder, onDone, preset }: ModeProps) {
  const [added, setAdded] = useState<string[]>([]);
  const [preds, setPreds] = useState<LabPrediction[]>(() => labPredict(preset.train, preset.test, preset.weights));
  const [retrains, setRetrains] = useState(0);
  const failed = useRef(0);
  const [done, setDone] = useState(false);
  const acc = labAccuracy(preds);

  async function retrain() {
    const train = [...preset.train, ...preset.pool.filter((p) => added.includes(p.id))];
    const p = labPredict(train, preset.test, preset.weights);
    setPreds(p);
    setRetrains((n) => n + 1);
    if (labAccuracy(p) < 1) { failed.current += 1; return; }
    if (!done) {
      setDone(true);
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'simulate', knowledgePoints: step.knowledgePoints, total: preset.pool.length, mistakes: failed.current }, 'simulated');
    }
  }

  return (
    <>
      <h2><Txt>现在的训练数据</Txt></h2>
      <div className="train-grid">{preset.train.map((s) => <Card key={s.id} s={s} names={preset.featureNames} />)}</div>
      <div className="test-panel">
        <h2><Txt>{retrains ? `第 ${retrains} 次重新训练后的测试` : '用没见过的水果测试'}</Txt></h2>
        <Results preds={preds} />
      </div>
      {acc < 1 && (
        <>
          <p className="hint try"><Txt>模型认错了！看看训练数据里的苹果都是什么颜色的？选一些例子加进训练数据，再重新训练。</Txt></p>
          <h2><Txt>可以加入的例子</Txt></h2>
          <div className="train-grid">
            {preset.pool.map((s) => (
              <button key={s.id} className={'train-card pool' + (added.includes(s.id) ? ' on' : '')} aria-pressed={added.includes(s.id)}
                onClick={() => setAdded(added.includes(s.id) ? added.filter((x) => x !== s.id) : [...added, s.id])}>
                <span className="card-icon">{s.icon}</span><b>{s.name}</b>
                <span className="muted small">{Object.keys(preset.featureNames).map((f) => s.features[f]).join(' · ')}</span>
                <span className="tag-label">{added.includes(s.id) ? '✅ 已加入' : '＋ 加入训练数据'}</span>
              </button>
            ))}
          </div>
          <button className="big-btn" disabled={!added.length} onClick={() => void retrain()}>🧠 <Txt>重新训练并测试</Txt></button>
        </>
      )}
      {acc === 1 && (
        <div className="result">
          <p className="hint ok"><Txt>{'全部认对了！' + step.explain}</Txt></p>
          <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
        </div>
      )}
    </>
  );
}
