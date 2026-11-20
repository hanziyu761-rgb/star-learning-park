import { useState } from 'react';
import type { ProjectActivity } from '../curriculum/types';
import type { Work, WorkPart } from '../store/types';
import { useApp } from '../app/state';
import { logSafety, newId, saveWork } from '../store/db';
import { containsPrivateInfo, PRIVACY_MESSAGE } from '../safety/privacy';
import { accuracy, FRUIT_LABELS, mislabeled, predict, TEST_SET, TRAINING_SET, type FruitLabel, type Prediction } from '../learning/simulator';
import { childShare } from '../learning/abilities';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

type Phase = 'label' | 'test' ;

export function FruitTrainer({ step, lessonId, recorder, onDone }: ActivityProps<ProjectActivity>) {
  const { learner, refresh } = useApp();
  const [labels, setLabels] = useState<Record<string, FruitLabel>>({});
  const [phase, setPhase] = useState<Phase>('label');
  const [runs, setRuns] = useState<{ acc: number; wrongLabels: number }[]>([]);
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Work | null>(null);
  const allLabelled = TRAINING_SET.every((t) => labels[t.id]);

  async function train() {
    if (!allLabelled) return;
    const p = predict(labels);
    const run = { acc: accuracy(p), wrongLabels: mislabeled(labels).length };
    // Only the first training run is evidence for the child's labelling skill.
    if (runs.length === 0) {
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'simulate', knowledgePoints: step.knowledgePoints ?? [], total: TRAINING_SET.length, mistakes: run.wrongLabels }, 'simulated');
    }
    setRuns([...runs, run]);
    setPreds(p);
    setPhase('test');
  }

  async function save() {
    if (!learner || !runs.length) return;
    if (containsPrivateInfo(note)) {
      setError(PRIVACY_MESSAGE);
      await logSafety({ id: newId(), learnerId: learner.id, at: new Date().toISOString(), category: 'privacy', where: 'fruit-trainer' });
      return;
    }
    const first = runs[0], last = runs[runs.length - 1];
    const parts: WorkPart[] = TRAINING_SET.map((t) => ({ field: 'label-' + t.id, label: `${t.icon} ${t.name}`, value: labels[t.id], by: 'child' }));
    parts.push({ field: 'result', label: '模拟 AI 的测试结果', value: `正确率 ${Math.round(last.acc * 100)}%（${TEST_SET.length} 个没见过的水果）`, by: 'ai' });
    if (runs.length > 1 && last.acc > first.acc) {
      parts.push({ field: 'improvement', label: '我的改进', value: `改正标签后重新训练，正确率从 ${Math.round(first.acc * 100)}% 提高到 ${Math.round(last.acc * 100)}%`, by: 'child' });
    }
    if (note.trim()) parts.push({ field: 'reason', label: '我发现', value: note.trim(), by: 'child' });
    const now = new Date().toISOString();
    const work: Work = { id: saved?.id ?? newId(), learnerId: learner.id, lessonId, type: 'fruit-ai', title: '我的水果识别 AI（模拟）', parts, accompanied: false, shared: false, createdAt: saved?.createdAt ?? now, updatedAt: now };
    await saveWork(work);
    await recorder.record({ type: 'project_saved', stepId: step.id, workId: work.id }, 'simulated');
    await refresh();
    setSaved(work);
    setError('');
  }

  const last = runs[runs.length - 1];
  return (
    <section className="activity project">
      <p className="kind-tag">年级项目 · 模拟实验</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="sim-note">这是<b>模拟实验</b>：程序用"找最像的例子"这个简单办法，模仿 AI 从例子里学习。它不是真正的 AI 模型。</p>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.instruction} /></p>

      <h2><Txt>第 1 步：给训练数据贴标签</Txt></h2>
      <div className="train-grid">
        {TRAINING_SET.map((t) => (
          <div key={t.id} className={'train-card' + (labels[t.id] ? ' done' : '')}>
            <span className="card-icon">{t.icon}</span>
            <b>{t.name}</b>
            <span className="muted small">{t.color}色 · {t.shape === '圆' ? '圆的' : '长的'} · {t.size}个</span>
            <div className="label-row" role="group" aria-label={`${t.name}的标签`}>
              {FRUIT_LABELS.map((l) => (
                <button key={l} className={'chip small-chip' + (labels[t.id] === l ? ' on' : '')} aria-pressed={labels[t.id] === l}
                  onClick={() => { setLabels({ ...labels, [t.id]: l }); setPhase('label'); }}>{l}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="big-btn" disabled={!allLabelled} onClick={() => void train()}>
        🧠 <Txt>{runs.length ? '用新标签重新训练' : '第 2 步：开始训练（模拟）'}</Txt>
      </button>
      {!allLabelled && <p className="muted small center">8 张卡片都贴好标签，才能开始训练。</p>}

      {phase === 'test' && last && (
        <div className="test-panel">
          <h2><Txt>第 3 步：用没见过的水果测试</Txt></h2>
          <ul className="preds">
            {preds.map((p) => (
              <li key={p.sample.id} className={p.correct ? 'ok' : 'bad'}>
                <span className="card-icon">{p.sample.icon}</span>
                <span><b>{p.sample.name}</b><br /><span className="small">模拟 AI 说：<b>{p.predicted}</b>（它最像训练里的「{p.nearest.name}」）</span></span>
                <span className="pred-mark">{p.correct ? '✅' : '❌'}</span>
              </li>
            ))}
          </ul>
          <p className="accuracy">正确率：<b>{preds.filter((p) => p.correct).length}/{preds.length}</b>（{Math.round(last.acc * 100)}%）</p>
          {last.acc < 1 ? (
            <p className="hint try"><Txt>模拟 AI 认错了！它是照着你贴的标签学的。回到第 1 步检查一下：有没有哪张标签贴错了？改好后重新训练。</Txt></p>
          ) : (
            <p className="hint ok"><Txt>{runs.length > 1 ? '改正标签后，模拟 AI 全部认对了！标签贴对，AI 才能学对。' : '全部认对了！你贴的标签都是对的。'}</Txt></p>
          )}
          {runs.length === 1 && last.acc === 1 && (
            <p className="discussion">💬 <Txt>挑战：故意把「青苹果」的标签改成「香蕉」，再训练一次，看看会发生什么？</Txt></p>
          )}

          <label className="field"><span><Txt>我发现……（可以请家长帮忙打字，但要用你自己的话）</Txt></span>
            <textarea value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="比如：标签贴错了，AI 也会学错" aria-label="我发现" />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          {!saved ? (
            <button className="big-btn" onClick={() => void save()}>💾 <Txt>保存到我的作品</Txt></button>
          ) : (
            <div className="result">
              <p className="hint ok"><Txt>{`作品已保存！其中 ${Math.round(childShare(saved) * 100)}% 由你自己完成，测试结果由模拟 AI 算出。`}</Txt></p>
              <button className="big-btn secondary" onClick={() => void save()}>💾 <Txt>保存修改</Txt></button>
              <button className="big-btn" onClick={onDone}><Txt>完成这节课</Txt> →</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
