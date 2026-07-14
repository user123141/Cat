// src/context/WindowManagerContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type WindowId = 'cats' | 'shop' | 'quests' | 'analytics' | 'settings' | 'antistress' | 'calendar';

export const Z_LAYERS = {
  BACKGROUND: 0,
  WIDGETS: 10,
  WINDOW_BASE: 20,
  WINDOW_FOCUSED: 40,
  DYNAMIC_ISLAND: 50,
  MODALS: 100,
};

interface WindowManagerContextValue {
  openWindows: WindowId[];
  minimizedWindows: WindowId[];
  activeWindow: WindowId | null;
  focusWindow: (id: WindowId) => void;
  openWindow: (id: WindowId) => void;
  closeWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  toggleWindow: (id: WindowId) => void;
  getZIndex: (id: WindowId) => number;
}

const WindowManagerContext = createContext<WindowManagerContextValue | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openWindows, setOpenWindows] = useState<WindowId[]>(['cats']);
  const [minimizedWindows, setMinimizedWindows] = useState<WindowId[]>([]);
  const [activeWindow, setActiveWindow] = useState<WindowId | null>('cats');
  const [windowOrder, setWindowOrder] = useState<WindowId[]>(['cats']);

  const focusWindow = useCallback((id: WindowId) => {
    setActiveWindow(id);
    setWindowOrder(prev => {
      const filtered = prev.filter(w => w !== id);
      return [...filtered, id];
    });
  }, []);

  const openWindow = useCallback((id: WindowId) => {
    setOpenWindows(prev => prev.includes(id) ? prev : [...prev, id]);
    focusWindow(id);
  }, [focusWindow]);

  const closeWindow = useCallback((id: WindowId) => {
    setOpenWindows(prev => prev.filter(w => w !== id));
    setMinimizedWindows(prev => prev.filter(w => w !== id));
    if (activeWindow === id) {
      const remaining = openWindows.filter(w => w !== id && !minimizedWindows.includes(w));
      if (remaining.length > 0) {
        setActiveWindow(remaining[remaining.length - 1]);
      } else {
        setActiveWindow(null);
      }
    }
  }, [activeWindow, openWindows, minimizedWindows]);

  const minimizeWindow = useCallback((id: WindowId) => {
    setMinimizedWindows(prev => prev.includes(id) ? prev : [...prev, id]);
    if (activeWindow === id) {
      const remaining = openWindows.filter(w => w !== id && !minimizedWindows.includes(w));
      if (remaining.length > 0) {
        setActiveWindow(remaining[remaining.length - 1]);
      } else {
        setActiveWindow(null);
      }
    }
  }, [activeWindow, openWindows, minimizedWindows]);

  const toggleWindow = useCallback((id: WindowId) => {
    if (openWindows.includes(id)) {
      if (minimizedWindows.includes(id)) {
        // Развернуть
        setMinimizedWindows(prev => prev.filter(w => w !== id));
        focusWindow(id);
      } else {
        // Свернуть или закрыть? Обычно свернуть
        minimizeWindow(id);
      }
    } else {
      openWindow(id);
    }
  }, [openWindows, minimizedWindows, openWindow, minimizeWindow, focusWindow]);

  const getZIndex = useCallback((id: WindowId): number => {
    if (activeWindow === id) {
      return Z_LAYERS.WINDOW_FOCUSED;
    }
    const index = windowOrder.indexOf(id);
    if (index === -1) {
      return Z_LAYERS.WINDOW_BASE;
    }
    const maxOrder = Math.max(1, windowOrder.length);
    const orderBonus = Math.floor((index / maxOrder) * 19);
    return Z_LAYERS.WINDOW_BASE + orderBonus;
  }, [activeWindow, windowOrder]);

  return (
    <WindowManagerContext.Provider value={{
      openWindows,
      minimizedWindows,
      activeWindow,
      focusWindow,
      openWindow,
      closeWindow,
      minimizeWindow,
      toggleWindow,
      getZIndex,
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  return context;
};