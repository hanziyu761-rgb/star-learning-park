/**
 * 毛玻璃层（安卓版，V5.0）：半透明乳白 / 深灰底，不做实时模糊。
 * 安卓实时模糊在旧手机上耗电、容易卡；模糊组件依赖的库也不打包进安卓版（package.json 的 autolinking 排除了 expo-blur）。
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

export function Glass({
  children,
  style,
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
    <View style={[{ backgroundColor: colors.glass }, style]} testID={testID} pointerEvents={pointerEvents}>
      {children}
    </View>
  );
}
