import React, { useState, useCallback } from 'react';
import { supabase } from '../supabase';

export const useAdminAuth = (
  profile: any,
  setProfile: React.Dispatch<React.SetStateAction<any>>,
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'paw') => void
) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [originalProfile, setOriginalProfile] = useState<any | null>(null);

  const impersonateUser = useCallback((targetUser: any) => {
    if (!profile) return;
    if (!originalProfile) {
      setOriginalProfile(profile);
    }
    const targetProfile = {
      ...targetUser,
      id: targetUser.id,
    };
    setProfile(targetProfile);
    addNotification('Имперсонация', `Вход под именем ${targetProfile.nickname || targetProfile.id}`, 'info');
  }, [profile, originalProfile, setProfile, addNotification]);

  const stopImpersonating = useCallback(() => {
    if (originalProfile) {
      setProfile(originalProfile);
      setOriginalProfile(null);
      addNotification('Имперсонация', 'Режим просмотра отключен', 'info');
    }
  }, [originalProfile, setProfile, addNotification]);

  const fetchUsersList = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('player_profiles').select('*');
    if (!error && data) {
      setUsersList(data.map(row => ({
        id: row.id,
        ...row.profile_data,
        nickname: row.profile_data?.nickname || row.id,
        created_at: row.created_at
      })));
    }
  }, []);

  const broadcastInvalidation = useCallback(async (userId: string) => {
    if (!supabase) return;
    const channel = supabase.channel(`profile_sync_${userId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'cache_invalidate',
          payload: { userId }
        });
      }
    });
  }, []);

  const callRPC = async (functionName: string, params: any) => {
    if (!supabase) throw new Error('Supabase не подключён');
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) throw error;
    return data;
  };

  const handleBlockUser = useCallback(async (userId: string, reason: string, durationMinutes: number) => {
    try {
      await callRPC('admin_block_user', { p_user_id: userId, p_reason: reason, p_duration_minutes: durationMinutes });
      addNotification('Успешно', 'Пользователь заблокирован', 'success');
      await broadcastInvalidation(userId);
      await fetchUsersList();
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification, broadcastInvalidation, fetchUsersList]);

  const handleUnblockUser = useCallback(async (userId: string) => {
    try {
      await callRPC('admin_unblock_user', { p_user_id: userId });
      addNotification('Успешно', 'Пользователь разблокирован', 'success');
      await broadcastInvalidation(userId);
      await fetchUsersList();
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification, broadcastInvalidation, fetchUsersList]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await callRPC('admin_delete_user', { p_user_id: userId });
      addNotification('Успешно', 'Пользователь удален', 'success');
      await broadcastInvalidation(userId);
      await fetchUsersList();
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification, broadcastInvalidation, fetchUsersList]);

  const handleMakeAdmin = useCallback(async (userId: string) => {
    try {
      await callRPC('admin_make_admin', { p_user_id: userId });
      addNotification('Успешно', 'Права администратора выданы', 'success');
      await broadcastInvalidation(userId);
      await fetchUsersList();
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification, broadcastInvalidation, fetchUsersList]);

  const handleChangeBalance = useCallback(async (userId: string, amount: number) => {
    try {
      await callRPC('admin_set_balance', { p_user_id: userId, p_new_balance: amount });
      addNotification('Успешно', `Баланс изменен на ${amount}`, 'success');
      await broadcastInvalidation(userId);
      await fetchUsersList();
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification, broadcastInvalidation, fetchUsersList]);

  const handleSaveNickname = useCallback(async (userId: string, newNickname: string) => {
    try {
      await callRPC('admin_update_nickname', { p_user_id: userId, p_new_nickname: newNickname });
      addNotification('Успешно', 'Никнейм обновлен', 'success');
      await broadcastInvalidation(userId);
      await fetchUsersList();
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification, broadcastInvalidation, fetchUsersList]);

  const handleBroadcastAnnouncement = useCallback(async (message: string) => {
    try {
      await callRPC('admin_broadcast', { p_message: message });
      addNotification('Успешно', 'Объявление отправлено', 'success');
    } catch (e: any) {
      addNotification('Ошибка', e.message, 'warning');
    }
  }, [addNotification]);

  return {
    isAdminMode,
    setIsAdminMode,
    usersList,
    fetchUsersList,
    handleBlockUser,
    handleUnblockUser,
    handleDeleteUser,
    handleMakeAdmin,
    handleChangeBalance,
    handleSaveNickname,
    handleBroadcastAnnouncement,
    originalProfile,
    impersonateUser,
    stopImpersonating
  };
};
