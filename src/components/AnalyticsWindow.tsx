import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlayerProfile, GameAnalytics } from '../types';
import { X, TrendingUp, Users, Clock, Flame, Award, Sparkles, LayoutGrid, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { MacCatWindowFrame } from './MacCatWindowFrame';
import { triggerHapticLight } from '../utils/audio';

interface AnalyticsWindowProps {
  profile: PlayerProfile | null;
  analytics: GameAnalytics;
  onClose: () => void;
  onMinimize: () => void;
  usersList?: any[]; // добавлено
}

export const AnalyticsWindow: React.FC<AnalyticsWindowProps> = ({
  profile,
  analytics,
  onClose,
  onMinimize,
  usersList = [],
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'leaderboard'>('stats');
  const [leaderboardSort, setLeaderboardSort] = useState<'paws' | 'level'>('paws');
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

  if (!profile) return null;

  const playTimeMinutes = Math.floor(profile.totalPlayTime / 60);
  const playTimeSeconds = profile.totalPlayTime % 60;

  const feedCount = analytics.actionsPerformed.feed || 0;
  const playCount = analytics.actionsPerformed.play || 0;
  const cleanCount = analytics.actionsPerformed.clean || 0;
  const sleepCount = analytics.actionsPerformed.sleep || 0;
  const maxVal = Math.max(1, feedCount, playCount, cleanCount, sleepCount);

  const achievements = [
    {
      id: 'first_cat',
      name: 'Первый друг',
      desc: 'Приютите своего самого первого котенка.',
      icon: '🐱',
      target: 1,
      current: profile.cats.length,
      unlocked: profile.unlockedAchievements?.includes('first_cat') || profile.cats.length >= 1,
    },
    {
      id: 'level_5',
      name: 'Славный малый',
      desc: 'Достигните 5-го уровня с любым из ваших котиков.',
      icon: '⭐',
      target: 5,
      current: Math.max(0, ...profile.cats.map(c => c.level)),
      unlocked: profile.unlockedAchievements?.includes('level_5') || profile.cats.some(c => c.level >= 5),
    },
    {
      id: 'pet_50',
      name: 'Мастер поглаживаний',
      desc: 'Выразите пушистикам любовь поглаживанием 50 раз.',
      icon: '💖',
      target: 50,
      current: profile.clicksCount || 0,
      unlocked: profile.unlockedAchievements?.includes('pet_50') || (profile.clicksCount || 0) >= 50,
    },
    {
      id: 'skin_3',
      name: 'Икона стиля',
      desc: 'Разблокируйте 3 или более дизайнерских окраса или аксессуара.',
      icon: '🕶️',
      target: 3,
      current: profile.unlockedSkins.length,
      unlocked: profile.unlockedAchievements?.includes('skin_3') || profile.unlockedSkins.length >= 3,
    },
    {
      id: 'rich_1000',
      name: 'Миллионер',
      desc: 'Соберите капитал в размере 1000 лапок на балансе приюта.',
      icon: '💰',
      target: 1000,
      current: profile.paws,
      unlocked: profile.unlockedAchievements?.includes('rich_1000') || profile.paws >= 1000,
    },
    {
      id: 'antistress_100',
      name: 'Абсолютный дзен',
      desc: 'Лопните 100 пупырок на антистресс поп-ит игрушке.',
      icon: '🧘',
      target: 100,
      current: profile.popItBurstedCount || 0,
      unlocked: profile.unlockedAchievements?.includes('antistress_100') || (profile.popItBurstedCount || 0) >= 100,
    },
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Сортировка пользователей для топа
  const sortedUsers = [...usersList]
    .sort((a, b) => {
      if (leaderboardSort === 'paws') {
        return (b.paws || 0) - (a.paws || 0);
      } else {
        const maxLevelA = (a.cats || []).reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);
        const maxLevelB = (b.cats || []).reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);
        return maxLevelB - maxLevelA;
      }
    })
    .slice(0, 10); // топ-10

  return (
    <MacCatWindowFrame
      id="analytics"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Аналитика и Достижения"
      subtitle="Аналитика"
      headerRight={
        <div className="text-xs font-mono bg-white/5 border border-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 text-slate-300">
          <span>Made with</span>
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="inline-block"
          >
            ❤️
          </motion.span>
          <span>by Maksym Skorina</span>
        </div>
      }
    >
      <div className="bg-black/25 px-4 py-2 border-b border-white/5 flex flex-wrap items-center justify-between shrink-0 gap-2">
        <div className="flex flex-wrap bg-white/5 border border-white/5 rounded-xl p-0.5 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-sky-500/25 border border-sky-500/20 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Аналитика
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'achievements'
                ? 'bg-amber-500/25 border border-amber-500/20 text-amber-300 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={12} className="text-amber-400" />
            <span>Достижения</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-rose-500/25 border border-rose-500/20 text-rose-300 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award size={12} className="text-rose-400" />
            <span>🏆 Топ игроков</span>
          </button>
        </div>
        <div className="text-[10px] font-mono text-slate-500 max-sm:hidden">
          {activeTab === 'stats' 
            ? 'СТАТИСТИКА' 
            : activeTab === 'achievements'
              ? `ОТКРЫТО ДОСТИЖЕНИЙ: ${achievements.filter(a => a.unlocked).length} / ${achievements.length}`
              : 'РЕЙТИНГ ИГРОКОВ'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-slate-900/40">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' ? (
            <motion.div
              key="stats-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1 relative overflow-hidden">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">ВРЕМЯ СЕССИИ</span>
                  <div className="text-md font-black font-mono text-white flex items-baseline gap-0.5">
                    <span>{playTimeMinutes}м</span>
                    <span className="text-xs text-slate-400">{playTimeSeconds}с</span>
                  </div>
                  <Clock size={12} className="absolute bottom-3 right-3 text-slate-700/60" />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1 relative overflow-hidden">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">АКТИВНОСТЬ</span>
                  <div className="text-md font-black font-mono text-white flex items-baseline gap-0.5">
                    <span>{profile.totalInteractions}</span>
                    <span className="text-[9px] text-slate-400 ml-1">действий</span>
                  </div>
                  <Flame size={12} className="absolute bottom-3 right-3 text-slate-700/60" />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1 relative overflow-hidden">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">ТРАТЫ ЛАПОК</span>
                  <div className="text-md font-black font-mono text-white flex items-baseline gap-0.5">
                    <span>🐾 {analytics.pawsSpent}</span>
                  </div>
                  <Award size={12} className="absolute bottom-3 right-3 text-slate-700/60" />
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1 relative overflow-hidden">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">ЛОЯЛЬНОСТЬ</span>
                  <div className="text-md font-black font-mono text-emerald-400 flex items-baseline gap-0.5">
                    <span>98.4%</span>
                    <span className="text-[8px] text-emerald-500 font-bold uppercase ml-1">MAX</span>
                  </div>
                  <Users size={12} className="absolute bottom-3 right-3 text-slate-700/60" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Распределение заботы</h3>
                  <p className="text-[10px] text-slate-500">Какие потребности питомца вы удовлетворяете чаще</p>
                </div>
                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>🐟 Кормление</span>
                      <span>{feedCount} раз</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${(feedCount / maxVal) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>🎾 Игры</span>
                      <span>{playCount} раз</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${(playCount / maxVal) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>🧼 Гигиена</span>
                      <span>{cleanCount} раз</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(cleanCount / maxVal) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>🛌 Отдых</span>
                      <span>{sleepCount} раз</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(sleepCount / maxVal) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'achievements' ? (
            <motion.div
              key="achievements-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4"
            >
              {achievements.map((ach) => {
                const progressPct = Math.min(100, Math.round((ach.current / ach.target) * 100));
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[155px] ${
                      ach.unlocked
                        ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/45 shadow-lg shadow-amber-500/[0.02]'
                        : 'bg-white/5 border-white/10 opacity-70 hover:opacity-85'
                    }`}
                  >
                    {ach.unlocked && (
                      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    )}
                    <div className="flex gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        ach.unlocked
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {ach.unlocked ? ach.icon : <Lock size={16} />}
                      </div>
                      <div className="text-left space-y-1 pr-6">
                        <h4 className={`text-xs font-black tracking-tight flex items-center gap-1 ${ach.unlocked ? 'text-amber-300' : 'text-slate-300'}`}>
                          {ach.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal">{ach.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 border-t border-white/5 pt-2.5 mt-2">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Прогресс</span>
                        <span className="font-bold">
                          {ach.unlocked ? 'Выполнено! 🎉' : `${ach.current} / ${ach.target} (${progressPct}%)`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            ach.unlocked
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                              : 'bg-gradient-to-r from-slate-500 to-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                    {ach.unlocked && (
                      <div className="absolute top-3 right-3 text-amber-400">
                        <CheckCircle2 size={15} />
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ) : (
            // LEADERBOARD
            <motion.div
              key="leaderboard-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4 text-left pb-4"
            >
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    👑 Мировой рейтинг приютов Care OS
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                    Повышайте уровни котиков, кормите, играйте и накапливайте ценные лапки 🐾, чтобы войти в элитный зал славы игроков.
                  </p>
                </div>
                <div className="flex bg-black/40 border border-white/5 rounded-xl p-0.5 text-[10px] font-bold">
                  <button
                    onClick={() => { triggerHapticLight(); setLeaderboardSort('paws'); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leaderboardSort === 'paws'
                        ? 'bg-rose-500/25 border border-rose-500/20 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🐾 По лапкам
                  </button>
                  <button
                    onClick={() => { triggerHapticLight(); setLeaderboardSort('level'); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      leaderboardSort === 'level'
                        ? 'bg-amber-500/25 border border-amber-500/20 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⭐ По уровню котиков
                  </button>
                </div>
              </div>

              <div className="space-y-2 bg-black/35 rounded-2xl p-3 border border-white/5 text-left">
                {sortedUsers.length > 0 ? (
                  <>
                    {sortedUsers.map((user, index) => {
                      const maxValForFill = leaderboardSort === 'paws'
                        ? Math.max(1, ...sortedUsers.map(u => u.paws || 0))
                        : Math.max(1, ...sortedUsers.map(u => (u.cats || []).reduce((max: number, c: any) => Math.max(max, c.level || 1), 1)));
                      
                      const currentValForFill = leaderboardSort === 'paws'
                        ? (user.paws || 0)
                        : (user.cats || []).reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);

                      const fillPct = Math.min(100, Math.round((currentValForFill / maxValForFill) * 100));
                      const isMe = user.id === profile.id || user.nickname === profile.nickname;
                      
                      const maxCatLevel = (user.cats || []).reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);
                      const catsCount = user.cats?.length || 0;

                      return (
                        <div
                          key={user.id || index}
                          className={`p-3 rounded-xl flex items-center justify-between gap-4 transition-all ${
                            isMe
                              ? 'bg-rose-500/15 border border-rose-500/25 text-white shadow-md'
                              : 'bg-white/5 border border-transparent text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                              index === 0
                                ? 'bg-amber-400 text-amber-950 font-black'
                                : index === 1
                                  ? 'bg-slate-300 text-slate-900'
                                  : index === 2
                                    ? 'bg-amber-700 text-amber-100'
                                    : 'bg-white/10 text-slate-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="text-lg shrink-0">{user.avatar || '🐱'}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-xs font-bold truncate ${isMe ? 'text-rose-300 font-extrabold' : 'text-slate-100'}`}>
                                  {user.nickname || 'Без имени'}
                                </span>
                                {user.selectedBadge && (
                                  <span className="bg-sky-500/10 border border-sky-400/20 text-sky-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    🏅 {user.selectedBadge}
                                  </span>
                                )}
                                {user.id === 'dev' && (
                                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded">
                                    DEV
                                  </span>
                                )}
                                {isMe && (
                                  <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded animate-pulse">
                                    ВЫ
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-500 font-mono">Котов: {catsCount}</span>
                                <span className="text-[9px] text-slate-500 font-mono">•</span>
                                <span className="text-[9px] text-slate-500 font-mono">Общий уровень: {(user.cats || []).reduce((acc: number, c: any) => acc + (c.level || 1), 0)}</span>
                              </div>
                              <div className="w-full h-1 bg-black/40 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isMe
                                      ? 'bg-rose-500'
                                      : index === 0
                                        ? 'bg-amber-400'
                                        : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {leaderboardSort === 'paws' ? (
                              <>
                                <span className="text-xs font-black font-mono text-white">🐾 {user.paws || 0}</span>
                                <span className="text-[8px] text-slate-500 block">лапок</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-black font-mono text-amber-400">⭐ {maxCatLevel}</span>
                                <span className="text-[8px] text-slate-500 block">уровень</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Active profile row if the current player is not in top 10 */}
                    {!sortedUsers.some(u => u.id === profile.id || u.nickname === profile.nickname) && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="p-3 rounded-xl flex items-center justify-between gap-4 bg-rose-500/15 border border-rose-500/25 text-white shadow-md">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 bg-white/10 text-slate-400">
                              #
                            </div>
                            <div className="text-lg shrink-0">{profile.avatar || '🐱'}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-extrabold truncate text-rose-300">
                                  {profile.nickname || 'Без имени'}
                                </span>
                                {profile.selectedBadge && (
                                  <span className="bg-sky-500/10 border border-sky-400/20 text-sky-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    🏅 {profile.selectedBadge}
                                  </span>
                                )}
                                <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded animate-pulse">
                                  ВЫ
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-slate-500 font-mono">Котов: {profile.cats?.length || 0}</span>
                                <span className="text-[9px] text-slate-500 font-mono">•</span>
                                <span className="text-[9px] text-slate-500 font-mono">Общий уровень: {profile.cats?.reduce((acc: number, c: any) => acc + (c.level || 1), 0) || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {leaderboardSort === 'paws' ? (
                              <>
                                <span className="text-xs font-black font-mono text-white">🐾 {profile.paws || 0}</span>
                                <span className="text-[8px] text-slate-500 block">лапок</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-black font-mono text-amber-400">⭐ {profile.cats?.reduce((max: number, c: any) => Math.max(max, c.level || 1), 1) || 1}</span>
                                <span className="text-[8px] text-slate-500 block">уровень</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-xl flex items-center justify-between gap-4 bg-rose-500/15 border border-rose-500/25 text-white shadow-md">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 bg-white/10 text-slate-400">
                        #
                      </div>
                      <div className="text-lg shrink-0">{profile.avatar || '🐱'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-extrabold truncate text-rose-300">
                            {profile.nickname || 'Без имени'}
                          </span>
                          {profile.selectedBadge && (
                            <span className="bg-sky-500/10 border border-sky-400/20 text-sky-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                              🏅 {profile.selectedBadge}
                            </span>
                          )}
                          <span className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded animate-pulse">
                            ВЫ
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-500 font-mono">Котов: {profile.cats?.length || 0}</span>
                          <span className="text-[9px] text-slate-500 font-mono">•</span>
                          <span className="text-[9px] text-slate-500 font-mono">Общий уровень: {profile.cats?.reduce((acc: number, c: any) => acc + (c.level || 1), 0) || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {leaderboardSort === 'paws' ? (
                        <>
                          <span className="text-xs font-black font-mono text-white">🐾 {profile.paws || 0}</span>
                          <span className="text-[8px] text-slate-500 block">лапок</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-black font-mono text-amber-400">⭐ {profile.cats?.reduce((max: number, c: any) => Math.max(max, c.level || 1), 1) || 1}</span>
                          <span className="text-[8px] text-slate-500 block">уровень</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MacCatWindowFrame>
  );
};