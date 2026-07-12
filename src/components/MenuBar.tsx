import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw, Moon, Sun, Info } from 'lucide-react';
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
}

export const MenuBar: React.FC<MenuBarProps> = ({
  profile,
  isOnline,
  syncing,
  onSync,
  onOpenSettings,
  onOpenAbout,
  children,
}) => {
  const [time, setTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  // Monitor network status transition
  useEffect(() => {
    if (isOnline !== prevOnline) {
      setShowStatusIndicator(true);
      setPrevOnline(isOnline);
      if (isOnline) {
        const timer = setTimeout(() => {
          setShowStatusIndicator(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, prevOnline]);

  // Battery detection
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('levelchange', updateBattery);
        return () => {
          battery.removeEventListener('chargingchange', updateBattery);
          battery.removeEventListener('levelchange', updateBattery);
        };
      }).catch(() => {
        setBatteryLevel(88);
        setIsCharging(false);
      });
    } else {
      setBatteryLevel(88);
      setIsCharging(false);
    }
  }, []);

  // Calculate seconds until midnight
  const getSecondsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // 00:00 of the next day
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calendar logic
  const year = time.getFullYear();
  const month = time.getMonth();
  const currentDay = time.getDate();

  // Day index of first day of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust Monday as start of week index (0 = Mon, 1 = Tue, ..., 6 = Sun)
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Total days in the current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  const questsTotal = profile?.quests?.length || 0;
  const questsCompleted = profile?.quests?.filter((q) => q.completed).length || 0;

  return (
    <div className="fixed top-0 left-0 right-0 h-10 glass-panel border-b border-white/20 dark:border-black/20 flex items-center justify-between px-2 md:px-4 z-50 select-none text-xs text-slate-800 dark:text-slate-100 font-medium gap-2 overflow-visible">
      {/* Left side: Apple Menu & App Title */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 shrink-0">
        <span 
          className="text-sm cursor-pointer hover:opacity-75 active:scale-95 transition-all text-slate-900 dark:text-white"
          onClick={onOpenAbout}
          title="О проекте"
        >
          
        </span>
        <div className="flex items-center gap-1">
          <span className="font-semibold tracking-tight text-slate-950 dark:text-white">MacCat</span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-white/40 dark:bg-black/30 border border-white/30 dark:border-white/5 text-[9px] font-mono tracking-wider opacity-90">
            v1.5
          </span>
        </div>

        {profile && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[9px] sm:text-[10px] shadow-sm cursor-pointer hover:bg-rose-500/15 transition-all" title="Серия дней заботы 🔥">
            <span>🔥</span>
            <span className="max-sm:hidden">{profile.streak || 1} {profile.streak === 1 ? 'день' : [2,3,4].includes((profile.streak || 1) % 10) && ![11,12,13,14].includes((profile.streak || 1) % 100) ? 'дня' : 'дней'}</span>
            <span className="sm:hidden">{profile.streak || 1}д</span>
          </div>
        )}
        
        {/* Author design tag */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="text-[10px]">|</span>
          <span className="text-[10px] tracking-wide">Дизайн:</span>
          <span 
            className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 cursor-pointer hover:underline"
            onClick={onOpenAbout}
          >
            Maksym Skorina
          </span>
        </div>
      </div>

      {/* Middle side: Dynamic Island children slot */}
      {children && (
        <div className="flex-none flex justify-center items-center pointer-events-auto">
          {children}
        </div>
      )}

      {/* Right side: Indicators, Sync and Dynamic Date/Time */}
      <div className="flex items-center gap-2 md:gap-4 relative flex-1 justify-end min-w-0 shrink-0 overflow-visible">
        {/* Network & Save Indicator */}
        <AnimatePresence>
          {(!isOnline || (isOnline && showStatusIndicator)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/10 border border-white/20 dark:border-white/5 max-sm:scale-90"
            >
              {isOnline ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] sm:text-[10px]" title="Подключено к сети">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="max-xs:hidden">ONLINE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[9px] sm:text-[10px]" title="Оффлайн режим">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse absolute"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 relative"></span>
                  <span className="max-xs:hidden">OFFLINE</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Battery Widget */}
        {batteryLevel !== null && (
          <div className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono cursor-default select-none shrink-0" title={`Батарея: ${batteryLevel}% ${isCharging ? '(Зарядка)' : ''}`}>
            <span className="text-[10px] hidden xs:inline">{batteryLevel}%</span>
            <div className="relative w-[22px] h-[11.5px] border-[1.2px] border-slate-500 dark:border-slate-400 rounded-[3px] p-[1px] flex items-center bg-black/5 dark:bg-white/5">
              <div 
                className={`h-full rounded-[1px] transition-all duration-500 ${
                  isCharging 
                    ? 'bg-[#34C759]' 
                    : batteryLevel < 20 
                      ? 'bg-[#FF3B30]' 
                      : batteryLevel < 40 
                        ? 'bg-[#FF9500]' 
                        : 'bg-slate-700 dark:bg-slate-200'
                }`} 
                style={{ width: `${Math.max(10, batteryLevel)}%` }}
              />
              <div className="absolute -right-[2.5px] top-[2.2px] w-[1.2px] h-[4.5px] bg-slate-500 dark:bg-slate-400 rounded-r-[0.8px]" />
              {isCharging && (
                <svg
                  viewBox="0 0 10 10"
                  className="absolute inset-0 m-auto w-[8px] h-[8px] text-slate-900 dark:text-white fill-current drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.4)] dark:drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.6)] animate-pulse"
                >
                  <path d="M5.5 1L2 5.5h3L4.5 9 8 4.5H5z" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Sync trigger button */}
        {profile && (
          <button
            onClick={onSync}
            disabled={syncing}
            className={`flex items-center gap-1 hover:bg-white/30 dark:hover:bg-white/10 px-2 py-1 rounded-md transition-all active:scale-95 ${
              syncing ? 'opacity-80' : ''
            }`}
            title="Облачная синхронизация"
          >
            <Cloud size={12} className={syncing ? 'text-sky-500' : ''} />
            <RefreshCw
              size={11}
              className={`transition-transform duration-1000 ${syncing ? 'animate-spin text-sky-500' : ''}`}
            />
            <span className="hidden sm:inline text-[10px] text-slate-600 dark:text-slate-300">
              {syncing ? 'Синхронизация...' : 'Облако'}
            </span>
          </button>
        )}

        {/* Divider */}
        <span className="text-slate-300 dark:text-slate-700">|</span>

        {/* Live Calendar (Clickable Trigger without redundant time) */}
        <div 
          onClick={() => {
            triggerHaptic();
            setIsCalendarOpen(!isCalendarOpen);
          }}
          className={`flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-white/20 dark:hover:bg-white/10 px-2.5 py-1 rounded-md transition-all active:scale-95 ${
            isCalendarOpen ? 'bg-white/30 dark:bg-white/10 text-slate-950 dark:text-white' : ''
          }`}
          title="Открыть интерактивный календарь"
        >
          <span>{formatDate(time)}</span>
        </div>

        {/* Invisible backdrop to close calendar when clicking outside */}
        {isCalendarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-transparent cursor-default" 
            onClick={() => setIsCalendarOpen(false)} 
          />
        )}

        {/* macOS Style Calendar Widget Dropdown */}
        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="absolute right-0 top-8 w-[280px] rounded-2xl bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-100 font-sans pointer-events-auto mt-1"
            >
              {/* Red macOS style bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 rounded-t-2xl" />

              {/* Month Header */}
              <div className="flex justify-between items-center mb-3 pt-1">
                <div>
                  <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest text-left">
                    {time.toLocaleString('ru-RU', { month: 'long' })}
                  </h3>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono text-left leading-none">
                    {time.getFullYear()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                    {time.getDate()}
                  </span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold mb-3 border-b border-slate-100 dark:border-white/5 pb-3">
                {/* Weekday labels */}
                {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day) => (
                  <span key={day} className="text-slate-400 dark:text-slate-500 font-mono py-0.5">
                    {day}
                  </span>
                ))}

                {/* Blank days before start of month */}
                {Array.from({ length: adjustedFirstDayIndex }).map((_, i) => (
                  <span key={`empty-${i}`} />
                ))}

                {/* Month Days */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === currentDay;
                  return (
                    <span
                      key={`day-${dayNum}`}
                      className={`h-5 w-5 flex items-center justify-center rounded-full mx-auto font-mono text-[9px] ${
                        isToday
                          ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                  );
                })}
              </div>

              {/* Daily Quests Status Panel */}
              <div className="space-y-2.5 text-left">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold uppercase font-mono">Ежедневные квесты</span>
                  {questsTotal > 0 ? (
                    <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-[9px]">
                      {questsCompleted} / {questsTotal}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[9px]">Загрузка...</span>
                  )}
                </div>

                {/* Progress bar */}
                {questsTotal > 0 && (
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(questsCompleted / questsTotal) * 100}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    />
                  </div>
                )}

                {/* Countdown display */}
                <div className="flex items-center gap-1.5 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/15 p-2 rounded-xl text-[10px] justify-between font-mono">
                  <span className="text-rose-500 dark:text-rose-400 font-bold uppercase text-[8px] tracking-wider shrink-0">
                    СБРОС ЧЕРЕЗ:
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-black text-[11px] tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-md">
                    {formatSeconds(timeLeft)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
