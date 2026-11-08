import { useState } from 'react';
import type { ProjectActivity } from '../curriculum/types';
import type { Work, WorkPart } from '../store/types';
import { useApp } from '../app/state';
import { logSafety, newId, saveWork } from '../store/db';
import { containsPrivateInfo, PRIVACY_MESSAGE } from '../safety/privacy';
import { childShare } from '../learning/abilities';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

// Grade 1 project: 设计我的智能机器人. No AI is involved. Every choice and every
// word is the child's own, so every part is recorded as by: 'child'.

const BODIES = [{ id: 'wheels', label: '轮子', icon: '🛞' }, { id: 'legs', label: '两条腿', icon: '🦿' }, { id: 'fly', label: '会飞', icon: '🚁' }, { id: 'arm', label: '机械手臂', icon: '🦾' }];
const SENSES = [{ id: 'eyes', label: '摄像头眼睛', icon: '👀' }, { id: 'ears', label: '麦克风耳朵', icon: '👂' }, { id: 'touch', label: '碰撞感应', icon: '✋' }];
const JOBS = [{ id: 'water', label: '帮忙浇花', icon: '🪴' }, { id: 'english', label: '陪我练英语', icon: '🔤' }, { id: 'toys', label: '整理玩具', icon: '🧸' }, { id: 'drink', label: '提醒我喝水', icon: '🥤' }];
const IFS = ['看到花盆的土干了', '听到有人说"你好"', '前面有墙', '到了晚上八点半'];
const THENS = ['浇一点水', '说"你好"', '转个方向', '提醒我准备睡觉'];

export function RobotDesigner({ step, lessonId, recorder, onDone }: ActivityProps<ProjectActivity>) {
  const { learner, refresh } = useApp();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [senses, setSenses] = useState<string[]>([]);
  const [job, setJob] = useState('');
  const [needsAi, setNeedsAi] = useState<'' | 'yes' | 'no'>('');
  const [ifPart, setIf] = useState('');
  const [thenPart, setThen] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Work | null>(null);

  const ready = name.trim() && body && senses.length && job && ifPart && thenPart && needsAi;

  async function save() {
    if (!learner || !ready) return;
    for (const text of [name, reason]) {
      if (containsPrivateInfo(text)) {
        setError(PRIVACY_MESSAGE);
        await logSafety({ id: newId(), learnerId: learner.id, at: new Date().toISOString(), category: 'privacy', where: 'robot-designer' });
        return;
      }
    }
    const label = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)!.label;
    const parts: WorkPart[] = [
      { field: 'name', label: '名字', value: name.trim(), by: 'child' },
      { field: 'body', label: '身体', value: label(BODIES, body), by: 'child' },
      { field: 'senses', label: '感知', value: senses.map((s) => label(SENSES, s)).join('、'), by: 'child' },
      { field: 'job', label: '工作', value: label(JOBS, job), by: 'child' },
      { field: 'ai', label: '需要 AI 吗', value: needsAi === 'yes' ? '需要，它要自己判断' : '不需要，按固定步骤做', by: 'child' },
      { field: 'rule', label: '规则', value: `如果${ifPart}，就${thenPart}`, by: 'child' },
    ];
    if (reason.trim()) parts.push({ field: 'reason', label: '为什么需要这条规则', value: reason.trim(), by: 'child' });
    const now = new Date().toISOString();
    const work: Work = { id: saved?.id ?? newId(), learnerId: learner.id, lessonId, type: 'robot', title: name.trim(), parts, accompanied: false, shared: false, createdAt: saved?.createdAt ?? now, updatedAt: now };
    await saveWork(work);
    await recorder.record({ type: 'project_saved', stepId: step.id, workId: work.id });
    await refresh();
    setSaved(work);
    setError('');
  }

  const toggle = (id: string) => setSenses((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const icon = (list: { id: string; icon: string }[], id: string) => list.find((x) => x.id === id)?.icon ?? '';

  return (
    <section className="activity project">
      <p className="kind-tag">年级项目</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.instruction} /></p>

      <div className="robot-preview" aria-label="机器人预览">
        <span className="robot-face">🤖</span>
        <span className="robot-parts">{icon(BODIES, body)} {senses.map((s) => icon(SENSES, s)).join('')} {icon(JOBS, job)}</span>
        <b>{name.trim() || '我的机器人'}</b>
        {ifPart && thenPart && <span className="robot-rule">如果{ifPart}，就{thenPart}</span>}
      </div>

      <label className="field"><span><Txt>1. 给它起个名字</Txt></span>
        <input value={name} maxLength={10} onChange={(e) => setName(e.target.value)} placeholder="比如：小绿" aria-label="机器人名字" />
      </label>

      <fieldset className="pick"><legend><Txt>2. 它的身体</Txt></legend>
        {BODIES.map((b) => <button key={b.id} className={'chip' + (body === b.id ? ' on' : '')} aria-pressed={body === b.id} onClick={() => setBody(b.id)}>{b.icon} {b.label}</button>)}
      </fieldset>

      <fieldset className="pick"><legend><Txt>3. 它怎么感知世界（可以多选）</Txt></legend>
        {SENSES.map((s) => <button key={s.id} className={'chip' + (senses.includes(s.id) ? ' on' : '')} aria-pressed={senses.includes(s.id)} onClick={() => toggle(s.id)}>{s.icon} {s.label}</button>)}
      </fieldset>

      <fieldset className="pick"><legend><Txt>4. 它的工作</Txt></legend>
        {JOBS.map((j) => <button key={j.id} className={'chip' + (job === j.id ? ' on' : '')} aria-pressed={job === j.id} onClick={() => setJob(j.id)}>{j.icon} {j.label}</button>)}
      </fieldset>

      <fieldset className="pick"><legend><Txt>5. 它需要 AI 吗？</Txt></legend>
        <button className={'chip' + (needsAi === 'yes' ? ' on' : '')} aria-pressed={needsAi === 'yes'} onClick={() => setNeedsAi('yes')}>💡 需要，它要自己判断</button>
        <button className={'chip' + (needsAi === 'no' ? ' on' : '')} aria-pressed={needsAi === 'no'} onClick={() => setNeedsAi('no')}>📋 不需要，按固定步骤做</button>
      </fieldset>

      <fieldset className="pick"><legend><Txt>6. 定一条规则：如果……</Txt></legend>
        {IFS.map((x) => <button key={x} className={'chip' + (ifPart === x ? ' on' : '')} aria-pressed={ifPart === x} onClick={() => setIf(x)}>{x}</button>)}
      </fieldset>
      <fieldset className="pick"><legend><Txt>……就</Txt></legend>
        {THENS.map((x) => <button key={x} className={'chip' + (thenPart === x ? ' on' : '')} aria-pressed={thenPart === x} onClick={() => setThen(x)}>{x}</button>)}
      </fieldset>

      <label className="field"><span><Txt>7. 为什么需要这条规则？（可以请家长帮忙打字，但要用你自己的话）</Txt></span>
        <textarea value={reason} maxLength={80} onChange={(e) => setReason(e.target.value)} placeholder="比如：因为土干了花会渴" aria-label="为什么需要这条规则" />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {!saved ? (
        <button className="big-btn" disabled={!ready} onClick={() => void save()}>💾 <Txt>保存到我的作品</Txt></button>
      ) : (
        <div className="result">
          <p className="hint ok"><Txt>{`作品已保存！这件作品 ${Math.round(childShare(saved) * 100)}% 由你自己完成。`}</Txt></p>
          <button className="big-btn secondary" onClick={() => void save()}>💾 <Txt>保存修改</Txt></button>
          <button className="big-btn" onClick={onDone}><Txt>完成这节课</Txt> →</button>
        </div>
      )}
      {!ready && !saved && <p className="muted small center">完成 1–6 步就可以保存，第 7 步可选。</p>}
    </section>
  );
}
