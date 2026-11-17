/**
 * 护眼与学习时长（V5.4，纯函数）：
 * - 每天最多学多少分钟（家长设，0 = 不限）：用满了显示“今天学够了”，家长验证后可以再学 15 分钟或今天不限
 * - 连续学多少分钟提醒休息（家长设，0 = 不提醒）：到时间休息 5 分钟（倒计时），家长验证后可以跳过
 * 只在 APP 打开（在前台）时计时；离开 APP 超过 5 分钟算自然休息过了。
 * 计时单独保存（slp.screentime.v1），不放进学习记录。
 */
import { dayKey } from '@/progress/srs';

export const SCREEN_STORAGE_KEY = 'slp.screentime.v1';
export const REST_SEC = 5 * 60;
/** 离开 APP 这么久，连续学习时间重新算 */
export const AWAY_RESET_MS = 5 * 60 * 1000;
export const DAILY_CHOICES = [0, 20, 30, 40, 60, 90];
export const BREAK_CHOICES = [0, 15, 20, 30];
export const EXTEND_MIN = 15;

export interface ScreenTime {
  v: 1;
  day: string;
  /** 今天已经学了多少秒 */
  usedSec: number;
  /** 家长今天额外加的分钟数 */
  extraMin: number;
  /** 这次连续学了多少秒 */
  sinceBreakSec: number;
  /** 休息到什么时候 */
  restUntil?: number;
  /** 上一次计时的时间 */
  lastTick?: number;
}

export const emptyScreenTime = (now: number): ScreenTime => ({ v: 1, day: dayKey(now), usedSec: 0, extraMin: 0, sinceBreakSec: 0 });

export function parseScreenTime(raw: string | null, now: number): ScreenTime {
  try {
    const s = raw ? (JSON.parse(raw) as ScreenTime) : null;
    if (s && s.v === 1 && typeof s.usedSec === 'number' && typeof s.day === 'string') return rollDay(s, now);
  } catch {
    // 坏数据当作今天刚开始
  }
  return emptyScreenTime(now);
}

/** 过了一天：今天的用时、加时清零 */
function rollDay(s: ScreenTime, now: number): ScreenTime {
  return s.day === dayKey(now) ? s : { ...emptyScreenTime(now), lastTick: s.lastTick };
}

export interface Limits {
  dailyMinutes: number;
  breakMinutes: number;
}

export type TimeStatus =
  | { kind: 'ok'; usedMin: number }
  | { kind: 'rest'; leftSec: number }
  | { kind: 'limit'; usedMin: number; limitMin: number };

/** 计时一次（APP 在前台时每隔几秒调用）：休息中、用满时不计 */
export function tick(s0: ScreenTime, now: number, limits: Limits): ScreenTime {
  let s = rollDay(s0, now);
  const gap = s.lastTick ? now - s.lastTick : 0;
  if (gap > AWAY_RESET_MS) s = { ...s, sinceBreakSec: 0 };
  const st = status(s, now, limits);
  if (st.kind !== 'ok' || gap <= 0 || gap > AWAY_RESET_MS) return { ...s, lastTick: now };
  const add = Math.min(gap, 30 * 1000) / 1000;
  s = { ...s, usedSec: s.usedSec + add, sinceBreakSec: s.sinceBreakSec + add, lastTick: now };
  // 连续学够了：开始休息
  if (limits.breakMinutes > 0 && s.sinceBreakSec >= limits.breakMinutes * 60) s = { ...s, restUntil: now + REST_SEC * 1000, sinceBreakSec: 0 };
  return s;
}

export function status(s: ScreenTime, now: number, limits: Limits): TimeStatus {
  const usedMin = Math.floor(s.usedSec / 60);
  if (s.day === dayKey(now) && limits.dailyMinutes > 0) {
    const limitMin = limits.dailyMinutes + s.extraMin;
    if (s.usedSec >= limitMin * 60) return { kind: 'limit', usedMin, limitMin };
  }
  if (s.restUntil && s.restUntil > now) return { kind: 'rest', leftSec: Math.ceil((s.restUntil - now) / 1000) };
  return { kind: 'ok', usedMin };
}

/** 家长：从现在起再学 15 分钟 */
export function extend(s: ScreenTime, now: number, limits: Limits, min = EXTEND_MIN): ScreenTime {
  const t = rollDay(s, now);
  const usedMin = Math.ceil(t.usedSec / 60);
  return { ...t, extraMin: Math.max(t.extraMin, usedMin - limits.dailyMinutes) + min };
}
/** 家长：今天不限 */
export const unlimitedToday = (s: ScreenTime, now: number): ScreenTime => ({ ...rollDay(s, now), extraMin: 24 * 60 });
/** 家长：跳过这次休息 */
export const skipRest = (s: ScreenTime): ScreenTime => ({ ...s, restUntil: undefined, sinceBreakSec: 0 });
