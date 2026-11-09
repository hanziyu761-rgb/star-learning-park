import type { PyResult } from './python';

// Page-side controller for the Python worker: loads Pyodide once, runs code
// with a time limit, and replaces the worker after a timeout.

export const RUN_TIMEOUT_MS = 5000;
const LOAD_TIMEOUT_MS = 90_000;

export type RunOutcome = { kind: 'done'; result: PyResult } | { kind: 'timeout' } | { kind: 'failed'; message: string };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (data: { result?: PyResult; loaded?: boolean; fatal?: string }) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => { const cb = pending.get(e.data.id); if (cb) { pending.delete(e.data.id); cb(e.data); } };
  }
  return worker;
}

function kill() {
  worker?.terminate();
  worker = null;
  pending.clear();
}

function call<T>(msg: Record<string, unknown>, timeout: number, map: (d: { result?: PyResult; loaded?: boolean; fatal?: string }) => T, onTimeout: () => T): Promise<T> {
  return new Promise((resolve) => {
    const id = ++seq;
    const t = setTimeout(() => { pending.delete(id); kill(); resolve(onTimeout()); }, timeout);
    pending.set(id, (d) => { clearTimeout(t); resolve(map(d)); });
    getWorker().postMessage({ id, ...msg });
  });
}

/** Loads Pyodide (about 13 MB the first time; cached afterwards). */
export function preparePython(): Promise<boolean> {
  return call({ type: 'load' }, LOAD_TIMEOUT_MS, (d) => !!d.loaded, () => false);
}

export async function runPython(code: string, inputs: string[] = []): Promise<RunOutcome> {
  const ok = await preparePython();
  if (!ok) return { kind: 'failed', message: 'Python 运行环境没有加载成功。请检查网络后刷新页面。' };
  return call<RunOutcome>({ type: 'run', code, inputs }, RUN_TIMEOUT_MS,
    (d) => (d.result ? { kind: 'done', result: d.result } : { kind: 'failed', message: d.fatal ?? '运行失败' }),
    () => ({ kind: 'timeout' }));
}
