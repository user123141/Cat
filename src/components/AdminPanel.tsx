import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Shield, Ban, CheckCircle, Trash2, RefreshCw, User, Crown } from 'lucide-react';

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
  const [banReason, setBanReason] = useState('Нарушение правил игры');
  const [banDuration, setBanDuration] = useState<number>(-1); // -1 is permanent
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  React.useEffect(() => {
    setCopiedKeyId(null);
  }, [selectedUser]);

  const handleExportUserKey = (user: any) => {
    try {
      // Create a clean replica without supabase-added local helper fields if any
      const userCopy = { ...user };
      const dataStr = JSON.stringify(userCopy);
      const b64 = btoa(unescape(encodeURIComponent(dataStr)));
      navigator.clipboard.writeText(b64);
      setCopiedKeyId(user.id);
      setTimeout(() => setCopiedKeyId(null), 3000);
    } catch (e) {
      console.error(e);
      alert('Ошибка при экспорте ключа прогресса');
    }
  };

  const sortedUsers = [...usersList].sort((a, b) => (b.paws || 0) - (a.paws || 0));

  const handleAction = async (action: string, userId: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'block':
          await onBlockUser(userId, banReason, banDuration);
          setActionMessage(`Пользователь заблокирован`);
          break;
        case 'unblock':
          await onUnblockUser(userId);
          setActionMessage(`Пользователь разблокирован`);
          break;
        case 'delete':
          await onDeleteUser(userId);
          setActionMessage(`Пользователь удалён`);
          setSelectedUser(null);
          break;
        case 'make_admin':
          await onMakeAdmin(userId);
          setActionMessage(`Пользователь назначен администратором`);
          break;
        default:
          return;
      }
      setActionType('success');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3000);
      await onUpdateUsers();
    } catch (e) {
      setActionMessage('Ошибка при выполнении действия');
      setActionType('error');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3000);
    }
    setIsLoading(false);
  };

  const handleBalanceChange = async () => {
    const input = document.getElementById('pawsInput') as HTMLInputElement;
    const val = parseInt(input.value);
    if (isNaN(val) || !selectedUser) return;
    setIsLoading(true);
    try {
      await onChangeBalance(selectedUser.id, val);
      setActionMessage(`Баланс изменён на ${val} для ${selectedUser.nickname}`);
      setActionType('success');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3000);
      input.value = '';
      await onUpdateUsers();
    } catch (e) {
      setActionMessage('Ошибка изменения баланса');
      setActionType('error');
      setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3000);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-amber-400" />
            <h2 className="text-white font-bold text-lg">Панель администратора</h2>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Режим </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onUpdateUsers(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95"
              title="Обновить список"
            >
              <RefreshCw size={18} className="text-slate-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 transition-all active:scale-95"
            >
              <X size={18} className="text-rose-400" />
            </button>
          </div>
        </div>

        {/* Тело */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Список пользователей */}
          <div className="w-full md:w-1/3 border-r border-white/5 overflow-y-auto p-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Users size={14} />
              <span>Все пользователи ({sortedUsers.length})</span>
            </div>
            <div className="space-y-1.5">
              {sortedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                    selectedUser?.id === user.id
                      ? 'bg-sky-500/20 border border-sky-500/30 text-white'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm flex-shrink-0">
                      {user.nickname?.[0] || '?'}
                    </div>
                    <span className="truncate text-sm font-medium">{user.nickname || 'Без имени'}</span>
                    {user.id === currentUser?.id && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Вы</span>
                    )}
                    {user.isAdmin && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Admin</span>
                    )}
                    {user.blocked && (
                      <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Заблок.</span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-sky-400 flex-shrink-0">
                    🐾 {user.paws || 0}
                  </span>
                </button>
              ))}
              {sortedUsers.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  Пользователи не найдены
                </div>
              )}
            </div>
          </div>

          {/* Панель управления выбранным пользователем */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                    {selectedUser.nickname?.[0] || '?'}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedUser.nickname || 'Без имени'}</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedUser.id || 'локальный'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Лапки</span>
                    <p className="text-white font-bold text-lg">🐾 {selectedUser.paws || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Котов</span>
                    <p className="text-white font-bold text-lg">{selectedUser.cats?.length || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Уровень</span>
                    <p className="text-white font-bold text-lg">
                      {selectedUser.cats?.reduce((max: number, cat: any) => Math.max(max, cat.level || 1), 1) || 1}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Скинов</span>
                    <p className="text-white font-bold text-lg">{selectedUser.unlockedSkins?.length || 0}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Параметры бана</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-medium">Причина:</label>
                      <input
                        type="text"
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Причина блокировки"
                        className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-medium">Срок:</label>
                      <select
                        value={banDuration}
                        onChange={(e) => setBanDuration(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500"
                      >
                        <option value={-1}>Перманентно ♾️</option>
                        <option value={1}>1 минута ⏱️</option>
                        <option value={5}>5 минут ⏱️</option>
                        <option value={10}>10 минут ⏱️</option>
                        <option value={60}>1 час ⏳</option>
                        <option value={1440}>1 день 📅</option>
                        <option value={10080}>1 неделя 📅</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-1 mb-2">Действия с аккаунтом</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction('block', selectedUser.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Ban size={14} /> Заблокировать
                    </button>
                    <button
                      onClick={() => handleAction('unblock', selectedUser.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle size={14} /> Разблокировать
                    </button>
                    <button
                      onClick={() => handleAction('delete', selectedUser.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 size={14} /> Удалить
                    </button>
                    <button
                      onClick={() => handleAction('make_admin', selectedUser.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Crown size={14} /> Сделать админом
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Экспорт ключа прогресса</h4>
                  <button
                    onClick={() => handleExportUserKey(selectedUser)}
                    className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-lg shadow-violet-600/10"
                  >
                    🔑 {copiedKeyId === selectedUser.id ? 'Ключ успешно скопирован! ✅' : 'Скопировать экспорт-код прогресса'}
                  </button>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Редактирование баланса</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="+/- лапки"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500"
                      id="pawsInput"
                    />
                    <button
                      onClick={handleBalanceChange}
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition disabled:opacity-50 cursor-pointer"
                    >
                      Применить
                    </button>
                  </div>
                </div>

                {/* Сообщение о действии */}
                <AnimatePresence>
                  {actionMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-2 rounded-xl text-xs font-bold ${
                        actionType === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {actionMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Выберите пользователя для управления
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};