/**
 * 屏幕方向（V2.20）：手机锁定竖屏（布局按竖屏设计）；平板可以竖着用也可以横着用（孩子常横着拿平板）。
 * 网页版和单文件 HTML 版不处理方向。
 */
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { TABLET_MIN_SIDE } from './useLayout';

export function OrientationGate() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const { width, height } = Dimensions.get('screen');
    const tablet = Math.min(width, height) >= TABLET_MIN_SIDE;
    (tablet ? ScreenOrientation.unlockAsync() : ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)).catch(
      () => undefined,
    );
  }, []);
  return null;
}
