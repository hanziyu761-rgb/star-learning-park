import type { DisplayText } from '@/lesson/types';

export interface TeachSlide {
  /** 图示：表情符号、算式或英语句子 */
  show: string;
  /** 一句话讲方法：一、二年级带拼音，三年级起为普通文字 */
  text: DisplayText;
  /** 朗读的内容 */
  speak: string;
  /** 朗读语言（默认中文；英语讲解读英语句子） */
  lang?: 'zh-CN' | 'en-US';
}
