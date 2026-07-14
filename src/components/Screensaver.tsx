// src/components/Screensaver.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cat, Skin } from '../types';
import { NeedsCatRenderer } from './NeedsCatRenderer';

interface ScreensaverProps {
  onDismiss: () => void;
  activeCat?: Cat;
  allSkins?: Skin[];
}

export const Screensaver: React.FC<ScreensaverProps> = ({ 
  onDismiss, 
  activeCat,
  allSkins = [],
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

  const getSkinColors = () => {
    if (!activeCat) return { color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
    const skin = allSkins.find(s => s.id === activeCat.skinId);
    if (skin) {
      return { color: skin.color, patternColor: skin.patternColor, eyeColor: skin.eyeColor };
    }
    if (activeCat.breed === 'Siamese') return { color: '#fef3c7', patternColor: '#78350f', eyeColor: '#06b6d4' };
    if (activeCat.breed === 'British Shorthair') return { color: '#64748b', patternColor: '#475569', eyeColor: '#f59e0b' };
    if (activeCat.breed === 'Sphynx') return { color: '#fda4af', patternColor: '#f43f5e', eyeColor: '#10b981' };
    if (activeCat.breed === 'Persian') return { color: '#fef08a', patternColor: '#eab308', eyeColor: '#a855f7' };
    if (activeCat.breed === 'Bombay') return { color: '#1e293b', patternColor: '#0f172a', eyeColor: '#f59e0b' };
    if (activeCat.breed === 'Bengal') return { color: '#f59e0b', patternColor: '#78350f', eyeColor: '#10b981' };
    if (activeCat.breed === 'Sakura Neko') return { color: '#fff1f2', patternColor: '#fda4af', eyeColor: '#ec4899' };
    if (activeCat.breed === 'Galaxy Cat') return { color: '#312e81', patternColor: '#6366f1', eyeColor: '#a855f7' };
    return { color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
  };

  const skinColors = getSkinColors();

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

        {activeCat && (
          <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
            <NeedsCatRenderer
              status={activeCat.status}
              hunger={activeCat.hunger}
              happiness={activeCat.happiness}
              cleanliness={activeCat.cleanliness}
              energy={activeCat.energy}
              breed={activeCat.breed}
              color={skinColors.color}
              patternColor={skinColors.patternColor}
              eyeColor={skinColors.eyeColor}
              hat={activeCat.hat}
              glasses={activeCat.glasses}
              collar={activeCat.collar}
              scarf={activeCat.scarf}
              boots={activeCat.boots}
              wings={activeCat.wings}
              accessory={activeCat.accessory}
              size={140}
            />
          </div>
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