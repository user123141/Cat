// src/components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Shield, Ban, CheckCircle, Trash2, RefreshCw, User, Crown, Megaphone, Terminal, Wifi, Activity, Sparkles, Heart } from 'lucide-react';
import { supabase } from '../supabase';
import { triggerHaptic, triggerHapticLight } from '../utils/audio';

interface AdminPanelProps {
  usersList: any[];
  onClose: () => void;
  onUpdateUsers: () => void;
  currentUser: any;
  handleBlockUser?: (userId: string, reason: string, durationMinutes: number) => Promise<void>;
  handleUnblockUser?: (userId: string) => Promise<void>;
  handleDeleteUser?: (userId: string) => Promise<void>;
  handleMakeAdmin?: (userId: string) => Promise<void>;
  handleChangeBalance?: (userId: string, amount: number) => Promise<void>;
  handleSaveNickname?: (userId: string, newNickname: string) => Promise<void>;
  handleBroadcastAnnouncement?: (message: string) => Promise<void>;
  originalProfile?: any | null;
  impersonateUser?: (targetUser: any) => void;
  stopImpersonating?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  usersList,
  onClose,
  onUpdateUsers,
  currentUser,
  handleBlockUser,
  handleUnblockUser,
  handleDeleteUser,
  handleMakeAdmin,
  handleChangeBalance,
  handleSaveNickname,
  handleBroadcastAnnouncement,
  originalProfile,
  impersonateUser,
  stopImpersonating,
}) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [banReason, setBanReason] = useState('Нарушение правил');
  const [banValue, setBanValue] = useState<number>(24);
  const [banUnit, setBanUnit] = useState<'hours' | 'days' | 'permanent'>('hours');

  const [editNickname, setEditNickname] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  const [sortBy, setSortBy] = useState<'paws' | 'level'>('paws');

  useEffect(() => {
    if (selectedUser) setEditNickname(selectedUser.nickname || '');
  }, [selectedUser]);

  const callRPC = async (functionName: string, params: any) => {
    if (!supabase) throw new Error('Supabase не подключён');
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) throw error;
    return data;
  };

  const handleLocalBlockUser = async (userId: string) => {
    setIsLoading(true);
    triggerHaptic();
    try {
      let durationMinutes = -1;
      if (banUnit === 'hours') durationMinutes = banValue * 60;
      else if (banUnit === 'days') durationMinutes = banValue * 1440;
      
      if (handleBlockUser) {
        await handleBlockUser(userId, banReason, durationMinutes);
      } else {
        await callRPC('admin_block_user', { p_user_id: userId, p_reason: banReason, p_duration_minutes: durationMinutes });
      }
      setActionMessage('Пользователь заблокирован');
      setActionType('success');
      onUpdateUsers();
    } catch (e: any) {
      setActionMessage('Ошибка: ' + e.message);
      setActionType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLocalUnblockUser = async (userId: string) => {
    setIsLoading(true);
    triggerHaptic();
    try {
      if (handleUnblockUser) {
        await handleUnblockUser(userId);
      } else {
        await callRPC('admin_unblock_user', { p_user_id: userId });
      }
      setActionMessage('Блокировка снята');
      setActionType('success');
      onUpdateUsers();
    } catch (e: any) {
      setActionMessage('Ошибка: ' + e.message);
      setActionType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLocalDeleteUser = async (userId: string) => {
    if (!window.confirm('Удалить пользователя навсегда?')) return;
    setIsLoading(true);
    triggerHaptic();
    try {
      if (handleDeleteUser) {
        await handleDeleteUser(userId);
      } else {
        await callRPC('admin_delete_user', { p_user_id: userId });
      }
      setActionMessage('Пользователь удалён');
      setActionType('success');
      onUpdateUsers();
    } catch (e: any) {
      setActionMessage('Ошибка: ' + e.message);
      setActionType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLocalMakeAdmin = async (userId: string) => {
    setIsLoading(true);
    triggerHaptic();
    try {
      if (handleMakeAdmin) {
        await handleMakeAdmin(userId);
      } else {
        await callRPC('admin_make_admin', { p_user_id: userId });
      }
      setActionMessage('Администратор назначен');
      setActionType('success');
      onUpdateUsers();
    } catch (e: any) {
      setActionMessage('Ошибка: ' + e.message);
      setActionType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLocalChangeBalance = async (userId: string, amount: number) => {
    setIsLoading(true);
    triggerHaptic();
    try {
      if (handleChangeBalance) {
        await handleChangeBalance(userId, amount);
      } else {
        await callRPC('admin_set_balance', { p_user_id: userId, p_new_balance: amount });
      }
      setActionMessage(`Баланс изменён на ${amount}`);
      setActionType('success');
      onUpdateUsers();
    } catch (e: any) {
      setActionMessage('Ошибка: ' + e.message);
      setActionType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLocalSaveNickname = async () => {
    if (!selectedUser || !editNickname.trim()) return;
    setIsLoading(true);
    triggerHaptic();
    try {
      if (handleSaveNickname) {
        await handleSaveNickname(selectedUser.id, editNickname.trim());
      } else {
        await callRPC('admin_update_nickname', { p_user_id: selectedUser.id, p_new_nickname: editNickname.trim() });
      }
      setActionMessage('Никнейм обновлён');
      setActionType('success');
      onUpdateUsers();
    } catch (e: any) {
      setActionMessage('Ошибка: ' + e.message);
      setActionType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleLocalBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setIsLoading(true);
    triggerHaptic();
    try {
      if (handleBroadcastAnnouncement) {
        await handleBroadcastAnnouncement(announcementText.trim());
      } else {
        await callRPC('admin_broadcast', { p_message: announcementText.trim() });
      }
      setAnnouncementSuccess('Объявление отправлено');
      setAnnouncementText('');
      setTimeout(() => setAnnouncementSuccess(''), 3000);
    } catch (e: any) {
      setAnnouncementSuccess('Ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedUsers = [...usersList].sort((a, b) => {
    if (sortBy === 'paws') return (b.paws || 0) - (a.paws || 0);
    const maxA = (a.cats || []).reduce((m: number, c: any) => Math.max(m, c.level || 1), 1);
    const maxB = (b.cats || []).reduce((m: number, c: any) => Math.max(m, c.level || 1), 1);
    return maxB - maxA;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl h-[85vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-amber-400" />
            <h2 className="text-white font-extrabold text-sm">Панель управления</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { triggerHapticLight(); onUpdateUsers(); }} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <RefreshCw size={15} className="text-slate-400" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-1/3 border-r border-white/5 flex flex-col min-h-0 bg-black/20">
            <div className="p-3 border-b border-white/5 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-left">Сортировка</span>
              <div className="flex gap-1">
                <button onClick={() => { triggerHapticLight(); setSortBy('paws'); }} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border ${sortBy === 'paws' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-black/30 text-slate-400 border-transparent'}`}>По лапкам 🐾</button>
                <button onClick={() => { triggerHapticLight(); setSortBy('level'); }} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border ${sortBy === 'level' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-black/30 text-slate-400 border-transparent'}`}>По уровню 👑</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block px-1 text-left">Все аккаунты ({usersList.length})</span>
              {sortedUsers.map((user, idx) => {
                const maxLevel = (user.cats || []).reduce((m: number, c: any) => Math.max(m, c.level || 1), 1);
                const isSelected = selectedUser?.id === user.id;
                return (
                  <button key={user.id} onClick={() => { triggerHapticLight(); setSelectedUser(user); }} className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border ${isSelected ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-slate-300'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] text-sky-400 font-bold shrink-0">{user.nickname?.[0] || '?'}</div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-black flex items-center gap-1">
                          <span>{user.nickname || 'Без имени'}</span>
                          {user.isAdmin && <Crown size={10} className="text-amber-400 shrink-0" />}
                          {user.blocked && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                        </div>
                        <div className="text-[8px] text-slate-500 font-mono">Лвл: {maxLevel} • Кот: {user.cats?.length || 0}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">🐾 {user.paws || 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40">
            <div className="p-4 border-b border-white/5 bg-slate-900/20 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">База Данных</span>
                <div className="flex items-center gap-1 text-emerald-400"><Wifi size={10} /><span className="text-[10px] font-extrabold">Подключена</span></div>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Активные</span>
                <div className="flex items-center gap-1 text-slate-200"><Activity size={10} /><span className="text-[10px] font-extrabold">{(usersList || []).filter(u => u.lastSavedTime && Date.now() - u.lastSavedTime < 300000).length} онл.</span></div>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Всего</span>
                <div className="flex items-center gap-1 text-slate-200"><Users size={10} /><span className="text-[10px] font-extrabold">{usersList.length} аккаунтов</span></div>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Питомцев</span>
                <div className="flex items-center gap-1 text-slate-200"><Heart size={10} /><span className="text-[10px] font-extrabold">{usersList.reduce((acc, u) => acc + (u.cats?.length || 0), 0)}</span></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {selectedUser ? (
                <div className="space-y-4 max-w-2xl text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg font-black shrink-0">{selectedUser.nickname?.[0] || '?'}</div>
                      <div><h3 className="text-white font-extrabold text-sm">{selectedUser.nickname || 'Без имени'}</h3><p className="text-[9px] text-slate-500 font-mono">ID: {selectedUser.id}</p></div>
                    </div>
                    <div className="text-right"><span className="text-[9px] text-slate-500 font-mono block">Регистрация:</span><span className="text-[10px] text-slate-300 font-bold">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Неизвестно'}</span></div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider block">Баланс</span>
                      <span className="text-white font-extrabold text-xs font-mono">🐾 {selectedUser.paws || 0}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider block">Котиков</span>
                      <span className="text-white font-extrabold text-xs font-mono">{selectedUser.cats?.length || 0}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider block">Макс Лвл</span>
                      <span className="text-white font-extrabold text-xs font-mono">{selectedUser.cats?.reduce((max: number, cat: any) => Math.max(max, cat.level || 1), 1) || 1}</span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider block">Роль</span>
                      <span className={`font-extrabold text-[9px] px-1.5 py-0.5 rounded-full inline-block ${selectedUser.isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>{selectedUser.isAdmin ? 'ADMIN' : 'PLAYER'}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1"><Terminal size={12} /> Редактировать профиль</h4>
                    <div className="flex gap-2">
                      <input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} placeholder="Новый никнейм" className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500" />
                      <button onClick={handleLocalSaveNickname} disabled={isLoading || editNickname.trim() === selectedUser.nickname} className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black transition disabled:opacity-50 shrink-0">Изменить</button>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1"><Ban size={12} /> Бан пользователя</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1"><label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Причина:</label><input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Причина" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500" /></div>
                      <div className="space-y-1"><label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Длительность:</label><div className="flex gap-1.5"><input type="number" min={1} value={banValue} onChange={(e) => setBanValue(Math.max(1, parseInt(e.target.value) || 1))} disabled={banUnit === 'permanent'} className="w-20 bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-sky-500 disabled:opacity-40" /><select value={banUnit} onChange={(e: any) => setBanUnit(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"><option value="hours">Часов ⏳</option><option value="days">Дней 📅</option><option value="permanent">Навсегда ♾️</option></select></div></div>
                    </div>
                    {selectedUser.blocked && <div className="bg-rose-500/15 border border-rose-500/20 rounded-xl p-2.5 text-[10px] text-rose-300">⚠️ Заблокирован: {selectedUser.blockedReason || 'Причина не указана'}{selectedUser.blockedUntil && selectedUser.blockedUntil !== -1 && <div className="font-mono mt-0.5 text-[9px] text-rose-400">До: {new Date(selectedUser.blockedUntil).toLocaleString()}</div>}{selectedUser.blockedUntil === -1 && <div className="font-mono mt-0.5 text-[9px] text-rose-400">Срок: Бессрочно</div>}</div>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {!selectedUser.blocked ? <button onClick={() => handleLocalBlockUser(selectedUser.id)} disabled={isLoading} className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black transition disabled:opacity-50 flex items-center gap-1"><Ban size={12} /> Заблокировать</button> : <button onClick={() => handleLocalUnblockUser(selectedUser.id)} disabled={isLoading} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition disabled:opacity-50 flex items-center gap-1"><CheckCircle size={12} /> Разблокировать</button>}
                      <button onClick={() => handleLocalMakeAdmin(selectedUser.id)} disabled={isLoading || selectedUser.isAdmin} className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-black transition disabled:opacity-50 flex items-center gap-1"><Crown size={12} /> Сделать админом</button>
                      {impersonateUser && (
                        <button
                          onClick={() => {
                            triggerHaptic();
                            impersonateUser(selectedUser);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black transition flex items-center gap-1 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <User size={12} /> Войти в аккаунт
                        </button>
                      )}
                      <button onClick={() => handleLocalDeleteUser(selectedUser.id)} disabled={isLoading} className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-black transition disabled:opacity-50 flex items-center gap-1"><Trash2 size={12} /> Удалить</button>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">🐾 Редактирование баланса</h4>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Введите баланс" className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500" id="pawsInput" />
                      <button onClick={() => { const input = document.getElementById('pawsInput') as HTMLInputElement; const val = parseInt(input.value); if (!isNaN(val)) handleLocalChangeBalance(selectedUser.id, val); }} disabled={isLoading} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition disabled:opacity-50">Применить</button>
                    </div>
                  </div>

                  {actionMessage && <div className={`p-3 rounded-2xl text-xs font-black border text-center ${actionType === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border-rose-500/15'}`}>{actionMessage}</div>}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2"><Terminal size={32} className="text-slate-600" /><span className="text-xs font-medium">Выберите игрока</span></div>
              )}

              <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-white/5 rounded-3xl p-4 mt-auto text-left">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1.5"><Megaphone size={13} /> Глобальное объявление</h4>
                <p className="text-[9px] text-slate-400 leading-normal mb-3">Отправляет системное сообщение во все чаты.</p>
                <form onSubmit={handleLocalBroadcastAnnouncement} className="flex gap-2">
                  <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Текст объявления..." className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
                  <button type="submit" disabled={isLoading || !announcementText.trim()} className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black transition disabled:opacity-40 shrink-0">Транслировать 📢</button>
                </form>
                {announcementSuccess && <p className="text-[10px] font-black text-amber-400 mt-2.5">{announcementSuccess}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};