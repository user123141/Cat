import React from 'react';
import { PlayerProfile } from '../types';
import { MacCatWindowFrame } from './MacCatWindowFrame';
import { Flame, Award, Check, Lock, Sparkles, Calendar, Gift } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';

interface CalendarWindowProps {
  profile: PlayerProfile | null;
  onClaimMilestone: (id: string) => void;
  onClose: () => void;
  onMinimize: () => void;
}

export const CalendarWindow: React.FC<CalendarWindowProps> = ({
  profile,
  onClaimMilestone,
  onClose,
  onMinimize,
}) => {
  if (!profile) return null;

  const currentStreak = profile.streak || 0;
  const claimedMilestones = profile.claimedStreakMilestones || [];
  const calendarHistory = profile.careCalendarHistory || [];

  // 30 days grid data for visual beauty (relative to current streak / dates)
  const daysInGrid = Array.from({ length: 30 }, (_, i) => i + 1);

  // Milestones specification
  const milestones = [
    { id: '3', days: 3, reward: '+50 Лапок 🐾', desc: 'Начальный бонус', icon: '🐾' },
    { id: '7', days: 7, reward: '+150 Лапок 🐾', desc: 'Серебряный бонус', icon: '✨' },
    { id: '15', days: 15, reward: 'Порода Бенгал 🐆', desc: 'Уникальный леопардовый скин', icon: '🐆' },
    { id: '30', days: 30, reward: 'Золотая Корона 👑', desc: 'Императорский головной убор котика', icon: '👑' },
  ];

  const handleClaim = (milestoneId: string) => {
    triggerHaptic();
    onClaimMilestone(milestoneId);
  };

  // Helper to determine if a grid slot should be highlighted.
  // We represent days of the care month. If currentStreak is 7, the first 7 days are active!
  // If the user has more care history, we can also match days visually.
  const isDayCared = (dayNum: number) => {
    // If the day is within the streak, it's definitely cared.
    if (dayNum <= currentStreak) return true;
    
    // Fallback: if we have history array length and the dayNum matches history elements
    if (calendarHistory.length >= dayNum) return true;

    return false;
  };

  return (
    <MacCatWindowFrame
      id="calendar"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Календарь Заботы"
      subtitle="Серия дней"
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/40 space-y-6">
        
        {/* Header Hero Area */}
        <div className="bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-indigo-500/20 border border-orange-500/20 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <Flame size={32} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Серия заботы: {currentStreak} {currentStreak === 1 ? 'день' : currentStreak < 5 ? 'дня' : 'дней'}</h3>
                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-orange-500 text-white rounded-full animate-bounce">Активна 🔥</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal max-w-md mt-0.5">
                Заходите каждый день и ухаживайте за котиком, чтобы не сбросить серию! Серия дней открывает эксклюзивные породы, аксессуары и горы лапок 🐾.
              </p>
            </div>
          </div>
          
          {/* Circular progress or simple indicator */}
          <div className="bg-black/45 px-4 py-3 rounded-2xl border border-white/5 text-center shrink-0 min-w-[120px]">
            <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Следующая цель</span>
            <span className="block text-xl font-black text-amber-400 mt-1">
              {currentStreak >= 30 ? '30+ 🔥' : milestones.find(m => m.days > currentStreak)?.days || 30} дней
            </span>
            <span className="block text-[8px] text-slate-400">осталось {Math.max(0, (milestones.find(m => m.days > currentStreak)?.days || 30) - currentStreak)} дн.</span>
          </div>
        </div>

        {/* Grid and Milestones container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Calendar Grid - 8 Cols */}
          <div className="lg:col-span-7 bg-white/5 border border-white/5 rounded-3xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-orange-400" />
                Журнал Посещений (30 Дней)
              </h4>
              <span className="text-[9px] font-mono text-slate-400">Всего посещений: {calendarHistory.length}</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {daysInGrid.map((day) => {
                const isCared = isDayCared(day);
                const isToday = day === currentStreak;
                
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 border transition-all ${
                      isToday
                        ? 'bg-sky-500/20 border-sky-400 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                        : isCared
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-black/25 border-white/5 text-slate-500 hover:border-white/10'
                    }`}
                  >
                    <span className="text-[9px] font-mono font-bold">{day} дн.</span>
                    <div className="flex-1 flex items-center justify-center">
                      {isCared ? (
                        <Check size={11} className="stroke-[3.5]" />
                      ) : (
                        <span className="text-[9px] font-bold">💤</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-[9px] text-slate-400 text-left leading-normal pt-1.5 border-t border-white/5">
              💡 <span className="font-semibold text-slate-300">Как это работает:</span> Если вы не покормите или не погладите котика хотя бы раз за день, серия прервется и сбросится до 1 дня. Заботьтесь о любимцах регулярно!
            </div>
          </div>

          {/* Milestones Awards - 5 Cols */}
          <div className="lg:col-span-5 bg-white/5 border border-white/5 rounded-3xl p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={13} className="text-orange-400" />
              Награды за Достижения
            </h4>

            <div className="space-y-2.5">
              {milestones.map((milestone) => {
                const isUnlocked = currentStreak >= milestone.days;
                const isClaimed = claimedMilestones.includes(milestone.id);
                
                return (
                  <div
                    key={milestone.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isClaimed
                        ? 'bg-emerald-500/5 border-emerald-500/10 opacity-70'
                        : isUnlocked
                        ? 'bg-orange-500/10 border-orange-500/25'
                        : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isUnlocked
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-white/5 text-slate-500'
                      }`}>
                        {milestone.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-white">{milestone.days} дней серии</span>
                          {isClaimed && (
                            <span className="text-[8px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded-md">Получено</span>
                          )}
                        </div>
                        <span className="block text-[10px] font-bold text-orange-400 mt-0.5">{milestone.reward}</span>
                        <span className="block text-[8px] text-slate-400 leading-tight">{milestone.desc}</span>
                      </div>
                    </div>

                    <div>
                      {isClaimed ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleClaim(milestone.id)}
                          className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          Забрать
                        </button>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 text-slate-600 flex items-center justify-center">
                          <Lock size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </MacCatWindowFrame>
  );
};
