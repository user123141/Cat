import React, { createContext, useContext, useState } from 'react';

export type WindowId = 'cats' | 'shop' | 'quests' | 'analytics' | 'settings' | 'antistress';

export const Z_LAYERS = {
  BACKGROUND: 0,
  WIDGETS: 10,
  WINDOW_BASE: 20,
  WINDOW_FOCUSED: 40,
  DYNAMIC_ISLAND: 50,
  MODALS: 100,
};

interface ZIndexContextType {
  focusedWindow: string | null;
  focusWindow: (id: string) => void;
  getZIndex: (id: string) => number;
}

const ZIndexContext = createContext<ZIndexContextType | undefined>(undefined);

export const ZIndexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedWindow, setFocusedWindow] = useState<string | null>('cats');
  const [windowOrder, setWindowOrder] = useState<string[]>([]);

  const focusWindow = (id: string) => {
    setFocusedWindow(id);
    setWindowOrder((prev) => {
      const filtered = prev.filter((w) => w !== id);
      return [...filtered, id];
    });
  };

  const getZIndex = (id: string): number => {
    if (focusedWindow === id) {
      return Z_LAYERS.WINDOW_FOCUSED;
    }
    // Interpolate other windows between 20 and 39 based on their order
    const index = windowOrder.indexOf(id);
    if (index === -1) {
      return Z_LAYERS.WINDOW_BASE;
    }
    const maxOrder = Math.max(1, windowOrder.length);
    const orderBonus = Math.floor((index / maxOrder) * 19);
    return Z_LAYERS.WINDOW_BASE + orderBonus;
  };

  return (
    <ZIndexContext.Provider value={{ focusedWindow, focusWindow, getZIndex }}>
      {children}
    </ZIndexContext.Provider>
  );
};

export const useZIndex = () => {
  const context = useContext(ZIndexContext);
  if (!context) {
    throw new Error('useZIndex must be used within a ZIndexProvider');
  }
  return context;
};
