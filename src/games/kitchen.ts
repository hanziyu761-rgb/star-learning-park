/**
 * 数学 · 凑数小厨房（V2.19）：点菜牌上是目标数，把食材放进锅里，加起来刚好等于目标数就出菜。
 * 放多了锅会冒烟（这一单算作没有一次做对），可以把食材拿出来重新凑。
 * 题目和答案都由程序算：小数按“百分之一”为单位用整数计算，不会有 0.1 + 0.2 的误差。
 *
 * 难度档：1 凑 10（两样） 2 凑 10（三样） 3 凑 20 4 凑 100（整十） 5 凑 100 6 小数凑 1 7 小数凑 1（三样 / 两位小数） 8 凑整百
 */
import { zh } from '@/content/zh';
import type { ChoiceExercise } from '@/lesson/types';
import { safeId } from './common';

export interface Ingredient {
  id: string;
  /** 以“单位”计的整数（小数关：1 单位 = 0.01） */
  units: number;
  emoji: string;
}
export interface Order {
  level: number;
  /** 目标数（单位） */
  target: number;
  /** 1 或 100（小数关） */
  scale: number;
  items: Ingredient[];
  /** 一种凑法（单位），用来生成复习题 */
  solution: number[];
  customer: string;
}

const FOODS = ['🍎', '🍓', '🥕', '🍅', '🥚', '🍄', '🌽', '🍇', '🧀', '🥦'];
const CUSTOMERS = ['🐻', '🐰', '🐼', '🐱', '🦊', '🐨', '🐯', '🐶'];

const int = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

export function fmt(units: number, scale: number): string {
  if (scale === 1) return String(units);
  const s = (units / scale).toFixed(2);
  return s.replace(/0$/, '').replace(/\.0$/, '');
}

/** 把 total 拆成 n 份（每份在 [min, max] 内，且是 step 的倍数） */
function split(rand: () => number, total: number, n: number, min: number, step: number): number[] {
  for (let tries = 0; tries < 200; tries++) {
    const parts: number[] = [];
    let left = total;
    for (let i = 0; i < n - 1; i++) {
      const maxHere = left - min * (n - 1 - i);
      const v = int(rand, min / step, maxHere / step) * step;
      parts.push(v);
      left -= v;
    }
    if (left >= min && left % step === 0) return [...parts, left];
  }
  return [total - min * (n - 1), ...Array(n - 1).fill(min)];
}

interface LevelSpec {
  target: (rand: () => number) => number;
  scale: number;
  parts: number;
  min: number;
  step: number;
  /** 干扰食材的取值范围 */
  distract: (rand: () => number, target: number) => number;
}

const SPEC: Record<number, LevelSpec> = {
  1: { target: () => 10, scale: 1, parts: 2, min: 1, step: 1, distract: (r) => int(r, 1, 9) },
  2: { target: () => 10, scale: 1, parts: 3, min: 1, step: 1, distract: (r) => int(r, 1, 6) },
  3: { target: () => 20, scale: 1, parts: 2, min: 3, step: 1, distract: (r) => int(r, 2, 17) },
  4: { target: () => 100, scale: 1, parts: 2, min: 10, step: 10, distract: (r) => int(r, 1, 9) * 10 },
  5: { target: () => 100, scale: 1, parts: 2, min: 11, step: 1, distract: (r) => int(r, 11, 89) },
  6: { target: () => 100, scale: 100, parts: 2, min: 10, step: 10, distract: (r) => int(r, 1, 9) * 10 },
  7: { target: () => 100, scale: 100, parts: 3, min: 5, step: 5, distract: (r) => int(r, 1, 17) * 5 },
  8: { target: (r) => int(r, 2, 9) * 100, scale: 1, parts: 2, min: 10, step: 10, distract: (r, t) => int(r, 1, t / 10 - 1) * 10 },
};

export function makeOrder(level: number, rand: () => number, seq = 0): Order {
  const spec = SPEC[Math.min(8, Math.max(1, level))];
  const target = spec.target(rand);
  let solution = split(rand, target, spec.parts, spec.min, spec.step);
  // 第 8 档：一样是三位数、一样是两位数（380 + 20 = 400）
  if (level >= 8) {
    const small = int(rand, 1, 9) * 10;
    solution = [target - small, small];
  }
  const values = [...solution];
  // 干扰食材：两样，和答案不重复、单独都不等于目标数
  while (values.length < solution.length + 2) {
    const d = spec.distract(rand, target);
    if (d > 0 && d < target && !values.includes(d)) values.push(d);
  }
  // 打乱顺序
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  const food = FOODS[int(rand, 0, FOODS.length - 1)];
  return {
    level,
    target,
    scale: spec.scale,
    solution,
    customer: CUSTOMERS[seq % CUSTOMERS.length],
    items: values.map((units, i) => ({ id: `i${seq}-${i}`, units, emoji: FOODS[(FOODS.indexOf(food) + i) % FOODS.length] })),
  };
}

export const sumUnits = (items: Ingredient[]) => items.reduce((s, x) => s + x.units, 0);

/** 锅里的状态：差一点 / 刚好 / 放多了 */
export function potState(inPot: Ingredient[], target: number): 'short' | 'exact' | 'over' {
  const s = sumUnits(inPot);
  return s === target ? 'exact' : s > target ? 'over' : 'short';
}

/** 有没有凑得出来的办法（测试用：保证每一单都能做） */
export function solvable(order: Order): boolean {
  const vals = order.items.map((i) => i.units);
  const n = vals.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s += vals[i];
    if (s === order.target) return true;
  }
  return false;
}

/* ───── 错题复习：变成“a + ? = 目标数”的选择题 ───── */

export const KITCHEN_LESSON = 'game:kitchen';
export function orderExerciseId(o: Order): string {
  return safeId(`kitchen:${o.level}:${o.scale}:${o.target}:${o.solution.join(',')}`);
}

export function kitchenExercise(exerciseId: string): ChoiceExercise | null {
  const m = /^kitchen:(\d+):(\d+):(\d+):([\d,]+)$/.exec(exerciseId);
  if (!m) return null;
  const level = Number(m[1]);
  const scale = Number(m[2]);
  const target = Number(m[3]);
  const sol = m[4].split(',').map(Number);
  if (sol.reduce((a, b) => a + b, 0) !== target || sol.length < 2) return null;
  const known = sol.slice(0, -1);
  const answer = sol[sol.length - 1];
  const step = scale === 100 ? 10 : level >= 4 ? 10 : 1;
  const opts = new Set([answer]);
  for (const d of [step, -step, 2 * step, -2 * step, 3 * step]) if (opts.size < 4 && answer + d > 0) opts.add(answer + d);
  const options = [...opts].sort((a, b) => a - b).map((u) => fmt(u, scale));
  const plain = level >= 4;
  const expr = `${known.map((u) => fmt(u, scale)).join(' + ')} + ? = ${fmt(target, scale)}`;
  return {
    kind: 'choice',
    id: exerciseId,
    skill: 'game.kitchen',
    prompt: {
      text: plain ? '还差多少？' : zh('还差多少？', 'hái chà duō shao'),
      speak: { text: `${known.map((u) => fmt(u, scale)).join('加')}，再加多少等于${fmt(target, scale)}？`.replace(/\./g, '点'), lang: 'zh-CN' },
    },
    stem: { text: expr },
    options: options.map((t) => ({ id: t, text: t })),
    answerId: fmt(answer, scale),
    wrongHint: { text: plain ? '再算一算' : zh('再算一算', 'zài suàn yi suàn'), speak: { text: '再算一算', lang: 'zh-CN' } },
  };
}
