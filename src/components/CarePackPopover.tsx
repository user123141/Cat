// src/components/CarePackPopover.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Heart, Droplets, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { PlayerProfile, Cat } from '../types';
import { CONSUMABLE_ITEMS } from '../hooks/useGameState';
import { triggerHapticLight, triggerHapticMedium } from '../utils/audio';

interface CarePackPopoverProps {
  isOpen: boolean;
  category: 'food' | 'toy' | 'soap' | null;
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  onClose: () => void;
  onUseItem: (itemId: string) => void;
  onBuyItem: (itemId: string) => void;
  onOpenShop: () => void;
}

export const CarePackPopover: React.FC<CarePackPopoverProps> = ({
  isOpen,
  category,
  profile,
  activeCat,
  onClose,
  onUseItem,
  onBuyItem,
  onOpenShop,
}) => {
  if (!isOpen || !category || !profile || !activeCat) return null;

  // Filter items based on active category
  const items = CONSUMABLE_ITEMS.filter((item) => item.type === category);

  // Category specific headers and visual colors
  const config = {
    food: {
      title: 'Кухня и Лакомства',
      subtitle: 'Покормите вашего любимца',
      icon: <Flame className="text-orange-500 animate-pulse" size={18} />,
      colorTheme: 'from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-400',
      actionBtnClass: 'bg-orange-500 hover:bg-orange-600 text-white',
      badgeClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      metricLabel: 'Сытость',
      activeStat: activeCat.hunger,
    },
    toy: {
      title: 'Игрушки и Игры',
      subtitle: 'Развеселите вашего котика',
      icon: <Heart className="text-rose-500 animate-pulse" size={18} />,
      colorTheme: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400',
      actionBtnClass: 'bg-rose-500 hover:bg-rose-600 text-white',
      badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      metricLabel: 'Радость',
      activeStat: activeCat.happiness,
    },
    soap: {
      title: 'Ванная и Чистота',
      subtitle: 'Искупайте вашего котика в пенке',
      icon: <Droplets className="text-blue-500 animate-pulse" size={18} />,
      colorTheme: 'from-blue-500/10 to-sky-500/10 border-blue-500/20 text-blue-400',
      actionBtnClass: 'bg-blue-500 hover:bg-blue-600 text-white',
      badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      metricLabel: 'Чистота',
      activeStat: activeCat.cleanliness,
    },
  }[category];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full sm:max-w-md bg-slate-900 border-t sm:border border-white/10 rounded-t-[30px] sm:rounded-[24px] shadow-2xl overflow-hidden text-slate-100 font-sans p-4 space-y-4 pointer-events-auto"
        >
          {/* Top handle bar for mobile pull down look */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-1 sm:hidden" onClick={onClose} />

          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-left">
              <div className="p-2 rounded-xl bg-white/5">
                {config.icon}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{config.title}</h3>
                <p className="text-[10px] text-slate-400">{config.subtitle}</p>
              </div>
            </div>

            <button
              onClick={() => { triggerHapticLight(); onClose(); }}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Stat summary */}
          <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Состояние {activeCat.name}:</span>
              <span className="text-xs font-black text-white">{config.metricLabel} {Math.round(config.activeStat)}%</span>
            </div>
            <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  config.activeStat < 35 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                }`}
                style={{ width: `${config.activeStat}%` }}
              />
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto no-scrollbar py-1">
            {items.map((item) => {
              const qty = profile.inventory?.[item.id] || 0;
              const hasItem = qty > 0;
              const canAfford = profile.paws >= item.cost;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    hasItem 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-black/25 border-white/5 opacity-80'
                  }`}
                >
                  {/* Left part: icon & details */}
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center text-2xl border border-white/5 shrink-0 relative select-none">
                      {item.emoji}
                      {hasItem && (
                        <span className="absolute -top-1.5 -right-1.5 font-mono font-black text-[9px] px-1.5 py-0.5 bg-sky-500 text-white rounded-full">
                          {qty}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[11px] font-bold text-white truncate">{item.name}</h4>
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded font-mono ${
                          item.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                          item.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                          item.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                          'bg-slate-500/20 text-slate-400 border border-slate-500/10'
                        }`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{item.description}</p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[8px] font-bold font-mono px-1 py-0.2 bg-white/5 text-slate-300 rounded">
                          +{item.boost} {config.metricLabel}
                        </span>
                        <span className="text-[8px] font-bold font-mono px-1 py-0.2 bg-white/5 text-slate-300 rounded">
                          +{item.xpBoost} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right part: action buttons */}
                  <div className="shrink-0">
                    {hasItem ? (
                      <button
                        onClick={() => {
                          triggerHapticMedium();
                          onUseItem(item.id);
                        }}
                        disabled={activeCat.status === 'sleeping'}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                          activeCat.status === 'sleeping'
                            ? 'bg-neutral-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-md shadow-emerald-500/10'
                        }`}
                      >
                        {activeCat.status === 'sleeping' ? 'Спит' : 'Дать'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!canAfford) {
                            triggerHapticLight();
                            onOpenShop();
                            onClose();
                            return;
                          }
                          triggerHapticMedium();
                          onBuyItem(item.id);
                        }}
                        className={`px-2.5 py-1.5 text-[9px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 active:scale-95'
                            : 'bg-neutral-800 text-slate-400 border border-white/5 hover:bg-neutral-700'
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <span>Купить за</span>
                            <span className="font-mono text-amber-400">{item.cost} 🐾</span>
                          </>
                        ) : (
                          <>
                            <span>Купить 🐾</span>
                            <span className="font-mono text-rose-400">({item.cost})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Buy Info */}
          <div className="bg-slate-950/20 p-2.5 rounded-2xl text-center flex items-center justify-between border border-white/5 text-[9px]">
            <span className="text-slate-400">Ваш баланс: <strong className="text-amber-400 font-mono font-bold">🐾 {profile.paws}</strong></span>
            <button
              onClick={() => { triggerHapticLight(); onOpenShop(); onClose(); }}
              className="text-sky-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <ShoppingBag size={10} />
              <span>Перейти в магазин 🛍️</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
