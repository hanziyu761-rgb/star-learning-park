import { checkNickname, containsPrivateInfo } from '../src/safety/privacy';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('privacy check', () => {
  it.each([
    '我叫王小明', '13812345678', 'mom@example.com', '我家住址是', '我在实验小学', '110101201501011234', 'my phone is',
  ])('blocks %s', (t) => expect(containsPrivateInfo(t)).toBe(true));

  it.each(['小星星', '火箭队长', '小绿', '因为土干了花会渴'])('allows %s', (t) => expect(containsPrivateInfo(t)).toBe(false));

  it('nickname rules', () => {
    expect(checkNickname('')).not.toBeNull();
    expect(checkNickname('一二三四五六七八九')).not.toBeNull();
    expect(checkNickname('我叫小明')).not.toBeNull();
    expect(checkNickname('彩虹豆')).toBeNull();
  });
});

describe('no secrets or outside calls in the client source', () => {
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else files.push(p); } };
  walk(join(__dirname, '..', 'src'));
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  it('contains no API key patterns', () => {
    expect(all).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
    expect(all).not.toMatch(/DEEPSEEK_API_KEY/);
  });

  it('makes no network calls to other sites', () => {
    expect(all).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });
});
