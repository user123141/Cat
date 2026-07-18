import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerProfile, GameAnalytics, DiaryEntry } from '../types';
import { useNotifications } from './useNotifications';
import { calculateDecay, calculateOfflineDecay } from '../game/decay';
import { useSync } from './useSync';
import { useCatActions } from './useCatActions';
import { useAdminAuth } from './useAdminAuth';
import { ALL_SKINS_LIST, INITIAL_SKINS, INITIAL_QUESTS, sendNativeNotification } from '../game/constants';

export { ALL_SKINS_LIST, INITIAL_SKINS, CONSUMABLE_ITEMS, INITIAL_QUESTS, sendNativeNotification } from '../game/constants';

export const useGameState = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    sendNativeNotification: triggerNativeNotif,
  } = useNotifications();

  const [profile, setProfile] = useState<PlayerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('maccat_profile');
    if (!saved) return null;
    try {
      const parsed: PlayerProfile = JSON.parse(saved);
      if (!parsed.id) {
        parsed.id = 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        localStorage.setItem('maccat_profile', JSON.stringify(parsed));
      }
      if (!parsed.unlockedAchievements) parsed.unlockedAchievements = [];
      if (!parsed.currentWallpaper) parsed.currentWallpaper = 'ventura';
      if (parsed.claimedReviewReward === undefined) parsed.claimedReviewReward = false;
      if (parsed.clicksCount === undefined) parsed.clicksCount = 0;
      if (parsed.popItBurstedCount === undefined) parsed.popItBurstedCount = 0;
      if (parsed.keyboardClicksCount === undefined) parsed.keyboardClicksCount = 0;
      if (!parsed.diary) parsed.diary = [];
      if (!parsed.claimedStreakMilestones) parsed.claimedStreakMilestones = [];
      
      const todayStr = new Date().toISOString().split('T')[0];
      if (!parsed.careCalendarHistory) {
        parsed.careCalendarHistory = [todayStr];
      } else if (!parsed.careCalendarHistory.includes(todayStr)) {
        parsed.careCalendarHistory.push(todayStr);
      }

      if (parsed.unlockedSkins && !parsed.unlockedSkins.includes('scottish_pink')) {
        parsed.unlockedSkins.push('scottish_pink');
      }

      if (!parsed.quests || parsed.quests.length === 0 || (parsed.quests[0].id.includes('feed') && !parsed.quests[0].text.includes('Покормить'))) {
        parsed.quests = INITIAL_QUESTS();
      }

      if (parsed.cats) {
        parsed.cats = parsed.cats.map(cat => {
          if (!cat.personality) {
            const personalities: ('lazy' | 'playful' | 'hungry')[] = ['lazy', 'playful', 'hungry'];
            cat.personality = personalities[Math.floor(Math.random() * personalities.length)];
          }
          return cat;
        });
      }

      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastActiveDay !== today) {
        parsed.quests = INITIAL_QUESTS();
        if (parsed.lastActiveDay) {
          const lastActiveDate = new Date(parsed.lastActiveDay);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastActiveDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            parsed.streak = (parsed.streak || 0) + 1;
          } else if (diffDays > 1) {
            parsed.streak = 1;
          }
        } else {
          parsed.streak = 1;
        }
        parsed.lastActiveDay = today;
        parsed.paws += 30;
      }

      if (!parsed.inventory) {
        parsed.inventory = {
          'food_kibble': 3,
          'soap_lavender': 2,
          'toy_wand': 1
        };
      }

      if (parsed.lastSavedTime) {
        const elapsedSeconds = Math.max(0, (Date.now() - parsed.lastSavedTime) / 1000);
        if (elapsedSeconds > 45) {
          parsed.cats = calculateOfflineDecay(parsed.cats, elapsedSeconds);
        }
      }

      return parsed;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const [analytics, setAnalytics] = useState<GameAnalytics>(() => {
    if (typeof window === 'undefined') return { pawsSpent: 0, skinsBought: 0, levelUps: 0, actionsPerformed: { feed: 0, play: 0, clean: 0, sleep: 0 }, retentionScore: 98, sessionDuration: 0 } as any;
    const saved = localStorage.getItem('maccat_analytics');
    try {
      return saved ? JSON.parse(saved) : { pawsSpent: 0, skinsBought: 0, levelUps: 0, actionsPerformed: { feed: 0, play: 0, clean: 0, sleep: 0 }, retentionScore: 98, sessionDuration: 0 };
    } catch {
      return { pawsSpent: 0, skinsBought: 0, levelUps: 0, actionsPerformed: { feed: 0, play: 0, clean: 0, sleep: 0 }, retentionScore: 98, sessionDuration: 0 } as any;
    }
  });

  const playTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    syncing,
    syncLog,
    lastSyncedTime,
    showConflictModal,
    setShowConflictModal,
    conflictCloudData,
    conflictLocalData,
    triggerCloudSync,
    queueSync,
    resolveConflict,
  } = useSync(profile, setProfile, isOnline, isOfflineMode);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('maccat_profile', JSON.stringify({ ...profile, lastSavedTime: Date.now() }));
    }
  }, [profile]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkForNewAchievements = useCallback((prev: PlayerProfile): PlayerProfile => {
    if (!prev.unlockedAchievements) prev.unlockedAchievements = [];
    const newlyUnlocked = [...prev.unlockedAchievements];
    let updated = false;
    const newDiaryEntries: DiaryEntry[] = [];

    const checkAndUnlock = (id: string, name: string, condition: boolean) => {
      if (condition && !newlyUnlocked.includes(id)) {
        newlyUnlocked.push(id);
        updated = true;
        setTimeout(() => {
          addNotification('🏆 Достижение разблокировано!', name, 'success');
        }, 800);
        newDiaryEntries.push({
          id: 'diary_ach_' + Math.random().toString(36).substring(2, 11),
          catId: prev.activeCatId || '',
          timestamp: Date.now(),
          type: 'achievement',
          title: `Достижение: ${name} 🏆`,
          description: `Ура! Разблокирован новый почётный кубок в вашей заботливой комнате.`,
          icon: '🏆'
        });
      }
    };

    checkAndUnlock('first_cat', '🐱 Первый друг (Приютили котенка)', prev.cats.length >= 1);
    checkAndUnlock('level_5', '⭐ Славный малый (Кот достиг 5 уровня)', prev.cats.some(c => c.level >= 5));
    checkAndUnlock('pet_50', '💖 Мастер поглаживаний (Погладили котика 50 раз)', (prev.clicksCount || 0) >= 50);
    checkAndUnlock('skin_3', '🕶️ Икона стиля (Разблокировано 3 скина)', prev.unlockedSkins.length >= 3);
    checkAndUnlock('rich_1000', '💰 Миллионер (Накоплено 1000 лапок)', prev.paws >= 1000);
    checkAndUnlock('antistress_100', '🧘 Абсолютный дзен (Лопнуто 100 пупырок Pop It)', (prev.popItBurstedCount || 0) >= 100);

    return updated
      ? { ...prev, unlockedAchievements: newlyUnlocked, diary: [...newDiaryEntries, ...(prev.diary || [])] }
      : prev;
  }, [addNotification]);

  const catActions = useCatActions(
    profile,
    setProfile,
    addNotification,
    checkForNewAchievements,
    queueSync,
    setAnalytics
  );

  const adminAuth = useAdminAuth(profile, setProfile, addNotification);

  useEffect(() => {
    if (profile && profile.lastSavedTime) {
      const elapsedSeconds = Math.max(0, (Date.now() - profile.lastSavedTime) / 1000);
      if (elapsedSeconds > 45) {
        const elapsedMins = Math.round(elapsedSeconds / 60);
        setTimeout(() => {
          addNotification('С возвращением! 🐾', `Вас не было ${elapsedMins} мин. Показатели котиков обновились.`, 'info');
          const criticalHunger = profile.cats.filter(c => c.hunger < 25).map(c => c.name);
          const criticalClean = profile.cats.filter(c => c.cleanliness < 25).map(c => c.name);
          if (criticalHunger.length > 0) {
            triggerNativeNotif('Котики хотят кушать! 🐟', `${criticalHunger.join(', ')} проголодались! Покормите их.`);
          }
          if (criticalClean.length > 0) {
            triggerNativeNotif('Котики запачкались! 🧼', `${criticalClean.join(', ')} нуждаются в мытье! Пора искупать котиков.`);
          }
        }, 1000);
      }
    }

    playTimeIntervalRef.current = setInterval(() => {
      setAnalytics((prev) => {
        const updated = { ...prev, sessionDuration: prev.sessionDuration + 1 };
        localStorage.setItem('maccat_analytics', JSON.stringify(updated));
        return updated;
      });
      setProfile((prev) => {
        if (!prev) return null;
        return { ...prev, totalPlayTime: prev.totalPlayTime + 1 };
      });
    }, 1000);

    return () => {
      if (playTimeIntervalRef.current) clearInterval(playTimeIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    const lastNotifTimes: Record<string, number> = {};
    const decayInterval = setInterval(() => {
      setProfile((prev) => {
        if (!prev) return null;
        const { updatedCats, totalPawsDiff } = calculateDecay(prev.cats, 0.5);
        const now = Date.now();
        const oneHour = 3600000;

        updatedCats.forEach((cat) => {
          const lastNotif = lastNotifTimes[cat.id] || 0;
          if (now - lastNotif < oneHour) return;

          let sent = false;
          if (cat.hunger < 25 && cat.status !== 'sleeping') {
            triggerNativeNotif('🍽️ Котик голоден!', `${cat.name} хочет кушать. Покормите его!`);
            addNotification('Голодный котик 🍽️', `${cat.name} просит вкусняшку!`, 'warning');
            sent = true;
          } else if (cat.cleanliness < 25 && cat.status !== 'sleeping') {
            triggerNativeNotif('🧼 Пора купаться!', `${cat.name} запачкался. Искупайте его!`);
            addNotification('Грязнуля 🧼', `${cat.name} нуждается в ванне!`, 'warning');
            sent = true;
          } else if (cat.happiness < 25 && cat.status !== 'sleeping') {
            triggerNativeNotif('😿 Котик грустит!', `${cat.name} хочет играть. Уделите ему внимание!`);
            addNotification('Грустный котик 😿', `${cat.name} скучает без вас!`, 'warning');
            sent = true;
          }
          if (sent) lastNotifTimes[cat.id] = now;
        });

        const nextProfile = {
          ...prev,
          cats: updatedCats,
          paws: prev.paws + totalPawsDiff,
        };
        return checkForNewAchievements(nextProfile);
      });
    }, 10000);

    return () => clearInterval(decayInterval);
  }, [profile, addNotification, checkForNewAchievements]);

  return {
    profile,
    notifications,
    isOnline,
    isOfflineMode,
    setIsOfflineMode,
    analytics,
    allSkins: ALL_SKINS_LIST,
    removeNotification,
    triggerCloudSync,

    ...catActions,
    ...adminAuth,

    syncing,
    syncLog,
    lastSyncedTime,
    showConflictModal,
    setShowConflictModal,
    conflictCloudData,
    conflictLocalData,
    resolveConflict,
  };
};
