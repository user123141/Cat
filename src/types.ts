export interface Cat {
  id: string;
  name: string;
  breed: string;
  skinId: string;
  level: number;
  xp: number;
  hunger: number; // 0 - 100
  happiness: number; // 0 - 100
  cleanliness: number; // 0 - 100
  energy: number; // 0 - 100
  status: 'idle' | 'eating' | 'sleeping' | 'playing' | 'bathing' | 'grooming';
  lastInteraction: number;
  accessory?: string;
  personality?: 'lazy' | 'playful' | 'hungry';
}

export interface Skin {
  id: string;
  name: string;
  description: string;
  cost: number;
  breed: string;
  color: string;
  patternColor: string;
  eyeColor: string;
  accessory?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyQuest {
  id: string;
  text: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  rewardPaws: number;
  type: 'feed' | 'play' | 'clean' | 'sleep' | 'earn_paws' | 'click' | 'antistress';
}

export interface PlayerProfile {
  nickname: string;
  avatar: string; // Эмодзи или имя аватара
  paws: number;
  streak: number;
  lastActiveDay: string; // ГГГГ-ММ-ДД
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  cats: Cat[];
  activeCatId: string;
  unlockedSkins: string[]; // ID разблокированных скинов
  unlockedBreeds: string[]; // ID разблокированных пород
  quests: DailyQuest[];
  totalPlayTime: number; // в секундах
  totalInteractions: number;
  createdAt: string;
  
  // Новые поля для обновления
  claimedReviewReward?: boolean; // Получил ли награду за отзыв (+100 лапок)
  currentWallpaper?: string;     // Текущие обои (ventura, sonoma, sequoia, cosmic, pastel, aurora)
  unlockedAchievements?: string[]; // Разблокированные достижения
  clicksCount?: number;           // Сколько раз погладили котика
  popItBurstedCount?: number;     // Лопнутые пузыри
  keyboardClicksCount?: number;   // Клики по клавиатуре
  redeemedPromos?: string[];      // Активированные промокоды
  lastPromoRedeemedTime?: number; // Время последней активации промокода
  diary?: DiaryEntry[];           // Дневник важных событий из жизни кота
}

export interface DiaryEntry {
  id: string;
  catId: string;
  timestamp: number;
  type: 'adopt' | 'level_up' | 'skin_unlocked' | 'rare_catch' | 'achievement' | 'groom';
  title: string;
  description: string;
  icon: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'paw';
  timestamp: number;
}

export interface GameAnalytics {
  pawsSpent: number;
  skinsBought: number;
  levelUps: number;
  actionsPerformed: {
    feed: number;
    play: number;
    clean: number;
    sleep: number;
  };
  retentionScore: number; // симулированный расчет
  sessionDuration: number; // секунды
}
