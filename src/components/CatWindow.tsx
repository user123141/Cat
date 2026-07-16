// src/components/CatWindow.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cat, PlayerProfile, Skin } from '../types';
import { CatRenderer } from './CatRenderer';
import { NeedsCatRenderer } from './NeedsCatRenderer';
import { Flame, Heart, Droplets, Bed, Award, PlusCircle } from 'lucide-react';
import { playPetSound, triggerHapticLight, triggerHapticMedium } from '../utils/audio';
import { INITIAL_SKINS } from '../hooks/useGameState';
import { MacCatWindowFrame } from './MacCatWindowFrame';

// ... остальной код полностью совпадает с предыдущей версией (он уже был полным)
// Просто заменяем импорт в самом верху.

interface CatWindowProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  allSkins: Skin[];
  onInteract: (action: 'feed' | 'play' | 'clean' | 'sleep' | 'groom' | string) => void;
  onSelectCat: (id: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  onAdoptClick: () => void;
  onPetClick: () => void;
}

interface ClickParticle {
  id: string;
  text: string;
  x: number;
  y: number;
}

export const CatWindow: React.FC<CatWindowProps> = ({
  profile,
  activeCat,
  allSkins,
  onInteract,
  onSelectCat,
  onClose,
  onMinimize,
  onAdoptClick,
  onPetClick,
}) => {
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [rightTab, setRightTab] = useState<'care' | 'diary'>('care');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const catStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [brushProgress, setBrushProgress] = useState(0);
  const [isGroomingComplete, setIsGroomingComplete] = useState(false);
  const brushAreaRef = useRef<HTMLDivElement>(null);
  const accumulatedDistance = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    if (rightTab !== 'grooming') {
      setBrushProgress(0);
      setIsGroomingComplete(false);
      accumulatedDistance.current = 0;
    }
  }, [rightTab, activeCat?.id]);

  const updateBrushProgress = useCallback((distance: number) => {
    accumulatedDistance.current += distance;
    const now = performance.now();
    if (now - lastUpdateTime.current > 50) {
      const totalDistance = accumulatedDistance.current;
      const progress = Math.min(100, (totalDistance / 300) * 100);
      setBrushProgress(progress);
      if (progress >= 100) {
        setIsGroomingComplete(true);
        triggerHapticMedium();
        onInteract('groom');
        accumulatedDistance.current = 0;
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        return;
      }
      lastUpdateTime.current = now;
    }
  }, [onInteract]);

  const handleBrushDrag = useCallback((event: any, info: any) => {
    if (isGroomingComplete || activeCat?.status === 'sleeping' || !brushAreaRef.current) return;

    const deltaX = info.delta.x;
    const deltaY = info.delta.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 1) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(() => {
      updateBrushProgress(distance);
    });

    if (Math.random() < 0.12) {
      triggerHapticLight();
      playPetSound();
    }

    if (brushAreaRef.current && Math.random() < 0.2) {
      const rect = brushAreaRef.current.getBoundingClientRect();
      const x = info.point.x - rect.left;
      const y = info.point.y - rect.top;
      const newSparkle = {
        id: Math.random().toString(),
        text: '✨',
        x: x - 10,
        y: y - 10,
      };
      setParticles((prev) => [...prev, newSparkle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newSparkle.id));
      }, 800);
    }
  }, [isGroomingComplete, activeCat?.status, updateBrushProgress]);

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    if (diffY > 100 && Math.abs(diffX) < 60) {
      onMinimize();
    }
  };

  if (!profile || !activeCat) return null;

  const handleAction = (action: 'feed' | 'play' | 'clean' | 'sleep', e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticMedium();
    let text = '';
    if (action === 'feed' && activeCat.hunger < 100) {
      const isHungry = activeCat.personality === 'hungry';
      text = isHungry ? '+20 XP ✨  +7 Лапок 🐾' : '+15 XP ✨  +5 Лапок 🐾';
    } else if (action === 'play' && activeCat.energy >= 15) {
      const isPlayful = activeCat.personality === 'playful';
      text = isPlayful ? '+25 XP ✨  +11 Лапок 🐾' : '+20 XP ✨  +8 Лапок 🐾';
    } else if (action === 'clean' && activeCat.cleanliness < 100) {
      const isLazy = activeCat.personality === 'lazy';
      text = isLazy ? '+14 XP ✨  +4 Лапок 🐾' : '+18 XP ✨  +6 Лапок 🐾';
    } else if (action === 'sleep') {
      text = activeCat.status === 'sleeping' ? 'Проснулся 🥱' : 'Спит 🛌';
    }

    if (text) {
      const newParticle = {
        id: Math.random().toString(),
        text,
        x: 100 + Math.random() * 80,
        y: 80 + Math.random() * 30,
      };
      setParticles((prev) => [...prev, newParticle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1500);
    }

    onInteract(action);
  };

  const isPettingRef = useRef(false);
  const lastPetPointRef = useRef<{ x: number; y: number } | null>(null);
  const petDistanceAccumulator = useRef(0);

  const spawnPhraseParticle = (clickX: number, clickY: number, isStroke = false) => {
    const personality = activeCat?.personality || 'lazy';
    let phrases: string[] = [];
    if (isStroke) {
      phrases = ['Оооо да... 💖', 'Так тепло... 🥰', 'Мур-мур-мур... ✨', 'Обожаю поглаживания! 🐾', 'Ещё-ещё! 💫'];
    } else {
      if (personality === 'lazy') {
        phrases = ['Муррр... сплю... 💤', 'Лееень~ 🥱', 'Хррр-мяу... 🥰', 'Почеши пузико... 🐾', 'Кайф~ 💤'];
      } else if (personality === 'playful') {
        phrases = ['Йохоу! Побегаем? 🎾', 'Мяу-мяу! Играть! ⚡', 'Кусь! Жепку кусь! 😼', 'Давай прыгать! 🐾', 'Ещё погладь! 💖'];
      } else {
        phrases = ['Дай рыбки! 🐟', 'Мяу-у-у, жрать! 🍖', 'Где мой корм? 🍼', 'Ам-ням! 🐾', 'Гладь, но лучше покорми! 🥩'];
      }
    }
    const randomText = phrases[Math.floor(Math.random() * phrases.length)];

    const newParticle = {
      id: Math.random().toString(),
      text: randomText,
      x: clickX - 40,
      y: clickY - 20,
    };

    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1200);
  };

  const handlePetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeCat.status === 'sleeping') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isPettingRef.current = true;
    lastPetPointRef.current = { x: e.clientX, y: e.clientY };
    petDistanceAccumulator.current = 0;

    triggerHapticLight();
    playPetSound();
    onPetClick();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    spawnPhraseParticle(clickX, clickY, false);
  };

  const handlePetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeCat.status === 'sleeping' || !isPettingRef.current || !lastPetPointRef.current) return;

    const dx = e.clientX - lastPetPointRef.current.x;
    const dy = e.clientY - lastPetPointRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    petDistanceAccumulator.current += distance;
    lastPetPointRef.current = { x: e.clientX, y: e.clientY };

    if (petDistanceAccumulator.current >= 55) {
      petDistanceAccumulator.current = 0;
      triggerHapticLight();
      playPetSound();
      onPetClick();

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      spawnPhraseParticle(clickX, clickY, true);
    }
  };

  const handlePetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isPettingRef.current = false;
    lastPetPointRef.current = null;
    petDistanceAccumulator.current = 0;
  };

  const getCatSkin = (cat: Cat) => {
    const skin = allSkins.find((s) => s.id === cat.skinId);
    if (skin) {
      return { color: skin.color, patternColor: skin.patternColor, eyeColor: skin.eyeColor };
    }
    if (cat.breed === 'Siamese') return { color: '#fef3c7', patternColor: '#78350f', eyeColor: '#06b6d4' };
    if (cat.breed === 'British Shorthair') return { color: '#64748b', patternColor: '#475569', eyeColor: '#f59e0b' };
    if (cat.breed === 'Sphynx') return { color: '#fda4af', patternColor: '#f43f5e', eyeColor: '#10b981' };
    if (cat.breed === 'Persian') return { color: '#fef08a', patternColor: '#eab308', eyeColor: '#a855f7' };
    if (cat.breed === 'Bombay') return { color: '#1e293b', patternColor: '#0f172a', eyeColor: '#f59e0b' };
    if (cat.breed === 'Bengal') return { color: '#f59e0b', patternColor: '#78350f', eyeColor: '#10b981' };
    if (cat.breed === 'Sakura Neko') return { color: '#fff1f2', patternColor: '#fda4af', eyeColor: '#ec4899' };
    if (cat.breed === 'Galaxy Cat') return { color: '#312e81', patternColor: '#6366f1', eyeColor: '#a855f7' };
    return { color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
  };

  const activeSkinColors = activeCat ? getCatSkin(activeCat) : { color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
  const nextLevelXp = activeCat.level * 100;
  const xpPercentage = Math.min(100, (activeCat.xp / nextLevelXp) * 100);

  return (
    <MacCatWindowFrame
      id="cats"
      onClose={onClose}
      onMinimize={onMinimize}
      title={activeCat.name}
      subtitle="Комната котиков"
      headerRight={
        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
          Уровень: <span className="text-sky-400 font-mono font-black">{activeCat.level}</span>
        </div>
      }
    >
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isMobile && (
          <div className="flex items-center gap-1 p-1.5 overflow-x-auto no-scrollbar border-b border-white/5 bg-black/10 shrink-0">
            {profile.cats.map((cat) => {
              const isSelected = cat.id === activeCat.id;
              const catColors = getCatSkin(cat);
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCat(cat.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl border-2 transition-all shrink-0 min-w-[52px] ${
                    isSelected
                      ? 'border-sky-400 bg-sky-500/10'
                      : 'border-transparent bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg bg-black/20">
                    <NeedsCatRenderer
                      status={cat.status}
                      hunger={cat.hunger}
                      happiness={cat.happiness}
                      cleanliness={cat.cleanliness}
                      energy={cat.energy}
                      breed={cat.breed}
                      color={catColors.color}
                      patternColor={catColors.patternColor}
                      eyeColor={catColors.eyeColor}
                      hat={cat.hat}
                      glasses={cat.glasses}
                      collar={cat.collar}
                      scarf={cat.scarf}
                      boots={cat.boots}
                      wings={cat.wings}
                      accessory={cat.accessory}
                      size={28}
                    />
                  </div>
                  <span className="text-[7px] font-bold text-slate-300 truncate max-w-[44px]">
                    {cat.name}
                  </span>
                  <span className="text-[6px] text-slate-400 font-mono">
                    {cat.level} ур.
                  </span>
                </button>
              );
            })}
            <button
              onClick={onAdoptClick}
              className="flex flex-col items-center justify-center p-1 rounded-xl border-2 border-dashed border-sky-400/30 bg-sky-500/5 min-w-[50px] shrink-0 transition hover:bg-sky-500/10"
            >
              <PlusCircle size={20} className="text-sky-400" />
              <span className="text-[6px] text-sky-400 font-bold">Приютить</span>
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {!isMobile && (
            <div className="w-52 bg-black/25 border-r border-white/5 p-3 flex flex-col justify-between shrink-0 md:h-auto overflow-y-auto">
              <div className="space-y-1.5">
                {profile.cats.map((cat) => {
                  const isSelected = cat.id === activeCat.id;
                  const catColors = getCatSkin(cat);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCat(cat.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-left w-full ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg bg-black/20 shrink-0">
                        <NeedsCatRenderer
                          status={cat.status}
                          hunger={cat.hunger}
                          happiness={cat.happiness}
                          cleanliness={cat.cleanliness}
                          energy={cat.energy}
                          breed={cat.breed}
                          color={catColors.color}
                          patternColor={catColors.patternColor}
                          eyeColor={catColors.eyeColor}
                          hat={cat.hat}
                          glasses={cat.glasses}
                          collar={cat.collar}
                          scarf={cat.scarf}
                          boots={cat.boots}
                          wings={cat.wings}
                          accessory={cat.accessory}
                          size={32}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate">{cat.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                          <span>{cat.level} ур.</span>
                          <span>•</span>
                          <span>{cat.status === 'sleeping' ? 'Спит' : 'Активен'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onAdoptClick}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-sky-400/10 shadow-lg shadow-sky-500/10 mt-2 shrink-0"
              >
                <PlusCircle size={12} />
                <span>Приютить</span>
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5 p-1.5 shrink-0">
              <div className="flex gap-1 p-1 bg-black/35 rounded-xl border border-white/5 flex-wrap">
                <button
                  onClick={() => setRightTab('care')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    rightTab === 'care'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Забота
                </button>
                <button
                  onClick={() => setRightTab('diary')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    rightTab === 'diary'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Дневник
                </button>
              </div>
              <div className="text-[9px] text-slate-500 font-mono hidden sm:block">
                Сытость: {Math.round(activeCat.hunger)}% | Счастье: {Math.round(activeCat.happiness)}%
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-slate-950/40 relative pb-16 md:pb-20">
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: p.y, scale: 0.8 }}
                    animate={{ opacity: 1, y: p.y - 40, scale: 1.1 }}
                    exit={{ opacity: 0, y: p.y - 70 }}
                    transition={{ duration: 1.0, ease: 'easeOut' }}
                    className="absolute text-xs font-bold text-amber-300 pointer-events-none drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)] z-40 bg-black/85 px-2.5 py-1 rounded-full border border-amber-500/20 font-mono"
                    style={{ left: p.x }}
                  >
                    {p.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              {rightTab === 'care' && (
                <div className="flex flex-col items-center justify-start gap-2 md:gap-3">
                  <div
                    ref={catStageRef}
                    onPointerDown={handlePetPointerDown}
                    onPointerMove={handlePetPointerMove}
                    onPointerUp={handlePetPointerUp}
                    className="relative bg-white/5 hover:bg-white/10 active:scale-98 transition-all border border-white/5 rounded-2xl flex flex-col items-center justify-center shadow-inner overflow-hidden cursor-pointer group select-none touch-none"
                    style={{ width: isMobile ? '140px' : '180px', height: isMobile ? '140px' : '180px' }}
                  >
                    <div className="absolute inset-0 bg-radial-gradient from-sky-500/10 to-transparent pointer-events-none" />
                    <CatRenderer
                      breed={activeCat.breed}
                      color={activeSkinColors.color}
                      patternColor={activeSkinColors.patternColor}
                      eyeColor={activeSkinColors.eyeColor}
                      hat={activeCat.hat}
                      glasses={activeCat.glasses}
                      collar={activeCat.collar}
                      scarf={activeCat.scarf}
                      boots={activeCat.boots}
                      wings={activeCat.wings}
                      accessory={activeCat.accessory}
                      status={activeCat.status}
                      size={isMobile ? 100 : 140}
                      personality={activeCat.personality}
                    />
                    <div className="absolute bottom-1 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[8px] bg-black/75 text-sky-300 px-1.5 py-0.5 rounded-full font-bold">
                        Гладь! 💖
                      </span>
                    </div>
                  </div>

                  <div className="w-full max-w-sm flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-medium text-slate-300">
                      <Award size={10} className="text-amber-400" />
                      <span>Порода: {activeCat.breed}</span>
                    </div>
                    <h2 className="text-base md:text-xl font-black mt-0.5 text-white">{activeCat.name}</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal max-w-xs">
                      {activeCat.status === 'sleeping' 
                        ? 'Котик сладко спит, восстанавливая энергию. В это время он принесет вам пассивные лапки благодаря волшебным кошачьим снам!' 
                        : 'Этот пушистый комочек обожает ваше внимание! Кликайте по нему, чтобы погладить, кормите, играйте и купайте.'}
                    </p>
                    <div className="w-full mt-1.5">
                      <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-0.5">
                        <span>Опыт (XP)</span>
                        <span>{activeCat.xp} / {nextLevelXp} XP</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <motion.div
                          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${xpPercentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {rightTab === 'grooming' && (
                <div className="flex flex-col items-center justify-start gap-3 py-2">
                  <div className="text-center space-y-0.5">
                    <h3 className="text-sm font-extrabold text-white">Вычесывание котика</h3>
                    <p className="text-[9px] text-slate-400 max-w-xs mx-auto leading-normal">
                      {activeCat.status === 'sleeping'
                        ? 'Котик спит. Разбудите его, чтобы вычесать шёрстку!'
                        : 'Зажмите и перетаскивайте расчёску по телу котика, чтобы сделать его шёрстку шелковистой!'}
                    </p>
                  </div>

                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-0.5">
                      <span>Шелковистость шёрстки</span>
                      <span className="font-bold text-sky-400">{Math.round(brushProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${brushProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>

                  <div
                    ref={brushAreaRef}
                    className="relative w-40 h-40 md:w-56 md:h-56 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-inner touch-none"
                  >
                    <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-sky-500/5 to-transparent pointer-events-none" />
                    <div className="scale-90 md:scale-105 pointer-events-none select-none">
                      <CatRenderer
                        breed={activeCat.breed}
                        color={activeSkinColors.color}
                        patternColor={activeSkinColors.patternColor}
                        eyeColor={activeSkinColors.eyeColor}
                        hat={activeCat.hat}
                        glasses={activeCat.glasses}
                        collar={activeCat.collar}
                        scarf={activeCat.scarf}
                        boots={activeCat.boots}
                        wings={activeCat.wings}
                        accessory={activeCat.accessory}
                        status={activeCat.status}
                        size={isMobile ? 120 : 140}
                        personality={activeCat.personality}
                      />
                    </div>

                    {activeCat.status !== 'sleeping' && !isGroomingComplete && (
                      <motion.div
                        drag
                        dragConstraints={brushAreaRef}
                        dragElastic={0.1}
                        onDrag={handleBrushDrag}
                        className="absolute w-10 h-10 rounded-full bg-slate-800 border-2 border-sky-400 shadow-2xl flex items-center justify-center text-[8px] font-bold text-sky-400 cursor-grab active:cursor-grabbing hover:bg-slate-700 hover:scale-105 transition-colors z-40 active:scale-95 select-none touch-none"
                        style={{ x: 0, y: -30 }}
                      >
                        ЩЁТКА
                      </motion.div>
                    )}

                    {isGroomingComplete && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center space-y-1.5 z-50 animate-fade-in"
                      >
                        <h4 className="text-xs font-black text-emerald-400">Идеальный груминг!</h4>
                        <p className="text-[8px] text-slate-300 leading-normal max-w-[130px]">
                          Шёрстка сияет чистотой, котик невероятно счастлив!
                        </p>
                        <button
                          onClick={() => {
                            triggerHapticLight();
                            setBrushProgress(0);
                            setIsGroomingComplete(false);
                            accumulatedDistance.current = 0;
                          }}
                          className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-300 font-bold text-[9px] rounded-full transition-all active:scale-95 cursor-pointer mt-0.5"
                        >
                          Вычесать еще раз
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {rightTab === 'diary' && (
                <div className="flex-1 overflow-y-auto pr-1">
                  {(() => {
                    const catEvents = (profile.diary || []).filter(entry => entry.catId === activeCat.id);
                    const sortedEvents = [...catEvents].sort((a, b) => b.timestamp - a.timestamp);

                    if (sortedEvents.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center text-center py-8 px-4 h-full">
                          <h4 className="text-xs font-extrabold text-slate-200">Дневник {activeCat.name} пуст</h4>
                          <p className="text-[9px] text-slate-400 max-w-xs mt-1 leading-normal">
                            Заботьтесь о питомце, повышайте уровень, покупайте новые скины в магазине и ловите прыгающую рыбку, чтобы здесь появились памятные записи!
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="relative border-l border-white/10 ml-4 pl-5 space-y-3 py-2">
                        {sortedEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative group"
                          >
                            <div className="absolute -left-[30px] top-1 w-5 h-5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] shadow-md z-10">
                              {event.icon}
                            </div>

                            <div className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                              <div className="flex justify-between items-start gap-1.5 mb-0.5">
                                <h4 className="text-[10px] font-extrabold text-slate-100">{event.title}</h4>
                                <span className="text-[8px] text-slate-400 font-mono">
                                  {new Date(event.timestamp).toLocaleString('ru-RU', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-300 leading-relaxed font-sans">
                                {event.description}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 grid grid-cols-4 gap-1.5 p-1.5 md:p-3 bg-slate-950/80 backdrop-blur-sm border-t border-white/5 z-10">
              <button
                onClick={(e) => handleAction('feed', e)}
                disabled={activeCat.status === 'sleeping'}
                className="p-1.5 rounded-xl bg-gradient-to-b from-orange-500/10 to-orange-500/20 hover:from-orange-500/20 hover:to-orange-500/30 border border-orange-500/15 text-orange-400 font-bold text-[9px] flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed group touch-manipulation"
              >
                <div className="p-1 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                  <Flame size={isMobile ? 12 : 16} />
                </div>
                <span className="text-[8px] md:text-[10px]">Кормить</span>
              </button>

              <button
                onClick={(e) => handleAction('play', e)}
                disabled={activeCat.status === 'sleeping'}
                className="p-1.5 rounded-xl bg-gradient-to-b from-rose-500/10 to-rose-500/20 hover:from-rose-500/20 hover:to-rose-500/30 border border-rose-500/15 text-rose-400 font-bold text-[9px] flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed group touch-manipulation"
              >
                <div className="p-1 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
                  <Heart size={isMobile ? 12 : 16} />
                </div>
                <span className="text-[8px] md:text-[10px]">Играть</span>
              </button>

              <button
                onClick={(e) => handleAction('clean', e)}
                disabled={activeCat.status === 'sleeping'}
                className="p-1.5 rounded-xl bg-gradient-to-b from-blue-500/10 to-blue-500/20 hover:from-blue-500/20 hover:to-blue-500/30 border border-blue-500/15 text-blue-400 font-bold text-[9px] flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed group touch-manipulation"
              >
                <div className="p-1 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <Droplets size={isMobile ? 12 : 16} />
                </div>
                <span className="text-[8px] md:text-[10px]">Мыть</span>
              </button>

              <button
                onClick={(e) => handleAction('sleep', e)}
                className={`p-1.5 rounded-xl border text-[9px] font-bold flex flex-col items-center gap-0.5 transition-all active:scale-95 cursor-pointer group touch-manipulation ${
                  activeCat.status === 'sleeping'
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-400'
                }`}
              >
                <div className={`p-1 rounded-full text-white shadow-lg group-hover:scale-105 transition-transform ${
                  activeCat.status === 'sleeping'
                    ? 'bg-emerald-500 shadow-emerald-500/25'
                    : 'bg-indigo-600 shadow-indigo-500/25'
                }`}>
                  <Bed size={isMobile ? 12 : 16} />
                </div>
                <span className="text-[8px] md:text-[10px]">{activeCat.status === 'sleeping' ? 'Встать' : 'Спать'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MacCatWindowFrame>
  );
};