// src/game/merge.ts
import { PlayerProfile, Cat } from '../types';

/**
 * Smart merges a local profile and a cloud profile, taking the maximum of stats,
 * level, xp, paws, unlocked items, achievements, etc.
 */
export const smartMergeProfiles = (local: PlayerProfile, cloud: PlayerProfile): PlayerProfile => {
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
        hat: localCat.hat || cloudCat.hat,
        glasses: localCat.glasses || cloudCat.glasses,
        collar: localCat.collar || cloudCat.collar,
        scarf: localCat.scarf || cloudCat.scarf,
        boots: localCat.boots || cloudCat.boots,
        wings: localCat.wings || cloudCat.wings,
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
};
