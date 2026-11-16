/**
 * 会员状态（V5.3，纯函数）：免费试用、会员有效期、联网核对、试用结束后每天 1 套免费今日一练。
 * 会员信息单独存（存储键 slp.member.v1），不放进学习记录，不影响已有数据。
 */
import type { Route } from '@/nav/Nav';
import { dayKey } from '@/progress/srs';
import { dayNumber, isValidDeviceId, verifyCode } from './code';

export const MEMBER_STORAGE_KEY = 'slp.member.v1';
/** 免费试用天数 */
export const TRIAL_DAYS = 7;
/** 开通后多少天内至少联网核对一次（管理员关闭能生效） */
export const OFFLINE_DAYS = 7;
export const PRICE_TEXT = '会员 9.9 元 / 月';
const DAY = 24 * 3600 * 1000;

export interface MemberState {
  v: 1;
  deviceId: string;
  /** 第一次打开（这一版）的时间：免费试用从这天起算 */
  firstSeen: number;
  /** 见过的最晚时间：防止把手机时间往回调 */
  lastSeen: number;
  /** 当前有效的开通码 */
  code?: string;
  untilDay?: number;
  activatedAt?: number;
  /** 最近一次联网核对成功的时间 */
  lastCheck?: number;
  /** 管理员在服务器上关闭了这台手机 */
  revoked?: boolean;
  /** 试用结束后，今天用掉的免费今日一练 */
  freeMix?: { day: number; id: string };
}

export function createMember(deviceId: string, now: number): MemberState {
  return { v: 1, deviceId, firstSeen: now, lastSeen: now };
}

export function parseMember(raw: string | null): MemberState | null {
  if (!raw) return null;
  try {
    const m = JSON.parse(raw) as MemberState;
    if (m?.v !== 1 || !isValidDeviceId(m.deviceId) || typeof m.firstSeen !== 'number' || typeof m.lastSeen !== 'number') return null;
    return m;
  } catch {
    return null;
  }
}

/** 用来判断的“现在”：手机时间往回调了，按见过的最晚时间算 */
export const effectiveNow = (m: MemberState, now: number) => Math.max(now, m.lastSeen);

export type AccessKind = 'member' | 'trial' | 'free' | 'revoked' | 'needCheck';
export interface Access {
  kind: AccessKind;
  /** 会员到期日（第几天） */
  untilDay?: number;
  /** 试用还剩几天（含今天） */
  trialLeft?: number;
  /** 能不能用全部功能 */
  full: boolean;
}

export function access(m: MemberState, now: number, serverConfigured: boolean): Access {
  const t = effectiveNow(m, now);
  const today = dayNumber(t);
  const trialEnd = m.firstSeen + TRIAL_DAYS * DAY;
  const trial = t < trialEnd ? { kind: 'trial' as const, trialLeft: Math.max(1, Math.ceil((trialEnd - t) / DAY)), full: true } : null;
  if (m.revoked) return { kind: 'revoked', full: false };
  if (m.untilDay !== undefined && m.untilDay >= today) {
    const since = Math.max(m.lastCheck ?? 0, m.activatedAt ?? 0);
    if (serverConfigured && t - since > OFFLINE_DAYS * DAY) return trial ?? { kind: 'needCheck', untilDay: m.untilDay, full: false };
    return { kind: 'member', untilDay: m.untilDay, full: true };
  }
  return trial ?? { kind: 'free', full: false };
}

/** 填开通码 */
export type ActivateResult = { ok: true; state: MemberState } | { ok: false; reason: 'format' | 'signature' | 'device' | 'expired' };
export function activate(m: MemberState, code: string, publicKey: Uint8Array, now: number): ActivateResult {
  const r = verifyCode(code, publicKey, m.deviceId);
  if (!r.ok) return r;
  if (r.untilDay < dayNumber(effectiveNow(m, now))) return { ok: false, reason: 'expired' };
  // 同一台手机先后几次开通：用到期最晚的那个
  if (m.untilDay !== undefined && m.untilDay > r.untilDay && !m.revoked) return { ok: true, state: m };
  return { ok: true, state: { ...m, code: code.replace(/\s/g, ''), untilDay: r.untilDay, activatedAt: effectiveNow(m, now), revoked: false } };
}

/** 联网核对的结果 */
export function applyCheck(m: MemberState, res: { revoked: boolean; now?: number }, now: number): MemberState {
  const t = Math.max(effectiveNow(m, now), res.now ?? 0);
  return { ...m, revoked: res.revoked, lastCheck: t, lastSeen: t };
}

export const touch = (m: MemberState, now: number): MemberState => (now > m.lastSeen ? { ...m, lastSeen: now } : m);

/* ── 哪些页面不用会员也能打开 ── */
/** 浏览类页面：首页、学科页、家长中心、教材目录、知识地图 */
const ALWAYS: Route['name'][] = ['home', 'subject', 'parent', 'textbooks', 'map'];

export type Gate = { ok: true; freeMixId?: string } | { ok: false; reason: 'locked' | 'free-used' | 'need-check' | 'revoked' };

/** 能不能打开这个页面；试用结束后每天可以免费做 1 套今日一练（同一套当天可以再打开） */
export function gate(route: Route, m: MemberState, a: Access, now: number): Gate {
  if (a.full || ALWAYS.includes(route.name)) return { ok: true };
  if (route.name === 'practice' && route.id.startsWith('mix:')) {
    const today = dayNumber(effectiveNow(m, now));
    const todayId = route.id.endsWith(dayKey(effectiveNow(m, now)));
    if (todayId && (!m.freeMix || m.freeMix.day !== today || m.freeMix.id === route.id)) return { ok: true, freeMixId: route.id };
    if (todayId) return { ok: false, reason: 'free-used' };
  }
  if (a.kind === 'revoked') return { ok: false, reason: 'revoked' };
  if (a.kind === 'needCheck') return { ok: false, reason: 'need-check' };
  return { ok: false, reason: 'locked' };
}

export const spendFreeMix = (m: MemberState, id: string, now: number): MemberState => ({
  ...m,
  freeMix: { day: dayNumber(effectiveNow(m, now)), id },
});
