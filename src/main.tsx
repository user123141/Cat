// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { WindowManagerProvider } from './context/WindowManagerContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WindowManagerProvider>
        <App />
      </WindowManagerProvider>
    </ErrorBoundary>
  </StrictMode>
);