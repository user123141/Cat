import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlayerProfile } from '../types';
import { Keyboard, Smile, Activity, Anchor } from 'lucide-react';
import { playPopSound, playKeyClickSound, startPurrSound, stopPurrSound, playWaterSplashSound } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface AntistressWindowProps {
  profile: PlayerProfile | null;
  onPopBurst: () => void;
  onKeyboardClick: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onAddPaws?: (amount: number, silent?: boolean) => void;
  onAddDiaryEntry?: (type: 'adopt' | 'level_up' | 'skin_unlocked' | 'rare_catch' | 'achievement', title: string, description: string, icon: string) => void;
}

export const AntistressWindow: React.FC<AntistressWindowProps> = ({
  profile,
  onPopBurst,
  onKeyboardClick,
  onClose,
  onMinimize,
  onAddPaws,
  onAddDiaryEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'popit' | 'keyboard' | 'purr' | 'fishing'>('popit');
  
  // 1. Pop It State
  const [popItGrid, setPopItGrid] = useState<boolean[]>(Array(36).fill(false));
  const [popItShape, setPopItShape] = useState<'square' | 'circle' | 'heart' | 'cat'>('square');

  const SHAPE_PATTERNS = {
    square: [
      true, true, true, true, true, true,
      true, true, true, true, true, true,
      true, true, true, true, true, true,
      true, true, true, true, true, true,
      true, true, true, true, true, true,
      true, true, true, true, true, true,
    ],
    circle: [
      false, true, true, true, true, false,
      true,  true, true, true, true, true,
      true,  true, true, true, true, true,
      true,  true, true, true, true, true,
      true,  true, true, true, true, true,
      false, true, true, true, true, false,
    ],
    heart: [
      false, true,  true,  false, true,  true,
      true,  true,  true,  true,  true,  true,
      true,  true,  true,  true,  true,  true,
      false, true,  true,  true,  true,  false,
      false, false, true,  true,  false, false,
      false, false, false, false, false, false,
    ],
    cat: [
      true,  false, false, false, false, true,
      true,  true,  false, false, true,  true,
      true,  true,  true,  true,  true,  true,
      false, true,  true,  true,  true,  false,
      false, true,  true,  true,  true,  false,
      false, false, true,  true,  false, false,
    ]
  };

  // 2. Keyboard State
  const keyboardKeys = [
    { code: 'Esc', label: 'Esc', width: 'w-10' },
    { code: 'KeyQ', label: 'Q', width: 'w-8' },
    { code: 'KeyW', label: 'W', width: 'w-8' },
    { code: 'KeyE', label: 'E', width: 'w-8' },
    { code: 'KeyR', label: 'R', width: 'w-8' },
    { code: 'KeyT', label: 'T', width: 'w-8' },
    { code: 'KeyY', label: 'Y', width: 'w-8' },
    { code: 'KeyA', label: 'A', width: 'w-8' },
    { code: 'KeyS', label: 'S', width: 'w-8' },
    { code: 'KeyD', label: 'D', width: 'w-8' },
    { code: 'KeyF', label: 'F', width: 'w-8' },
    { code: 'KeyG', label: 'G', width: 'w-8' },
    { code: 'Enter', label: 'Enter ⏎', width: 'w-16' },
    { code: 'Space', label: 'Space ───', width: 'w-36' },
  ];
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [kbBacklight, setKbBacklight] = useState<'cyan' | 'rgb' | 'sunset' | 'none'>('cyan');

  // 3. Purring State
  const [isPurring, setIsPurring] = useState(false);
  const [purrParticles, setPurrParticles] = useState<{ id: string; text: string; x: number; y: number }[]>([]);

  // Swipe gesture detection
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

  // Stop purr sound & fishing timers on unmount to prevent stuck audio or memory leaks
  useEffect(() => {
    return () => {
      stopPurrSound();
      if (fishingTimerRef.current) clearTimeout(fishingTimerRef.current);
      timeoutsListRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // 4. Fishing Game State & Logic
  const [fishingState, setFishingState] = useState<'idle' | 'casting' | 'nibble' | 'caught' | 'missed'>('idle');
  const [fishType, setFishType] = useState<{ name: string; icon: string; paws: number; rarity: 'common' | 'rare' | 'legendary' }>({ name: 'Карась', icon: '🐟', paws: 5, rarity: 'common' });
  const [isFishJumping, setIsFishJumping] = useState(false);
  const [successSplash, setSuccessSplash] = useState(false);
  
  const isInsideCatchZone = useRef(false);
  const fishingTimerRef = useRef<any>(null);
  const timeoutsListRef = useRef<any[]>([]);

  // 5. Brushing State & Web Audio Synthesizer
  const [combedZones, setCombedZones] = useState<{ [key: string]: boolean }>({
    head: false,
    back: false,
    tail: false,
    sideLeft: false,
    sideRight: false,
    tummy: false,
  });
  const [brushParticles, setBrushParticles] = useState<{ id: string; x: number; y: number }[]>([]);

  const playBrushSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const bufferSize = ctx.sampleRate * 0.12; // 120ms sound pulse
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1300; // soft combing friction
      filter.Q.value = 3.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      // Audio context blocked
    }
  };

  const handleBrushZone = (zoneId: string, event: React.MouseEvent | React.TouchEvent) => {
    if (combedZones[zoneId]) return;

    playBrushSound();

    setCombedZones((prev) => {
      const updated = { ...prev, [zoneId]: true };
      const allDone = Object.values(updated).every((v) => v === true);
      
      if (allDone) {
        if (onAddPaws) {
          onAddPaws(30, false);
        }
        if (onAddDiaryEntry && profile?.activeCatId) {
          onAddDiaryEntry('achievement', '🌟 Полный СПА-салон', 'Вы полностью расчесали шубку вашего любимого кота, сделав её шелковистой и блестящей!', '✨');
        }
      } else {
        if (onAddPaws) {
          onAddPaws(3, true);
        }
      }
      return updated;
    });

    // Extract coordinate
    let clientX = 0;
    let clientY = 0;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newPart = {
      id: Math.random().toString(),
      x: Math.max(10, Math.min(rect.width - 20, x)),
      y: Math.max(10, Math.min(rect.height - 20, y)),
    };
    setBrushParticles((prev) => [...prev, newPart]);
    setTimeout(() => {
      setBrushParticles((prev) => prev.filter((p) => p.id !== newPart.id));
    }, 1000);
  };

  const handleResetBrush = () => {
    playKeyClickSound();
    setCombedZones({
      head: false,
      back: false,
      tail: false,
      sideLeft: false,
      sideRight: false,
      tummy: false,
    });
  };

  const handleCastLine = () => {
    if (fishingState === 'casting' || fishingState === 'nibble') return;
    
    playKeyClickSound();
    setFishingState('casting');
    setIsFishJumping(false);
    isInsideCatchZone.current = false;
    
    // Clear old timeouts
    if (fishingTimerRef.current) clearTimeout(fishingTimerRef.current);
    timeoutsListRef.current.forEach(t => clearTimeout(t));
    timeoutsListRef.current = [];

    // Choose random fish type with customized rarity rates
    const roll = Math.random();
    let selectedFish: { name: string; icon: string; paws: number; rarity: 'common' | 'rare' | 'legendary' } = { 
      name: 'Карась', 
      icon: '🐟', 
      paws: 5, 
      rarity: 'common' 
    };
    if (roll > 0.9) {
      selectedFish = { name: 'Звёздный Осьминог', icon: '🐙', paws: 35, rarity: 'legendary' };
    } else if (roll > 0.65) {
      selectedFish = { name: 'Золотая Рыбка', icon: '🐠', paws: 15, rarity: 'rare' };
    }
    setFishType(selectedFish);

    const delay = 1500 + Math.random() * 2000;
    
    fishingTimerRef.current = setTimeout(() => {
      setFishingState('nibble');
      setIsFishJumping(true);
      
      const t1 = setTimeout(() => {
        isInsideCatchZone.current = true;
      }, 350);
      
      const t2 = setTimeout(() => {
        isInsideCatchZone.current = false;
      }, 950);
      
      const t3 = setTimeout(() => {
        setIsFishJumping(false);
        setFishingState('missed');
      }, 1400);

      timeoutsListRef.current = [t1, t2, t3];
    }, delay);
  };

  const handleCatchFish = () => {
    if (fishingState !== 'nibble') return;
    
    if (fishingTimerRef.current) clearTimeout(fishingTimerRef.current);
    timeoutsListRef.current.forEach(t => clearTimeout(t));
    timeoutsListRef.current = [];
    
    setIsFishJumping(false);

    if (isInsideCatchZone.current) {
      playWaterSplashSound();
      setFishingState('caught');
      setSuccessSplash(true);
      setTimeout(() => setSuccessSplash(false), 800);

      if (onAddPaws) {
        onAddPaws(fishType.paws);
      }
      
      if (onAddDiaryEntry && (fishType.rarity === 'rare' || fishType.rarity === 'legendary')) {
        const title = fishType.rarity === 'legendary' ? 'Легендарная добыча! 🐙' : 'Редкий улов! 🐠';
        const desc = `Во время расслабляющей спортивной рыбалки была поймана редчайшая рыба: ${fishType.name} (${fishType.icon})! Начислено бонусных лапок: +${fishType.paws} 🐾.`;
        onAddDiaryEntry('rare_catch', title, desc, fishType.icon);
      }
    } else {
      playKeyClickSound();
      setFishingState('missed');
    }
    isInsideCatchZone.current = false;
  };

  // Handle Pop It Bubble Tap
  const handlePopBubble = (index: number) => {
    playPopSound();
    const newGrid = [...popItGrid];
    newGrid[index] = !newGrid[index];
    setPopItGrid(newGrid);
    onPopBurst();
  };

  // Reset Pop It
  const handleResetPopIt = () => {
    playPopSound();
    setPopItGrid(Array(36).fill(false));
  };

  // Keyboard Click
  const handleKeyboardClick = (code: string) => {
    playKeyClickSound();
    setPressedKey(code);
    onKeyboardClick();
    setTimeout(() => {
      setPressedKey((p) => (p === code ? null : p));
    }, 120);
  };

  // Purr Handlers
  const handlePurrStart = () => {
    startPurrSound();
    setIsPurring(true);
  };

  const handlePurrStop = () => {
    stopPurrSound();
    setIsPurring(false);
  };

  // Periodically add purring particles if active
  useEffect(() => {
    if (!isPurring) return;

    const interval = setInterval(() => {
      const texts = ['Муррр~ 💕', 'Хррр... 💤', 'Кайф~ 🥰', 'Гррр... 🐾', 'Мило~ ❤️'];
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const newPart = {
        id: Math.random().toString(),
        text: randomText,
        x: 40 + Math.random() * 120,
        y: 60 + Math.random() * 40,
      };

      setPurrParticles((prev) => [...prev, newPart]);
      setTimeout(() => {
        setPurrParticles((prev) => prev.filter((p) => p.id !== newPart.id));
      }, 1500);
    }, 450);

    return () => clearInterval(interval);
  }, [isPurring]);

  // Bubble color mapping
  const getBubbleColorClass = (idx: number, isPopped: boolean) => {
    const row = Math.floor(idx / 6);
    if (isPopped) {
      return 'bg-slate-950/70 border-white/5 inset-shadow-sm scale-95';
    }
    
    switch (row) {
      case 0: return 'bg-gradient-to-b from-rose-400 to-rose-500 shadow-rose-500/25';
      case 1: return 'bg-gradient-to-b from-orange-400 to-orange-500 shadow-orange-500/25';
      case 2: return 'bg-gradient-to-b from-amber-400 to-amber-500 shadow-amber-500/25';
      case 3: return 'bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-emerald-500/25';
      case 4: return 'bg-gradient-to-b from-sky-400 to-sky-500 shadow-sky-500/25';
      default: return 'bg-gradient-to-b from-violet-400 to-violet-500 shadow-violet-500/25';
    }
  };

  // Backlight styles for keycap buttons
  const getKeyGlowClass = (code: string) => {
    const isPressed = pressedKey === code;
    
    if (kbBacklight === 'none') {
      return isPressed 
        ? 'translate-y-[2.5px] shadow-none border-sky-400 bg-sky-500/20 text-sky-300' 
        : 'text-slate-300 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_2.5px_0_#1e293b] active:translate-y-[2.5px] active:shadow-none';
    }
    
    if (isPressed) {
      if (kbBacklight === 'cyan') return 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_18px_#22d3ee] translate-y-[2.5px]';
      if (kbBacklight === 'rgb') return 'bg-pink-500/30 text-pink-200 border-pink-400 shadow-[0_0_18px_#f472b6] translate-y-[2.5px]';
      if (kbBacklight === 'sunset') return 'bg-orange-500/30 text-orange-200 border-orange-400 shadow-[0_0_18px_#fb923c] translate-y-[2.5px]';
    }

    if (kbBacklight === 'cyan') return 'border-cyan-500/30 text-slate-200 bg-slate-900 shadow-[0_1.5px_6px_rgba(34,211,238,0.2),_0_2.5px_0_rgba(15,23,42,0.8)] hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] hover:border-cyan-400 active:translate-y-[2.5px] active:shadow-none';
    if (kbBacklight === 'rgb') return 'border-pink-500/30 text-slate-200 bg-slate-900 shadow-[0_1.5px_6px_rgba(244,114,182,0.2),_0_2.5px_0_rgba(15,23,42,0.8)] hover:shadow-[0_0_12px_rgba(244,114,182,0.4)] hover:border-pink-400 active:translate-y-[2.5px] active:shadow-none';
    if (kbBacklight === 'sunset') return 'border-orange-500/30 text-slate-200 bg-slate-900 shadow-[0_1.5px_6px_rgba(251,146,60,0.2),_0_2.5px_0_rgba(15,23,42,0.8)] hover:shadow-[0_0_12px_rgba(251,146,60,0.4)] hover:border-orange-400 active:translate-y-[2.5px] active:shadow-none';
    
    return '';
  };

  const activePattern = SHAPE_PATTERNS[popItShape];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <MacCatWindowFrame
      id="antistress"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Антистресс Игрушки"
      subtitle="Антистресс"
    >
      {/* Tab selection bar */}
      <div className="bg-black/25 px-4 py-2 border-b border-white/5 flex flex-wrap items-center justify-center shrink-0 gap-2">
        <div className="flex flex-wrap gap-1.5 p-1 bg-black/35 rounded-xl border border-white/5 pointer-events-auto">
          <button
            onClick={() => setActiveTab('popit')}
            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'popit' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pop It
          </button>
          <button
            onClick={() => setActiveTab('keyboard')}
            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'keyboard' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Клавиатура
          </button>
          <button
            onClick={() => setActiveTab('purr')}
            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'purr' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Мурчалочка
          </button>
          <button
            onClick={() => setActiveTab('fishing')}
            className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'fishing' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Рыбалка
          </button>
        </div>
      </div>

      {/* 2. Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col justify-center items-center bg-slate-900/40">
        
        {/* TAB 1: POP IT */}
        {activeTab === 'popit' && (
          <div className="w-full max-w-xs space-y-4 flex flex-col items-center">
            <div className="flex justify-between w-full items-center">
              <div className="text-left">
                <h3 className="text-xs font-bold text-white flex items-center gap-1">
                  <Smile size={13} className="text-amber-400" />
                  Радужный Pop It
                </h3>
                <p className="text-[10px] text-slate-400">Лопнуто пупырок: <span className="font-bold text-sky-400 font-mono">{profile?.popItBurstedCount || 0}</span></p>
              </div>
              <button
                onClick={handleResetPopIt}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-extrabold border border-white/5 transition-all cursor-pointer active:scale-95"
              >
                Сбросить
              </button>
            </div>

            {/* Shape Selector */}
            <div className="flex gap-1 bg-black/25 p-1 rounded-xl border border-white/5 w-full justify-around">
              {[
                { id: 'square', label: '🟥 Квадрат' },
                { id: 'circle', label: '🟢 Круг' },
                { id: 'heart', label: '❤️ Сердце' },
                { id: 'cat', label: '🐱 Котик' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPopItShape(s.id as any)}
                  className={`flex-1 py-1.5 text-[9px] font-extrabold rounded-lg transition-all cursor-pointer ${
                    popItShape === s.id
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Pop It Board */}
            <div className="p-3 bg-black/45 rounded-3xl border border-white/5 grid grid-cols-6 gap-2 w-full aspect-square relative shadow-2xl">
              {popItGrid.map((isPopped, idx) => {
                const isVisible = activePattern[idx];
                if (!isVisible) {
                  return <div key={idx} className="w-full aspect-square opacity-0 pointer-events-none" />;
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handlePopBubble(idx)}
                    className={`w-full aspect-square rounded-full border cursor-pointer transition-all duration-75 flex items-center justify-center shadow-lg active:scale-90 ${getBubbleColorClass(idx, isPopped)}`}
                  >
                    <div className={`w-[55%] h-[55%] rounded-full border border-white/5 ${
                      isPopped ? 'bg-black/20' : 'bg-white/10'
                    }`} />
                  </button>
                );
              })}
            </div>

            <p className="text-[9px] text-slate-400 text-center italic">
              Приятные кликающие звуки без задержки. Каждые 35 лопнутых пупырок дают 1 лапку 🐾
            </p>
          </div>
        )}

        {/* TAB 2: CLICKY KEYBOARD */}
        {activeTab === 'keyboard' && (
          <div className="w-full max-w-sm space-y-4 flex flex-col items-center">
            <div className="text-center">
              <h3 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                <Keyboard size={13} className="text-sky-400" />
                Механическая клавиатура
              </h3>
              <p className="text-[10px] text-slate-400">Нажатий клавиатуры: <span className="font-bold text-sky-400 font-mono">{profile?.keyboardClicksCount || 0}</span></p>
            </div>

            {/* Backlight Selector */}
            <div className="flex gap-1.5 bg-black/25 p-1 rounded-xl border border-white/5 w-full justify-around">
              {[
                { id: 'cyan', label: '💎 Неон Синий' },
                { id: 'rgb', label: '🌈 RGB Волна' },
                { id: 'sunset', label: '🌅 Закат' },
                { id: 'none', label: '❌ Выкл' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setKbBacklight(b.id as any)}
                  className={`flex-1 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                    kbBacklight === b.id
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Keyboard Frame */}
            <div className="w-full p-4 bg-slate-950/75 rounded-2xl border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col gap-2.5">
              {/* Row 1 */}
              <div className="flex gap-2 justify-center">
                {keyboardKeys.slice(0, 7).map((key) => (
                  <button
                    key={key.code}
                    onClick={() => handleKeyboardClick(key.code)}
                    className={`h-9 ${key.width} rounded-lg flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer ${getKeyGlowClass(key.code)}`}
                  >
                    {key.label}
                  </button>
                ))}
              </div>

              {/* Row 2 */}
              <div className="flex gap-2 justify-center">
                {keyboardKeys.slice(7, 13).map((key) => (
                  <button
                    key={key.code}
                    onClick={() => handleKeyboardClick(key.code)}
                    className={`h-9 ${key.width} rounded-lg flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer ${getKeyGlowClass(key.code)}`}
                  >
                    {key.label}
                  </button>
                ))}
              </div>

              {/* Row 3 - Space */}
              <div className="flex gap-2 justify-center">
                {keyboardKeys.slice(13).map((key) => (
                  <button
                    key={key.code}
                    onClick={() => handleKeyboardClick(key.code)}
                    className={`h-9 ${key.width} rounded-lg flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer ${getKeyGlowClass(key.code)}`}
                  >
                    {key.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-slate-400 text-center italic">
              Реалистичный "clack" синих свитчей с вибрацией. Каждые 30 кликов дают 1 лапку 🐾
            </p>
          </div>
        )}

        {/* TAB 3: CAT PURR */}
        {activeTab === 'purr' && (
          <div className="w-full max-w-xs space-y-5 flex flex-col items-center text-center relative min-h-[220px]">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                <Activity size={13} className="text-rose-400 animate-pulse" />
                Терапевтическое Мурчание
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal px-4">
                Зажмите и удерживайте большую лапку котика, чтобы запустить глубокий вибро-звук мурчания. Полный релакс!
              </p>
            </div>

            {/* Flying Purr Particles */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <AnimatePresence>
                {purrParticles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8, x: p.x, y: p.y }}
                    animate={{ opacity: 1, scale: 1.2, y: p.y - 70 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    className="absolute text-xs font-bold font-mono text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] bg-black/60 px-2 py-0.5 rounded-full border border-rose-500/10"
                  >
                    {p.text}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* Giant Purr Button */}
            <button
              onMouseDown={handlePurrStart}
              onMouseUp={handlePurrStop}
              onMouseLeave={handlePurrStop}
              onTouchStart={(e) => {
                e.preventDefault();
                handlePurrStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handlePurrStop();
              }}
              className={`w-32 h-32 rounded-full border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl relative group ${
                isPurring 
                  ? 'bg-rose-500/25 border-rose-500 scale-95 shadow-rose-500/10 animate-pulse' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Animated rings */}
              {isPurring && (
                <div className="absolute inset-0 rounded-full border-2 border-rose-400/30 animate-ping pointer-events-none" />
              )}
              
              <span className={`text-4xl transition-transform ${isPurring ? 'scale-110' : 'group-hover:scale-105'}`}>
                🐈
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                {isPurring ? 'Муррчу...' : 'ЗАЖАТЬ'}
              </span>
            </button>

            <p className="text-[9px] text-slate-400">
              Идеальный терапевтический инструмент для успокоения ума. Наслаждайтесь пульсирующей вибрацией.
            </p>
          </div>
        )}

        {/* TAB 4: FISHING MINI-GAME */}
        {activeTab === 'fishing' && (
          <div className="w-full max-w-xs space-y-4 flex flex-col items-center">
            <div className="text-center">
              <h3 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                <Anchor size={13} className="text-sky-400 animate-pulse" />
                Спортивная Рыбалка
              </h3>
              <p className="text-[10px] text-slate-400">
                Закиньте удочку и вовремя нажмите кнопку или кликните прямо по прыгающей рыбке, когда она окажется в зеленой зоне!
              </p>
            </div>

            <div className="relative w-full aspect-square max-h-[200px] bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
              {/* Blue pool gradient */}
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-sky-500/20 to-sky-400/5 border-t border-sky-400/20" />
              
              {/* Target catch zone */}
              <div className="absolute inset-x-4 top-[30%] bottom-[30%] border border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-xl flex items-center justify-center">
                <span className="text-[8px] text-emerald-400 uppercase tracking-widest font-mono font-bold">Зона улова (КЛИК)</span>
              </div>

              {/* Waiting animation */}
              {fishingState === 'casting' && (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.0 }}
                  className="text-2xl"
                >
                  🎣
                </motion.div>
              )}

              {/* Jumping fish */}
              <AnimatePresence>
                {isFishJumping && (
                  <motion.div
                    initial={{ y: 70, scale: 0.8 }}
                    animate={{ y: [-20, -100, 50], scale: [0.9, 1.2, 0.9] }}
                    exit={{ y: 80, scale: 0.5 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="absolute text-4xl cursor-pointer select-none"
                    onClick={handleCatchFish}
                  >
                    {fishType.icon}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Splash effect */}
              {successSplash && (
                <motion.div
                  initial={{ scale: 0.2, opacity: 1 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  className="absolute text-3xl pointer-events-none text-sky-400"
                >
                  💦
                </motion.div>
              )}

              {/* Game state message overlay */}
              <div className="absolute top-2 inset-x-0 text-center">
                {fishingState === 'idle' && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">Удочка готова</span>
                )}
                {fishingState === 'casting' && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold animate-pulse">Заброс... Ждите поклёвку! 🎣</span>
                )}
                {fishingState === 'nibble' && (
                  <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-black animate-bounce">🚨 КЛЮЕТ! ТЯНИ! 🚨</span>
                )}
                {fishingState === 'caught' && (
                  <span className="text-[10px] bg-yellow-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black">🎉 {fishType.icon} {fishType.name} (+{fishType.paws} 🐾)</span>
                )}
                {fishingState === 'missed' && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">Сорвалась! 💧 Ещё раз?</span>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={fishingState === 'nibble' ? handleCatchFish : handleCastLine}
              disabled={fishingState === 'casting'}
              className={`w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                fishingState === 'nibble'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 animate-pulse'
                  : 'bg-sky-500 hover:bg-sky-600 text-white'
              }`}
            >
              {fishingState === 'nibble' ? '🎣 Поймать!' : 'Забросить удочку 🎣'}
            </button>
          </div>
        )}

        {/* TAB 5: BRUSHING REMOVED */}
        {false && (
          <div className="w-full max-w-sm space-y-4 flex flex-col items-center text-center">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                <span>🪄</span>
                Кошачья Расчёска
              </h3>
              <p className="text-[10px] text-slate-400">
                Почешите котика в разных местах! Нажмите или погладьте каждую зону, чтобы сделать шёрстку идеальной.
              </p>
            </div>

            {/* Brushing Arena */}
            <div 
              className="relative w-full h-[220px] bg-slate-950/60 rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center p-4 select-none touch-none"
            >
              {/* Render Brush Particles */}
              {brushParticles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, scale: 0.5, y: p.y, x: p.x }}
                  animate={{ opacity: 0, scale: 1.5, y: p.y - 30 }}
                  transition={{ duration: 0.8 }}
                  className="absolute pointer-events-none text-amber-300 text-xs z-30 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                >
                  ✨
                </motion.span>
              ))}

              {/* The Cat Figure Layout */}
              <div className="relative w-full max-w-[240px] h-full flex flex-col items-center justify-center">
                {/* Cat head emoji & zone */}
                <div className="flex flex-col items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => handleBrushZone('head', e)}
                    onTouchStart={(e) => handleBrushZone('head', e)}
                    onClick={(e) => handleBrushZone('head', e)}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                      combedZones.head 
                        ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">🐱</span>
                    {combedZones.head && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                    <span className="absolute bottom-1 text-[7px] uppercase tracking-widest text-slate-400 font-bold">Голова</span>
                  </motion.button>
                </div>

                {/* Body & sides */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Left Side */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => handleBrushZone('sideLeft', e)}
                    onTouchStart={(e) => handleBrushZone('sideLeft', e)}
                    onClick={(e) => handleBrushZone('sideLeft', e)}
                    className={`relative w-12 h-16 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                      combedZones.sideLeft 
                        ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">🫲</span>
                    {combedZones.sideLeft && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                    <span className="absolute bottom-1 text-[7px] uppercase tracking-widest text-slate-400 font-bold font-semibold">Л. Бок</span>
                  </motion.button>

                  {/* Back / Tummy column */}
                  <div className="flex flex-col gap-1.5">
                    {/* Back */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={(e) => handleBrushZone('back', e)}
                      onTouchStart={(e) => handleBrushZone('back', e)}
                      onClick={(e) => handleBrushZone('back', e)}
                      className={`relative w-16 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        combedZones.back 
                          ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">🐈</span>
                      {combedZones.back && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                      <span className="absolute bottom-1 text-[7px] uppercase tracking-widest text-slate-400 font-bold font-semibold font-semibold">Спинка</span>
                    </motion.button>

                    {/* Tummy */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={(e) => handleBrushZone('tummy', e)}
                      onTouchStart={(e) => handleBrushZone('tummy', e)}
                      onClick={(e) => handleBrushZone('tummy', e)}
                      className={`relative w-16 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        combedZones.tummy 
                          ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl font-bold">🤍</span>
                      {combedZones.tummy && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                      <span className="absolute bottom-1 text-[7px] uppercase tracking-widest text-slate-400 font-bold font-semibold">Пузико</span>
                    </motion.button>
                  </div>

                  {/* Right Side */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => handleBrushZone('sideRight', e)}
                    onTouchStart={(e) => handleBrushZone('sideRight', e)}
                    onClick={(e) => handleBrushZone('sideRight', e)}
                    className={`relative w-12 h-16 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                      combedZones.sideRight 
                        ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">🫱</span>
                    {combedZones.sideRight && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                    <span className="absolute bottom-1 text-[7px] uppercase tracking-widest text-slate-400 font-bold font-semibold">П. Бок</span>
                  </motion.button>
                </div>

                {/* Tail below */}
                <div className="mt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => handleBrushZone('tail', e)}
                    onTouchStart={(e) => handleBrushZone('tail', e)}
                    onClick={(e) => handleBrushZone('tail', e)}
                    className={`relative w-28 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                      combedZones.tail 
                        ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">〰️</span>
                    {combedZones.tail && <span className="absolute -top-1 -right-1 text-[10px]">✨</span>}
                    <span className="absolute bottom-0.5 text-[7px] uppercase tracking-widest text-slate-400 font-bold font-semibold">Хвостик</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 w-full">
              <button
                onClick={handleResetBrush}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase text-white transition-all active:scale-95 cursor-pointer"
              >
                Сбросить шёрстку
              </button>
            </div>
            
            <p className="text-[9px] text-slate-400">
              Погладьте/расчешите все 6 зон, чтобы котик засиял! Каждая расчесанная зона дает 3 🐾, а полный спа-салон — 30 🐾!
            </p>
          </div>
        )}

      </div>
    </MacCatWindowFrame>
  );
};
