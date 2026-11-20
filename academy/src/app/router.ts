import { useEffect, useState } from 'react';

// Hash routes keep deep links working offline and need no server rewrites.
export type Route =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'grades' }
  | { name: 'map'; grade: number | null }
  | { name: 'lesson'; id: string }
  | { name: 'play'; id: string }
  | { name: 'growth' }
  | { name: 'parent' }
  | { name: 'review'; kps: string[] | null };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case undefined: return { name: 'home' };
    case 'setup': return { name: 'setup' };
    case 'grades': return { name: 'grades' };
    case 'map': return { name: 'map', grade: parts[1] ? Number(parts[1]) || null : null };
    case 'lesson': return parts[1] ? { name: 'lesson', id: parts[1] } : { name: 'home' };
    case 'play': return parts[1] ? { name: 'play', id: parts[1] } : { name: 'home' };
    case 'growth': return { name: 'growth' };
    case 'parent': return { name: 'parent' };
    case 'review': return { name: 'review', kps: parts[1] ? parts[1].split(',').filter(Boolean) : null };
    default: return { name: 'home' };
  }
}

export function go(path: string): void {
  window.location.hash = path.startsWith('#') ? path : '#' + path;
  window.scrollTo?.({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
