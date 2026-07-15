import { describe, it, expect } from 'vitest';
import { calculateDecay, calculateOfflineDecay } from './decay';
import { Cat } from '../types';

const mockCat = (overrides: Partial<Cat> = {}): Cat => ({
  id: 'test_cat',
  name: 'Barsik',
  breed: 'british_shorthair',
  skinId: 'british_classic',
  level: 1,
  xp: 0,
  hunger: 80,
  happiness: 80,
  cleanliness: 80,
  energy: 80,
  status: 'idle',
  personality: 'lazy',
  ...overrides,
});

describe('calculateDecay', () => {
  it('should decay hunger, cleanliness, and energy over time when idle', () => {
    const cats = [mockCat({ hunger: 80, cleanliness: 80, energy: 80, status: 'idle' })];
    const { updatedCats } = calculateDecay(cats, 1.0);

    expect(updatedCats[0].hunger).toBeLessThan(80);
    expect(updatedCats[0].cleanliness).toBeLessThan(80);
    expect(updatedCats[0].energy).toBeLessThan(80);
  });

  it('should increase energy and decay hunger when sleeping', () => {
    const cats = [mockCat({ hunger: 80, energy: 30, status: 'sleeping' })];
    const { updatedCats } = calculateDecay(cats, 1.0);

    expect(updatedCats[0].energy).toBeGreaterThan(30);
    expect(updatedCats[0].hunger).toBeLessThan(80);
  });

  it('should transition to idle when energy reaches 100 while sleeping', () => {
    const cats = [mockCat({ energy: 99, status: 'sleeping' })];
    const { updatedCats } = calculateDecay(cats, 1.0);

    expect(updatedCats[0].energy).toBe(100);
    expect(updatedCats[0].status).toBe('idle');
  });
});

describe('calculateOfflineDecay', () => {
  it('should decay stats linearly based on elapsed seconds', () => {
    const cats = [mockCat({ hunger: 100, cleanliness: 100, happiness: 100, energy: 100, status: 'idle' })];
    // 1 hour elapsed (3600 seconds)
    const updatedCats = calculateOfflineDecay(cats, 3600);

    expect(updatedCats[0].hunger).toBe(92); // 100 - 8 * 1
    expect(updatedCats[0].cleanliness).toBe(95); // 100 - 5 * 1
    expect(updatedCats[0].energy).toBe(94); // 100 - 6 * 1
  });

  it('should handle sleeping cat waking up early offline and then decaying', () => {
    const cats = [mockCat({ energy: 50, status: 'sleeping', hunger: 100, cleanliness: 100, happiness: 100 })];
    // Needs (100 - 50) / 25 = 2 hours to sleep fully
    // 3 hours elapsed total (10800 seconds)
    const updatedCats = calculateOfflineDecay(cats, 10800);

    expect(updatedCats[0].status).toBe('idle');
    expect(updatedCats[0].energy).toBe(94); // 100 - 6 * 1 (1 hour of idling)
  });
});
