import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { PythonActivity } from '../curriculum/types';
import { checkResult, type PyResult } from '../learning/python';
import { preparePython, runPython, RUN_TIMEOUT_MS } from '../learning/pyRunner';
import { Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

/** Plain textarea with kid-friendly code editing: Tab inserts 4 spaces, Enter keeps indentation. */
export function CodeEditor({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: t } = el;
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = value.slice(0, s) + '    ' + value.slice(t);
      onChange(v);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const line = value.slice(lineStart, s);
      let indent = /^ */.exec(line)![0];
      if (/:\s*$/.test(line)) indent += '    ';
      const v = value.slice(0, s) + '\n' + indent + value.slice(t);
      onChange(v);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 1 + indent.length; });
    }
  }
  return (
    <textarea ref={ref} className="code" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
      spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off" aria-label={label}
      rows={Math.max(6, value.split('\n').length + 1)} />
  );
}

export type RunView = { status: 'idle' } | { status: 'loading' } | { status: 'running' } | { status: 'done'; result: PyResult } | { status: 'timeout' } | { status: 'failed'; message: string };

export function OutputPanel({ view }: { view: RunView }) {
  if (view.status === 'idle') return null;
  if (view.status === 'loading') return <p className="muted small" role="status">正在准备 Python 运行环境（第一次需要下载约 13 MB，之后会快很多）…</p>;
  if (view.status === 'running') return <p className="muted small" role="status">运行中…</p>;
  if (view.status === 'timeout') return <p className="hint try" role="status">程序运行超过 {RUN_TIMEOUT_MS / 1000} 秒，已经自动停止。是不是写出了停不下来的循环？</p>;
  if (view.status === 'failed') return <p className="error" role="alert">{view.message}</p>;
  const r = view.result;
  return (
    <div className="output" aria-label="运行结果">
      <pre>{r.stdout || '（没有输出）'}</pre>
      {r.error && <p className="py-error"><b>出错了：</b>{r.error}{r.hint && <><br />💡 {r.hint}</>}</p>}
    </div>
  );
}

export function PythonView({ step, recorder, onDone }: ActivityProps<PythonActivity>) {
  const [code, setCode] = useState(step.starter);
  const [view, setView] = useState<RunView>({ status: 'idle' });
  const [hintIdx, setHintIdx] = useState(-1);
  const [passed, setPassed] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const failedRuns = useRef(0);
  const recorded = useRef(false);

  useEffect(() => { void preparePython(); }, []);

  async function run() {
    setView({ status: 'loading' });
    const ready = await preparePython();
    if (!ready) { setView({ status: 'failed', message: 'Python 运行环境没有加载成功。请检查网络后刷新页面。' }); return; }
    setView({ status: 'running' });
    const out = await runPython(code, step.inputs ?? []);
    if (out.kind === 'timeout') { setView({ status: 'timeout' }); failedRuns.current += 1; return; }
    if (out.kind === 'failed') { setView({ status: 'failed', message: out.message }); return; }
    setView({ status: 'done', result: out.result });
    const c = checkResult(code, out.result, step.check);
    setMissing(c.missing);
    if (!c.pass) { failedRuns.current += 1; return; }
    setPassed(true);
    if (!recorded.current) {
      recorded.current = true;
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'python', knowledgePoints: step.knowledgePoints, total: 1, mistakes: failedRuns.current });
    }
  }

  return (
    <section className="activity">
      <p className="kind-tag">Python 编程</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction">{step.instruction}</p>
      {step.inputs?.length ? <p className="muted small">这道题的输入数据（程序里的 input() 会依次读到）：{step.inputs.join('、')}</p> : null}
      <CodeEditor value={code} onChange={(v) => { setCode(v); setPassed(false); }} label="Python 代码" />
      <div className="row-btns">
        <button className="chip" onClick={() => setHintIdx((i) => Math.min(i + 1, step.hints.length - 1))} disabled={hintIdx >= step.hints.length - 1}>💡 提示</button>
        <button className="chip" onClick={() => { setCode(step.starter); setPassed(false); }}>↺ 恢复起始代码</button>
      </div>
      {hintIdx >= 0 && <ul className="hints">{step.hints.slice(0, hintIdx + 1).map((h) => <li key={h}>{h}</li>)}</ul>}
      <button className="big-btn" onClick={() => void run()} disabled={view.status === 'loading' || view.status === 'running'}>▶ 运行代码</button>
      <OutputPanel view={view} />
      {view.status === 'done' && !passed && !view.result.error && missing.length > 0 && (
        <p className="hint try" role="status">程序运行了，但还没达到要求：{missing.join('；')}。</p>
      )}
      {passed && (
        <div className="result">
          <p className="hint ok" role="status">通过！{step.explain}</p>
          <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
        </div>
      )}
    </section>
  );
}
