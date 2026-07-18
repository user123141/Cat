// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { WindowManagerProvider } from './context/WindowManagerContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Register service worker and request notification permissions
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker зарегистрирован:', reg.scope);
      })
      .catch((err) => {
        console.error('Ошибка регистрации Service Worker:', err);
      });
  });

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('Разрешение на уведомления:', permission);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WindowManagerProvider>
        <App />
      </WindowManagerProvider>
    </ErrorBoundary>
  </StrictMode>
);
