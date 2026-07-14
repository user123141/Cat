// src/components/DynamicIsland.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Sparkles, Star, Bell } from 'lucide-react';
import { NotificationItem } from '../types';

interface DynamicIslandProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  notifications,
  onDismiss,
}) => {
  const activeNotification = notifications[0];
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeNotification) {
      setIsExpanded(true);
      const timer = setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => {
          onDismiss(activeNotification.id);
        }, 500);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(false);
    }
  }, [activeNotification, onDismiss]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-emerald-400" />;
      case 'warning':
        return <AlertCircle size={16} className="text-amber-400" />;
      case 'paw':
        return <Sparkles size={16} className="text-sky-400 animate-pulse" />;
      default:
        return <Star size={16} className="text-purple-400" />;
    }
  };

  const expandedWidth = isMobile ? 'min(90vw, 340px)' : '380px';
  const collapsedWidth = isMobile ? 'min(30vw, 120px)' : '150px';

  return (
    <div className="relative flex justify-center pointer-events-none select-none z-50 w-full px-2">
      <AnimatePresence mode="wait">
        {activeNotification ? (
          <motion.div
            key={activeNotification.id}
            initial={{ scale: 0.9, y: 10, opacity: 0 }}
            animate={{
              scale: 1,
              y: isMobile ? 24 : 14,
              opacity: 1,
              width: isExpanded ? expandedWidth : collapsedWidth,
              height: isExpanded ? 'auto' : '28px',
              borderRadius: isExpanded ? '24px' : '999px',
            }}
            exit={{ scale: 0.9, y: 10, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 22,
            }}
            className="pointer-events-auto bg-black text-white shadow-2xl overflow-hidden px-4 py-3 flex items-start gap-3 border border-neutral-800"
            style={{ originX: 0.5, originY: 0, maxWidth: '100%' }}
          >
            {isExpanded ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 w-full min-w-0"
              >
                <div className="p-2 rounded-full bg-neutral-900 border border-neutral-800 flex-shrink-0 mt-0.5">
                  {getIcon(activeNotification.type)}
                </div>
                <div className="flex-grow min-w-0 pr-1">
                  <h4 className="text-xs font-semibold text-neutral-100 tracking-wide leading-tight break-words">
                    {activeNotification.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug break-words">
                    {activeNotification.message}
                  </p>
                </div>
                {notifications.length > 1 && (
                  <div className="text-[9px] font-mono font-bold bg-sky-500 text-white rounded-full px-1.5 py-0.5 flex-shrink-0 animate-bounce">
                    +{notifications.length - 1}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full h-full text-[10px] text-neutral-400 font-medium">
                <Bell size={10} className="text-sky-400 animate-swing" />
                <span className="truncate">Событие...</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ width: '115px', height: '28px', borderRadius: '999px', opacity: 0.8 }}
            animate={{ width: '115px', height: '28px', borderRadius: '999px', opacity: 1 }}
            className="pointer-events-auto bg-black text-white shadow-2xl flex items-center justify-center gap-2 border border-white/10 px-3 py-1 font-sans text-xs font-bold tracking-tight hover:scale-102 transition-transform"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-white/25 font-light">|</span>
            <span className="text-white font-semibold tracking-wide font-mono text-[11px]">{timeStr}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};