import React, { useCallback } from 'react';
import { Cat, PlayerProfile, DiaryEntry } from '../types';
import { ALL_SKINS_LIST, CONSUMABLE_ITEMS, INITIAL_SKINS, INITIAL_QUESTS } from '../game/constants';

export const useCatActions = (
  profile: PlayerProfile | null,
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile | null>>,
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'paw') => void,
  checkForNewAchievements: (prev: PlayerProfile) => PlayerProfile,
  queueSync: () => void,
  setAnalytics: React.Dispatch<React.SetStateAction<any>>
) => {
  const validateAndSanitizeProfile = (prev: PlayerProfile, updated: PlayerProfile): PlayerProfile => {
    // 1. Cap maximum paws delta in single operation to prevent massive injections
    const pawDelta = updated.paws - prev.paws;
    let sanitizedPaws = updated.paws;
    if (pawDelta > 1500) {
      console.warn('[Anti-Exploit] Обнаружена аномальная инъекция валюты! Сброс к безопасному значению.');
      sanitizedPaws = prev.paws + 150; // Cap to max 150 paws per standard transaction
    }

    // 2. Prevent negative paws (unless spending and has enough balance)
    if (sanitizedPaws < 0) {
      sanitizedPaws = 0;
    }

    // 3. Prevent extreme level or XP injection for cats
    const sanitizedCats = updated.cats.map(cat => {
      const prevCat = prev.cats.find(c => c.id === cat.id);
      if (!prevCat) return cat; // New cat is fine

      let level = cat.level;
      let xp = cat.xp;

      // Reject level jumps > 1 in a single update
      if (level - prevCat.level > 1) {
        console.warn('[Anti-Exploit] Попытка инъекции уровней котика!');
        level = prevCat.level + 1;
      }

      // Reject XP jumps > 1000 in a single update
      if (xp - prevCat.xp > 1000) {
        console.warn('[Anti-Exploit] Попытка инъекции XP!');
        xp = prevCat.xp + 10;
      }

      return {
        ...cat,
        level,
        xp
      };
    });

    return {
      ...updated,
      paws: sanitizedPaws,
      cats: sanitizedCats
    };
  };

  const updateProfile = useCallback((updater: (prev: PlayerProfile) => PlayerProfile) => {
    setProfile((prev) => {
      if (!prev) return null;
      const updated = updater(prev);
      const sanitized = validateAndSanitizeProfile(prev, updated);
      return { ...sanitized, lastSavedTime: Date.now() };
    });
    queueSync();
  }, [setProfile, queueSync]);

  const createProfile = useCallback((nickname: string, initialCatName: string, breed: string, skinId: string) => {
    const selectedSkin = INITIAL_SKINS.find((s) => s.id === skinId) || INITIAL_SKINS[0];
    const firstCat: Cat = {
      id: 'cat_' + Math.random().toString(36).substring(2, 11),
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
    updateProfile(() => checkedProfile);
    addNotification('Котенок приютен! 🍼', `${initialCatName} присоединился к вашему рабочему столу!`, 'success');
  }, [addNotification, checkForNewAchievements, updateProfile]);

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
      if (!prev) return null as any;

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
            updateProfile((p) => ({
              ...p,
              cats: p.cats.map((c) => (c.id === cat.id && c.status !== 'sleeping' ? { ...c, status: 'idle' } : c)),
            }));
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

      setAnalytics((prevAnalytics: any) => {
        const key = actualActionType === 'feed' ? 'feed' : actualActionType === 'play' ? 'play' : actualActionType === 'clean' ? 'clean' : 'sleep';
        const updatedAct = { ...prevAnalytics.actionsPerformed };
        updatedAct[key] = (updatedAct[key] || 0) + 1;

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
  }, [profile, addNotification, checkForNewAchievements, updateProfile, setAnalytics]);

  const petCatClick = useCallback(() => {
    if (!profile) return;

    updateProfile((prev) => {
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
        setAnalytics((prevAnalytics: any) => {
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
      if (prev.unlockedSkins.includes(skinId)) {
        addNotification('Уже разблокировано 🛍️', `Вы уже приобрели ${skinToBuy.name}!`, 'info');
        return prev;
      }

      setAnalytics((prevAnalytics: any) => {
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
  }, [profile, addNotification, checkForNewAchievements, updateProfile, setAnalytics]);

  const applySkinOrAccessory = useCallback((catId: string, skinId: string) => {
    if (!profile) return;

    updateProfile((prev) => {
      const selectedSkin = ALL_SKINS_LIST.find((s) => s.id === skinId);
      if (!selectedSkin) return prev;

      const isAccessory = !!selectedSkin.accessory;

      const updatedCats = prev.cats.map((cat) => {
        if (cat.id !== catId) return cat;

        if (isAccessory) {
          let slot: any = selectedSkin.slot || null;

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

      const updatedQuests = prev.quests.map((q) => {
        if (q.id === 'custom_wardrobe' && !q.completed) {
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

      return {
        ...prev,
        cats: updatedCats,
        quests: updatedQuests,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const adoptNewCat = useCallback((catName: string, breed: string, skinId: string) => {
    if (!profile) return;

    const cost = 200;
    if (profile.paws < cost) {
      addNotification('Недостаточно лапок 🐾', `Новое усыновление стоит ${cost} лапок. Копите лапки заботой!`, 'warning');
      return;
    }

    const selectedSkin = INITIAL_SKINS.find((s) => s.id === skinId) || INITIAL_SKINS[0];
    const newCat: Cat = {
      id: 'cat_' + Math.random().toString(36).substring(2, 11),
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

  const claimStreakMilestone = useCallback((milestoneId: string) => {
    if (!profile) return;
    
    updateProfile((prev) => {
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
      addNotification('Оформление 🌗', `Тема переключена в режим: ${theme === 'dark' ? 'Темная' : theme === 'light' ? 'Светлая' : 'Автоматически'}.`, 'info');
      return {
        ...prev,
        theme,
      };
    });
  }, [profile, addNotification, updateProfile]);

  const addDiaryEntry = useCallback((type: 'adopt' | 'level_up' | 'skin_unlocked' | 'rare_catch' | 'achievement', title: string, description: string, icon: string) => {
    updateProfile((prev) => {
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
    createProfile,
    interactWithCat,
    petCatClick,
    burstPopIt,
    clickKeyboard,
    claimQuestReward,
    purchaseSkinOrAccessory,
    applySkinOrAccessory,
    adoptNewCat,
    selectActiveCat,
    addPaws,
    claimReviewReward,
    claimStreakMilestone,
    updateWallpaper,
    redeemPromoCode,
    updateNickname,
    updateThemePref,
    addDiaryEntry,
    updateProfile,
  };
};
