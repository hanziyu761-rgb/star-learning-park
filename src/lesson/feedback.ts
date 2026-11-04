import * as Haptics from 'expo-haptics';
import { zh } from '@/content/zh';
import type { DisplayText, Prompt, Speakable, Subject } from '@/lesson/types';
import { speakSequence } from '@/speech/speech';

/** 课程的提示语言：英语课使用英文鼓励语，其它课使用中文 */
export type FeedbackLang = 'zh' | 'en';

export const langForSubject = (s: Subject): FeedbackLang => (s === 'english' ? 'en' : 'zh');

const PRAISE: Record<FeedbackLang, { text: DisplayText; speak: Speakable }[]> = {
  zh: [
    { text: zh('答对了！真棒！', 'dá duì le zhēn bàng'), speak: { text: '答对了！真棒！', lang: 'zh-CN' } },
    { text: zh('你真厉害！', 'nǐ zhēn lì hai'), speak: { text: '你真厉害！', lang: 'zh-CN' } },
    { text: zh('太好了！', 'tài hǎo le'), speak: { text: '太好了！', lang: 'zh-CN' } },
  ],
  en: [
    { text: 'Great job!', speak: { text: 'Great job!', lang: 'en-US' } },
    { text: 'Well done!', speak: { text: 'Well done!', lang: 'en-US' } },
    { text: 'You got it!', speak: { text: 'You got it!', lang: 'en-US' } },
  ],
};

const RETRY: Record<FeedbackLang, { text: DisplayText; speak: Speakable }> = {
  zh: { text: zh('再想一想', 'zài xiǎng yi xiǎng'), speak: { text: '再想一想', lang: 'zh-CN' } },
  en: { text: 'Try again!', speak: { text: 'Try again!', lang: 'en-US' } },
};

export interface FeedbackMessage {
  kind: 'correct' | 'wrong' | 'info';
  text: DisplayText;
  hint?: Prompt;
}

let praiseIndex = 0;

export function praise(lang: FeedbackLang): FeedbackMessage {
  const p = PRAISE[lang][praiseIndex++ % PRAISE[lang].length];
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  speakSequence([p.speak]);
  return { kind: 'correct', text: p.text };
}

export function retry(lang: FeedbackLang, hint: Prompt): FeedbackMessage {
  const r = RETRY[lang];
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
  speakSequence([r.speak, hint.speak]);
  return { kind: 'wrong', text: r.text, hint };
}
