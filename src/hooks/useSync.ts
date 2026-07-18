import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { GameLogger } from '../utils/GameLogger';
import { supabase, saveProfileToSupabase, loadProfileFromSupabase } from '../supabase';
import { smartMergeProfiles } from '../game/merge';

export const useSync = (
  profile: PlayerProfile | null,
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile | null>>,
  isOnline: boolean,
  isOfflineMode: boolean
) => {
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [lastSyncedTime, setLastSyncedTime] = useState<number>(0);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictCloudData, setConflictCloudData] = useState<PlayerProfile | null>(null);
  const [conflictLocalData, setConflictLocalData] = useState<PlayerProfile | null>(null);

  const lastProfileHashRef = useRef<string>('');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getProfileHash = (p: PlayerProfile) => JSON.stringify(p);

  const performSync = useCallback(async () => {
    const currentProfile = profile;
    if (!currentProfile || !supabase || !isOnline || isOfflineMode) return;

    const currentHash = getProfileHash(currentProfile);
    if (currentHash === lastProfileHashRef.current) return;

    setSyncing(true);
    const uid = currentProfile.id || currentProfile.nickname;

    try {
      const cloudProfile = await loadProfileFromSupabase(uid);
      if (cloudProfile) {
        const isAdminAction = 
          cloudProfile.blocked !== currentProfile.blocked ||
          cloudProfile.blockedUntil !== currentProfile.blockedUntil ||
          cloudProfile.isAdmin !== currentProfile.isAdmin ||
          JSON.stringify(cloudProfile.badgeList || []) !== JSON.stringify(currentProfile.badgeList || []) ||
          cloudProfile.selectedBadge !== currentProfile.selectedBadge ||
          cloudProfile.paws !== currentProfile.paws ||
          cloudProfile.nickname !== currentProfile.nickname;

        if (isAdminAction) {
          setProfile(cloudProfile);
          lastProfileHashRef.current = getProfileHash(cloudProfile);
          setSyncing(false);
          return;
        }

        const isConflict =
          (cloudProfile.paws > currentProfile.paws + 50) ||
          (cloudProfile.cats.length > currentProfile.cats.length) ||
          cloudProfile.cats.some((cc) => {
            const lc = currentProfile.cats.find(cat => cat.id === cc.id);
            return !lc || cc.level > lc.level + 1 || (cc.level === lc.level && cc.xp > lc.xp + 50);
          }) ||
          (cloudProfile.unlockedSkins && cloudProfile.unlockedSkins.some((s) => !currentProfile.unlockedSkins.includes(s)));

        if (isConflict) {
          setConflictCloudData(cloudProfile);
          setConflictLocalData(currentProfile);
          setShowConflictModal(true);
          setSyncing(false);
          return;
        }
      }

      const success = await saveProfileToSupabase(uid, currentProfile);
      if (success) {
        lastProfileHashRef.current = currentHash;
        setLastSyncedTime(Date.now());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  }, [profile, isOnline, isOfflineMode]);

  const queueSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, 300);
  }, [performSync]);

  const triggerCloudSync = useCallback(async () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    await performSync();
  }, [performSync]);

  // Automatically queue silent sync whenever profile is updated
  useEffect(() => {
    if (profile) {
      const currentHash = getProfileHash(profile);
      if (currentHash !== lastProfileHashRef.current) {
        queueSync();
      }
    }
  }, [profile, queueSync]);

  const resolveConflict = useCallback(async (choice: 'local' | 'cloud' | 'merge') => {
    if (!conflictLocalData || !conflictCloudData) {
      setShowConflictModal(false);
      return;
    }
    const uid = conflictLocalData.id || conflictLocalData.nickname;
    const resolvedProfile = choice === 'local'
      ? conflictLocalData
      : choice === 'cloud'
      ? conflictCloudData
      : smartMergeProfiles(conflictLocalData, conflictCloudData);

    setProfile(() => resolvedProfile);
    await saveProfileToSupabase(uid, resolvedProfile);
    lastProfileHashRef.current = getProfileHash(resolvedProfile);
    setLastSyncedTime(Date.now());
    setShowConflictModal(false);
    setConflictCloudData(null);
    setConflictLocalData(null);
  }, [conflictLocalData, conflictCloudData, setProfile]);

  useEffect(() => {
    if (!profile?.id || !supabase || !isOnline || isOfflineMode) return;
    const channel = supabase
      .channel(`profile_sync_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          const newData = payload.new?.profile_data as PlayerProfile;
          if (newData) {
            setProfile(newData);
            lastProfileHashRef.current = getProfileHash(newData);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'cache_invalidate' },
        (payload) => {
          if (payload.payload?.userId === profile.id) {
            loadProfileFromSupabase(profile.id).then((fresh) => {
              if (fresh) {
                setProfile(fresh);
                lastProfileHashRef.current = getProfileHash(fresh);
              }
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, isOnline, isOfflineMode, setProfile]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  return {
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
    simulateConflictDeviceSwitch: () => {
      if (!profile) return;
      setConflictCloudData({ ...profile, paws: profile.paws + 200 });
      setConflictLocalData(profile);
      setShowConflictModal(true);
    }
  };
};
