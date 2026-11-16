/**
 * V5.3 会员：设备号、开通码签名核对、试用 / 会员 / 到期 / 关闭 / 联网核对、页面放行规则。
 */
import fs from 'fs';
import path from 'path';
import nacl from 'tweetnacl';
import { b64urlDecode, b64urlEncode, dayNumber, isValidDeviceId, newDeviceId, normalizeDeviceId, signCode, verifyCode } from '@/member/code';
import { ADMIN_PUBLIC_KEY } from '@/member/key';
import { access, activate, applyCheck, createMember, gate, parseMember, spendFreeMix, type MemberState } from '@/member/model';
import { dailyMixId } from '@/knowledge/dailyMix';
import { dayKey } from '@/progress/srs';
import { seeded } from '@/thinking/challenges';

const DAY = 86400000;
const T0 = new Date(2026, 10, 16, 10).getTime(); // 本地时间 2026-11-16 10:00
const kp = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));
const DEV = newDeviceId(seeded(1));
const base = (): MemberState => createMember(DEV, T0);

describe('设备号', () => {
  it('8 位、带校验位；输入时的横线、小写、O/I/L 都能认', () => {
    const r = seeded(9);
    for (let i = 0; i < 200; i++) expect(isValidDeviceId(newDeviceId(r))).toBe(true);
    expect(isValidDeviceId(DEV)).toBe(true);
    // 改一位就校验不过
    const bad = DEV.slice(0, 3) + (DEV[3] === 'A' ? 'B' : 'A') + DEV.slice(4);
    expect(isValidDeviceId(bad)).toBe(false);
    expect(normalizeDeviceId(` ${DEV.slice(0, 4).toLowerCase()}-${DEV.slice(4)} `)).toBe(DEV);
    expect(normalizeDeviceId('o1l1-ab0c')).toBe('0111AB0C');
  });
});

describe('开通码', () => {
  it('base64url 编码解码', () => {
    const r = seeded(3);
    for (let n = 0; n < 80; n++) {
      const b = Uint8Array.from({ length: n }, () => Math.floor(r() * 256));
      expect([...b64urlDecode(b64urlEncode(b))!]).toEqual([...b]);
    }
  });
  it('私钥签的码能核对，到期日原样读出；改动、换手机、换钥匙都核对不过', () => {
    const code = signCode(kp.secretKey, DEV, 400);
    expect(code.startsWith('LH1.')).toBe(true);
    expect(verifyCode(code, kp.publicKey, DEV)).toEqual({ ok: true, deviceId: DEV, untilDay: 400 });
    // 复制时带了换行空格也行
    expect(verifyCode(` ${code.slice(0, 30)}\n${code.slice(30)} `, kp.publicKey, DEV).ok).toBe(true);
    const other = newDeviceId(seeded(2));
    expect(verifyCode(code, kp.publicKey, other)).toEqual({ ok: false, reason: 'device' });
    const tampered = code.slice(0, 20) + (code[20] === 'A' ? 'B' : 'A') + code.slice(21);
    expect(verifyCode(tampered, kp.publicKey, DEV).ok).toBe(false);
    expect(verifyCode(code, ADMIN_PUBLIC_KEY, DEV)).toEqual({ ok: false, reason: 'signature' });
    expect(verifyCode('随便写的', kp.publicKey, DEV)).toEqual({ ok: false, reason: 'format' });
  });
  it('APP 里的公钥是 32 字节；代码仓库里没有私钥', () => {
    expect(ADMIN_PUBLIC_KEY.length).toBe(32);
    const files = ['src/member/key.ts', 'src/member/code.ts', 'tools/member/admin-template.html'];
    for (const f of files) expect(fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).not.toMatch(/secretKey["']?\s*[:=]\s*["'][A-Za-z0-9+/=]{40,}/);
    expect(fs.readFileSync(path.join(__dirname, '..', 'tools/member/admin-template.html'), 'utf8')).toContain("'__SECRET_KEY__'");
    expect(fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8')).toContain('*.admin.html');
  });
  it('开通工具网页和 APP 用同一套字符表、起算日和校验位算法', () => {
    const tpl = fs.readFileSync(path.join(__dirname, '..', 'tools/member/admin-template.html'), 'utf8');
    expect(tpl).toContain("const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';");
    expect(tpl).toContain('const EPOCH = Date.UTC(2026, 0, 1);');
    expect(tpl).toContain('s += (ALPHABET.indexOf(body[i]) + 1) * (i + 3)');
  });
});

describe('会员状态', () => {
  const pub = kp.publicKey;
  // 测试里用测试钥匙：把 activate 的公钥换成测试公钥
  const act = (m: MemberState, until: number, now = T0) => activate(m, signCode(kp.secretKey, m.deviceId, until), pub, now);

  it('新安装免费试用 7 天，第 8 天起试用结束', () => {
    const m = base();
    expect(access(m, T0, true)).toMatchObject({ kind: 'trial', trialLeft: 7, full: true });
    expect(access(m, T0 + 6.5 * DAY, true)).toMatchObject({ kind: 'trial', trialLeft: 1, full: true });
    expect(access(m, T0 + 7 * DAY, true)).toEqual({ kind: 'free', full: false });
  });

  it('开通后到期日当天仍有效，第二天到期', () => {
    const until = dayNumber(T0 + 40 * DAY);
    const r = act(base(), until);
    expect(r.ok).toBe(true);
    const m = r.ok ? applyCheck(r.state, { revoked: false }, T0) : base();
    expect(access(m, T0 + 10 * DAY, false)).toMatchObject({ kind: 'member', full: true });
    expect(access(m, T0 + 40 * DAY, false)).toMatchObject({ kind: 'member', full: true });
    expect(access(m, T0 + 41 * DAY, false)).toEqual({ kind: 'free', full: false });
  });

  it('已经过期的码不能开通；先开了长的，再填短的不会缩短', () => {
    expect(act(base(), dayNumber(T0 - 2 * DAY))).toEqual({ ok: false, reason: 'expired' });
    const long = act(base(), dayNumber(T0 + 300 * DAY));
    const m = long.ok ? long.state : base();
    const short = act(m, dayNumber(T0 + 30 * DAY));
    expect(short.ok && short.state.untilDay).toBe(dayNumber(T0 + 300 * DAY));
  });

  it('有服务器时，开通后超过 7 天没联网核对就要先核对；没配置服务器时不要求', () => {
    const r = act(createMember(DEV, T0 - 30 * DAY), dayNumber(T0 + 300 * DAY));
    const m = r.ok ? r.state : base();
    expect(access(m, T0 + 6 * DAY, true).kind).toBe('member');
    expect(access(m, T0 + 8 * DAY, true)).toMatchObject({ kind: 'needCheck', full: false });
    expect(access(m, T0 + 8 * DAY, false).kind).toBe('member');
    const checked = applyCheck(m, { revoked: false }, T0 + 8 * DAY);
    expect(access(checked, T0 + 8 * DAY, true).kind).toBe('member');
  });

  it('管理员关闭后不能用；去掉关闭后再核对恢复', () => {
    const r = act(createMember(DEV, T0 - 30 * DAY), dayNumber(T0 + 300 * DAY));
    const m = r.ok ? r.state : base();
    const off = applyCheck(m, { revoked: true }, T0);
    expect(access(off, T0, true)).toEqual({ kind: 'revoked', full: false });
    expect(access(applyCheck(off, { revoked: false }, T0 + DAY), T0 + DAY, true).kind).toBe('member');
  });

  it('把手机时间往回调不能延长试用或会员（按见过的最晚时间、服务器时间算）', () => {
    const m = applyCheck(base(), { revoked: false, now: T0 + 20 * DAY }, T0 + 20 * DAY);
    expect(access(m, T0, true)).toEqual({ kind: 'free', full: false });
  });

  it('保存的会员信息能读回；坏数据当作没有', () => {
    const m = base();
    expect(parseMember(JSON.stringify(m))).toEqual(m);
    expect(parseMember('不是 JSON')).toBeNull();
    expect(parseMember(JSON.stringify({ ...m, deviceId: 'XXXX' }))).toBeNull();
  });
});

describe('页面放行', () => {
  const free = (): MemberState => createMember(DEV, T0 - 30 * DAY);
  const now = T0;
  const a = (m: MemberState) => access(m, now, true);
  const today = dayKey(now);

  it('试用 / 会员：所有页面都能打开', () => {
    const m = base();
    for (const r of [{ name: 'lesson', id: 'x' }, { name: 'games' }, { name: 'teacher' }, { name: 'exam' }] as const)
      expect(gate(r, m, a(m), now)).toEqual({ ok: true });
  });

  it('试用结束：浏览页面可以打开，学习功能要会员', () => {
    const m = free();
    for (const name of ['home', 'parent', 'textbooks', 'map'] as const) expect(gate({ name }, m, a(m), now).ok).toBe(true);
    expect(gate({ name: 'subject', subject: 'math' }, m, a(m), now).ok).toBe(true);
    for (const r of [{ name: 'lesson', id: 'x' }, { name: 'games' }, { name: 'teacher' }, { name: 'challenge' }, { name: 'practice', id: 'kp:m7.a2' }, { name: 'words' }] as const)
      expect(gate(r, m, a(m), now)).toEqual({ ok: false, reason: 'locked' });
  });

  it('试用结束：每天能免费做 1 套今日一练（同一套当天可以再打开，换一科不行，第二天又可以）', () => {
    let m = free();
    const mathId = dailyMixId('math', 3, today);
    const g = gate({ name: 'practice', id: mathId }, m, a(m), now);
    expect(g).toEqual({ ok: true, freeMixId: mathId });
    m = spendFreeMix(m, mathId, now);
    expect(gate({ name: 'practice', id: mathId }, m, a(m), now).ok).toBe(true);
    expect(gate({ name: 'practice', id: dailyMixId('chinese', 3, today) }, m, a(m), now)).toEqual({ ok: false, reason: 'free-used' });
    // 昨天的那一套不能打开
    expect(gate({ name: 'practice', id: dailyMixId('math', 3, dayKey(now - DAY)) }, m, a(m), now)).toEqual({ ok: false, reason: 'locked' });
    const tomorrow = now + DAY;
    expect(gate({ name: 'practice', id: dailyMixId('english', 3, dayKey(tomorrow)) }, m, access(m, tomorrow, true), tomorrow).ok).toBe(true);
  });

  it('APP 版和单文件 HTML 版都装了会员检查', () => {
    for (const f of ['src/app/_layout.tsx', 'src/single/App.tsx']) {
      const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
      expect(src).toContain('<MemberProvider>');
      expect(src).toContain('<MemberNavGate>');
    }
  });
});
