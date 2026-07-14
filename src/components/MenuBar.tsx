// src/components/MenuBar.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile } from '../types';

interface MenuBarProps {
  profile: PlayerProfile | null;
  isOnline: boolean;
  syncing: boolean;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  children?: React.ReactNode;
  onStreakClick?: () => void;
  isAdminMode?: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  profile,
  isOnline,
  syncing,
  onSync,
  onOpenSettings,
  onOpenAbout,
  children,
  onStreakClick,
  isAdminMode,
}) => {
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    if (isOnline !== prevOnline) {
      setShowStatusIndicator(true);
      setPrevOnline(isOnline);
      if (isOnline) {
        const timer = setTimeout(() => setShowStatusIndicator(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, prevOnline]);

  return (
    <div className="fixed top-0 left-0 right-0 h-9 glass-panel border-b border-white/20 dark:border-black/20 flex items-center justify-between px-2.5 z-50 select-none text-[10px] text-slate-800 dark:text-slate-100 font-medium gap-1.5 overflow-visible">
      
      {/* Левая часть */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 shrink-0">
        <span className="text-sm cursor-pointer hover:opacity-75 active:scale-95 transition-all text-slate-900 dark:text-white px-0.5" onClick={onOpenAbout}></span>
        <span className="font-semibold tracking-tight text-slate-950 dark:text-white text-[10px]">MacCat</span>
        <span className="hidden xs:inline px-1 py-0 rounded-md bg-white/40 dark:bg-black/30 border border-white/30 dark:border-white/5 text-[7px] font-mono tracking-wider opacity-80">v1.5</span>
      </div>

      {/* Dynamic Island */}
      {children && (
        <div className="flex-none flex justify-center items-center pointer-events-auto scale-90">
          {children}
        </div>
      )}

      {/* Правая часть */}
      <div className="flex items-center gap-1.5 relative flex-1 justify-end min-w-0 shrink-0 overflow-visible">
        
        <AnimatePresence>
          {(!isOnline || (isOnline && showStatusIndicator)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/10 border border-white/20 dark:border-white/10"
            >
              {isOnline ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[8px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden xs:inline">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[8px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="hidden xs:inline">Offline</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
