// src/game/achievements.ts
import { PlayerProfile, DiaryEntry } from '../types';

/**
 * Checks for achievements and updates the profile with unlocked trophies and diary events.
 */
export const checkAchievements = (
  prev: PlayerProfile,
  onUnlockNotification: (name: string) => void
): { profile: PlayerProfile; unlockedAny: boolean } => {
  const profileCopy = { ...prev };
  if (!profileCopy.unlockedAchievements) {
    profileCopy.unlockedAchievements = [];
  }
  
  const newlyUnlocked: string[] = [...profileCopy.unlockedAchievements];
  let updated = false;
  const newDiaryEntries: DiaryEntry[] = [];

  const checkAndUnlock = (id: string, name: string, condition: boolean) => {
    if (condition && !newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
      updated = true;
      onUnlockNotification(name);
      
      newDiaryEntries.push({
        id: 'diary_ach_' + Math.random().toString(36).substring(2, 11),
        catId: profileCopy.activeCatId || '',
        timestamp: Date.now(),
        type: 'achievement',
        title: `Достижение: ${name} 🏆`,
        description: `Ура! Разблокирован новый почётный кубок в вашей заботливой комнате.`,
        icon: '🏆'
      });
    }
  };

  checkAndUnlock('first_cat', '🐱 Первый друг (Приютили котенка)', profileCopy.cats.length >= 1);
  
  const hasLevel5 = profileCopy.cats.some(c => c.level >= 5);
  checkAndUnlock('level_5', '⭐ Славный малый (Кот достиг 5 уровня)', hasLevel5);
  
  checkAndUnlock('pet_50', '💖 Мастер поглаживаний (Погладили котика 50 раз)', (profileCopy.clicksCount || 0) >= 50);
  checkAndUnlock('skin_3', '🕶️ Икона стиля (Разблокировано 3 скина)', profileCopy.unlockedSkins.length >= 3);
  checkAndUnlock('rich_1000', '💰 Миллионер (Накоплено 1000 лапок)', profileCopy.paws >= 1000);
  checkAndUnlock('antistress_100', '🧘 Абсолютный дзен (Лопнуто 100 пупырок Pop It)', (profileCopy.popItBurstedCount || 0) >= 100);

  if (updated) {
    return {
      profile: {
        ...profileCopy,
        unlockedAchievements: newlyUnlocked,
        diary: [...newDiaryEntries, ...(profileCopy.diary || [])]
      },
      unlockedAny: true
    };
  }

  return { profile: profileCopy, unlockedAny: false };
};
