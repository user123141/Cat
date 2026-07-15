import { describe, it, expect } from 'vitest';
import { smartMergeProfiles } from './merge';
import { PlayerProfile, Cat } from '../types';

const mockProfile = (overrides: Partial<PlayerProfile> = {}): PlayerProfile => ({
  nickname: 'Developer',
  paws: 100,
  streak: 1,
  unlockedSkins: ['scottish_pink'],
  unlockedBreeds: ['british_shorthair'],
  unlockedAchievements: [],
  cats: [],
  quests: [],
  theme: 'dark',
  currentWallpaper: 'sequoia',
  activeCatId: 'cat_1',
  totalPlayTime: 0,
  totalInteractions: 0,
  soundEnabled: true,
  claimedReviewReward: false,
  foodCount: 5,
  soapCount: 5,
  ...overrides,
});

const mockCat = (id: string, overrides: Partial<Cat> = {}): Cat => ({
  id,
  name: 'Barsik',
  breed: 'british_shorthair',
  skinId: 'british_classic',
  level: 1,
  xp: 10,
  hunger: 50,
  happiness: 50,
  cleanliness: 50,
  energy: 50,
  status: 'idle',
  personality: 'lazy',
  ...overrides,
});

describe('smartMergeProfiles', () => {
  it('should choose the maximum paw count', () => {
    const local = mockProfile({ paws: 500 });
    const cloud = mockProfile({ paws: 1200 });
    const merged = smartMergeProfiles(local, cloud);

    expect(merged.paws).toBe(1200);
  });

  it('should merge unique unlocked skins and achievements', () => {
    const local = mockProfile({ unlockedSkins: ['skin_a', 'skin_b'] });
    const cloud = mockProfile({ unlockedSkins: ['skin_b', 'skin_c'], unlockedAchievements: ['ach_1'] });
    const merged = smartMergeProfiles(local, cloud);

    expect(merged.unlockedSkins).toContain('skin_a');
    expect(merged.unlockedSkins).toContain('skin_b');
    expect(merged.unlockedSkins).toContain('skin_c');
    expect(merged.unlockedAchievements).toContain('ach_1');
  });

  it('should merge cat details, preferring higher levels and higher xp', () => {
    const localCat = mockCat('cat_1', { level: 2, xp: 50, hunger: 90 });
    const cloudCat = mockCat('cat_1', { level: 3, xp: 10, hunger: 40 });

    const local = mockProfile({ cats: [localCat] });
    const cloud = mockProfile({ cats: [cloudCat] });
    const merged = smartMergeProfiles(local, cloud);

    expect(merged.cats.length).toBe(1);
    expect(merged.cats[0].level).toBe(3); // from cloud
    expect(merged.cats[0].xp).toBe(50); // from local
    expect(merged.cats[0].hunger).toBe(90); // from local (better cared)
  });
});
