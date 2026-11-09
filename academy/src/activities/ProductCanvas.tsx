import { useState } from 'react';
import type { ProjectActivity } from '../curriculum/types';
import type { Work, WorkPart } from '../store/types';
import { useApp } from '../app/state';
import { logSafety, newId, saveWork } from '../store/db';
import { containsPrivateInfo, PRIVACY_MESSAGE } from '../safety/privacy';
import { childShare } from '../learning/abilities';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

// 六年级项目：设计并完成一个自己的 AI 产品（产品设计画布）.
const USERS = ['同学', '低年级小朋友', '家人', '老师', '社区里的人'];
const AI_ABILITIES = ['语音识别', '图像识别', '大语言模型', '分类模型', '知识库检索', '不需要 AI'];
export const SAFETY_QUESTIONS = [
  { id: 'privacy', q: '会收集哪些信息？怎样做到只收集必要的？' },
  { id: 'errors', q: 'AI 出错时怎么办？谁来检查？' },
  { id: 'fair', q: '对不同的人公平吗？有没有人会被忽略？' },
  { id: 'adult', q: '小朋友使用时需要家长或老师陪同吗？' },
];

export function canvasReady(f: { name: string; problem: string; users: string[]; features: string; data: string; abilities: string[]; safety: Record<string, string> }) {
  return f.name.trim().length >= 2 && f.problem.trim().length >= 6 && f.users.length > 0 && f.features.trim().length >= 6 && f.data.trim().length >= 2
    && f.abilities.length > 0 && SAFETY_QUESTIONS.every((s) => (f.safety[s.id] ?? '').trim().length >= 4);
}

export function ProductCanvas({ step, lessonId, recorder, onDone }: ActivityProps<ProjectActivity>) {
  const { learner, refresh } = useApp();
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [features, setFeatures] = useState('');
  const [data, setData] = useState('');
  const [abilities, setAbilities] = useState<string[]>([]);
  const [safety, setSafety] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Work | null>(null);
  const ready = canvasReady({ name, problem, users, features, data, abilities, safety });
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function save() {
    if (!learner || !ready) return;
    const texts = [name, problem, features, data, ...Object.values(safety)];
    if (texts.some((t) => containsPrivateInfo(t))) {
      setError(PRIVACY_MESSAGE);
      await logSafety({ id: newId(), learnerId: learner.id, at: new Date().toISOString(), category: 'privacy', where: 'product-canvas' });
      return;
    }
    const parts: WorkPart[] = [
      { field: 'problem', label: '要解决的问题', value: problem.trim(), by: 'child' },
      { field: 'users', label: '给谁用', value: users.join('、'), by: 'child' },
      { field: 'rule', label: '主要功能', value: features.trim(), by: 'child' },
      { field: 'data', label: '需要的数据', value: data.trim(), by: 'child' },
      { field: 'ai', label: '用到的 AI 能力', value: abilities.join('、'), by: 'child' },
      ...SAFETY_QUESTIONS.map((s) => ({ field: 'safety-' + s.id, label: s.q, value: safety[s.id].trim(), by: 'child' as const })),
    ];
    const now = new Date().toISOString();
    const work: Work = { id: saved?.id ?? newId(), learnerId: learner.id, lessonId, type: 'product', title: name.trim(), parts, accompanied: false, shared: false, createdAt: saved?.createdAt ?? now, updatedAt: now };
    await saveWork(work);
    await recorder.record({ type: 'project_saved', stepId: step.id, workId: work.id });
    await refresh();
    setSaved(work);
    setError('');
  }

  const area = (label: string, value: string, set: (v: string) => void, placeholder: string, max = 120) => (
    <label className="field"><span>{label}</span><textarea value={value} maxLength={max} onChange={(e) => set(e.target.value)} placeholder={placeholder} aria-label={label} /></label>
  );

  return (
    <section className="activity project">
      <p className="kind-tag">毕业项目</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction">{step.instruction} <SpeakButton text={step.instruction} /></p>

      <label className="field"><span>1. 产品名字</span><input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} placeholder="比如：口算小教练" aria-label="产品名字" /></label>
      {area('2. 它要解决什么问题？', problem, setProblem, '比如：一年级同学口算容易粗心，需要有人提醒检查')}
      <fieldset className="pick"><legend>3. 给谁用？（可多选）</legend>
        {USERS.map((u) => <button key={u} className={'chip' + (users.includes(u) ? ' on' : '')} aria-pressed={users.includes(u)} onClick={() => toggle(users, setUsers, u)}>{u}</button>)}
      </fieldset>
      {area('4. 主要功能（写 2–3 条）', features, setFeatures, '比如：出口算题；答错时给提示，不直接给答案；每周给家长一份小结')}
      {area('5. 需要哪些数据？', data, setData, '比如：口算题库、每次答题的对错（不需要名字）')}
      <fieldset className="pick"><legend>6. 用到哪些 AI 能力？（可多选）</legend>
        {AI_ABILITIES.map((a) => <button key={a} className={'chip' + (abilities.includes(a) ? ' on' : '')} aria-pressed={abilities.includes(a)} onClick={() => toggle(abilities, setAbilities, a)}>{a}</button>)}
      </fieldset>
      <h2>7. 安全与伦理设计（每一条都要回答）</h2>
      {SAFETY_QUESTIONS.map((s) => area(s.q, safety[s.id] ?? '', (v) => setSafety({ ...safety, [s.id]: v }), '写下你的设计', 100))}

      {error && <p className="error" role="alert">{error}</p>}
      {!saved ? (
        <button className="big-btn" disabled={!ready} onClick={() => void save()}>💾 保存我的产品设计</button>
      ) : (
        <div className="result">
          <p className="hint ok">产品设计已保存！{Math.round(childShare(saved) * 100)}% 由你自己完成。</p>
          <button className="big-btn secondary" onClick={() => void save()}>💾 保存修改</button>
          <button className="big-btn" onClick={onDone}>完成这节课 →</button>
        </div>
      )}
      {!ready && !saved && <p className="muted small center">每一项都要填写，安全与伦理的 4 个问题都要回答，才能保存。</p>}
    </section>
  );
}
