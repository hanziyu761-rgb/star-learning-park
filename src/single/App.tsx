/**
 * 单文件 HTML 版的根组件：不使用地址栏路由，用内存中的页面栈切换页面，
 * 这样直接双击打开 .html 文件（file://）也能正常使用。页面组件与 APP 完全相同。
 */
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavProvider, type Nav, type Route } from '@/nav/Nav';
import { ProgressProvider } from '@/progress/ProgressContext';
import HomeScreen from '@/screens/HomeScreen';
import LessonScreen from '@/screens/LessonScreen';
import ParentScreen from '@/screens/ParentScreen';
import PracticeScreen from '@/screens/PracticeScreen';
import ReviewScreen from '@/screens/ReviewScreen';
import TeacherScreen from '@/screens/TeacherScreen';
import KnowledgeMapScreen from '@/screens/KnowledgeMapScreen';
import DiagnoseScreen from '@/screens/DiagnoseScreen';
import SubjectScreen from '@/screens/SubjectScreen';
import ExamScreen from '@/screens/ExamScreen';
import ChallengeScreen from '@/screens/ChallengeScreen';
import WordCardsScreen from '@/screens/WordCardsScreen';
import GamesScreen from '@/screens/GamesScreen';
import GameScreen from '@/screens/GameScreen';
import MistakesScreen from '@/screens/MistakesScreen';
import TextbooksScreen from '@/screens/TextbooksScreen';
import { SplashGate } from '@/components/SplashGate';
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
    case 'review':
      return <ReviewScreen subject={route.subject} />;
    case 'textbooks':
      return <TextbooksScreen />;
    case 'mistakes':
      return <MistakesScreen subject={route.subject} />;
    case 'practice':
      return <PracticeScreen id={route.id} />;
    case 'teacher':
      return <TeacherScreen />;
    case 'map':
      return <KnowledgeMapScreen />;
    case 'diagnose':
      return <DiagnoseScreen kp={route.kp} />;
    case 'exam':
      return <ExamScreen />;
    case 'challenge':
      return <ChallengeScreen />;
    case 'words':
      return <WordCardsScreen />;
    case 'games':
      return <GamesScreen />;
    case 'game':
      return <GameScreen id={route.id} />;
  }
}

export default function SingleApp() {
  // 每次进入页面给一个新编号：同一个页面“返回再进入”（例如“再来一轮”）也会重新开始
  const serial = useRef(0);
  const [stack, setStack] = useState<{ route: Route; key: number }[]>([{ route: { name: 'home' }, key: 0 }]);
  const nav = useMemo<Nav>(
    () => ({
      push: (r) => setStack((s) => [...s, { route: r, key: ++serial.current }]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      home: () => setStack([{ route: { name: 'home' }, key: ++serial.current }]),
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
            <View key={top.key} style={{ flex: 1, backgroundColor: colors.bg }}>
              {renderRoute(top.route)}
            </View>
            <SplashGate />
          </NavProvider>
        </ProgressProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
