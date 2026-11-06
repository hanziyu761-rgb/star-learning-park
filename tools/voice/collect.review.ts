/**
 * 收集 APP 里固定的朗读内容（V2.16），交给 tools/voice/generate.py 用开源语音模型提前录好男声、女声。
 * 运行：npx jest --testMatch '<rootDir>/tools/voice/*.review.ts'  → tools/voice/out/speakables.json
 * 收集范围：所有课程（含英语三条主线、阅读小屋）、知识点小讲解、描红提示、单词卡的单词和例句（V2.18）、源代码里写死的朗读句子（鼓励语、按钮、试听句）。
 * 题库、口算、每日挑战等程序随机出的题目不预先录制，仍用手机语音。
 */
import fs from 'fs';
import path from 'path';
import { LESSONS } from '@/content';
import { ALL_WRITE_SETS, traceExercise } from '@/content/writing';
import { plainText } from '@/content/zh';
import { KP_TEACH } from '@/knowledge/teach';
import type { ZhText } from '@/lesson/types';
import { ALL_CARDS } from '@/words/catalog';

interface Item {
  text: string;
  lang: 'zh-CN' | 'en-US';
  /** 与汉字一一对应的拼音（来自课程里人工填写的注音），朗读时用它避免多音字读错 */
  py?: string[];
}

const items = new Map<string, Item>();
const add = (text: string, lang: string, py?: string[]) => {
  if (lang !== 'zh-CN' && lang !== 'en-US') return;
  const t = text.trim();
  if (!t) return;
  const key = `${lang}|${t}`;
  const old = items.get(key);
  if (!old || (!old.py && py)) items.set(key, { text: t, lang, py });
};
const isZh = (v: unknown): v is ZhText => Array.isArray(v) && v.length > 0 && v.every((s) => s && typeof s === 'object' && 'char' in s);
const pyOf = (z: ZhText) => z.filter((s) => s.py).map((s) => s.py!);

/** 所有注音文字：原文 → 每个字的拼音（标点、数字为空），用来给没有直接带拼音的句子拼出拼音 */
const phrases = new Map<string, string[]>();
function collectZh(node: unknown) {
  if (isZh(node)) {
    const plain = node.map((s) => s.char).join('');
    if (!phrases.has(plain)) phrases.set(plain, node.map((s) => s.py ?? ''));
    return;
  }
  if (Array.isArray(node)) return node.forEach(collectZh);
  if (node && typeof node === 'object') Object.values(node).forEach(collectZh);
}
const HAN = /\p{Script=Han}/u;
/** 用已知的注音文字（两个字以上的词句）从左到右拼出整句的拼音，取最长匹配；拼不出的字留空，由生成脚本按词语自动注音 */
function cover(text: string): string[] | undefined {
  const lens = [...new Set([...phrases.keys()].map((k) => k.length))].sort((a, b) => b - a);
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    let hit = false;
    for (const L of lens) {
      if (L < 2 || i + L > text.length) continue;
      const py = phrases.get(text.slice(i, i + L));
      if (py) {
        for (let k = 0; k < L; k++) if (HAN.test(text[i + k])) out.push(py[k]);
        i += L;
        hit = true;
        break;
      }
    }
    if (hit) continue;
    if (HAN.test(text[i])) out.push('');
    i += 1;
  }
  return out.some(Boolean) ? out : undefined;
}

function walk(node: unknown) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (!node || typeof node !== 'object') return;
  const o = node as Record<string, unknown>;
  // Speakable：{ text, lang }
  if (typeof o.text === 'string' && typeof o.lang === 'string') add(o.text, o.lang);
  // Prompt：{ text: ZhText, speak: { text, lang } } —— 朗读内容与注音文字相同时带上拼音
  const sp = o.speak as { text?: string; lang?: string } | undefined;
  if (sp && typeof sp.text === 'string' && typeof sp.lang === 'string') {
    add(sp.text, sp.lang, isZh(o.text) && plainText(o.text) === sp.text ? pyOf(o.text) : undefined);
  }
  Object.values(o).forEach(walk);
}

/** 源代码里写死的朗读句子：speak: { text: '…', lang: '…' }、speak({ text: '…', lang: '…' }) */
function scanSource(dir: string) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) scanSource(p);
    else if (/\.tsx?$/.test(f)) {
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/text:\s*'([^'\n]+)',\s*lang:\s*'(zh-CN|en-US)'/g)) add(m[1], m[2]);
      for (const m of src.matchAll(/'zh-CN':\s*'([^'\n]+)'/g)) add(m[1], 'zh-CN');
      for (const m of src.matchAll(/'en-US':\s*'([^'\n]+)'/g)) add(m[1], 'en-US');
    }
  }
}

it('收集固定朗读内容', () => {
  walk(LESSONS);
  for (const slides of Object.values(KP_TEACH))
    for (const s of slides) add(s.speak, s.lang ?? 'zh-CN', isZh(s.text) ? pyOf(s.text) : undefined);
  for (const set of ALL_WRITE_SETS) for (const c of set) walk(traceExercise(c.char));
  // V2.18 单词卡：每个单词和例句（美式英语）
  for (const c of ALL_CARDS) {
    add(c.w, 'en-US');
    add(c.ex, 'en-US');
  }
  scanSource(path.join(process.cwd(), 'src'));
  collectZh(LESSONS);
  collectZh(KP_TEACH);
  for (const it of items.values()) if (it.lang === 'zh-CN' && !it.py) it.py = cover(it.text);
  const list = [...items.values()];
  const out = path.join(process.cwd(), 'tools/voice/out');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'speakables.json'), JSON.stringify(list, null, 1));
  const chars = (l: string) => list.filter((x) => x.lang === l).reduce((s, x) => s + x.text.length, 0);
  console.log(`共 ${list.length} 句：中文 ${list.filter((x) => x.lang === 'zh-CN').length} 句 ${chars('zh-CN')} 字，英语 ${list.filter((x) => x.lang === 'en-US').length} 句 ${chars('en-US')} 字符；带拼音 ${list.filter((x) => x.py).length} 句（其中完整 ${list.filter((x) => x.py?.every(Boolean)).length} 句）`);
  expect(list.length).toBeGreaterThan(500);
});
