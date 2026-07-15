// src/components/AdminDashboardModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Activity, Database, Cpu, Wifi, WifiOff, RefreshCw, Flame, CircleDot, User, Layers, ArrowRight } from 'lucide-react';
import { PlayerProfile } from '../types';
import { triggerHaptic } from '../utils/audio';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile | null;
  isOnline: boolean;
  syncing: boolean;
  isAdminMode: boolean;
  onOpenAdminPanel: () => void;
  onOpenLoginPrompt: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  profile,
  isOnline,
  syncing,
  isAdminMode,
  onOpenAdminPanel,
  onOpenLoginPrompt,
}) => {
  if (!isOpen) return null;

  const handleManageClick = () => {
    triggerHaptic();
    onClose();
    if (isAdminMode) {
      onOpenAdminPanel();
    } else {
      onOpenLoginPrompt();
    }
  };

  const getCompletedQuestsCount = () => {
    if (!profile || !profile.quests) return 0;
    return profile.quests.filter(q => q.completed).length;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-sky-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Care OS Diagnostics</span>
            </div>
            <button
              onClick={() => { triggerHaptic(); onClose(); }}
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 text-xs">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Серия</span>
                <div className="flex items-center gap-1">
                  <Flame size={14} className="text-rose-500 animate-pulse shrink-0" />
                  <span className="text-lg font-black text-white">{profile?.streak || 1} дн.</span>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Баланс</span>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-400 font-extrabold text-[10px]">🐾</span>
                  <span className="text-lg font-black text-white">{profile?.paws || 0}</span>
                </div>
              </div>
            </div>

            {/* Diagnostics Stats */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Activity size={10} className="text-sky-400" />
                Диагностика Системы
              </h4>

              <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5 space-y-2.5">
                {/* Connection */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    {isOnline ? <Wifi size={11} className="text-emerald-400" /> : <WifiOff size={11} className="text-rose-400" />}
                    Сеть
                  </span>
                  <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isOnline ? 'Подключено' : 'Оффлайн'}
                  </span>
                </div>

                {/* Cloud Sync */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <RefreshCw size={11} className={`text-sky-400 ${syncing ? 'animate-spin' : ''}`} />
                    Резервная база данных
                  </span>
                  <span className="font-bold text-slate-200">
                    {syncing ? 'Синхронизация...' : 'В силе (авто)'}
                  </span>
                </div>

                {/* Last Synced */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database size={11} className="text-violet-400" />
                    Сохранено в сети
                  </span>
                  <span className="font-mono text-[10px] text-slate-300 font-bold">
                    {profile?.lastSavedTime ? new Date(profile.lastSavedTime).toLocaleTimeString() : 'Нет данных'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <User size={10} className="text-emerald-400" />
                Сводка Профиля
              </h4>

              <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5 space-y-2.5">
                {/* Active Cat */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Имя игрока</span>
                  <span className="font-bold text-white">{profile?.nickname || 'Игрок'}</span>
                </div>

                {/* Cats quantity */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Питомцы</span>
                  <span className="font-bold text-slate-200">{profile?.cats?.length || 0} котиков</span>
                </div>

                {/* Quests finished */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Выполнено квестов</span>
                  <span className="font-bold text-slate-200">{getCompletedQuestsCount()} / {profile?.quests?.length || 0}</span>
                </div>

                {/* Active skin */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Разблокировано скинов</span>
                  <span className="font-bold text-slate-200">{profile?.unlockedSkins?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-4 border-t border-white/5 bg-slate-950/20">
            <button
              onClick={handleManageClick}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 cursor-pointer"
            >
              <Cpu size={14} />
              <span>{isAdminMode ? 'Панель администратора' : 'Войти как Администратор'}</span>
              <ArrowRight size={13} className="ml-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
