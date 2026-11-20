// Runs a child's Python program with Pyodide. Shared by the browser worker and
// the Node tests, so tests execute exactly the same code path.
// - Each run gets a fresh namespace (no leftovers between runs).
// - input() reads from the preset lines the lesson provides; no keyboard prompt.
// - A small in-course "API" (示例接口) is available for the API lesson. It
//   returns fixed sample data and never touches the network.

export interface PyResult {
  stdout: string;
  error: string | null;
  errorType: string | null;
  hint: string | null;
}

export const PRELUDE = `
import builtins as _b
def input(prompt=""):
    print(prompt, end="")
    if not _inputs:
        raise EOFError("没有更多输入数据了")
    v = str(_inputs.pop(0))
    print(v)
    return v

_SAMPLE_WEATHER = {"北京": {"天气": "晴", "气温": 12}, "上海": {"天气": "多云", "气温": 16}, "广州": {"天气": "小雨", "气温": 22}}
_SAMPLE_WORDS = {"apple": "苹果", "cat": "猫", "book": "书", "water": "水", "happy": "快乐的"}

def ask_weather(city):
    """课程里的示例接口：返回固定的示例天气数据（不是真实天气，不联网）。"""
    if city in _SAMPLE_WEATHER:
        return {"状态": "成功", "城市": city, **_SAMPLE_WEATHER[city]}
    return {"状态": "失败", "原因": "示例接口里没有这个城市"}

def ask_dictionary(word):
    """课程里的示例接口：返回固定的示例词典数据（不联网）。"""
    w = str(word).strip().lower()
    if w in _SAMPLE_WORDS:
        return {"状态": "成功", "单词": w, "中文": _SAMPLE_WORDS[w]}
    return {"状态": "失败", "原因": "示例词典里没有这个单词"}
`;

const HINTS: Record<string, string> = {
  SyntaxError: '语法错误：检查一下括号、引号、冒号是不是成对、有没有漏掉。',
  IndentationError: '缩进错误：if、for、def 下面的代码要统一往右缩进 4 个空格。',
  NameError: '名字错误：用到的变量或函数还没有定义，或者名字拼错了。',
  TypeError: '类型错误：比如把数字和文字直接相加了。可以用 str() 或 int() 转换一下。',
  ValueError: '数值错误：比如用 int() 转换了不是数字的文字。',
  ZeroDivisionError: '不能除以 0。',
  IndexError: '下标超出范围：列表里没有那么多个元素。',
  KeyError: '字典里没有这个键。',
  EOFError: '程序想用 input() 读更多数据，但这道题没有准备那么多输入。',
};

/** The subset of the Pyodide API we use (keeps tests and worker in sync). */
export interface PyodideLike {
  runPython(code: string, opts?: { globals?: unknown }): unknown;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
  toPy(v: unknown): unknown;
  globals: { get(name: string): (...a: unknown[]) => { set(k: string, v: unknown): void; destroy?: () => void } };
}

export function runChildCode(py: PyodideLike, code: string, inputs: string[] = []): PyResult {
  let out = '';
  py.setStdout({ batched: (s) => { out += s + '\n'; } });
  py.setStderr({ batched: (s) => { out += s + '\n'; } });
  const ns = py.globals.get('dict')();
  try {
    ns.set('_inputs', py.toPy(inputs));
    py.runPython(PRELUDE, { globals: ns });
    py.runPython(code, { globals: ns });
    return { stdout: out, error: null, errorType: null, hint: null };
  } catch (e) {
    const msg = String((e as Error).message ?? e);
    const lines = msg.trim().split('\n');
    const last = lines[lines.length - 1] ?? msg;
    const type = /^(\w+Error|\w+Exception)/.exec(last)?.[1] ?? 'Error';
    const lineNo = [...msg.matchAll(/File "<exec>", line (\d+)/g)].map((m) => Number(m[1])).pop();
    // The prelude runs first in its own call, so line numbers refer to the child's code.
    const where = lineNo ? `第 ${lineNo} 行：` : '';
    return { stdout: out, error: where + last, errorType: type, hint: HINTS[type] ?? null };
  } finally {
    ns.destroy?.();
  }
}

export interface PyCheck {
  /** Every string must appear in the output. */
  includes?: string[];
  /** The code itself must contain each of these (e.g. "for", "def"). */
  codeIncludes?: string[];
  /** The code must NOT use these (e.g. max, when the task is to write it yourself). */
  codeExcludes?: string[];
}

export function checkResult(code: string, r: PyResult, check: PyCheck): { pass: boolean; missing: string[] } {
  if (r.error) return { pass: false, missing: [] };
  const missing: string[] = [];
  for (const s of check.includes ?? []) if (!r.stdout.includes(s)) missing.push(`输出里要有"${s}"`);
  const bare = code.replace(/#.*$/gm, '');
  for (const s of check.codeIncludes ?? []) if (!new RegExp(`\\b${s}\\b`).test(bare)) missing.push(`代码里要用到 ${s}`);
  for (const s of check.codeExcludes ?? []) if (new RegExp(`\\b${s}\\s*\\(`).test(bare)) missing.push(`这道题请自己写，不要用 ${s}()`);
  return { pass: missing.length === 0, missing };
}
