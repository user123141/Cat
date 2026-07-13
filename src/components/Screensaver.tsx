import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cat } from '../types';
import { CatRenderer } from './CatRenderer';

interface ScreensaverProps {
  onDismiss: () => void;
  activeCat?: Cat; // активный кот
  activeSkin?: { color: string; patternColor: string; eyeColor: string }; // цвета скина
}

export const Screensaver: React.FC<ScreensaverProps> = ({ 
  onDismiss, 
  activeCat,
  activeSkin 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const handleActivity = () => {
      onDismiss();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [onDismiss]);

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Если нет активного кота, показываем заглушку
  const catToShow = activeCat || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 bg-neutral-950/98 backdrop-blur-3xl z-[9999] flex flex-col items-center justify-center py-20 px-4 text-white font-sans select-none overflow-hidden cursor-none"
    >
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl" />

      <div className="flex flex-col items-center gap-10 my-auto">
        {/* Часы */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <span className="text-7xl sm:text-8xl md:text-9xl font-extralight tracking-tight text-white font-mono drop-shadow-[0_4px_30px_rgba(255,255,255,0.15)] select-none cursor-none">
            {formatClock(time)}
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-neutral-400 font-mono">
            {formatDate(time)}
          </span>
        </motion.div>

        {/* Кот (активный) */}
        {catToShow && activeSkin ? (
          <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <CatRenderer
              breed={catToShow.breed}
              color={activeSkin.color}
              patternColor={activeSkin.patternColor}
              eyeColor={activeSkin.eyeColor}
              accessory={(catToShow as any).accessory}
              status={catToShow.status}
              size={140}
              personality={catToShow.personality}
            />
          </div>
        ) : (
          <div className="text-neutral-500 text-sm">Кот не выбран</div>
        )}
      </div>

      <motion.div
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-mono"
      >
        Пошевелите мышкой или коснитесь экрана
      </motion.div>
    </motion.div>
  );
};