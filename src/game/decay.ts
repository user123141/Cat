// src/game/decay.ts
import { Cat } from '../types';

/**
 * Calculates realtime stats decay for all active cats.
 */
export const calculateDecay = (
  cats: Cat[],
  decayMultiplier: number = 0.5
): { updatedCats: Cat[]; totalPawsDiff: number } => {
  let totalPawsDiff = 0;

  const updatedCats = cats.map((cat) => {
    let { hunger, happiness, cleanliness, energy, status } = cat;

    if (status === 'sleeping') {
      energy = Math.min(100, energy + 8 * decayMultiplier * 2.5);
      hunger = Math.max(0, hunger - 0.2 * decayMultiplier);
      if (energy < 100 && Math.random() < 0.2 * decayMultiplier) {
        totalPawsDiff += 1;
      }
      if (energy >= 100) {
        status = 'idle';
      }
    } else {
      hunger = Math.max(0, hunger - 0.35 * decayMultiplier);
      cleanliness = Math.max(0, cleanliness - 0.25 * decayMultiplier);
      energy = Math.max(0, energy - 0.3 * decayMultiplier);

      const penalty = (hunger < 30 ? 0.5 : 0) + (cleanliness < 30 ? 0.5 : 0) + (energy < 20 ? 0.5 : 0);
      happiness = Math.max(0, happiness - (0.2 + penalty) * decayMultiplier);
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

  return { updatedCats, totalPawsDiff };
};

/**
 * Calculates decay during long offline durations.
 */
export const calculateOfflineDecay = (
  cats: Cat[],
  elapsedSeconds: number
): Cat[] => {
  const hours = elapsedSeconds / 3600;

  return cats.map((cat) => {
    let { hunger, cleanliness, happiness, energy, status } = cat;

    if (status === 'sleeping') {
      const sleepHoursToFull = Math.max(0, (100 - energy) / 25);
      if (hours >= sleepHoursToFull) {
        energy = 100;
        status = 'idle';
        const idleHours = hours - sleepHoursToFull;

        hunger = Math.max(0, hunger - 0.5 * sleepHoursToFull - 3.5 * idleHours);
        cleanliness = Math.max(0, cleanliness - 0.3 * sleepHoursToFull - 2 * idleHours);
        energy = Math.max(0, energy - 2 * idleHours);

        const hungerPenalty = hunger < 30 ? 1.5 : 0;
        const cleanPenalty = cleanliness < 30 ? 1.5 : 0;
        happiness = Math.max(0, happiness - 0.2 * sleepHoursToFull - 3 * idleHours - (hungerPenalty + cleanPenalty) * idleHours);
      } else {
        energy = Math.min(100, energy + 25 * hours);
        hunger = Math.max(0, hunger - 0.5 * hours);
        cleanliness = Math.max(0, cleanliness - 0.3 * hours);
        happiness = Math.max(0, happiness - 0.2 * hours);
      }
    } else {
      hunger = Math.max(0, hunger - 3.5 * hours);
      cleanliness = Math.max(0, cleanliness - 2 * hours);
      energy = Math.max(0, energy - 2 * hours);

      const hungerPenalty = hunger < 30 ? 1.5 : 0;
      const cleanPenalty = cleanliness < 30 ? 1.5 : 0;
      happiness = Math.max(0, happiness - (3 + hungerPenalty + cleanPenalty) * hours);
    }

    return {
      ...cat,
      hunger: Math.round(hunger * 10) / 10,
      cleanliness: Math.round(cleanliness * 10) / 10,
      happiness: Math.round(happiness * 10) / 10,
      energy: Math.round(energy * 10) / 10,
      status,
    };
  });
};
