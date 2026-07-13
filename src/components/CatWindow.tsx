import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cat, PlayerProfile } from '../types';
import { CatRenderer } from './CatRenderer';
import { X, Heart, Flame, Droplets, Bed, Award, PlusCircle } from 'lucide-react';
import { playPetSound, triggerHapticLight, triggerHapticMedium } from '../utils/audio';
import { INITIAL_SKINS } from '../hooks/useGameState';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface CatWindowProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  onInteract: (action: 'feed' | 'play' | 'clean' | 'sleep' | 'groom') => void;
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
  onInteract,
  onSelectCat,
  onClose,
  onMinimize,
  onAdoptClick,
  onPetClick,
}) => {
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [rightTab, setRightTab] = useState<'care' | 'grooming' | 'diary'>('care');

  const catStageRef = useRef<HTMLDivElement>(null);

  const FOODS = [
    { id: 'fish', name: 'Лосось', emoji: '🐟', color: 'from-sky-400 to-blue-500' },
    { id: 'meat', name: 'Стейк', emoji: '🥩', color: 'from-amber-500 to-red-600' },
    { id: 'milk', name: 'Молоко', emoji: '🍼', color: 'from-teal-300 to-sky-400' },
    { id: 'cake', name: 'Кекс', emoji: '🧁', color: 'from-pink-400 to-purple-500' },
  ];

  const handleFoodDragEnd = (foodId: string, event: any, info: any) => {
    if (activeCat.status === 'sleeping') return;
    
    // Get client viewport coordinates
    const dropX = info.point.x;
    const dropY = info.point.y;

    if (catStageRef.current) {
      const rect = catStageRef.current.getBoundingClientRect();
      // Generous 15px padding around the cat stage to make drag-and-drop extremely reliable
      const padding = 15;
      const isColliding = 
        dropX >= (rect.left - padding) && 
        dropX <= (rect.right + padding) && 
        dropY >= (rect.top - padding) && 
        dropY <= (rect.bottom + padding);

      if (isColliding) {
        feedCatWithFood(foodId);
        return;
      }
    }

    // Backup check using event client coordinates directly
    const eventX = event?.clientX || event?.changedTouches?.[0]?.clientX;
    const eventY = event?.clientY || event?.changedTouches?.[0]?.clientY;
    if (eventX !== undefined && eventY !== undefined && catStageRef.current) {
      const rect = catStageRef.current.getBoundingClientRect();
      const padding = 15;
      if (
        eventX >= (rect.left - padding) && 
        eventX <= (rect.right + padding) && 
        eventY >= (rect.top - padding) && 
        eventY <= (rect.bottom + padding)
      ) {
        feedCatWithFood(foodId);
      }
    }
  };

  const handleFoodClick = (foodId: string) => {
    if (activeCat.status === 'sleeping') return;
    feedCatWithFood(foodId);
  };

  const feedCatWithFood = (foodId: string) => {
    if (activeCat.hunger >= 100) {
      const newParticle = {
        id: Math.random().toString(),
        text: `${activeCat.name} сыт! 😾💤`,
        x: 100 + Math.random() * 80,
        y: 80 + Math.random() * 30,
      };
      setParticles((prev) => [...prev, newParticle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1500);
      return;
    }

    triggerHapticMedium();
    playPetSound();

    const foodItem = FOODS.find(f => f.id === foodId);
    const emoji = foodItem ? foodItem.emoji : '🐟';

    const isHungry = activeCat.personality === 'hungry';
    const xpGained = foodId === 'meat' ? 25 : foodId === 'cake' ? 18 : foodId === 'fish' ? 15 : 10;
    const pawsGained = foodId === 'meat' ? 7 : foodId === 'cake' ? 4 : foodId === 'fish' ? 5 : 3;
    const bonusXp = isHungry ? Math.round(xpGained * 1.3) : xpGained;
    const bonusPaws = isHungry ? Math.round(pawsGained * 1.3) : pawsGained;

    const newParticle = {
      id: Math.random().toString(),
      text: `Ам-ням! ${emoji} +${bonusXp} XP +${bonusPaws} 🐾`,
      x: 100 + Math.random() * 80,
      y: 80 + Math.random() * 30,
    };
    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1500);

    onInteract('feed');
  };

  // Груминг / Расческа
  const [brushProgress, setBrushProgress] = useState(0);
  const [isGroomingComplete, setIsGroomingComplete] = useState(false);
  const brushAreaRef = useRef<HTMLDivElement>(null);

  const handleBrushDrag = (event: any, info: any) => {
    if (isGroomingComplete || activeCat.status === 'sleeping') return;
    
    // Медленное заполнение при каждом перемещении
    setBrushProgress((prev) => {
      const next = prev + 0.8;
      if (next >= 100) {
        setIsGroomingComplete(true);
        triggerHapticMedium();
        onInteract('groom');
        return 100;
      }
      return next;
    });

    if (Math.random() < 0.12) {
      triggerHapticLight();
      playPetSound();
    }

    if (brushAreaRef.current && Math.random() < 0.35) {
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
  };

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    
    // Swipe down to minimize
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
      } else { // hungry
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

    // Каждые 55 пикселей непрерывного поглаживания засчитываются как полноценный жест
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

  const getActiveSkin = () => {
    const skin = INITIAL_SKINS.find((s) => s.id === activeCat.skinId);
    if (skin) {
      return { color: skin.color, patternColor: skin.patternColor, eyeColor: skin.eyeColor };
    }
    // Fallbacks
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

  const activeSkinColors = getActiveSkin();
  const nextLevelXp = activeCat.level * 100;
  const xpPercentage = Math.min(100, (activeCat.xp / nextLevelXp) * 100);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
      {/* 2. Main Windows Body */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Left column: Cat Selector list */}
        <div className="w-full md:w-52 bg-black/25 border-r max-md:border-b border-white/5 p-3 flex flex-col justify-between shrink-0 max-md:max-h-[135px]">
          <div className="min-h-0 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 max-md:hidden">
              Ваши питомцы
            </h3>
            
            <div className="space-y-1.5 overflow-y-auto pr-1 flex md:flex-col gap-1.5 max-md:flex-row max-md:w-full pb-1">
              {profile.cats.map((cat) => {
                const isSelected = cat.id === activeCat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCat(cat.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-left shrink-0 max-md:min-w-[120px] ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="text-lg">🐱</span>
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
          </div>

          <button
            onClick={onAdoptClick}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-sky-400/10 shadow-lg shadow-sky-500/10 max-md:absolute max-md:right-3 max-md:top-[115px] max-md:w-[130px] max-md:py-1.5"
          >
            <PlusCircle size={12} />
            <span>Приютить</span>
          </button>
        </div>

        {/* Right column: Active Pet Interactive Screen */}
        <div className="flex-1 flex flex-col overflow-y-auto relative p-3 md:p-5 bg-slate-950/40">
          
          {/* Sub-tab Switcher Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 shrink-0">
            <div className="flex gap-1.5 p-1 bg-black/35 rounded-xl border border-white/5">
              <button
                onClick={() => setRightTab('care')}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  rightTab === 'care'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Забота
              </button>
              <button
                onClick={() => setRightTab('grooming')}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  rightTab === 'grooming'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Расческа 🪮
              </button>
              <button
                onClick={() => setRightTab('diary')}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  rightTab === 'diary'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Дневник
              </button>
            </div>
            
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              Сытость: {Math.round(activeCat.hunger)}% | Счастье: {Math.round(activeCat.happiness)}%
            </div>
          </div>

          {/* Floating Reward Numbers and hearts */}
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
            <>
              {/* Central Stage viewport */}
              <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-6 relative min-h-[170px]">
                {/* The Cat Stage Frame (Clickable for petting) */}
                <div
                  ref={catStageRef}
                  id="cat-stage"
                  data-cat-stage="true"
                  onPointerDown={handlePetPointerDown}
                  onPointerMove={handlePetPointerMove}
                  onPointerUp={handlePetPointerUp}
                  className="relative bg-white/5 hover:bg-white/10 active:scale-98 transition-all border border-white/5 rounded-2xl w-36 h-36 md:w-44 md:h-44 flex flex-col items-center justify-center shadow-inner overflow-hidden cursor-pointer group select-none touch-none"
                  title="Гладьте котика зажатой мышкой/пальцем или кликайте!"
                >
                  <div className="absolute inset-0 bg-radial-gradient from-sky-500/10 to-transparent pointer-events-none" />
                  
                  <CatRenderer
                    breed={activeCat.breed}
                    color={activeSkinColors.color}
                    patternColor={activeSkinColors.patternColor}
                    eyeColor={activeSkinColors.eyeColor}
                    accessory={(activeCat as any).accessory}
                    status={activeCat.status}
                    size={140}
                    personality={activeCat.personality}
                  />
                  
                  <div className="absolute bottom-2 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-[9px] bg-black/75 text-sky-300 px-2 py-0.5 rounded-full font-bold">
                      Гладь! 💖
                    </span>
                  </div>
                </div>

                {/* Breed information and level details */}
                <div className="flex-1 max-w-sm flex flex-col justify-center text-center lg:text-left">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-medium text-slate-300 self-center lg:self-start">
                    <Award size={11} className="text-amber-400" />
                    <span>Порода: {activeCat.breed}</span>
                  </div>

                  <h2 className="text-lg md:text-xl font-black mt-2 text-white">
                    {activeCat.name}
                  </h2>
                  
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-xs">
                    {activeCat.status === 'sleeping' 
                      ? 'Котик сладко спит, восстанавливая энергию. В это время он принесет вам пассивные лапки благодаря волшебным кошачьим снам!' 
                      : 'Этот пушистый комочек обожает ваше внимание! Кликайте по нему, чтобы погладить, кормите, играйте и купайте.'}
                  </p>

                  {/* XP progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>Опыт (XP)</span>
                      <span>{activeCat.xp} / {nextLevelXp} XP</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Kitchen Cabinet Shelf */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center shrink-0 w-full lg:w-44 shadow-inner">
                  <span className="text-[8px] font-mono font-bold text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Flame size={10} className="text-orange-500 animate-pulse" />
                    Кухня (Тяни или Жми)
                  </span>
                  
                  <div className="grid grid-cols-4 lg:grid-cols-2 gap-1.5 w-full">
                    {FOODS.map((food) => (
                      <motion.div
                        key={food.id}
                        drag={activeCat.status !== 'sleeping'}
                        dragSnapToOrigin
                        onDragEnd={(event, info) => handleFoodDragEnd(food.id, event, info)}
                        onClick={() => handleFoodClick(food.id)}
                        className={`p-1.5 bg-gradient-to-br ${food.color} rounded-xl shadow-md border border-white/10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-all relative z-30 select-none ${
                          activeCat.status === 'sleeping' ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        whileHover={{ y: -2 }}
                      >
                        <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] select-none pointer-events-none">{food.emoji}</span>
                        <span className="text-[8px] font-black text-white mt-0.5 pointer-events-none">{food.name}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <span className="text-[7.5px] text-slate-400 mt-1.5 text-center leading-none">
                    {activeCat.status === 'sleeping' 
                      ? 'Котик спит 💤' 
                      : 'Перетащите котику в рот!'}
                  </span>
                </div>
              </div>

              {/* Core care buttons */}
              <div className="mt-4 border-t border-white/5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                <button
                  onClick={() => feedCatWithFood('fish')}
                  disabled={activeCat.status === 'sleeping'}
                  className="p-2 rounded-2xl bg-gradient-to-b from-orange-500/10 to-orange-500/20 hover:from-orange-500/20 hover:to-orange-500/30 border border-orange-500/15 text-orange-400 font-bold text-xs flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed group touch-manipulation min-h-[44px]"
                >
                  <div className="p-1.5 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                    <Flame size={12} />
                  </div>
                  <span className="text-[10px]">Кормить (🐟)</span>
                </button>

                <button
                  onClick={(e) => handleAction('play', e)}
                  disabled={activeCat.status === 'sleeping'}
                  className="p-2 rounded-2xl bg-gradient-to-b from-rose-500/10 to-rose-500/20 hover:from-rose-500/20 hover:to-rose-500/30 border border-rose-500/15 text-rose-400 font-bold text-xs flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed group touch-manipulation min-h-[44px]"
                >
                  <div className="p-1.5 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
                    <Heart size={12} />
                  </div>
                  <span className="text-[10px]">Играть (🎾)</span>
                </button>

                <button
                  onClick={(e) => handleAction('clean', e)}
                  disabled={activeCat.status === 'sleeping'}
                  className="p-2 rounded-2xl bg-gradient-to-b from-blue-500/10 to-blue-500/20 hover:from-blue-500/20 hover:to-blue-500/30 border border-blue-500/15 text-blue-400 font-bold text-xs flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed group touch-manipulation min-h-[44px]"
                >
                  <div className="p-1.5 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                    <Droplets size={12} />
                  </div>
                  <span className="text-[10px]">Мыть (🧼)</span>
                </button>

                <button
                  onClick={(e) => handleAction('sleep', e)}
                  className={`p-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer group touch-manipulation min-h-[44px] ${
                    activeCat.status === 'sleeping'
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-full text-white shadow-lg group-hover:scale-105 transition-transform ${
                    activeCat.status === 'sleeping'
                      ? 'bg-emerald-500 shadow-emerald-500/25'
                      : 'bg-indigo-600 shadow-indigo-500/25'
                  }`}>
                    <Bed size={12} />
                  </div>
                  <span className="text-[10px]">{activeCat.status === 'sleeping' ? 'Разбудить 🥱' : 'Усыпить 🛌'}</span>
                </button>
              </div>
            </>
          )}

          {rightTab === 'grooming' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-2">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-white">Вычесывание котика 🪮</h3>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                  {activeCat.status === 'sleeping'
                    ? 'Котик спит. Разбудите его, чтобы вычесать шёрстку!'
                    : 'Зажмите и перетаскивайте расчёску по телу котика, чтобы сделать его шёрстку шелковистой!'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                  <span>Шелковистость шёрстки</span>
                  <span className="font-bold text-sky-400">{Math.round(brushProgress)}%</span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${brushProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Brushing area stage */}
              <div
                ref={brushAreaRef}
                className="relative w-48 h-48 md:w-56 md:h-56 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-inner"
              >
                {/* Radial background glow */}
                <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-sky-500/5 to-transparent pointer-events-none" />

                {/* The Cat */}
                <div className="scale-95 md:scale-105 pointer-events-none select-none">
<CatRenderer
  breed={activeCat.breed}
  color={activeSkinColors.color}
  patternColor={activeSkinColors.patternColor}
  eyeColor={activeSkinColors.eyeColor}
  accessory={(activeCat as any).accessory}
  status={activeCat.status}
  size={window.innerWidth < 768 ? 180 : 140} // увеличиваем на мобильных
  personality={activeCat.personality}
/>
                </div>

                {/* Floating Comb Tool (Only when not sleeping) */}
                {activeCat.status !== 'sleeping' && !isGroomingComplete && (
                  <motion.div
                    drag
                    dragConstraints={brushAreaRef}
                    dragElastic={0.1}
                    onDrag={handleBrushDrag}
                    className="absolute w-12 h-12 rounded-full bg-slate-800 border-2 border-sky-400 shadow-2xl flex items-center justify-center text-xl cursor-grab active:cursor-grabbing hover:bg-slate-700 hover:scale-105 transition-colors z-40 active:scale-95 select-none"
                    style={{ x: 0, y: -40 }}
                  >
                    🪮
                  </motion.div>
                )}

                {/* Completed Badge overlay */}
                {isGroomingComplete && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2 z-50 animate-fade-in"
                  >
                    <span className="text-3xl animate-bounce">✨🪮✨</span>
                    <h4 className="text-xs font-black text-emerald-400">Идеальный груминг!</h4>
                    <p className="text-[9px] text-slate-300 leading-normal max-w-[150px]">
                      Шёрстка сияет чистотой, котик невероятно счастлив!
                    </p>
                    <button
                      onClick={() => {
                        triggerHapticLight();
                        setBrushProgress(0);
                        setIsGroomingComplete(false);
                      }}
                      className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-300 font-bold text-[10px] rounded-full transition-all active:scale-95 cursor-pointer mt-1"
                    >
                      Вычесать еще раз
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {rightTab === 'diary' && (
            /* DIARY TIMELINE TAB */
            <div className="flex-1 overflow-y-auto pr-1">
              {(() => {
                const catEvents = (profile.diary || []).filter(entry => entry.catId === activeCat.id);
                const sortedEvents = [...catEvents].sort((a, b) => b.timestamp - a.timestamp);

                if (sortedEvents.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 h-full">
                      <span className="text-4xl mb-3">📖</span>
                      <h4 className="text-xs font-extrabold text-slate-200">Дневник {activeCat.name} пуст</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal">
                        Заботьтесь о питомце, повышайте уровень, покупайте новые скины в магазине и ловите прыгающую рыбку, чтобы здесь появились памятные записи!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="relative border-l border-white/10 ml-4 pl-6 space-y-4 py-2">
                    {sortedEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative group"
                      >
                        {/* Timeline Circle Bubble */}
                        <div className="absolute -left-[35px] top-1 w-6.5 h-6.5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs shadow-md z-10">
                          {event.icon}
                        </div>

                        {/* Card Content in Apple news/timeline style */}
                        <div className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="text-[11px] font-extrabold text-slate-100">{event.title}</h4>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(event.timestamp).toLocaleString('ru-RU', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
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
      </div>
    </MacCatWindowFrame>
  );
};
