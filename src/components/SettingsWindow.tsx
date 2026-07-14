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
  const [saveCode, setSaveCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedStatus, setPastedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Эффект для применения темы к корневому элементу
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
      // auto: смотрим системную тему
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
        {/* Профиль */}
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

        {/* Тема */}
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

        {/* Push-уведомления */}
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

        {/* Бонус за отзыв (скрывается, если получен) */}
        {!profile.claimedReviewReward && (
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
              className="px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
            >
              Получить +100 🐾
            </button>
          </div>
        )}

        {/* Резервные ключи переноса */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-400" />
              Резервные Ключи Переноса
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Помимо автосохранений Firebase, вы можете экспортировать буквенные ключи для ручного переноса прогресса.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={saveCode}
              onChange={(e) => setSaveCode(e.target.value)}
              placeholder="Вставьте код сохранения"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-black/35 border border-white/10 text-slate-300 focus:outline-none focus:border-sky-500 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleExportSave}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                {copied ? 'Готово!' : 'Экспорт'}
              </button>
              <button
                onClick={handleImportSave}
                className={`flex-1 py-2 text-xs font-bold rounded-xl text-white transition-all cursor-pointer ${
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
        </div>

        {/* Footer */}
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