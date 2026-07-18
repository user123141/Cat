// src/components/SettingsWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlayerProfile } from '../types';
import { Sun, Moon, Monitor, Trash2, User, Sparkles, Star } from 'lucide-react';
import { triggerHaptic } from '../utils/audio';
import { MacCatWindowFrame } from './MacCatWindowFrame';

interface SettingsWindowProps {
  profile: PlayerProfile | null;
  onUpdateNickname: (name: string) => void;
  onUpdateTheme: (theme: 'light' | 'dark' | 'auto') => void;
  onClaimReviewReward: () => void;
  onClose: () => void;
  onMinimize: () => void;
  syncing?: boolean;
  onSync?: () => void;
  isOfflineMode?: boolean;
  setIsOfflineMode?: (val: boolean) => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({
  profile,
  onUpdateNickname,
  onUpdateTheme,
  onClaimReviewReward,
  onClose,
  onMinimize,
}) => {
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || '');
  const [exportCode, setExportCode] = useState('');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedStatus, setPastedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Применение темы (оставляем для авто-темы, но UI блока нет)
  useEffect(() => {
    if (!profile) return;
    const root = document.documentElement;
    const theme = profile.theme;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [profile]);

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
      setExportCode(b64);
      navigator.clipboard.writeText(b64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportSave = () => {
    try {
      if (!importCodeInput.trim()) return;
      const jsonStr = decodeURIComponent(escape(atob(importCodeInput.trim())));
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
      title="Настройки"
      subtitle="Система"
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/40 space-y-4">
        {/* ===== PUSH-УВЕДОМЛЕНИЯ ===== */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            Push-уведомления
          </h3>
          <p className="text-[10px] text-slate-400 leading-normal text-left">
            Получайте напоминания, когда питомец проголодается или захочет играть.
          </p>
          <button
            onClick={async () => {
              if (!('Notification' in window)) {
                alert('Ваш браузер не поддерживает уведомления.');
                return;
              }
              const perm = await Notification.requestPermission();
              if (perm === 'granted') {
                new Notification('MacCat 🐾', {
                  body: 'Уведомления включены!',
                  tag: 'maccat_test',
                });
              } else {
                alert('Разрешение отклонено.');
              }
            }}
            className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            🔔 Разрешить уведомления
          </button>
        </div>

        {/* ===== БОНУС ЗА ОТЗЫВ ===== */}
        {!profile.claimedReviewReward && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Star size={20} className="animate-spin-slow" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">Бонус за отзыв! ⭐️</h4>
                <p className="text-[10px] text-slate-300 leading-normal max-w-sm">
                  Оставьте отзыв – получите <span className="font-extrabold text-amber-400">+100 лапок 🐾</span>.
                </p>
              </div>
            </div>
            <button
              onClick={onClaimReviewReward}
              className="px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
            >
              Получить +100 🐾
            </button>
          </div>
        )}

        {/* ===== ПЕРЕЕЗД НА НОВЫЙ САЙТ ===== */}
        <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              🚚 ПЕРЕЕЗД НА НОВЫЙ САЙТ
            </h4>
            <p className="text-[10px] text-slate-300 leading-relaxed text-left">
              Переносим игру на новый адрес! Нажмите кнопку ниже: прогресс скопируется в буфер, и вы перейдёте на новый сайт.
            </p>
          </div>
          <button
            onClick={() => {
              try {
                const dataStr = JSON.stringify(profile);
                const b64 = btoa(unescape(encodeURIComponent(dataStr)));
                navigator.clipboard.writeText(b64);
                alert("✅ Код сохранения скопирован!\n\nПереход на новый сайт...");
                window.location.href = "https://cat-orpin-nine.vercel.app/";
              } catch (e) {
                console.error(e);
                alert("Ошибка копирования.");
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
          >
            ✈️ Скопировать прогресс и перейти
          </button>
        </div>

        {/* ===== РЕЗЕРВНОЕ КОПИРОВАНИЕ ===== */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-400" />
              Резервное копирование
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Сохраните прогресс или перенесите на другое устройство.
            </p>
          </div>

          {/* Экспорт */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Экспорт</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={exportCode}
                placeholder="Нажмите 'Создать'"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-black/35 border border-white/10 text-slate-300 focus:outline-none min-h-[40px]"
              />
              <button
                onClick={handleExportSave}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto min-h-[40px]"
              >
                {copied ? 'Скопировано! ✅' : 'Создать и скопировать'}
              </button>
            </div>
          </div>

          {/* Импорт */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Импорт</label>
            <div className="flex flex-col gap-2">
              <textarea
                value={importCodeInput}
                onChange={(e) => setImportCodeInput(e.target.value)}
                placeholder="Вставьте код сохранения..."
                className="w-full h-16 px-3 py-2 text-xs font-mono rounded-xl bg-black/35 border border-white/10 text-slate-300 focus:outline-none focus:border-sky-500 transition-all resize-none"
              />
              <button
                onClick={handleImportSave}
                className={`w-full py-2 text-xs font-bold rounded-xl text-white transition-all cursor-pointer min-h-[40px] ${
                  pastedStatus === 'success'
                    ? 'bg-emerald-500'
                    : pastedStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {pastedStatus === 'success' ? '✅ Импортировано!' : pastedStatus === 'error' ? '❌ Ошибка!' : 'Импортировать и загрузить'}
              </button>
            </div>
          </div>
        </div>

        {/* ===== КРАСИВАЯ ПЛАШКА СБРОСА ДАННЫХ ===== */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Сброс всех данных</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Удалить всех котиков, лапки, скины и историю. <span className="text-rose-400 font-bold">Необратимо!</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-500/20 flex items-center gap-2 shrink-0"
            >
              <Trash2 size={14} />
              Сбросить всё
            </button>
          </div>
        </div>
      </div>

      {/* Модалка подтверждения сброса */}
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
              <div className="w-14 h-14 bg-rose-500/15 text-rose-500 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="animate-pulse" />
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-wider mb-2">Удалить всё?</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-5">
                Все ваши котики, лапки, скины и достижения будут стёрты без возможности восстановления. Вы уверены?
              </p>
              <div className="space-y-2">
                <button
                  onClick={executeReset}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-500/20"
                >
                  Да, удалить всё
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
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