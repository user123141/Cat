// src/components/SwiftUIWidgets.tsx (ПОЛНАЯ ВЕРСИЯ)
import React from 'react';
import { motion } from 'motion/react';
import { Cat as CatType, PlayerProfile } from '../types';
import { Cat as CatIcon, Sparkles, Activity, Target, Flame, Heart, Droplets, Bed } from 'lucide-react';
import { NeedsCatRenderer } from './NeedsCatRenderer';

interface SwiftUIWidgetsProps {
  profile: PlayerProfile | null;
  activeCat: CatType | undefined;
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

  const completedQuests = profile.quests.filter((q) => q.completed).length;
  const totalQuests = profile.quests.length;

  // Active cat custom skin fallback
  const catSkin = activeCat.skinColor ? {
    color: activeCat.skinColor,
    patternColor: activeCat.patternColor || '#ff85a1',
    eyeColor: activeCat.eyeColor || '#0ea5e9'
  } : {
    color: '#ffccd5',
    patternColor: '#ff85a1',
    eyeColor: '#0ea5e9'
  };

  return (
    // Используем flex-col и центрируем, чтобы виджеты не растягивались на всю ширину на телефонах
    <div className="absolute top-16 left-4 right-4 bottom-28 pointer-events-none z-10 flex flex-col items-center gap-3 select-none">
      
      {/* 1. Виджет Котика */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
        onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; onOpenWindow('cats'); }}
        className="pointer-events-auto w-full max-w-[400px] h-[160px] rounded-[20px] glass-panel border border-white/30 dark:border-white/10 p-3 shadow-xl flex flex-row gap-3 items-stretch hover:shadow-2xl hover:scale-[1.01] cursor-pointer transition-all group"
      >
        {/* Левая колонка: информация и кнопки */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Верхняя строка: Имя, уровень, лапки */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CatIcon size={14} className="text-slate-700 dark:text-slate-300" />
              <div>
                <h3 className="text-[12px] font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1">
                  {activeCat.name}
                  <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 font-mono">Lvl {activeCat.level}</span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-sky-500/10 dark:bg-sky-400/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
              <span className="text-[8px] text-sky-600 dark:text-sky-400 font-bold font-mono">🐾 {profile.paws}</span>
            </div>
          </div>

          {/* 4 Индикатора (Сытость, Радость, Гигиена, Энергия) */}
          <div className="grid grid-cols-4 gap-1 my-1">
            <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1 rounded-lg border border-white/20 dark:border-white/5">
              <Flame size={8} className={activeCat.hunger < 35 ? 'text-rose-500 animate-pulse' : 'text-orange-500'} />
              <span className="text-[6px] text-slate-500 dark:text-slate-400 font-semibold">Сытость</span>
              <span className="text-[8px] font-bold font-mono text-slate-800 dark:text-slate-200">{Math.round(activeCat.hunger)}%</span>
            </div>
            <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1 rounded-lg border border-white/20 dark:border-white/5">
              <Heart size={8} className={activeCat.happiness < 35 ? 'text-rose-500 animate-pulse' : 'text-rose-500'} />
              <span className="text-[6px] text-slate-500 dark:text-slate-400 font-semibold">Радость</span>
              <span className="text-[8px] font-bold font-mono text-slate-800 dark:text-slate-200">{Math.round(activeCat.happiness)}%</span>
            </div>
            <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1 rounded-lg border border-white/20 dark:border-white/5">
              <Droplets size={8} className={activeCat.cleanliness < 35 ? 'text-rose-500 animate-pulse' : 'text-blue-500'} />
              <span className="text-[6px] text-slate-500 dark:text-slate-400 font-semibold">Гигиена</span>
              <span className="text-[8px] font-bold font-mono text-slate-800 dark:text-slate-200">{Math.round(activeCat.cleanliness)}%</span>
            </div>
            <div className="flex flex-col items-center bg-white/30 dark:bg-black/15 p-1 rounded-lg border border-white/20 dark:border-white/5">
              <Bed size={8} className={activeCat.energy < 30 ? 'text-rose-500 animate-pulse' : 'text-indigo-500'} />
              <span className="text-[6px] text-slate-500 dark:text-slate-400 font-semibold">Энергия</span>
              <span className="text-[8px] font-bold font-mono text-slate-800 dark:text-slate-200">{Math.round(activeCat.energy)}%</span>
            </div>
          </div>

          {/* 4 Кнопки действий (Кормить, Играть, Мыть, Уложить) */}
          <div className="grid grid-cols-4 gap-1">
            <button onClick={() => onInteract('feed')} disabled={activeCat.status === 'sleeping'} className="py-1 px-0.5 text-[8px] font-bold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center">Кормить</button>
            <button onClick={() => onInteract('play')} disabled={activeCat.status === 'sleeping'} className="py-1 px-0.5 text-[8px] font-bold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center">Играть</button>
            <button onClick={() => onInteract('clean')} disabled={activeCat.status === 'sleeping'} className="py-1 px-0.5 text-[8px] font-bold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center">Мыть</button>
            <button onClick={() => onInteract('sleep')} className={`py-1 px-0.5 text-[8px] font-bold rounded-lg transition-all active:scale-95 text-center ${activeCat.status === 'sleeping' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{activeCat.status === 'sleeping' ? 'Встать' : 'Спать'}</button>
          </div>
        </div>

        {/* Правая колонка: Интерактивный котик */}
        <div className="w-[85px] bg-black/5 dark:bg-black/25 rounded-xl border border-white/15 dark:border-white/5 flex items-center justify-center relative overflow-hidden shrink-0">
          <NeedsCatRenderer
            status={activeCat.status}
            hunger={activeCat.hunger}
            happiness={activeCat.happiness}
            cleanliness={activeCat.cleanliness}
            energy={activeCat.energy}
            breed={activeCat.breed}
            color={catSkin.color}
            patternColor={catSkin.patternColor}
            eyeColor={catSkin.eyeColor}
            accessory={(activeCat as any).accessory}
            size={72}
          />
        </div>
      </motion.div>

      {/* 2. Виджет Квестов */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.2 }}
        onClick={() => onOpenWindow('quests')}
        className="pointer-events-auto w-full max-w-[400px] h-[155px] rounded-[20px] glass-panel border border-white/30 dark:border-white/10 p-3.5 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20"><Target size={14} className="group-hover:rotate-12 transition-transform" /></span>
          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">{completedQuests}/{totalQuests}</span>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">Квесты дня</h3>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Выполняйте задания, чтобы получить лапки!</p>
        </div>
        <div className="w-full">
          <div className="flex justify-between text-[8px] font-mono font-bold text-slate-600 dark:text-slate-400 mb-0.5"><span>Прогресс</span><span>{Math.round((completedQuests / totalQuests) * 100)}%</span></div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-white/10">
            <motion.div className="h-full bg-rose-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${(completedQuests / totalQuests) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
        </div>
      </motion.div>

      {/* 3. Виджет Аналитики */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.3 }}
        onClick={() => onOpenWindow('analytics')}
        className="pointer-events-auto w-full max-w-[400px] h-[155px] rounded-[20px] glass-panel border border-white/30 dark:border-white/10 p-3.5 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20"><Activity size={14} className="group-hover:animate-pulse" /></span>
          <span className="text-[9px] font-mono font-bold text-sky-500 dark:text-sky-400">АНАЛИТИКА</span>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">Статистика заботы</h3>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Показатели активности и достижений.</p>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800/40 pt-1.5 flex justify-between text-[10px]">
          <span className="text-slate-500 dark:text-slate-400">Уровень кота</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{activeCat.level} ур.</span>
        </div>
        <div className="flex justify-between text-[10px] pb-0.5">
          <span className="text-slate-500 dark:text-slate-400">Питомцев</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{profile.cats.length}</span>
        </div>
      </motion.div>

    </div>
  );
};