/** 单词卡页面配色（V2.18，V5.0 改为莫兰迪墨绿并支持深色模式）：主色墨绿，只用在单词卡页面 */
import { live } from '@/theme';

const LIGHT = {
  /** 主色：按钮底（上面是白字），浅色深色都不变 */
  main: '#3D6A56',
  mainLight: '#5A8672',
  /** 墨绿文字、描边（深色模式提亮） */
  mainText: '#3D6A56',
  soft: '#E6EEE9',
  bg: '#F5F3EF',
  line: 'rgba(60, 60, 67, 0.12)',
  text: '#1D1D1F',
  muted: '#6B6B70',
  accent: '#D9A441',
  accentDark: '#8F6B1E',
  heart: '#B55A55',
  ok: '#4A7F5B',
};

const DARK: typeof LIGHT = {
  main: '#3D6A56',
  mainLight: '#5A8672',
  mainText: '#8DB8A2',
  soft: '#17251E',
  bg: '#000000',
  line: 'rgba(84, 84, 88, 0.6)',
  text: '#F5F5F7',
  muted: '#A1A1A6',
  accent: '#E8C677',
  accentDark: '#E8C677',
  heart: '#E8A39E',
  ok: '#9CCBAA',
};

export const WC: typeof LIGHT = live((s) => (s === 'dark' ? DARK : LIGHT));

/** 单词卡本身像一张纸卡片：浅色、深色模式都用浅色（颜色词要显示本色，例如 white 白字描边） */
export const WC_CARD = LIGHT;
