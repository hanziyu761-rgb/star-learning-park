/**
 * 统一视觉规范（V5.0，参照苹果 Human Interface Guidelines）：颜色、字号、圆角、阴影、间距、动效。
 * 所有页面和组件只从这里取值，保持风格一致。
 *
 * 浅色 / 深色模式：
 * - `colors`、`subjectTheme`、`shadow` 的每个值都是“现在的配色”（读取时才取值），
 *   所以页面里写 `colors.text` 不用改，切换深色后重新渲染就会拿到深色值。
 * - 样式表用 `themed(() => StyleSheet.create({...}))` 包一层：每种配色只生成一次，按当前配色取用。
 * - 当前配色由 ProgressProvider 根据“家长设置 → 外观”和手机系统设置决定（setScheme）。
 *
 * 色彩：莫兰迪柔和色。浅色模式乳白底、白色卡片；深色模式纯黑底（OLED 省电）、极深灰卡片。
 * 文字对比度：正文 ≥ 15:1；彩色文字在卡片上 ≥ 4.5:1（脚本 tools/design/contrast.py 可复查）。
 */
import type { Subject } from '@/lesson/types';

export type Scheme = 'light' | 'dark';
let current: Scheme = 'light';

/** 设置当前配色（只由 ProgressProvider / 测试调用） */
export function setScheme(s: Scheme) {
  current = s;
}
export const getScheme = (): Scheme => current;

const LIGHT = {
  /** 页面底色：乳白 */
  bg: '#F5F3EF',
  /** 提示条等浅色底（原来的天蓝） */
  bgSky: '#EAEEF3',
  /** 卡片、按钮底 */
  card: '#FFFFFF',
  /** 卡片里的分组底、未选中选项 */
  cardAlt: '#F0EDE8',
  text: '#1D1D1F',
  textSoft: '#6B6B70',
  textFaint: '#A1A1A6',
  line: 'rgba(60, 60, 67, 0.12)',
  primary: '#A65F47',
  primarySoft: '#F3E6E0',
  star: '#D9A441',
  starDeep: '#8F6B1E',
  correct: '#4A7F5B',
  correctSoft: '#E5EFE7',
  wrong: '#AD5A56',
  wrongSoft: '#F5E5E3',
  disabled: '#D8D4CD',
  parent: '#6E6AA8',
  parentSoft: '#E9E8F3',
  /** 选中、链接用的雾蓝 */
  blue: '#4A76A0',
  blueSoft: '#E4EBF2',
  /** 提醒、待办用的焦糖橙 */
  orange: '#9A6328',
  orangeSoft: '#F5EBDD',
  /** 拖放目标、高亮格子的淡黄 */
  highlight: '#F6EDD3',
  /** 彩色按钮上的文字 */
  onAccent: '#FFFFFF',
  /** 毛玻璃底色（安卓没有实时模糊时也用它） */
  glass: 'rgba(250, 249, 246, 0.78)',
  /** 遮罩 */
  scrim: 'rgba(20, 20, 24, 0.32)',
};

const DARK: typeof LIGHT = {
  bg: '#000000',
  bgSky: '#1A1F26',
  card: '#1C1C1E',
  cardAlt: '#2C2C2E',
  text: '#F5F5F7',
  textSoft: '#A1A1A6',
  textFaint: '#636366',
  line: 'rgba(84, 84, 88, 0.6)',
  primary: '#E8A58C',
  primarySoft: '#3A2620',
  star: '#E8C677',
  starDeep: '#E8C677',
  correct: '#9CCBAA',
  correctSoft: '#1D2B22',
  wrong: '#E8A39E',
  wrongSoft: '#33201F',
  disabled: '#3A3A3C',
  parent: '#B9B5E6',
  parentSoft: '#25243A',
  blue: '#9DBEDD',
  blueSoft: '#1B2631',
  orange: '#E6B07A',
  orangeSoft: '#33261A',
  highlight: '#3A3220',
  onAccent: '#000000',
  glass: 'rgba(28, 28, 30, 0.72)',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

export type Palette = typeof LIGHT;

type SubjectStyle = { name: string; nameEn: string; color: string; soft: string; emoji: string };
const SUBJECTS_LIGHT: Record<Subject, SubjectStyle> = {
  math: { name: '数学', nameEn: 'Math', color: '#4A76A0', soft: '#E4EBF2', emoji: '🔢' },
  chinese: { name: '语文', nameEn: 'Chinese', color: '#AD5A56', soft: '#F4E5E3', emoji: '📖' },
  english: { name: '英语', nameEn: 'English', color: '#4E7D5F', soft: '#E3EDE6', emoji: '🔤' },
};
const SUBJECTS_DARK: Record<Subject, SubjectStyle> = {
  math: { ...SUBJECTS_LIGHT.math, color: '#9DBEDD', soft: '#1B2631' },
  chinese: { ...SUBJECTS_LIGHT.chinese, color: '#E5A6A1', soft: '#2E1F1E' },
  english: { ...SUBJECTS_LIGHT.english, color: '#A6CDB2', soft: '#1B2A21' },
};

/** 把“按配色取值”的表变成普通对象：每个属性读取时才按当前配色取值 */
export function live<T extends object>(pick: (s: Scheme) => T): T {
  const out = {} as T;
  for (const k of Object.keys(pick('light')) as (keyof T)[]) {
    Object.defineProperty(out, k, { enumerable: true, get: () => pick(current)[k] });
  }
  return out;
}

export const colors: Palette = live((s) => (s === 'dark' ? DARK : LIGHT));
export const subjectTheme: Record<Subject, SubjectStyle> = live((s) => (s === 'dark' ? SUBJECTS_DARK : SUBJECTS_LIGHT));

/** 直接取某种配色（截图、测试、对比度检查用） */
export const palettes: Record<Scheme, Palette> = { light: LIGHT, dark: DARK };

/**
 * 按配色生成样式表：每种配色只生成一次；`styles.xxx` 读取时按当前配色取。
 * 用法：`const styles = themed(() => StyleSheet.create({ ... }));`
 */
export function themed<T extends object>(factory: () => T): T {
  const cache: Partial<Record<Scheme, T>> = {};
  const get = (): T => (cache[current] ??= factory());
  return new Proxy({} as T, {
    get: (_t, k) => (get() as Record<string | symbol, unknown>)[k],
    has: (_t, k) => k in get(),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_t, k) => {
      const d = Object.getOwnPropertyDescriptor(get(), k);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

/** 苹果式大圆角：卡片 24 起 */
export const radius = { sm: 16, md: 24, lg: 32, xl: 40, round: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const font = {
  /** 儿童阅读主文字 */
  child: 28,
  childLarge: 40,
  title: 26,
  body: 18,
  small: 14,
  pinyin: 15,
};

/**
 * 字号层级（参照苹果“动态字体”）：标题粗体，正文常规。
 * 系统字体：苹果手机上是 San Francisco / 苹方，安卓上是系统中文字体。
 */
export const type = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.2 },
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 22, fontWeight: '700' as const },
  title3: { fontSize: 20, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  callout: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};

/** 儿童可点击区域的最小尺寸（苹果要求 44，儿童用 64） */
export const MIN_TOUCH = 64;

/** 柔和悬浮阴影：浅色模式用淡淡的暖灰投影；深色模式黑底上看不见阴影，改用一圈细亮边 */
export const shadow = live((s) =>
  s === 'dark'
    ? { boxShadow: '0px 0px 0px 1px rgba(255, 255, 255, 0.07)' }
    : { boxShadow: '0px 1px 2px rgba(60, 50, 40, 0.04), 0px 8px 24px rgba(60, 50, 40, 0.07)' },
);

/** 弹簧动效参数（reanimated withSpring） */
export const spring = {
  /** 按下：快速、不回弹 */
  press: { damping: 18, stiffness: 420, mass: 0.6 },
  /** 松开：轻微回弹 */
  release: { damping: 9, stiffness: 260, mass: 0.6 },
  /** 答对：弹一下 */
  pop: { damping: 7, stiffness: 220, mass: 0.6 },
};
