import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ZIndexProvider } from './context/ZIndexContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ZIndexProvider>
      <App />
    </ZIndexProvider>
  </StrictMode>,
);
