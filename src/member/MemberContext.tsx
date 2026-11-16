/**
 * 会员（V5.3）：读取 / 保存会员状态，联网核对（管理员关闭），页面跳转前检查能不能打开。
 * 只向自家服务器发送设备号，不发送任何学习记录或个人信息。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_AI_BASE_URL } from '@/ai/client';
import { NavProvider, useNav, type Nav, type Route } from '@/nav/Nav';
import { useProgress } from '@/progress/ProgressContext';
import { newDeviceId } from './code';
import { ADMIN_PUBLIC_KEY } from './key';
import {
  access,
  activate as activateCode,
  applyCheck,
  createMember,
  gate,
  MEMBER_STORAGE_KEY,
  parseMember,
  spendFreeMix,
  touch,
  type Access,
  type ActivateResult,
  type Gate,
  type MemberState,
} from './model';
import { Paywall } from './Paywall';

export interface MemberContextValue {
  ready: boolean;
  member: MemberState | null;
  access: Access;
  /** 有没有配置自家服务器（没有时管理员关闭不能生效，也不要求联网核对） */
  serverConfigured: boolean;
  activate: (code: string) => ActivateResult | null;
  /** 立即联网核对一次；返回是否核对成功 */
  checkNow: () => Promise<boolean>;
  /** 页面跳转前检查 */
  gateRoute: (route: Route) => Gate;
}

const FULL: Access = { kind: 'trial', full: true };
const MemberContext = createContext<MemberContextValue | null>(null);

/** 联网核对：GET {服务器}/api/member/check?d=设备号 → { ok, revoked, now }；旧版服务器没有这个接口（404）当作没有关闭 */
export async function fetchMemberCheck(baseUrl: string, deviceId: string): Promise<{ revoked: boolean; now?: number } | null> {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctl?.abort(), 8000);
  try {
    const r = await fetch(`${baseUrl.replace(/\/$/, '')}/api/member/check?d=${encodeURIComponent(deviceId)}`, { signal: ctl?.signal });
    if (r.status === 404) return { revoked: false };
    if (!r.ok) return null;
    const j = (await r.json()) as { ok?: boolean; revoked?: boolean; now?: number };
    if (!j || j.ok !== true) return null;
    return { revoked: j.revoked === true, now: typeof j.now === 'number' ? j.now : undefined };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const { state } = useProgress();
  const baseUrl = (state.settings.aiBaseUrl || DEFAULT_AI_BASE_URL).replace(/\/$/, '');
  const [member, setMember] = useState<MemberState | null>(null);
  const memberRef = useRef<MemberState | null>(null);
  // “现在”：每分钟刷新一次，保存会员信息时也刷新（到期、试用结束能及时生效）
  const [now, setNow] = useState(() => Date.now());

  const save = useCallback((m: MemberState) => {
    memberRef.current = m;
    setMember(m);
    setNow(Date.now());
    AsyncStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(m)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(MEMBER_STORAGE_KEY)
      .catch(() => null)
      .then((raw) => {
        if (cancelled) return;
        const now = Date.now();
        const m = parseMember(raw) ?? createMember(newDeviceId(), now);
        save(touch(m, now));
      });
    return () => {
      cancelled = true;
    };
  }, [save]);

  const checkNow = useCallback(async () => {
    const m = memberRef.current;
    if (!m || !baseUrl) return false;
    const res = await fetchMemberCheck(baseUrl, m.deviceId);
    if (!res || !memberRef.current) return false;
    save(applyCheck(memberRef.current, res, Date.now()));
    return true;
  }, [baseUrl, save]);

  // 打开 APP 时核对一次，之后每 6 小时一次；每分钟刷新一次（到期、试用结束能及时生效）
  const deviceId = member?.deviceId;
  useEffect(() => {
    if (!deviceId) return;
    checkNow();
    const a = setInterval(checkNow, 6 * 3600 * 1000);
    const b = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [deviceId, checkNow]);

  const value = useMemo<MemberContextValue>(() => {
    const a = member ? access(member, now, !!baseUrl) : FULL;
    return {
      ready: !!member,
      member,
      access: a,
      serverConfigured: !!baseUrl,
      activate: (code) => {
        const m = memberRef.current;
        if (!m) return null;
        const r = activateCode(m, code, ADMIN_PUBLIC_KEY, Date.now());
        if (r.ok) {
          save(r.state);
          checkNow();
        }
        return r;
      },
      checkNow,
      gateRoute: (route) => {
        const m = memberRef.current;
        // 还没读出会员信息的一瞬间不拦（读出来以后才判断）
        if (!m) return { ok: true };
        const t = Date.now();
        const g = gate(route, m, access(m, t, !!baseUrl), t);
        if (g.ok && g.freeMixId) save(spendFreeMix(touch(m, t), g.freeMixId, t));
        return g;
      },
    };
  }, [member, now, baseUrl, save, checkNow]);

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

/** 测试里单独渲染某个页面时没有会员信息，按“可以用”处理；APP 里一定有 MemberProvider（有测试检查） */
const MISSING: MemberContextValue = {
  ready: false,
  member: null,
  access: FULL,
  serverConfigured: false,
  activate: () => null,
  checkNow: async () => false,
  gateRoute: () => ({ ok: true }),
};
export function useMember(): MemberContextValue {
  return useContext(MemberContext) ?? MISSING;
}

/** 页面跳转前先问会员：不能打开时弹出说明，不跳转 */
export function MemberNavGate({ children }: { children: React.ReactNode }) {
  const inner = useNav();
  const { gateRoute } = useMember();
  const [blocked, setBlocked] = useState<Gate | null>(null);
  const nav = useMemo<Nav>(
    () => ({
      ...inner,
      push: (route) => {
        const g = gateRoute(route);
        if (g.ok) inner.push(route);
        else setBlocked(g);
      },
    }),
    [inner, gateRoute],
  );
  return (
    <NavProvider nav={nav}>
      {children}
      {blocked && !blocked.ok ? (
        <Paywall
          reason={blocked.reason}
          onClose={() => setBlocked(null)}
          onParent={() => {
            setBlocked(null);
            inner.push({ name: 'parent' });
          }}
        />
      ) : null}
    </NavProvider>
  );
}
