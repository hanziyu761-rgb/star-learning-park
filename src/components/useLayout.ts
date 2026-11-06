/**
 * 平板与横屏适配（V2.20）：
 * - 短边 ≥ 600 算平板：字和按钮整体放大一档（k = 1.25），手机 k = 1
 * - 横屏且宽度 ≥ 900：单词卡、游戏改成左右两栏（wide）
 */
import { useWindowDimensions } from 'react-native';

export const TABLET_MIN_SIDE = 600;

export function layoutFor(width: number, height: number) {
  const tablet = Math.min(width, height) >= TABLET_MIN_SIDE;
  const landscape = width > height;
  return { width, height, tablet, landscape, wide: landscape && width >= 900, k: tablet ? 1.25 : 1 };
}
export type Layout = ReturnType<typeof layoutFor>;

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  return layoutFor(width, height);
}
