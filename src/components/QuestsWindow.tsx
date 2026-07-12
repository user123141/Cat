import React, { useRef } from 'react';
import { DailyQuest, PlayerProfile } from '../types';
import { Target, CheckCircle2, Award, Gift } from 'lucide-react';
import { triggerHapticLight } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface QuestsWindowProps {
  profile: PlayerProfile | null;
  onClaimReward: (id: string) => void;
  onClose: () => void;
  onMinimize: () => void;
}

export const QuestsWindow: React.FC<QuestsWindowProps> = ({
  profile,
  onClaimReward,
  onClose,
  onMinimize,
}) => {
  if (!profile) return null;

  const completedCount = profile.quests.filter((q) => q.completed).length;
  const claimedCount = profile.quests.filter((q) => q.claimed).length;

  return (
    <MacCatWindowFrame
      id="quests"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Ежедневные квесты"
      subtitle="Квесты"
      headerRight={
        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-400/20 px-3 py-1 rounded-full text-xs font-bold text-rose-400 shrink-0">
          <Target size={12} className="animate-pulse" />
          <span className="text-[11px] font-mono">{completedCount} / {profile.quests.length}</span>
        </div>
      }
    >

      {/* 2. Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/40 space-y-4">
        
        {/* Visual Progress Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Award size={15} className="text-amber-400" />
              Кошачьи задачи на день
            </h3>
            <p className="text-[11px] text-slate-400 max-w-md leading-normal">
              Задачи сбрасываются каждые 24 часа. Выполняйте их, чтобы накопить волшебные лапки 🐾 и разблокировать эксклюзивные облики и аксессуары в магазине!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="block text-[8px] text-slate-400 font-mono tracking-widest">ПРОГРЕСС</span>
              <span className="block text-md font-black font-mono text-white">
                {profile.quests.length ? Math.round((completedCount / profile.quests.length) * 100) : 0}%
              </span>
            </div>
            
            <div className="w-10 h-10 relative flex items-center justify-center bg-black/30 rounded-full border border-white/5">
              <svg className="w-full h-full rotate-270" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="14" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2.5" 
                  strokeDasharray="88" 
                  strokeDashoffset={profile.quests.length ? 88 - (88 * (completedCount / profile.quests.length)) : 88}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <Target size={12} className="absolute text-rose-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quests list */}
        <div className="space-y-2.5">
          {profile.quests.map((q) => {
            const isCompleted = q.completed;
            const isClaimed = q.claimed;

            return (
              <div
                key={q.id}
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                  isClaimed
                    ? 'bg-black/20 border-white/5 opacity-55'
                    : isCompleted
                    ? 'bg-emerald-500/5 border-emerald-500/20 shadow-md'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Left Side Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${
                    isClaimed
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-500'
                      : isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                  }`}>
                    {isClaimed ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Target size={14} />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">
                      {q.text}
                    </h4>
                    
                    {/* Progress indicators */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-indigo-400'
                          }`}
                          style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {q.progress} / {q.target}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Reward Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold font-mono text-amber-400">
                    <Gift size={10} />
                    <span>+{q.rewardPaws} 🐾</span>
                  </div>

                  {isClaimed ? (
                    <span className="text-[10px] text-slate-500 font-black px-2.5 py-1">
                      Получено
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => {
                        triggerHapticLight();
                        onClaimReward(q.id);
                      }}
                      className="px-3 py-1.5 text-[10px] font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      Забрать
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold px-2.5 py-1">
                      В процессе
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MacCatWindowFrame>
  );
};
