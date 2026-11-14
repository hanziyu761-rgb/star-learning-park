/**
 * 预先录好的朗读覆盖了固定内容：所有课程（含阅读小屋、英语三条主线）、知识点讲解、单词卡、首页欢迎语都有录音。
 * V2.21 起只有一套“星星宝童声”（阿里云百炼 CosyVoice 龙呼呼），中文、英语同一个声音。
 */
import { LESSONS } from '@/content';
import { KP_TEACH } from '@/knowledge/teach';
import { findClip } from '@/speech/clips';
import { CLIP_VOICES, CLIPS } from '@/speech/voiceClips.native';
import type { Speakable } from '@/lesson/types';
import { ALL_CARDS } from '@/words/catalog';
import { GREETING } from '@/content/greeting';
import { getKp } from '@/knowledge/graph';

function speakables(node: unknown, out: Speakable[] = []): Speakable[] {
  if (Array.isArray(node)) node.forEach((n) => speakables(n, out));
  else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.text === 'string' && (o.lang === 'zh-CN' || o.lang === 'en-US')) out.push(o as unknown as Speakable);
    Object.values(o).forEach((n) => speakables(n, out));
  }
  return out;
}

it('录音清单只有一套龙呼呼童声', () => {
  expect(CLIP_VOICES).toEqual({ model: 'cosyvoice-v3-flash', voice: 'longhuhu_v3' });
  expect(Object.keys(CLIPS)).toEqual(['c']);
  expect(Object.keys(CLIPS.c).length).toBeGreaterThan(2500);
});

/** 初中（V5.2）新加的内容：还没有预录，先联网现念；句子已写进录音清单 tools/voice/cloud/list.json，等 APP 所有者用 record.ps1 补录 */
const juniorKp = (id: string) => (getKp(id)?.grade ?? 1) >= 7;
const LIST: { id: string; lang: string; text: string }[] = require('../tools/voice/cloud/list.json');
const LISTED = new Set(LIST.map((x) => `${x.lang}|${x.text}`));

it('所有课程、讲解和首页欢迎语都有童声录音（初中新内容见下一项）', () => {
  const all = [
    ...speakables(LESSONS.filter((l) => (l.grade ?? 1) <= 6)),
    ...Object.entries(KP_TEACH)
      .filter(([id]) => !juniorKp(id))
      .flatMap(([, ss]) => ss.map((s) => ({ text: s.speak, lang: s.lang ?? 'zh-CN' }) as Speakable)),
    GREETING as Speakable,
  ];
  expect(all.length).toBeGreaterThan(1000);
  const missing = all.filter((s) => !findClip(s));
  expect(missing.map((s) => s.text).slice(0, 5)).toEqual([]);
});

it('初中新内容（阅读小屋、讲解、单词卡）的每一句都已写进录音清单，等待补录', () => {
  const junior = [
    ...speakables(LESSONS.filter((l) => (l.grade ?? 1) >= 7)),
    ...Object.entries(KP_TEACH)
      .filter(([id]) => juniorKp(id))
      .flatMap(([, ss]) => ss.map((s) => ({ text: s.speak, lang: s.lang ?? 'zh-CN' }) as Speakable)),
    ...ALL_CARDS.filter((c) => /^jh\d/.test(c.unitId)).flatMap((c) => [c.w, c.ex]).map((text) => ({ text, lang: 'en-US' }) as Speakable),
  ];
  expect(junior.length).toBeGreaterThan(500);
  const notListed = junior.filter((s) => !findClip(s) && !LISTED.has(`${s.lang}|${s.text}`));
  expect(notListed.map((s) => s.text).slice(0, 5)).toEqual([]);
});

it('单词卡每个单词和例句都有童声录音（英语也是同一个声音；初中单元见上一项）', () => {
  const all = ALL_CARDS.filter((c) => !/^jh\d/.test(c.unitId))
    .flatMap((c) => [c.w, c.ex])
    .map((text) => ({ text, lang: 'en-US' }) as Speakable);
  const missing = all.filter((s) => !findClip(s));
  expect(missing.map((s) => s.text).slice(0, 5)).toEqual([]);
});
