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
  expect(Object.keys(CLIPS.c).length).toBeGreaterThan(3200);
});

it('所有课程（含七～九年级阅读小屋、初中英语阅读）、讲解（含初中）和首页欢迎语都有童声录音', () => {
  const all = [
    ...speakables(LESSONS),
    ...Object.values(KP_TEACH).flatMap((ss) => ss.map((s) => ({ text: s.speak, lang: s.lang ?? 'zh-CN' }) as Speakable)),
    GREETING as Speakable,
  ];
  expect(all.length).toBeGreaterThan(1000);
  const missing = all.filter((s) => !findClip(s));
  expect(missing.map((s) => s.text).slice(0, 5)).toEqual([]);
});

it('单词卡（含初中单元）每个单词和例句都有童声录音（英语也是同一个声音）', () => {
  const all = ALL_CARDS.flatMap((c) => [c.w, c.ex]).map((text) => ({ text, lang: 'en-US' }) as Speakable);
  const missing = all.filter((s) => !findClip(s));
  expect(missing.map((s) => s.text).slice(0, 5)).toEqual([]);
});

it('课程里每一句朗读都不超过 300 字（自家朗读服务一次最多合成 300 字，长短文要分段，V5.4.1）', () => {
  const long = speakables(LESSONS).filter((s) => Array.from(s.text).length > 300);
  expect(long.map((s) => s.text.slice(0, 40))).toEqual([]);
});
