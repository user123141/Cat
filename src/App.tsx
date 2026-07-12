import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { useGameState } from './hooks/useGameState';
import { MenuBar } from './components/MenuBar';
import { DynamicIsland } from './components/DynamicIsland';
import { SwiftUIWidgets } from './components/SwiftUIWidgets';
import { CatWindow } from './components/CatWindow';
import { ShopWindow } from './components/ShopWindow';
import { QuestsWindow } from './components/QuestsWindow';
import { AnalyticsWindow } from './components/AnalyticsWindow';
import { SettingsWindow } from './components/SettingsWindow';
import { AntistressWindow } from './components/AntistressWindow';
import { Onboarding } from './components/Onboarding';
import { Dock } from './components/Dock';
import { DesktopBackground } from './components/DesktopBackground';
import { Screensaver } from './components/Screensaver';
import { DesktopContextMenu } from './components/DesktopContextMenu';
import { playWindowOpenSound, playWindowCloseSound, playMacClickSound, setSoundsMuted, triggerHaptic } from './utils/audio';
import { useZIndex } from './context/ZIndexContext';

export default function App() {
  const {
    profile,
    notifications,
    isOnline,
    syncing,
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
    simulateConflictDeviceSwitch,
    redeemPromoCode,
    createProfile,
    interactWithCat,
    claimQuestReward,
    purchaseSkinOrAccessory,
    applySkinOrAccessory,
    adoptNewCat,
    selectActiveCat,
    triggerCloudSync,
    updateNickname,
    updateThemePref,
    removeNotification,
    // Дополнительные методы для интеграций
    addPaws,
    claimReviewReward,
    updateWallpaper,
    petCatClick,
    burstPopIt,
    clickKeyboard,
    addDiaryEntry,
  } = useGameState();

  const { focusWindow } = useZIndex();

  const [activeWindow, setActiveWindow] = useState<string | null>('cats');
  const [openWindows, setOpenWindows] = useState<string[]>(['cats']);
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([]);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);
  const [adoptionName, setAdoptionName] = useState('');
  const [adoptionBreedIdx, setAdoptionBreedIdx] = useState(0);

  const [showScreensaver, setShowScreensaver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [weatherOverride, setWeatherOverride] = useState<'rain' | 'snow' | 'morning' | 'night' | 'none' | null>(null);
  const [prevActiveWindow, setPrevActiveWindow] = useState<string | null>('cats');

  const touchTimerRef = useRef<any>(null);

  // Sync mute state with player preferences
  useEffect(() => {
    if (profile) {
      setSoundsMuted(!profile.soundEnabled);
    }
  }, [profile?.soundEnabled]);

  // Handle window transition sounds
  useEffect(() => {
    if (activeWindow !== prevActiveWindow) {
      if (activeWindow) {
        playWindowOpenSound();
      } else {
        playWindowCloseSound();
      }
      setPrevActiveWindow(activeWindow);
    }
  }, [activeWindow, prevActiveWindow]);

  // Inactivity Screensaver Timer
  useEffect(() => {
    let inactivityTimer: any;

    const resetTimer = () => {
      if (showScreensaver) return;
      clearTimeout(inactivityTimer);
      // Trigger screensaver after 90 seconds of inactivity
      inactivityTimer = setTimeout(() => {
        setShowScreensaver(true);
      }, 90000);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [showScreensaver]);

  // Long-press detection for touch devices (context menu trigger)
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
    clearTimeout(touchTimerRef.current);
  };

  const ADOPTION_BREEDS = [
    { id: 'Scottish Fold', name: 'Скоттиш Фраппе (Scottish Fold)', skin: 'scottish_pink' },
    { id: 'British Shorthair', name: 'Британский Плюш (British Shorthair)', skin: 'british_blue' },
    { id: 'Siamese', name: 'Королевский Сиам (Siamese)', skin: 'siamese_point' },
    { id: 'Persian', name: 'Облачный Перс (Persian)', skin: 'persian_gold' },
    { id: 'Sphynx', name: 'Лунный Сфинкс (Sphynx)', skin: 'sphynx_naked' },
  ];

  // Синхронизация системной темы
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

  // Инъекция класса темы на document element
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const activeCat = profile?.cats.find((c) => c.id === profile.activeCatId);

  // Кастомный macOS менеджер запуска окон с поддержкой Dock и сворачивания
  const handleOpenWindow = (windowId: string, fromWidget = false) => {
    setShowAdoptionForm(false);

    // Добавить в список открытых окон, если его там еще нет
    setOpenWindows((prev) => {
      if (!prev.includes(windowId)) {
        return [...prev, windowId];
      }
      return prev;
    });
    
    // Сфокусировать окно в менеджере Z-index
    focusWindow(windowId);
    
    // 1. Если окно свернуто, развернуть его
    if (minimizedWindows.includes(windowId)) {
      setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
      setActiveWindow(windowId);
      return;
    }

    // 2. Если окно уже открыто и кликнули повторно по Dock-иконке - сворачиваем в Dock (Mac-style)
    if (activeWindow === windowId) {
      if (fromWidget) {
        // Если кликнули по виджету, просто держим окно активным/фокусированным
        setActiveWindow(windowId);
      } else {
        handleMinimizeWindow(windowId);
      }
    } else {
      setActiveWindow(windowId);
    }
  };

  const handleMinimizeWindow = (windowId: string) => {
    const nextMinimized = minimizedWindows.includes(windowId) 
      ? minimizedWindows 
      : [...minimizedWindows, windowId];
    setMinimizedWindows(nextMinimized);
    
    // При сворачивании фокус переходит на последнее активное окно среди оставшихся
    const remaining = openWindows.filter((id) => id !== windowId && !nextMinimized.includes(id));
    if (remaining.length > 0) {
      const nextActive = remaining[remaining.length - 1];
      setActiveWindow(nextActive);
      focusWindow(nextActive);
    } else {
      setActiveWindow(null);
    }
  };

  const handleCloseWindow = (windowId: string) => {
    const nextOpen = openWindows.filter((id) => id !== windowId);
    setOpenWindows(nextOpen);
    setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
    
    if (activeWindow === windowId) {
      const remaining = nextOpen.filter((id) => !minimizedWindows.includes(id));
      if (remaining.length > 0) {
        const nextActive = remaining[remaining.length - 1];
        setActiveWindow(nextActive);
        focusWindow(nextActive);
      } else {
        setActiveWindow(null);
      }
    }
  };

  const handleAdoptSubmit = () => {
    if (adoptionName.trim().length >= 2 && profile) {
      const b = ADOPTION_BREEDS[adoptionBreedIdx];
      adoptNewCat(adoptionName.trim(), b.id, b.skin);
      setAdoptionName('');
      setShowAdoptionForm(false);
    }
  };

  // Метод для получения фонового градиента по обоям из профиля
  const getWallpaperBackground = () => {
    const wall = profile?.currentWallpaper || 'ventura';
    if (wall === 'monterey') {
      return "bg-gradient-to-tr from-pink-600 via-purple-700 to-indigo-900";
    }
    if (wall === 'sonoma') {
      return "bg-gradient-to-b from-sky-400 via-emerald-400 to-amber-200";
    }
    if (wall === 'sequoia') {
      return "bg-gradient-to-br from-emerald-950 via-slate-900 to-neutral-950";
    }
    // ventura default
    return "bg-gradient-to-tr from-orange-400 via-pink-600 to-indigo-900";
  };

  return (
    <div 
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        const isInsideWindow = target.closest('.mac-window-frame') || target.closest('.glass-panel-dark') || target.closest('button') || target.closest('input');
        if (!isInsideWindow) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
          playMacClickSound();
        }
      }}
      onClick={() => setContextMenu(null)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden select-none transition-all duration-1000 ${
        resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
      }`}
    >
      
      {/* 1. ONBOARDING IF NO PROFILE */}
      {!profile ? (
        <Onboarding onCreateProfile={createProfile} />
      ) : (
        <>
          {/* 2. DYNAMIC DECORATIVE WALLPAPER WITH MANUAL OVERRIDE SUPPORT */}
          <DesktopBackground 
            wallpaperId={profile?.currentWallpaper || 'ventura'} 
            weatherOverride={weatherOverride}
          />

          {/* Context Menu overlay */}
          <AnimatePresence>
            {contextMenu && (
              <DesktopContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={() => setContextMenu(null)}
                onUpdateWallpaper={(id) => updateWallpaper(id)}
                onUpdateWeather={(w) => setWeatherOverride(w)}
                activeWeather={weatherOverride}
                activeWallpaper={profile?.currentWallpaper || 'ventura'}
                onOpenApp={(id) => handleOpenWindow(id, true)}
              />
            )}
          </AnimatePresence>

          {/* 3. MENU BAR (TOP) with Nested DYNAMIC ISLAND */}
          <MenuBar
            profile={profile}
            isOnline={isOnline}
            syncing={syncing}
            onSync={triggerCloudSync}
            onOpenSettings={() => handleOpenWindow('settings')}
            onOpenAbout={() => handleOpenWindow('analytics')}
          >
            <DynamicIsland
              notifications={notifications}
              onDismiss={removeNotification}
            />
          </MenuBar>

          {/* 5. INTERACTIVE SMART DESKTOP WIDGETS */}
          <SwiftUIWidgets
            profile={profile}
            activeCat={activeCat}
            onInteract={interactWithCat}
            onOpenWindow={(id) => handleOpenWindow(id, true)}
          />

          {/* 6. WINDOWS VIEW MANAGER (Smart pointer-events toggle to prevent widget click blocking) */}
          <div className="absolute inset-0 pt-14 pb-24 z-20 pointer-events-none">
            <div className="w-full h-full relative pointer-events-none">
              <AnimatePresence>
                
                {/* A. Care room window */}
                {openWindows.includes('cats') && !showAdoptionForm && !minimizedWindows.includes('cats') && (
                  <CatWindow
                    key="cats"
                    profile={profile}
                    activeCat={activeCat}
                    onInteract={interactWithCat}
                    onSelectCat={selectActiveCat}
                    onClose={() => handleCloseWindow('cats')}
                    onMinimize={() => handleMinimizeWindow('cats')}
                    onAdoptClick={() => setShowAdoptionForm(true)}
                    onPetClick={petCatClick}
                  />
                )}

                {/* B. Adopt Form inside CatWindow */}
                {openWindows.includes('cats') && showAdoptionForm && !minimizedWindows.includes('cats') && (
                  <div
                    key="adopt"
                    className="absolute top-10 bottom-24 left-2 right-2 md:left-24 md:right-24 glass-panel-dark text-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-30 border border-white/10 pointer-events-auto"
                  >
                    <div className="h-12 bg-black/40 border-b border-white/5 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setShowAdoptionForm(false)}
                          className="w-3.5 h-3.5 rounded-full bg-mac-red hover:brightness-90 flex items-center justify-center group"
                        >
                          <span className="text-[8px] text-red-950 font-black opacity-0 group-hover:opacity-100">×</span>
                        </button>
                        <span className="text-xs font-semibold text-slate-400 ml-3">Форма Adoption</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">Регистрация в реестре</div>
                      <div className="w-16"></div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col justify-center items-center max-w-md mx-auto">
                      <div className="text-center space-y-1.5">
                        <h2 className="text-lg font-bold text-white">Приютите пушистого питомца</h2>
                        <p className="text-xs text-slate-400">Стоимость усыновления: <span className="font-bold text-sky-400">🐾 200 лапок</span>. У вас есть: <span className="font-bold text-sky-400">🐾 {profile.paws} лапок</span></p>
                      </div>

                      <div className="w-full space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">Кличка котенка</label>
                          <input
                            type="text"
                            value={adoptionName}
                            onChange={(e) => setAdoptionName(e.target.value)}
                            maxLength={14}
                            placeholder="Введите кличку"
                            className="w-full px-3.5 py-2 rounded-xl bg-black/35 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-sky-500 transition-all font-sans"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide">Выберите породу</label>
                          <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                            {ADOPTION_BREEDS.map((breed, idx) => (
                              <button
                                key={breed.id}
                                onClick={() => setAdoptionBreedIdx(idx)}
                                className={`p-2 rounded-lg text-[10px] font-bold text-left border cursor-pointer transition-all ${
                                  idx === adoptionBreedIdx
                                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                                    : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                {breed.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 w-full pt-2">
                        <button
                          onClick={() => setShowAdoptionForm(false)}
                          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleAdoptSubmit}
                          disabled={adoptionName.trim().length < 2 || profile.paws < 200}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                        >
                          Приютить (🐾 200)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. Clothes & Shop Window */}
                {openWindows.includes('shop') && !minimizedWindows.includes('shop') && (
                  <ShopWindow
                    key="shop"
                    profile={profile}
                    activeCat={activeCat}
                    allSkins={allSkins}
                    onPurchase={purchaseSkinOrAccessory}
                    onApply={applySkinOrAccessory}
                    onDonatePaws={(amount) => addPaws(amount, true)}
                    onClose={() => handleCloseWindow('shop')}
                    onMinimize={() => handleMinimizeWindow('shop')}
                    onRedeemPromo={redeemPromoCode}
                  />
                )}

                {/* D. Quests window */}
                {openWindows.includes('quests') && !minimizedWindows.includes('quests') && (
                  <QuestsWindow
                    key="quests"
                    profile={profile}
                    onClaimReward={claimQuestReward}
                    onClose={() => handleCloseWindow('quests')}
                    onMinimize={() => handleMinimizeWindow('quests')}
                  />
                )}

                {/* E. Analytics window */}
                {openWindows.includes('analytics') && !minimizedWindows.includes('analytics') && (
                  <AnalyticsWindow
                    key="analytics"
                    profile={profile}
                    analytics={analytics}
                    onClose={() => handleCloseWindow('analytics')}
                    onMinimize={() => handleMinimizeWindow('analytics')}
                  />
                )}

                {/* F. Settings window */}
                {openWindows.includes('settings') && !minimizedWindows.includes('settings') && (
                  <SettingsWindow
                    key="settings"
                    profile={profile}
                    syncing={syncing}
                    onSync={triggerCloudSync}
                    onUpdateNickname={updateNickname}
                    onUpdateTheme={updateThemePref}
                    onUpdateWallpaper={updateWallpaper}
                    onClaimReviewReward={claimReviewReward}
                    isOfflineMode={isOfflineMode}
                    setIsOfflineMode={setIsOfflineMode}
                    syncLog={syncLog}
                    lastSyncedTime={lastSyncedTime}
                    simulateConflictDeviceSwitch={simulateConflictDeviceSwitch}
                    onRedeemPromo={redeemPromoCode}
                    onClose={() => handleCloseWindow('settings')}
                    onMinimize={() => handleMinimizeWindow('settings')}
                  />
                )}

                {/* G. Antistress Window */}
                {openWindows.includes('antistress') && !minimizedWindows.includes('antistress') && (
                  <AntistressWindow
                    key="antistress"
                    profile={profile}
                    onPopBurst={burstPopIt}
                    onKeyboardClick={clickKeyboard}
                    onClose={() => handleCloseWindow('antistress')}
                    onMinimize={() => handleMinimizeWindow('antistress')}
                    onAddPaws={(amount) => addPaws(amount, false)}
                    onAddDiaryEntry={addDiaryEntry}
                  />
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* CONFLICT RESOLUTION MODAL OVERLAY */}
          {showConflictModal && conflictCloudData && conflictLocalData && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col space-y-5 animate-fade-in">
                <div className="text-center space-y-1.5">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-2xl animate-bounce">
                    ⚠️
                  </div>
                  <h2 className="text-lg font-bold text-white">Разрешение конфликта синхронизации</h2>
                  <p className="text-xs text-slate-400">
                    Обнаружена рассинхронизация с сервером Firebase. Вероятно, вы играли с другого устройства (например, iPad). Пожалуйста, выберите способ слияния вашего кошачьего прогресса.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Local Card */}
                  <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider">Это Устройство (Локально)</span>
                    <div className="text-sm font-bold text-white">{conflictLocalData.nickname}</div>
                    <div className="text-xs text-slate-300">Баланс: <span className="font-bold text-sky-400">🐾 {conflictLocalData.paws}</span></div>
                    <div className="text-xs text-slate-300">Котов в приюте: <span className="font-bold">{conflictLocalData.cats.length}</span></div>
                    <div className="text-xs text-slate-300">Активный кот: <span className="font-bold text-slate-400">{conflictLocalData.cats.find(c => c.id === conflictLocalData.activeCatId)?.name || 'Нет'} (ур. {conflictLocalData.cats.find(c => c.id === conflictLocalData.activeCatId)?.level || 1})</span></div>
                    <div className="text-xs text-slate-300">Открытых скинов: <span className="font-bold">{conflictLocalData.unlockedSkins.length}</span></div>
                  </div>

                  {/* Cloud Card */}
                  <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl space-y-1 text-left">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Облако Firebase (Сервер)</span>
                    <div className="text-sm font-bold text-white">{conflictCloudData.nickname}</div>
                    <div className="text-xs text-slate-300">Баланс: <span className="font-bold text-emerald-400">🐾 {conflictCloudData.paws}</span></div>
                    <div className="text-xs text-slate-300">Котов в приюте: <span className="font-bold">{conflictCloudData.cats.length}</span></div>
                    <div className="text-xs text-slate-300">Активный кот: <span className="font-bold text-slate-400">{conflictCloudData.cats.find(c => c.id === conflictCloudData.activeCatId)?.name || 'Нет'} (ур. {conflictCloudData.cats.find(c => c.id === conflictCloudData.activeCatId)?.level || 1})</span></div>
                    <div className="text-xs text-slate-300">Открытых скинов: <span className="font-bold">{conflictCloudData.unlockedSkins.length}</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => resolveConflict('merge')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center"
                  >
                    <span className="font-extrabold text-sm">🔀 Умное Слияние (Рекомендуется)</span>
                    <span className="text-[9px] font-normal opacity-90">Бережно объединит скины, котов и выберет максимальный баланс и уровни</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => resolveConflict('keep_local')}
                      className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                    >
                      💻 Оставить Локальное
                    </button>
                    <button
                      onClick={() => resolveConflict('keep_cloud')}
                      className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                    >
                      ☁️ Оставить из Облака
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. DOCK LAUNCHER (BOTTOM) */}
          <Dock
            activeWindow={activeWindow}
            minimizedWindows={minimizedWindows}
            onOpenWindow={handleOpenWindow}
          />

          {/* 8. SCREENSAVER LAYER */}
          <AnimatePresence>
            {showScreensaver && (
              <Screensaver onDismiss={() => setShowScreensaver(false)} />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
