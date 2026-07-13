import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlayerProfile } from '../types';
import { X, Moon, Sun, Monitor, RefreshCw, Database, Trash2, User, Sparkles, Star, Percent } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface SettingsWindowProps {
  profile: PlayerProfile | null;
  syncing: boolean;
  onSync: () => void;
  onUpdateNickname: (name: string) => void;
  onUpdateTheme: (theme: 'light' | 'dark' | 'auto') => void;
  onUpdateWallpaper: (id: string) => void;
  onClaimReviewReward: () => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (off: boolean) => void;
  syncLog: string[];
  lastSyncedTime: string;
  onRedeemPromo: (code: string) => { success: boolean; message: string };
  onClose: () => void;
  onMinimize: () => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({
  profile,
  syncing,
  onSync,
  onUpdateNickname,
  onUpdateTheme,
  onUpdateWallpaper,
  onClaimReviewReward,
  isOfflineMode,
  setIsOfflineMode,
  syncLog,
  lastSyncedTime,
  onRedeemPromo,
  onClose,
  onMinimize,
}) => {
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || '');
  const [saveCode, setSaveCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedStatus, setPastedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoStatusText, setPromoStatusText] = useState('');
  const [promoStatusType, setPromoStatusType] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) return;
    const result = onRedeemPromo(promoCodeInput.trim());
    if (result.success) {
      setPromoStatusType('success');
      setPromoStatusText(result.message);
      setPromoCodeInput('');
    } else {
      setPromoStatusType('error');
      setPromoStatusText(result.message);
    }
    setTimeout(() => {
      setPromoStatusType('idle');
      setPromoStatusText('');
    }, 5000);
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
    if (diffY > 100 && Math.abs(diffX) < 60) {
      onMinimize();
    }
  };

  if (!profile) return null;

  const handleNicknameSave = () => {
    if (nicknameInput.trim().length >= 2) {
      onUpdateNickname(nicknameInput.trim());
    }
  };

  const handleExportSave = () => {
    try {
      const dataStr = JSON.stringify(profile);
      const b64 = btoa(unescape(encodeURIComponent(dataStr)));
      setSaveCode(b64);
      navigator.clipboard.writeText(b64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportSave = () => {
    try {
      if (!saveCode.trim()) return;
      const jsonStr = decodeURIComponent(escape(atob(saveCode.trim())));
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && parsed.nickname && Array.isArray(parsed.cats)) {
        localStorage.setItem('maccat_profile', jsonStr);
        setPastedStatus('success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setPastedStatus('error');
        setTimeout(() => setPastedStatus('idle'), 3000);
      }
    } catch (e) {
      setPastedStatus('error');
      setTimeout(() => setPastedStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    triggerHaptic();
    setShowResetConfirm(true);
  };

  const executeReset = () => {
    localStorage.removeItem('maccat_profile');
    localStorage.removeItem('maccat_analytics');
    window.location.reload();
  };

  return (
    <MacCatWindowFrame
      id="settings"
      onClose={onClose}
      onMinimize={onMinimize}
      title="Системные настройки"
      subtitle="Настройки"
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/40 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-sky-400" />
              Профиль Опекуна
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={16}
                placeholder="Имя опекуна"
                className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-black/35 border border-white/10 text-white focus:outline-none focus:border-sky-500 transition-all font-sans"
              />
              <button
                onClick={handleNicknameSave}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Сохранить
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sun size={14} className="text-sky-400" />
              Тема оформления
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onUpdateTheme('light')}
                className={`py-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  profile.theme === 'light'
                    ? 'bg-sky-500/25 border-sky-500 text-white'
                    : 'bg-black/25 border-transparent text-slate-400 hover:bg-black/35 hover:text-slate-200'
                }`}
              >
                <Sun size={12} />
                <span>Светлая</span>
              </button>
              <button
                onClick={() => onUpdateTheme('dark')}
                className={`py-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  profile.theme === 'dark'
                    ? 'bg-sky-500/25 border-sky-500 text-white'
                    : 'bg-black/25 border-transparent text-slate-400 hover:bg-black/35 hover:text-slate-200'
                }`}
              >
                <Moon size={12} />
                <span>Темная</span>
              </button>
              <button
                onClick={() => onUpdateTheme('auto')}
                className={`py-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  profile.theme === 'auto'
                    ? 'bg-sky-500/25 border-sky-500 text-white'
                    : 'bg-black/25 border-transparent text-slate-400 hover:bg-black/35 hover:text-slate-200'
                }`}
              >
                <Monitor size={12} />
                <span>Авто</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            Важные PUSH-Уведомления (iOS/PWA)
          </h3>
          <p className="text-[10px] text-slate-400 leading-normal text-left">
            Получайте системные напоминания на телефон или рабочий стол, когда ваш пушистый питомец проголодается или захочет поиграть!
          </p>
          <button
            onClick={async () => {
              if (!('Notification' in window)) {
                alert('Ваш браузер или устройство не поддерживает PUSH-уведомления.');
                return;
              }
              const perm = await Notification.requestPermission();
              if (perm === 'granted') {
                new Notification('MacCat Care 🐾', {
                  body: 'Уведомления включены! Теперь мы сообщим вам, когда котику потребуется забота.',
                  tag: 'maccat_test',
                });
              } else {
                alert('Разрешение на уведомления отклонено. Пожалуйста, включите их в настройках браузера/устройства.');
              }
            }}
            className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            🔔 Разрешить и протестировать Push-уведомления
          </button>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-sky-400" />
            Обои Рабочего Стола macOS
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'ventura', name: 'Ventura Orange', colors: 'bg-gradient-to-tr from-orange-400 via-pink-500 to-indigo-600' },
              { id: 'monterey', name: 'Monterey Pink', colors: 'bg-gradient-to-tr from-pink-600 via-purple-700 to-indigo-900' },
              { id: 'sonoma', name: 'Sonoma Nature', colors: 'bg-gradient-to-b from-sky-400 via-emerald-400 to-amber-200' },
              { id: 'sequoia', name: 'Sequoia Night', colors: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-neutral-950' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => onUpdateWallpaper(w.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  profile.currentWallpaper === w.id
                    ? 'border-sky-500 bg-sky-500/10 text-white'
                    : 'border-transparent bg-black/25 text-slate-400 hover:bg-black/35 hover:text-slate-200'
                }`}
              >
                <div className={`w-full h-8 rounded-lg ${w.colors} border border-white/10`} />
                <span className="text-[10px] font-bold">{w.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Star size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">Бонус за отзыв об игре! ⭐️</h4>
              <p className="text-[10px] text-slate-300 leading-normal max-w-sm">
                Оставьте отзыв о нашей игре Care OS! Вы получите <span className="font-extrabold text-amber-400">+100 лапок 🐾</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClaimReviewReward}
            disabled={profile.claimedReviewReward}
            className={`px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 ${
              profile.claimedReviewReward 
                ? 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
            }`}
          >
            {profile.claimedReviewReward ? 'Получено ✓' : 'Получить +100 🐾'}
          </button>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Percent size={14} className="text-sky-400" />
            Система промокодов
          </h3>
          <p className="text-[10px] text-slate-400 leading-normal">
            Активируйте фирменные промокоды для получения подарочных лапок 🐾. Допускается использование <strong className="text-amber-400 font-bold">не чаще одного раза в неделю</strong>.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              placeholder="Введите промокод (например, ILOVEAMINA)"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-black/35 border border-white/10 text-slate-300 focus:outline-none focus:border-sky-500 transition-all uppercase tracking-wider"
            />
            <button
              onClick={handleApplyPromo}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Активировать
            </button>
          </div>
          {promoStatusText && (
            <p className={`text-[10px] font-bold ${
              promoStatusType === 'success' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {promoStatusText}
            </p>
          )}
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5 text-left">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database size={14} className="text-emerald-400" />
                Облачная синхронизация Firebase
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Автоматическая синхронизация прогресса "на лету" с надежным механизмом разрешения конфликтов.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-black/35 px-3 py-1.5 rounded-xl border border-white/5 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Оффлайн-режим</span>
              <button
                onClick={() => {
                  triggerHaptic();
                  setIsOfflineMode(!isOfflineMode);
                }}
                className={`w-10 h-6 rounded-full transition-all relative ${
                  isOfflineMode ? 'bg-amber-500/70' : 'bg-slate-700/50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-1 left-1 transition-all ${
                  isOfflineMode ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider text-left">Управление сейвом</span>
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                  <span>{syncing ? 'Синхронизация...' : 'Выгрузить в iCloud'}</span>
                </button>
                <div className="text-[9px] text-slate-400 text-left">
                  Последний бэкап: <span className="font-bold text-slate-300">{lastSyncedTime}</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5 text-left">
              <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Консоль отладки Firestore</span>
              <div className="h-[125px] overflow-y-auto bg-black/65 border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-slate-300 space-y-1 scrollbar-thin">
                {syncLog.map((log, index) => (
                  <div key={index} className={`${
                    log.includes('✅') ? 'text-emerald-400' :
                    log.includes('⚠️') ? 'text-amber-400 font-bold' :
                    log.includes('📡') ? 'text-sky-400' : 'text-slate-400'
                  }`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3.5">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={14} className="text-sky-400" />
              Резервные Ключи Переноса
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Помимо автосохранений Firebase, вы можете экспортировать буквенные ключи для ручного переноса прогресса.
            </p>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={saveCode}
              onChange={(e) => setSaveCode(e.target.value)}
              placeholder="Вставьте код сохранения"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-black/35 border border-white/10 text-slate-300 focus:outline-none focus:border-sky-500 transition-all"
            />
            <button
              onClick={handleExportSave}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer flex-shrink-0"
            >
              {copied ? 'Готово!' : 'Экспорт'}
            </button>
            <button
              onClick={handleImportSave}
              className={`px-3 py-2 text-xs font-bold rounded-xl text-white transition-all cursor-pointer flex-shrink-0 ${
                pastedStatus === 'success'
                  ? 'bg-emerald-500'
                  : pastedStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-sky-500 hover:bg-sky-600'
              }`}
            >
              {pastedStatus === 'success' ? 'Успешно!' : pastedStatus === 'error' ? 'Ошибка!' : 'Импорт'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/5 pt-4 text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-400 text-left">
            <Sparkles size={12} className="text-amber-400" />
            <span>Главный дизайнер и разработчик Care OS: <strong className="text-slate-300">Maksym Skorina</strong></span>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 transition-all font-bold text-xs cursor-pointer flex items-center gap-1 active:scale-95 self-end sm:self-center shrink-0"
          >
            <Trash2 size={12} />
            <span>Сбросить данные</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900/90 border border-white/10 rounded-2xl max-w-xs w-full p-5 text-center shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-3.5">
                <Trash2 size={22} className="animate-pulse" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Стереть весь прогресс?</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed mb-4">
                Это действие полностью сотрет всех ваших котиков, лапки, купленные скины и историю активности. Это невозможно отменить.
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={executeReset}
                  className="w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  Стереть всё навсегда
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MacCatWindowFrame>
  );
};