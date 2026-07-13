import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile } from '../types';
import { triggerHaptic } from '../utils/audio';

interface MenuBarProps {
  profile: PlayerProfile | null;
  isOnline: boolean;
  syncing: boolean;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  children?: React.ReactNode;
  onCreatorClick?: () => void;
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
  onCreatorClick,
  isAdminMode,
}) => {
  const [time, setTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
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

  const getSecondsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      setTimeLeft(getSecondsUntilMidnight());
    }, 1000);
    setTimeLeft(getSecondsUntilMidnight());
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => date.toLocaleDateString('ru-RU', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const year = time.getFullYear();
  const month = time.getMonth();
  const currentDay = time.getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  const questsTotal = profile?.quests?.length || 0;
  const questsCompleted = profile?.quests?.filter((q) => q.completed).length || 0;

  return (
    <div className="fixed top-0 left-0 right-0 h-9 glass-panel border-b border-white/20 dark:border-black/20 flex items-center justify-between px-1 md:px-2 z-50 select-none text-[10px] text-slate-800 dark:text-slate-100 font-medium gap-0.5 md:gap-1.5 overflow-visible">
      
      {/* Левая часть */}
      <div className="flex items-center gap-0.5 md:gap-1.5 flex-1 min-w-0 shrink-0">
        <span className="text-sm cursor-pointer hover:opacity-75 active:scale-95 transition-all text-slate-900 dark:text-white px-0.5" onClick={onOpenAbout}></span>
        <span className="font-semibold tracking-tight text-slate-950 dark:text-white text-[10px]">MacCat</span>
        <span className="hidden sm:inline px-1 py-0 rounded-md bg-white/40 dark:bg-black/30 border border-white/30 dark:border-white/5 text-[7px] font-mono tracking-wider opacity-80">v1.5</span>
        
        {/* Имя создателя – теперь видно всегда (скрыто только на очень маленьких экранах) */}
        <span
          onClick={onCreatorClick}
          className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-sky-500 transition-colors px-1 py-0.5 rounded-md hover:bg-white/10 whitespace-nowrap"
          title="Тройной клик для входа в админ-панель"
        >
          Maksym Skorina
          {isAdminMode && <span className="ml-1 text-amber-400">👑</span>}
        </span>

        {profile && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-rose-500/20 dark:bg-rose-500/30 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-[8px] sm:text-[9px] shadow-sm cursor-default">
            <Flame size={10} className="text-rose-600 dark:text-rose-400" />
            <span>{profile.streak || 1}</span>
          </div>
        )}
      </div>

      {/* Dynamic Island */}
      {children && (
        <div className="flex-none flex justify-center items-center pointer-events-auto scale-90">
          {children}
        </div>
      )}

      {/* Правая часть */}
      <div className="flex items-center gap-0.5 md:gap-1.5 relative flex-1 justify-end min-w-0 shrink-0 overflow-visible">
        
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

        <div 
          onClick={() => { triggerHaptic(); setIsCalendarOpen(!isCalendarOpen); }}
          className={`flex items-center gap-0.5 font-mono text-[9px] sm:text-[10px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-white/20 dark:hover:bg-white/10 px-1.5 py-0.5 rounded transition-all active:scale-95 min-h-6 ${
            isCalendarOpen ? 'bg-white/30 dark:bg-white/10 text-slate-950 dark:text-white' : ''
          }`}
        >
          <span>{formatDate(time)}</span>
        </div>

        {isCalendarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setIsCalendarOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="absolute right-0 top-8 w-[240px] rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl p-3 z-50 text-slate-800 dark:text-slate-100 font-sans pointer-events-auto mt-0.5"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 rounded-t-2xl" />
              <div className="flex justify-between items-center mb-2 pt-1">
                <div>
                  <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-left">{time.toLocaleString('ru-RU', { month: 'long' })}</h3>
                  <p className="text-[7px] text-slate-400 dark:text-slate-500 font-mono text-left leading-none">{time.getFullYear()}</p>
                </div>
                <div className="text-right"><span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">{time.getDate()}</span></div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-bold mb-2 border-b border-slate-100 dark:border-white/5 pb-2">
                {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(day => <span key={day} className="text-slate-400 dark:text-slate-500 font-mono py-0.5">{day}</span>)}
                {Array.from({ length: adjustedFirstDayIndex }).map((_, i) => <span key={`empty-${i}`} />)}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === currentDay;
                  return (
                    <span key={`day-${dayNum}`} className={`h-4 w-4 flex items-center justify-center rounded-full mx-auto font-mono text-[7px] ${
                      isToday ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}>{dayNum}</span>
                  );
                })}
              </div>
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-[8px]">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase font-mono">Квесты</span>
                  {questsTotal > 0 ? (
                    <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-1.5 py-0 rounded-full text-[7px]">{questsCompleted} / {questsTotal}</span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[7px]">...</span>
                  )}
                </div>
                {questsTotal > 0 && (
                  <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(questsCompleted / questsTotal) * 100}%` }} className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                  </div>
                )}
                <div className="flex items-center gap-0.5 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/15 p-1 rounded-lg text-[8px] justify-between font-mono">
                  <span className="text-rose-500 dark:text-rose-400 font-bold uppercase text-[6px] tracking-wider shrink-0">СБРОС</span>
                  <span className="text-rose-600 dark:text-rose-400 font-black text-[9px] tracking-widest bg-rose-500/10 px-1 py-0 rounded">{formatSeconds(timeLeft)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};