import React from 'react';
import { motion } from 'motion/react';
import { Cat, DailyQuest, PlayerProfile } from '../types';
import { Sparkles, Activity, Target, Flame, Heart, Droplets, Bed } from 'lucide-react';

interface SwiftUIWidgetsProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  onInteract: (action: 'feed' | 'play' | 'clean' | 'sleep') => void;
  onOpenWindow: (windowId: string) => void;
}

export const SwiftUIWidgets: React.FC<SwiftUIWidgetsProps> = ({
  profile,
  activeCat,
  onInteract,
  onOpenWindow,
}) => {
  if (!profile || !activeCat) return null;

  // Calculate Quest progress
  const completedQuests = profile.quests.filter((q) => q.completed).length;
  const totalQuests = profile.quests.length;

  const getStatusColor = (val: number) => {
    if (val < 30) return 'stroke-rose-500';
    if (val < 65) return 'stroke-amber-500';
    return 'stroke-emerald-500';
  };

  const getStatusBgColor = (val: number) => {
    if (val < 30) return 'bg-rose-500/10 text-rose-500';
    if (val < 65) return 'bg-amber-500/10 text-amber-500';
    return 'bg-emerald-500/10 text-emerald-500';
  };

  return (
    <div className="absolute top-16 left-6 right-6 bottom-28 pointer-events-none z-10 flex flex-col md:flex-row flex-wrap gap-6 items-start content-start select-none">
      {/* 1. Medium Widget (4x2): Cat Quick Status Controls */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onOpenWindow('cats');
        }}
        className="pointer-events-auto w-full md:w-[380px] h-[170px] rounded-[24px] glass-panel border border-white/30 dark:border-white/10 p-4 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.01] cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl filter drop-shadow">🐱</span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1">
                {activeCat.name}
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                  Lvl {activeCat.level}
                </span>
              </h3>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                {activeCat.status === 'sleeping' ? '🛌 Спит' : '🐾 Активен'}
              </p>
            </div>
          </div>
          {/* Paw Count display */}
          <div className="flex items-center gap-1 bg-sky-500/10 dark:bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold font-mono">
              🐾 {profile.paws}
            </span>
          </div>
        </div>

        {/* 4 Status Progress bars */}
        <div className="grid grid-cols-4 gap-2.5 my-1.5">
          {/* Hunger */}
          <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1.5 rounded-xl border border-white/20 dark:border-white/5">
            <Flame size={11} className={activeCat.hunger < 35 ? 'text-rose-500 animate-pulse' : 'text-orange-500'} />
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Сытость</span>
            <span className="text-[10px] font-bold font-mono text-slate-800 dark:text-slate-200">
              {Math.round(activeCat.hunger)}%
            </span>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  activeCat.hunger < 35 ? 'bg-rose-500' : 'bg-orange-500'
                }`}
                style={{ width: `${activeCat.hunger}%` }}
              />
            </div>
          </div>

          {/* Happiness */}
          <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1.5 rounded-xl border border-white/20 dark:border-white/5">
            <Heart size={11} className={activeCat.happiness < 35 ? 'text-rose-500 animate-pulse' : 'text-rose-500'} />
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Радость</span>
            <span className="text-[10px] font-bold font-mono text-slate-800 dark:text-slate-200">
              {Math.round(activeCat.happiness)}%
            </span>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                style={{ width: `${activeCat.happiness}%` }}
              />
            </div>
          </div>

          {/* Cleanliness */}
          <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1.5 rounded-xl border border-white/20 dark:border-white/5">
            <Droplets size={11} className={activeCat.cleanliness < 35 ? 'text-rose-500 animate-pulse' : 'text-blue-500'} />
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Гигиена</span>
            <span className="text-[10px] font-bold font-mono text-slate-800 dark:text-slate-200">
              {Math.round(activeCat.cleanliness)}%
            </span>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${activeCat.cleanliness}%` }}
              />
            </div>
          </div>

          {/* Energy */}
          <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1.5 rounded-xl border border-white/20 dark:border-white/5">
            <Bed size={11} className={activeCat.energy < 30 ? 'text-rose-500 animate-pulse' : 'text-indigo-500'} />
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold mt-1">Энергия</span>
            <span className="text-[10px] font-bold font-mono text-slate-800 dark:text-slate-200">
              {Math.round(activeCat.energy)}%
            </span>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${activeCat.energy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interactive buttons directly on widget */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() => onInteract('feed')}
            disabled={activeCat.status === 'sleeping'}
            className="py-1 px-1 text-[9px] font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            🐟 Кормить
          </button>
          <button
            onClick={() => onInteract('play')}
            disabled={activeCat.status === 'sleeping'}
            className="py-1 px-1 text-[9px] font-bold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            🎾 Играть
          </button>
          <button
            onClick={() => onInteract('clean')}
            disabled={activeCat.status === 'sleeping'}
            className="py-1 px-1 text-[9px] font-bold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center"
          >
            🧼 Мыть
          </button>
          <button
            onClick={() => onInteract('sleep')}
            className={`py-1 px-1 text-[9px] font-bold rounded-lg transition-all active:scale-95 text-center ${
              activeCat.status === 'sleeping'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {activeCat.status === 'sleeping' ? '🥱 Разбудить' : '🛌 Уложить'}
          </button>
        </div>
      </motion.div>

      {/* 2. Small Widget (2x2): Daily Quests overview */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.2 }}
        onClick={() => onOpenWindow('quests')}
        className="pointer-events-auto w-[180px] h-[170px] rounded-[24px] glass-panel border border-white/30 dark:border-white/10 p-4 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Target size={14} className="group-hover:rotate-12 transition-transform" />
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
            {completedQuests}/{totalQuests}
          </span>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">
            Квесты дня
          </h3>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            Выполняйте задания, чтобы получить лапки!
          </p>
        </div>

        {/* Small progress meter */}
        <div className="w-full">
          <div className="flex justify-between text-[8px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-1">
            <span>Прогресс</span>
            <span>{Math.round((completedQuests / totalQuests) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-rose-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedQuests / totalQuests) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* 3. Small Widget (2x2): Cat Analytics & Stats */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.3 }}
        onClick={() => onOpenWindow('analytics')}
        className="pointer-events-auto w-[180px] h-[170px] rounded-[24px] glass-panel border border-white/30 dark:border-white/10 p-4 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <Activity size={14} className="group-hover:animate-pulse" />
          </span>
          <span className="text-[9px] font-mono font-bold text-sky-500 dark:text-sky-400">
            АНАЛИТИКА
          </span>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">
            Статистика заботы
          </h3>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            Показатели активности и достижений ваших питомцев.
          </p>
        </div>

        {/* Dynamic metrics */}
        <div className="border-t border-slate-200 dark:border-slate-800/40 pt-2 space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-500 dark:text-slate-400">Уровень кота</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{activeCat.level} ур.</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-500 dark:text-slate-400">Питомцев</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{profile.cats.length}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
