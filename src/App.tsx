// src/App.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useGameState } from './hooks/useGameState';
import { GameLogger } from './utils/GameLogger';
import { MenuBar } from './components/MenuBar';
import { DynamicIsland } from './components/DynamicIsland';
import { SwiftUIWidgets } from './components/SwiftUIWidgets';
import { CatWindow } from './components/CatWindow';
import { ShopWindow } from './components/ShopWindow';
import { QuestsWindow } from './components/QuestsWindow';
import { AnalyticsWindow } from './components/AnalyticsWindow';
import { SettingsWindow } from './components/SettingsWindow';
import { AntistressWindow } from './components/AntistressWindow';
import { MessengerWindow } from './components/MessengerWindow';
import { CarePackPopover } from './components/CarePackPopover';
import { Onboarding } from './components/Onboarding';
import { Dock } from './components/Dock';
import { DesktopBackground } from './components/DesktopBackground';
import { Screensaver } from './components/Screensaver';
import { DesktopContextMenu } from './components/DesktopContextMenu';
import { AdminPanel } from './components/AdminPanel';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { playWindowOpenSound, playWindowCloseSound, setSoundsMuted, triggerHaptic } from './utils/audio';
import { useWindowManager, WindowId } from './context/WindowManagerContext';
import { supabase } from './supabase';
import { PlayerProfile, Skin } from './types';

const ADMIN_PASSWORD = '1111';

export default function App() {
  const {
    profile,
    notifications,
    isOnline,
    syncing: syncingState,
    analytics,
    allSkins,
    isOfflineMode,
    setIsOfflineMode,
    syncLog,
    lastSyncedTime,
    showConflictModal,
    setShowConflictModal,
    conflictCloudData,
    conflictLocalData,
    resolveConflict,
    redeemPromoCode,
    createProfile,
    interactWithCat,
    claimQuestReward,
    purchaseSkinOrAccessory,
    applySkinOrAccessory,
    adoptNewCat,
    selectActiveCat,
    triggerCloudSync: originalTriggerCloudSync,
    updateNickname,
    updateThemePref,
    removeNotification,
    addPaws,
    claimReviewReward,
    claimStreakMilestone,
    updateWallpaper,
    petCatClick,
    burstPopIt,
    clickKeyboard,
    addDiaryEntry,
    updateProfile,
  } = useGameState();

  const {
    openWindows,
    minimizedWindows,
    activeWindow,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleWindow,
  } = useWindowManager();

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [weatherOverride, setWeatherOverride] = useState<'rain' | 'snow' | 'morning' | 'night' | 'none' | null>(null);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  const [careCategory, setCareCategory] = useState<'food' | 'toy' | 'soap' | null>(null);
  const [questsInitialTab, setQuestsInitialTab] = useState<'quests' | 'calendar'>('quests');

  const handleOpenWindow = useCallback((id: WindowId) => {
    if (id === 'calendar') {
      setQuestsInitialTab('calendar');
      openWindow('quests');
    } else {
      if (id === 'quests') {
        setQuestsInitialTab('quests');
      }
      openWindow(id);
    }
  }, [openWindow]);

  const handleToggleWindow = useCallback((id: WindowId) => {
    if (id === 'calendar') {
      setQuestsInitialTab('calendar');
      toggleWindow('quests');
    } else {
      if (id === 'quests') {
        setQuestsInitialTab('quests');
      }
      toggleWindow(id);
    }
  }, [toggleWindow]);

  const handleInteractionClick = useCallback((action: string) => {
    if (action === 'feed') {
      setCareCategory('food');
    } else if (action === 'play') {
      setCareCategory('toy');
    } else if (action === 'clean') {
      setCareCategory('soap');
    } else {
      interactWithCat(action);
    }
  }, [interactWithCat]);

  const [usersList, setUsersList] = useState<any[]>([]);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Запрос разрешения на уведомления при первом запуске
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          console.log('🔔 Уведомления разрешены');
        }
      });
    }
  }, []);

  const fetchUsersList = useCallback(async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*');
      if (error) throw error;
      setUsersList((data || []).map(row => ({ 
        id: row.id, 
        ...row.profile_data, 
        nickname: row.profile_data?.nickname || row.id,
        created_at: row.created_at
      })));
    } catch (e) {
      console.error('Ошибка загрузки пользователей:', e);
    }
  }, []);

  const syncStateRef = useRef({
    profile,
    isOnline,
    isOfflineMode,
    showConflictModal,
    originalTriggerCloudSync
  });

  useEffect(() => {
    syncStateRef.current = {
      profile,
      isOnline,
      isOfflineMode,
      showConflictModal,
      originalTriggerCloudSync
    };
  }, [profile, isOnline, isOfflineMode, showConflictModal, originalTriggerCloudSync]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = syncStateRef.current;
      if (state.profile && state.isOnline && !state.isOfflineMode && !state.showConflictModal) {
        state.originalTriggerCloudSync();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const updateTheme = () => {
      if (profile.theme === 'auto') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isSystemDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(profile.theme);
      }
    };
    updateTheme();
    if (profile.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [profile?.theme]);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (profile) {
      setSoundsMuted(!profile.soundEnabled);
    }
  }, [profile?.soundEnabled]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      if (showScreensaver) return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => setShowScreensaver(true), 90000);
    };
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [showScreensaver]);

  const handleAdminLogin = () => {
    setShowAdminPrompt(true);
  };

  const handleAdminPassword = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setShowAdminPrompt(false);
      triggerHaptic(30);
      fetchUsersList();
    } else {
      triggerHaptic(50);
      alert('Неверный пароль');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setUsersList([]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInsideWindow = target.closest('.mac-window-frame') || target.closest('.glass-panel-dark') || target.closest('button') || target.closest('input');
    if (!isInsideWindow) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isInsideWindow = target.closest('.mac-window-frame') || target.closest('.glass-panel-dark') || target.closest('button') || target.closest('input');
    if (isInsideWindow) return;
    const touch = e.touches[0];
    touchTimerRef.current = setTimeout(() => {
      triggerHaptic(30);
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    }, 700);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const activeCat = profile?.cats?.find(c => c.id === profile.activeCatId);

  const handleManualSync = useCallback(async () => {
    GameLogger.log('info', 'Ручная синхронизация запущена из меню настроек App.tsx');
    await originalTriggerCloudSync();
    if (isAdminMode) {
      await fetchUsersList();
    }
  }, [originalTriggerCloudSync, isAdminMode, fetchUsersList]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (profile) {
        localStorage.setItem('maccat_profile', JSON.stringify(profile));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [profile]);

  if (!profile) {
    return <Onboarding onCreateProfile={createProfile} />;
  }

  // Check if user is blocked and if ban has expired
  const isBanActive = (() => {
    if (!profile?.blocked) return false;
    if (profile.blockedUntil === -1) return true; // permanent
    if (profile.blockedUntil && Date.now() < profile.blockedUntil) {
      return true; // ban is still active
    }
    return false; // ban expired
  })();

  if (profile && isBanActive) {
    const banDateStr = profile.blockedUntil === -1 ? 'Перманентно ♾️' : new Date(profile.blockedUntil).toLocaleString('ru-RU');
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none z-[9999] font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-4xl animate-pulse">
            🚫
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Ваш аккаунт заблокирован</h1>
            <p className="text-sm text-slate-400">Администрация Care OS ограничила доступ к вашей учетной записи.</p>
          </div>
          
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 text-left space-y-2.5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Причина блокировки</span>
              <p className="text-sm text-slate-200 font-medium">{profile.blockedReason || 'Нарушение правил игры или использование стороннего ПО'}</p>
            </div>
            <div className="border-t border-white/5 pt-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Блокировка действует до</span>
              <p className="text-sm text-rose-400 font-bold">{banDateStr}</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 leading-normal">
            Если вы считаете, что блокировка была выдана ошибочно, пожалуйста, обратитесь к администратору игры.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden select-none transition-all duration-1000 ${
        resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
      }`}
    >
      <DesktopBackground wallpaperId={profile.currentWallpaper} weatherOverride={weatherOverride} />

      <AnimatePresence>
        {contextMenu && (
          <DesktopContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onUpdateWallpaper={updateWallpaper}
            onUpdateWeather={(w) => setWeatherOverride(w)}
            activeWeather={weatherOverride}
            activeWallpaper={profile.currentWallpaper}
            onOpenApp={(id) => handleOpenWindow(id as WindowId)}
          />
        )}
      </AnimatePresence>

      <MenuBar
        profile={profile}
        isOnline={isOnline}
        syncing={syncingState}
        onSync={handleManualSync}
        onOpenSettings={() => handleOpenWindow('settings')}
        onOpenAbout={() => handleOpenWindow('analytics')}
        onAppleClick={() => {
          triggerHaptic();
          if (isAdminMode) {
            // Already open
          } else {
            handleAdminLogin();
          }
        }}
        onStreakClick={() => {
          triggerHaptic();
          handleOpenWindow('calendar');
        }}
        isAdminMode={isAdminMode}
      >
        <DynamicIsland notifications={notifications} onDismiss={removeNotification} />
      </MenuBar>

      <SwiftUIWidgets
        profile={profile}
        activeCat={activeCat}
        allSkins={allSkins}
        onInteract={handleInteractionClick}
        onOpenWindow={(id) => handleOpenWindow(id as WindowId)}
      />

      <div className="absolute top-0 left-0 w-full h-full pt-9 pb-20 z-20 pointer-events-none">
        <div className="w-full h-full relative pointer-events-none">
          <AnimatePresence>
            {openWindows.includes('cats') && (
              <div key="cats" className={minimizedWindows.includes('cats') ? 'hidden' : 'contents'}>
                <CatWindow
                  profile={profile}
                  activeCat={activeCat}
                  allSkins={allSkins}
                  onInteract={handleInteractionClick}
                  onSelectCat={selectActiveCat}
                  onClose={() => closeWindow('cats')}
                  onMinimize={() => minimizeWindow('cats')}
                  onAdoptClick={() => handleOpenWindow('cats')}
                  onPetClick={petCatClick}
                />
              </div>
            )}

            {openWindows.includes('shop') && (
              <div key="shop" className={minimizedWindows.includes('shop') ? 'hidden' : 'contents'}>
                <ShopWindow
                  profile={profile}
                  activeCat={activeCat}
                  allSkins={allSkins}
                  onPurchase={purchaseSkinOrAccessory}
                  onApply={applySkinOrAccessory}
                  onDonatePaws={(amount) => addPaws(amount, true)}
                  onClose={() => closeWindow('shop')}
                  onMinimize={() => minimizeWindow('shop')}
                  onRedeemPromo={redeemPromoCode}
                />
              </div>
            )}

            {openWindows.includes('quests') && (
              <div key="quests" className={minimizedWindows.includes('quests') ? 'hidden' : 'contents'}>
                <QuestsWindow
                  profile={profile}
                  activeCat={activeCat}
                  onInteract={handleInteractionClick}
                  onClaimReward={claimQuestReward}
                  onClaimMilestone={claimStreakMilestone}
                  onClose={() => closeWindow('quests')}
                  onMinimize={() => minimizeWindow('quests')}
                  initialTab={questsInitialTab}
                />
              </div>
            )}

            {openWindows.includes('analytics') && (
              <div key="analytics" className={minimizedWindows.includes('analytics') ? 'hidden' : 'contents'}>
                <AnalyticsWindow
                  profile={profile}
                  analytics={analytics}
                  usersList={usersList}
                  onClose={() => closeWindow('analytics')}
                  onMinimize={() => minimizeWindow('analytics')}
                />
              </div>
            )}

            {openWindows.includes('settings') && (
              <div key="settings" className={minimizedWindows.includes('settings') ? 'hidden' : 'contents'}>
                <SettingsWindow
                  profile={profile}
                  syncing={syncingState}
                  onSync={handleManualSync}
                  onUpdateNickname={updateNickname}
                  onUpdateTheme={updateThemePref}
                  onClaimReviewReward={claimReviewReward}
                  isOfflineMode={isOfflineMode}
                  setIsOfflineMode={setIsOfflineMode}
                  onClose={() => closeWindow('settings')}
                  onMinimize={() => minimizeWindow('settings')}
                />
              </div>
            )}

            {openWindows.includes('antistress') && (
              <div key="antistress" className={minimizedWindows.includes('antistress') ? 'hidden' : 'contents'}>
                <AntistressWindow
                  profile={profile}
                  onPopBurst={burstPopIt}
                  onKeyboardClick={clickKeyboard}
                  onClose={() => closeWindow('antistress')}
                  onMinimize={() => minimizeWindow('antistress')}
                  onAddPaws={(amount) => addPaws(amount, false)}
                  onAddDiaryEntry={addDiaryEntry}
                />
              </div>
            )}

            {openWindows.includes('messenger') && (
              <div key="messenger" className={minimizedWindows.includes('messenger') ? 'hidden' : 'contents'}>
                <MessengerWindow
                  profile={profile}
                  onClose={() => closeWindow('messenger')}
                  onMinimize={() => minimizeWindow('messenger')}
                  onUpdateNickname={updateNickname}
                  usersList={usersList}
                  updateProfile={updateProfile}
                  allSkins={allSkins}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isAdminMode && (
        <AdminPanel
          usersList={usersList}
          onClose={handleAdminLogout}
          onUpdateUsers={fetchUsersList}
          currentUser={profile}
          onBlockUser={async (uid, reason, durationMinutes) => {
            if (!supabase) return;
            const u = usersList.find(x => x.id === uid);
            if (!u) return;
            const blockedUntil = durationMinutes === -1 ? -1 : Date.now() + durationMinutes * 60 * 1000;
            const updated = { ...u, blocked: true, blockedReason: reason, blockedUntil: blockedUntil };
            delete updated.id;
            await supabase.from('player_profiles').update({ profile_data: updated }).eq('id', uid);
            fetchUsersList();
          }}
          onUnblockUser={async (uid) => {
            if (!supabase) return;
            const u = usersList.find(x => x.id === uid);
            if (!u) return;
            const updated = { ...u, blocked: false };
            delete updated.id;
            await supabase.from('player_profiles').update({ profile_data: updated }).eq('id', uid);
            fetchUsersList();
          }}
          onDeleteUser={async (uid) => {
            if (!supabase) return;
            await supabase.from('player_profiles').delete().eq('id', uid);
            fetchUsersList();
          }}
          onMakeAdmin={async (uid) => {
            if (!supabase) return;
            const u = usersList.find(x => x.id === uid);
            if (!u) return;
            const updated = { ...u, isAdmin: true };
            delete updated.id;
            await supabase.from('player_profiles').update({ profile_data: updated }).eq('id', uid);
            fetchUsersList();
          }}
          onChangeBalance={async (uid, amount) => {
            if (!supabase) return;
            const u = usersList.find(x => x.id === uid);
            if (!u) return;
            const updated = { ...u, paws: amount };
            delete updated.id;
            await supabase.from('player_profiles').update({ profile_data: updated }).eq('id', uid);
            fetchUsersList();
          }}
        />
      )}

      {showAdminPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-sm mb-2">Введите пароль администратора</h3>
            <input
              type="password"
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 mb-3"
              placeholder="Пароль"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdminPassword((e.target as HTMLInputElement).value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminPrompt(false); }}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                  handleAdminPassword(input.value);
                }}
                className="flex-1 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition"
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminDashboardModal
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
        profile={profile}
        isOnline={isOnline}
        syncing={syncingState}
        isAdminMode={isAdminMode}
        onOpenAdminPanel={() => setIsAdminMode(true)}
        onOpenLoginPrompt={() => setShowAdminPrompt(true)}
      />

      {showConflictModal && conflictCloudData && conflictLocalData && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-2xl animate-bounce">⚠️</div>
              <h2 className="text-lg font-bold text-white">Разрешение конфликта синхронизации</h2>
              <p className="text-xs text-slate-400">Обнаружена рассинхронизация прогресса. Вероятно, вы играли с другого устройства. Пожалуйста, выберите способ слияния.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-1 text-left">
                <span className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider">Это Устройство</span>
                <div className="text-sm font-bold text-white">{conflictLocalData.nickname}</div>
                <div className="text-xs text-slate-300">Баланс: <span className="font-bold text-sky-400">🐾 {conflictLocalData.paws}</span></div>
                <div className="text-xs text-slate-300">Котов: <span className="font-bold">{conflictLocalData.cats.length}</span></div>
                <div className="text-xs text-slate-300">Скинов: <span className="font-bold">{conflictLocalData.unlockedSkins.length}</span></div>
              </div>
              <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl space-y-1 text-left">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Резервная копия</span>
                <div className="text-sm font-bold text-white">{conflictCloudData.nickname}</div>
                <div className="text-xs text-slate-300">Баланс: <span className="font-bold text-emerald-400">🐾 {conflictCloudData.paws}</span></div>
                <div className="text-xs text-slate-300">Котов: <span className="font-bold">{conflictCloudData.cats.length}</span></div>
                <div className="text-xs text-slate-300">Скинов: <span className="font-bold">{conflictCloudData.unlockedSkins.length}</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <button onClick={() => resolveConflict('merge')} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center">
                <span className="font-extrabold text-sm">🔀 Умное Слияние (Рекомендуется)</span>
                <span className="text-[9px] font-normal opacity-90">Объединит скины, котов и выберет максимальный баланс и уровни</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => resolveConflict('local')} className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] active:scale-95 transition-all cursor-pointer">💻 Оставить Локальное</button>
                <button onClick={() => resolveConflict('cloud')} className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] active:scale-95 transition-all cursor-pointer">☁️ Восстановить из Копии</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dock
        activeWindow={activeWindow}
        minimizedWindows={minimizedWindows}
        onOpenWindow={(id) => handleToggleWindow(id as WindowId)}
      />

      <CarePackPopover
        isOpen={careCategory !== null}
        category={careCategory}
        profile={profile}
        activeCat={activeCat}
        onClose={() => setCareCategory(null)}
        onUseItem={interactWithCat}
        onBuyItem={purchaseSkinOrAccessory}
        onOpenShop={() => handleOpenWindow('shop')}
      />

      <AnimatePresence>
        {showScreensaver && (
          <Screensaver
            onDismiss={() => setShowScreensaver(false)}
            activeCat={activeCat}
            allSkins={allSkins}
          />
        )}
      </AnimatePresence>
    </div>
  );
}