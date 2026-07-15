// src/components/MenuBar.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile } from '../types';
import { RefreshCw, Flame } from 'lucide-react';

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
  const [streak, setStreak] = useState(profile?.streak || 1);

  useEffect(() => {
    if (profile) {
      setStreak(profile.streak || 1);
    }
  }, [profile]);

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
        
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all active:scale-95 disabled:opacity-50"
          title={syncing ? 'Синхронизация...' : 'Синхронизировать прогресс'}
        >
          <RefreshCw size={12} className={`${syncing ? 'animate-spin' : ''} text-slate-600 dark:text-slate-300`} />
          <span className="text-[8px] font-mono font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
            {syncing ? 'Синхр...' : 'Синхр.'}
          </span>
        </button>

        <button
          onClick={onStreakClick}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95"
        >
          <Flame size={12} className="text-rose-500 animate-pulse" />
          <span className="text-[9px] font-black text-rose-500 font-mono">{streak}</span>
        </button>
      </div>

      {/* Центр: Dynamic Island */}
      {children && (
        <div className="flex-none flex justify-center items-center pointer-events-auto">
          {children}
        </div>
      )}

      {/* Правая часть: статус сети */}
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