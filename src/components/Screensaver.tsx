import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Moon, Play, Sparkles } from 'lucide-react';

interface ScreensaverProps {
  onDismiss: () => void;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ onDismiss }) => {
  const [time, setTime] = useState(new Date());
  const [catState, setCatState] = useState<'sleep' | 'play' | 'stretch'>('sleep');

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Randomize cat state every 8 seconds for visual interest
    const catTimer = setInterval(() => {
      const states: ('sleep' | 'play' | 'stretch')[] = ['sleep', 'play', 'stretch'];
      const randomState = states[Math.floor(Math.random() * states.length)];
      setCatState(randomState);
    }, 8000);

    // Activity listeners to dismiss screensaver on interaction
    const handleActivity = () => {
      onDismiss();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      clearInterval(clockTimer);
      clearInterval(catTimer);
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

  // Fun visual representations of the cat
  const renderCatAnimation = () => {
    switch (catState) {
      case 'play':
        return (
          <div className="flex flex-col items-center">
            {/* Playful bounce cat animation */}
            <motion.div
              animate={{
                y: [0, -25, 0],
                rotate: [0, 10, -10, 0],
                scaleY: [1, 0.85, 1.1, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-7xl select-none filter drop-shadow-[0_0_15px_rgba(14,165,233,0.3)] cursor-none"
            >
              🐈‍⬛
            </motion.div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold mt-4 animate-pulse">
              играет с клубочком 🧶
            </span>
          </div>
        );
      case 'stretch':
        return (
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scaleX: [1, 1.25, 1],
                scaleY: [1, 0.9, 1.05, 1],
                skewX: [0, 8, -8, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-7xl select-none filter drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-none"
            >
              🐈
            </motion.div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold mt-4 animate-pulse">
              потягивается ✨
            </span>
          </div>
        );
      case 'sleep':
      default:
        return (
          <div className="flex flex-col items-center">
            {/* Breathing sleeping cat animation */}
            <motion.div
              animate={{
                scaleY: [1, 1.06, 1],
                scaleX: [1, 0.98, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-7xl select-none filter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-none"
            >
              🐱💤
            </motion.div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 font-bold mt-4 animate-pulse">
              тихо мурчит... муррр 🌸
            </span>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 bg-neutral-950/98 backdrop-blur-3xl z-[9999] flex flex-col justify-between items-center py-20 px-4 text-white font-sans select-none overflow-hidden cursor-none"
    >
      {/* Top Ambient Glow / Star Particles */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl" />

      {/* 1. Header decorative tag */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 0.4 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-mono text-slate-400"
      >
        <Moon size={12} className="text-purple-400" />
        <span>Скринсейвер MacCat OS</span>
      </motion.div>

      {/* 2. Central Clock & Cat Section */}
      <div className="flex flex-col items-center gap-14 my-auto">
        {/* Clock with soft futuristic shadow */}
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

        {/* Dynamic Cat Animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 min-w-[280px] flex items-center justify-center backdrop-blur-sm shadow-xl"
        >
          {renderCatAnimation()}
        </motion.div>
      </div>

      {/* 3. Footer Prompt */}
      <motion.div
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-mono"
      >
        Пошевелите мышкой или коснитесь экрана, чтобы выйти
      </motion.div>
    </motion.div>
  );
};
