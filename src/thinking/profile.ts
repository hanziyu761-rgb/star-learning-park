/**
 * 家长中心“思维能力”统计（V2.5）：只用真实记录——每日挑战的作答、答对后孩子自己选的思路。
 * 这是做题情况的统计，不是心理或智力测评；样本少时不下结论。
 */
import { getKp } from '@/knowledge/graph';
import type { ProgressState } from '@/progress/model';
import { dayKey } from '@/progress/srs';
import type { ThinkDim } from './dims';
import { STRATEGIES } from './strategies';

/** 少于这么多条记录时只显示数字，不给建议 */
export const MIN_SAMPLES = 5;

export interface DimStat {
  dim: ThinkDim;
  tried: number;
  firstTryCorrect: number;
}

export interface StrategyStat {
  kp: string;
  kpName: string;
  total: number;
  counts: { id: string; count: number }[];
  /** 选“数数”的比例 */
  countingShare: number;
  /** 选凑十、破十、直接记住等较快方法的比例 */
  fastShare: number;
  advice: string | null;
}

export interface ThinkingProfile {
  dims: DimStat[];
  strategies: StrategyStat[];
  challengeDays: number;
  /** 连续完成每日挑战的天数（到今天或昨天为止） */
  streak: number;
  doneToday: boolean;
}

const ORDER: ThinkDim[] = ['observe', 'classify', 'reason', 'spatial'];

export function thinkingProfile(state: ProgressState, now: number = Date.now()): ThinkingProfile {
  const dims: DimStat[] = ORDER.map((dim) => {
    const rs = state.challenges.filter((c) => c.dims.includes(dim));
    return { dim, tried: rs.length, firstTryCorrect: rs.filter((r) => r.firstTryCorrect).length };
  });

  const byKp = new Map<string, Map<string, number>>();
  for (const s of state.strategies) {
    const m = byKp.get(s.kp) ?? new Map<string, number>();
    m.set(s.choice, (m.get(s.choice) ?? 0) + 1);
    byKp.set(s.kp, m);
  }
  const strategies: StrategyStat[] = [...byKp.entries()].map(([kp, m]) => {
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    const share = (level: number) =>
      [...m.entries()].filter(([id]) => STRATEGIES[id]?.level === level).reduce((a, [, n]) => a + n, 0) / total;
    const countingShare = share(1);
    const fastShare = share(3);
    const kpName = getKp(kp)?.name ?? kp;
    let advice: string | null = null;
    if (total >= MIN_SAMPLES) {
      if (countingShare >= 0.6)
        advice = `算“${kpName}”时多数还是一个一个地数。可以用小棒、手指陪孩子练“分与合”“凑十”，慢慢从数数过渡到用方法算。`;
      else if (fastShare >= 0.6) advice = `算“${kpName}”时多数已经用较快的方法（凑十、破十或直接记住）。`;
    }
    return {
      kp,
      kpName,
      total,
      counts: [...m.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      countingShare,
      fastShare,
      advice,
    };
  });
  strategies.sort((a, b) => b.total - a.total);

  const days = new Set(state.challenges.filter((c) => c.daily).map((c) => c.day));
  const today = dayKey(now);
  let streak = 0;
  // 从今天（或今天还没做时从昨天）往回数连续的天
  let t = days.has(today) ? now : now - 86_400_000;
  while (days.has(dayKey(t))) {
    streak++;
    t -= 86_400_000;
  }
  return { dims, strategies, challengeDays: days.size, streak, doneToday: days.has(today) };
}
