import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface DesktopBackgroundProps {
  wallpaperId: string;
  weatherOverride?: 'rain' | 'snow' | 'morning' | 'night' | 'none' | null;
}

export const DesktopBackground: React.FC<DesktopBackgroundProps> = ({ wallpaperId, weatherOverride = null }) => {
  const [gyroOffset, setGyroOffset] = useState({ x: 0, y: 0 });
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');
  const [hasGyro, setHasGyro] = useState(false);

  // 1. Gyroscope & mouse parallax tilt tracking
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event; // beta (-180 to 180), gamma (-90 to 90)
      if (beta !== null && gamma !== null) {
        setHasGyro(true);
        // Limit maximum shift to 15 pixels for premium feel
        const x = Math.max(-15, Math.min(15, gamma / 3));
        const y = Math.max(-15, Math.min(15, (beta - 45) / 3)); // assume ~45 deg viewing angle
        setGyroOffset({ x, y });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (hasGyro) return; // Prioritize gyroscope on mobile devices
      const { clientX, clientY } = e;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Calculate smooth tilt offsets based on mouse position relative to center screen
      const x = ((clientX / width) - 0.5) * 20; // max 10px drift
      const y = ((clientY / height) - 0.5) * 20; // max 10px drift
      setGyroOffset({ x, y });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasGyro]);

  // 2. Real-time of day detector
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay('day');
      } else if (hour >= 17 && hour < 22) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // 3. Wallpaper gradients config
  const getWallpaperGradient = () => {
    switch (wallpaperId) {
      case 'monterey':
        return 'from-pink-600 via-purple-700 to-indigo-900';
      case 'sonoma':
        return 'from-sky-400 via-emerald-400 to-amber-200';
      case 'sequoia':
        return 'from-emerald-950 via-slate-900 to-neutral-950';
      case 'aurora':
        return 'from-teal-800 via-indigo-950 to-slate-950 animate-gradient-shift bg-[length:200%_200%]';
      case 'cosmic':
        return 'from-black via-slate-950 to-violet-950';
      case 'ventura':
      default:
        return 'from-orange-400 via-pink-600 to-indigo-900';
    }
  };

  // 4. Render Weather Overlay particles (SVG)
  const renderWeatherOverlay = () => {
    const activeEffect = weatherOverride !== null ? weatherOverride : timeOfDay;
    if (activeEffect === 'none') {
      return null;
    }

    if (activeEffect === 'rain' || activeEffect === 'day') {
      // Afternoon - soft falling raindrops (rain effect)
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rainDrop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
            </linearGradient>
            <filter id="rainBlur">
              <feGaussianBlur stdDeviation="1" />
            </filter>
          </defs>
          {Array.from({ length: 25 }).map((_, i) => {
            const x = (i * 4.3) % 100;
            const yStart = (i * 12.7) % 100;
            const speed = 1.5 + (i % 3) * 0.4;
            const height = 15 + (i % 4) * 8;
            return (
              <motion.line
                key={`rain-${i}`}
                x1={`${x}%`}
                y1="-20"
                x2={`${x - 1}%`}
                y2="-5"
                stroke="url(#rainDrop)"
                strokeWidth="1.5"
                filter="url(#rainBlur)"
                animate={{
                  y: ['0vh', '110vh'],
                  x: [`${x}%`, `${x - 4}%`],
                }}
                transition={{
                  duration: speed,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.12,
                }}
              />
            );
          })}
        </svg>
      );
    }

    if (activeEffect === 'morning') {
      // Morning - Warm, rotating golden solar flares
      return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => {
            const size = 150 + (i % 3) * 80;
            const left = 10 + (i * 22) % 80;
            const top = 10 + (i * 14) % 60;
            return (
              <motion.div
                key={`flare-${i}`}
                className="absolute rounded-full bg-gradient-to-tr from-amber-400/10 to-orange-400/0 border border-amber-300/5 mix-blend-screen"
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  top: `${top}%`,
                  filter: 'blur(8px)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 180, 360],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 15 + i * 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </div>
      );
    }

    if (activeEffect === 'snow' || activeEffect === 'evening') {
      // Evening - Soft drifting white fluffy snowflakes (snow effect)
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="snowBlur">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          {Array.from({ length: 28 }).map((_, i) => {
            const x = (i * 3.7) % 100;
            const r = 2 + (i % 3) * 1.5;
            const speed = 7 + (i % 4) * 2;
            const delay = i * 0.3;
            return (
              <motion.circle
                key={`snow-${i}`}
                cx={`${x}%`}
                cy="-10"
                r={r}
                fill="rgba(255, 255, 255, 0.65)"
                filter="url(#snowBlur)"
                animate={{
                  y: ['0vh', '110vh'],
                  x: [`${x}%`, `${x + Math.sin(i) * 5}%`],
                }}
                transition={{
                  duration: speed,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: delay,
                }}
              />
            );
          })}
        </svg>
      );
    }

    // Night - Celestial stellar sparks / twilight dust (or fallback)
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sparkleBlur">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>
        {Array.from({ length: 30 }).map((_, i) => {
          const cx = (i * 3.3 + 7) % 96;
          const cy = (i * 2.9 + 13) % 94;
          const size = 1 + (i % 3);
          const delay = (i % 5) * 0.6;
          return (
            <motion.circle
              key={`sparkle-${i}`}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r={size}
              fill="#e0f2fe"
              filter="url(#sparkleBlur)"
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + (i % 3) * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay,
              }}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-950">
      {/* Dynamic gradient canvas with gyro parallax tilt */}
      <motion.div
        className={`absolute -inset-10 bg-gradient-to-tr transition-all duration-1000 ${getWallpaperGradient()}`}
        style={{ originX: 0.5, originY: 0.5 }}
        animate={{
          x: gyroOffset.x,
          y: gyroOffset.y,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 25 }}
      />

      {/* Floating high-contrast glassmorphic glow rings */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-white/5 filter blur-3xl animate-pulse" 
        style={{ transform: `translate(${gyroOffset.x * 0.5}px, ${gyroOffset.y * 0.5}px)` }}
      />
      <div 
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-black/10 filter blur-3xl animate-pulse" 
        style={{ transform: `translate(${gyroOffset.x * -0.5}px, ${gyroOffset.y * -0.5}px)` }}
      />

      {/* Weather Overlay Particles System */}
      {renderWeatherOverlay()}

      {/* Subtle macOS Desktop Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] opacity-70" />
    </div>
  );
};
