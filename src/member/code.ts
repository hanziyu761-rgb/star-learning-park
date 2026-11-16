/**
 * 会员开通码（V5.3）：管理员用自己的开通工具（私钥）签名，APP 用公钥核对，不需要联网、不需要数据库。
 *
 * 设备号：8 位（7 位随机 + 1 位校验），字符不含容易看错的 I L O U，显示成 ABCD-EFGH。
 * 开通码：LH1. + base64url( 版本 1 | 设备号 8 字节 | 到期日 2 字节 | Ed25519 签名 64 字节 )
 *   到期日 = 从 2026-01-01 起的第几天（这一天当天仍有效）。
 * 码和设备号绑定：别的手机拿去用核对不过。没有私钥造不出能通过核对的码。
 */
import nacl from 'tweetnacl';

export const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_PREFIX = 'LH1.';
/** 到期日从这一天起算（第 0 天） */
const EPOCH = Date.UTC(2026, 0, 1);
const DAY = 24 * 3600 * 1000;

function checkChar(body: string): string {
  let s = 0;
  for (let i = 0; i < body.length; i++) s += (ALPHABET.indexOf(body[i]) + 1) * (i + 3);
  return ALPHABET[s % ALPHABET.length];
}

export function newDeviceId(rand: () => number = Math.random): string {
  let body = '';
  for (let i = 0; i < 7; i++) body += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return body + checkChar(body);
}

/** 家长输入、粘贴的设备号整理成标准形式（去掉横线空格、转大写、O→0 I/L→1） */
export function normalizeDeviceId(s: string): string {
  return s
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

export function isValidDeviceId(id: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{8}$/.test(id) && checkChar(id.slice(0, 7)) === id[7];
}

export const showDeviceId = (id: string) => `${id.slice(0, 4)}-${id.slice(4)}`;

/** 本地日期是 2026-01-01 起的第几天 */
export function dayNumber(t: number): number {
  const d = new Date(t);
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / DAY);
}

export function dayToDate(n: number): string {
  return new Date(EPOCH + n * DAY).toISOString().slice(0, 10);
}

/* base64url（不依赖 Buffer，手机上也能用） */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export function b64urlEncode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = [(n >> 18) & 63, (n >> 12) & 63, (n >> 6) & 63, n & 63].map((k) => B64[k]);
    out += chars.slice(0, Math.min(4, bytes.length - i + 1)).join('');
  }
  return out;
}
export function b64urlDecode(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null;
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i += 4) {
    const part = s.slice(i, i + 4);
    let n = 0;
    for (let k = 0; k < 4; k++) n = (n << 6) | (k < part.length ? B64.indexOf(part[k]) : 0);
    bytes.push((n >> 16) & 255);
    if (part.length > 2) bytes.push((n >> 8) & 255);
    if (part.length > 3) bytes.push(n & 255);
  }
  return new Uint8Array(bytes);
}

export function decodeBase64(s: string): Uint8Array {
  const u = b64urlDecode(s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  if (!u) throw new Error('公钥格式不对');
  return u;
}

const MSG_LEN = 11;

/** 生成开通码（管理员工具和测试用；APP 里没有私钥，不会调用） */
export function signCode(secretKey: Uint8Array, deviceId: string, untilDay: number): string {
  const msg = new Uint8Array(MSG_LEN);
  msg[0] = 1;
  for (let i = 0; i < 8; i++) msg[1 + i] = deviceId.charCodeAt(i);
  msg[9] = (untilDay >> 8) & 255;
  msg[10] = untilDay & 255;
  const sig = nacl.sign.detached(msg, secretKey);
  const all = new Uint8Array(MSG_LEN + sig.length);
  all.set(msg);
  all.set(sig, MSG_LEN);
  return CODE_PREFIX + b64urlEncode(all);
}

export type CodeCheck =
  | { ok: true; deviceId: string; untilDay: number }
  | { ok: false; reason: 'format' | 'signature' | 'device' };

/** 核对开通码：格式、签名、是不是这台手机的 */
export function verifyCode(code: string, publicKey: Uint8Array, deviceId: string): CodeCheck {
  const t = code.replace(/\s/g, '');
  if (!t.startsWith(CODE_PREFIX)) return { ok: false, reason: 'format' };
  const all = b64urlDecode(t.slice(CODE_PREFIX.length));
  if (!all || all.length !== MSG_LEN + 64 || all[0] !== 1) return { ok: false, reason: 'format' };
  const msg = all.slice(0, MSG_LEN);
  if (!nacl.sign.detached.verify(msg, all.slice(MSG_LEN), publicKey)) return { ok: false, reason: 'signature' };
  const id = String.fromCharCode(...msg.slice(1, 9));
  if (id !== deviceId) return { ok: false, reason: 'device' };
  return { ok: true, deviceId: id, untilDay: (msg[9] << 8) | msg[10] };
}
