import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlayerProfile, GameAnalytics } from '../types';
import { X, TrendingUp, Users, Clock, Flame, Award, Sparkles, LayoutGrid, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { MacCatWindowFrame } from './MacCatWindowFrame';

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
    .sort((a, b) => (b.paws || 0) - (a.paws || 0))
    .slice(0, 10); // топ-10

  return (
    <MacCatWindowFrame
      id="analytics"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Аналитика и Достижения"
      subtitle="Аналитика"
      headerRight={
        <div className="text-xs font-mono bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
          <TrendingUp size={11} />
          <span className="text-[11px]">Удержание: {analytics.retentionScore}%</span>
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
            <span>🏆 Топ владельцев</span>
          </button>
        </div>
        <div className="text-[10px] font-mono text-slate-500 max-sm:hidden">
          {activeTab === 'stats' 
            ? 'СТАТИСТИКА Care OS' 
            : activeTab === 'achievements'
              ? `ОТКРЫТО ДОСТИЖЕНИЙ: ${achievements.filter(a => a.unlocked).length} / ${achievements.length}`
              : 'РЕЙТИНГ ЛУЧШИХ Care OS'}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

                <div className="bg-gradient-to-br from-indigo-500/10 to-sky-500/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full filter blur-xl group-hover:bg-sky-500/20 transition-all duration-700" />
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 border border-sky-400/20 rounded-full text-[8px] font-bold text-sky-400 uppercase tracking-widest">
                      <Sparkles size={9} />
                      <span>CHIEF UI/UX ARCHITECT</span>
                    </div>
                    <h3 className="text-md font-bold text-white">Maksym Skorina</h3>
                    <p className="text-[11px] text-slate-400 leading-normal max-w-sm">
                      Главный дизайнер интерфейса, автор концепции швейцарского минимализма и глубокого стекломорфизма. Спроектировал идеальный Dock и плавные транзиты в стиле macOS.
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-3 flex items-center gap-4 text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 font-mono">СТУДИЯ</span>
                      <span className="font-bold text-slate-200">Skorina Designs</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 font-mono">ТЕХНОЛОГИИ</span>
                      <span className="font-bold text-slate-200">SwiftUI Concept & React</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center gap-3 text-xs">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                  <LayoutGrid size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Умное удержание Care OS</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Благодаря интерактивным виджетам на рабочем столе и динамической панели уведомлений Dynamic Island игроки своевременно узнают о нуждах своих котиков. Это делает заботу вовлекающей и ненавязчивой!
                  </p>
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
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                  👑 Мировой рейтинг приютов Care OS
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Повышайте уровни котиков, кормите, играйте и накапливайте ценные лапки 🐾, чтобы войти в элитный зал славы владельцев.
                </p>
              </div>

              <div className="space-y-2 bg-black/35 rounded-2xl p-3 border border-white/5">
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user, index) => {
                    const maxPaws = Math.max(1, ...sortedUsers.map(u => u.paws || 0));
                    const fillPct = Math.min(100, Math.round(((user.paws || 0) / maxPaws) * 100));
                    const isMe = user.id === profile.id || user.nickname === profile.nickname;
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
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold truncate ${isMe ? 'text-rose-300 font-extrabold' : 'text-slate-100'}`}>
                                {user.nickname || 'Без имени'}
                              </span>
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
                          <span className="text-xs font-black font-mono text-white">🐾 {user.paws || 0}</span>
                          <span className="text-[8px] text-slate-500 block">лапок</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 py-6 text-sm">
                    Загрузка данных рейтинга...
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