// src/context/WindowManagerContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type WindowId = 'cats' | 'shop' | 'quests' | 'analytics' | 'settings' | 'antistress' | 'calendar' | 'messenger' | 'wardrobe';

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
  isMinimizing: boolean;
  setIsMinimizing: (val: boolean) => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openWindows, setOpenWindows] = useState<WindowId[]>(['cats']);
  const [minimizedWindows, setMinimizedWindows] = useState<WindowId[]>([]);
  const [activeWindow, setActiveWindow] = useState<WindowId | null>('cats');
  const [windowOrder, setWindowOrder] = useState<WindowId[]>(['cats']);
  const [isMinimizing, setIsMinimizing] = useState(false);

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
      setActiveWindow(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  }, [activeWindow, openWindows, minimizedWindows]);

  const minimizeWindow = useCallback((id: WindowId) => {
    setIsMinimizing(true);
    setMinimizedWindows(prev => prev.includes(id) ? prev : [...prev, id]);
    if (activeWindow === id) {
      const remaining = openWindows.filter(w => w !== id && !minimizedWindows.includes(w));
      setActiveWindow(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
    setTimeout(() => setIsMinimizing(false), 400);
  }, [activeWindow, openWindows, minimizedWindows]);

  const toggleWindow = useCallback((id: WindowId) => {
    if (openWindows.includes(id)) {
      if (minimizedWindows.includes(id)) {
        setMinimizedWindows(prev => prev.filter(w => w !== id));
        focusWindow(id);
      } else {
        minimizeWindow(id);
      }
    } else {
      openWindow(id);
    }
  }, [openWindows, minimizedWindows, openWindow, minimizeWindow, focusWindow]);

  const getZIndex = useCallback((id: WindowId): number => {
    const index = windowOrder.indexOf(id);
    if (index === -1) return 20;
    if (activeWindow === id) return 40 + windowOrder.length;
    return 20 + index;
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
      isMinimizing,
      setIsMinimizing,
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