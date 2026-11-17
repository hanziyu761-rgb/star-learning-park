import { router } from 'expo-router';
import type { Nav, Route } from './Nav';

function toHref(route: Route) {
  switch (route.name) {
    case 'home':
      return '/' as const;
    case 'subject':
      return { pathname: '/subject/[subject]' as const, params: { subject: route.subject } };
    case 'lesson':
      return {
        pathname: '/lesson/[id]' as const,
        params: route.resume ? { id: route.id, resume: '1' } : { id: route.id },
      };
    case 'parent':
      return '/parent' as const;
    case 'review':
      return route.subject
        ? { pathname: '/review' as const, params: route.grade ? { subject: route.subject, grade: String(route.grade) } : { subject: route.subject } }
        : ('/review' as const);
    case 'textbooks':
      return '/textbooks' as const;
    case 'mistakes':
      return { pathname: '/mistakes/[subject]' as const, params: { subject: route.subject } };
    case 'map':
      return '/map' as const;
    case 'diagnose':
      return { pathname: '/diagnose/[kp]' as const, params: { kp: route.kp } };
    case 'teacher':
      return '/teacher' as const;
    case 'exam':
      return '/exam' as const;
    case 'photo':
      return '/photo' as const;
    case 'challenge':
      return '/challenge' as const;
    case 'words':
      return '/words' as const;
    case 'games':
      return '/games' as const;
    case 'game':
      return { pathname: '/game/[id]' as const, params: { id: route.id } };
    case 'practice':
      return { pathname: '/practice/[id]' as const, params: { id: route.id } };
  }
}

export const expoRouterNav: Nav = {
  push: (route) => router.push(toHref(route)),
  back: () => (router.canGoBack() ? router.back() : router.replace('/')),
  home: () => router.dismissTo('/'),
};
