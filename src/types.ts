// src/types.ts

export interface Cat {
  id: string;
  name: string;
  breed: string;
  skinId: string;
  level: number;
  xp: number;
  hunger: number;      // 0-100
  happiness: number;   // 0-100
  cleanliness: number; // 0-100
  energy: number;      // 0-100
  status: 'idle' | 'eating' | 'playing' | 'sleeping' | 'bathing';
  personality: 'lazy' | 'playful' | 'hungry';
  // accessory теперь хранится отдельно? Лучше добавить поле для аксессуара, если не используется skinId.
  // Используем accessory как строку.
  accessory?: string;
  // Дополнительно можно хранить время последнего взаимодействия
  lastInteraction?: number;
}

export interface Skin {
  id: string;
  name: string;
  description: string;
  breed: string;       // для какой породы
  color: string;
  patternColor: string;
  eyeColor: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  accessory?: string;  // если это аксессуар, содержит его идентификатор
}

export interface DailyQuest {
  id: string;
  text: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardPaws: number;
  type: 'feed' | 'play' | 'clean' | 'earn_paws' | 'custom' | 'click' | 'antistress';
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'paw';
  title: string;
  message: string;
  timestamp: number;
}

export interface GameAnalytics {
  totalPawsEarned: number;
  totalPawsSpent: number;
  totalInteractions: number;
  retentionScore: number;
  actionsPerformed: {
    feed: number;
    play: number;
    clean: number;
    sleep: number;
  };
  pawsSpent: number;
}

export interface DiaryEntry {
  id: string;
  catId: string;
  timestamp: number;
  type: 'adopt' | 'level_up' | 'skin_unlocked' | 'rare_catch' | 'achievement';
  title: string;
  description: string;
  icon: string;
}

export interface PlayerProfile {
  id?: string;
  nickname: string;
  paws: number;
  cats: Cat[];
  activeCatId: string;
  unlockedSkins: string[]; // массив id скинов
  unlockedBreeds?: string[]; // массив разблокированных пород
  quests: DailyQuest[];
  unlockedAchievements?: string[];
  totalPlayTime: number;
  totalInteractions: number;
  clicksCount?: number;
  popItBurstedCount?: number;
  keyboardClicksCount?: number;
  diary?: DiaryEntry[];
  theme: 'light' | 'dark' | 'auto';
  currentWallpaper: string;
  soundEnabled: boolean;
  streak: number;
  claimedReviewReward: boolean;
  isAdmin?: boolean;
  blocked?: boolean;
  claimedStreakMilestones?: string[]; // Награды за серии дней
  careCalendarHistory?: string[]; // Даты входов для календаря
  lastActiveDay?: string; // Последний активный день
  createdAt?: string; // Дата регистрации
  avatar?: string; // Аватар игрока
  redeemedPromos?: string[]; // Погашенные промокоды
  lastPromoRedeemedTime?: number; // Время последнего промокода
  // Новые поля для инвентаря
  foodCount: number;
  soapCount: number;
  fishCount?: number;
  energyCount?: number;
  lastSavedTime?: number;
  inventory?: Record<string, number>;
}

export interface ConsumableItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  type: 'food' | 'soap' | 'toy';
  boost: number;
  xpBoost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}