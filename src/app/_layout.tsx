import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OrientationGate } from '@/components/OrientationGate';
import { SplashGate } from '@/components/SplashGate';
import { NavProvider } from '@/nav/Nav';
import { expoRouterNav } from '@/nav/expoRouterNav';
import { ProgressProvider, useProgress } from '@/progress/ProgressContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <NavProvider nav={expoRouterNav}>
            <AppStack />
            <SplashGate />
          </NavProvider>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** 页面栈：跟着当前配色换底色和状态栏；页面切换用苹果式推入推出（V5.0） */
function AppStack() {
  const { scheme } = useProgress();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <OrientationGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </>
  );
}
