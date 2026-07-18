// src/components/MenuBar.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile } from '../types';
import { RefreshCw, Flame } from 'lucide-react';

interface MenuBarProps {
  profile: PlayerProfile | null;
  isOnline: boolean;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onAppleClick: () => void;
  children?: React.ReactNode;
  onStreakClick?: () => void;
  isAdminMode?: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  profile,
  isOnline,
  onOpenSettings,
  onOpenAbout,
  onAppleClick,
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
        <span 
          className="text-sm cursor-pointer hover:opacity-75 active:scale-95 transition-all text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md hover:bg-white/10 dark:hover:bg-black/10 font-bold" 
          onClick={onAppleClick}
          title="Панель администратора"
        >
          
        </span>

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

      {/* Правая часть: пустая/чистая */}
      <div className="flex items-center gap-1.5 relative flex-1 justify-end min-w-0 shrink-0 overflow-visible">
      </div>
    </div>
  );
};