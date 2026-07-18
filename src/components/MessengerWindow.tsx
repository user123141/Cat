// src/components/MessengerWindow.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Users, MessageCircle, Settings, Wifi, Check, User, 
  Menu, X, ChevronLeft, Heart, Camera
} from 'lucide-react';
import { PlayerProfile, Cat } from '../types';
import { MacCatWindowFrame } from './MacCatWindowFrame';
import { triggerHaptic, triggerHapticLight } from '../utils/audio';
import { supabase } from '../supabase';
import { CatRenderer } from './CatRenderer';
import { ALL_SKINS_LIST } from '../game/constants';

interface ChatMessage {
  id: string;
  channel: string;
  sender_id: string;
  sender_nickname: string;
  sender_avatar?: string;
  sender_status?: string;
  sender_badge?: string;
  content: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
}

interface MessengerWindowProps {
  profile: PlayerProfile | null;
  activeCat: Cat | undefined;
  onClose: () => void;
  onMinimize: () => void;
  onUpdateNickname?: (name: string) => void;
  usersList?: any[];
  updateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile | null) => void;
  allSkins?: any[];
}

// ===== КАРТОЧКА ПОЛЬЗОВАТЕЛЯ =====
const UserProfileCard: React.FC<{ 
  userId: string; 
  onClose: () => void;
  profile: PlayerProfile | null;
  updateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile | null) => void;
  onSelectChatPartner?: (partner: any) => void;
}> = ({ userId, onClose, profile, updateProfile, onSelectChatPartner }) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('player_profiles')
      .select('profile_data, created_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setUserData({ ...data.profile_data, created_at: data.created_at });
        }
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="text-center text-slate-400 p-4">Загрузка...</div>;
  if (!userData) return <div className="text-center text-slate-400 p-4">Не найден</div>;

  const isFriend = profile?.friends?.includes(userId);

  const handleToggleFriend = () => {
    if (!updateProfile || !profile) return;
    triggerHaptic(40);
    updateProfile(prev => {
      const currentFriends = prev.friends || [];
      if (currentFriends.includes(userId)) {
        return {
          ...prev,
          friends: currentFriends.filter(id => id !== userId)
        };
      } else {
        return {
          ...prev,
          friends: [...currentFriends, userId]
        };
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-3xl overflow-hidden">
            {userData.avatar ? (
              <div className="scale-75">
                <CatRenderer
                  breed={userData.breed || 'Standard'}
                  color={userData.color || '#ffccd5'}
                  patternColor={userData.patternColor || '#ff85a1'}
                  eyeColor={userData.eyeColor || '#0ea5e9'}
                  status="idle"
                  size={56}
                />
              </div>
            ) : (
              '🐱'
            )}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">{userData.nickname || 'Без имени'}</h3>
            <p className="text-xs text-slate-400 font-mono">ID: {userId}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Регистрация</span><span className="font-medium">{userData.created_at ? new Date(userData.created_at).toLocaleDateString('ru-RU') : 'неизвестно'}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Лапок</span><span className="font-bold text-amber-400">🐾 {userData.paws || 0}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Котиков</span><span className="font-bold">{userData.cats?.length || 0}</span></div>
        </div>

        {updateProfile && userId !== profile?.id && (
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={handleToggleFriend}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isFriend
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isFriend ? '💔 Удалить из друзей' : '🤝 Добавить в друзья'}
            </button>
            <button
              onClick={() => {
                triggerHaptic(40);
                if (onSelectChatPartner) {
                  onSelectChatPartner({ id: userId, ...userData });
                }
                onClose();
              }}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              💬 Написать сообщение
            </button>
          </div>
        )}

        <button onClick={onClose} className="mt-2 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer font-bold text-xs">Закрыть</button>
      </div>
    </motion.div>
  );
};

// ===== ОСНОВНОЙ КОМПОНЕНТ =====
export const MessengerWindow: React.FC<MessengerWindowProps> = ({
  profile,
  activeCat,
  onClose,
  onMinimize,
  onUpdateNickname,
  usersList = [],
  updateProfile,
  allSkins = [],
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'players' | 'friends' | 'profile'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Друзья и локальные игроки
  const [localUsersList, setLocalUsersList] = useState<any[]>([]);
  const [friendInput, setFriendInput] = useState('');

  // Фотосессия
  const [showPhotoshoot, setShowPhotoshoot] = useState(false);
  const [photoshootZoom, setPhotoshootZoom] = useState(1.0);
  const [photoshootEmotion, setPhotoshootEmotion] = useState<'normal' | 'happy' | 'sleepy' | 'angry'>('normal');
  const [photoshootOverlay, setPhotoshootOverlay] = useState<'none' | 'hearts' | 'sparkles' | 'rain' | 'angry'>('none');

  const photoshootColors = useMemo(() => {
    if (!activeCat) return { breed: 'Standard', color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9' };
    const baseSkin = ALL_SKINS_LIST.find(s => s.id === activeCat.skinId);
    if (baseSkin) {
      return {
        breed: baseSkin.breed && baseSkin.breed !== 'All' ? baseSkin.breed : activeCat.breed,
        color: baseSkin.color || '#ffccd5',
        patternColor: baseSkin.patternColor || '#ff85a1',
        eyeColor: baseSkin.eyeColor || '#0ea5e9'
      };
    }
    return {
      breed: activeCat.breed || 'Standard',
      color: '#ffccd5',
      patternColor: '#ff85a1',
      eyeColor: '#0ea5e9'
    };
  }, [activeCat]);

  // Presence и редактирование
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const lastSeenOnlineRef = useRef<Record<string, number>>({});
  const [editNickname, setEditNickname] = useState(profile?.nickname || '');
  const [selectedBadge, setSelectedBadge] = useState(profile?.selectedBadge || '');

  useEffect(() => {
    if (!supabase) return;
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('player_profiles').select('*');
      if (!error && data) {
        setLocalUsersList(data.map(row => ({
          id: row.id,
          ...row.profile_data,
          nickname: row.profile_data?.nickname || row.id,
          created_at: row.created_at
        })));
      }
    };
    fetchUsers();
  }, []);

  const activeUsersList = useMemo(() => {
    return localUsersList.length > 0 ? localUsersList : (usersList || []);
  }, [localUsersList, usersList]);

  const [activeChatPartner, setActiveChatPartner] = useState<any | null>(null);

  const currentChannel = useMemo(() => {
    if (!activeChatPartner || !profile) return 'global';
    const myId = profile.id || profile.nickname;
    const partnerId = activeChatPartner.id;
    return ['private', myId, partnerId].sort().join('_');
  }, [activeChatPartner, profile]);

  const handleAddFriendByInput = async (input: string) => {
    if (!supabase || !updateProfile || !input.trim() || !profile) return;
    const target = input.trim();
    
    // Поиск по ID в Supabase
    const { data, error } = await supabase
      .from('player_profiles')
      .select('id, profile_data')
      .eq('id', target)
      .maybeSingle();
    
    let foundId = '';
    let foundNickname = '';
    
    if (!error && data) {
      foundId = data.id;
      foundNickname = data.profile_data?.nickname || foundId;
    } else {
      // Иначе ищем в локальном списке по никнейму (без учета регистра)
      const found = activeUsersList.find(u => u.nickname?.toLowerCase() === target.toLowerCase());
      if (found) {
        foundId = found.id;
        foundNickname = found.nickname || foundId;
      }
    }

    if (foundId) {
      if (foundId === profile.id) {
        alert('Нельзя добавить себя в друзья!');
        return;
      }
      updateProfile(prev => {
        const currentFriends = prev.friends || [];
        if (currentFriends.includes(foundId)) {
          alert('Этот игрок уже в друзьях!');
          return prev;
        }
        return {
          ...prev,
          friends: [...currentFriends, foundId]
        };
      });
      alert(`Игрок ${foundNickname} успешно добавлен в друзья! 🤝`);
    } else {
      alert('Игрок не найден. Проверьте ID или Никнейм.');
    }
  };

  useEffect(() => {
    if (profile) {
      setEditNickname(profile.nickname);
      setSelectedBadge(profile.selectedBadge || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!supabase || !profile) return;
    const uid = profile.id || profile.nickname;

    const presenceChannel = supabase.channel('online_presence', {
      config: { presence: { key: uid } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(presenceChannel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: uid,
            nickname: profile.nickname,
            avatar: profile.avatar,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [profile]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Закрываем меню при выборе вкладки на мобильных
  const handleTabChange = (tab: 'chat' | 'players' | 'friends' | 'profile') => {
    setActiveTab(tab);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  // ===== ЗАГРУЗКА СООБЩЕНИЙ =====
  const loadMessages = useCallback(async (pageNum: number, reset = false) => {
    if (!supabase) return;
    setIsLoadingMore(true);
    try {
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('maccat_chat_messages')
        .select('*')
        .eq('channel', currentChannel)
        .order('timestamp', { ascending: false })
        .range(from, to);
      if (error) throw error;
      if (data.length < pageSize) setHasMore(false);
      else setHasMore(true);
      setMessages(prev => {
        const combined = reset ? data : [...data, ...prev];
        const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
        return unique.sort((a, b) => a.timestamp - b.timestamp);
      });
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentChannel]);

  // ===== REALTIME ПОДПИСКА =====
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`chat_realtime_${currentChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maccat_chat_messages',
          filter: `channel=eq.${currentChannel}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe();

    loadMessages(0, true);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages, currentChannel]);

  // ===== ОТПРАВКА =====
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile || !supabase) return;

    triggerHaptic();
    const cleanText = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

    const newMessage = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      channel: currentChannel,
      sender_id: profile.id || profile.nickname,
      sender_nickname: profile.nickname,
      sender_avatar: profile.avatar || '🐱',
      sender_status: 'онлайн',
      sender_badge: profile.selectedBadge || '',
      content: cleanText,
      timestamp: Date.now(),
    };

    try {
      const { error } = await supabase.from('maccat_chat_messages').insert(newMessage);
      if (error) throw error;
      if (updateProfile) {
        updateProfile(prev => {
          const updatedQuests = prev.quests.map((q) => {
            if (q.id === 'custom_msg' && !q.completed) {
              const progress = Math.min(q.target, q.progress + 1);
              const completed = progress >= q.target;
              return { ...q, progress, completed };
            }
            return q;
          });
          return { ...prev, quests: updatedQuests };
        });
      }
    } catch (e) {
      console.error('Ошибка отправки:', e);
      setMessages(prev => [...prev, newMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendImageMessage = async (base64Data: string) => {
    if (!profile || !supabase) return;
    const newMessage = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      channel: currentChannel,
      sender_id: profile.id || profile.nickname,
      sender_nickname: profile.nickname,
      sender_avatar: profile.avatar || '🐱',
      sender_status: 'онлайн',
      sender_badge: profile.selectedBadge || '',
      content: base64Data,
      timestamp: Date.now(),
    };
    try {
      const { error } = await supabase.from('maccat_chat_messages').insert(newMessage);
      if (error) throw error;
      if (updateProfile) {
        updateProfile(prev => {
          const updatedQuests = prev.quests.map((q) => {
            if (q.id === 'custom_msg' && !q.completed) {
              const progress = Math.min(q.target, q.progress + 1);
              const completed = progress >= q.target;
              return { ...q, progress, completed };
            }
            return q;
          });
          return { ...prev, quests: updatedQuests };
        });
      }
    } catch (e) {
      console.error('Ошибка отправки изображения:', e);
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const takeSnapshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    if (photoshootOverlay === 'hearts') {
      grad.addColorStop(0, '#fce7f3');
      grad.addColorStop(1, '#fbcfe8');
    } else if (photoshootOverlay === 'sparkles') {
      grad.addColorStop(0, '#ecfeff');
      grad.addColorStop(1, '#cffafe');
    } else if (photoshootOverlay === 'rain') {
      grad.addColorStop(0, '#eff6ff');
      grad.addColorStop(1, '#dbeafe');
    } else if (photoshootOverlay === 'angry') {
      grad.addColorStop(0, '#fef2f2');
      grad.addColorStop(1, '#fee2e2');
    } else {
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 248);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 24, 8);
    ctx.fillRect(0, 0, 8, 24);
    ctx.fillRect(232, 0, 24, 8);
    ctx.fillRect(248, 0, 8, 24);
    ctx.fillRect(0, 248, 24, 8);
    ctx.fillRect(0, 232, 8, 24);
    ctx.fillRect(232, 248, 24, 8);
    ctx.fillRect(248, 232, 8, 24);

    ctx.save();
    ctx.translate(128, 128);
    ctx.scale(photoshootZoom, photoshootZoom);

    ctx.font = '72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let catEmoji = '🐱';
    if (photoshootColors.breed === 'Siamese') catEmoji = '🐈';
    else if (photoshootColors.breed === 'British') catEmoji = '🐾';
    else if (photoshootColors.breed === 'Persian') catEmoji = '🦁';
    
    ctx.fillText(catEmoji, 0, 0);

    ctx.font = '28px sans-serif';
    if (photoshootEmotion === 'happy') {
      ctx.fillText('✨', -24, -28);
      ctx.fillText('✨', 24, -28);
    } else if (photoshootEmotion === 'sleepy') {
      ctx.fillText('💤', 24, -28);
    } else if (photoshootEmotion === 'angry') {
      ctx.fillText('💢', -24, -28);
    }
    ctx.restore();

    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (photoshootOverlay === 'hearts') {
      ctx.fillText('💖', 48, 48);
      ctx.fillText('❤️', 208, 208);
      ctx.fillText('🌸', 208, 48);
      ctx.fillText('💕', 48, 208);
    } else if (photoshootOverlay === 'sparkles') {
      ctx.fillText('✨', 48, 48);
      ctx.fillText('🌟', 208, 208);
      ctx.fillText('⭐', 208, 48);
      ctx.fillText('✨', 48, 208);
    } else if (photoshootOverlay === 'rain') {
      ctx.fillText('💧', 48, 64);
      ctx.fillText('💧', 208, 208);
      ctx.fillText('🌧️', 128, 48);
    } else if (photoshootOverlay === 'angry') {
      ctx.fillText('⚡', 48, 48);
      ctx.fillText('⚡', 208, 208);
      ctx.fillText('💥', 128, 48);
    }

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffffff80';
    ctx.textAlign = 'center';
    ctx.fillText(`CARE OS • ${activeCat ? activeCat.name.toUpperCase() : 'CAT'}`, 128, 230);

    return canvas.toDataURL('image/png');
  };

  // ===== БЕСКОНЕЧНАЯ ПРОКРУТКА =====
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && !isLoadingMore && hasMore) {
      setPage(prev => prev + 1);
      loadMessages(page + 1, false);
    }
  };

  // ===== РЕНДЕР АВАТАРА =====
  const renderAvatar = (avatarStr?: string, size: number = 32) => {
    if (!avatarStr) return <div className={`w-${size/4} h-${size/4} rounded-full bg-slate-700`} />;
    try {
      const parsed = JSON.parse(avatarStr);
      if (parsed.breed) {
        return (
          <div className={`w-${size/4} h-${size/4} overflow-hidden rounded-full`}>
            <CatRenderer
              breed={parsed.breed}
              color={parsed.color || '#ffccd5'}
              patternColor={parsed.patternColor || '#ff85a1'}
              eyeColor={parsed.eyeColor || '#0ea5e9'}
              hat={parsed.hat}
              glasses={parsed.glasses}
              collar={parsed.collar}
              scarf={parsed.scarf}
              boots={parsed.boots}
              wings={parsed.wings}
              status={parsed.pose || 'idle'}
              size={size}
            />
          </div>
        );
      }
    } catch (e) {}
    return <div className={`w-${size/4} h-${size/4} rounded-full bg-slate-700 flex items-center justify-center text-white text-xs`}>{avatarStr[0] || '?'}</div>;
  };

  // ===== ИГРОКИ (онлайн) =====
  const sortedPlayers = useMemo(() => {
    return [...activeUsersList]
      .map(user => {
        const isCurrentlyOnline = !!onlineUsers[user.id] || (user.lastSavedTime ? (Date.now() - user.lastSavedTime < 180000) : false);
        if (isCurrentlyOnline) {
          lastSeenOnlineRef.current[user.id] = Date.now();
        }
        const lastSeen = lastSeenOnlineRef.current[user.id] || 0;
        const isOnline = isCurrentlyOnline || (Date.now() - lastSeen < 60000);
        return {
          ...user,
          isOnline
        };
      })
      .sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return 0;
      });
  }, [activeUsersList, onlineUsers]);

  // ===== СТАТУСЫ =====
  const getStatusIcon = (status?: string) => {
    if (status === 'read') return <Check size={12} className="text-sky-400" />;
    if (status === 'delivered') return <Check size={12} className="text-slate-400" />;
    return <Check size={12} className="text-slate-500" />;
  };

  return (
    <MacCatWindowFrame
      id="messenger"
      title="Мессенджер"
      subtitle="Общайтесь с другими"
      onClose={onClose}
      onMinimize={onMinimize}
      className="max-w-5xl"
    >
      <div className="flex flex-1 overflow-hidden h-full relative">
        {/* Боковое меню - для десктопа всегда видно, для мобильных - выдвижное */}
        <div className={`
          ${isMobile ? 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300' : 'relative w-1/4 min-w-[160px] bg-black/45 border-r border-white/5 flex flex-col'}
          ${isMobile && !isMobileMenuOpen ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'}
        `}>
          <div className={`
            ${isMobile ? 'absolute left-0 top-0 h-full w-3/4 max-w-[280px] bg-slate-900 border-r border-white/10 shadow-2xl p-4 flex flex-col' : 'flex flex-col h-full'}
          `}>
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="self-end p-2 rounded-lg hover:bg-white/10 text-white mb-2"
              >
                <X size={20} />
              </button>
            )}
            
            <div className="space-y-1 flex-1">
              <button
                onClick={() => handleTabChange('chat')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition ${
                  activeTab === 'chat' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle size={16} /> Чат
              </button>
              <button
                onClick={() => handleTabChange('players')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition ${
                  activeTab === 'players' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users size={16} /> Игроки
                {sortedPlayers.filter(p => p.isOnline).length > 0 && (
                  <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full">
                    {sortedPlayers.filter(p => p.isOnline).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('friends')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition ${
                  activeTab === 'friends' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart size={16} className="text-pink-500" /> Друзья
                {profile?.friends && profile.friends.length > 0 && (
                  <span className="ml-auto bg-pink-500/20 text-pink-400 text-[9px] px-2 py-0.5 rounded-full">
                    {profile.friends.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition ${
                  activeTab === 'profile' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings size={16} /> Профиль
              </button>
            </div>

            <div className="mt-auto p-3 border-t border-white/5 bg-black/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center overflow-hidden shrink-0">
                  {profile?.avatar ? renderAvatar(profile.avatar, 36) : <User size={16} className="text-sky-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{profile?.nickname || 'Без имени'}</div>
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Wifi size={10} /> онлайн
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Основная область */}
        <div className="flex-1 flex flex-col bg-black/15 relative">
          {/* Мобильный хедер с кнопкой меню */}
          {isMobile && (
            <div className="flex items-center gap-2 p-2 border-b border-white/5 bg-black/10 shrink-0">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white"
              >
                <Menu size={20} />
              </button>
              <span className="text-sm font-bold text-white">
                {activeTab === 'chat' ? 'Чат' : activeTab === 'players' ? 'Игроки' : 'Профиль'}
              </span>
            </div>
          )}

          {activeTab === 'chat' && (
            <>
              <div className="p-2 border-b border-white/5 bg-black/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {activeChatPartner ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHapticLight();
                          setActiveChatPartner(null);
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-sky-400 cursor-pointer flex items-center gap-0.5"
                      >
                        <ChevronLeft size={14} />
                        <span className="text-[10px] font-bold">Назад</span>
                      </button>
                      <span className="text-slate-500 font-bold">|</span>
                      <h3 className="text-xs font-black text-white flex items-center gap-1">
                        🔒 ЛС: {activeChatPartner.nickname || 'Без имени'}
                      </h3>
                      {activeChatPartner.isOnline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <h3 className="text-xs font-black text-white">🌍 Общий чат</h3>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{messages.length} сообщ.</span>
              </div>

              <div
                className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth"
                onScroll={handleScroll}
              >
                {isLoadingMore && (
                  <div className="text-center text-xs text-slate-500 py-2">Загрузка...</div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.sender_id === (profile?.id || profile?.nickname);
                  const isSystem = msg.sender_id === 'admin' || msg.sender_id === 'sys';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] py-1.5 px-4 rounded-full font-medium">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {renderAvatar(msg.sender_avatar, 32)}
                      </div>

                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] font-bold text-white">{msg.sender_nickname}</span>
                          {msg.sender_badge && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                              {msg.sender_badge}
                            </span>
                          )}
                        </div>
                        <div className={`p-2.5 rounded-2xl text-sm break-words mt-0.5 ${
                          isMe
                            ? 'bg-sky-500/25 border border-sky-500/20 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.content.startsWith('data:image/') ? (
                            <div className="space-y-1">
                              <img src={msg.content} alt="Снимок" className="rounded-xl max-w-full h-auto max-h-48 object-contain border border-white/10" referrerPolicy="no-referrer" />
                              <div className="text-[9px] text-slate-400 italic font-mono">📸 Фотоснимок из студии</div>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          {isMe && getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Интерактивная фотостудия котика (Photoshoot Workbench) */}
              {showPhotoshoot && activeCat && (
                <div className="p-3 border-t border-white/5 bg-slate-950/95 flex flex-col sm:flex-row gap-3 items-center shrink-0">
                  <div className="relative w-24 h-24 bg-black/50 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-sky-500/10 pointer-events-none" />
                    
                    <div style={{ transform: `scale(${photoshootZoom})` }} className="transition-transform duration-200">
                      <CatRenderer
                        breed={photoshootColors.breed}
                        color={photoshootColors.color}
                        patternColor={photoshootColors.patternColor}
                        eyeColor={photoshootColors.eyeColor}
                        hat={activeCat.hat}
                        glasses={activeCat.glasses}
                        collar={activeCat.collar}
                        scarf={activeCat.scarf}
                        boots={activeCat.boots}
                        wings={activeCat.wings}
                        accessory={activeCat.accessory}
                        status={
                          photoshootEmotion === 'sleepy' ? 'sleeping' :
                          photoshootEmotion === 'happy' ? 'playing' : 'idle'
                        }
                        size={64}
                        staticPreview={false}
                      />
                    </div>

                    {/* Кастомный оверлей */}
                    {photoshootOverlay === 'hearts' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs animate-pulse">
                        <span className="absolute top-1 left-1 animate-bounce">💖</span>
                        <span className="absolute bottom-1 right-1 animate-bounce delay-75">❤️</span>
                      </div>
                    )}
                    {photoshootOverlay === 'sparkles' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs">
                        <span className="absolute top-1 right-1 animate-spin">✨</span>
                        <span className="absolute bottom-1 left-1 animate-pulse">🌟</span>
                      </div>
                    )}
                    {photoshootOverlay === 'rain' && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-[10px] opacity-70 animate-pulse">
                        <div className="flex justify-around"><span>💧</span><span>💧</span></div>
                        <div className="flex justify-around delay-75"><span>💧</span><span>💧</span></div>
                      </div>
                    )}
                    {photoshootOverlay === 'angry' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-sm">
                        <span className="absolute top-1 right-1 animate-bounce">💢</span>
                        <span className="absolute top-4 left-1 animate-ping">⚡</span>
                      </div>
                    )}
                  </div>

                  {/* Правая часть: Контроллеры */}
                  <div className="flex-1 w-full text-left space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                        <Camera size={10} className="text-sky-400" /> 📸 Фотомастерская котика
                      </span>
                      <button type="button" onClick={() => setShowPhotoshoot(false)} className="text-slate-400 hover:text-white p-0.5 cursor-pointer">
                        <X size={12} />
                      </button>
                    </div>

                    {/* Зум ползунок */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">Зум:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={photoshootZoom}
                        onChange={(e) => setPhotoshootZoom(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <span className="text-[9px] font-mono text-sky-400 w-8">{photoshootZoom}x</span>
                    </div>

                    {/* Настроение и Оверлеи */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Эмоция</span>
                        <select
                          value={photoshootEmotion}
                          onChange={(e) => setPhotoshootEmotion(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="normal">🙂 Обычная</option>
                          <option value="happy">😸 Счастливая</option>
                          <option value="sleepy">💤 Сонная</option>
                          <option value="angry">😾 Сердитая</option>
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Оверлей</span>
                        <select
                          value={photoshootOverlay}
                          onChange={(e) => setPhotoshootOverlay(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="none">❌ Нет</option>
                          <option value="hearts">💖 Сердечки</option>
                          <option value="sparkles">✨ Сияние</option>
                          <option value="rain">💧 Слёзы</option>
                          <option value="angry">⚡ Молнии</option>
                        </select>
                      </div>
                    </div>

                    {/* Сделать снимок */}
                    <button
                      type="button"
                      onClick={async () => {
                        triggerHaptic(50);
                        const base64Img = takeSnapshot();
                        if (base64Img) {
                          await sendImageMessage(base64Img);
                          if (updateProfile) {
                            updateProfile(prev => {
                              const updatedQuests = prev.quests.map((q) => {
                                if (q.id === 'custom_photo' && !q.completed) {
                                  const progress = Math.min(q.target, q.progress + 1);
                                  const completed = progress >= q.target;
                                  return { ...q, progress, completed };
                                }
                                return q;
                              });
                              return { ...prev, quests: updatedQuests };
                            });
                          }
                        }
                      }}
                      className="w-full py-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-[8px] uppercase tracking-wider rounded-lg cursor-pointer shadow active:scale-95 transition-all"
                    >
                      📸 Сделать снимок и отправить в чат
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-2 border-t border-white/5 bg-black/15 flex gap-2 shrink-0 items-center">
                {activeCat && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(30);
                      setShowPhotoshoot(!showPhotoshoot);
                    }}
                    className={`p-2 rounded-xl transition shrink-0 cursor-pointer ${
                      showPhotoshoot ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-400'
                    }`}
                    title="Камера котика"
                  >
                    <Camera size={16} />
                  </button>
                )}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Сообщение..."
                  disabled={isSubmitting}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputText.trim()}
                  className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}

          {activeTab === 'players' && (
            <div className="p-3 overflow-y-auto flex-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Игроки онлайн</h4>
              <div className="space-y-2">
                {sortedPlayers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer border border-transparent hover:border-white/10"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar ? renderAvatar(user.avatar, 40) : <User size={18} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{user.nickname || 'Без имени'}</span>
                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Котиков: {user.cats?.length || 0}</span>
                        <span>•</span>
                        <span>Лвл: {Math.max(0, ...(user.cats || []).map((c: any) => c.level || 1))}</span>
                      </div>
                    </div>
                    {user.isOnline ? (
                      <div className="text-[10px] text-emerald-400 font-bold">В сети</div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-medium">Не в сети</div>
                    )}
                  </div>
                ))}

                {sortedPlayers.length === 0 && (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    Пока нет других игроков.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="p-3 overflow-y-auto flex-1 text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Мои друзья 🤝</h4>
              
              {/* Поиск/добавление друга */}
              <div className="flex gap-2 mb-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                <input
                  type="text"
                  placeholder="Никнейм или ID игрока..."
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleAddFriendByInput(friendInput);
                    setFriendInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
                >
                  Добавить
                </button>
              </div>

              {/* Список друзей */}
              <div className="space-y-2">
                {sortedPlayers.filter(u => profile?.friends?.includes(u.id)).map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer border border-transparent hover:border-white/10"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar ? renderAvatar(user.avatar, 40) : <User size={18} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{user.nickname || 'Без имени'}</span>
                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Котиков: {user.cats?.length || 0}</span>
                        <span>•</span>
                        <span>Лвл: {Math.max(0, ...(user.cats || []).map((c: any) => c.level || 1))}</span>
                      </div>
                    </div>
                    {user.isOnline ? (
                      <div className="text-[10px] text-emerald-400 font-bold">В сети</div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-medium">Не в сети</div>
                    )}
                  </div>
                ))}

                {(!profile?.friends || profile.friends.filter(id => activeUsersList.some(u => u.id === id)).length === 0) && (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    У вас пока нет добавленных друзей.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-4 overflow-y-auto flex-1 text-left">
              <h4 className="text-sm font-bold text-white mb-4">Настройки профиля</h4>
              
              <div className="space-y-5 max-w-md">
                {/* Текущее превью */}
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-3xl overflow-hidden border border-white/10 shrink-0">
                    {profile?.avatar ? renderAvatar(profile.avatar, 64) : '🐱'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="truncate">{profile?.nickname}</span>
                      {profile?.selectedBadge && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black shrink-0">
                          {profile.selectedBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">ID: {profile?.id}</div>
                  </div>
                </div>

                {/* Редактирование ника */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Никнейм</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                {/* Выбор значка */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Значок / Звание</label>
                  <select
                    value={selectedBadge}
                    onChange={(e) => setSelectedBadge(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">Без значка 🐾</option>
                    {profile?.unlockedAchievements?.includes('first_cat') && <option value="🍼 Котятник">🍼 Котятник</option>}
                    {profile?.unlockedAchievements?.includes('level_5') && <option value="⭐ Эксперт">⭐ Эксперт</option>}
                    {profile?.unlockedAchievements?.includes('pet_50') && <option value="💖 Заботливый">💖 Заботливый</option>}
                    {profile?.unlockedAchievements?.includes('skin_3') && <option value="🕶️ Стильный">🕶️ Стильный</option>}
                    {profile?.unlockedAchievements?.includes('rich_1000') && <option value="👑 Магнат">👑 Магнат</option>}
                    {profile?.unlockedAchievements?.includes('antistress_100') && <option value="🧘 Дзен">🧘 Дзен</option>}
                  </select>
                </div>

                {/* Кнопка сохранения */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    if (!updateProfile) return;
                    const nextNickname = editNickname.trim();
                    if (nextNickname.length < 2) {
                      alert('Никнейм слишком короткий!');
                      return;
                    }
                    updateProfile((prev) => ({
                      ...prev,
                      nickname: nextNickname,
                      selectedBadge: selectedBadge
                    }));
                    if (onUpdateNickname) {
                      onUpdateNickname(nextNickname);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Сохранить настройки
                </button>

                {/* Сетка разблокированных аватаров */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Выбрать аватар из коллекции</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {/* Базовый котик */}
                    <div
                      onClick={() => {
                        triggerHapticLight();
                        if (updateProfile) {
                          updateProfile(prev => ({ ...prev, avatar: '🐱' }));
                        }
                      }}
                      className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/5 cursor-pointer relative"
                    >
                      🐱
                    </div>
                    {/* Купленные скины */}
                    {ALL_SKINS_LIST.filter(s => profile?.unlockedSkins.includes(s.id)).map(skin => {
                      return (
                        <div
                          key={skin.id}
                          onClick={() => {
                            triggerHapticLight();
                            if (!updateProfile) return;
                            const avatarObj = {
                              breed: skin.breed || 'Standard',
                              color: skin.color || '#ffccd5',
                              patternColor: skin.patternColor || '#ff85a1',
                              eyeColor: skin.eyeColor || '#0ea5e9',
                              hat: skin.slot === 'hat' ? skin.accessory : undefined,
                              glasses: skin.slot === 'glasses' ? skin.accessory : undefined,
                              collar: skin.slot === 'collar' ? skin.accessory : undefined,
                              scarf: skin.slot === 'scarf' ? skin.accessory : undefined,
                              boots: skin.slot === 'boots' ? skin.accessory : undefined,
                              wings: skin.slot === 'wings' ? skin.accessory : undefined,
                            };
                            updateProfile(prev => ({
                              ...prev,
                              avatar: JSON.stringify(avatarObj)
                            }));
                          }}
                          className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 cursor-pointer p-1"
                          title={skin.name}
                        >
                          <CatRenderer
                            breed={skin.breed || 'Standard'}
                            color={skin.color || '#ffccd5'}
                            patternColor={skin.patternColor || '#ff85a1'}
                            eyeColor={skin.eyeColor || '#0ea5e9'}
                            hat={skin.slot === 'hat' ? skin.accessory : undefined}
                            glasses={skin.slot === 'glasses' ? skin.accessory : undefined}
                            collar={skin.slot === 'collar' ? skin.accessory : undefined}
                            scarf={skin.slot === 'scarf' ? skin.accessory : undefined}
                            boots={skin.slot === 'boots' ? skin.accessory : undefined}
                            wings={skin.slot === 'wings' ? skin.accessory : undefined}
                            status="idle"
                            size={32}
                            staticPreview={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Характеристики игрока */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs space-y-2 mt-4">
                  <h5 className="font-bold text-slate-300">Статистика игрока</h5>
                  <div className="flex justify-between"><span className="text-slate-400">Лапки</span><span className="font-bold text-amber-400">🐾 {profile?.paws || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Котиков</span><span className="font-bold">{profile?.cats?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Макс. уровень</span><span className="font-bold text-sky-400">{Math.max(0, ...(profile?.cats || []).map(c => c.level || 1))}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Регистрация</span><span className="font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : 'неизвестно'}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <UserProfileCard 
            userId={selectedUserId} 
            onClose={() => setSelectedUserId(null)} 
            profile={profile}
            updateProfile={updateProfile}
            onSelectChatPartner={(partner) => {
              setActiveChatPartner(partner);
              setActiveTab('chat');
            }}
          />
        )}
      </AnimatePresence>
    </MacCatWindowFrame>
  );
};