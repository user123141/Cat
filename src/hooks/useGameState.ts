// src/hooks/useGameState.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Cat, PlayerProfile, DailyQuest, Skin, NotificationItem, GameAnalytics, DiaryEntry } from '../types';
import { GameLogger } from '../utils/GameLogger';
import { useNotifications } from './useNotifications';
import { useSync } from './useSync';
import { checkAchievements } from '../game/achievements';
import { calculateDecay, calculateOfflineDecay } from '../game/decay';
import { smartMergeProfiles } from '../game/merge';

// ==================== КОНСТАНТЫ ====================

export const INITIAL_SKINS: Skin[] = [
  { id: 'scottish_pink', name: 'Скоттиш Персик', description: 'Милейшая нежная шубка нежно-розового оттенка.', cost: 0, breed: 'Scottish Fold', color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9', rarity: 'common' },
  { id: 'british_blue', name: 'Голубой Британец', description: 'Густой бархатный серо-голубой велюровый покров.', cost: 240, breed: 'British Shorthair', color: '#64748b', patternColor: '#475569', eyeColor: '#f59e0b', rarity: 'common' },
  { id: 'siamese_point', name: 'Королевский Сиам', description: 'Изящный песочный окрас с благородной шоколадной маской.', cost: 380, breed: 'Siamese', color: '#fef3c7', patternColor: '#78350f', eyeColor: '#06b6d4', rarity: 'rare' },
  { id: 'sphynx_naked', name: 'Розовый Сфинкс', description: 'Элегантная бархатная кожа, полностью лишенная шерсти.', cost: 650, breed: 'Sphynx', color: '#fda4af', patternColor: '#f43f5e', eyeColor: '#10b981', rarity: 'epic' },
  { id: 'persian_gold', name: 'Золотистый Перс', description: 'Невероятно пушистый королевский мех цвета солнца.', cost: 800, breed: 'Persian', color: '#fef08a', patternColor: '#eab308', eyeColor: '#a855f7', rarity: 'epic' },
  { id: 'bombay_black', name: 'Бомбейская Пантера', description: 'Идеально гладкий, угольно-черный мех, переливающийся на солнце.', cost: 700, breed: 'Bombay', color: '#1e293b', patternColor: '#0f172a', eyeColor: '#f59e0b', rarity: 'rare' },
  { id: 'bengal_leopard', name: 'Дикий Бенгал', description: 'Экзотические леопардовые пятна и дикий гордый взгляд.', cost: 1200, breed: 'Bengal', color: '#f59e0b', patternColor: '#78350f', eyeColor: '#10b981', rarity: 'epic' },
  { id: 'sakura_dream', name: 'Лепесток Сакуры', description: 'Волшебная бело-розовая шубка с узором цветущей вишни.', cost: 1800, breed: 'Sakura Neko', color: '#fff1f2', patternColor: '#fda4af', eyeColor: '#ec4899', rarity: 'legendary' },
  { id: 'galaxy_cat', name: 'Космическая Небула', description: 'Звездный космический мех, сияющий всеми цветами галактики.', cost: 2900, breed: 'Galaxy Cat', color: '#312e81', patternColor: '#6366f1', eyeColor: '#a855f7', rarity: 'legendary' },
  
  { id: 'collar_bell', name: 'Ошейник с Бубенчиком', description: 'Традиционный красный ремешок с сияющим золотым колокольчиком.', cost: 120, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'collar_bell', slot: 'collar', rarity: 'common' },
  { id: 'cool_glasses', name: 'Кибер Очки', description: 'Стильные темные очки для самых уверенных в себе котиков.', cost: 320, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'cool_glasses', slot: 'glasses', rarity: 'rare' },
  { id: 'bow_tie', name: 'Джентльменская Бабочка', description: 'Красная шелковая бабочка для праздничных и элегантных моментов.', cost: 280, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'bow_tie', slot: 'collar', rarity: 'rare' },
  { id: 'gold_crown', name: 'Императорская Корона', description: 'Корона из чистейшего золота для истинного правителя вашей комнаты.', cost: 1400, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'gold_crown', slot: 'hat', rarity: 'legendary' },
  { id: 'wizard_hat', name: 'Колпак Волшебника', description: 'Синяя шляпа со звездами, наделяющая кота магией мурчания.', cost: 1800, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'wizard_hat', slot: 'hat', rarity: 'legendary' },
  { id: 'santa_hat', name: 'Новогодний Колпак', description: 'Уютная зимняя шапочка с пушистым белым помпоном.', cost: 240, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'santa_hat', slot: 'hat', rarity: 'common' },
  { id: 'detective_hat', name: 'Шерлок Кот', description: 'Клетчатая шляпа для любителей раскрывать тайны пропавших вкусняшек.', cost: 450, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'detective_hat', slot: 'hat', rarity: 'epic' },
  { id: 'party_hat', name: 'Праздничный Колпак', description: 'Смешной яркий колпачок для весёлых дней рождений.', cost: 110, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'party_hat', slot: 'hat', rarity: 'common' },
  { id: 'scarf_red', name: 'Теплый Шарф', description: 'Уютный вязаный шарфик ручной работы.', cost: 200, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'scarf_red', slot: 'scarf', rarity: 'common' },
  { id: 'boots_black', name: 'Милые Тапочки', description: 'Мягкие теплые сапожки на лапки.', cost: 250, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'boots_black', slot: 'boots', rarity: 'common' },
  { id: 'wings_fairy', name: 'Крылья Бабочки', description: 'Миниатюрные крылышки для легкой левитации.', cost: 300, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'wings_fairy', slot: 'wings', rarity: 'common' },
];

const generateExtraSkins = (): Skin[] => {
  const list: Skin[] = [];
  const rarities: ('common' | 'rare' | 'epic' | 'legendary')[] = ['common', 'rare', 'epic', 'legendary'];
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#a855f7'];
  const colorsRu = ['Розовый', 'Синий', 'Зеленый', 'Янтарный', 'Аметистовый', 'Малиновый', 'Бирюзовый', 'Изумрудный', 'Оранжевый', 'Фиолетовый'];
  const accessories = [
    { key: 'glasses', name: 'Очки "Стиляга"', desc: 'Премиальные темные очки для защиты глаз от солнца.', icon: '🕶️', slot: 'glasses' as const },
    { key: 'scarf', name: 'Теплый Шарф', desc: 'Уютный вязаный шарфик ручной работы.', icon: '🧣', slot: 'scarf' as const },
    { key: 'ribbon', name: 'Шелковый Бантик', desc: 'Крутой праздничный бантик на шею питомца.', icon: '🎀', slot: 'collar' as const },
    { key: 'headphones', name: 'Геймерские Наушники', desc: 'Наушники со светящимися кошачьи ушками.', icon: '🎧', slot: 'glasses' as const },
    { key: 'boots', name: 'Милые Тапочки', desc: 'Мягкие теплые сапожки на лапки.', icon: '🥾', slot: 'boots' as const },
    { key: 'halo', name: 'Нимб Ангелочка', desc: 'Светящийся парящий нимб для самых послушных.', icon: '😇', slot: 'hat' as const },
    { key: 'wings', name: 'Крылья Бабочки', desc: 'Миниатюрные крылышки для легкой левитации.', icon: '🦋', slot: 'wings' as const },
    { key: 'hat', name: 'Цилиндр Фокусника', desc: 'Шикарная высокая шляпа истинного джентльмена.', icon: '🎩', slot: 'hat' as const },
    { key: 'bell', name: 'Колокольчик', desc: 'Милый золотой звоночек, чтобы кот не потерялся.', icon: '🔔', slot: 'collar' as const },
    { key: 'star', name: 'Звездная Заколка', desc: 'Сверкающая заколка для ушка.', icon: '⭐', slot: 'hat' as const },
  ];

  for (let i = 0; i < 50; i++) {
    const accType = accessories[i % accessories.length];
    const colorIdx = Math.floor(i / 5) % colors.length;
    const colorName = colorsRu[colorIdx];
    const rarity = rarities[Math.floor(i / 13) % rarities.length];
    const cost = 120 + (i * 24);

    list.push({
      id: `gen_acc_${accType.key}_${i}`,
      name: `${colorName} ${accType.name}`,
      description: `${accType.desc} Стильный оттенок: ${colorName.toLowerCase()}.`,
      cost,
      breed: 'All',
      color: '',
      patternColor: '',
      eyeColor: '',
      accessory: `${accType.key}_${colorName.toLowerCase()}`,
      slot: accType.slot,
      rarity,
    });
  }

  const breeds = ['British Shorthair', 'Scottish Fold', 'Siamese', 'Persian', 'Sphynx'];
  const breedsRu = ['Британец', 'Скоттиш', 'Сиам', 'Перс', 'Сфинкс'];
  const themes = [
    { theme: 'Неоновый', desc: 'Ультра-яркий неоновый окрас для ночных прогулок.', pattern: '#10b981', eye: '#f59e0b' },
    { theme: 'Пастельный', desc: 'Нежнейший зефирный пастельный оттенок шерстки.', pattern: '#ec4899', eye: '#3b82f6' },
    { theme: 'Галактический', desc: 'Шерстка, сияющая далекими созвездиями и звездной пылью.', pattern: '#a855f7', eye: '#06b6d4' },
    { theme: 'Зефирный', desc: 'Сладкий зефирный окрас, пахнущий сахарной пудрой.', pattern: '#fda4af', eye: '#10b981' },
    { theme: 'Изумрудный', desc: 'Редкий изумрудный велюровый мех.', pattern: '#059669', eye: '#f59e0b' },
    { theme: 'Сапфировый', desc: 'Глубокий сине-голубой сапфировый оттенок.', pattern: '#1d4ed8', eye: '#eab308' },
    { theme: 'Карамельный', desc: 'Сладкий медово-карамельный окрас шерстки.', pattern: '#b45309', eye: '#10b981' },
    { theme: 'Радужный', desc: 'Все цвета радуги гармонично переливаются на солнце.', pattern: '#db2777', eye: '#3b82f6' },
    { theme: 'Тигровый', desc: 'Полосатый гордый дикий окрас степного хищника.', pattern: '#ea580c', eye: '#10b981' },
    { theme: 'Мистический', desc: 'Окрас глубокой ночи со светящимися спиралями.', pattern: '#4c1d95', eye: '#ec4899' },
  ];

  for (let i = 0; i < 50; i++) {
    const breedIdx = i % breeds.length;
    const themeIdx = Math.floor(i / 5) % themes.length;
    const breedName = breedsRu[breedIdx];
    const breedId = breeds[breedIdx];
    const th = themes[themeIdx];
    const colorHex = colors[themeIdx % colors.length];
    const rarity = rarities[Math.floor(i / 13) % rarities.length];
    const cost = 250 + (i * 35);

    list.push({
      id: `gen_skin_${breedId.toLowerCase()}_${i}`,
      name: `${th.theme} ${breedName}`,
      description: `${th.desc} Эксклюзивно для любителей породы ${breedId}.`,
      cost,
      breed: breedId,
      color: colorHex,
      patternColor: th.pattern,
      eyeColor: th.eye,
      rarity,
    });
  }

  return list;
};

export const ALL_SKINS_LIST: Skin[] = [...INITIAL_SKINS, ...generateExtraSkins()];

export const CONSUMABLE_ITEMS: { id: string; name: string; emoji: string; description: string; cost: number; type: 'food' | 'soap' | 'toy'; boost: number; xpBoost: number; rarity: 'common' | 'rare' | 'epic' | 'legendary' }[] = [
  { id: 'food_kibble', name: 'Премиум корм', emoji: '🎚️', description: 'Хрустящий сбалансированный сухой корм. Насыщает +20 сытости, дает +10 XP.', cost: 12, type: 'food', boost: 20, xpBoost: 10, rarity: 'common' },
  { id: 'food_treat', name: 'Кремовое лакомство', emoji: '🧁', description: 'Нежное кошачье лакомство в тюбике. Восстанавливает +30 сытости и дает +15 XP.', cost: 18, type: 'food', boost: 30, xpBoost: 15, rarity: 'rare' },
  { id: 'food_tuna', name: 'Филе дикого тунца', emoji: '🐟', description: 'Свежайший стейк из глубоководного тунца. Восстанавливает +45 сытости и дает +25 XP.', cost: 28, type: 'food', boost: 45, xpBoost: 25, rarity: 'epic' },
  { id: 'food_steak', name: 'Сочный стейк Прайм', emoji: '🥩', description: 'Мраморная говядина высочайшего класса для котика. Дает +75 сытости и +45 XP!', cost: 45, type: 'food', boost: 75, xpBoost: 45, rarity: 'legendary' },
  { id: 'soap_lavender', name: 'Лавандовое мыло', emoji: '🧼', description: 'Мягкое мыло с экстрактом лаванды для расслабления. +25 гигиены, +12 XP.', cost: 15, type: 'soap', boost: 25, xpBoost: 12, rarity: 'common' },
  { id: 'soap_minerals', name: 'Мыло с минералами', emoji: '🧴', description: 'Лечебная пенка с минералами Мертвого моря. +50 гигиены, +20 XP.', cost: 25, type: 'soap', boost: 50, xpBoost: 20, rarity: 'rare' },
  { id: 'soap_charcoal', name: 'Угольный эко-шампунь', emoji: '🛁', description: 'Глубокое детокс-очищение шерстки до сияния. +85 гигиены, +35 XP!', cost: 45, type: 'soap', boost: 85, xpBoost: 35, rarity: 'epic' },
  { id: 'toy_wand', name: 'Удочка-дразнилка', emoji: '🪶', description: 'Перо на веревочке для весёлых прыжков. +25 счастья, +15 XP, -8 энергии.', cost: 16, type: 'toy', boost: 25, xpBoost: 15, rarity: 'common' },
  { id: 'toy_laser', name: 'Лазерная указка', emoji: '🔦', description: 'Неуловимая красная лазерная точка. +55 счастья, +30 XP, -15 энергии.', cost: 30, type: 'toy', boost: 55, xpBoost: 30, rarity: 'rare' },
  { id: 'toy_catnip', name: 'Мышка с кошачьей мятой', emoji: '🐭', description: 'Игрушка с органической мятой для безумного счастья. +90 счастья, +50 XP!', cost: 50, type: 'toy', boost: 90, xpBoost: 50, rarity: 'epic' },
];

const INITIAL_QUESTS = (): DailyQuest[] => [
  { id: 'feed_3', text: 'Покормить котиков 3 раза', progress: 0, target: 3, completed: false, claimed: false, rewardPaws: 50, type: 'feed' },
  { id: 'play_2', text: 'Поиграть с котиками 2 раза', progress: 0, target: 2, completed: false, claimed: false, rewardPaws: 60, type: 'play' },
  { id: 'clean_1', text: 'Искупать котика в ванне 1 раз', progress: 0, target: 1, completed: false, claimed: false, rewardPaws: 40, type: 'clean' },
  { id: 'click_20', text: 'Погладить котика кликами 20 раз', progress: 0, target: 20, completed: false, claimed: false, rewardPaws: 35, type: 'click' },
  { id: 'antistress_30', text: 'Лопнуть 30 пузырей в Pop It', progress: 0, target: 30, completed: false, claimed: false, rewardPaws: 45, type: 'antistress' },
];

export const sendNativeNotification = (title: string, body: string) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: 'maccat_alert_' + title.replace(/\s+/g, '_'),
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  }
};

// ==================== ХУК ====================

export const useGameState = () => {
  const [profile, setProfile] = useState<PlayerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedProfile = localStorage.getItem('maccat_profile');
    if (!savedProfile) return null;
    try {
      const parsed: PlayerProfile = JSON.parse(savedProfile);
      
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
        parsed.quests = [
          { id: 'feed_3', text: 'Покормить котиков 3 раза', progress: 0, target: 3, completed: false, claimed: false, rewardPaws: 50, type: 'feed' },
          { id: 'play_2', text: 'Поиграть с котиками 2 раза', progress: 0, target: 2, completed: false, claimed: false, rewardPaws: 60, type: 'play' },
          { id: 'clean_1', text: 'Искупать котика в ванне 1 раз', progress: 0, target: 1, completed: false, claimed: false, rewardPaws: 40, type: 'clean' },
          { id: 'click_20', text: 'Погладить котика кликами 20 раз', progress: 0, target: 20, completed: false, claimed: false, rewardPaws: 35, type: 'click' },
          { id: 'antistress_30', text: 'Лопнуть 30 пузырей в Pop It', progress: 0, target: 30, completed: false, claimed: false, rewardPaws: 45, type: 'antistress' },
        ];
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
        parsed.quests = [
          { id: 'feed_3', text: 'Покормить котиков 3 раза', progress: 0, target: 3, completed: false, claimed: false, rewardPaws: 50, type: 'feed' },
          { id: 'play_2', text: 'Поиграть с котиками 2 раза', progress: 0, target: 2, completed: false, claimed: false, rewardPaws: 60, type: 'play' },
          { id: 'clean_1', text: 'Искупать котика в ванне 1 раз', progress: 0, target: 1, completed: false, claimed: false, rewardPaws: 40, type: 'clean' },
          { id: 'click_20', text: 'Погладить котика кликами 20 раз', progress: 0, target: 20, completed: false, claimed: false, rewardPaws: 35, type: 'click' },
          { id: 'antistress_30', text: 'Лопнуть 30 пузырей в Pop It', progress: 0, target: 30, completed: false, claimed: false, rewardPaws: 45, type: 'antistress' },
        ];
        
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
        const now = Date.now();
        const elapsedSeconds = Math.max(0, (now - parsed.lastSavedTime) / 1000);
        
        if (elapsedSeconds > 45) {
          parsed.cats = calculateOfflineDecay(parsed.cats, elapsedSeconds);
        }
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse initial profile', e);
      return null;
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const {
    notifications,
    addNotification,
    removeNotification,
    sendNativeNotification,
  } = useNotifications();

  const [analytics, setAnalytics] = useState<GameAnalytics>({
    pawsSpent: 0,
    skinsBought: 0,
    levelUps: 0,
    actionsPerformed: { feed: 0, play: 0, clean: 0, sleep: 0 },
    retentionScore: 98,
    sessionDuration: 0,
  });

  const playTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const now = Date.now();
      const updated = { ...profile, lastSavedTime: now };
      localStorage.setItem('maccat_profile', JSON.stringify(updated));
    }
  }, [profile]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateProfile = useCallback((updater: (prev: PlayerProfile) => PlayerProfile) => {
    setProfile((prev) => {
      if (!prev) return null;
      const updated = updater(prev);
      return { ...updated, lastSavedTime: Date.now() };
    });
  }, []);

  const {
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
  } = useSync(profile, setProfile, addNotification, isOnline, isOfflineMode);

  const checkForNewAchievements = useCallback((prev: PlayerProfile): PlayerProfile => {
    if (!prev.unlockedAchievements) prev.unlockedAchievements = [];
    
    const newlyUnlocked: string[] = [...prev.unlockedAchievements];
    let updated = false;
    let newDiaryEntries: DiaryEntry[] = [];

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
    
    const hasLevel5 = prev.cats.some(c => c.level >= 5);
    checkAndUnlock('level_5', '⭐ Славный малый (Кот достиг 5 уровня)', hasLevel5);
    
    checkAndUnlock('pet_50', '💖 Мастер поглаживаний (Погладили котика 50 раз)', (prev.clicksCount || 0) >= 50);
    checkAndUnlock('skin_3', '🕶️ Икона стиля (Разблокировано 3 скина)', prev.unlockedSkins.length >= 3);
    checkAndUnlock('rich_1000', '💰 Миллионер (Накоплено 1000 лапок)', prev.paws >= 1000);
    checkAndUnlock('antistress_100', '🧘 Абсолютный дзен (Лопнуто 100 пупырок Pop It)', (prev.popItBurstedCount || 0) >= 100);

    if (updated) {
      return {
        ...prev,
        unlockedAchievements: newlyUnlocked,
        diary: [...newDiaryEntries, ...(prev.diary || [])]
      };
    }
    return prev;
  }, [addNotification]);

  useEffect(() => {
    const savedProfile = localStorage.getItem('maccat_profile');
    const savedAnalytics = localStorage.getItem('maccat_analytics');

    if (savedProfile) {
      try {
        const parsed: PlayerProfile = JSON.parse(savedProfile);
        
        if (parsed.lastSavedTime) {
          const now = Date.now();
          const elapsedSeconds = Math.max(0, (now - parsed.lastSavedTime) / 1000);
          
          if (elapsedSeconds > 45) {
            const elapsedMins = Math.round(elapsedSeconds / 60);
            
            setTimeout(() => {
              addNotification('С возвращением! 🐾', `Вас не было ${elapsedMins} мин. Показатели котиков обновились.`, 'info');
              
              if (profile && profile.cats) {
                const criticalHungerCats = profile.cats.filter(c => c.hunger < 25).map(c => c.name);
                const criticalCleanCats = profile.cats.filter(c => c.cleanliness < 25).map(c => c.name);
                
                if (criticalHungerCats.length > 0) {
                  sendNativeNotification('Котики хотят кушать! 🐟', `${criticalHungerCats.join(', ')} проголодались за время вашего отсутствия! Покормите их.`);
                }
                if (criticalCleanCats.length > 0) {
                  sendNativeNotification('Котики запачкались! 🧼', `${criticalCleanCats.join(', ')} нуждаются в мытье! Пора искупать котиков.`);
                }
              }
            }, 1000);
          }
        }
      } catch (e) {
        console.error('Error parsing profile for notifications:', e);
      }
    }

    if (savedAnalytics) {
      try {
        setAnalytics(JSON.parse(savedAnalytics));
      } catch (e) {
        console.error('Error loading analytics:', e);
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
        const updated = { ...prev, totalPlayTime: prev.totalPlayTime + 1 };
        localStorage.setItem('maccat_profile', JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => {
      if (playTimeIntervalRef.current) clearInterval(playTimeIntervalRef.current);
    };
  }, [addNotification, profile]);

  const createProfile = useCallback((nickname: string, initialCatName: string, breed: string, skinId: string) => {
    const selectedSkin = INITIAL_SKINS.find((s) => s.id === skinId) || INITIAL_SKINS[0];
    const firstCat: Cat = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      name: initialCatName,
      breed,
      skinId: selectedSkin.id,
      level: 1,
      xp: 0,
      hunger: 80,
      happiness: 80,
      cleanliness: 80,
      energy: 85,
      status: 'idle',
      lastInteraction: Date.now(),
      personality: ['lazy', 'playful', 'hungry'][Math.floor(Math.random() * 3)] as 'lazy' | 'playful' | 'hungry',
    };

    const firstCatAdoptEvent: DiaryEntry = {
      id: 'diary_' + Math.random().toString(36).substring(2, 11),
      catId: firstCat.id,
      timestamp: Date.now(),
      type: 'adopt',
      title: 'Первая встреча 🐾',
      description: `Котёнок по имени ${initialCatName} породы ${breed} был успешно приютен! Начало счастливой истории Care OS.`,
      icon: '🍼'
    };

    const newProfile: PlayerProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36),
      nickname,
      avatar: '🐱',
      paws: 150,
      streak: 1,
      lastActiveDay: new Date().toISOString().split('T')[0],
      theme: 'auto',
      soundEnabled: true,
      cats: [firstCat],
      activeCatId: firstCat.id,
      unlockedSkins: [selectedSkin.id],
      unlockedBreeds: [breed],
      quests: INITIAL_QUESTS(),
      totalPlayTime: 0,
      totalInteractions: 0,
      createdAt: new Date().toISOString(),
      claimedReviewReward: false,
      currentWallpaper: 'ventura',
      unlockedAchievements: [],
      clicksCount: 0,
      popItBurstedCount: 0,
      keyboardClicksCount: 0,
      claimedStreakMilestones: [],
      careCalendarHistory: [new Date().toISOString().split('T')[0]],
      diary: [firstCatAdoptEvent],
      foodCount: 5,
      soapCount: 5,
      inventory: {
        'food_kibble': 5,
        'soap_lavender': 3,
        'toy_wand': 1
      }
    };

    const checkedProfile = checkForNewAchievements(newProfile);
    setProfile(checkedProfile);
    localStorage.setItem('maccat_profile', JSON.stringify(checkedProfile));
    addNotification('Котенок приютен! 🍼', `${initialCatName} присоединился к вашему рабочему столу!`, 'success');
  }, [addNotification, checkForNewAchievements]);

  // ================== ОПТИМИЗИРОВАННЫЙ УПАДОК С УВЕДОМЛЕНИЯМИ ==================
  useEffect(() => {
    if (!profile) return;

    const lastNotificationTimes: Record<string, number> = {};
    let lastReminderTime = 0;

    const decayInterval = setInterval(() => {
      setProfile((prev) => {
        if (!prev) return null;

        const { updatedCats, totalPawsDiff } = calculateDecay(prev.cats, 0.5);

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        updatedCats.forEach((cat) => {
          const lastNotif = lastNotificationTimes[cat.id] || 0;
          if (now - lastNotif < oneHour) return;

          let notifSent = false;
          if (cat.hunger < 25 && cat.status !== 'sleeping') {
            sendNativeNotification('🍽️ Котик голоден!', `${cat.name} хочет кушать. Покормите его!`);
            addNotification('Голодный котик 🍽️', `${cat.name} просит вкусняшку!`, 'warning');
            notifSent = true;
          } else if (cat.cleanliness < 25 && cat.status !== 'sleeping') {
            sendNativeNotification('🧼 Пора купаться!', `${cat.name} запачкался. Искупайте его!`);
            addNotification('Грязнуля 🧼', `${cat.name} нуждается в ванне!`, 'warning');
            notifSent = true;
          } else if (cat.happiness < 25 && cat.status !== 'sleeping') {
            sendNativeNotification('😿 Котик грустит!', `${cat.name} хочет играть. Уделите ему внимание!`);
            addNotification('Грустный котик 😿', `${cat.name} скучает без вас!`, 'warning');
            notifSent = true;
          }

          if (notifSent) {
            lastNotificationTimes[cat.id] = now;
          }
        });

        if (prev.lastSavedTime) {
          const hoursSinceLastSave = (now - prev.lastSavedTime) / (1000 * 60 * 60);
          if (hoursSinceLastSave > 4 && (now - lastReminderTime) > oneHour) {
            const catNames = updatedCats.map(c => c.name).join(', ');
            sendNativeNotification('🐱 Котики скучают!', `${catNames} ждут вашей заботы. Зайдите в игру!`);
            addNotification('Давно не заходили! 🐱', `Ваши котики ${catNames} соскучились!`, 'info');
            lastReminderTime = now;
          }
        }

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

  // ================== ОСТАЛЬНЫЕ ФУНКЦИИ ==================

  const interactWithCat = useCallback((action: 'feed' | 'play' | 'clean' | 'sleep' | 'groom' | string) => {
    if (!profile) return;

    const isConsumable = action.startsWith('food_') || action.startsWith('soap_') || action.startsWith('toy_');
    let itemToUse: typeof CONSUMABLE_ITEMS[0] | undefined;
    let actualActionType: 'feed' | 'play' | 'clean' | 'sleep' | 'groom' = 'feed';
    let targetItemId = '';

    if (isConsumable) {
      itemToUse = CONSUMABLE_ITEMS.find(i => i.id === action);
      if (!itemToUse) return;
      targetItemId = itemToUse.id;
      actualActionType = itemToUse.type === 'food' ? 'feed' : itemToUse.type === 'soap' ? 'clean' : 'play';
      
      const ownedQty = profile.inventory?.[targetItemId] || 0;
      if (ownedQty <= 0) {
        addNotification(
          'Товар закончился! 🛒',
          `У вас нет "${itemToUse.name}". Приобретите его во всплывающем меню ухода или в Магазине.`,
          'warning'
        );
        return;
      }
    } else {
      actualActionType = action as any;
      if (actualActionType === 'feed') {
        addNotification('Выберите лакомство 🍗', 'Используйте всплывающее меню ухода для выбора корма!', 'info');
        return;
      } else if (actualActionType === 'clean') {
        addNotification('Выберите средство 🧼', 'Используйте всплывающее меню ухода для выбора мыла!', 'info');
        return;
      } else if (actualActionType === 'play') {
        addNotification('Выберите игрушку 🎾', 'Используйте всплывающее меню ухода для выбора игрушки!', 'info');
        return;
      }
    }

    updateProfile((prev) => {
      if (!prev) return null;

      const targetCat = prev.cats.find(cat => cat.id === prev.activeCatId);
      if (!targetCat) return prev;

      if (targetCat.status === 'sleeping' && actualActionType !== 'sleep') {
        addNotification('Котик спит 💤', 'Нельзя тревожить котика во сне!', 'warning');
        return prev;
      }

      if (actualActionType === 'feed' && targetCat.hunger >= 100) {
        addNotification('Котик сыт 💤', `${targetCat.name} не хочет кушать прямо сейчас.`, 'info');
        return prev;
      }

      if (actualActionType === 'play' && targetCat.energy < 15) {
        addNotification('Устал 💤', `${targetCat.name} слишком устал, чтобы играть. Отправьте его поспать.`, 'warning');
        return prev;
      }

      if (actualActionType === 'clean' && targetCat.cleanliness >= 100) {
        addNotification('Чистый котик 🧼', `${targetCat.name} уже сверкает чистотой.`, 'info');
        return prev;
      }

      const updatedInventory = { ...(prev.inventory || {}) };
      if (itemToUse) {
        const qty = updatedInventory[targetItemId] || 0;
        if (qty <= 0) return prev;
        updatedInventory[targetItemId] = qty - 1;
      }

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== prev.activeCatId) return cat;

        let { hunger, happiness, cleanliness, energy, status, level, xp } = cat;
        let gainedXp = 0;

        if (actualActionType === 'feed') {
          const boostVal = itemToUse ? itemToUse.boost : 25;
          hunger = Math.min(100, hunger + boostVal);
          gainedXp = itemToUse ? itemToUse.xpBoost : 15;
          status = 'eating';
          addNotification(`Вкусная трапеза ${itemToUse?.emoji || '🐟'}`, `${cat.name} с аппетитом съел "${itemToUse?.name}".`, 'success');
        } else if (actualActionType === 'play') {
          const boostVal = itemToUse ? itemToUse.boost : 30;
          happiness = Math.min(100, happiness + boostVal);
          energy = Math.max(0, energy - (itemToUse ? (itemToUse.id === 'toy_catnip' ? 5 : itemToUse.id === 'toy_laser' ? 15 : 8) : 15));
          gainedXp = itemToUse ? itemToUse.xpBoost : 20;
          status = 'playing';
          addNotification(`Веселые игры ${itemToUse?.emoji || '🎾'}`, `${cat.name} с радостью играет с "${itemToUse?.name}"!`, 'success');
        } else if (actualActionType === 'clean') {
          const boostVal = itemToUse ? itemToUse.boost : 35;
          cleanliness = Math.min(100, cleanliness + boostVal);
          gainedXp = itemToUse ? itemToUse.xpBoost : 18;
          status = 'bathing';
          addNotification(`Теплая ванна ${itemToUse?.emoji || '🧼'}`, `${cat.name} купается с использованием "${itemToUse?.name}".`, 'success');
        } else if (actualActionType === 'groom') {
          cleanliness = Math.min(100, cleanliness + 20);
          happiness = Math.min(100, happiness + 20);
          gainedXp = 25;
          status = 'grooming';
          addNotification('Шелковистая шёрстка ✨', `Вы тщательно вычесали шёрстку ${cat.name}! Получено +12 лапок!`, 'success');
        } else if (actualActionType === 'sleep') {
          if (status === 'sleeping') {
            status = 'idle';
            addNotification('Котик проснулся 🥱', `${cat.name} готов к играм и общению!`, 'info');
          } else {
            status = 'sleeping';
            addNotification('Сонный час 🛌', `${cat.name} свернулся клубочком и заснул. Хрр-миу...`, 'info');
          }
        }

        if (actualActionType !== 'sleep' && status !== 'sleeping') {
          setTimeout(() => {
            updateProfile((p) => {
              if (!p) return null;
              return {
                ...p,
                cats: p.cats.map((c) => (c.id === cat.id && c.status !== 'sleeping' ? { ...c, status: 'idle' } : c)),
              };
            });
          }, 3500);
        }

        xp += gainedXp;
        const neededXp = level * 100;
        if (xp >= neededXp) {
          xp -= neededXp;
          level += 1;
          const currentCatName = cat.name;
          const currentCatId = cat.id;
          const newLevel = level;
          setTimeout(() => {
            addNotification('Новый уровень! 🌟', `${currentCatName} вырос до ${newLevel} уровня! Получено +75 лапок!`, 'success');
            updateProfile((p) => {
              if (!p) return null;
              const newDiaryEntry: DiaryEntry = {
                id: 'diary_' + Math.random().toString(36).substring(2, 11),
                catId: currentCatId,
                timestamp: Date.now(),
                type: 'level_up',
                title: `${currentCatName} достиг ${newLevel} уровня! 🌟`,
                description: `Ваш любимец преодолел очередную планку! Теперь он стал взрослее и сильнее. Получено +75 бонусных лапок.`,
                icon: '🌟'
              };
              return { 
                ...p, 
                paws: p.paws + 75,
                diary: [newDiaryEntry, ...(p.diary || [])]
              };
            });
          }, 400);
        }

        return {
          ...cat,
          hunger,
          happiness,
          cleanliness,
          energy,
          status,
          xp,
          level,
        };
      });

      let actionPaws = 0;
      if (itemToUse) {
        if (itemToUse.rarity === 'common') actionPaws = 2;
        else if (itemToUse.rarity === 'rare') actionPaws = 4;
        else if (itemToUse.rarity === 'epic') actionPaws = 7;
        else if (itemToUse.rarity === 'legendary') actionPaws = 12;
      } else {
        if (actualActionType === 'groom') actionPaws = 12;
      }

      const updatedQuests = prev.quests.map((q) => {
        if (q.completed) return q;
        let progress = q.progress;
        if (q.type === 'feed' && actualActionType === 'feed') progress += 1;
        if (q.type === 'play' && actualActionType === 'play') progress += 1;
        if (q.type === 'clean' && actualActionType === 'clean') progress += 1;
        
        let completed = progress >= q.target;
        if (completed && !q.completed) {
          setTimeout(() => {
            addNotification('Квест выполнен! ✨', `Задание: "${q.text}"`, 'success');
          }, 600);
        }

        return { ...q, progress, completed };
      });

      const questPawsEarned = updatedQuests.map(q => {
        if (q.type === 'earn_paws' && !q.completed) {
          const newProg = Math.min(q.target, q.progress + actionPaws);
          const completed = newProg >= q.target;
          if (completed && !q.completed) {
            setTimeout(() => {
              addNotification('Квест выполнен! ✨', `Задание: "${q.text}"`, 'success');
            }, 800);
          }
          return { ...q, progress: newProg, completed };
        }
        return q;
      });

      setAnalytics((prevAnalytics) => {
        const key = actualActionType === 'feed' ? 'feed' : actualActionType === 'play' ? 'play' : actualActionType === 'clean' ? 'clean' : 'sleep';
        const updatedAct = { ...prevAnalytics.actionsPerformed };
        updatedAct[key] += 1;

        const totalActions = updatedAct.feed + updatedAct.play + updatedAct.clean + updatedAct.sleep;
        const calculatedRetention = Math.min(100, 92 + Math.floor(totalActions / 2));

        const updated = {
          ...prevAnalytics,
          actionsPerformed: updatedAct,
          retentionScore: calculatedRetention,
        };
        localStorage.setItem('maccat_analytics', JSON.stringify(updated));
        return updated;
      });

      const nextProfile = {
        ...prev,
        inventory: updatedInventory,
        cats: updatedCats,
        quests: questPawsEarned,
        paws: prev.paws + actionPaws,
        totalInteractions: prev.totalInteractions + 1,
      };

      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const petCatClick = useCallback(() => {
    if (!profile) return;

    updateProfile((prev) => {
      if (!prev) return null;

      const currentClicks = (prev.clicksCount || 0) + 1;
      let extraPaws = 0;
      
      if (currentClicks % 15 === 0) {
        extraPaws = 1;
        addNotification('Радость котика! 🐾', '+1 лапка за ласку котика!', 'paw');
      }

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== prev.activeCatId) return cat;

        let { xp, level, happiness } = cat;
        xp += 1;
        happiness = Math.min(100, happiness + 0.5);

        const neededXp = level * 100;
        if (xp >= neededXp) {
          xp -= neededXp;
          level += 1;
          const currentCatName = cat.name;
          const currentCatId = cat.id;
          const newLevel = level;
          setTimeout(() => {
            addNotification('Новый уровень! 🌟', `${currentCatName} достиг уровня ${newLevel}! +75 лапок!`, 'success');
            updateProfile((p) => {
              if (!p) return null;
              const newDiaryEntry: DiaryEntry = {
                id: 'diary_' + Math.random().toString(36).substring(2, 11),
                catId: currentCatId,
                timestamp: Date.now(),
                type: 'level_up',
                title: `${currentCatName} достиг ${newLevel} уровня! 🌟`,
                description: `Поздравляем! Поглаживания и ласка помогли вашему котику вырасти до ${newLevel} уровня. Начислено +75 лапок.`,
                icon: '🌟'
              };
              return { 
                ...p, 
                paws: p.paws + 75,
                diary: [newDiaryEntry, ...(p.diary || [])]
              };
            });
          }, 300);
        }

        return { ...cat, xp, level, happiness };
      });

      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'click' && !q.completed) {
          const progress = Math.min(q.target, q.progress + 1);
          const completed = progress >= q.target;
          if (completed) {
            setTimeout(() => {
              addNotification('Квест выполнен! ✨', `Задание: "${q.text}"`, 'success');
            }, 500);
          }
          return { ...q, progress, completed };
        }
        return q;
      });

      const nextProfile = {
        ...prev,
        cats: updatedCats,
        quests: updatedQuests,
        clicksCount: currentClicks,
        paws: prev.paws + extraPaws,
      };

      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const burstPopIt = useCallback(() => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      const count = (prev.popItBurstedCount || 0) + 1;
      
      let bonus = 0;
      if (count % 40 === 0) {
        bonus = 1;
        addNotification('Антистресс релакс 🧘', 'Вы лопнули много пупырок! +1 лапка', 'paw');
      }

      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'antistress' && !q.completed) {
          const progress = Math.min(q.target, q.progress + 1);
          const completed = progress >= q.target;
          if (completed) {
            setTimeout(() => {
              addNotification('Квест выполнен! ✨', `Задание: "${q.text}"`, 'success');
            }, 500);
          }
          return { ...q, progress, completed };
        }
        return q;
      });

      const nextProfile = {
        ...prev,
        popItBurstedCount: count,
        quests: updatedQuests,
        paws: prev.paws + bonus,
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const clickKeyboard = useCallback(() => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      const count = (prev.keyboardClicksCount || 0) + 1;
      
      let bonus = 0;
      if (count % 50 === 0) {
        bonus = 1;
        addNotification('Быстрый набор ⌨️', 'Вы усердно кликаете! +1 лапка', 'paw');
      }

      return {
        ...prev,
        keyboardClicksCount: count,
        paws: prev.paws + bonus,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const claimQuestReward = useCallback((questId: string) => {
    if (!profile) return;

    updateProfile((prev) => {
      if (!prev) return null;
      const quest = prev.quests.find((q) => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;

      const updatedQuests = prev.quests.map((q) =>
        q.id === questId ? { ...q, claimed: true } : q
      );

      addNotification('Награда забрана! 🐾', `Получено +${quest.rewardPaws} лапок!`, 'paw');

      const nextProfile = {
        ...prev,
        quests: updatedQuests,
        paws: prev.paws + quest.rewardPaws,
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const purchaseSkinOrAccessory = useCallback((skinId: string) => {
    if (!profile) return;

    const consumableItem = CONSUMABLE_ITEMS.find((c) => c.id === skinId);
    if (consumableItem) {
      if (profile.paws < consumableItem.cost) {
        addNotification('Мало лапок 🐾', `Вам нужно ${consumableItem.cost} лапок, а у вас ${profile.paws}.`, 'warning');
        return;
      }

      updateProfile((prev) => {
        if (!prev) return null;

        setAnalytics((prevAnalytics) => {
          const updated = {
            ...prevAnalytics,
            pawsSpent: prevAnalytics.pawsSpent + consumableItem.cost,
          };
          localStorage.setItem('maccat_analytics', JSON.stringify(updated));
          return updated;
        });

        addNotification('Покупка успешна! 🛍️', `Куплено "${consumableItem.name}" ${consumableItem.emoji}! Товар добавлен в ваш инвентарь на полку.`, 'success');

        const updatedInventory = { ...(prev.inventory || {}) };
        updatedInventory[skinId] = (updatedInventory[skinId] || 0) + 1;

        const nextProfile = {
          ...prev,
          paws: prev.paws - consumableItem.cost,
          inventory: updatedInventory,
        };
        return checkForNewAchievements(nextProfile);
      });
      return;
    }

    const skinToBuy = ALL_SKINS_LIST.find((s) => s.id === skinId);
    if (!skinToBuy) return;

    if (profile.paws < skinToBuy.cost) {
      addNotification('Мало лапок 🐾', `Вам нужно ${skinToBuy.cost} лапок, а у вас ${profile.paws}.`, 'warning');
      return;
    }

    updateProfile((prev) => {
      if (!prev) return null;
      
      if (prev.unlockedSkins.includes(skinId)) {
        addNotification('Уже разблокировано 🛍️', `Вы уже приобрели ${skinToBuy.name}!`, 'info');
        return prev;
      }

      setAnalytics((prevAnalytics) => {
        const updated = {
          ...prevAnalytics,
          pawsSpent: prevAnalytics.pawsSpent + skinToBuy.cost,
          skinsBought: prevAnalytics.skinsBought + 1,
        };
        localStorage.setItem('maccat_analytics', JSON.stringify(updated));
        return updated;
      });

      addNotification('Успешная покупка! 🛍️', `Вы разблокировали "${skinToBuy.name}"! Теперь его можно надеть в шкафчике.`, 'success');

      const skinEvent: DiaryEntry = {
        id: 'diary_' + Math.random().toString(36).substring(2, 11),
        catId: prev.activeCatId,
        timestamp: Date.now(),
        type: 'skin_unlocked',
        title: `Новинка: ${skinToBuy.name} 🛍️`,
        description: `Приобретен стильный предмет гардероба или редкий окрас "${skinToBuy.name}" за ${skinToBuy.cost} лапок. Котик теперь выглядит восхитительно!`,
        icon: '🛍️'
      };

      const nextProfile = {
        ...prev,
        paws: prev.paws - skinToBuy.cost,
        unlockedSkins: [...prev.unlockedSkins, skinId],
        diary: [skinEvent, ...(prev.diary || [])]
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  // ================== ГЛАВНОЕ ИСПРАВЛЕНИЕ: applySkinOrAccessory с поддержкой слотов ==================
  const applySkinOrAccessory = useCallback((catId: string, skinId: string) => {
    if (!profile) return;

    updateProfile((prev) => {
      if (!prev) return null;

      const selectedSkin = ALL_SKINS_LIST.find((s) => s.id === skinId);
      if (!selectedSkin) return prev;

      const isAccessory = !!selectedSkin.accessory;

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== catId) return cat;

        if (isAccessory) {
          let slot: keyof Pick<Cat, 'hat' | 'glasses' | 'collar' | 'scarf' | 'boots' | 'wings'> | null = 
            selectedSkin.slot || null;

          if (!slot) {
            const accLower = selectedSkin.accessory!.toLowerCase();
            if (accLower.includes('hat') || accLower.includes('halo') || accLower.includes('crown') || accLower.includes('cap') || accLower.includes('shlyapa') || accLower.includes('kolpak')) {
              slot = 'hat';
            } else if (accLower.includes('glasses') || accLower.includes('eyewear') || accLower.includes('headphones') || accLower.includes('ochki') || accLower.includes('naushniki')) {
              slot = 'glasses';
            } else if (accLower.includes('collar') || accLower.includes('bell') || accLower.includes('ribbon') || accLower.includes('bow') || accLower.includes('osheynik') || accLower.includes('bantik')) {
              slot = 'collar';
            } else if (accLower.includes('scarf') || accLower.includes('sharf')) {
              slot = 'scarf';
            } else if (accLower.includes('boots') || accLower.includes('footwear') || accLower.includes('shoes') || accLower.includes('tapochki') || accLower.includes('sapozhki')) {
              slot = 'boots';
            } else if (accLower.includes('wings') || accLower.includes('krylya')) {
              slot = 'wings';
            }
          }

          if (!slot) {
            // fallback – используем старое поле accessory
            const alreadyHasAcc = cat.accessory === selectedSkin.accessory;
            const currentAcc = alreadyHasAcc ? undefined : selectedSkin.accessory;
            if (alreadyHasAcc) {
              addNotification('Аксессуар снят 🎀', `Снят ${selectedSkin.name} с ${cat.name}`, 'info');
            } else {
              addNotification('Аксессуар надет 🎀', `Надет ${selectedSkin.name} на ${cat.name}`, 'success');
            }
            return {
              ...cat,
              accessory: currentAcc,
            };
          }

          const currentSlotValue = cat[slot] as string | undefined;
          if (currentSlotValue === selectedSkin.accessory) {
            addNotification('Аксессуар снят 🎀', `Снят ${selectedSkin.name} с ${cat.name}`, 'info');
            return {
              ...cat,
              [slot]: undefined,
            };
          } else {
            addNotification('Аксессуар надет 🎀', `Надет ${selectedSkin.name} на ${cat.name}`, 'success');
            return {
              ...cat,
              [slot]: selectedSkin.accessory,
            };
          }
        } else {
          addNotification('Новый образ! ✨', `Изменили породу/цвет ${cat.name} на "${selectedSkin.name}"!`, 'success');
          return {
            ...cat,
            skinId,
            breed: selectedSkin.breed,
          };
        }
      });

      return {
        ...prev,
        cats: updatedCats,
      };
    });
  }, [profile, addNotification, updateProfile]);

  // ================== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ==================
  const adoptNewCat = useCallback((catName: string, breed: string, skinId: string) => {
    if (!profile) return;

    const cost = 200;
    if (profile.paws < cost) {
      addNotification('Недостаточно лапок 🐾', `Новое усыновление стоит ${cost} лапок. Копите лапки заботой!`, 'warning');
      return;
    }

    const selectedSkin = INITIAL_SKINS.find((s) => s.id === skinId) || INITIAL_SKINS[0];
    const newCat: Cat = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      name: catName,
      breed,
      skinId: selectedSkin.id,
      level: 1,
      xp: 0,
      hunger: 85,
      happiness: 85,
      cleanliness: 85,
      energy: 90,
      status: 'idle',
      lastInteraction: Date.now(),
      personality: ['lazy', 'playful', 'hungry'][Math.floor(Math.random() * 3)] as 'lazy' | 'playful' | 'hungry',
    };

    const adoptEvent: DiaryEntry = {
      id: 'diary_' + Math.random().toString(36).substring(2, 11),
      catId: newCat.id,
      timestamp: Date.now(),
      type: 'adopt',
      title: 'Усыновление котика! 🍼',
      description: `Прекрасный пушистый малыш по имени ${catName} породы ${breed} обрёл тёплый дом на вашем рабочем столе. Заботьтесь о нём!`,
      icon: '🍼'
    };

    updateProfile((prev) => {
      if (!prev) return null;
      addNotification('Регистрация питомца! 🍼', `Котенок ${catName} официально стал частью семьи!`, 'success');
      
      const nextProfile = {
        ...prev,
        paws: prev.paws - cost,
        cats: [...prev.cats, newCat],
        activeCatId: newCat.id,
        diary: [adoptEvent, ...(prev.diary || [])]
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const selectActiveCat = useCallback((catId: string) => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      const cat = prev.cats.find((c) => c.id === catId);
      if (cat) {
        addNotification('Смена фокуса 🐱', `Вы заботитесь о котике ${cat.name}.`, 'info');
      }
      return {
        ...prev,
        activeCatId: catId,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const addPaws = useCallback((amount: number, isDonation: boolean = false) => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      
      if (isDonation) {
        addNotification('Донат успешно получен! 💎', `Зачислено +${amount} лапок! Спасибо за поддержку игры!`, 'success');
      } else {
        addNotification('Баланс пополнен! 🐾', `Получено +${amount} лапок!`, 'paw');
      }

      const nextProfile = {
        ...prev,
        paws: prev.paws + amount,
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const claimReviewReward = useCallback(() => {
    if (!profile) return;
    if (profile.claimedReviewReward) {
      addNotification('Награда получена', 'Вы уже забирали бонус за отзыв!', 'warning');
      return;
    }

    updateProfile((prev) => {
      if (!prev) return null;
      addNotification('Бонус за отзыв! ⭐', 'Благодарим вас! Начислено +100 лапок!', 'success');
      
      const nextProfile = {
        ...prev,
        claimedReviewReward: true,
        paws: prev.paws + 100,
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const updateWallpaper = useCallback((wallpaperId: string) => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      addNotification('Обои изменены 🖼️', 'Рабочий стол macOS успешно обновился.', 'info');
      return {
        ...prev,
        currentWallpaper: wallpaperId,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const redeemPromoCode = useCallback((code: string): { success: boolean; message: string } => {
    if (!profile) return { success: false, message: 'Профиль еще не загружен.' };

    const cleanCode = code.trim().toUpperCase();
    
    const lastRedeemed = profile.lastPromoRedeemedTime || 0;
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    const timeElapsed = Date.now() - lastRedeemed;
    
    if (timeElapsed < cooldown) {
      const remainingMs = cooldown - timeElapsed;
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      return { 
        success: false, 
        message: `⚠️ Ограничение: один промокод в неделю. Пожалуйста, подождите еще ${remainingDays} дн.` 
      };
    }

    const redeemedList = profile.redeemedPromos || [];
    if (redeemedList.includes(cleanCode)) {
      return { success: false, message: 'Данный промокод уже активирован на этом аккаунте!' };
    }

    let awardPaws = 0;
    let description = '';

    if (cleanCode === 'ILOVEAMINA') {
      awardPaws = 500;
      description = 'Успешная активация. Начислено +500 лапок.';
    } else if (cleanCode === 'MAKSMINIMALISM') {
      awardPaws = 300;
      description = 'Успешная активация. Начислено +300 лапок.';
    } else if (cleanCode === 'MAKSPAY') {
      awardPaws = 250;
      description = 'Успешная активация. Начислено +250 лапок.';
    } else {
      return { success: false, message: 'Неверный или устаревший промокод' };
    }

    updateProfile((prev) => {
      if (!prev) return null;
      const updatedPromos = Array.from(new Set([...(prev.redeemedPromos || []), cleanCode]));
      const nextProfile = {
        ...prev,
        paws: prev.paws + awardPaws,
        redeemedPromos: updatedPromos,
        lastPromoRedeemedTime: Date.now(),
      };
      addNotification('Промокод активирован! 🎉', description, 'success');
      return checkForNewAchievements(nextProfile);
    });

    return { success: true, message: `Успешно начислено +${awardPaws} лапок!` };
  }, [profile, addNotification, checkForNewAchievements, updateProfile]);

  const handleResolveConflict = useCallback((resolution: 'merge' | 'keep_local' | 'keep_cloud') => {
    const choiceMap: Record<string, 'local' | 'cloud' | 'merge'> = {
      keep_local: 'local',
      keep_cloud: 'cloud',
      merge: 'merge',
    };
    resolveConflict(choiceMap[resolution] || 'merge');
  }, [resolveConflict]);

  const claimStreakMilestone = useCallback((milestoneId: string) => {
    if (!profile) return;
    
    updateProfile((prev) => {
      if (!prev) return null;
      
      const claimed = prev.claimedStreakMilestones || [];
      if (claimed.includes(milestoneId)) return prev;
      
      let rewardText = '';
      let updatedPaws = prev.paws;
      const updatedSkins = [...prev.unlockedSkins];
      
      if (milestoneId === '3') {
        updatedPaws += 50;
        rewardText = 'Получено +50 лапок 🐾!';
      } else if (milestoneId === '7') {
        updatedPaws += 150;
        rewardText = 'Получено +150 лапок 🐾!';
      } else if (milestoneId === '15') {
        if (!updatedSkins.includes('bengal_leopard')) {
          updatedSkins.push('bengal_leopard');
        }
        rewardText = 'Разблокирована эксклюзивная порода Дикий Бенгал 🐆!';
      } else if (milestoneId === '30') {
        if (!updatedSkins.includes('gold_crown')) {
          updatedSkins.push('gold_crown');
        }
        rewardText = 'Получена Золотая Императорская Корона 👑!';
      }
      
      addNotification('Награда за серию дней! 🔥', rewardText, 'success');
      
      const newEntry: DiaryEntry = {
        id: 'diary_' + Math.random().toString(36).substring(2, 11),
        catId: prev.activeCatId,
        timestamp: Date.now(),
        type: 'achievement',
        title: `Награда за ${milestoneId} дней заботы! 🔥`,
        description: `Вы проявили настоящую заботу и получили заслуженную награду: ${rewardText}`,
        icon: '🔥'
      };

      const next = {
        ...prev,
        paws: updatedPaws,
        unlockedSkins: updatedSkins,
        claimedStreakMilestones: [...claimed, milestoneId],
        diary: [newEntry, ...(prev.diary || [])]
      };

      return next;
    });
  }, [profile, addNotification, updateProfile]);

  const updateNickname = useCallback((name: string) => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      addNotification('Настройки изменены ⚙️', `Ваше имя изменено на ${name}.`, 'info');
      return {
        ...prev,
        nickname: name,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const updateThemePref = useCallback((theme: 'light' | 'dark' | 'auto') => {
    if (!profile) return;
    updateProfile((prev) => {
      if (!prev) return null;
      addNotification('Оформление 🌗', `Тема переключена в режим: ${theme === 'dark' ? 'Темная' : theme === 'light' ? 'Светлая' : 'Автоматически'}.`, 'info');
      return {
        ...prev,
        theme,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const addDiaryEntry = useCallback((type: 'adopt' | 'level_up' | 'skin_unlocked' | 'rare_catch' | 'achievement', title: string, description: string, icon: string) => {
    updateProfile((prev) => {
      if (!prev) return null;
      const newEntry: DiaryEntry = {
        id: 'diary_' + Math.random().toString(36).substring(2, 11),
        catId: prev.activeCatId,
        timestamp: Date.now(),
        type,
        title,
        description,
        icon,
      };
      return {
        ...prev,
        diary: [newEntry, ...(prev.diary || [])]
      };
    });
  }, [updateProfile]);

  return {
    profile,
    notifications,
    isOnline,
    syncing,
    analytics,
    allSkins: ALL_SKINS_LIST,
    isOfflineMode,
    setIsOfflineMode,
    syncLog,
    lastSyncedTime,
    showConflictModal,
    setShowConflictModal,
    conflictCloudData,
    conflictLocalData,
    resolveConflict: handleResolveConflict,
    simulateConflictDeviceSwitch,
    redeemPromoCode,
    createProfile,
    interactWithCat,
    claimQuestReward,
    purchaseSkinOrAccessory,
    applySkinOrAccessory,
    adoptNewCat,
    selectActiveCat,
    addPaws,
    claimReviewReward,
    claimStreakMilestone,
    updateWallpaper,
    petCatClick,
    burstPopIt,
    clickKeyboard,
    triggerCloudSync,
    updateNickname,
    updateThemePref,
    removeNotification,
    addDiaryEntry,
    updateProfile,
  };
};