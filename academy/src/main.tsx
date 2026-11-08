import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// The academy's own service worker, scoped to /academy/ only, so the legacy
// app's worker (scope /) keeps handling everything else.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/academy/sw.js', { scope: '/academy/' }).catch(() => undefined);
  });
}
