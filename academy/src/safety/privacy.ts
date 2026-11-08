// Client-side privacy check, ported from server.js `hasPrivate` and extended.
// It runs on every piece of free text the child types (V1: nicknames and the
// robot project). Matches are blocked and only the category is logged.

const PATTERNS: RegExp[] = [
  /1[3-9]\d{9}/, // mainland mobile number
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i, // email
  /(?:\d[\s-]?){9,}/, // long digit runs (ID, phone, account)
  /(?:身份证|住址|家庭地址|电话号码|手机号|微信号|QQ号|我叫|我的名字|真名|学校地址|小学|幼儿园|班主任|几栋|单元|门牌|小区|路\d+号|my address|my phone|my full name)/i,
];

export function containsPrivateInfo(text: string): boolean {
  const t = String(text ?? '');
  return PATTERNS.some((re) => re.test(t));
}

export const PRIVACY_MESSAGE = '这里好像有个人信息（比如真名、电话、学校、住址）。为了安全，请换一个说法。';

/** Nickname rules: 1–8 characters, no private info. */
export function checkNickname(name: string): string | null {
  const n = name.trim();
  if (n.length < 1) return '请给自己起一个昵称。';
  if (Array.from(n).length > 8) return '昵称最多 8 个字。';
  if (containsPrivateInfo(n)) return PRIVACY_MESSAGE;
  return null;
}

export const SUGGESTED_NICKNAMES = ['小星星', '火箭队长', '机器人迷', '小小探险家', '彩虹豆', '闪电兔'];
export const AVATARS = ['🦊', '🐼', '🐯', '🐰', '🐨', '🦁', '🐸', '🐧'];
