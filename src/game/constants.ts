import { Skin, DailyQuest } from '../types';

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

export const CONSUMABLE_ITEMS = [
  { id: 'food_kibble', name: 'Премиум корм', emoji: '🎚️', description: 'Хрустящий сбалансированный сухой корм. Насыщает +20 сытости, дает +10 XP.', cost: 12, type: 'food' as const, boost: 20, xpBoost: 10, rarity: 'common' as const },
  { id: 'food_treat', name: 'Кремовое лакомство', emoji: '🧁', description: 'Нежное кошачье лакомство в тюбике. Восстанавливает +30 сытости и дает +15 XP.', cost: 18, type: 'food' as const, boost: 30, xpBoost: 15, rarity: 'rare' as const },
  { id: 'food_tuna', name: 'Филе дикого тунца', emoji: '🐟', description: 'Свежайший стейк из глубоководного тунца. Восстанавливает +45 сытости и дает +25 XP.', cost: 28, type: 'food' as const, boost: 45, xpBoost: 25, rarity: 'epic' as const },
  { id: 'food_steak', name: 'Сочный стейк Прайм', emoji: '🥩', description: 'Мраморная говядина высочайшего класса для котика. Дает +75 сытости и +45 XP!', cost: 45, type: 'food' as const, boost: 75, xpBoost: 45, rarity: 'legendary' as const },
  { id: 'soap_lavender', name: 'Лавандовое мыло', emoji: '🧼', description: 'Мягкое мыло с экстрактом лаванды для расслабления. +25 гигиены, +12 XP.', cost: 15, type: 'soap' as const, boost: 25, xpBoost: 12, rarity: 'common' as const },
  { id: 'soap_minerals', name: 'Мыло с минералами', emoji: '🧴', description: 'Лечебная пенка с минералами Мертвого моря. +50 гигиены, +20 XP.', cost: 25, type: 'soap' as const, boost: 50, xpBoost: 20, rarity: 'rare' as const },
  { id: 'soap_charcoal', name: 'Угольный эко-шампунь', emoji: '🛁', description: 'Глубокое детокс-очищение шерстки до сияния. +85 гигиены, +35 XP!', cost: 45, type: 'soap' as const, boost: 85, xpBoost: 35, rarity: 'epic' as const },
  { id: 'toy_wand', name: 'Удочка-дразнилка', emoji: '🪶', description: 'Перо на веревочке для весёлых прыжков. +25 счастья, +15 XP, -8 энергии.', cost: 16, type: 'toy' as const, boost: 25, xpBoost: 15, rarity: 'common' as const },
  { id: 'toy_laser', name: 'Лазерная указка', emoji: '🔦', description: 'Неуловимая красная лазерная точка. +55 счастья, +30 XP, -15 энергии.', cost: 30, type: 'toy' as const, boost: 55, xpBoost: 30, rarity: 'rare' as const },
  { id: 'toy_catnip', name: 'Мышка с кошачьей мятой', emoji: '🐭', description: 'Игрушка с органической мятой для безумного счастья. +90 счастья, +50 XP!', cost: 50, type: 'toy' as const, boost: 90, xpBoost: 50, rarity: 'epic' as const },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const INITIAL_QUESTS = (dateStr?: string): DailyQuest[] => {
  const today = dateStr || new Date().toISOString().split('T')[0];
  const seed = hashString(today);

  // Pool of templates for each type
  const feedTemplates = [
    { text: 'Покормить котиков {T} раз', baseTarget: 3, multiplier: 1, reward: 50 },
    { text: 'Порадовать котиков лакомством {T} раз', baseTarget: 2, multiplier: 1, reward: 60 },
    { text: 'Устроить плотный обед для любимцев {T} раз', baseTarget: 4, multiplier: 1, reward: 75 }
  ];

  const playTemplates = [
    { text: 'Поиграть с котиками {T} раз', baseTarget: 2, multiplier: 1, reward: 60 },
    { text: 'Устроить активные игры {T} раз', baseTarget: 3, multiplier: 1, reward: 80 },
    { text: 'Повеселить питомцев лазерной указкой {T} раз', baseTarget: 2, multiplier: 1, reward: 70 }
  ];

  const cleanTemplates = [
    { text: 'Искупать котика в ванне {T} раз', baseTarget: 1, multiplier: 1, reward: 40 },
    { text: 'Навести полную чистоту котикам {T} раз', baseTarget: 2, multiplier: 1, reward: 65 },
    { text: 'Помыть любимцев ароматным мылом {T} раз', baseTarget: 1, multiplier: 1, reward: 45 }
  ];

  const clickTemplates = [
    { text: 'Погладить котика кликами {T} раз', baseTarget: 20, multiplier: 5, reward: 35 },
    { text: 'Подарить котику нежную заботу {T} кликами', baseTarget: 30, multiplier: 5, reward: 50 },
    { text: 'Выразить любовь котику {T} поглаживаниями', baseTarget: 15, multiplier: 5, reward: 30 }
  ];

  const antistressTemplates = [
    { text: 'Лопнуть {T} пузырей в Pop It', baseTarget: 30, multiplier: 10, reward: 45 },
    { text: 'Расслабиться: лопнуть {T} пупырок', baseTarget: 40, multiplier: 10, reward: 55 },
    { text: 'Покликать Pop It антистресс {T} раз', baseTarget: 50, multiplier: 10, reward: 60 }
  ];

  const customTemplates = [
    { id_sub: 'custom_wardrobe', text: 'Примерить новый образ или аксессуар в Шкафчике', target: 1, reward: 30, type: 'custom' as const },
    { id_sub: 'custom_msg', text: 'Отправить сообщение друзьям в приватный или общий чат', target: 1, reward: 40, type: 'custom' as const },
    { id_sub: 'custom_photo', text: 'Сделать красивый снимок котика в фотосессии', target: 1, reward: 50, type: 'custom' as const }
  ];

  // Select 1 from each pool based on seed to build exactly 5 quests
  const getIndex = (arrLen: number, offset: number) => (seed + offset) % arrLen;

  const feedTpl = feedTemplates[getIndex(feedTemplates.length, 1)];
  const playTpl = playTemplates[getIndex(playTemplates.length, 2)];
  const cleanTpl = cleanTemplates[getIndex(cleanTemplates.length, 3)];
  const clickTpl = clickTemplates[getIndex(clickTemplates.length, 4)];
  const antistressTpl = antistressTemplates[getIndex(antistressTemplates.length, 5)];
  const customTpl = customTemplates[getIndex(customTemplates.length, 6)];

  // Deterministic targets based on seed
  const feedTarget = feedTpl.baseTarget + (seed % 3) * feedTpl.multiplier;
  const playTarget = playTpl.baseTarget + (seed % 2) * playTpl.multiplier;
  const cleanTarget = cleanTpl.baseTarget + (seed % 2) * cleanTpl.multiplier;
  const clickTarget = clickTpl.baseTarget + (seed % 4) * clickTpl.multiplier;
  const antistressTarget = antistressTpl.baseTarget + (seed % 3) * antistressTpl.multiplier;

  const list: DailyQuest[] = [
    {
      id: `feed_${feedTarget}`,
      text: feedTpl.text.replace('{T}', String(feedTarget)),
      progress: 0,
      target: feedTarget,
      completed: false,
      claimed: false,
      rewardPaws: feedTpl.reward + (feedTarget - feedTpl.baseTarget) * 10,
      type: 'feed'
    },
    {
      id: `play_${playTarget}`,
      text: playTpl.text.replace('{T}', String(playTarget)),
      progress: 0,
      target: playTarget,
      completed: false,
      claimed: false,
      rewardPaws: playTpl.reward + (playTarget - playTpl.baseTarget) * 15,
      type: 'play'
    },
    {
      id: `clean_${cleanTarget}`,
      text: cleanTpl.text.replace('{T}', String(cleanTarget)),
      progress: 0,
      target: cleanTarget,
      completed: false,
      claimed: false,
      rewardPaws: cleanTpl.reward + (cleanTarget - cleanTpl.baseTarget) * 20,
      type: 'clean'
    },
    {
      id: `click_${clickTarget}`,
      text: clickTpl.text.replace('{T}', String(clickTarget)),
      progress: 0,
      target: clickTarget,
      completed: false,
      claimed: false,
      rewardPaws: clickTpl.reward + Math.floor((clickTarget - clickTpl.baseTarget) / 5) * 5,
      type: 'click'
    },
    {
      id: customTpl.id_sub,
      text: customTpl.text,
      progress: 0,
      target: customTpl.target,
      completed: false,
      claimed: false,
      rewardPaws: customTpl.reward,
      type: customTpl.type
    }
  ];

  // If hash is even, swap fourth quest with antistress to add even more variety
  if (seed % 2 === 0) {
    list[3] = {
      id: `antistress_${antistressTarget}`,
      text: antistressTpl.text.replace('{T}', String(antistressTarget)),
      progress: 0,
      target: antistressTarget,
      completed: false,
      claimed: false,
      rewardPaws: antistressTpl.reward + Math.floor((antistressTarget - antistressTpl.baseTarget) / 10) * 5,
      type: 'antistress'
    };
  }

  return list;
};

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
