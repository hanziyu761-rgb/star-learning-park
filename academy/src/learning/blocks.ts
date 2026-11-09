import type { BlocksLevel, Dir } from '../curriculum/types';

// Interpreter for the block-programming maze. Pure and deterministic, so the
// UI only animates what this computes.

export type Block = 'forward' | 'left' | 'right';
export const BLOCK_INFO: Record<Block, { label: string; icon: string }> = {
  forward: { label: '前进一格', icon: '⬆️' },
  left: { label: '向左转', icon: '↰' },
  right: { label: '向右转', icon: '↱' },
};

export interface Pose { x: number; y: number; dir: Dir }
export type RunResult =
  | { ok: true; trace: Pose[] }
  | { ok: false; trace: Pose[]; reason: 'wall' | 'edge' | 'not-at-goal' | 'empty'; failedAt: number | null };

const STEP: Record<Dir, [number, number]> = { 0: [0, -1], 1: [1, 0], 2: [0, 1], 3: [-1, 0] };

export function run(level: BlocksLevel, program: Block[]): RunResult {
  let pose: Pose = { ...level.start };
  const trace: Pose[] = [pose];
  if (!program.length) return { ok: false, trace, reason: 'empty', failedAt: null };
  for (let i = 0; i < program.length; i++) {
    const b = program[i];
    if (b === 'left') pose = { ...pose, dir: ((pose.dir + 3) % 4) as Dir };
    else if (b === 'right') pose = { ...pose, dir: ((pose.dir + 1) % 4) as Dir };
    else {
      const [dx, dy] = STEP[pose.dir];
      const nx = pose.x + dx, ny = pose.y + dy;
      if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return { ok: false, trace, reason: 'edge', failedAt: i };
      if (level.walls.some((w) => w.x === nx && w.y === ny)) return { ok: false, trace, reason: 'wall', failedAt: i };
      pose = { ...pose, x: nx, y: ny };
    }
    trace.push(pose);
  }
  const end = trace[trace.length - 1];
  if (end.x === level.goal.x && end.y === level.goal.y) return { ok: true, trace };
  return { ok: false, trace, reason: 'not-at-goal', failedAt: null };
}

/** Shortest solution length by breadth-first search — used to check that every level is solvable within maxBlocks. */
export function shortestSolution(level: BlocksLevel): Block[] | null {
  const key = (p: Pose) => `${p.x},${p.y},${p.dir}`;
  const queue: { pose: Pose; prog: Block[] }[] = [{ pose: level.start, prog: [] }];
  const seen = new Set([key(level.start)]);
  while (queue.length) {
    const { pose, prog } = queue.shift()!;
    if (pose.x === level.goal.x && pose.y === level.goal.y) return prog;
    if (prog.length >= 30) continue;
    for (const b of ['forward', 'left', 'right'] as Block[]) {
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

export const DIR_ARROW: Record<Dir, string> = { 0: '⬆', 1: '➡', 2: '⬇', 3: '⬅' };
