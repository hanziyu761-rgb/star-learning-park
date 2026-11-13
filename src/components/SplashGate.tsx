/**
 * 开机动画的开关（V2.21）：每次打开 APP 只放一次；家长中心关掉后不放。
 * 读取学习记录（里面有家长设置）期间先显示同样颜色的底色，避免闪一下首页。
 */
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useProgress } from '@/progress/ProgressContext';
import { SplashIntro } from './SplashIntro';
import { colors, themed } from '@/theme';

/**
 * 网页自动化测试（navigator.webdriver 为真）里默认不放动画，免得挡住其他测试的点击；地址加 ?splash=1 时照常播放（测动画本身）。
 * 真实用户的浏览器和手机 APP 不受影响。
 */
function automated(): boolean {
  const g = globalThis as { navigator?: { webdriver?: boolean }; location?: { search?: string } };
  return !!g.navigator?.webdriver && !(g.location?.search ?? '').includes('splash=1');
}

let shownThisLaunch = Platform.OS === 'web' && automated();

export function SplashGate() {
  const { status, state } = useProgress();
  const [done, setDone] = useState(shownThisLaunch);
  const off = status !== 'loading' && !state.settings.splash;
  // 家长关掉了动画：这次打开就算放过了（之后再打开开关也不会在用的过程中突然播放）
  useEffect(() => {
    if (off) shownThisLaunch = true;
  }, [off]);
  if (done || shownThisLaunch) return null;
  if (status === 'loading') return <View style={[StyleSheet.absoluteFill, styles.cover]} testID="splash-cover" />;
  if (off) return null;
  return (
    <SplashIntro
      onDone={() => {
        shownThisLaunch = true;
        setDone(true);
      }}
    />
  );
}

const styles = themed(() => StyleSheet.create({ cover: { backgroundColor: colors.bg, zIndex: 1000, elevation: 1000 } }));
