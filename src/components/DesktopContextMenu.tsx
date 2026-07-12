import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Image, CloudRain, AppWindow, Moon, Sun, Snowflake, Eye, Wind } from 'lucide-react';
import { playMacClickSound, triggerHapticLight } from '../utils/audio';

interface DesktopContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onUpdateWallpaper: (wallpaperId: string) => void;
  onUpdateWeather: (weather: 'rain' | 'snow' | 'morning' | 'night' | 'none' | null) => void;
  activeWeather: 'rain' | 'snow' | 'morning' | 'night' | 'none' | null;
  activeWallpaper: string;
  onOpenApp: (appId: string) => void;
}

export const DesktopContextMenu: React.FC<DesktopContextMenuProps> = ({
  x,
  y,
  onClose,
  onUpdateWallpaper,
  onUpdateWeather,
  activeWeather,
  activeWallpaper,
  onOpenApp,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // Adjust coordinates so the menu does not overflow the viewport
  const getAdjustedCoords = () => {
    if (typeof window === 'undefined') return { left: x, top: y };
    const menuWidth = 224; // w-56 is 14rem = 224px
    const menuHeight = 350; // approximate max height of the menu
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > windowWidth) {
      adjustedX = windowWidth - menuWidth - 12;
    }
    if (y + menuHeight > windowHeight) {
      adjustedY = windowHeight - menuHeight - 12;
    }

    return { left: Math.max(12, adjustedX), top: Math.max(12, adjustedY) };
  };

  const coords = getAdjustedCoords();

  const handleAppClick = (appId: string) => {
    triggerHapticLight();
    playMacClickSound();
    onOpenApp(appId);
    onClose();
  };

  const handleWallpaperClick = (wallpaperId: string) => {
    triggerHapticLight();
    playMacClickSound();
    onUpdateWallpaper(wallpaperId);
    onClose();
  };

  const handleWeatherClick = (weather: 'rain' | 'snow' | 'morning' | 'night' | 'none' | null) => {
    triggerHapticLight();
    playMacClickSound();
    onUpdateWeather(weather);
    onClose();
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="fixed bg-slate-900/85 dark:bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl w-56 text-slate-100 text-xs flex flex-col z-[9999] select-none font-sans"
      style={{ left: coords.left, top: coords.top }}
    >
      {/* 1. Apps Group */}
      <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <AppWindow size={10} />
        <span>Запуск приложений</span>
      </div>
      <div className="space-y-0.5 mb-1.5">
        <button
          onClick={() => handleAppClick('cats')}
          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span>🐱</span>
            <span className="font-semibold">Комната котиков</span>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono font-bold">F1</span>
        </button>
        <button
          onClick={() => handleAppClick('shop')}
          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span>🛍️</span>
            <span className="font-semibold">Магазин одежек</span>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono font-bold">F2</span>
        </button>
        <button
          onClick={() => handleAppClick('quests')}
          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="font-semibold">Дневные квесты</span>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono font-bold">F3</span>
        </button>
        <button
          onClick={() => handleAppClick('antistress')}
          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span>🥊</span>
            <span className="font-semibold">Антистресс игрушки</span>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-white/80 font-mono font-bold">F4</span>
        </button>
      </div>

      <div className="border-t border-white/5 my-1" />

      {/* 2. Wallpapers Group */}
      <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <Image size={10} />
        <span>Выбор обоев</span>
      </div>
      <div className="grid grid-cols-3 gap-1 px-1.5 py-1 mb-1.5">
        {[
          { id: 'ventura', label: 'Ventura', color: 'from-orange-500 to-indigo-600' },
          { id: 'sonoma', label: 'Sonoma', color: 'from-sky-400 to-amber-300' },
          { id: 'sequoia', label: 'Sequoia', color: 'from-emerald-900 to-neutral-900' },
          { id: 'monterey', label: 'Monterey', color: 'from-pink-500 to-indigo-900' },
          { id: 'aurora', label: 'Aurora', color: 'from-teal-700 to-slate-900' },
          { id: 'cosmic', label: 'Cosmic', color: 'from-violet-950 to-black' },
        ].map((wall) => (
          <button
            key={wall.id}
            onClick={() => handleWallpaperClick(wall.id)}
            className={`flex flex-col items-center justify-center p-1 rounded-lg border cursor-pointer transition-all hover:brightness-110 active:scale-95 ${
              activeWallpaper === wall.id ? 'border-sky-400 bg-white/10' : 'border-transparent bg-black/20'
            }`}
            title={wall.label}
          >
            <div className={`w-8 h-4.5 rounded bg-gradient-to-tr ${wall.color} shadow-sm`} />
            <span className="text-[8px] font-semibold mt-1 text-slate-300 truncate max-w-full">{wall.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-white/5 my-1" />

      {/* 3. Weather Group */}
      <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <CloudRain size={10} />
        <span>Эффекты погоды</span>
      </div>
      <div className="space-y-0.5">
        {[
          { id: null, label: 'По умолчанию (Авто)', icon: <Sun size={11} className="text-yellow-400" /> },
          { id: 'rain', label: 'Проливной дождь 🌧️', icon: <CloudRain size={11} className="text-sky-400" /> },
          { id: 'snow', label: 'Снегопад ❄️', icon: <Snowflake size={11} className="text-blue-300" /> },
          { id: 'morning', label: 'Солнечные блики 🌅', icon: <Wind size={11} className="text-amber-400" /> },
          { id: 'night', label: 'Звездная пыль 🌌', icon: <Moon size={11} className="text-indigo-300" /> },
          { id: 'none', label: 'Без эффектов ☀️', icon: <Eye size={11} className="text-slate-400" /> },
        ].map((weather) => (
          <button
            key={String(weather.id)}
            onClick={() => handleWeatherClick(weather.id as any)}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500 hover:text-white flex items-center gap-2 transition-colors cursor-pointer font-semibold ${
              activeWeather === weather.id ? 'bg-sky-500/20 text-sky-300 border-l-2 border-sky-400 rounded-l-none' : ''
            }`}
          >
            {weather.icon}
            <span>{weather.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
