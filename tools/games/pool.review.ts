/**
 * 生成拼音钓鱼（一、二年级）的字表（V2.19）：只用课程里人工注过拼音的字，并且
 * 1) 同一个字在所有课程里注音一致；2) 不是轻声；3) pinyin-pro 词库里只有这一个读音（不是多音字）；4) 与词库读音一致。
 * 运行：npx jest --testMatch '<rootDir>/tools/games/*.review.ts' → src/games/data/charPool.gen.ts
 */
import fs from 'fs';
import path from 'path';
import { pinyin } from 'pinyin-pro';
import { LESSONS } from '@/content';
import { KP_TEACH } from '@/knowledge/teach';
import type { PinyinSeg } from '@/lesson/types';

const seen = new Map<string, Set<string>>();
const order: string[] = [];
function walk(node: unknown) {
  if (Array.isArray(node)) {
    if (node.length && node.every((s) => s && typeof s === 'object' && 'char' in s)) {
      for (const s of node as PinyinSeg[])
        if (s.py && /\p{Script=Han}/u.test(s.char)) {
          if (!seen.has(s.char)) {
            seen.set(s.char, new Set());
            order.push(s.char);
          }
          seen.get(s.char)!.add(s.py);
        }
      return;
    }
    node.forEach(walk);
  } else if (node && typeof node === 'object') Object.values(node).forEach(walk);
}

it('生成拼音钓鱼字表', () => {
  walk(LESSONS);
  walk(KP_TEACH);
  const pool: string[] = [];
  for (const ch of order) {
    const pys = [...seen.get(ch)!];
    if (pys.length !== 1) continue;
    const py = pys[0];
    if (!/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(py)) continue;
    const all = pinyin(ch, { multiple: true, type: 'array', toneType: 'symbol' });
    if (all.length !== 1 || all[0] !== py) continue;
    pool.push(`${ch}|${py}`);
  }
  fs.writeFileSync(
    path.join(process.cwd(), 'src/games/data/charPool.gen.ts'),
    `// 自动生成：tools/games/pool.review.ts，请勿手改。课程里人工注音、且不是多音字的字 ${pool.length} 个（字|拼音）。\nexport const CHAR_POOL = '${pool.join(' ')}'.split(' ').map((x) => x.split('|') as [string, string]);\n`,
  );
  console.log(pool.length, pool.slice(0, 30).join(' '));
  expect(pool.length).toBeGreaterThan(100);
});
