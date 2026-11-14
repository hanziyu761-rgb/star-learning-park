/**
 * 毛玻璃层（V5.0）：顶部导航栏、弹出面板用。
 * - 苹果手机、网页：系统实时模糊（expo-blur）。
 * - 安卓：见 Glass.android.tsx（半透明底，不用实时模糊）。
 */
import { BlurView } from 'expo-blur';
import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { getScheme } from '@/theme';

export function Glass({
  children,
  style,
  intensity = 70,
  testID,
  pointerEvents,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  testID?: string;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}) {
  return (
    <BlurView
      intensity={intensity}
      tint={getScheme() === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      style={style}
      testID={testID}
      pointerEvents={pointerEvents}
    >
      {children}
    </BlurView>
  );
}
