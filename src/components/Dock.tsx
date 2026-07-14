// src/components/Dock.tsx
import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Target, Settings, TrendingUp, Sparkles, Cat } from 'lucide-react';

interface DockProps {
  activeWindow: string | null;
  minimizedWindows: string[];
  onOpenWindow: (windowId: string) => void;
}

export const Dock: React.FC<DockProps> = ({ activeWindow, minimizedWindows, onOpenWindow }) => {
  const dockItems = [
    { id: 'cats', label: 'Котята', icon: <Cat size={26} className="text-slate-700 dark:text-slate-300" /> },
    { id: 'antistress', label: 'Антистресс', icon: <Sparkles size={26} className="text-amber-500" /> },
    { id: 'shop', label: 'Магазин', icon: <ShoppingBag size={26} className="text-purple-600 dark:text-purple-400" /> },
    { id: 'quests', label: 'Задания', icon: <Target size={26} className="text-rose-500" /> },
    { id: 'analytics', label: 'Аналитика', icon: <TrendingUp size={26} className="text-emerald-500" /> },
    { id: 'settings', label: 'Настройки', icon: <Settings size={26} className="text-slate-600 dark:text-slate-300" /> },
  ];

  return (
    <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none z-40 select-none px-2">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
        className="pointer-events-auto flex items-end gap-2 md:gap-3.5 px-2 md:px-3 py-2 md:py-3.5 rounded-[20px] md:rounded-[26px] bg-white/25 dark:bg-black/25 backdrop-blur-xl border border-white/30 dark:border-white/15 shadow-lg relative max-w-full overflow-x-auto no-scrollbar"
      >
        {dockItems.map((item) => {
          const isOpen = activeWindow === item.id;
          const isMinimized = minimizedWindows.includes(item.id);

          return (
            <div key={item.id} className="relative group flex flex-col items-center">
              <div className="hidden sm:block absolute -top-10 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-neutral-900/95 dark:bg-neutral-800/95 text-white border border-white/10 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>

              <motion.button
                whileHover={{ scale: 1.2, y: -8 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                onClick={() => onOpenWindow(item.id)}
                className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer relative shadow-md backdrop-blur-md ${
                  isOpen
                    ? 'bg-white/55 dark:bg-black/55 border border-white/50 dark:border-white/20 shadow-lg'
                    : isMinimized
                    ? 'bg-white/20 dark:bg-black/30 border border-amber-500/40 hover:bg-white/35 dark:hover:bg-black/45'
                    : 'bg-white/10 dark:bg-black/20 border border-white/15 dark:border-white/10 hover:bg-white/25 dark:hover:bg-black/35'
                }`}
              >
                {item.icon}
              </motion.button>

              <div className="h-1.5 flex items-center justify-center mt-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isOpen
                      ? 'bg-sky-400 scale-110 shadow-[0_0_8px_#38bdf8]'
                      : isMinimized
                      ? 'bg-amber-400 scale-100 shadow-[0_0_6px_#f59e0b]'
                      : 'bg-transparent scale-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};