/**
 * 毛玻璃层（V5.0）：顶部导航栏、弹出面板用。
 * - 苹果手机、网页：系统实时模糊（expo-blur）。
 * - 安卓：半透明乳白 / 深灰底。安卓实时模糊在旧手机上很耗电、容易卡，这里不用。
 */
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, getScheme } from '@/theme';

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
  if (Platform.OS === 'android') {
    return (
      <View style={[{ backgroundColor: colors.glass }, style]} testID={testID} pointerEvents={pointerEvents}>
        {children}
      </View>
    );
  }
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
