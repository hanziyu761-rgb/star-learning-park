import { useEffect, useRef, useState } from 'react';
import type { ProjectActivity } from '../curriculum/types';
import type { Work, WorkPart } from '../store/types';
import { useApp } from '../app/state';
import { logSafety, newId, saveWork } from '../store/db';
import { containsPrivateInfo, PRIVACY_MESSAGE } from '../safety/privacy';
import { checkResult } from '../learning/python';
import { preparePython, runPython } from '../learning/pyRunner';
import { childShare } from '../learning/abilities';
import { SpeakButton, Txt } from '../ui/Txt';
import { CodeEditor, OutputPanel, type RunView } from './Python';
import type { ActivityProps } from './common';

/** Lines the child wrote or changed, compared with the starting template. */
export function childLines(starter: string, code: string): string[] {
  const base = new Set(starter.split('\n').map((l) => l.trim()).filter(Boolean));
  return code.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#') && !base.has(l.trim()));
}

export function PythonProject({ step, lessonId, recorder, onDone }: ActivityProps<ProjectActivity>) {
  const { learner, refresh } = useApp();
  const spec = step.python!;
  const [code, setCode] = useState(spec.starter);
  const [view, setView] = useState<RunView>({ status: 'idle' });
  const [passed, setPassed] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Work | null>(null);
  const failedRuns = useRef(0);
  const recorded = useRef(false);

  useEffect(() => { void preparePython(); }, []);

  async function run() {
    setView({ status: 'loading' });
    if (!(await preparePython())) { setView({ status: 'failed', message: 'Python 运行环境没有加载成功。请检查网络后刷新页面。' }); return; }
    setView({ status: 'running' });
    const out = await runPython(code, spec.inputs ?? []);
    if (out.kind === 'timeout') { setView({ status: 'timeout' }); failedRuns.current += 1; return; }
    if (out.kind === 'failed') { setView({ status: 'failed', message: out.message }); return; }
    setView({ status: 'done', result: out.result });
    const c = checkResult(code, out.result, spec.check);
    setMissing(c.missing);
    setPassed(c.pass);
    if (!c.pass) { failedRuns.current += 1; return; }
    if (!recorded.current) {
      recorded.current = true;
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'python', knowledgePoints: step.knowledgePoints ?? [], total: 1, mistakes: failedRuns.current });
    }
  }

  async function save() {
    if (!learner || !passed) return;
    if (containsPrivateInfo(code) || containsPrivateInfo(reason)) {
      setError(PRIVACY_MESSAGE);
      await logSafety({ id: newId(), learnerId: learner.id, at: new Date().toISOString(), category: 'privacy', where: 'python-project' });
      return;
    }
    const mine = childLines(spec.starter, code);
    const parts: WorkPart[] = [
      { field: 'starter', label: '起始模板', value: `${spec.starter.split('\n').filter((l) => l.trim()).length} 行（平台提供）`, by: 'template' },
      { field: 'code', label: `我写的代码（${mine.length} 行）`, value: mine.join('\n'), by: 'child' },
    ];
    if (failedRuns.current > 0) parts.push({ field: 'improvement', label: '我的调试', value: `运行 ${failedRuns.current} 次没通过，自己改正后通过了`, by: 'child' });
    if (reason.trim()) parts.push({ field: 'reason', label: '我的说明', value: reason.trim(), by: 'child' });
    const now = new Date().toISOString();
    const work: Work = { id: saved?.id ?? newId(), learnerId: learner.id, lessonId, type: 'python', title: step.title.replace(/^年级项目：/, ''), parts, result: '程序运行通过检查', accompanied: false, shared: false, createdAt: saved?.createdAt ?? now, updatedAt: now };
    await saveWork(work);
    await recorder.record({ type: 'project_saved', stepId: step.id, workId: work.id });
    await refresh();
    setSaved(work);
    setError('');
  }

  return (
    <section className="activity project">
      <p className="kind-tag">年级项目 · Python</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction">{step.instruction} <SpeakButton text={step.instruction} /></p>
      {spec.inputs?.length ? <p className="muted small">测试用的输入数据：{spec.inputs.join('、')}</p> : null}
      <CodeEditor value={code} onChange={(v) => { setCode(v); setPassed(false); }} label="项目代码" />
      <button className="big-btn" onClick={() => void run()} disabled={view.status === 'loading' || view.status === 'running'}>▶ 运行并检查</button>
      <OutputPanel view={view} />
      {view.status === 'done' && !passed && !view.result.error && missing.length > 0 && <p className="hint try">还没达到要求：{missing.join('；')}。</p>}
      {passed && (
        <div className="result">
          <p className="hint ok">程序通过检查！</p>
          <label className="field"><span>说说你的程序是怎么工作的（选填）</span>
            <textarea value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} aria-label="我的说明" />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          {!saved ? <button className="big-btn" onClick={() => void save()}>💾 保存到我的作品</button> : (
            <>
              <p className="hint ok">已保存！其中 {Math.round(childShare(saved) * 100)}% 的部分由你完成，起始模板由平台提供。</p>
              <button className="big-btn secondary" onClick={() => void save()}>💾 保存修改</button>
              <button className="big-btn" onClick={onDone}>完成这节课 →</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
