// src/hooks/useSync.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { GameLogger } from '../utils/GameLogger';
import { supabase } from '../supabase';
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

  // Web Worker Ref
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker and authenticate it with credentials
  useEffect(() => {
    try {
      const worker = new Worker(new URL('../sync.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        worker.postMessage({
          type: 'INIT',
          payload: { url: SUPABASE_URL, key: SUPABASE_ANON_KEY }
        });
      }
    } catch (e) {
      console.error('Failed to initialize Sync Web Worker:', e);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Helper to run background tasks with Web Worker
  const runWorkerTask = useCallback((type: 'SAVE_PROFILE' | 'LOAD_PROFILE', payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error('Sync Web Worker is not active'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        const { type: resType, data, error } = e.data;
        
        if (resType === 'SAVE_SUCCESS' && type === 'SAVE_PROFILE') {
          worker.removeEventListener('message', handleMessage);
          resolve(true);
        } else if (resType === 'LOAD_SUCCESS' && type === 'LOAD_PROFILE') {
          worker.removeEventListener('message', handleMessage);
          resolve(data);
        } else if (resType === 'SAVE_FAIL' || resType === 'LOAD_FAIL' || resType === 'INIT_FAIL') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error || 'Worker task failed'));
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ type, payload });
    });
  }, []);

  const triggerCloudSync = useCallback(async (isAutoSync = false) => {
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
      if (!isAutoSync) {
        addNotification('Сбой сети 🌐', 'В данный момент вы оффлайн. Прогресс сохранен в локальный кэш.', 'warning');
      }
      const timeStr = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${timeStr}] ⚠️ Оффлайн – синхронизация отложена.`, ...prev]);
      return;
    }

    setSyncing(true);
    GameLogger.log('info', `[Worker Thread] Начало синхронизации профиля ${currentProfile.nickname} (ID: ${currentProfile.id})...`);
    if (!isAutoSync) {
      addNotification('Сохранение...', 'Подключение к серверу...', 'info');
    }
    const timeStr = new Date().toLocaleTimeString();
    setSyncLog(prev => [`[${timeStr}] 📡 Отправка задачи в фоновый Web Worker...`, ...prev]);

    try {
      const uid = currentProfile.id || currentProfile.nickname;
      
      // Load cloud profile in background Web Worker
      const cloudProfile = await runWorkerTask('LOAD_PROFILE', { userId: uid });

      if (cloudProfile) {
        GameLogger.log('info', 'Профиль обнаружен в облаке. Проверка на конфликты...');
        
        // Conflict check: cloud profile has more paws, more cats, or more xp
        const isConflict =
          (cloudProfile.paws > currentProfile.paws) ||
          (cloudProfile.cats.length > currentProfile.cats.length) ||
          cloudProfile.cats.some((cc: any) => {
            const lc = currentProfile.cats.find(cat => cat.id === cc.id);
            if (!lc) return true;
            if (cc.level > lc.level) return true;
            if (cc.level === lc.level && cc.xp > lc.xp) return true;
            return false;
          }) ||
          (cloudProfile.unlockedSkins && cloudProfile.unlockedSkins.some((s: string) => !currentProfile.unlockedSkins.includes(s)));

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

      // No conflict, proceed with upsert via Web Worker
      const success = await runWorkerTask('SAVE_PROFILE', { userId: uid, profile: currentProfile });
      setSyncing(false);

      if (success) {
        setLastSyncedTime(Date.now());
        const tSuccess = new Date().toLocaleTimeString();
        setSyncLog(prev => [`[${tSuccess}] ✅ Прогресс успешно сохранен в облаке через Web Worker.`, ...prev]);
        if (!isAutoSync) {
          addNotification('Успешно сохранено ✨', 'Игровой процесс сохранен в облачном профиле.', 'success');
        }
      } else {
        const tFail = new Date().toLocaleTimeString();
        setSyncLog(prev => [`[${tFail}] ❌ Не удалось сохранить данные в облаке.`, ...prev]);
        if (!isAutoSync) {
          addNotification('Синхронизация отложена', 'Локальные данные в безопасности.', 'warning');
        }
      }
    } catch (e: any) {
      console.error(e);
      setSyncing(false);
      const tError = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${tError}] ❌ Сбой Web Worker: ${e.message || e}`, ...prev]);
      if (!isAutoSync) {
        addNotification('Сбой синхронизации', 'Облако временно недоступно.', 'warning');
      }
    }
  }, [profile, isOnline, isOfflineMode, addNotification, runWorkerTask]);

  const resolveConflict = useCallback(async (choice: 'local' | 'cloud' | 'merge') => {
    if (!conflictLocalData || !conflictCloudData) {
      setShowConflictModal(false);
      return;
    }

    const uid = conflictLocalData.id || conflictLocalData.nickname;
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
      
      // Save the resolved profile through Web Worker
      const success = await runWorkerTask('SAVE_PROFILE', { userId: uid, profile: resolvedProfile });
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
  }, [conflictCloudData, conflictLocalData, updateProfile, addNotification, runWorkerTask]);

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
