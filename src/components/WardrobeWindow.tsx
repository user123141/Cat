// src/components/WardrobeWindow.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skin, Cat, PlayerProfile } from '../types';
import { CatRenderer } from './CatRenderer';
import { X, Check, ShoppingBag, Eye, Heart, Palette, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';
import { ALL_SKINS_LIST } from '../game/constants';

interface WardrobeWindowProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  allSkins: Skin[];
  onApply: (catId: string, skinId: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  onOpenShop: () => void;
}

export const WardrobeWindow: React.FC<WardrobeWindowProps> = ({
  profile,
  activeCat,
  allSkins,
  onApply,
  onClose,
  onMinimize,
  onOpenShop,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hat' | 'glasses' | 'collar' | 'scarf' | 'boots' | 'wings' | 'skins'>('all');
  const [previewSkinId, setPreviewSkinId] = useState<string | null>(null);

  if (!profile || !activeCat) return null;

  // Фильтруем купленные товары
  const ownedItems = useMemo(() => {
    return ALL_SKINS_LIST.filter(skin => profile.unlockedSkins.includes(skin.id));
  }, [profile.unlockedSkins]);

  // Фильтруем по вкладкам
  const filteredItems = useMemo(() => {
    return ownedItems.filter(item => {
      if (activeTab === 'all') return true;
      if (activeTab === 'skins') return !item.accessory;
      if (activeTab === 'hat') return item.slot === 'hat' || (item.accessory && item.accessory.toLowerCase().match(/(hat|crown|halo|cap|shlyapa|kolpak)/));
      if (activeTab === 'glasses') return item.slot === 'glasses' || (item.accessory && item.accessory.toLowerCase().match(/(glasses|headphones|ochki|naushniki)/));
      if (activeTab === 'collar') return item.slot === 'collar' || (item.accessory && item.accessory.toLowerCase().match(/(collar|bell|ribbon|bow|osheynik|bantik)/));
      if (activeTab === 'scarf') return item.slot === 'scarf' || (item.accessory && item.accessory.toLowerCase().includes('scarf') || item.accessory && item.accessory.toLowerCase().includes('sharf'));
      if (activeTab === 'boots') return item.slot === 'boots' || (item.accessory && item.accessory.toLowerCase().match(/(boots|footwear|shoes|tapochki|sapozhki)/));
      if (activeTab === 'wings') return item.slot === 'wings' || (item.accessory && item.accessory.toLowerCase().match(/(wings|krylya)/));
      return false;
    });
  }, [ownedItems, activeTab]);

  // Проверка надетого товара
  const isItemEquipped = (item: Skin) => {
    if (!item.accessory) {
      return activeCat.skinId === item.id;
    }
    const acc = item.accessory;
    if (item.slot === 'hat') return activeCat.hat === acc;
    if (item.slot === 'glasses') return activeCat.glasses === acc;
    if (item.slot === 'collar') return activeCat.collar === acc;
    if (item.slot === 'scarf') return activeCat.scarf === acc;
    if (item.slot === 'boots') return activeCat.boots === acc;
    if (item.slot === 'wings') return activeCat.wings === acc;
    return activeCat.accessory === acc || activeCat.hat === acc || activeCat.glasses === acc || activeCat.collar === acc || activeCat.scarf === acc || activeCat.boots === acc || activeCat.wings === acc;
  };

  const activePreviewSkin = useMemo(() => {
    if (!previewSkinId) return null;
    return ALL_SKINS_LIST.find(s => s.id === previewSkinId) || null;
  }, [previewSkinId]);

  const handleApply = (itemId: string) => {
    triggerHaptic(30);
    onApply(activeCat.id, itemId);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'epic': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'rare': return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'Легендарный';
      case 'epic': return 'Эпический';
      case 'rare': return 'Редкий';
      default: return 'Обычный';
    }
  };

  // Получаем цвета кожи кота для рендерера
  const catColors = useMemo(() => {
    const baseSkin = ALL_SKINS_LIST.find(s => s.id === activeCat.skinId);
    const previewSkin = previewSkinId ? ALL_SKINS_LIST.find(s => s.id === previewSkinId) : null;
    const activeSkin = (previewSkin && !previewSkin.accessory) ? previewSkin : baseSkin;

    if (activeSkin) {
      return {
        breed: activeSkin.breed && activeSkin.breed !== 'All' ? activeSkin.breed : activeCat.breed,
        color: activeSkin.color || '#ffccd5',
        patternColor: activeSkin.patternColor || '#ff85a1',
        eyeColor: activeSkin.eyeColor || '#0ea5e9'
      };
    }

    return {
      breed: activeCat.breed || 'Standard',
      color: '#ffccd5',
      patternColor: '#ff85a1',
      eyeColor: '#0ea5e9'
    };
  }, [activeCat, previewSkinId]);

  // Сборка надетых аксессуаров для превью с учетом примерки
  const previewAccessories = useMemo(() => {
    const base = {
      hat: activeCat.hat,
      glasses: activeCat.glasses,
      collar: activeCat.collar,
      scarf: activeCat.scarf,
      boots: activeCat.boots,
      wings: activeCat.wings,
      accessory: activeCat.accessory
    };

    if (activePreviewSkin && activePreviewSkin.accessory) {
      const slot = activePreviewSkin.slot || 'accessory';
      return {
        ...base,
        [slot]: activePreviewSkin.accessory
      };
    }
    return base;
  }, [activeCat, activePreviewSkin]);

  return (
    <MacCatWindowFrame
      id="wardrobe"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Шкафчик Стиля"
      subtitle="Гардероб"
    >
      <div className="flex-1 flex flex-col md:flex-row bg-slate-900/60 overflow-hidden h-full">
        {/* Левая панель: Интерактивное превью котика */}
        <div className="w-full md:w-[280px] border-r border-white/10 p-4 flex flex-col items-center justify-between bg-black/25 shrink-0">
          <div className="w-full flex justify-between items-center mb-2">
            <div className="text-left">
              <div className="text-xs font-black text-white">{activeCat.name}</div>
              <div className="text-[10px] text-slate-400 font-medium">Порода: {activeCat.breed}</div>
            </div>
            <div className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Palette size={11} />
              Стиль
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 relative w-full">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent rounded-full filter blur-2xl pointer-events-none" />
            <CatRenderer
              breed={catColors.breed}
              color={catColors.color}
              patternColor={catColors.patternColor}
              eyeColor={catColors.eyeColor}
              hat={previewAccessories.hat}
              glasses={previewAccessories.glasses}
              collar={previewAccessories.collar}
              scarf={previewAccessories.scarf}
              boots={previewAccessories.boots}
              wings={previewAccessories.wings}
              accessory={previewAccessories.accessory}
              status="idle"
              size={170}
              staticPreview={true}
            />
          </div>

          <div className="w-full bg-white/5 border border-white/5 p-3 rounded-2xl space-y-2 mt-2">
            {activePreviewSkin ? (
              <div className="text-left space-y-1">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${getRarityBadge(activePreviewSkin.rarity)}`}>
                  {getRarityLabel(activePreviewSkin.rarity)}
                </span>
                <div className="text-xs font-bold text-white leading-tight">{activePreviewSkin.name}</div>
                <p className="text-[9px] text-slate-300 leading-normal">{activePreviewSkin.description}</p>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleApply(activePreviewSkin.id)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                      isItemEquipped(activePreviewSkin)
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    {isItemEquipped(activePreviewSkin) ? 'Снять ❌' : 'Надеть ✨'}
                  </button>
                  <button
                    onClick={() => setPreviewSkinId(null)}
                    className="px-2 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold transition-all"
                  >
                    Сбросить
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-[10px] text-slate-400 font-medium">Выберите вещь в гардеробе для примерки или смены образа.</p>
              </div>
            )}
          </div>
        </div>

        {/* Правая панель: Сетка вещей */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Вкладки */}
          <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-white/10 bg-black/15 shrink-0 no-scrollbar">
            {[
              { id: 'all', label: 'Всё' },
              { id: 'hat', label: '🎩 Голова' },
              { id: 'glasses', label: '👓 Глаза' },
              { id: 'collar', label: '🎗️ Шея' },
              { id: 'scarf', label: '🧣 Шарфы' },
              { id: 'boots', label: '🥾 Лапки' },
              { id: 'wings', label: '🦋 Крылья' },
              { id: 'skins', label: '🎨 Окрасы' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic(15);
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white border border-white/15 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Сетка вещей */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map(item => {
                  const equipped = isItemEquipped(item);
                  const isSelected = previewSkinId === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => setPreviewSkinId(item.id)}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between cursor-pointer border select-none group transition-all text-left ${
                        equipped
                          ? 'bg-rose-500/10 border-rose-500/40 shadow-inner'
                          : isSelected
                          ? 'bg-sky-500/15 border-sky-500/50 shadow-md'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {equipped && (
                        <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-0.5 z-10 shadow">
                          <Check size={8} strokeWidth={4} />
                        </span>
                      )}

                      {/* Иконка / Визуал вещи */}
                      <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden mb-2 relative">
                        {item.accessory ? (
                          <span className="text-2xl filter drop-shadow">
                            {item.accessory.toLowerCase().includes('hat') || item.accessory.toLowerCase().includes('crown') || item.accessory.toLowerCase().includes('cap') ? '🎩' :
                             item.accessory.toLowerCase().includes('glass') || item.accessory.toLowerCase().includes('headphone') ? '👓' :
                             item.accessory.toLowerCase().includes('collar') || item.accessory.toLowerCase().includes('bell') || item.accessory.toLowerCase().includes('bow') ? '🎗️' :
                             item.accessory.toLowerCase().includes('scarf') ? '🧣' :
                             item.accessory.toLowerCase().includes('boot') ? '🥾' :
                             item.accessory.toLowerCase().includes('wing') ? '🦋' : '🎀'}
                          </span>
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-dashed border-white/25 flex items-center justify-center">
                            <Palette size={14} className="text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Имя */}
                      <div className="w-full text-left mt-1">
                        <div className="text-[10px] font-bold text-white truncate leading-tight group-hover:text-pink-300 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[8px] text-slate-400 mt-0.5 truncate uppercase tracking-wider">
                          {getRarityLabel(item.rarity)}
                        </div>
                      </div>

                      {/* Быстрая кнопка применения */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(item.id);
                        }}
                        className={`mt-2 w-full py-1 rounded-xl text-[8px] font-black uppercase tracking-wider text-center transition-all ${
                          equipped
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-white/10 text-white hover:bg-pink-500 hover:text-white'
                        }`}
                      >
                        {equipped ? 'Снять' : 'Надеть'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-3xl">👗</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Здесь пока пусто</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Вы еще не приобрели вещи из этой категории. Посетите стильный магазин для покупок!</p>
                </div>
                <button
                  onClick={onOpenShop}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-[10px] rounded-xl active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <ShoppingBag size={12} />
                  В Магазин 🛍️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MacCatWindowFrame>
  );
};
