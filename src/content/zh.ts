import type { Prompt, Speakable, ZhText } from '@/lesson/types';

const HAN = /\p{Script=Han}/u;

/**
 * 生成带拼音的中文文本。
 * 拼音由人工逐字填写（以空格分隔，带声调符号），每个汉字对应一个拼音，标点不注音。
 * 例：zh('日月水火', 'rì yuè shuǐ huǒ')
 * 汉字和拼音数量不一致时直接报错，测试会检查所有课程内容。
 */
export function zh(chars: string, pinyin: string): ZhText {
  const pys = pinyin.trim().split(/\s+/).filter(Boolean);
  const segs: ZhText = [];
  let i = 0;
  for (const char of Array.from(chars)) {
    if (HAN.test(char)) {
      const py = pys[i++];
      if (py === undefined) throw new Error(`拼音数量不足：「${chars}」`);
      segs.push({ char, py });
    } else {
      segs.push({ char });
    }
  }
  if (i !== pys.length) throw new Error(`拼音数量多于汉字：「${chars}」`);
  return segs;
}

export function plainText(text: ZhText | string): string {
  return typeof text === 'string' ? text : text.map((s) => s.char).join('');
}

/** 中文提示：显示带拼音的文字，朗读同一句话 */
export function zhPrompt(chars: string, pinyin: string, speakText?: string): Prompt {
  return { text: zh(chars, pinyin), speak: { text: speakText ?? chars, lang: 'zh-CN' } };
}

/** 英文提示：英文显示与朗读，可附带中文小提示 */
export function enPrompt(text: string, hintZh?: string, speakText?: string): Prompt {
  return { text, speak: { text: speakText ?? text, lang: 'en-US' }, hintZh };
}

export const zhS = (text: string): Speakable => ({ text, lang: 'zh-CN' });
export const enS = (text: string): Speakable => ({ text, lang: 'en-US' });
