import { useState } from 'react';
import type { ProjectActivity } from '../curriculum/types';
import type { Work, WorkPart } from '../store/types';
import { useApp } from '../app/state';
import { logSafety, newId, saveWork } from '../store/db';
import { containsPrivateInfo, PRIVACY_MESSAGE } from '../safety/privacy';
import { childShare } from '../learning/abilities';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

// 三年级项目：设计我的 AI 故事助手. The child designs the prompt (提示词).
// Nothing is sent to any AI: generating stories needs accompanied mode (V3.0).

const ROLES = ['会讲故事的老爷爷', '童话作家', '科学小博士', '森林里的小松鼠'];
const AUDIENCES = ['三年级小朋友', '刚上一年级的弟弟妹妹', '全家人'];
const REQUIREMENTS = ['不超过 300 字', '故事里有一个道理', '用简单的词语', '结尾留一个问题让我想', '有一段对话'];
export const SAFETY_RULES = '不出现可怕、暴力的内容；不问我的名字、学校和住址；不知道的事情要说"我不确定"。';

export function promptText(p: { role: string; audience: string; topic: string; reqs: string[] }): string {
  return `请你扮演${p.role || '（角色）'}，给${p.audience || '（听众）'}讲一个关于"${p.topic || '（主题）'}"的故事。要求：${p.reqs.length ? p.reqs.join('，') : '（要求）'}。安全规则：${SAFETY_RULES}`;
}

export function promptChecks(p: { role: string; audience: string; topic: string; reqs: string[] }) {
  return [
    { id: 'role', label: '说清楚 AI 扮演什么角色', ok: !!p.role },
    { id: 'task', label: '说清楚任务：讲什么主题的故事', ok: p.topic.trim().length >= 2 },
    { id: 'audience', label: '说清楚讲给谁听', ok: !!p.audience },
    { id: 'reqs', label: '至少提 2 条具体要求', ok: p.reqs.length >= 2 },
    { id: 'privacy', label: '没有写个人信息', ok: !containsPrivateInfo(p.topic) },
  ];
}

export function PromptCard({ step, lessonId, recorder, onDone }: ActivityProps<ProjectActivity>) {
  const { learner, refresh } = useApp();
  const [role, setRole] = useState('');
  const [audience, setAudience] = useState('');
  const [topic, setTopic] = useState('');
  const [reqs, setReqs] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Work | null>(null);
  const p = { role, audience, topic, reqs };
  const checks = promptChecks(p);
  const ready = checks.every((c) => c.ok);
  const toggle = (r: string) => setReqs(reqs.includes(r) ? reqs.filter((x) => x !== r) : [...reqs, r]);

  async function save() {
    if (!learner || !ready) return;
    if (containsPrivateInfo(topic) || containsPrivateInfo(reason)) {
      setError(PRIVACY_MESSAGE);
      await logSafety({ id: newId(), learnerId: learner.id, at: new Date().toISOString(), category: 'privacy', where: 'prompt-card' });
      return;
    }
    const parts: WorkPart[] = [
      { field: 'role', label: '角色', value: role, by: 'child' },
      { field: 'audience', label: '听众', value: audience, by: 'child' },
      { field: 'task', label: '故事主题', value: topic.trim(), by: 'child' },
      { field: 'rule', label: '要求', value: reqs.join('，'), by: 'child' },
      { field: 'safety', label: '安全规则', value: SAFETY_RULES, by: 'template' },
    ];
    if (reason.trim()) parts.push({ field: 'reason', label: '我为什么这样设计', value: reason.trim(), by: 'child' });
    const now = new Date().toISOString();
    const work: Work = { id: saved?.id ?? newId(), learnerId: learner.id, lessonId, type: 'prompt-card', title: `故事助手：${topic.trim()}`, parts, accompanied: false, shared: false, createdAt: saved?.createdAt ?? now, updatedAt: now };
    await saveWork(work);
    await recorder.record({ type: 'project_saved', stepId: step.id, workId: work.id });
    await refresh();
    setSaved(work);
    setError('');
  }

  return (
    <section className="activity project">
      <p className="kind-tag">年级项目</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.instruction} /></p>
      <p className="sim-note">本项目只设计提示词，不会发送给任何 AI。按教育部要求，小学生不能独自使用开放式内容生成；以后家长开启"陪同模式"，才能和家长一起用它生成故事。</p>

      <fieldset className="pick"><legend><Txt>1. AI 扮演什么角色？</Txt></legend>
        {ROLES.map((r) => <button key={r} className={'chip' + (role === r ? ' on' : '')} aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>)}
      </fieldset>
      <fieldset className="pick"><legend><Txt>2. 讲给谁听？</Txt></legend>
        {AUDIENCES.map((r) => <button key={r} className={'chip' + (audience === r ? ' on' : '')} aria-pressed={audience === r} onClick={() => setAudience(r)}>{r}</button>)}
      </fieldset>
      <label className="field"><span><Txt>3. 故事主题（自己想）</Txt></span>
        <input value={topic} maxLength={20} onChange={(e) => setTopic(e.target.value)} placeholder="比如：勇敢的小蚂蚁" aria-label="故事主题" />
      </label>
      <fieldset className="pick"><legend><Txt>4. 提要求（可以多选）</Txt></legend>
        {REQUIREMENTS.map((r) => <button key={r} className={'chip' + (reqs.includes(r) ? ' on' : '')} aria-pressed={reqs.includes(r)} onClick={() => toggle(r)}>{r}</button>)}
      </fieldset>

      <div className="prompt-preview" aria-label="提示词预览">
        <p className="small muted">我的提示词：</p>
        <p>{promptText(p)}</p>
      </div>
      <ul className="checklist" aria-label="提示词检查">
        {checks.map((c) => <li key={c.id} className={c.ok ? 'ok' : ''}>{c.ok ? '✅' : '⬜'} {c.label}</li>)}
      </ul>

      <label className="field"><span><Txt>5. 我为什么这样设计？（选填，用自己的话）</Txt></span>
        <textarea value={reason} maxLength={80} onChange={(e) => setReason(e.target.value)} placeholder="比如：弟弟还小，所以要用简单的词" aria-label="我为什么这样设计" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {!saved ? (
        <button className="big-btn" disabled={!ready} onClick={() => void save()}>💾 <Txt>保存提示词卡片</Txt></button>
      ) : (
        <div className="result">
          <p className="hint ok"><Txt>{`提示词卡片已保存！${Math.round(childShare(saved) * 100)}% 由你自己设计，安全规则来自平台模板。`}</Txt></p>
          <button className="big-btn secondary" onClick={() => void save()}>💾 <Txt>保存修改</Txt></button>
          <button className="big-btn" onClick={onDone}><Txt>完成这节课</Txt> →</button>
        </div>
      )}
      {!ready && !saved && <p className="muted small center">检查清单全部打勾，就可以保存。</p>}
    </section>
  );
}
