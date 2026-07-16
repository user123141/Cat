// src/components/MacCatWindowFrame.tsx
import React, { useEffect, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { useWindowManager, WindowId } from '../context/WindowManagerContext';
import { triggerHapticLight } from '../utils/audio';
import { getWindowLayout } from '../utils/windowManager';

interface MacCatWindowFrameProps {
  id: string; // теперь это WindowId, но мы оставим string для совместимости
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
  const { getZIndex, focusWindow } = useWindowManager();
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
      // Закрытие при свайпе вниз
      if (info.offset.y > 100 || info.velocity.y > 180) {
        triggerHapticLight();
        onClose();
      }
    }
  };

  const currentZ = getZIndex(id as WindowId);
  const layout = getWindowLayout(id, dimensions.width, dimensions.height);

  return (
    <motion.div
      initial={isMobile ? { y: '100%', opacity: 0.9 } : { scale: 0.93, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.93, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      drag={isMobile ? 'y' : true}
      dragHandleClassName="window-drag-handle"
      dragConstraints={isMobile ? { top: 0, bottom: 500 } : { left: -400, right: 400, top: -100, bottom: 500 }}
      dragElastic={isMobile ? { top: 0.05, bottom: 0.5 } : 0.05}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onPointerDownCapture={() => focusWindow(id as WindowId)}
      style={{
        zIndex: isMobile ? 45 + currentZ : currentZ,
        width: layout.width,
        height: layout.height,
        top: layout.top,
        bottom: layout.bottom,
        left: layout.left,
        transform: layout.transform,
      }}
      className={`
        absolute
        ${isMobile 
          ? 'fixed rounded-t-[20px] rounded-b-none border-t border-white/15' 
          : 'rounded-3xl border border-white/10'
        }
        glass-panel-dark text-slate-100 overflow-hidden shadow-2xl flex flex-col select-none pointer-events-auto
        ${className}
      `}
    >
      {isMobile ? (
        <div className="window-drag-handle bg-black/40 border-b border-white/5 px-4 pt-2.5 pb-3 flex flex-col gap-2.5 select-none cursor-grab active:cursor-grabbing shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full self-center" />
          <div className="flex items-center justify-between">
            <button
              onClick={() => { triggerHapticLight(); onClose(); }}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-extrabold text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
            >
              Закрыть
            </button>
            <div className="text-[11px] font-black text-slate-100 tracking-wide uppercase font-sans">{title}</div>
            <div className="min-w-[50px] flex justify-end">{headerRight || <div className="w-3" />}</div>
          </div>
        </div>
      ) : (
        <div className="window-drag-handle h-10 bg-black/40 border-b border-white/5 px-3 flex items-center justify-between select-none cursor-grab active:cursor-grabbing shrink-0">
          <div className="flex items-center pointer-events-auto -ml-2">
            <button
              onClick={() => { triggerHapticLight(); onClose(); }}
              className="w-8 h-8 flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Закрыть"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-mac-red hover:brightness-90 flex items-center justify-center group relative">
                <span className="text-[8px] text-red-950 font-black opacity-0 group-hover:opacity-100 transition-opacity absolute">×</span>
              </div>
            </button>
            {onMinimize && (
              <button
                onClick={() => { triggerHapticLight(); onMinimize(); }}
                className="w-8 h-8 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="Свернуть"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-mac-yellow hover:brightness-90 flex items-center justify-center group relative">
                  <span className="text-[8px] text-yellow-950 font-black opacity-0 group-hover:opacity-100 transition-opacity absolute">−</span>
                </div>
              </button>
            )}
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-mac-green opacity-70"></div>
            </div>
            {subtitle && (
              <span className="text-[10px] font-semibold text-slate-400 ml-1.5 tracking-wide max-sm:hidden">{subtitle}</span>
            )}
          </div>
          <div className="text-[11px] md:text-sm font-bold text-slate-200 truncate px-1.5">{title}</div>
          <div className="min-w-8 flex justify-end">{headerRight || <div className="w-3" />}</div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">{children}</div>
    </motion.div>
  );
};