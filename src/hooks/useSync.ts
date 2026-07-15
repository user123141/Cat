// src/hooks/useSync.ts
import { useState, useCallback, useRef } from 'react';
import { PlayerProfile } from '../types';
import { GameLogger } from '../utils/GameLogger';
import { supabase, saveProfileToSupabase, loadProfileFromSupabase } from '../supabase';
import { smartMergeProfiles } from '../game/merge';

export const useSync = (
  profile: PlayerProfile | null,
  updateProfile: (updater: (prev: PlayerProfile | null) => PlayerProfile | null) => void,
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'paw') => void,
  isOnline: boolean,
  isOfflineMode: boolean
) => {
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [lastSyncedTime, setLastSyncedTime] = useState<number>(0);

  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictCloudData, setConflictCloudData] = useState<PlayerProfile | null>(null);
  const [conflictLocalData, setConflictLocalData] = useState<PlayerProfile | null>(null);

  const profileRef = useRef<PlayerProfile | null>(null);
  profileRef.current = profile;

  const triggerCloudSync = useCallback(async () => {
    const currentProfile = profileRef.current;
    if (!currentProfile) return;

    if (!supabase) {
      GameLogger.log('warn', 'Синхронизация не настроена (отсутствуют ключи в .env). Прогресс сохранен локально.');
      const timeStr = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${timeStr}] ⚠️ Сервер синхронизации не подключен. Работает локальное автосохранение.`, ...prev]);
      return;
    }

    const online = isOnline && navigator.onLine;
    if (!online || isOfflineMode) {
      GameLogger.log('warn', `Синхронизация отклонена: оффлайн-режим (isOfflineMode=${isOfflineMode}, isOnline=${isOnline})`);
      addNotification('Сбой сети 🌐', 'В данный момент вы оффлайн. Прогресс сохранен в локальный кэш.', 'warning');
      const timeStr = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${timeStr}] ⚠️ Оффлайн – синхронизация отложена.`, ...prev]);
      return;
    }

    setSyncing(true);
    GameLogger.log('info', `Начало синхронизации профиля ${currentProfile.nickname} с сервером...`);
    addNotification('Сохранение...', 'Подключение к серверу...', 'info');
    const timeStr = new Date().toLocaleTimeString();
    setSyncLog(prev => [`[${timeStr}] 📡 Попытка подключения к серверу...`, ...prev]);

    try {
      const uid = currentProfile.nickname;
      const cloudProfile = await loadProfileFromSupabase(uid);

      if (cloudProfile) {
        GameLogger.log('info', 'Профиль обнаружен в облаке. Проверка на конфликты...');
        
        // Conflict check: cloud profile has more paws, more cats, or more xp
        const isConflict =
          (cloudProfile.paws > currentProfile.paws) ||
          (cloudProfile.cats.length > currentProfile.cats.length) ||
          cloudProfile.cats.some(cc => {
            const lc = currentProfile.cats.find(cat => cat.id === cc.id);
            if (!lc) return true;
            if (cc.level > lc.level) return true;
            if (cc.level === lc.level && cc.xp > lc.xp) return true;
            return false;
          }) ||
          (cloudProfile.unlockedSkins && cloudProfile.unlockedSkins.some(s => !currentProfile.unlockedSkins.includes(s)));

        if (isConflict) {
          GameLogger.log('warn', `Обнаружен конфликт версий! В облаке paws=${cloudProfile.paws}, локальные paws=${currentProfile.paws}.`);
          setSyncing(false);
          const timeConflict = new Date().toLocaleTimeString();
          setSyncLog(prev => [`[${timeConflict}] ⚠️ Обнаружена рассинхронизация с облачным сохранением!`, ...prev]);

          setConflictCloudData(cloudProfile);
          setConflictLocalData(currentProfile);
          setShowConflictModal(true);
          addNotification('Конфликт данных! ⚠️', 'Обнаружены разные сохранения в облаке и на этом устройстве.', 'warning');
          return;
        }
      }

      // No conflict, proceed with upsert
      const success = await saveProfileToSupabase(uid, currentProfile);
      setSyncing(false);

      if (success) {
        setLastSyncedTime(Date.now());
        const tSuccess = new Date().toLocaleTimeString();
        setSyncLog(prev => [`[${tSuccess}] ✅ Прогресс успешно сохранен в облаке.`, ...prev]);
        addNotification('Успешно сохранено ✨', 'Игровой процесс сохранен в облачном профиле.', 'success');
      } else {
        const tFail = new Date().toLocaleTimeString();
        setSyncLog(prev => [`[${tFail}] ❌ Не удалось сохранить данные в облаке.`, ...prev]);
        addNotification('Синхронизация отложена', 'Локальные данные в безопасности.', 'warning');
      }
    } catch (e: any) {
      console.error(e);
      setSyncing(false);
      const tError = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${tError}] ❌ Ошибка сети: ${e.message || e}`, ...prev]);
      addNotification('Сбой синхронизации', 'Облако временно недоступно.', 'warning');
    }
  }, [profile, isOnline, isOfflineMode, addNotification]);

  const resolveConflict = useCallback(async (choice: 'local' | 'cloud' | 'merge') => {
    if (!conflictLocalData || !conflictCloudData) {
      setShowConflictModal(false);
      return;
    }

    const uid = conflictLocalData.nickname;
    setSyncing(true);
    setShowConflictModal(false);

    try {
      let resolvedProfile: PlayerProfile;

      if (choice === 'local') {
        resolvedProfile = conflictLocalData;
        GameLogger.log('info', 'Выбран локальный профиль. Перезапись облачной резервной копии...');
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] 💾 Перезапись облачной копии локальной версией...`, ...prev]);
      } else if (choice === 'cloud') {
        resolvedProfile = conflictCloudData;
        GameLogger.log('info', 'Выбран резервный профиль. Восстановление локальной версии...');
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] ☁️ Восстановление прогресса из облака...`, ...prev]);
      } else {
        resolvedProfile = smartMergeProfiles(conflictLocalData, conflictCloudData);
        GameLogger.log('info', 'Выбран умный гибридный режим слияния прогрессов.');
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] 🔀 Умное объединение версий прогресса...`, ...prev]);
      }

      updateProfile(() => resolvedProfile);
      const success = await saveProfileToSupabase(uid, resolvedProfile);
      setSyncing(false);

      if (success) {
        setLastSyncedTime(Date.now());
        addNotification('Конфликт разрешен ✅', 'Прогресс успешно объединен и сохранен в облаке.', 'success');
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] ✅ Синхронизация восстановлена.`, ...prev]);
      } else {
        addNotification('Ошибка сохранения', 'Прогресс обновлен локально, но не сохранен в облаке.', 'warning');
      }
    } catch (e) {
      console.error(e);
      setSyncing(false);
      addNotification('Ошибка синхронизации', 'Не удалось разрешить конфликт версий.', 'warning');
    } finally {
      setConflictCloudData(null);
      setConflictLocalData(null);
    }
  }, [conflictCloudData, conflictLocalData, updateProfile, addNotification]);

  const simulateConflictDeviceSwitch = useCallback(() => {
    if (!profile) return;
    const fakeCloud: PlayerProfile = {
      ...profile,
      paws: profile.paws + 120,
      totalInteractions: (profile.totalInteractions || 0) + 15,
      cats: profile.cats.map((cat, idx) => 
        idx === 0 ? { ...cat, level: cat.level + 1, xp: 0 } : cat
      ),
    };
    setConflictCloudData(fakeCloud);
    setConflictLocalData(profile);
    setShowConflictModal(true);
    addNotification('Конфликт симулирован ⚠️', 'Отображено окно выбора версии сохранения.', 'warning');
  }, [profile, addNotification]);

  return {
    syncing,
    syncLog,
    lastSyncedTime,
    showConflictModal,
    setShowConflictModal,
    conflictCloudData,
    conflictLocalData,
    triggerCloudSync,
    resolveConflict,
    simulateConflictDeviceSwitch,
  };
};
