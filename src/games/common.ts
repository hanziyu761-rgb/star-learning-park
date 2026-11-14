/**
 * 游戏乐园公共规则（V2.19）：
 * - 每局约 2 分钟（6 道），按一次做对的题数给 1～3 颗星；没有“生命值”，答错不出局
 * - 难度跟着孩子走：最近两局都在这一档且一次做对 ≥ 85% → 升一档；上一局一半及以下做对 → 降一档；只在本年级的档位范围内调整
 * - 每天游戏时长上限（家长设置，默认 15 分钟；0 = 不限制）：到时间后这一局可以玩完，之后不能再开新局
 * - 不做排行榜、抽奖、宝箱、连续登录奖励，没有广告
 */
import { zh } from '@/content/zh';
import type { DisplayText, Subject } from '@/lesson/types';
import type { GameId, GameRecord, ProgressState } from '@/progress/model';
import { dayKey } from '@/progress/srs';

export const ROUND_SIZE = 6;
export const MAX_ROUND_SEC = 300;

export interface GameInfo {
  id: GameId;
  subject: Subject;
  emoji: string;
  /** 一、二年级带拼音 */
  name: DisplayText;
  namePlain: string;
  intro: string;
}

export const GAMES: GameInfo[] = [
  {
    id: 'kitchen',
    subject: 'math',
    emoji: '🍳',
    name: zh('凑数小厨房', 'còu shù xiǎo chú fáng'),
    namePlain: '凑数小厨房',
    intro: '把食材放进锅里，加起来刚好等于点菜牌上的数，菜就做好了。',
  },
  {
    id: 'fish',
    subject: 'chinese',
    emoji: '🎣',
    name: zh('拼音钓鱼', 'pīn yīn diào yú'),
    namePlain: '拼音钓鱼',
    intro: '看字（三年级起看句子），钓起读音正确的那条鱼。',
  },
  {
    id: 'bubble',
    subject: 'english',
    emoji: '🫧',
    name: zh('拼词泡泡', 'pīn cí pào pao'),
    namePlain: '拼词泡泡',
    intro: '听单词，按顺序戳破字母泡泡，把单词拼出来。',
  },
];
export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, GameInfo>;

/** 每个游戏、每个年级可用的难度档范围 */
export const LEVEL_RANGE: Record<GameId, (grade: number) => [number, number]> = {
  // 1 凑10两样 2 凑10三样 3 凑20 4 凑100整十 5 凑100 6 小数凑1 7 小数凑1三样 8 凑整百
  // 9 平方凑平方（勾股数） 10 更大的勾股数（初中，V5.2.3）
  kitchen: (g) => (g <= 1 ? [1, 3] : g === 2 ? [3, 5] : g === 3 ? [4, 6] : g <= 6 ? [5, 8] : [9, 10]),
  // 1 声调 2 声调+韵母 3 声调+韵母+声母（一、二年级）；4 多音字（三年级起）
  // 5 易读错的字（初中，V5.2.3）
  fish: (g) => (g <= 2 ? [1, 3] : g <= 6 ? [4, 4] : [5, 5]),
  // 1 3~4 个字母 2 5~6 个 3 7 个以上
  bubble: (g) => (g <= 2 ? [1, 2] : g <= 4 ? [1, 3] : g <= 6 ? [2, 3] : [3, 3]),
};

export function gameLevel(records: GameRecord[], game: GameId, grade: number): number {
  const [lo, hi] = LEVEL_RANGE[game](grade);
  const mine = records.filter((r) => r.game === game);
  if (mine.length === 0) return lo;
  const last = mine[mine.length - 1];
  let level = Math.min(hi, Math.max(lo, last.level));
  const rateOf = (rs: GameRecord[]) => {
    const total = rs.reduce((s, r) => s + r.total, 0);
    return total ? rs.reduce((s, r) => s + r.correct, 0) / total : 0;
  };
  // 上一局一半及以下做对 → 降一档；最近两局都在这一档且一次做对 ≥ 85% → 升一档
  const sameLevel = mine.slice(-2).filter((r) => Math.min(hi, Math.max(lo, r.level)) === level);
  if (rateOf([last]) <= 0.5) level -= 1;
  else if (sameLevel.length >= 2 && rateOf(sameLevel) >= 0.85) level += 1;
  return Math.min(hi, Math.max(lo, level));
}

export function starsFor(correct: number, total: number): number {
  if (total <= 0) return 0;
  const r = correct / total;
  return r >= 0.83 ? 3 : r >= 0.5 ? 2 : 1;
}

/** 今天已经玩了多少秒 */
export function playedToday(state: ProgressState, now: number): number {
  const today = dayKey(now);
  return state.games.filter((g) => dayKey(g.at) === today).reduce((s, g) => s + g.sec, 0);
}

/** 今天还能不能开新的一局；limitMin = 0 表示不限制 */
export function canStartGame(state: ProgressState, now: number): boolean {
  const limit = state.settings.gameMinutes;
  if (!limit) return true;
  return playedToday(state, now) < limit * 60;
}

export const GAME_MINUTE_CHOICES = [10, 15, 20, 30, 0] as const;

/** 题目 id 里不能有“/”（错题的键是 课程id/题目id） */
export const safeId = (s: string) => s.replace(/\//g, '∕');
