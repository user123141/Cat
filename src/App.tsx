import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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
import { AdminPanel } from './components/AdminPanel';
import { playWindowOpenSound, playWindowCloseSound, playMacClickSound, setSoundsMuted, triggerHaptic } from './utils/audio';
import { useZIndex } from './context/ZIndexContext';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

// Получить всех пользователей из Firebase
const getUsersFromFirestore = async () => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('❌ Ошибка получения пользователей из Firebase:', e);
    return [];
  }
};

// Обновить пользователя (для админки)
const updateUserInFirestore = async (userId: string, data: any) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, data);
};

// Удалить пользователя
const deleteUserFromFirestore = async (userId: string) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
};

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

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<any>(null);

  const [usersList, setUsersList] = useState<any[]>([]);
  const touchTimerRef = useRef<any>(null);
  const syncIntervalRef = useRef<any>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Никогда');
  const [offlineProfile, setOfflineProfile] = useState<any>(null);

  // Загружаем профиль из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maccat_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        setOfflineProfile(parsed);
      }
    } catch (e) {}
  }, []);

  // Загрузка пользователей из Firebase (для админки)
  const fetchUsersList = useCallback(async () => {
    const users = await getUsersFromFirestore();
    setUsersList(users);
  }, []);

  // Синхронизация профиля с Firebase (без блокировок)
  const syncProfileToFirestore = useCallback(async (profileData: any) => {
    if (!profileData) return false;
    if (isSyncing) {
      console.log('⏳ Синхронизация уже выполняется');
      return false;
    }
    setIsSyncing(true);
    try {
      console.log('📡 Синхронизация с Firebase...', profileData.nickname);
      
      const userData = {
        nickname: profileData.nickname,
        paws: profileData.paws,
        cats: profileData.cats,
        unlockedSkins: profileData.unlockedSkins,
        level: Math.max(0, ...profileData.cats.map((c: any) => c.level || 1)),
        isAdmin: profileData.isAdmin || false,
        blocked: profileData.blocked || false,
        updatedAt: new Date().toISOString(),
      };

      // Используем nickname как ID документа
      const userRef = doc(db, USERS_COLLECTION, profileData.nickname);
      await setDoc(userRef, userData, { merge: true });

      const now = new Date();
      const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
      localStorage.setItem('lastSyncTime', timeStr);
      localStorage.setItem('maccat_profile', JSON.stringify(profileData));
      
      console.log('✅ Синхронизация с Firebase завершена');
      return true;
    } catch (error) {
      console.error('❌ Ошибка синхронизации с Firebase:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Ручная синхронизация (из меню или настроек)
  const handleManualSync = useCallback(async () => {
    const currentProfile = profile || offlineProfile;
    if (!currentProfile) {
      console.warn('⚠️ Нет профиля для синхронизации');
      return;
    }
    await syncProfileToFirestore(currentProfile);
    if (isAdminMode) {
      await fetchUsersList();
    }
  }, [profile, offlineProfile, syncProfileToFirestore, isAdminMode, fetchUsersList]);

  // При входе в админ-режим загружаем список
  useEffect(() => {
    if (isAdminMode) {
      fetchUsersList();
    }
  }, [isAdminMode, fetchUsersList]);

  // Автосохранение каждую минуту (только если синхронизация не занята)
  useEffect(() => {
    if (!profile) return;
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = setInterval(async () => {
      if (isSyncing) return;
      localStorage.setItem('maccat_profile', JSON.stringify(profile));
      await syncProfileToFirestore(profile);
      if (isAdminMode) fetchUsersList();
    }, 60000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [profile, syncProfileToFirestore, isAdminMode, fetchUsersList, isSyncing]);

  // ОДНОКРАТНАЯ ПЕРВИЧНАЯ СИНХРОНИЗАЦИЯ (запускается один раз)
  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (!profile) return;
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;
    console.log('📤 Первичная синхронизация профиля...');
    // Даём задержку, чтобы интерфейс отрисовался
    setTimeout(() => {
      syncProfileToFirestore(profile).then((success) => {
        if (success) {
          console.log('✅ Первичная синхронизация завершена');
        } else {
          console.warn('⚠️ Первичная синхронизация не удалась');
        }
      });
    }, 500);
  }, [profile, syncProfileToFirestore]);

  // Звуки, тема и остальные хуки (без изменений)
  useEffect(() => {
    if (profile) {
      setSoundsMuted(!profile.soundEnabled);
    }
  }, [profile?.soundEnabled]);

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

  useEffect(() => {
    let inactivityTimer: any;
    const resetTimer = () => {
      if (showScreensaver) return;
      clearTimeout(inactivityTimer);
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

  useLayoutEffect(() => {
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

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const activeCat = profile?.cats?.find((c) => c.id === profile.activeCatId);
  
  const getSkinColors = useCallback((skinId: string) => {
    const skin = allSkins.find(s => s.id === skinId);
    if (skin) {
      return { color: skin.color, patternColor: skin.patternColor, eyeColor: skin.eyeColor };
    }
    return { color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
  }, [allSkins]);

  const activeSkinColors = activeCat ? getSkinColors(activeCat.skinId) : null;

  // Админ-функции
  const handleBlockUser = async (userId: string) => {
    try {
      await updateUserInFirestore(userId, { blocked: true });
      await fetchUsersList();
    } catch (e) { console.error(e); }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await updateUserInFirestore(userId, { blocked: false });
      await fetchUsersList();
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Удалить пользователя и все его данные?')) {
      try {
        await deleteUserFromFirestore(userId);
        await fetchUsersList();
      } catch (e) { console.error(e); }
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await updateUserInFirestore(userId, { isAdmin: true });
      await fetchUsersList();
    } catch (e) { console.error(e); }
  };

  const handleChangeBalance = async (userId: string, amount: number) => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, { paws: amount });
      await fetchUsersList();
    } catch (e) { console.error(e); }
  };

  const handleCreatorClick = () => {
    setClickCount(prev => prev + 1);
    if (clickTimer) clearTimeout(clickTimer);
    setClickTimer(setTimeout(() => {
      setClickCount(0);
    }, 2000));
    if (clickCount >= 2) {
      setClickCount(0);
      setShowAdminPrompt(true);
      if (clickTimer) clearTimeout(clickTimer);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === '1111') {
      setIsAdminMode(true);
      setShowAdminPrompt(false);
      setAdminPassword('');
      triggerHaptic(30);
      fetchUsersList();
    } else {
      triggerHaptic(50);
      setAdminPassword('');
      alert('Неверный пароль');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setUsersList([]);
  };

  const handleOpenWindow = (windowId: string, fromWidget = false) => {
    setShowAdoptionForm(false);
    setOpenWindows((prev) => {
      if (!prev.includes(windowId)) {
        return [...prev, windowId];
      }
      return prev;
    });
    focusWindow(windowId);
    if (minimizedWindows.includes(windowId)) {
      setMinimizedWindows((prev) => prev.filter((id) => id !== windowId));
      setActiveWindow(windowId);
      return;
    }
    if (activeWindow === windowId) {
      if (fromWidget) {
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

  const displayProfile = profile || offlineProfile;
  if (!displayProfile) {
    return <Onboarding onCreateProfile={createProfile} />;
  }

  const syncProps = {
    syncing: isSyncing,
    onSync: handleManualSync,
    lastSyncedTime: lastSyncTime,
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
      <DesktopBackground
        wallpaperId={displayProfile?.currentWallpaper || 'ventura'}
        weatherOverride={weatherOverride}
      />

      <AnimatePresence>
        {contextMenu && (
          <DesktopContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onUpdateWallpaper={(id) => updateWallpaper(id)}
            onUpdateWeather={(w) => setWeatherOverride(w)}
            activeWeather={weatherOverride}
            activeWallpaper={displayProfile?.currentWallpaper || 'ventura'}
            onOpenApp={(id) => handleOpenWindow(id, true)}
          />
        )}
      </AnimatePresence>

      <MenuBar
        profile={displayProfile}
        isOnline={isOnline}
        syncing={syncProps.syncing}
        onSync={syncProps.onSync}
        onOpenSettings={() => handleOpenWindow('settings')}
        onOpenAbout={() => handleOpenWindow('analytics')}
        onCreatorClick={handleCreatorClick}
        isAdminMode={isAdminMode}
      >
        <DynamicIsland notifications={notifications} onDismiss={removeNotification} />
      </MenuBar>

      <SwiftUIWidgets
        profile={displayProfile}
        activeCat={activeCat}
        onInteract={interactWithCat}
        onOpenWindow={(id) => handleOpenWindow(id, true)}
      />

      <div className="absolute top-0 left-0 w-full h-full pt-9 pb-20 z-20 pointer-events-none">
        <div className="w-full h-full relative pointer-events-none">
          <AnimatePresence>
            {openWindows.includes('cats') && !showAdoptionForm && !minimizedWindows.includes('cats') && (
              <CatWindow
                key="cats"
                profile={displayProfile}
                activeCat={activeCat}
                onInteract={interactWithCat}
                onSelectCat={selectActiveCat}
                onClose={() => handleCloseWindow('cats')}
                onMinimize={() => handleMinimizeWindow('cats')}
                onAdoptClick={() => setShowAdoptionForm(true)}
                onPetClick={petCatClick}
              />
            )}

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
                    <p className="text-xs text-slate-400">Стоимость усыновления: <span className="font-bold text-sky-400">🐾 200 лапок</span>. У вас есть: <span className="font-bold text-sky-400">🐾 {displayProfile.paws} лапок</span></p>
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
                      disabled={adoptionName.trim().length < 2 || displayProfile.paws < 200}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                    >
                      Приютить (🐾 200)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {openWindows.includes('shop') && !minimizedWindows.includes('shop') && (
              <ShopWindow
                key="shop"
                profile={displayProfile}
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

            {openWindows.includes('quests') && !minimizedWindows.includes('quests') && (
              <QuestsWindow
                key="quests"
                profile={displayProfile}
                onClaimReward={claimQuestReward}
                onClose={() => handleCloseWindow('quests')}
                onMinimize={() => handleMinimizeWindow('quests')}
              />
            )}

            {openWindows.includes('analytics') && !minimizedWindows.includes('analytics') && (
              <AnalyticsWindow
                key="analytics"
                profile={displayProfile}
                analytics={analytics}
                usersList={usersList}
                onClose={() => handleCloseWindow('analytics')}
                onMinimize={() => handleMinimizeWindow('analytics')}
              />
            )}

            {openWindows.includes('settings') && !minimizedWindows.includes('settings') && (
              <SettingsWindow
                key="settings"
                profile={displayProfile}
                syncing={syncProps.syncing}
                onSync={syncProps.onSync}
                onUpdateNickname={updateNickname}
                onUpdateTheme={updateThemePref}
                onUpdateWallpaper={updateWallpaper}
                onClaimReviewReward={claimReviewReward}
                isOfflineMode={isOfflineMode}
                setIsOfflineMode={setIsOfflineMode}
                syncLog={syncLog}
                lastSyncedTime={syncProps.lastSyncedTime}
                onRedeemPromo={redeemPromoCode}
                onClose={() => handleCloseWindow('settings')}
                onMinimize={() => handleMinimizeWindow('settings')}
              />
            )}

            {openWindows.includes('antistress') && !minimizedWindows.includes('antistress') && (
              <AntistressWindow
                key="antistress"
                profile={displayProfile}
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

      {isAdminMode && (
        <AdminPanel
          usersList={usersList}
          onClose={handleAdminLogout}
          onUpdateUsers={fetchUsersList}
          currentUser={displayProfile}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onDeleteUser={handleDeleteUser}
          onMakeAdmin={handleMakeAdmin}
          onChangeBalance={handleChangeBalance}
        />
      )}

      {showAdminPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-sm mb-2">Введите пароль администратора</h3>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 mb-3"
              placeholder="Пароль"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminPrompt(false); setAdminPassword(''); }}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 transition"
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      )}

      {showConflictModal && conflictCloudData && conflictLocalData && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-2xl animate-bounce">⚠️</div>
              <h2 className="text-lg font-bold text-white">Разрешение конфликта синхронизации</h2>
              <p className="text-xs text-slate-400">Обнаружена рассинхронизация с сервером Firebase. Вероятно, вы играли с другого устройства. Пожалуйста, выберите способ слияния.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-1 text-left">
                <span className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider">Это Устройство (Локально)</span>
                <div className="text-sm font-bold text-white">{conflictLocalData.nickname}</div>
                <div className="text-xs text-slate-300">Баланс: <span className="font-bold text-sky-400">🐾 {conflictLocalData.paws}</span></div>
                <div className="text-xs text-slate-300">Котов: <span className="font-bold">{conflictLocalData.cats.length}</span></div>
                <div className="text-xs text-slate-300">Скинов: <span className="font-bold">{conflictLocalData.unlockedSkins.length}</span></div>
              </div>
              <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl space-y-1 text-left">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Облако Firebase</span>
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
                <button onClick={() => resolveConflict('keep_local')} className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] active:scale-95 transition-all cursor-pointer">💻 Оставить Локальное</button>
                <button onClick={() => resolveConflict('keep_cloud')} className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] active:scale-95 transition-all cursor-pointer">☁️ Оставить из Облака</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dock activeWindow={activeWindow} minimizedWindows={minimizedWindows} onOpenWindow={handleOpenWindow} />

      <AnimatePresence>
        {showScreensaver && (
          <Screensaver 
            onDismiss={() => setShowScreensaver(false)} 
            activeCat={activeCat}
            activeSkin={activeSkinColors || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}