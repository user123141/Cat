import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CatRenderer } from './CatRenderer';
import { Sparkles, User, Award, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onCreateProfile: (nickname: string, initialCatName: string, breed: string, skinId: string) => void;
}

const BREEDS = [
  { id: 'Scottish Fold', name: 'Скоттиш Фраппе (Scottish Fold)', defaultSkin: 'scottish_pink', color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9', desc: 'Ушки прижаты к голове, сонный взгляд, невероятно мягкий и ласковый комочек.' },
  { id: 'British Shorthair', name: 'Британский Плюш (British Shorthair)', defaultSkin: 'british_blue', color: '#64748b', patternColor: '#475569', eyeColor: '#f59e0b', desc: 'Плотный велюровый шерстяной покров, круглые золотые глазки, спокойный нрав.' },
  { id: 'Siamese', name: 'Королевский Сиам (Siamese)', defaultSkin: 'siamese_point', color: '#fef3c7', patternColor: '#78350f', eyeColor: '#06b6d4', desc: 'Изящный силуэт, темная шоколадная маска на мордочке, пронзительно голубые глаза.' },
  { id: 'Persian', name: 'Облачный Перс (Persian)', defaultSkin: 'persian_gold', color: '#fef08a', patternColor: '#eab308', eyeColor: '#a855f7', desc: 'Пушистый королевский мех, приплюснутый носик, грациозный и величественный.' },
  { id: 'Sphynx', name: 'Лунный Сфинкс (Sphynx)', defaultSkin: 'sphynx_naked', color: '#fda4af', patternColor: '#f43f5e', eyeColor: '#10b981', desc: 'Горячая бархатная кожа розового оттенка, большие футуристические ушки.' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onCreateProfile }) => {
  const [nickname, setNickname] = useState('');
  const [catName, setCatName] = useState('');
  const [selectedBreedIdx, setSelectedBreedIdx] = useState(0);
  const [step, setStep] = useState(1);

  const activeBreed = BREEDS[selectedBreedIdx];

  const handleNext = () => {
    if (step === 1 && nickname.trim().length >= 2) {
      setStep(2);
    }
  };

  const handleFinish = () => {
    if (catName.trim().length >= 2) {
      onCreateProfile(
        nickname.trim(),
        catName.trim(),
        activeBreed.id,
        activeBreed.defaultSkin
      );
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 select-none overflow-y-auto">
      {/* Decorative mesh background */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 filter blur-3xl animate-float-slow" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 filter blur-3xl animate-float" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          // Step 1: Nickname card
          <motion.div
            key="step1"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-full max-w-[420px] rounded-[32px] glass-panel-dark p-6 md:p-8 text-center space-y-6 relative border border-white/10 shadow-2xl"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-400/20 rounded-full text-xs font-bold text-sky-400 uppercase tracking-wider">
                <Sparkles size={12} className="animate-pulse" />
                <span>MacCat Care OS</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none font-display">
                Добро пожаловать
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                Погрузитесь в изящную симуляцию заботы о котятах, оформленную в премиальном стиле Apple Minimalist с плавными макосовскими микро-анимациями.
              </p>
            </div>

            {/* Input field */}
            <div className="space-y-4">
              <div className="text-left space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={12} />
                  Как вас называть?
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={14}
                  placeholder="Введите никнейм"
                  className="w-full px-4 py-3 rounded-2xl bg-black/45 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-center placeholder:text-slate-600 font-sans"
                />
              </div>

              <button
                onClick={handleNext}
                disabled={nickname.trim().length < 2}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/15"
              >
                <span>Начать путешествие</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        ) : (
          // Step 2: Choose first kitten card
          <motion.div
            key="step2"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-full max-w-[640px] rounded-[36px] glass-panel-dark p-6 md:p-8 flex flex-col md:flex-row gap-6 relative border border-white/10 shadow-2xl"
          >
            {/* Left side: Live Interactive Preview */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-black/25 rounded-2xl border border-white/5 relative min-h-[220px]">
              <span className="absolute top-3 left-3 text-[9px] font-mono font-bold text-sky-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/15">
                Превью породы
              </span>

              <CatRenderer
                breed={activeBreed.id}
                color={activeBreed.color}
                patternColor={activeBreed.patternColor}
                eyeColor={activeBreed.eyeColor}
                status="idle"
                size={140}
              />

              <h3 className="text-sm font-bold text-white mt-4">{activeBreed.name}</h3>
              <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed mt-1.5">
                {activeBreed.desc}
              </p>
            </div>

            {/* Right side: Options Selection */}
            <div className="flex-1 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white tracking-tight leading-none flex items-center gap-1.5">
                    Приютите первого котенка
                  </h2>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Выберите породу вашего будущего питомца и дайте ему милое любящее имя.
                  </p>
                </div>

                {/* Name Kitten */}
                <div className="text-left space-y-1.5">
                  <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide">
                    Кличка котенка
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    maxLength={14}
                    placeholder="Например: Барсик, Кекс"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/45 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-sky-500 transition-all font-sans"
                  />
                </div>

                {/* Breed selector buttons */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Award size={10} />
                    Выбор породы
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {BREEDS.map((breed, idx) => {
                      const isSelected = idx === selectedBreedIdx;
                      return (
                        <button
                          key={breed.id}
                          onClick={() => setSelectedBreedIdx(idx)}
                          className={`p-2 rounded-xl text-[10px] font-bold text-left border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                              : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {breed.id === 'Scottish Fold' ? 'Скоттиш' : breed.id === 'British Shorthair' ? 'Британец' : breed.id === 'Siamese' ? 'Сиам' : breed.id === 'Persian' ? 'Перс' : 'Сфинкс'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Enter Simulator */}
              <button
                onClick={handleFinish}
                disabled={catName.trim().length < 2}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                <span>Войти в симуляцию</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
