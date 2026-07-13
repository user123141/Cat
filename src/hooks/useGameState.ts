import { useState, useEffect, useCallback, useRef } from 'react';
import { Cat, PlayerProfile, DailyQuest, Skin, NotificationItem, GameAnalytics, DiaryEntry } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseLogger } from '../utils/FirebaseLogger';

export const INITIAL_SKINS: Skin[] = [
  // Породы котиков
  { id: 'scottish_pink', name: 'Скоттиш Персик', description: 'Милейшая нежная шубка нежно-розового оттенка.', cost: 0, breed: 'Scottish Fold', color: '#ffccd5', patternColor: '#ff85a1', eyeColor: '#0ea5e9', rarity: 'common' },
  { id: 'british_blue', name: 'Голубой Британец', description: 'Густой бархатный серо-голубой велюровый покров.', cost: 240, breed: 'British Shorthair', color: '#64748b', patternColor: '#475569', eyeColor: '#f59e0b', rarity: 'common' },
  { id: 'siamese_point', name: 'Королевский Сиам', description: 'Изящный песочный окрас с благородной шоколадной маской.', cost: 380, breed: 'Siamese', color: '#fef3c7', patternColor: '#78350f', eyeColor: '#06b6d4', rarity: 'rare' },
  { id: 'sphynx_naked', name: 'Розовый Сфинкс', description: 'Элегантная бархатная кожа, полностью лишенная шерсти.', cost: 650, breed: 'Sphynx', color: '#fda4af', patternColor: '#f43f5e', eyeColor: '#10b981', rarity: 'epic' },
  { id: 'persian_gold', name: 'Золотистый Перс', description: 'Невероятно пушистый королевский мех цвета солнца.', cost: 800, breed: 'Persian', color: '#fef08a', patternColor: '#eab308', eyeColor: '#a855f7', rarity: 'epic' },
  { id: 'bombay_black', name: 'Бомбейская Пантера', description: 'Идеально гладкий, угольно-черный мех, переливающийся на солнце.', cost: 700, breed: 'Bombay', color: '#1e293b', patternColor: '#0f172a', eyeColor: '#f59e0b', rarity: 'rare' },
  { id: 'bengal_leopard', name: 'Дикий Бенгал', description: 'Экзотические леопардовые пятна и дикий гордый взгляд.', cost: 1200, breed: 'Bengal', color: '#f59e0b', patternColor: '#78350f', eyeColor: '#10b981', rarity: 'epic' },
  { id: 'sakura_dream', name: 'Лепесток Сакуры', description: 'Волшебная бело-розовая шубка с узором цветущей вишни.', cost: 1800, breed: 'Sakura Neko', color: '#fff1f2', patternColor: '#fda4af', eyeColor: '#ec4899', rarity: 'legendary' },
  { id: 'galaxy_cat', name: 'Космическая Небула', description: 'Звездный космический мех, сияющий всеми цветами галактики.', cost: 2900, breed: 'Galaxy Cat', color: '#312e81', patternColor: '#6366f1', eyeColor: '#a855f7', rarity: 'legendary' },
  
  // Аксессуары
  { id: 'collar_bell', name: 'Ошейник с Бубенчиком', description: 'Традиционный красный ремешок с сияющим золотым колокольчиком.', cost: 120, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'collar_bell', rarity: 'common' },
  { id: 'cool_glasses', name: 'Кибер Очки', description: 'Стильные темные очки для самых уверенных в себе котиков.', cost: 320, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'cool_glasses', rarity: 'rare' },
  { id: 'bow_tie', name: 'Джентльменская Бабочка', description: 'Красная шелковая бабочка для праздничных и элегантных моментов.', cost: 280, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'bow_tie', rarity: 'rare' },
  { id: 'gold_crown', name: 'Императорская Корона', description: 'Корона из чистейшего золота для истинного правителя вашей комнаты.', cost: 1400, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'gold_crown', rarity: 'legendary' },
  { id: 'wizard_hat', name: 'Колпак Волшебника', description: 'Синяя шляпа со звездами, наделяющая кота магией мурчания.', cost: 1800, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'wizard_hat', rarity: 'legendary' },
  { id: 'santa_hat', name: 'Новогодний Колпак', description: 'Уютная зимняя шапочка с пушистым белым помпоном.', cost: 240, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'santa_hat', rarity: 'common' },
  { id: 'detective_hat', name: 'Шерлок Кот', description: 'Клетчатая шляпа для любителей раскрывать тайны пропавших вкусняшек.', cost: 450, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'detective_hat', rarity: 'epic' },
  { id: 'party_hat', name: 'Праздничный Колпак', description: 'Смешной яркий колпачок для весёлых дней рождений.', cost: 110, breed: 'All', color: '', patternColor: '', eyeColor: '', accessory: 'party_hat', rarity: 'common' },
];

// Процедурно сгенерированные 100+ эксклюзивных предметов для магазина Care OS
const generateExtraSkins = (): Skin[] => {
  const list: Skin[] = [];
  const rarities: ('common' | 'rare' | 'epic' | 'legendary')[] = ['common', 'rare', 'epic', 'legendary'];
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#a855f7'];
  const colorsRu = ['Розовый', 'Синий', 'Зеленый', 'Янтарный', 'Аметистовый', 'Малиновый', 'Бирюзовый', 'Изумрудный', 'Оранжевый', 'Фиолетовый'];
  const accessories = [
    { key: 'glasses', name: 'Очки "Стиляга"', desc: 'Премиальные темные очки для защиты глаз от солнца.', icon: '🕶️' },
    { key: 'scarf', name: 'Теплый Шарф', desc: 'Уютный вязаный шарфик ручной работы.', icon: '🧣' },
    { key: 'ribbon', name: 'Шелковый Бантик', desc: 'Крутой праздничный бантик на шею питомца.', icon: '🎀' },
    { key: 'headphones', name: 'Геймерские Наушники', desc: 'Наушники со светящимися кошачьи ушками.', icon: '🎧' },
    { key: 'boots', name: 'Милые Тапочки', desc: 'Мягкие теплые сапожки на лапки.', icon: '🥾' },
    { key: 'halo', name: 'Нимб Ангелочка', desc: 'Светящийся парящий нимб для самых послушных.', icon: '😇' },
    { key: 'wings', name: 'Крылья Бабочки', desc: 'Миниатюрные крылышки для легкой левитации.', icon: '🦋' },
    { key: 'hat', name: 'Цилиндр Фокусника', desc: 'Шикарная высокая шляпа истинного джентльмена.', icon: '🎩' },
    { key: 'bell', name: 'Колокольчик', desc: 'Милый золотой звоночек, чтобы кот не потерялся.', icon: '🔔' },
    { key: 'star', name: 'Звездная Заколка', desc: 'Сверкающая заколка для ушка.', icon: '⭐' },
  ];

  // 1. Создаем 50 уникальных брендовых аксессуаров
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
      rarity,
    });
  }

  // 2. Создаем 50 уникальных дизайнерских окрасов для разных пород
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
  // Еда (Голод)
  { id: 'food_kibble', name: 'Премиум корм', emoji: '🎚️', description: 'Хрустящий сбалансированный сухой корм. Насыщает +20 сытости, дает +10 XP.', cost: 12, type: 'food', boost: 20, xpBoost: 10, rarity: 'common' },
  { id: 'food_treat', name: 'Кремовое лакомство', emoji: '🧁', description: 'Нежное кошачье лакомство в тюбике. Восстанавливает +30 сытости и дает +15 XP.', cost: 18, type: 'food', boost: 30, xpBoost: 15, rarity: 'rare' },
  { id: 'food_tuna', name: 'Филе дикого тунца', emoji: '🐟', description: 'Свежайший стейк из глубоководного тунца. Восстанавливает +45 сытости и дает +25 XP.', cost: 28, type: 'food', boost: 45, xpBoost: 25, rarity: 'epic' },
  { id: 'food_steak', name: 'Сочный стейк Прайм', emoji: '🥩', description: 'Мраморная говядина высочайшего класса для котика. Дает +75 сытости и +45 XP!', cost: 45, type: 'food', boost: 75, xpBoost: 45, rarity: 'legendary' },

  // Гигиена (Мыло)
  { id: 'soap_lavender', name: 'Лавандовое мыло', emoji: '🧼', description: 'Мягкое мыло с экстрактом лаванды для расслабления. +25 гигиены, +12 XP.', cost: 15, type: 'soap', boost: 25, xpBoost: 12, rarity: 'common' },
  { id: 'soap_minerals', name: 'Мыло с минералами', emoji: '🧴', description: 'Лечебная пенка с минералами Мертвого моря. +50 гигиены, +20 XP.', cost: 25, type: 'soap', boost: 50, xpBoost: 20, rarity: 'rare' },
  { id: 'soap_charcoal', name: 'Угольный эко-шампунь', emoji: '🛁', description: 'Глубокое детокс-очищение шерстки до сияния. +85 гигиены, +35 XP!', cost: 45, type: 'soap', boost: 85, xpBoost: 35, rarity: 'epic' },

  // Радость (Игрушки)
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

export const useGameState = () => {
  const [profile, setProfile] = useState<PlayerProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedProfile = localStorage.getItem('maccat_profile');
    if (!savedProfile) return null;
    try {
      const parsed: PlayerProfile = JSON.parse(savedProfile);
      
      // Миграция и заполнение недостающих новых полей
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

      // Сброс квестов при новом дне
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
        parsed.paws += 30; // Ежедневный бонус
      }

      if (!parsed.inventory) {
        parsed.inventory = {
          'food_kibble': 3,
          'soap_lavender': 2,
          'toy_wand': 1
        };
      }

      // --- РАСЧЕТ ОФФЛАЙН УПАДКА ПОКАЗАТЕЛЕЙ (DECAY) ---
      if (parsed.lastSavedTime) {
        const now = Date.now();
        const elapsedSeconds = Math.max(0, (now - parsed.lastSavedTime) / 1000);
        
        if (elapsedSeconds > 45) {
          const hours = elapsedSeconds / 3600;
          parsed.cats = parsed.cats.map(cat => {
            let { hunger, cleanliness, happiness, energy, status } = cat;
            
            if (status === 'sleeping') {
              const sleepHoursToFull = Math.max(0, (100 - energy) / 25);
              if (hours >= sleepHoursToFull) {
                energy = 100;
                status = 'idle';
                const idleHours = hours - sleepHoursToFull;
                hunger = Math.max(0, hunger - (8 * hours));
                cleanliness = Math.max(0, cleanliness - (5 * hours));
                energy = Math.max(0, energy - (6 * idleHours));
                
                const hungerPenalty = hunger < 30 ? 4 : 0;
                const cleanPenalty = cleanliness < 30 ? 4 : 0;
                happiness = Math.max(0, happiness - (6 * hours) - ((hungerPenalty + cleanPenalty) * idleHours));
              } else {
                energy = Math.min(100, energy + (25 * hours));
                hunger = Math.max(0, hunger - (8 * hours));
                cleanliness = Math.max(0, cleanliness - (5 * hours));
                happiness = Math.max(0, happiness - (3 * hours));
              }
            } else {
              hunger = Math.max(0, hunger - (8 * hours));
              cleanliness = Math.max(0, cleanliness - (5 * hours));
              energy = Math.max(0, energy - (6 * hours));
              
              const hungerPenalty = hunger < 30 ? 4 : 0;
              const cleanPenalty = cleanliness < 30 ? 4 : 0;
              happiness = Math.max(0, happiness - ((6 + hungerPenalty + cleanPenalty) * hours));
            }
            
            return {
              ...cat,
              hunger: Math.round(hunger * 10) / 10,
              cleanliness: Math.round(cleanliness * 10) / 10,
              happiness: Math.round(happiness * 10) / 10,
              energy: Math.round(energy * 10) / 10,
              status
            };
          });
        }
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse initial profile', e);
      return null;
    }
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncing, setSyncing] = useState<boolean>(false);
  
  // Sync Simulation States
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [syncLog, setSyncLog] = useState<string[]>(['[Система] Лог синхронизации активирован. Ожидание сеанса.']);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Не синхронизировано');
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [conflictCloudData, setConflictCloudData] = useState<PlayerProfile | null>(null);
  const [conflictLocalData, setConflictLocalData] = useState<PlayerProfile | null>(null);

  const [analytics, setAnalytics] = useState<GameAnalytics>({
    pawsSpent: 0,
    skinsBought: 0,
    levelUps: 0,
    actionsPerformed: { feed: 0, play: 0, clean: 0, sleep: 0 },
    retentionScore: 98,
    sessionDuration: 0,
  });

  const playTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger Notifications inside App (Dynamic Island style)
  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'paw') => {
    const newNotif: NotificationItem = {
      id: Math.random().toString(),
      title,
      message,
      type,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Достижения автоматическая проверка
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

  // Initialize and load state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedProfile = localStorage.getItem('maccat_profile');
    const savedAnalytics = localStorage.getItem('maccat_analytics');

    if (savedProfile) {
      try {
        const parsed: PlayerProfile = JSON.parse(savedProfile);
        
        // Показываем уведомления об упадке за время отсутствия
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

    // Отслеживание времени сессии
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
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (playTimeIntervalRef.current) clearInterval(playTimeIntervalRef.current);
    };
  }, [addNotification, profile]);

  // Синхронизация в localStorage
  useEffect(() => {
    if (profile) {
      localStorage.setItem('maccat_profile', JSON.stringify(profile));
    }
  }, [profile]);

  // Создание профиля
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
      nickname,
      avatar: '🐱',
      paws: 150, // Стартовые лапки
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
    addNotification('Котенок приютен! 🍼', `${initialCatName} присоединился к вашему рабочему столу!`, 'success');
  }, [addNotification, checkForNewAchievements]);

  // Пассивный упадок характеристик кота
  useEffect(() => {
    if (!profile) return;

    const decayInterval = setInterval(() => {
      setProfile((prev) => {
        if (!prev) return null;

        let totalPawsDiff = 0;
        const updatedCats = prev.cats.map((cat) => {
          let { hunger, happiness, cleanliness, energy, status } = cat;

          if (status === 'sleeping') {
            energy = Math.min(100, energy + 7);
            hunger = Math.max(0, hunger - 0.7);
            if (energy < 100 && Math.random() < 0.3) {
              totalPawsDiff += 1;
            }
            if (energy >= 100) {
              status = 'idle';
            }
          } else {
            hunger = Math.max(0, hunger - 1.2);
            cleanliness = Math.max(0, cleanliness - 0.8);
            energy = Math.max(0, energy - 1.0);

            const penalty = (hunger < 30 ? 1 : 0) + (cleanliness < 30 ? 1 : 0) + (energy < 20 ? 1 : 0);
            happiness = Math.max(0, happiness - (0.6 + penalty));
          }

          return {
            ...cat,
            hunger: Math.round(hunger * 10) / 10,
            happiness: Math.round(happiness * 10) / 10,
            cleanliness: Math.round(cleanliness * 10) / 10,
            energy: Math.round(energy * 10) / 10,
            status,
          };
        });

        const activeCat = updatedCats.find((c) => c.id === prev.activeCatId);
        if (activeCat) {
          if (activeCat.hunger < 25 && Math.random() < 0.1) {
            addNotification('Котик проголодался! 🐟', `${activeCat.name} хочет кушать вкусную рыбку.`, 'warning');
            sendNativeNotification('Котик проголодался! 🐟', `${activeCat.name} хочет кушать вкусный корм. Не забудьте покормить его!`);
          }
          if (activeCat.cleanliness < 25 && Math.random() < 0.1) {
            addNotification('Грязная шёрстка 🧼', `${activeCat.name} нуждается в теплой ванне!`, 'warning');
            sendNativeNotification('Грязная шёрстка 🧼', `${activeCat.name} хочет искупаться. Время принять теплую ванну!`);
          }
          if (activeCat.happiness < 25 && Math.random() < 0.1) {
            addNotification('Котик грустит 🧸', `${activeCat.name} хочет поиграть с вами!`, 'warning');
            sendNativeNotification('Котику скучно! 🧸', `${activeCat.name} соскучился без внимания. Поиграйте с ним!`);
          }
        }

        const nextProfile = {
          ...prev,
          cats: updatedCats,
          paws: prev.paws + totalPawsDiff,
        };

        return checkForNewAchievements(nextProfile);
      });
    }, 10000); // Раз в 10 секунд

    return () => clearInterval(decayInterval);
  }, [profile, addNotification, checkForNewAchievements]);

  // Взаимодействие с активным котиком (Покормить, поиграть, искупать, уложить спать)
  const interactWithCat = useCallback((action: 'feed' | 'play' | 'clean' | 'sleep' | 'groom' | string) => {
    if (!profile) return;

    // Определяем, используется ли конкретный расходник
    const isConsumable = action.startsWith('food_') || action.startsWith('soap_') || action.startsWith('toy_');
    let itemToUse: typeof CONSUMABLE_ITEMS[0] | undefined;
    let actualActionType: 'feed' | 'play' | 'clean' | 'sleep' | 'groom' = 'feed';
    let targetItemId = '';

    if (isConsumable) {
      itemToUse = CONSUMABLE_ITEMS.find(i => i.id === action);
      if (!itemToUse) return;
      targetItemId = itemToUse.id;
      actualActionType = itemToUse.type === 'food' ? 'feed' : itemToUse.type === 'soap' ? 'clean' : 'play';
    } else {
      // Это общее действие. Попробуем найти доступный предмет этого типа в инвентаре
      actualActionType = action as any;
      if (actualActionType === 'feed') {
        const availableFood = ['food_kibble', 'food_treat', 'food_tuna', 'food_steak'].find(id => (profile.inventory?.[id] || 0) > 0);
        if (!availableFood) {
          addNotification('Еда закончилась! 🐟', 'У вас нет еды в инвентаре. Купите вкусняшки на Кухне или в Магазине!', 'warning');
          return;
        }
        targetItemId = availableFood;
        itemToUse = CONSUMABLE_ITEMS.find(i => i.id === targetItemId);
      } else if (actualActionType === 'clean') {
        const availableSoap = ['soap_lavender', 'soap_minerals', 'soap_charcoal'].find(id => (profile.inventory?.[id] || 0) > 0);
        if (!availableSoap) {
          addNotification('Мыло закончилось! 🧼', 'У вас нет мыла в инвентаре. Купите его в Магазине!', 'warning');
          return;
        }
        targetItemId = availableSoap;
        itemToUse = CONSUMABLE_ITEMS.find(i => i.id === targetItemId);
      } else if (actualActionType === 'play') {
        const availableToy = ['toy_wand', 'toy_laser', 'toy_catnip'].find(id => (profile.inventory?.[id] || 0) > 0);
        if (!availableToy) {
          addNotification('Игрушки закончились! 🎾', 'У вас нет игрушек в инвентаре. Купите новую игрушку в Магазине!', 'warning');
          return;
        }
        targetItemId = availableToy;
        itemToUse = CONSUMABLE_ITEMS.find(i => i.id === targetItemId);
      }
    }

    // Проверяем наличие предмета, если используется расходник
    if (itemToUse) {
      const qty = profile.inventory?.[targetItemId] || 0;
      if (qty <= 0) {
        addNotification('Товар закончился! 🛒', `У вас нет "${itemToUse.name}". Приобретите его в Магазине.`, 'warning');
        return;
      }
    }

    setProfile((prev) => {
      if (!prev) return null;

      // Клонируем инвентарь для изменения
      const updatedInventory = { ...(prev.inventory || {}) };
      if (itemToUse) {
        updatedInventory[targetItemId] = Math.max(0, (updatedInventory[targetItemId] || 0) - 1);
      }

      let isActionAborted = false;

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== prev.activeCatId) return cat;

        let { hunger, happiness, cleanliness, energy, status, level, xp } = cat;
        let gainedXp = 0;

        if (status === 'sleeping' && actualActionType !== 'sleep') {
          isActionAborted = true;
          return cat;
        }

        if (actualActionType === 'feed') {
          if (hunger >= 100) {
            isActionAborted = true;
            addNotification('Котик сыт 💤', `${cat.name} не хочет кушать прямо сейчас.`, 'info');
            return cat;
          }
          const boostVal = itemToUse ? itemToUse.boost : 25;
          hunger = Math.min(100, hunger + boostVal);
          gainedXp = itemToUse ? itemToUse.xpBoost : 15;
          status = 'eating';
          addNotification(`Вкусная трапеза ${itemToUse?.emoji || '🐟'}`, `${cat.name} с аппетитом съел "${itemToUse?.name || 'Лосось'}".`, 'success');
        } else if (actualActionType === 'play') {
          if (energy < 15) {
            isActionAborted = true;
            addNotification('Устал 💤', `${cat.name} слишком устал, чтобы играть. Отправьте его поспать.`, 'warning');
            return cat;
          }
          const boostVal = itemToUse ? itemToUse.boost : 30;
          happiness = Math.min(100, happiness + boostVal);
          energy = Math.max(0, energy - (itemToUse ? (itemToUse.id === 'toy_catnip' ? 5 : itemToUse.id === 'toy_laser' ? 15 : 8) : 15));
          gainedXp = itemToUse ? itemToUse.xpBoost : 20;
          status = 'playing';
          addNotification(`Веселые игры ${itemToUse?.emoji || '🎾'}`, `${cat.name} с радостью играет с "${itemToUse?.name || 'Игрушка'}"!`, 'success');
        } else if (actualActionType === 'clean') {
          if (cleanliness >= 100) {
            isActionAborted = true;
            addNotification('Чистый котик 🧼', `${cat.name} уже сверкает чистотой.`, 'info');
            return cat;
          }
          const boostVal = itemToUse ? itemToUse.boost : 35;
          cleanliness = Math.min(100, cleanliness + boostVal);
          gainedXp = itemToUse ? itemToUse.xpBoost : 18;
          status = 'bathing';
          addNotification(`Теплая ванна ${itemToUse?.emoji || '🧼'}`, `${cat.name} купается с использованием "${itemToUse?.name || 'Мыло'}".`, 'success');
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

        if (actualActionType !== 'sleep' && status !== 'sleeping' && !isActionAborted) {
          setTimeout(() => {
            setProfile((p) => {
              if (!p) return null;
              return {
                ...p,
                cats: p.cats.map((c) => (c.id === cat.id && c.status !== 'sleeping' ? { ...c, status: 'idle' } : c)),
              };
            });
          }, 3500);
        }

        if (!isActionAborted) {
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
              setProfile((p) => {
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

      if (isActionAborted) {
        return prev;
      }

      // Начисление лапок за действия в зависимости от редкости предмета
      let actionPaws = 0;
      if (itemToUse) {
        if (itemToUse.rarity === 'common') actionPaws = 2;
        else if (itemToUse.rarity === 'rare') actionPaws = 4;
        else if (itemToUse.rarity === 'epic') actionPaws = 7;
        else if (itemToUse.rarity === 'legendary') actionPaws = 12;
      } else {
        if (actualActionType === 'groom') actionPaws = 12; // уменьшено с 15
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

      // Квест на лапки
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

      // Обновление аналитики
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Гладить котика кликами (+1 XP и с шансом лапку)
  const petCatClick = useCallback(() => {
    if (!profile) return;

    setProfile((prev) => {
      if (!prev) return null;

      const currentClicks = (prev.clicksCount || 0) + 1;
      let extraPaws = 0;
      
      // Каждый 15-й клик дает лапку
      if (currentClicks % 15 === 0) {
        extraPaws = 1;
        addNotification('Радость котика! 🐾', '+1 лапка за ласку котика!', 'paw');
      }

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== prev.activeCatId) return cat;

        let { xp, level, happiness } = cat;
        xp += 1; // +1 XP за клик поглаживание
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
            setProfile((p) => {
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

      // Квест на клики
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Лопнуть пупырку в Pop It
  const burstPopIt = useCallback(() => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return null;
      const count = (prev.popItBurstedCount || 0) + 1;
      
      // Каждый 40-й взрыв дает лапку
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Кликнуть по клавиатуре
  const clickKeyboard = useCallback(() => {
    if (!profile) return;
    setProfile((prev) => {
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
  }, [profile, addNotification]);

  // Забрать награду за квест
  const claimQuestReward = useCallback((questId: string) => {
    if (!profile) return;

    setProfile((prev) => {
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Покупка скина, аксессуара или расходного материала
  const purchaseSkinOrAccessory = useCallback((skinId: string) => {
    if (!profile) return;

    // Сначала проверим, не расходник ли это
    const consumableItem = CONSUMABLE_ITEMS.find((c) => c.id === skinId);
    if (consumableItem) {
      if (profile.paws < consumableItem.cost) {
        addNotification('Мало лапок 🐾', `Вам нужно ${consumableItem.cost} лапок, а у вас ${profile.paws}.`, 'warning');
        return;
      }

      setProfile((prev) => {
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

    // Иначе это скин или аксессуар
    const skinToBuy = ALL_SKINS_LIST.find((s) => s.id === skinId);
    if (!skinToBuy) return;

    if (profile.paws < skinToBuy.cost) {
      addNotification('Мало лапок 🐾', `Вам нужно ${skinToBuy.cost} лапок, а у вас ${profile.paws}.`, 'warning');
      return;
    }

    setProfile((prev) => {
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Надеть скин или аксессуар
  const applySkinOrAccessory = useCallback((catId: string, skinId: string) => {
    if (!profile) return;

    setProfile((prev) => {
      if (!prev) return null;

      const selectedSkin = ALL_SKINS_LIST.find((s) => s.id === skinId);
      if (!selectedSkin) return prev;

      const isAccessory = !!selectedSkin.accessory;

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== catId) return cat;

        if (isAccessory) {
          const alreadyHasAcc = cat.accessory === selectedSkin.accessory;
          const currentAcc = alreadyHasAcc ? undefined : selectedSkin.accessory;
          
          if (alreadyHasAcc) {
            addNotification('Гардероб 🎀', `Снят аксессуар ${selectedSkin.name} с котика ${cat.name}!`, 'info');
          } else {
            addNotification('Стильный прикид! 🎀', `Надет аксессуар ${selectedSkin.name} на котика ${cat.name}!`, 'success');
          }
          return {
            ...cat,
            accessory: currentAcc,
          };
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
  }, [profile, addNotification]);

  // Приютить нового котенка
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

    setProfile((prev) => {
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Смена активного котика
  const selectActiveCat = useCallback((catId: string) => {
    if (!profile) return;
    setProfile((prev) => {
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
  }, [profile, addNotification]);

  // Пополнение баланса (донат)
  const addPaws = useCallback((amount: number, isDonation: boolean = false) => {
    if (!profile) return;
    setProfile((prev) => {
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Забрать награду за отзыв (+100 лапок)
  const claimReviewReward = useCallback(() => {
    if (!profile) return;
    if (profile.claimedReviewReward) {
      addNotification('Награда получена', 'Вы уже забирали бонус за отзыв!', 'warning');
      return;
    }

    setProfile((prev) => {
      if (!prev) return null;
      addNotification('Бонус за отзыв! ⭐', 'Благодарим вас! Начислено +100 лапок!', 'success');
      
      const nextProfile = {
        ...prev,
        claimedReviewReward: true,
        paws: prev.paws + 100,
      };
      return checkForNewAchievements(nextProfile);
    });
  }, [profile, addNotification, checkForNewAchievements]);

  // Смена обоев рабочего стола
  const updateWallpaper = useCallback((wallpaperId: string) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return null;
      addNotification('Обои изменены 🖼️', 'Рабочий стол macOS успешно обновился.', 'info');
      return {
        ...prev,
        currentWallpaper: wallpaperId,
      };
    });
  }, [profile, addNotification]);

  // Вспомогательная функция умного слияния прогресса (Smart Merge)
  const smartMergeProfiles = useCallback((local: PlayerProfile, cloud: PlayerProfile): PlayerProfile => {
    const unlockedSkins = Array.from(new Set([...(local.unlockedSkins || []), ...(cloud.unlockedSkins || [])]));
    const unlockedBreeds = Array.from(new Set([...(local.unlockedBreeds || []), ...(cloud.unlockedBreeds || [])]));
    const unlockedAchievements = Array.from(new Set([...(local.unlockedAchievements || []), ...(cloud.unlockedAchievements || [])]));
    const redeemedPromos = Array.from(new Set([...(local.redeemedPromos || []), ...(cloud.redeemedPromos || [])]));

    const paws = Math.max(local.paws, cloud.paws);

    const mergedCatsMap = new Map<string, Cat>();
    (cloud.cats || []).forEach(cat => mergedCatsMap.set(cat.id, { ...cat }));
    (local.cats || []).forEach(localCat => {
      const cloudCat = mergedCatsMap.get(localCat.id);
      if (cloudCat) {
        mergedCatsMap.set(localCat.id, {
          ...cloudCat,
          name: localCat.name || cloudCat.name,
          level: Math.max(localCat.level, cloudCat.level),
          xp: Math.max(localCat.xp, cloudCat.xp),
          hunger: Math.max(localCat.hunger, cloudCat.hunger),
          happiness: Math.max(localCat.happiness, cloudCat.happiness),
          cleanliness: Math.max(localCat.cleanliness, cloudCat.cleanliness),
          energy: Math.max(localCat.energy, cloudCat.energy),
          status: localCat.status !== 'idle' ? localCat.status : cloudCat.status,
          accessory: localCat.accessory || cloudCat.accessory,
        });
      } else {
        mergedCatsMap.set(localCat.id, { ...localCat });
      }
    });

    const mergedCats = Array.from(mergedCatsMap.values());

    const mergedQuests = (local.quests || []).map(lq => {
      const cq = (cloud.quests || []).find(q => q.id === lq.id);
      if (!cq) return lq;
      const completed = lq.completed || cq.completed;
      const claimed = lq.claimed || cq.claimed;
      const progress = Math.max(lq.progress, cq.progress);
      return {
        ...lq,
        progress: completed ? lq.target : progress,
        completed,
        claimed,
      };
    });

    return {
      ...local,
      paws,
      unlockedSkins,
      unlockedBreeds,
      unlockedAchievements,
      redeemedPromos,
      cats: mergedCats,
      quests: mergedQuests,
      totalPlayTime: Math.max(local.totalPlayTime || 0, cloud.totalPlayTime || 0),
      totalInteractions: Math.max(local.totalInteractions || 0, cloud.totalInteractions || 0),
      clicksCount: Math.max(local.clicksCount || 0, cloud.clicksCount || 0),
      popItBurstedCount: Math.max(local.popItBurstedCount || 0, cloud.popItBurstedCount || 0),
      keyboardClicksCount: Math.max(local.keyboardClicksCount || 0, cloud.keyboardClicksCount || 0),
      claimedReviewReward: local.claimedReviewReward || cloud.claimedReviewReward,
      lastPromoRedeemedTime: Math.max(local.lastPromoRedeemedTime || 0, cloud.lastPromoRedeemedTime || 0),
    };
  }, []);

  // Активация промокода раз в неделю
  const redeemPromoCode = useCallback((code: string): { success: boolean; message: string } => {
    if (!profile) return { success: false, message: 'Профиль еще не загружен.' };

    const cleanCode = code.trim().toUpperCase();
    
    // Лимит: раз в неделю (7 дней)
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

    setProfile((prev) => {
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
  }, [profile, addNotification, checkForNewAchievements]);

  // Настоящее облачное сохранение Firestore с конфликтами
  const triggerCloudSync = useCallback(async () => {
    if (!profile) return;
    
    if (!isOnline || isOfflineMode) {
      FirebaseLogger.log('warn', `Синхронизация отклонена: оффлайн-режим (isOfflineMode=${isOfflineMode}, isOnline=${isOnline})`);
      addNotification('Сбой сети 🌐', 'В данный момент вы оффлайн. Прогресс сохранен в локальный кэш и синхронизируется при появлении связи.', 'warning');
      const timeStr = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${timeStr}] ⚠️ Изменения сохранены в локальный оффлайн-буфер.`, ...prev]);
      return;
    }

    setSyncing(true);
    FirebaseLogger.log('info', `Начало синхронизации профиля ${profile.nickname} с Firestore...`);
    addNotification('Сохранение...', 'Подключение к Firebase Firestore...', 'info');
    const timeStr = new Date().toLocaleTimeString();
    setSyncLog(prev => [`[${timeStr}] 📡 Попытка подключения к Firestore...`, ...prev]);

    try {
      const userRef = doc(db, 'users', profile.nickname);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const cloudProfile = docSnap.data() as PlayerProfile;
        FirebaseLogger.log('info', `Профиль обнаружен на сервере Firestore. Сравнение параметров...`);
        
        // Настоящий конфликт возникает ТОЛЬКО если прогресс в облаке по ключевым параметрам строго превосходит локальный,
        // или если списки скинов расходятся так, что в облаке есть то, чего нет локально.
        const isConflict = 
          (cloudProfile.paws > profile.paws) || 
          (cloudProfile.cats.length > profile.cats.length) ||
          cloudProfile.cats.some(cc => {
            const lc = profile.cats.find(cat => cat.id === cc.id);
            if (!lc) return true; // в облаке есть котик, которого нет локально
            if (cc.level > lc.level) return true; // в облаке котик более высокого уровня
            if (cc.level === lc.level && cc.xp > lc.xp) return true; // в облаке больше XP при том же уровне
            return false;
          }) ||
          (cloudProfile.unlockedSkins && cloudProfile.unlockedSkins.some(s => !profile.unlockedSkins.includes(s)));

        if (isConflict) {
          FirebaseLogger.log('warn', `Обнаружен конфликт версий! Облачные paws=${cloudProfile.paws}, локальные paws=${profile.paws}.`);
          setSyncing(false);
          const timeConflict = new Date().toLocaleTimeString();
          setSyncLog(prev => [`[${timeConflict}] ⚠️ Обнаружена рассинхронизация с сервером Firebase (другое устройство)!`, ...prev]);
          
          // Запускаем окно выбора
          setConflictCloudData(cloudProfile);
          setConflictLocalData(profile);
          setShowConflictModal(true);
          addNotification('Конфликт данных! ⚠️', 'Обнаружены разные сейвы в Firebase и на этом телефоне. Выберите действие.', 'warning');
          return;
        }
      }

      // Если конфликтов нет - пишем в облако
      FirebaseLogger.log('info', `Конфликтов не обнаружено. Запись данных в Firestore...`);
      const now = Date.now();
      const updatedProfile = { 
        ...profile, 
        lastSavedTime: now 
      };

      const cleanedProfile = { ...updatedProfile };
      // Удаляем undefined значения перед записью в Firestore чтобы не падало
      Object.keys(cleanedProfile).forEach(key => {
        if ((cleanedProfile as any)[key] === undefined) {
          delete (cleanedProfile as any)[key];
        }
      });

      await setDoc(userRef, cleanedProfile, { merge: true });
      FirebaseLogger.log('success', `Данные успешно записаны в Firestore для ${profile.nickname}!`);
      
      // Обновляем локальное состояние с новым lastSavedTime, чтобы оффлайн-упадок считался от этого момента
      setProfile(updatedProfile);
      
      setSyncing(false);
      const timeOk = new Date().toLocaleTimeString();
      setLastSyncedTime(timeOk);
      setSyncLog(prev => [`[${timeOk}] ✅ Данные успешно записаны в облако Firestore. Базы идентичны.`, ...prev]);
      addNotification('Сохранено в iCloud! ☁️', 'Ваш прогресс в облаке успешно обновлен.', 'success');
    } catch (err: any) {
      FirebaseLogger.log('error', `Ошибка при синхронизации с Firestore: ${err?.message || err}`);
      console.error('Ошибка при синхронизации с Firestore:', err);
      setSyncing(false);
      const timeErr = new Date().toLocaleTimeString();
      setSyncLog(prev => [`[${timeErr}] ❌ Ошибка соединения: ${err?.message || err}`, ...prev]);
      addNotification('Ошибка синхронизации ⚠️', 'Не удалось связаться с облаком Firebase.', 'error');
    }
  }, [profile, isOnline, isOfflineMode, addNotification]);

  // Симуляция конфликта (вызывается из интерфейса для демонстрации)
  const simulateConflictDeviceSwitch = useCallback(() => {
    if (!profile) return;
    
    // Создаем альтернативный профиль в облаке
    const dummyCloud: PlayerProfile = {
      ...profile,
      paws: profile.paws + 850, // Больше лапок
      unlockedSkins: Array.from(new Set([...profile.unlockedSkins, 'galaxy_cat', 'bengal_leopard'])), // Разблокированы редкие скины
      cats: profile.cats.map((c, i) => i === 0 ? { ...c, level: c.level + 2, xp: 50 } : c), // Кот вырос на 2 уровня
    };

    localStorage.setItem('maccat_cloud_db', JSON.stringify(dummyCloud));
    addNotification('Конфликт создан! ⚡', 'В облако Firebase записаны другие данные (типа с iPad). Теперь нажмите "Выгрузить в iCloud".', 'info');
    const timeStr = new Date().toLocaleTimeString();
    setSyncLog(prev => [`[${timeStr}] 📲 Симуляция: другое устройство записало в Firebase прогресс (+850 🐾, +2 уровня кота, Galaxy скины).`, ...prev]);
  }, [profile, addNotification]);

  // Разрешение конфликтов - три пути
  const resolveConflict = useCallback((resolution: 'merge' | 'keep_local' | 'keep_cloud') => {
    if (!conflictLocalData || !conflictCloudData) return;

    let finalProfile: PlayerProfile;

    if (resolution === 'merge') {
      finalProfile = smartMergeProfiles(conflictLocalData, conflictCloudData);
      addNotification('Прогресс объединен! 🐾', 'Данные устройств бережно слиты в один файл. Никакой прогресс не утерян!', 'success');
    } else if (resolution === 'keep_cloud') {
      finalProfile = conflictCloudData;
      addNotification('Прогресс загружен! ☁️', 'Локальные данные заменены более старыми или альтернативными из облака.', 'info');
    } else {
      finalProfile = conflictLocalData;
      addNotification('Облако перезаписано! 💾', 'Локальный прогресс объявлен главным и выгружен в облако.', 'info');
    }

    setProfile(finalProfile);
    localStorage.setItem('maccat_profile', JSON.stringify(finalProfile));
    localStorage.setItem('maccat_cloud_db', JSON.stringify(finalProfile));

    setShowConflictModal(false);
    setConflictCloudData(null);
    setConflictLocalData(null);

    const timeStr = new Date().toLocaleTimeString();
    setLastSyncedTime(timeStr);
    setSyncLog(prev => [`[${timeStr}] ✅ Конфликт успешно разрешен методом: [${resolution === 'merge' ? 'Умное Слияние' : resolution === 'keep_cloud' ? 'Приоритет Облака' : 'Приоритет Устройства'}].`, ...prev]);
  }, [conflictLocalData, conflictCloudData, smartMergeProfiles, addNotification]);

  // Претендовать на награду за серию дней заботы
  const claimStreakMilestone = useCallback((milestoneId: string) => {
    if (!profile) return;
    
    setProfile((prev) => {
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

      localStorage.setItem('maccat_profile', JSON.stringify(next));
      return next;
    });
  }, [profile, addNotification]);

  // Обновить никнейм
  const updateNickname = useCallback((name: string) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return null;
      addNotification('Настройки изменены ⚙️', `Ваше имя изменено на ${name}.`, 'info');
      return {
        ...prev,
        nickname: name,
      };
    });
  }, [profile, addNotification]);

  // Обновить тему оформления
  const updateThemePref = useCallback((theme: 'light' | 'dark' | 'auto') => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return null;
      addNotification('Оформление 🌗', `Тема переключена в режим: ${theme === 'dark' ? 'Темная' : theme === 'light' ? 'Светлая' : 'Автоматически'}.`, 'info');
      return {
        ...prev,
        theme,
      };
    });
  }, [profile, addNotification]);

  // Автоматическая фоновая синхронизация с Firebase каждые 2 минуты
  useEffect(() => {
    if (!profile) return;
    const syncInterval = setInterval(() => {
      if (isOnline && !isOfflineMode && !showConflictModal) {
        triggerCloudSync();
      }
    }, 120000); // 120000 мс = 2 минуты

    return () => clearInterval(syncInterval);
  }, [profile, isOnline, isOfflineMode, showConflictModal, triggerCloudSync]);

  const addDiaryEntry = useCallback((type: 'adopt' | 'level_up' | 'skin_unlocked' | 'rare_catch' | 'achievement', title: string, description: string, icon: string) => {
    setProfile((prev) => {
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
  }, []);

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
    resolveConflict,
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
  };
};
