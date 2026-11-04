/**
 * 单文件 HTML 版的根组件：不使用地址栏路由，用内存中的页面栈切换页面，
 * 这样直接双击打开 .html 文件（file://）也能正常使用。页面组件与 APP 完全相同。
 */
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavProvider, type Nav, type Route } from '@/nav/Nav';
import { ProgressProvider } from '@/progress/ProgressContext';
import HomeScreen from '@/screens/HomeScreen';
import LessonScreen from '@/screens/LessonScreen';
import ParentScreen from '@/screens/ParentScreen';
import SubjectScreen from '@/screens/SubjectScreen';
import { colors } from '@/theme';

function renderRoute(route: Route) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'subject':
      return <SubjectScreen subject={route.subject} />;
    case 'lesson':
      return <LessonScreen id={route.id} resume={!!route.resume} />;
    case 'parent':
      return <ParentScreen />;
  }
}

export default function SingleApp() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const nav = useMemo<Nav>(
    () => ({
      push: (r) => setStack((s) => [...s, r]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      home: () => setStack([{ name: 'home' }]),
    }),
    [],
  );
  const top = stack[stack.length - 1];
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgressProvider>
          <NavProvider nav={nav}>
            <StatusBar style="dark" />
            <View key={stack.length + top.name} style={{ flex: 1, backgroundColor: colors.bg }}>
              {renderRoute(top)}
            </View>
          </NavProvider>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
