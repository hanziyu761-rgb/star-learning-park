import { useEffect, useRef, useState } from 'react';
import type { BlocksActivity } from '../curriculum/types';
import { BLOCK_INFO, DIR_ARROW, run, type Block, type Pose, type RunResult } from '../learning/blocks';
import { useApp } from '../app/state';
import { speak } from '../ui/speech';
import { SpeakButton, Txt } from '../ui/Txt';
import type { ActivityProps } from './common';

const STEP_MS = 380;
const REASON: Record<string, string> = {
  wall: '撞到墙了！看看是哪一块积木出了问题。',
  edge: '走出地图了！看看是哪一块积木出了问题。',
  'not-at-goal': '程序走完了，可是还没到星星那里。再加几块积木试试。',
  empty: '先放几块积木，再点"运行"。',
};

export function BlocksView({ step, recorder, onDone }: ActivityProps<BlocksActivity>) {
  const { settings } = useApp();
  const [li, setLi] = useState(0);
  const level = step.levels[li];
  const [program, setProgram] = useState<Block[]>([]);
  const [shown, setShown] = useState<Pose>(level.start);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const failedRuns = useRef(0);
  const totalFailed = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const allDone = li >= step.levels.length - 1 && result?.ok;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function add(b: Block) {
    if (running || program.length >= level.maxBlocks) return;
    setProgram([...program, b]); setResult(null); setShown(level.start);
  }
  function undo() { if (!running) { setProgram(program.slice(0, -1)); setResult(null); setShown(level.start); } }
  function clear() { if (!running) { setProgram([]); setResult(null); setShown(level.start); } }

  function go() {
    if (running) return;
    const r = run(level, program);
    setRunning(true); setResult(null);
    r.trace.forEach((pose, i) => timers.current.push(setTimeout(() => setShown(pose), i * STEP_MS)));
    timers.current.push(setTimeout(() => void finish(r), r.trace.length * STEP_MS));
  }

  async function finish(r: RunResult) {
    setRunning(false); setResult(r);
    if (!r.ok) {
      failedRuns.current += 1;
      if (settings.readAloud) speak(REASON[r.reason]);
      return;
    }
    if (settings.readAloud) speak('成功了！');
    if (li === step.levels.length - 1) {
      totalFailed.current += failedRuns.current;
      await recorder.record({ type: 'experiment', stepId: step.id, kind: 'blocks', knowledgePoints: step.knowledgePoints, total: step.levels.length, mistakes: totalFailed.current });
    }
  }

  function nextLevel() {
    totalFailed.current += failedRuns.current;
    failedRuns.current = 0;
    const n = step.levels[li + 1];
    setLi(li + 1); setProgram([]); setResult(null); setShown(n.start);
  }

  const failedAt = result && !result.ok ? result.failedAt : null;
  const cells = [];
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const isWall = level.walls.some((w) => w.x === x && w.y === y);
      const isGoal = level.goal.x === x && level.goal.y === y;
      const here = shown.x === x && shown.y === y;
      cells.push(
        <div key={`${x}-${y}`} className={'cell' + (isWall ? ' wall' : '') + (isGoal ? ' goal' : '')} data-testid={here ? 'robot-cell' : undefined}>
          {isWall ? '🧱' : here ? <span className="bot">🤖<span className="bot-dir">{DIR_ARROW[shown.dir]}</span></span> : isGoal ? '⭐' : ''}
        </div>,
      );
    }
  }

  return (
    <section className="activity">
      <p className="kind-tag">互动实验 · 第 {li + 1}/{step.levels.length} 关</p>
      <h1><Txt>{step.title}</Txt></h1>
      <p className="instruction"><Txt>{step.instruction}</Txt> <SpeakButton text={step.instruction} /></p>
      <div className="maze" style={{ gridTemplateColumns: `repeat(${level.width}, 1fr)` }} role="img" aria-label={`迷宫：机器人在第 ${shown.y + 1} 行第 ${shown.x + 1} 列，朝${DIR_ARROW[shown.dir]}`}>{cells}</div>

      <ol className="program" aria-label="我的程序">
        {program.length === 0 && <li className="muted">程序是空的，点下面的积木添加</li>}
        {program.map((b, i) => (
          <li key={i} className={'block b-' + b + (failedAt === i ? ' failed' : '')}>{BLOCK_INFO[b].icon} {BLOCK_INFO[b].label}</li>
        ))}
      </ol>
      <p className="muted small">{program.length}/{level.maxBlocks} 块积木</p>
      <div className="palette">
        {(Object.keys(BLOCK_INFO) as Block[]).map((b) => (
          <button key={b} className={'block-btn b-' + b} disabled={running || program.length >= level.maxBlocks} onClick={() => add(b)}>{BLOCK_INFO[b].icon} {BLOCK_INFO[b].label}</button>
        ))}
      </div>
      <div className="row-btns">
        <button className="chip" onClick={undo} disabled={running || !program.length}>↩ 撤销</button>
        <button className="chip" onClick={clear} disabled={running || !program.length}>🗑 清空</button>
      </div>
      <button className="big-btn" onClick={go} disabled={running}>▶ <Txt>运行程序</Txt></button>

      {result && !result.ok && <p className="hint try" role="status"><Txt>{REASON[result.reason]}</Txt></p>}
      {result?.ok && !allDone && (
        <div className="result">
          <p className="hint ok" role="status"><Txt>成功了！机器人拿到了星星。</Txt></p>
          <button className="big-btn" onClick={nextLevel}><Txt>下一关</Txt> →</button>
        </div>
      )}
      {allDone && (
        <div className="result">
          <p className="hint ok" role="status"><Txt>全部过关！</Txt></p>
          <p><Txt>{step.explain}</Txt></p>
          <button className="big-btn" onClick={onDone}><Txt>下一步</Txt> →</button>
        </div>
      )}
    </section>
  );
}
