// @vitest-environment node
// Runs every Python exercise for real with Pyodide (the same runtime the
// browser uses): each reference solution must pass its check, and each
// starting template must NOT pass on its own (the child has to write code).
import { loadPyodide } from 'pyodide';
import { join } from 'node:path';
import { checkResult, runChildCode, type PyodideLike } from '../src/learning/python';
import { LESSONS } from '../src/curriculum/catalog';

let py: PyodideLike;
beforeAll(async () => {
  py = (await loadPyodide({ indexURL: join(__dirname, '../node_modules/pyodide/') })) as unknown as PyodideLike;
}, 120_000);

const exercises = LESSONS.flatMap((l) => l.steps.flatMap((s) => {
  if (s.kind === 'python') return [{ name: `${l.id} ${s.title}`, starter: s.starter, solution: s.solution, inputs: s.inputs ?? [], check: s.check }];
  if (s.kind === 'project' && s.python) return [{ name: `${l.id} ${s.title}`, starter: s.python.starter, solution: s.python.solution, inputs: s.python.inputs ?? [], check: s.python.check }];
  return [];
}));

describe('python exercises (real Python)', () => {
  it('there are Python exercises in grades 5 and 6', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(12);
  });

  for (const ex of exercises) {
    it(`${ex.name}: the reference solution passes`, () => {
      const r = runChildCode(py, ex.solution, [...ex.inputs]);
      expect(r.error).toBeNull();
      expect(checkResult(ex.solution, r, ex.check)).toEqual({ pass: true, missing: [] });
    });
    it(`${ex.name}: the starter alone does not pass`, () => {
      const r = runChildCode(py, ex.starter, [...ex.inputs]);
      expect(checkResult(ex.starter, r, ex.check).pass).toBe(false);
    });
  }
});

describe('python runner behaviour', () => {
  it('each run starts fresh (no leftover variables)', () => {
    runChildCode(py, 'secret = 42');
    const r = runChildCode(py, 'print(secret)');
    expect(r.errorType).toBe('NameError');
    expect(r.hint).toMatch(/名字错误/);
  });

  it('reports the line number of the child\'s code and a Chinese hint', () => {
    const r = runChildCode(py, 'a = 1\nprint("我" + a)');
    expect(r.errorType).toBe('TypeError');
    expect(r.error).toMatch(/^第 2 行/);
    expect(r.hint).toMatch(/str\(\)/);
  });

  it('input() reads preset lines and explains when they run out', () => {
    const r = runChildCode(py, 'x = input("名字？")\ny = input()', ['小星星']);
    expect(r.stdout).toContain('名字？小星星');
    expect(r.errorType).toBe('EOFError');
  });

  it('the sample API is offline fixed data and handles unknown cities', () => {
    const r = runChildCode(py, 'print(ask_weather("北京")["天气"])\nprint(ask_weather("火星")["状态"])\nprint(ask_dictionary("cat")["中文"])');
    expect(r.stdout).toBe('晴\n失败\n猫\n');
  });

  it('a syntax error is caught with a hint', () => {
    const r = runChildCode(py, 'if True\n    print(1)');
    expect(r.errorType).toBe('SyntaxError');
    expect(r.hint).toMatch(/冒号/);
  });

  it('the "do not use max()" rule is enforced', () => {
    const code = 'print("最大的数是", max([7, 3, 9]))';
    const r = runChildCode(py, code);
    const c = checkResult(code, r, { includes: ['最大的数是 9'], codeExcludes: ['max'] });
    expect(c.pass).toBe(false);
    expect(c.missing.join()).toMatch(/max/);
  });
});
