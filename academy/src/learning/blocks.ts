import type { BlocksLevel, Dir } from '../curriculum/types';

// Interpreter for the block-programming maze. Pure and deterministic, so the
// UI only animates what this computes.
// Loop blocks ("重复 2 次" / "重复 3 次") repeat the ONE block right after them.

export type Move = 'forward' | 'left' | 'right';
export type Block = Move | 'repeat2' | 'repeat3';
export const BLOCK_INFO: Record<Block, { label: string; icon: string }> = {
  forward: { label: '前进一格', icon: '⬆️' },
  left: { label: '向左转', icon: '↰' },
  right: { label: '向右转', icon: '↱' },
  repeat2: { label: '重复 2 次', icon: '🔁' },
  repeat3: { label: '重复 3 次', icon: '🔁' },
};
export const MOVES: Move[] = ['forward', 'left', 'right'];
export const isRepeat = (b: Block): b is 'repeat2' | 'repeat3' => b === 'repeat2' || b === 'repeat3';

export interface Pose { x: number; y: number; dir: Dir }
export type RunResult =
  | { ok: true; trace: Pose[] }
  | { ok: false; trace: Pose[]; reason: 'wall' | 'edge' | 'not-at-goal' | 'empty' | 'bad-repeat'; failedAt: number | null };

const STEP: Record<Dir, [number, number]> = { 0: [0, -1], 1: [1, 0], 2: [0, 1], 3: [-1, 0] };

/** Expands loops into single moves, remembering which written block each move came from. */
export function expand(program: Block[]): { moves: { move: Move; src: number }[] } | { error: number } {
  const moves: { move: Move; src: number }[] = [];
  for (let i = 0; i < program.length; i++) {
    const b = program[i];
    if (isRepeat(b)) {
      const next = program[i + 1];
      if (!next || isRepeat(next)) return { error: i };
      const n = b === 'repeat2' ? 2 : 3;
      for (let k = 0; k < n; k++) moves.push({ move: next, src: i + 1 });
      i += 1;
    } else moves.push({ move: b, src: i });
  }
  return { moves };
}

export function run(level: BlocksLevel, program: Block[]): RunResult {
  let pose: Pose = { ...level.start };
  const trace: Pose[] = [pose];
  if (!program.length) return { ok: false, trace, reason: 'empty', failedAt: null };
  const ex = expand(program);
  if ('error' in ex) return { ok: false, trace, reason: 'bad-repeat', failedAt: ex.error };
  for (const { move, src } of ex.moves) {
    if (move === 'left') pose = { ...pose, dir: ((pose.dir + 3) % 4) as Dir };
    else if (move === 'right') pose = { ...pose, dir: ((pose.dir + 1) % 4) as Dir };
    else {
      const [dx, dy] = STEP[pose.dir];
      const nx = pose.x + dx, ny = pose.y + dy;
      if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return { ok: false, trace, reason: 'edge', failedAt: src };
      if (level.walls.some((w) => w.x === nx && w.y === ny)) return { ok: false, trace, reason: 'wall', failedAt: src };
      pose = { ...pose, x: nx, y: ny };
    }
    trace.push(pose);
  }
  const end = trace[trace.length - 1];
  if (end.x === level.goal.x && end.y === level.goal.y) return { ok: true, trace };
  return { ok: false, trace, reason: 'not-at-goal', failedAt: null };
}

/** Shortest solution in single moves (breadth-first search). */
export function shortestSolution(level: BlocksLevel): Move[] | null {
  const key = (p: Pose) => `${p.x},${p.y},${p.dir}`;
  const queue: { pose: Pose; prog: Move[] }[] = [{ pose: level.start, prog: [] }];
  const seen = new Set([key(level.start)]);
  while (queue.length) {
    const { pose, prog } = queue.shift()!;
    if (pose.x === level.goal.x && pose.y === level.goal.y) return prog;
    if (prog.length >= 40) continue;
    for (const b of MOVES) {
      const r = run({ ...level, start: pose, goal: { x: -1, y: -1 } }, [b]);
      const next = r.trace[r.trace.length - 1];
      if (r.ok === false && r.reason !== 'not-at-goal') continue;
      if (seen.has(key(next))) continue;
      seen.add(key(next));
      queue.push({ pose: next, prog: [...prog, b] });
    }
  }
  return null;
}

/** Rewrites runs of the same move with loop blocks (3 at a time), e.g. F F F F → 重复3次 F, F. */
export function compress(moves: Move[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < moves.length;) {
    let j = i;
    while (j < moves.length && moves[j] === moves[i]) j++;
    let k = j - i;
    while (k >= 3) { out.push('repeat3', moves[i]); k -= 3; }
    if (k === 2) out.push(moves[i], moves[i]);
    if (k === 1) out.push(moves[i]);
    i = j;
  }
  return out;
}

export const DIR_ARROW: Record<Dir, string> = { 0: '⬆', 1: '➡', 2: '⬇', 3: '⬅' };
