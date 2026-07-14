// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { WindowManagerProvider } from './context/WindowManagerContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WindowManagerProvider>
      <App />
    </WindowManagerProvider>
  </StrictMode>
);