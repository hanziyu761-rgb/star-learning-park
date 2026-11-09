/// <reference lib="webworker" />
// Background worker that owns Pyodide. If a program never finishes (an endless
// loop), the page terminates this worker; nothing on the page freezes.
import { runChildCode, type PyodideLike } from './python';

let ready: Promise<PyodideLike> | null = null;

function load(): Promise<PyodideLike> {
  ready ??= (async () => {
    // '/academy/pyodide/' on the website, '/pyodide/' inside the Android app.
    const base = import.meta.env.BASE_URL + 'pyodide/';
    const mod = await import(/* @vite-ignore */ base + 'pyodide.mjs');
    return (await mod.loadPyodide({ indexURL: base })) as PyodideLike;
  })();
  return ready;
}

self.onmessage = async (e: MessageEvent<{ id: number; type: 'load' | 'run'; code?: string; inputs?: string[] }>) => {
  const { id, type, code, inputs } = e.data;
  try {
    const py = await load();
    if (type === 'load') { self.postMessage({ id, loaded: true }); return; }
    self.postMessage({ id, result: runChildCode(py, code ?? '', inputs ?? []) });
  } catch (err) {
    self.postMessage({ id, fatal: String((err as Error).message ?? err) });
  }
};
