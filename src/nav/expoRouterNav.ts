import { router } from 'expo-router';
import type { Nav, Route } from './Nav';

function toHref(route: Route) {
  switch (route.name) {
    case 'home':
      return '/' as const;
    case 'subject':
      return { pathname: '/subject/[subject]' as const, params: { subject: route.subject } };
    case 'lesson':
      return { pathname: '/lesson/[id]' as const, params: route.resume ? { id: route.id, resume: '1' } : { id: route.id } };
    case 'parent':
      return '/parent' as const;
    case 'review':
      return '/review' as const;
    case 'teacher':
      return '/teacher' as const;
    case 'practice':
      return { pathname: '/practice/[id]' as const, params: { id: route.id } };
  }
}

export const expoRouterNav: Nav = {
  push: (route) => router.push(toHref(route)),
  back: () => (router.canGoBack() ? router.back() : router.replace('/')),
  home: () => router.dismissTo('/'),
};
