/**
 * 统一视觉规范：颜色、圆角、字号、间距。
 * 所有页面和组件只从这里取值，保持风格一致。
 */
import type { Subject } from '@/lesson/types';

export const colors = {
  bg: '#FFF7E0',
  bgSky: '#DFF3FF',
  card: '#FFFFFF',
  text: '#3A2E2A',
  textSoft: '#7A6A60',
  line: '#F0E2C4',
  primary: '#FF8A3D',
  star: '#FFC531',
  starDeep: '#F5A400',
  correct: '#3BB273',
  correctSoft: '#E3F7EA',
  wrong: '#E8505B',
  wrongSoft: '#FDE6E8',
  disabled: '#D9D2C8',
  parent: '#6C63FF',
};

export const subjectTheme: Record<Subject, { name: string; nameEn: string; color: string; soft: string; emoji: string }> = {
  math: { name: '数学', nameEn: 'Math', color: '#4D9DE0', soft: '#E3F1FC', emoji: '🔢' },
  chinese: { name: '语文', nameEn: 'Chinese', color: '#E8505B', soft: '#FDE8EA', emoji: '📖' },
  english: { name: '英语', nameEn: 'English', color: '#3BB273', soft: '#E3F7EA', emoji: '🔤' },
};

export const radius = { sm: 12, md: 20, lg: 28, round: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  /** 儿童阅读主文字 */
  child: 28,
  childLarge: 40,
  title: 26,
  body: 18,
  small: 14,
  pinyin: 15,
};

/** 儿童可点击区域的最小尺寸（大于常规 48） */
export const MIN_TOUCH = 64;

export const shadow = {
  shadowColor: '#C9A86A',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};
