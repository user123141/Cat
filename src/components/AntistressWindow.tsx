import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { Keyboard, Smile } from 'lucide-react';
import { playPopSound, playKeyClickSound, triggerHapticLight } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface AntistressWindowProps {
  profile: PlayerProfile | null;
  onPopBurst: () => void;
  onKeyboardClick: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onAddPaws?: (amount: number, silent?: boolean) => void;
}

export const AntistressWindow: React.FC<AntistressWindowProps> = ({
  profile,
  onPopBurst,
  onKeyboardClick,
  onClose,
  onMinimize,
  onAddPaws,
}) => {
  const [activeTab, setActiveTab] = useState<'popit' | 'keyboard'>('popit');

  // Pop It State
  const [popItGrid, setPopItGrid] = useState<boolean[]>(Array(36).fill(false));
  const [popItShape, setPopItShape] = useState<'square' | 'circle' | 'heart' | 'cat'>('square');

  const SHAPE_PATTERNS = {
    square: Array(36).fill(true),
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

  // Keyboard State
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

  const activePattern = SHAPE_PATTERNS[popItShape];

  // Swipe gesture
  let touchStartX = 0;
  let touchStartY = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (diffY > 100 && Math.abs(diffX) < 60) {
      onMinimize();
    }
  };

  const handlePopBubble = (index: number) => {
    playPopSound();
    const newGrid = [...popItGrid];
    newGrid[index] = !newGrid[index];
    setPopItGrid(newGrid);
    onPopBurst();

    // Каждые 35 кликов даем лапку (логика остаётся)
    const poppedCount = newGrid.filter(v => v).length;
    if (poppedCount % 35 === 0 && poppedCount > 0 && onAddPaws) {
      onAddPaws(1, false);
    }
  };

  const handleResetPopIt = () => {
    playPopSound();
    setPopItGrid(Array(36).fill(false));
  };

  const handleKeyboardClick = (code: string) => {
    playKeyClickSound();
    setPressedKey(code);
    onKeyboardClick();

    // Каждые 30 кликов даем лапку
    if (profile && profile.keyboardClicksCount % 30 === 0 && profile.keyboardClicksCount > 0 && onAddPaws) {
      onAddPaws(1, false);
    }

    setTimeout(() => {
      setPressedKey((p) => (p === code ? null : p));
    }, 120);
  };

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

  return (
    <MacCatWindowFrame
      id="antistress"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Антистресс Игрушки"
      subtitle="Антистресс"
    >
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
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col justify-center items-center bg-slate-900/40">
        
        {/* TAB: POP IT */}
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

            <div className="flex gap-1 bg-black/25 p-1 rounded-xl border border-white/5 w-full justify-around">
              {[
                { id: 'square', label: 'Квадрат' },
                { id: 'circle', label: 'Круг' },
                { id: 'heart', label: 'Сердце' },
                { id: 'cat', label: 'Котик' },
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
              Приятные кликающие звуки. Каждые 35 лопнутых пупырок дают 1 лапку 🐾
            </p>
          </div>
        )}

        {/* TAB: KEYBOARD */}
        {activeTab === 'keyboard' && (
          <div className="w-full max-w-sm space-y-4 flex flex-col items-center">
            <div className="text-center">
              <h3 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                <Keyboard size={13} className="text-sky-400" />
                Механическая клавиатура
              </h3>
              <p className="text-[10px] text-slate-400">Нажатий клавиатуры: <span className="font-bold text-sky-400 font-mono">{profile?.keyboardClicksCount || 0}</span></p>
            </div>

            <div className="flex gap-1.5 bg-black/25 p-1 rounded-xl border border-white/5 w-full justify-around">
              {[
                { id: 'cyan', label: 'Неон Синий' },
                { id: 'rgb', label: 'RGB Волна' },
                { id: 'sunset', label: 'Закат' },
                { id: 'none', label: 'Выкл' },
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

            <div className="w-full p-4 bg-slate-950/75 rounded-2xl border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col gap-2.5">
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
      </div>
    </MacCatWindowFrame>
  );
};