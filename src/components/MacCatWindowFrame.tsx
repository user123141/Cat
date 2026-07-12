import React, { useEffect, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { useZIndex } from '../context/ZIndexContext';
import { triggerHapticLight } from '../utils/audio';
import { getWindowLayout } from '../utils/windowManager';

interface MacCatWindowFrameProps {
  id: string;
  onClose: () => void;
  onMinimize?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export const MacCatWindowFrame: React.FC<MacCatWindowFrameProps> = ({
  id,
  onClose,
  onMinimize,
  title,
  subtitle,
  children,
  className = '',
  headerRight,
}) => {
  const { getZIndex, focusWindow } = useZIndex();
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (isMobile) {
      // Swipe down to dismiss on mobile (bottom-sheet gesture)
      if (info.offset.y > 140 || info.velocity.y > 250) {
        triggerHapticLight();
        onClose();
      }
    }
  };

  const currentZ = getZIndex(id);

  return (
    <motion.div
      initial={
        isMobile
          ? { y: '100%', opacity: 0.95 }
          : { scale: 0.93, opacity: 0 }
      }
      animate={{
        y: 0,
        scale: 1,
        opacity: 1,
      }}
      exit={
        isMobile
          ? { y: '100%', opacity: 0 }
          : { scale: 0.93, opacity: 0 }
      }
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      drag={isMobile ? 'y' : true}
      dragHandleClassName="window-drag-handle"
      dragConstraints={
        isMobile
          ? { top: 0, bottom: 800 }
          : { left: -400, right: 400, top: -100, bottom: 500 }
      }
      dragElastic={isMobile ? { top: 0.05, bottom: 0.8 } : 0.05}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onPointerDown={() => focusWindow(id)}
      style={{
        zIndex: currentZ,
        width: getWindowLayout(id, dimensions.width, dimensions.height).width,
        height: getWindowLayout(id, dimensions.width, dimensions.height).height,
        top: getWindowLayout(id, dimensions.width, dimensions.height).top,
        bottom: getWindowLayout(id, dimensions.width, dimensions.height).bottom,
        left: getWindowLayout(id, dimensions.width, dimensions.height).left,
        transform: getWindowLayout(id, dimensions.width, dimensions.height).transform,
      }}
      className={`
        absolute
        ${isMobile 
          ? 'fixed rounded-t-[28px] rounded-b-none border-t border-white/15' 
          : 'rounded-3xl border border-white/10'
        }
        glass-panel-dark text-slate-100 overflow-hidden shadow-2xl flex flex-col select-none pointer-events-auto
        ${className}
      `}
    >
      {/* 1. Drag bar / handle for mobile */}
      {isMobile && (
        <div className="window-drag-handle w-full flex flex-col items-center pt-2.5 pb-1 shrink-0 bg-black/40">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
      )}

      {/* 2. Window Header (macOS style with drag capability) */}
      <div className="window-drag-handle h-12 bg-black/40 border-b border-white/5 px-4 flex items-center justify-between select-none cursor-grab active:cursor-grabbing shrink-0">
        <div className="flex items-center pointer-events-auto -ml-3">
          {/* Close Dot */}
          <button
            onClick={() => {
              triggerHapticLight();
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Закрыть"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-mac-red hover:brightness-90 flex items-center justify-center group relative">
              <span className="text-[9px] text-red-950 font-black opacity-0 group-hover:opacity-100 transition-opacity absolute">×</span>
            </div>
          </button>

          {/* Minimize Dot */}
          {onMinimize && (
            <button
              onClick={() => {
                triggerHapticLight();
                onMinimize();
              }}
              className="w-10 h-10 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Свернуть"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-mac-yellow hover:brightness-90 flex items-center justify-center group relative">
                <span className="text-[9px] text-yellow-950 font-black opacity-0 group-hover:opacity-100 transition-opacity absolute">−</span>
              </div>
            </button>
          )}

          {/* Maximize Dot (passive/aesthetic) */}
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-mac-green opacity-70"></div>
          </div>
          
          {subtitle && (
            <span className="text-xs font-semibold text-slate-400 ml-1.5 tracking-wide max-sm:hidden">
              {subtitle}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="text-xs md:text-sm font-bold text-slate-200 truncate px-2">
          {title}
        </div>

        {/* Header Right Content Slot */}
        <div className="min-w-10 flex justify-end">
          {headerRight || <div className="w-4" />}
        </div>
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        {children}
      </div>
    </motion.div>
  );
};
