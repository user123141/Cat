// src/components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Users, Shield, Ban, CheckCircle, Trash2, RefreshCw, 
  User, Crown, Megaphone, Terminal, Wifi, Activity, Sparkles, Heart
} from 'lucide-react';
import { supabase } from '../supabase';
import { triggerHaptic, triggerHapticLight } from '../utils/audio';

interface AdminPanelProps {
  usersList: any[];
  onClose: () => void;
  onUpdateUsers: () => void;
  currentUser: any;
  onBlockUser: (userId: string, reason: string, durationMinutes: number) => Promise<void>;
  onUnblockUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onMakeAdmin: (userId: string) => Promise<void>;
  onChangeBalance: (userId: string, amount: number) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  usersList,
  onClose,
  onUpdateUsers,
  currentUser,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
  onMakeAdmin,
  onChangeBalance,
}) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Ban form states
  const [banReason, setBanReason] = useState('Спам в общем чате');
  const [banValue, setBanValue] = useState<number>(24); // default 24
  const [banUnit, setBanUnit] = useState<'hours' | 'days' | 'permanent'>('hours');

  // God Mode states
  const [editNickname, setEditNickname] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<'paws' | 'level'>('paws');

  // DB Status
  const [dbStatus, setDbStatus] = useState<'testing' | 'connected' | 'disconnected'>('testing');

  // Test Supabase Connection on mount
  useEffect(() => {
    const testConnection = async () => {
      if (!supabase) {
        setDbStatus('disconnected');
        return;
      }
      try {
        const { data, error } = await supabase.from('player_profiles').select('count', { count: 'exact', head: true });
        if (!error) {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } catch (e) {
        setDbStatus('disconnected');
      }
    };
    testConnection();
  }, []);

  // Update edit nickname field when user changes
  useEffect(() => {
    if (selectedUser) {
      setEditNickname(selectedUser.nickname || '');
    } else {
      setEditNickname('');
    }
  }, [selectedUser]);

  // Sorting logic
  const sortedUsers = [...usersList].sort((a, b) => {
    if (sortBy === 'paws') {
      return (b.paws || 0) - (a.paws || 0);
    } else {
      const maxA = (a.cats || []).reduce((m: number, c: any) => Math.max(m, c.level || 1), 1);
      const maxB = (b.cats || []).reduce((m: number, c: any) => Math.max(m, c.level || 1), 1);
      return maxB - maxA;
    }
  });

  // Calculate System Health Metrics
  const systemHealth = React.useMemo(() => {
    const now = Date.now();
    const fiveMinutes = 300000;
    
    const activeSessions = usersList.filter(user => {
      return user.lastSavedTime ? (now - user.lastSavedTime < fiveMinutes) : false;
    }).length;

    const totalCats = usersList.reduce((acc, user) => acc + (user.cats?.length || 0), 0);
    
    return {
      activeSessions: Math.max(1, activeSessions), // current user is always active
      totalCats,
      totalRegistered: usersList.length
    };
  }, [usersList]);

  // Handle action
  const handleAction = async (action: string, userId: string) => {
    setIsLoading(true);
    triggerHaptic();
    try {
      switch (action) {
        case 'block': {
          let durationMinutes = -1;
          if (banUnit === 'hours') {
            durationMinutes = banValue * 60;
          } else if (banUnit === 'days') {
            durationMinutes = banValue * 1440;
          } else {
            durationMinutes = -1; // Permanent
          }

          await onBlockUser(userId, banReason, durationMinutes);
          setActionMessage(`Пользователь успешно заблокирован 🛡️`);
          
          // Refresh local selectedUser fields
          setSelectedUser((prev: any) => prev ? { ...prev, blocked: true, blockedReason: banReason, blockedUntil: durationMinutes === -1 ? -1 : Date.now() + durationMinutes * 60000 } : null);
          break;
        }
        case 'unblock':
          await onUnblockUser(userId);
          setActionMessage(`Блокировка снята 🔓`);
          setSelectedUser((prev: any) => prev ? { ...prev, blocked: false, blockedReason: undefined, blockedUntil: undefined } : null);
          break;
        case 'delete':
          await onDeleteUser(userId);
          setActionMessage(`Пользователь полностью удалён из БД 💥`);
          setSelectedUser(null);
          break;
        case 'make_admin':
          await onMakeAdmin(userId);
          setActionMessage(`Права Администратора выданы 👑`);
          setSelectedUser((prev: any) => prev ? { ...prev, isAdmin: true } : null);
          break;
        default:
          return;
      }
      setActionType('success');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3500);
      onUpdateUsers();
    } catch (e) {
      setActionMessage('Ошибка при выполнении операции');
      setActionType('error');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3500);
    }
    setIsLoading(false);
  };

  // Balance change
  const handleBalanceChange = async () => {
    const input = document.getElementById('pawsInput') as HTMLInputElement;
    const val = parseInt(input.value);
    if (isNaN(val) || !selectedUser) return;
    setIsLoading(true);
    triggerHaptic();
    try {
      await onChangeBalance(selectedUser.id, val);
      setActionMessage(`Баланс успешно изменён на ${val} 🐾`);
      setActionType('success');
      setSelectedUser((prev: any) => prev ? { ...prev, paws: val } : null);
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3500);
      input.value = '';
      onUpdateUsers();
    } catch (e) {
      setActionMessage('Ошибка изменения баланса');
      setActionType('error');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3500);
    }
    setIsLoading(false);
  };

  // God Mode: Edit user's nickname directly
  const handleSaveNickname = async () => {
    if (!selectedUser || !editNickname.trim()) return;
    setIsLoading(true);
    triggerHaptic();
    try {
      if (supabase) {
        const targetUser = usersList.find(u => u.id === selectedUser.id);
        if (targetUser) {
          const updated = { ...targetUser, nickname: editNickname.trim() };
          delete updated.id;
          
          const { error } = await supabase
            .from('player_profiles')
            .update({ profile_data: updated })
            .eq('id', selectedUser.id);
          
          if (!error) {
            setActionMessage(`Никнейм изменен на "${editNickname.trim()}" ✨`);
            setActionType('success');
            setSelectedUser((prev: any) => prev ? { ...prev, nickname: editNickname.trim() } : null);
            onUpdateUsers();
          } else {
            throw error;
          }
        }
      }
    } catch (e) {
      setActionMessage('Ошибка смены никнейма');
      setActionType('error');
    }
    setIsLoading(false);
    setTimeout(() => {
      setActionMessage(null);
      setActionType(null);
    }, 3500);
  };

  // God Mode: Broadcast system announcement to Chat
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setIsLoading(true);
    triggerHaptic();
    try {
      if (supabase) {
        const { error } = await supabase
          .from('maccat_chat_messages')
          .insert({
            id: Math.random().toString(36).substring(2, 9),
            channel: 'global',
            sender_id: 'sys',
            sender_nickname: 'System Announcement',
            sender_avatar: 'Standard',
            sender_status: '📢 Объявление',
            sender_badge: '🛡️ СИСТЕМА',
            content: announcementText.trim(),
            timestamp: Date.now()
          });
        
        if (!error) {
          setAnnouncementSuccess('📢 Системное сообщение успешно отправлено во все чаты!');
          setAnnouncementText('');
          setTimeout(() => setAnnouncementSuccess(''), 4000);
        } else {
          throw error;
        }
      }
    } catch (e) {
      setAnnouncementSuccess('❌ Не удалось отправить объявление');
      setTimeout(() => setAnnouncementSuccess(''), 4000);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl h-[85vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-amber-400 animate-pulse" />
            <h2 className="text-white font-extrabold text-sm md:text-base tracking-tight">Панель Администратора</h2>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Режим Бога</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { triggerHapticLight(); onUpdateUsers(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
              title="Обновить данные"
            >
              <RefreshCw size={15} className="text-slate-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all active:scale-95 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Тело */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          
          {/* Левая колонка: База Игроков */}
          <div className="w-full md:w-1/3 border-r border-white/5 flex flex-col min-h-0 bg-black/20">
            {/* Сортировка */}
            <div className="p-3 border-b border-white/5 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-left">Сортировать игроков:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { triggerHapticLight(); setSortBy('paws'); }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border ${
                    sortBy === 'paws' 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                      : 'bg-black/30 text-slate-400 border-transparent hover:bg-black/40'
                  }`}
                >
                  По лапкам 🐾
                </button>
                <button
                  onClick={() => { triggerHapticLight(); setSortBy('level'); }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border ${
                    sortBy === 'level' 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                      : 'bg-black/30 text-slate-400 border-transparent hover:bg-black/40'
                  }`}
                >
                  По уровню 👑
                </button>
              </div>
            </div>

            {/* Список игроков */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block px-1 text-left">Все аккаунты ({usersList.length})</span>
              {sortedUsers.map((user, idx) => {
                const maxLevel = (user.cats || []).reduce((m: number, c: any) => Math.max(m, c.level || 1), 1);
                const isSelected = selectedUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => { triggerHapticLight(); setSelectedUser(user); }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/30 text-white'
                        : 'bg-transparent border-transparent hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] text-sky-400 font-bold shrink-0">
                        {user.nickname?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-black flex items-center gap-1">
                          <span>{user.nickname || 'Без имени'}</span>
                          {user.isAdmin && <Crown size={10} className="text-amber-400 shrink-0" />}
                          {user.blocked && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                        </div>
                        <div className="text-[8px] text-slate-500 font-mono">Лвл: {maxLevel} • Кот: {user.cats?.length || 0}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                      🐾 {user.paws || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Правая колонка: Управление и Мониторинг */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40">
            
            {/* System Health Monitor */}
            <div className="p-4 border-b border-white/5 bg-slate-900/20 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">База Данных</span>
                <div className="flex items-center gap-1">
                  <Wifi size={10} className={dbStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'} />
                  <span className={`text-[10px] font-extrabold ${dbStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dbStatus === 'connected' ? 'Подключена' : dbStatus === 'testing' ? 'Тестирование...' : 'Ошибка'}
                  </span>
                </div>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Активные Сессии</span>
                <div className="flex items-center gap-1 text-slate-200">
                  <Activity size={10} className="text-sky-400" />
                  <span className="text-[10px] font-extrabold">{systemHealth.activeSessions} игроков онлайн</span>
                </div>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Всего Жителей</span>
                <div className="flex items-center gap-1 text-slate-200">
                  <Users size={10} className="text-violet-400" />
                  <span className="text-[10px] font-extrabold font-mono">{systemHealth.totalRegistered} аккаунтов</span>
                </div>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-2xl space-y-0.5 text-left">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Зарегано Питомцев</span>
                <div className="flex items-center gap-1 text-slate-200">
                  <Heart size={10} className="text-rose-400" />
                  <span className="text-[10px] font-extrabold font-mono">{systemHealth.totalCats} котиков</span>
                </div>
              </div>
            </div>

            {/* Рабочая область управления игроком или вещания */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              
              {selectedUser ? (
                <div className="space-y-4 max-w-2xl text-left">
                  {/* Профиль игрока */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg font-black shrink-0">
                        {selectedUser.nickname?.[0] || '?'}
                      </div>
                      <div>
                        <h3 className="text-white font-extrabold text-sm">{selectedUser.nickname || 'Без имени'}</h3>
                        <p className="text-[9px] text-slate-500 font-mono">ID: {selectedUser.id}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 font-mono block">Регистрация:</span>
                      <span className="text-[10px] text-slate-300 font-bold">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Неизвестно'}
                      </span>
                    </div>
                  </div>

                  {/* Быстрая статистика */}
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
                      <span className="text-white font-extrabold text-xs font-mono">
                        {selectedUser.cats?.reduce((max: number, cat: any) => Math.max(max, cat.level || 1), 1) || 1}
                      </span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2">
                      <span className="text-slate-500 text-[8px] uppercase tracking-wider block">Роль</span>
                      <span className={`font-extrabold text-[9px] px-1.5 py-0.5 rounded-full inline-block ${
                        selectedUser.isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {selectedUser.isAdmin ? 'ADMIN' : 'PLAYER'}
                      </span>
                    </div>
                  </div>

                  {/* God Mode: Edit Nickname */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1">
                      <Terminal size={12} /> Редактировать профиль (God Mode)
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="Новый никнейм"
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={isLoading || editNickname.trim() === selectedUser.nickname}
                        className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black tracking-wide transition disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        Изменить Никнейм
                      </button>
                    </div>
                  </div>

                  {/* Custom Ban Form */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1">
                      <Ban size={12} /> Кастомный Бан Пользователя
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Указать кастомную причину:</label>
                        <input
                          type="text"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Причина бана"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Продолжительность:</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={banValue}
                            onChange={(e) => setBanValue(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={banUnit === 'permanent'}
                            className="w-20 bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:border-sky-500 disabled:opacity-40"
                          />
                          <select
                            value={banUnit}
                            onChange={(e: any) => setBanUnit(e.target.value)}
                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                          >
                            <option value="hours">Часов ⏳</option>
                            <option value="days">Дней 📅</option>
                            <option value="permanent">Навсегда ♾️</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Ban Status Indicator if blocked */}
                    {selectedUser.blocked && (
                      <div className="bg-rose-500/15 border border-rose-500/20 rounded-xl p-2.5 text-[10px] text-rose-300">
                        ⚠️ <strong>Данный аккаунт заблокирован:</strong> {selectedUser.blockedReason || 'Причина не указана'}
                        {selectedUser.blockedUntil && selectedUser.blockedUntil !== -1 && (
                          <div className="font-mono mt-0.5 text-[9px] text-rose-400">До: {new Date(selectedUser.blockedUntil).toLocaleString()}</div>
                        )}
                        {selectedUser.blockedUntil === -1 && <div className="font-mono mt-0.5 text-[9px] text-rose-400">Срок: Бессрочно</div>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {!selectedUser.blocked ? (
                        <button
                          onClick={() => handleAction('block', selectedUser.id)}
                          disabled={isLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black tracking-wide transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-md shadow-rose-600/10"
                        >
                          <Ban size={12} /> Заблокировать
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction('unblock', selectedUser.id)}
                          disabled={isLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black tracking-wide transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-600/10"
                        >
                          <CheckCircle size={12} /> Разблокировать
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleAction('make_admin', selectedUser.id)}
                        disabled={isLoading || selectedUser.isAdmin}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-black tracking-wide transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Crown size={12} /> Сделать Администратором
                      </button>

                      <button
                        onClick={() => handleAction('delete', selectedUser.id)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-black tracking-wide transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Удалить Навсегда
                      </button>
                    </div>
                  </div>

                  {/* Balance editor */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                      🐾 Редактирование Баланса Лапок
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Введите точный баланс лапок (например: 1000)"
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                        id="pawsInput"
                      />
                      <button
                        onClick={handleBalanceChange}
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black tracking-wide transition disabled:opacity-50 cursor-pointer"
                      >
                        Применить Баланс
                      </button>
                    </div>
                  </div>

                  {/* Action messages */}
                  <AnimatePresence>
                    {actionMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-2xl text-xs font-black border text-center ${
                          actionType === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                        }`}
                      >
                        {actionMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Terminal size={32} className="text-slate-600 stroke-[1.5]" />
                  <span className="text-xs font-medium">Выберите игрока в списке слева для администрирования</span>
                </div>
              )}

              {/* God Mode: Broadcast Global Announcement */}
              <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-white/5 rounded-3xl p-4 mt-auto text-left">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1.5">
                  <Megaphone size={13} />
                  Глобальное Системное Объявление
                </h4>
                <p className="text-[9px] text-slate-400 leading-normal mb-3">
                  Отправляет системное сообщение во все чаты от имени администратора. Будет зафиксировано в истории под ником 🛡️ СИСТЕМА.
                </p>

                <form onSubmit={handleBroadcastAnnouncement} className="flex gap-2">
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Напишите текст объявления (например: Внимание, скоро запуск новой мини-игры!)..."
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 placeholder-slate-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !announcementText.trim()}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black tracking-wide transition disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Транслировать 📢
                  </button>
                </form>

                {announcementSuccess && (
                  <p className="text-[10px] font-black text-amber-400 mt-2.5">{announcementSuccess}</p>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
