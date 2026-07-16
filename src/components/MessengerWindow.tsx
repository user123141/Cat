// src/components/MessengerWindow.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Users, MessageCircle, Settings, Plus, Camera,
  Wifi, Check, Award, ShieldAlert, Heart, Calendar, ArrowRight, UserCheck
} from 'lucide-react';
import { PlayerProfile, Cat, Skin } from '../types';
import { MacCatWindowFrame } from './MacCatWindowFrame';
import { triggerHaptic, triggerHapticLight } from '../utils/audio';
import { supabase } from '../supabase';
import { CatRenderer } from './CatRenderer';

interface MessengerWindowProps {
  profile: PlayerProfile | null;
  onClose: () => void;
  onMinimize: () => void;
  onUpdateNickname: (newNickname: string) => void;
  usersList?: any[];
  updateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile | null) => void;
  allSkins?: Skin[];
}

interface ChatMessage {
  id: string;
  channel: string;
  sender_id: string;
  sender_nickname: string;
  sender_avatar?: string; // JSON or breed string
  sender_status?: string;
  sender_badge?: string;
  content: string;
  timestamp: number;
}

interface ParsedAvatar {
  breed: string;
  color: string;
  patternColor: string;
  eyeColor: string;
  hat?: string;
  glasses?: string;
  collar?: string;
  scarf?: string;
  boots?: string;
  wings?: string;
  pose: 'idle' | 'eating' | 'sleeping' | 'playing' | 'bathing';
}

function parseAvatar(avatarStr?: string): ParsedAvatar {
  if (!avatarStr) {
    return { breed: 'Standard', color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9', pose: 'idle' };
  }
  try {
    const parsed = JSON.parse(avatarStr);
    if (parsed && typeof parsed === 'object' && parsed.breed) {
      return {
        breed: parsed.breed || 'Standard',
        color: parsed.color || '#ffccd5',
        patternColor: parsed.patternColor || '#ff85a1',
        eyeColor: parsed.eyeColor || '#0ea5e9',
        hat: parsed.hat,
        glasses: parsed.glasses,
        collar: parsed.collar,
        scarf: parsed.scarf,
        boots: parsed.boots,
        wings: parsed.wings,
        pose: parsed.pose || 'idle'
      };
    }
  } catch (e) {
    // If not JSON, it is a plain breed name
  }
  return {
    breed: avatarStr,
    color: avatarStr === 'Siamese' ? '#e2e8f0' : avatarStr === 'MaineCoon' ? '#ffd166' : '#ffccd5',
    patternColor: avatarStr === 'Siamese' ? '#1e293b' : avatarStr === 'MaineCoon' ? '#ef476f' : '#ff85a1',
    eyeColor: '#0ea5e9',
    pose: 'idle'
  };
}

const BADGES = [
  { id: 'veteran', emoji: '🏅', name: 'Ветеран', desc: 'Доступно всем жителям' },
  { id: 'cat_god', emoji: '🌟', name: 'Кошачий Бог', desc: 'Требуется сумма уровней котиков >= 5' },
  { id: 'developer', emoji: '💻', name: 'Разработчик', desc: 'Только для команды создателей' },
  { id: 'moderator', emoji: '🛡️', name: 'Модератор', desc: 'Почетный страж чистоты чата' },
  { id: 'cat_master', emoji: '🐾', name: 'Котоман', desc: 'У вас должно быть 2 или более котиков' },
];

export const MessengerWindow: React.FC<MessengerWindowProps> = ({
  profile,
  onClose,
  onMinimize,
  onUpdateNickname,
  usersList = [],
  updateProfile,
  allSkins = []
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'players' | 'profile'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Customization States
  const [tempNickname, setTempNickname] = useState(profile?.nickname || '');
  const [customStatus, setCustomStatus] = useState(localStorage.getItem('maccat_custom_status') || '🐾 Сплю с котиком');
  const [selectedBadge, setSelectedBadge] = useState<string>(profile?.selectedBadge || 'veteran');
  const [profileMessage, setProfileMessage] = useState('');

  // Photoshoot states
  const [selectedPose, setSelectedPose] = useState<'idle' | 'eating' | 'sleeping' | 'playing' | 'bathing'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active cat data for avatar photoshoot
  const activeCat = useMemo(() => {
    if (!profile?.cats) return null;
    return profile.cats.find(c => c.id === profile.activeCatId) || profile.cats[0];
  }, [profile]);

  const activeCatSkin = useMemo(() => {
    if (!activeCat) return null;
    return allSkins.find(s => s.id === activeCat.skinId) || null;
  }, [activeCat, allSkins]);

  // Load Real Supabase Messages
  const loadMessages = useCallback(async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('maccat_chat_messages')
          .select('*')
          .eq('channel', 'global')
          .order('timestamp', { ascending: true })
          .limit(60);
        
        if (!error && data) {
          setMessages(data.map(m => ({
            id: m.id,
            channel: m.channel,
            sender_id: m.sender_id,
            sender_nickname: m.sender_nickname,
            sender_avatar: m.sender_avatar,
            sender_status: m.sender_status,
            sender_badge: m.sender_badge,
            content: m.content,
            timestamp: Number(m.timestamp)
          })));
          return;
        }
      } catch (e) {
        console.error('Error loading Supabase messages:', e);
      }
    }

    // Local Storage Fallback
    const localSaved = localStorage.getItem('maccat_messages_global');
    if (localSaved) {
      try {
        setMessages(JSON.parse(localSaved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initial: ChatMessage[] = [
        { id: 'init_1', channel: 'global', sender_id: 'sys', sender_nickname: 'System', content: '🌍 Добро пожаловать в реальный общий чат! Напишите первое сообщение.', timestamp: Date.now() - 60000 }
      ];
      setMessages(initial);
      localStorage.setItem('maccat_messages_global', JSON.stringify(initial));
    }
  }, []);

  // Poll for real-time messages every 3 seconds
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile) return;

    triggerHaptic();
    const cleanText = inputText.trim();
    setInputText('');
    setIsSubmitting(true);

    const activeBadgeObject = BADGES.find(b => b.id === selectedBadge);

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      channel: 'global',
      sender_id: profile.id || profile.nickname,
      sender_nickname: profile.nickname,
      sender_avatar: profile.avatar || (activeCat ? activeCat.breed : 'Standard'),
      sender_status: customStatus,
      sender_badge: activeBadgeObject ? `${activeBadgeObject.emoji} ${activeBadgeObject.name}` : undefined,
      content: cleanText,
      timestamp: Date.now()
    };

    let successfullySavedToCloud = false;

    if (supabase) {
      try {
        const { error } = await supabase
          .from('maccat_chat_messages')
          .insert({
            id: newMessage.id,
            channel: 'global',
            sender_id: newMessage.sender_id,
            sender_nickname: newMessage.sender_nickname,
            sender_avatar: newMessage.sender_avatar,
            sender_status: newMessage.sender_status,
            sender_badge: newMessage.sender_badge,
            content: newMessage.content,
            timestamp: newMessage.timestamp
          });
        if (!error) successfullySavedToCloud = true;
      } catch (e) {
        console.error('Supabase message insert failed:', e);
      }
    }

    setMessages(prev => {
      const updated = [...prev, newMessage];
      localStorage.setItem('maccat_messages_global', JSON.stringify(updated));
      return updated;
    });

    setIsSubmitting(false);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');

    if (!tempNickname.trim()) {
      setProfileMessage('Имя не может быть пустым 😿');
      return;
    }

    triggerHaptic();

    if (updateProfile) {
      updateProfile((prev) => ({
        ...prev,
        nickname: tempNickname.trim(),
        selectedBadge: selectedBadge
      }));
    }

    onUpdateNickname(tempNickname.trim());
    localStorage.setItem('maccat_custom_status', customStatus);
    setProfileMessage('Профиль успешно сохранен в БД! ✨');
  };

  // Capture a snapshot of current cat with customized pose as Avatar
  const handleCaptureAvatar = () => {
    if (!activeCat || !updateProfile) return;
    triggerHaptic();

    const avatarObj = {
      breed: activeCat.breed,
      color: activeCatSkin?.color || '#ffccd5',
      patternColor: activeCatSkin?.patternColor || '#ff85a1',
      eyeColor: activeCatSkin?.eyeColor || '#0ea5e9',
      hat: activeCat.hat,
      glasses: activeCat.glasses,
      collar: activeCat.collar,
      scarf: activeCat.scarf,
      boots: activeCat.boots,
      wings: activeCat.wings,
      pose: selectedPose
    };

    updateProfile((prev) => ({
      ...prev,
      avatar: JSON.stringify(avatarObj)
    }));

    setProfileMessage('📸 Снимок зафиксирован! Ваш аватар успешно обновлен.');
  };

  // Check if badges are unlocked
  const isBadgeUnlocked = useCallback((badgeId: string): boolean => {
    if (!profile) return false;
    if (badgeId === 'veteran' || badgeId === 'moderator') return true;
    
    if (badgeId === 'cat_god') {
      const totalLevels = (profile.cats || []).reduce((acc, cat) => acc + (cat.level || 1), 0);
      return totalLevels >= 5;
    }

    if (badgeId === 'developer') {
      const nick = (profile.nickname || '').toLowerCase();
      return nick.includes('skorina') || nick.includes('dev') || nick.includes('admin') || profile.isAdmin === true;
    }

    if (badgeId === 'cat_master') {
      return (profile.cats || []).length >= 2;
    }

    return false;
  }, [profile]);

  // Player lists with online/offline detection
  const sortedPlayers = useMemo(() => {
    const now = Date.now();
    return [...usersList].map(user => {
      // Offline/Online detection (within last 5 minutes)
      const isUserOnline = user.lastSavedTime ? (now - user.lastSavedTime < 300000) : false;
      
      // Cat stats count
      const catsArray = user.cats || [];
      const highestLevel = catsArray.reduce((max: number, c: any) => Math.max(max, c.level || 1), 1);
      
      return {
        ...user,
        isOnline: isUserOnline,
        highestCatLevel: highestLevel,
        catsCount: catsArray.length
      };
    }).sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.highestCatLevel - a.highestCatLevel;
    });
  }, [usersList]);

  return (
    <MacCatWindowFrame
      id="messenger"
      title="Cat Messenger 💬"
      onClose={onClose}
      onMinimize={onMinimize}
      className="max-w-4xl"
    >
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Боковая колонка приложения */}
        <div className="w-1/4 min-w-[150px] md:min-w-[190px] bg-black/45 border-r border-white/5 flex flex-col justify-between shrink-0">
          <div className="p-3 space-y-4">
            {/* Навигационные вкладки */}
            <div className="space-y-1">
              <button
                onClick={() => { triggerHapticLight(); setActiveTab('chat'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black transition ${
                  activeTab === 'chat' 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <MessageCircle size={14} />
                <span>Общий чат</span>
              </button>
              <button
                onClick={() => { triggerHapticLight(); setActiveTab('players'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black transition ${
                  activeTab === 'players' 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Users size={14} />
                <span>Игроки</span>
                {sortedPlayers.length > 0 && (
                  <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                    {sortedPlayers.filter(p => p.isOnline).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { triggerHapticLight(); setActiveTab('profile'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black transition ${
                  activeTab === 'profile' 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Settings size={14} />
                <span>Профиль и Фото</span>
              </button>
            </div>
          </div>

          {/* Информация о текущем игроке внизу */}
          <div className="p-3 border-t border-white/5 bg-black/20 flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 overflow-hidden relative">
              {profile?.avatar ? (
                <div className="scale-75 translate-y-1">
                  {(() => {
                    const parsed = parseAvatar(profile.avatar);
                    return (
                      <CatRenderer
                        status={parsed.pose}
                        size={44}
                        breed={parsed.breed}
                        color={parsed.color}
                        patternColor={parsed.patternColor}
                        eyeColor={parsed.eyeColor}
                        hat={parsed.hat}
                        glasses={parsed.glasses}
                        collar={parsed.collar}
                        scarf={parsed.scarf}
                        boots={parsed.boots}
                        wings={parsed.wings}
                      />
                    );
                  })()}
                </div>
              ) : (
                <span className="text-sky-400 font-extrabold text-xs">{profile?.nickname?.[0] || '?' }</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black text-slate-200 truncate">{profile?.nickname || 'Без имени'}</div>
              <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                <Wifi size={8} />
                <span>Сеть онлайн</span>
              </div>
            </div>
          </div>
        </div>

        {/* Основное правое рабочее пространство */}
        <div className="flex-1 bg-black/15 flex flex-col overflow-hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-1 flex-col overflow-hidden h-full">
              {/* Заголовок */}
              <div className="p-3 border-b border-white/5 bg-black/10 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    🌍 Общий чат
                  </h3>
                  <p className="text-[9px] text-slate-400 leading-none mt-0.5">
                    Реальное кошачье комьюнити. Без фейковых ботов.
                  </p>
                </div>
                {/* Supabase status hidden */}
              </div>

              {/* Лента сообщений */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === (profile?.id || profile?.nickname);
                  const isSystem = msg.sender_id === 'sys';

                  if (isSystem) {
                    return (
                      <div key={msg.id || index} className="flex justify-center my-1.5">
                        <div className="bg-slate-800/60 border border-white/5 text-[10px] text-slate-300 py-1 px-3 rounded-full font-medium">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  const parsedMsgAvatar = parseAvatar(msg.sender_avatar);

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Аватар отправителя */}
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                        <div className="scale-75 translate-y-1">
                          <CatRenderer 
                            status={parsedMsgAvatar.pose} 
                            size={44}
                            breed={parsedMsgAvatar.breed}
                            color={parsedMsgAvatar.color}
                            patternColor={parsedMsgAvatar.patternColor}
                            eyeColor={parsedMsgAvatar.eyeColor}
                            hat={parsedMsgAvatar.hat}
                            glasses={parsedMsgAvatar.glasses}
                            collar={parsedMsgAvatar.collar}
                            scarf={parsedMsgAvatar.scarf}
                            boots={parsedMsgAvatar.boots}
                            wings={parsedMsgAvatar.wings}
                          />
                        </div>
                      </div>

                      {/* Текстовый пузырь */}
                      <div className="flex flex-col gap-0.5">
                        <div className={`flex items-center gap-1.5 text-[9px] font-bold text-slate-400 ${isMe ? 'justify-end' : ''}`}>
                          <span className="text-white font-black">{msg.sender_nickname}</span>
                          {msg.sender_badge && (
                            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 rounded text-[8px] font-medium font-mono">{msg.sender_badge}</span>
                          )}
                          {msg.sender_status && (
                            <span className="text-slate-500 font-normal">({msg.sender_status})</span>
                          )}
                        </div>
                        <div className={`p-2.5 rounded-2xl text-xs leading-normal select-text text-left ${
                          isMe 
                            ? 'bg-sky-500/25 border border-sky-500/20 text-white rounded-tr-none' 
                            : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <span className={`text-[8px] text-slate-500 mt-0.5 font-mono ${isMe ? 'text-right' : ''}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Блок отправки */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-white/5 bg-black/15 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Напишите Мяу-сообщение..."
                  disabled={isSubmitting}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputText.trim()}
                  className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1 text-left">
                  Жители приюта ({sortedPlayers.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sortedPlayers.map(player => {
                    const parsedPlAvatar = parseAvatar(player.avatar);
                    const activeBadgeObject = BADGES.find(b => b.id === player.selectedBadge);
                    return (
                      <div
                        key={player.id}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl flex gap-3 transition"
                      >
                        {/* Аватар */}
                        <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                          <div className="scale-75 translate-y-1">
                            <CatRenderer 
                              status={parsedPlAvatar.pose} 
                              size={56}
                              breed={parsedPlAvatar.breed}
                              color={parsedPlAvatar.color}
                              patternColor={parsedPlAvatar.patternColor}
                              eyeColor={parsedPlAvatar.eyeColor}
                              hat={parsedPlAvatar.hat}
                              glasses={parsedPlAvatar.glasses}
                              collar={parsedPlAvatar.collar}
                              scarf={parsedPlAvatar.scarf}
                              boots={parsedPlAvatar.boots}
                              wings={parsedPlAvatar.wings}
                            />
                          </div>
                        </div>

                        {/* Текстовое описание */}
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-black text-white truncate">{player.nickname}</span>
                              {player.isOnline ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="В сети" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" title="Не в сети" />
                              )}
                            </div>
                            <span className="text-[8px] text-slate-500 font-mono shrink-0">
                              {player.isOnline ? 'в сети' : 'оффлайн'}
                            </span>
                          </div>
                          <p className="text-[9px] text-sky-400 italic truncate leading-normal">
                            {activeBadgeObject ? `${activeBadgeObject.emoji} ${activeBadgeObject.name}` : '🐾 Житель Care OS'}
                          </p>
                          
                          <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400">
                            <span>Котиков: <strong className="text-slate-300 font-mono">{player.catsCount}</strong></span>
                            <span>Макс Лвл: <strong className="text-emerald-400 font-mono font-bold">{player.highestCatLevel}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {sortedPlayers.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                      Вы пока единственный житель в Care OS. Ваши будущие друзья появятся здесь, как только зарегистрируются! 🥰
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-4 flex-1 overflow-y-auto max-w-lg mx-auto w-full">
              <div className="space-y-4">
                {/* 📸 Фотосессия котика */}
                {activeCat && (
                  <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/10 rounded-2xl p-4 flex flex-col items-center">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1 self-start">
                      <Camera size={12} />
                      Кошачья фотосессия (Кастомный Аватар)
                    </h4>
                    
                    {/* Рендерер позы */}
                    <div className="w-28 h-28 bg-black/40 rounded-full border border-white/10 flex items-center justify-center overflow-hidden relative mb-4 shadow-inner">
                      <div className="scale-90 translate-y-2">
                        <CatRenderer
                          status={selectedPose}
                          size={110}
                          breed={activeCat.breed}
                          color={activeCatSkin?.color || '#ffccd5'}
                          patternColor={activeCatSkin?.patternColor || '#ff85a1'}
                          eyeColor={activeCatSkin?.eyeColor || '#0ea5e9'}
                          hat={activeCat.hat}
                          glasses={activeCat.glasses}
                          collar={activeCat.collar}
                          scarf={activeCat.scarf}
                          boots={activeCat.boots}
                          wings={activeCat.wings}
                        />
                      </div>
                    </div>

                    {/* Выбор позы */}
                    <div className="space-y-1 w-full text-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Выбрать позу котика:</span>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {[
                          { id: 'idle', label: 'Обычная 🐈' },
                          { id: 'eating', label: 'Кушает 🐟' },
                          { id: 'sleeping', label: 'Спит 💤' },
                          { id: 'playing', label: 'Играет 🧶' },
                          { id: 'bathing', label: 'Купается 🧼' }
                        ].map(pose => (
                          <button
                            key={pose.id}
                            type="button"
                            onClick={() => { triggerHapticLight(); setSelectedPose(pose.id as any); }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition border cursor-pointer ${
                              selectedPose === pose.id 
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35' 
                                : 'bg-black/30 text-slate-400 border-transparent hover:bg-black/40'
                            }`}
                          >
                            {pose.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureAvatar}
                      className="mt-3.5 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black tracking-wide transition shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95"
                    >
                      <Camera size={11} />
                      <span>Сделать снимок 📸</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                  {/* Никнейм */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Ваш кошачий никнейм:
                    </label>
                    <input
                      type="text"
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      placeholder="Введите никнейм"
                      maxLength={16}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  {/* Значок профиля */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Кошачий знак отличия (Badge):
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {BADGES.map(badge => {
                        const unlocked = isBadgeUnlocked(badge.id);
                        return (
                          <button
                            key={badge.id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => { triggerHapticLight(); setSelectedBadge(badge.id); }}
                            className={`flex items-center justify-between p-2 rounded-xl border transition text-left cursor-pointer ${
                              !unlocked ? 'opacity-40 bg-black/10 border-transparent cursor-not-allowed' :
                              selectedBadge === badge.id 
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30' 
                                : 'bg-black/40 text-slate-300 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{badge.emoji}</span>
                              <div>
                                <div className="text-[10px] font-extrabold">{badge.name}</div>
                                <div className="text-[8px] text-slate-400">{badge.desc}</div>
                              </div>
                            </div>
                            {selectedBadge === badge.id && unlocked && (
                              <Check size={12} className="text-sky-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Системные Метаданные */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1.5 text-[9px] text-slate-400 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Award size={10} /> Уникальный ID аккаунта:</span>
                      <span className="text-white font-bold select-all">{profile?.id || 'maccat_local_user'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Calendar size={10} /> Дата регистрации:</span>
                      <span className="text-white font-bold">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Сегодня'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-lg shadow-sky-500/10"
                  >
                    Сохранить изменения
                  </button>

                  {profileMessage && (
                    <p className="text-xs text-center font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 p-2 rounded-xl">
                      {profileMessage}
                    </p>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </MacCatWindowFrame>
  );
};
