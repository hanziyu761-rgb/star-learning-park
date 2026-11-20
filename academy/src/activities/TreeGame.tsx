import { useState } from 'react';
import type { ProjectActivity } from '../curriculum/types';
import type { Work, WorkPart } from '../store/types';
import { useApp } from '../app/state';
import { logSafety, newId, saveWork } from '../store/db';
import { containsPrivateInfo, PRIVACY_MESSAGE } from '../safety/privacy';
import { ANIMALS, CLASSES, evaluate, QUESTIONS, type AnimalClass, type Question, type TreeNode } from '../learning/tree';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

type Branch = { kind: 'leaf'; label: AnimalClass | null } | { kind: 'ask'; q: Question | null; yes: AnimalClass | null; no: AnimalClass | null };
const QS = Object.keys(QUESTIONS) as Question[];

function toNode(b: Branch): TreeNode | null {
  if (b.kind === 'leaf') return b.label ? { leaf: b.label } : null;
  return b.q && b.yes && b.no ? { q: b.q, yes: { leaf: b.yes }, no: { leaf: b.no } } : null;
}

function branchText(b: Branch): string {
  if (b.kind === 'leaf') return `分到${b.label}`;
  return `再问"${QUESTIONS[b.q!]}"——是：${b.yes}；不是：${b.no}`;
}

function BranchEditor({ name, value, onChange, exclude }: { name: string; value: Branch; onChange: (b: Branch) => void; exclude: Question | null }) {
  return (
    <div className="branch" role="group" aria-label={name}>
      <p className="branch-title"><b>{name}</b></p>
      <div className="chips">
        <button className={'chip' + (value.kind === 'leaf' ? ' on' : '')} aria-pressed={value.kind === 'leaf'} onClick={() => onChange({ kind: 'leaf', label: null })}>直接分类</button>
        <button className={'chip' + (value.kind === 'ask' ? ' on' : '')} aria-pressed={value.kind === 'ask'} onClick={() => onChange({ kind: 'ask', q: null, yes: null, no: null })}>再问一个问题</button>
      </div>
      {value.kind === 'leaf' && (
        <div className="chips">{CLASSES.map((c) => <button key={c} className={'chip small-chip' + (value.label === c ? ' on' : '')} aria-pressed={value.label === c} onClick={() => onChange({ kind: 'leaf', label: c })}>{c}</button>)}</div>
      )}
      {value.kind === 'ask' && (
        <>
          <div className="chips">{QS.filter((q) => q !== exclude).map((q) => <button key={q} className={'chip small-chip' + (value.q === q ? ' on' : '')} aria-pressed={value.q === q} onClick={() => onChange({ ...value, q })}>{QUESTIONS[q]}</button>)}</div>
          {value.q && (['yes', 'no'] as const).map((side) => (
            <div key={side} className="chips sub" role="group" aria-label={`${name}·${side === 'yes' ? '是' : '不是'}`}>
              <span className="muted small">{side === 'yes' ? '是 →' : '不是 →'}</span>
              {CLASSES.map((c) => <button key={c} className={'chip small-chip' + (value[side] === c ? ' on' : '')} aria-pressed={value[side] === c} onClick={() => onChange({ ...value, [side]: c })}>{c}</button>)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function TreeGame({ step, lessonId, recorder, onDone }: ActivityProps<ProjectActivity>) {
  const { learner, refresh } = useApp();
  const [root, setRoot] = useState<Question | null>(null);
  const [yes, setYes] = useState<Branch>({ kind: 'leaf', label: null });
  const [no, setNo] = useState<Branch>({ kind: 'leaf', label: null });
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);
  const [runs, setRuns] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Work | null>(null);
  const yesNode = toNode(yes), noNode = toNode(no);
  const tree: TreeNode | null = root && yesNode && noNode ? { q: root, yes: yesNode, no: noNode } : null;

  async function test() {
    if (!tree) return;
    const r = evaluate(tree);
    if (runs.length === 0) {
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'classifier', knowledgePoints: step.knowledgePoints ?? [], total: r.total, mistakes: r.total - r.correct });
    }
    setRuns([...runs, r.correct]);
    setResult(r);
  }

  async function save() {
    if (!learner || !tree || !result) return;
    if (containsPrivateInfo(reason)) {
      setError(PRIVACY_MESSAGE);
      await logSafety({ id: newId(), learnerId: learner.id, at: new Date().toISOString(), category: 'privacy', where: 'tree-game' });
      return;
    }
    const parts: WorkPart[] = [
      { field: 'rule', label: '第一个问题', value: QUESTIONS[root!], by: 'child' },
      { field: 'yes', label: '回答"是"时', value: branchText(yes), by: 'child' },
      { field: 'no', label: '回答"不是"时', value: branchText(no), by: 'child' },
    ];
    if (runs.length > 1 && runs[runs.length - 1] > runs[0]) {
      parts.push({ field: 'improvement', label: '我的改进', value: `修改规则后，答对的动物从 ${runs[0]} 个增加到 ${runs[runs.length - 1]} 个`, by: 'child' });
    }
    if (reason.trim()) parts.push({ field: 'reason', label: '我为什么这样设计', value: reason.trim(), by: 'child' });
    const now = new Date().toISOString();
    const work: Work = {
      id: saved?.id ?? newId(), learnerId: learner.id, lessonId, type: 'classifier', title: '我的动物分类游戏', parts,
      result: `${result.total} 张动物卡片答对 ${result.correct} 张`, accompanied: false, shared: false, createdAt: saved?.createdAt ?? now, updatedAt: now,
    };
    await saveWork(work);
    await recorder.record({ type: 'project_saved', stepId: step.id, workId: work.id });
    await refresh();
    setSaved(work);
    setError('');
  }

  const reset = () => setResult(null);
  return (
    <section className="activity project">
      <p className="kind-tag">年级项目</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.instruction} /></p>
      <p className="sim-note">这是一个<b>真正的分类算法</b>（决策树）：电脑会严格按你设计的问题，给 {ANIMALS.length} 张动物卡片分类。</p>

      <fieldset className="pick"><legend><Txt>1. 第一个问题问什么？</Txt></legend>
        {QS.map((q) => <button key={q} className={'chip' + (root === q ? ' on' : '')} aria-pressed={root === q} onClick={() => { setRoot(q); reset(); }}>{QUESTIONS[q]}</button>)}
      </fieldset>
      {root && (
        <>
          <BranchEditor name={`2. 如果"${QUESTIONS[root]}"回答是`} value={yes} onChange={(b) => { setYes(b); reset(); }} exclude={root} />
          <BranchEditor name={`3. 如果"${QUESTIONS[root]}"回答不是`} value={no} onChange={(b) => { setNo(b); reset(); }} exclude={root} />
        </>
      )}
      <button className="big-btn" disabled={!tree} onClick={() => void test()}>▶ <Txt>{runs.length ? '用新规则再测一次' : '用动物卡片测试'}</Txt></button>
      {!tree && <p className="muted small center">每一条路都要分到一个类别，才能测试。</p>}

      {result && (
        <div className="test-panel">
          <p className="accuracy">答对：<b>{result.correct}/{result.total}</b></p>
          <ul className="preds">
            {result.rows.map((r) => (
              <li key={r.animal.id} className={r.correct ? 'ok' : 'bad'}>
                <span className="card-icon">{r.animal.icon}</span>
                <span><b>{r.animal.name}</b>（其实是{r.animal.truth}）<br /><span className="small">{r.path.join(' → ')} → 分到 <b>{r.predicted}</b></span></span>
                <span className="pred-mark">{r.correct ? '✅' : '❌'}</span>
              </li>
            ))}
          </ul>
          {result.correct < result.total
            ? <p className="hint try"><Txt>有的动物分错了。看看是哪个问题让它们走错了路？换一个更能区分的问题试试。</Txt></p>
            : <p className="hint ok"><Txt>全部分对了！你选的问题很能抓住每类动物的特征。</Txt></p>}
          <label className="field"><span><Txt>我为什么这样设计？（选填，用自己的话）</Txt></span>
            <textarea value={reason} maxLength={80} onChange={(e) => setReason(e.target.value)} placeholder="比如：只有鸟有羽毛，所以先问羽毛" aria-label="我为什么这样设计" />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          {!saved ? (
            <button className="big-btn" onClick={() => void save()}>💾 <Txt>保存我的分类游戏</Txt></button>
          ) : (
            <div className="result">
              <p className="hint ok"><Txt>已保存到我的作品！规则全部由你自己设计，答对的数量由程序计算。</Txt></p>
              <button className="big-btn secondary" onClick={() => void save()}>💾 <Txt>保存修改</Txt></button>
              <button className="big-btn" onClick={onDone}><Txt>完成这节课</Txt> →</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
