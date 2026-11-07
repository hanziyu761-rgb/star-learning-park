import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OrientationGate } from '@/components/OrientationGate';
import { SplashGate } from '@/components/SplashGate';
import { NavProvider } from '@/nav/Nav';
import { expoRouterNav } from '@/nav/expoRouterNav';
import { ProgressProvider } from '@/progress/ProgressContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <NavProvider nav={expoRouterNav}>
            <StatusBar style="dark" />
            <OrientationGate />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }} />
            <SplashGate />
          </NavProvider>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
