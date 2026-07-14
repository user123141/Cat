// src/components/QuestsWindow.tsx
import React, { useState, useEffect } from 'react';
import { DailyQuest, PlayerProfile, Cat } from '../types';
import { Target, CheckCircle2, Award, Gift, Flame, Sparkles, Calendar, Check, Lock } from 'lucide-react';
import { triggerHapticLight, triggerHapticMedium } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface QuestsWindowProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  onInteract: (action: string) => void;
  onClaimReward: (id: string) => void;
  onClaimMilestone: (id: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  initialTab?: 'quests' | 'calendar';
}

export const QuestsWindow: React.FC<QuestsWindowProps> = ({
  profile,
  activeCat,
  onInteract,
  onClaimReward,
  onClaimMilestone,
  onClose,
  onMinimize,
  initialTab = 'quests',
}) => {
  const [activeTab, setActiveTab] = useState<'quests' | 'calendar'>(initialTab);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Обновление скоро');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!profile) return null;

  const completedCount = profile.quests.filter((q) => q.completed).length;
  const claimedCount = profile.quests.filter((q) => q.claimed).length;

  const currentStreak = profile.streak || 0;
  const claimedMilestones = profile.claimedStreakMilestones || [];
  const calendarHistory = profile.careCalendarHistory || [];

  const daysInGrid = Array.from({ length: 30 }, (_, i) => i + 1);

  const milestones = [
    { id: '3', days: 3, reward: '+50 Лапок 🐾', desc: 'Начальный бонус за заботу', icon: '🐾' },
    { id: '7', days: 7, reward: '+150 Лапок 🐾', desc: 'Серебряный бонус за заботу', icon: '✨' },
    { id: '15', days: 15, reward: 'Порода Бенгал 🐆', desc: 'Уникальный леопардовый скин', icon: '🐆' },
    { id: '30', days: 30, reward: 'Золотая Корона 👑', desc: 'Императорский головной убор котика', icon: '👑' },
  ];

  const isDayCared = (dayNum: number) => {
    if (dayNum <= currentStreak) return true;
    if (calendarHistory.length >= dayNum) return true;
    return false;
  };

  return (
    <MacCatWindowFrame
      id="quests"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Задачи и Забота"
      subtitle={activeTab === 'quests' ? 'Квесты дня' : 'Календарь серии'}
      headerRight={
        <div className="flex items-center gap-2">
          {activeTab === 'quests' && (
            <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-400/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-400 shrink-0">
              <Target size={10} className="animate-pulse" />
              <span className="font-mono">{completedCount} / {profile.quests.length}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-sky-400 shrink-0">
            <span>⏱️ {timeLeft}</span>
          </div>
        </div>
      }
    >
      <div className="flex px-3 pt-2.5 pb-2.5 justify-center bg-black/10 border-b border-white/5 shrink-0">
        <div className="flex w-full max-w-md p-0.5 bg-black/30 rounded-xl border border-white/5">
          <button
            onClick={() => { triggerHapticLight(); setActiveTab('quests'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'quests'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target size={12} />
            Квесты ({completedCount - claimedCount} готовы)
          </button>
          <button
            onClick={() => { triggerHapticLight(); setActiveTab('calendar'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={12} />
            Календарь Заботы 🔥
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-900/40 space-y-4">
        {activeTab === 'quests' ? (
          <>
            <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-white/5 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award size={13} className="text-amber-400" />
                  Кошачьи задачи на день
                </h3>
                <p className="text-[10px] text-slate-400 max-w-md leading-relaxed">
                  Задачи сбрасываются каждые 24 часа. Выполняйте их, чтобы получить лапки и купить котятам новые вкусняшки или аксессуары!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="block text-[7px] text-slate-400 font-mono tracking-widest">ПРОГРЕСС</span>
                  <span className="block text-sm font-black font-mono text-white">
                    {profile.quests.length ? Math.round((completedCount / profile.quests.length) * 100) : 0}%
                  </span>
                </div>
                
                <div className="w-8 h-8 relative flex items-center justify-center bg-black/30 rounded-full border border-white/5">
                  <svg className="w-full h-full rotate-270" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="14" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2" 
                      strokeDasharray="88" 
                      strokeDashoffset={profile.quests.length ? 88 - (88 * (completedCount / profile.quests.length)) : 88}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <Target size={10} className="absolute text-rose-500 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {profile.quests.map((q) => {
                const isCompleted = q.completed;
                const isClaimed = q.claimed;

                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                      isClaimed
                        ? 'bg-black/20 border-white/5 opacity-55'
                        : isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-md'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-lg border flex-shrink-0 mt-0.5 ${
                        isClaimed
                          ? 'bg-neutral-800 border-neutral-700 text-neutral-500'
                          : isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                      }`}>
                        {isClaimed ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Target size={12} />
                        )}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="text-[11px] font-bold text-slate-100 truncate">
                          {q.text}
                        </h4>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-indigo-400'
                              }`}
                              style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-slate-400 font-bold">
                            {q.progress}/{q.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-bold font-mono text-amber-400">
                        <Gift size={8} />
                        <span>+{q.rewardPaws} ЛАПКИ</span>
                      </div>

                      {isClaimed ? (
                        <span className="text-[9px] text-slate-500 font-bold px-2 py-0.5">
                          Получено
                        </span>
                      ) : isCompleted ? (
                        <button
                          onClick={() => {
                            triggerHapticLight();
                            onClaimReward(q.id);
                          }}
                          className="px-2.5 py-1 text-[9px] font-extrabold rounded bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all active:scale-95 cursor-pointer"
                        >
                          Забрать
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold px-2 py-0.5">
                          В процессе
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-indigo-500/10 border border-orange-500/15 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-orange-400 to-amber-500 flex items-center justify-center text-white shrink-0">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Текущая серия: {currentStreak} {currentStreak === 1 ? 'день' : currentStreak < 5 ? 'дня' : 'дней'}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                    Заходите каждый день и заботьтесь о котике, чтобы развивать серию и забирать редчайшие сувениры и сундуки лапок!
                  </p>
                </div>
              </div>
              <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 text-center shrink-0 min-w-[100px]">
                <span className="block text-[7px] font-mono font-bold text-slate-400 uppercase">СЛЕДУЮЩАЯ НАГРАДА</span>
                <span className="block text-xs font-black text-amber-400 mt-0.5">
                  {currentStreak >= 30 ? '30 дней (Макс)' : `${milestones.find(m => m.days > currentStreak)?.days || 30} дн.`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7 bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={11} className="text-orange-400" />
                    Журнал заботы (30 дней)
                  </h4>
                  <span className="text-[8px] font-mono text-slate-400">Входов: {calendarHistory.length}</span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {daysInGrid.map((day) => {
                    const isCared = isDayCared(day);
                    const isToday = day === currentStreak;
                    
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1 border transition-all ${
                          isToday
                            ? 'bg-sky-500/20 border-sky-400 text-sky-400'
                            : isCared
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-black/20 border-white/5 text-slate-600'
                        }`}
                      >
                        <span className="text-[8px] font-mono font-bold">{day}д</span>
                        <div className="flex-1 flex items-center justify-center">
                          {isCared ? (
                            <Check size={10} className="stroke-[3.5]" />
                          ) : (
                            <span className="text-[8px]">💤</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-5 bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-3 text-left">
                <h4 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                  <Award size={11} className="text-orange-400" />
                  Сувениры за верность
                </h4>

                <div className="space-y-2">
                  {milestones.map((m) => {
                    const isUnlocked = currentStreak >= parseInt(m.id);
                    const isClaimed = claimedMilestones.includes(m.id);

                    return (
                      <div
                        key={m.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                          isClaimed
                            ? 'bg-emerald-500/5 border-emerald-500/10 opacity-70'
                            : isUnlocked
                            ? 'bg-orange-500/10 border-orange-500/25'
                            : 'bg-black/20 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                            isClaimed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isUnlocked
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-white/5 text-slate-500'
                          }`}>
                            {m.icon}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[9px] font-black text-white truncate">{m.days} дней</span>
                            <span className="block text-[9px] font-bold text-orange-400 truncate">{m.reward}</span>
                          </div>
                        </div>

                        <div>
                          {isClaimed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                              <Check size={10} className="stroke-[3]" />
                            </div>
                          ) : isUnlocked ? (
                            <button
                              onClick={() => {
                                triggerHapticMedium();
                                onClaimMilestone(m.id);
                              }}
                              className="px-2 py-0.5 text-[8px] font-extrabold uppercase bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded cursor-pointer"
                            >
                              Забрать
                            </button>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-white/5 text-slate-600 flex items-center justify-center shrink-0">
                              <Lock size={8} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MacCatWindowFrame>
  );
};