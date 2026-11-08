import { useEffect } from 'react';
import { AppProvider, useApp } from './app/state';
import { go, useRoute } from './app/router';
import { Setup } from './pages/Setup';
import { Home } from './pages/Home';
import { CourseMap, Grades } from './pages/CourseMap';
import { LessonDetail } from './pages/LessonDetail';
import { Player } from './pages/Player';
import { Growth } from './pages/Growth';
import { Parent } from './pages/Parent';

function Routes() {
  const route = useRoute();
  const { ready, learner, error } = useApp();
  const needsSetup = ready && !error && !learner && route.name !== 'setup';
  useEffect(() => { if (needsSetup) go('/setup'); }, [needsSetup]);

  if (!ready) return <div className="loading">🤖 正在打开 AI 少年学院…</div>;
  if (error) return <div className="shell"><main className="content"><p className="error" role="alert">{error}</p><a href="/">回到星星闯关乐园</a></main></div>;
  if (route.name === 'setup') return <Setup />;
  if (!learner) return null;
  switch (route.name) {
    case 'home': return <Home />;
    case 'grades': return <Grades />;
    case 'map': return <CourseMap grade={route.grade} />;
    case 'lesson': return <LessonDetail id={route.id} />;
    case 'play': return <Player key={route.id} id={route.id} />;
    case 'growth': return <Growth />;
    case 'parent': return <Parent />;
  }
}

export function App() {
  return <AppProvider><Routes /></AppProvider>;
}
