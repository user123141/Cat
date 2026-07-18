// src/utils/renderAccessories.tsx
import React from 'react';

// Кэш для уже залогированных неизвестных аксессуаров
const loggedUnknown = new Set<string>();

// Определение цвета аксессуара на основе его названия
export function getAccessoryColor(acc: string): string {
  const lower = acc.toLowerCase();
  if (lower.includes('розов') || lower.includes('pink') || lower.includes('rose')) return '#ec4899';
  if (lower.includes('син') || lower.includes('blue') || lower.includes('голуб') || lower.includes('лазур')) return '#3b82f6';
  if (lower.includes('зелен') || lower.includes('изумруд') || lower.includes('green') || lower.includes('emerald') || lower.includes('трав')) return '#10b981';
  if (lower.includes('янт') || lower.includes('желт') || lower.includes('amber') || lower.includes('yellow') || lower.includes('золот') || lower.includes('gold')) return '#f59e0b';
  if (lower.includes('амет') || lower.includes('фиолет') || lower.includes('purple') || lower.includes('violet')) return '#a855f7';
  if (lower.includes('малин') || lower.includes('crimson') || lower.includes('raspberry')) return '#e11d48';
  if (lower.includes('бир') || lower.includes('cyan') || lower.includes('teal') || lower.includes('аква')) return '#06b6d4';
  if (lower.includes('оранж') || lower.includes('orange') || lower.includes('морков')) return '#ea580c';
  if (lower.includes('красн') || lower.includes('red') || lower.includes('алый')) return '#ef4444';
  if (lower.includes('черн') || lower.includes('black') || lower.includes('уголь')) return '#1e293b';
  if (lower.includes('бел') || lower.includes('white') || lower.includes('снеж')) return '#f1f5f9';
  if (lower.includes('сер') || lower.includes('gray') || lower.includes('grey')) return '#94a3b8';
  if (lower.includes('коричн') || lower.includes('brown') || lower.includes('шоколад')) return '#78350f';
  return '#94a3b8';
}

// Базовые точки привязки (в координатах SVG 200x200)
const ANCHORS = {
  HEAD: { x: 0, y: -58 },
  NECK: { x: 0, y: 8 },
  BACK: { x: 0, y: 35 },
  FEET: { x: 0, y: 72 },
  EYES: { x: 0, y: -30 },
  HAIR: { x: 40, y: -70 },
};

// ==================== КОМПОНЕНТЫ АКСЕССУАРОВ ====================

// Базовый контейнер для головных уборов
const HatBase: React.FC<{ color: string; isSleeping?: boolean; children: React.ReactNode }> = ({ color, isSleeping, children }) => {
  const transformStr = `translate(${ANCHORS.HEAD.x}, ${ANCHORS.HEAD.y})`;
  return <g transform={transformStr}>{children}</g>;
};

// КОРОНА
const CrownAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, -10)">
    <path d="M-36 -12L-28 -28L-8 -20L0 -34L8 -20L28 -28L36 -12H-36Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="-20" cy="-18" r="2" fill="#ef4444" />
    <circle cx="0" cy="-22" r="2.5" fill="#3b82f6" />
    <circle cx="20" cy="-18" r="2" fill="#ef4444" />
  </g>
);

// НИМБ
const HaloAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, -20)">
    <ellipse cx="0" cy="0" rx="48" ry="12" fill="none" stroke="#fef08a" strokeWidth="4" opacity="0.9" />
    <line x1="0" y1="6" x2="0" y2="30" stroke="#fef08a" strokeWidth="2" opacity="0.5" />
    <circle cx="0" cy="0" r="4" fill="#fef08a" opacity="0.3" />
  </g>
);

// ШАПКА САНТЫ
const SantaHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-28 0L-10 -35L18 -42L25 -30L20 0Z" fill="#ef4444" />
    <circle cx="24" cy="-38" r="8" fill="#ffffff" />
    <ellipse cx="0" cy="0" rx="32" ry="7" fill="#ffffff" />
  </g>
);

// ДЕТЕКТИВНАЯ ШЛЯПА
const DetectiveHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-36 0C-36 -30 36 -30 36 0Z" fill="#a1a1aa" stroke="#71717a" strokeWidth="1" />
    <ellipse cx="0" cy="0" rx="42" ry="6" fill="#71717a" />
    <path d="M-34 -4C-20 -7 20 -7 34 -4L32 1L-32 1Z" fill="#18181b" />
  </g>
);

// ПРАЗДНИЧНЫЙ КОЛПАК
const PartyHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-20 0L0 -45L20 0Z" fill={color} />
    <path d="M-13 -15L5 -20L10 -15L-6 -10Z" fill="#fbbf24" />
    <path d="M-7 -30L2 -32L5 -28L-4 -26Z" fill="#fbbf24" />
    <circle cx="0" cy="-45" r="5" fill="#3b82f6" />
    <ellipse cx="0" cy="0" rx="22" ry="4" fill="#fbbf24" />
  </g>
);

// КОЛПАК ВОЛШЕБНИКА
const WizardHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-45 0C-20 -5 20 -5 45 0L0 -60L-45 0Z" fill="#6366f1" />
    <ellipse cx="0" cy="0" rx="48" ry="8" fill="#4f46e5" />
    <path d="M-19 -7C-10 -11 10 -11 19 -7L14 -1L-14 -1Z" fill="#fbbf24" />
    <path d="M0 -30L2 -25L7 -25L3 -21L5 -16L0 -19L-5 -16L-3 -21L-7 -25L-2 -25Z" fill="#fff" />
  </g>
);

// ЦИЛИНДР
const TopHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <rect x="-24" y="-35" width="48" height="35" fill={color} />
    <rect x="-24" y="-7" width="48" height="7" fill="#1e293b" />
    <ellipse cx="0" cy="0" rx="36" ry="6" fill={color} />
  </g>
);

// ФЕДОРА
const FedoraAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <ellipse cx="0" cy="0" rx="30" ry="8" fill={color} />
    <path d="M-18 -8L-10 -30L10 -30L18 -8Z" fill={color} />
    <ellipse cx="0" cy="-30" rx="12" ry="4" fill={color} />
    <path d="M-20 0C-20 2 20 2 20 0" stroke="#333" strokeWidth="1" />
  </g>
);

// ШАПКА (BEANIE)
const BeanieAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-30 -5C-30 -25 30 -25 30 -5V10H-30V-5Z" fill={color} />
    <circle cx="0" cy="-25" r="8" fill={color} />
  </g>
);

// УШАНКА
const UshankaAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-35 -5C-35 -20 35 -20 35 -5V10H-35V-5Z" fill={color} />
    <rect x="-40" y="-5" width="10" height="5" rx="2" fill={color} />
    <rect x="30" y="-5" width="10" height="5" rx="2" fill={color} />
  </g>
);

// ШЛЕМ
const HelmetAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-30 -5C-30 -30 30 -30 30 -5V15H-30V-5Z" fill={color} />
    <path d="M-20 -5L-20 15" stroke="#333" strokeWidth="2" />
    <path d="M20 -5L20 15" stroke="#333" strokeWidth="2" />
  </g>
);

// ПИРАТСКАЯ ШЛЯПА
const PirateHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <path d="M-40 0C-40 -20 40 -20 40 0Z" fill={color} />
    <rect x="-10" y="-30" width="20" height="30" fill={color} />
    <path d="M-15 -30L15 -30L10 -25L-10 -25Z" fill="#fff" />
    <circle cx="0" cy="-15" r="2" fill="#ef4444" />
  </g>
);

// КОВБОЙСКАЯ ШЛЯПА
const CowboyHatAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 0)">
    <ellipse cx="0" cy="0" rx="35" ry="6" fill={color} />
    <path d="M-20 -5L-15 -30L15 -30L20 -5Z" fill={color} />
    <path d="M-20 -5L20 -5" stroke="#333" strokeWidth="2" />
  </g>
);

// ОЧКИ
const GlassesAccessory: React.FC<{ color: string; isSleeping?: boolean }> = ({ color, isSleeping }) => {
  const transformStr = `translate(${ANCHORS.EYES.x}, ${ANCHORS.EYES.y})`;
  const opacity = isSleeping ? 0.3 : 1;
  return (
    <g transform={transformStr} opacity={opacity}>
      <path d="M-56 -2C-56 -2 -44 5 -24 0" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M24 0C24 0 36 5 56 -2" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <line x1="-24" y1="-1" x2="24" y2="-1" stroke={color} strokeWidth="4" />
      <line x1="-48" y1="-2" x2="-36" y2="2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="36" y1="-2" x2="48" y2="2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </g>
  );
};

// НАУШНИКИ
const HeadphonesAccessory: React.FC<{ color: string; isSleeping?: boolean }> = ({ color, isSleeping }) => {
  const transformStr = `translate(0, ${ANCHORS.HEAD.y + 10})`;
  const opacity = isSleeping ? 0.3 : 1;
  return (
    <g transform={transformStr} opacity={opacity}>
      <path d="M-36 -12C-36 -42 36 -42 36 -12" fill="none" stroke={color} strokeWidth="5" />
      <g transform="translate(-36, -10)">
        <rect x="-8" y="-12" width="16" height="24" rx="6" fill={color} />
        <circle cx="-2" cy="0" r="4" fill="#ffffff" opacity="0.3" />
        <path d="M-8 -12L-14 -22L-2 -12Z" fill={color} />
      </g>
      <g transform="translate(36, -10)">
        <rect x="-8" y="-12" width="16" height="24" rx="6" fill={color} />
        <circle cx="2" cy="0" r="4" fill="#ffffff" opacity="0.3" />
        <path d="M8 -12L14 -22L2 -12Z" fill={color} />
      </g>
    </g>
  );
};

// ОШЕЙНИК С КОЛОКОЛЬЧИКОМ
const CollarAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform={`translate(${ANCHORS.NECK.x}, ${ANCHORS.NECK.y + 10})`}>
    <path d="M-56 -6C-30 10 30 10 56 -6" stroke={color} strokeWidth="8" strokeLinecap="round" />
    <circle cx="0" cy="10" r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
    <circle cx="0" cy="6" r="4" fill="#fff" />
  </g>
);

// БАНТИК
const BowTieAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform={`translate(${ANCHORS.NECK.x}, ${ANCHORS.NECK.y + 8})`}>
    <path d="M-30 -12L0 0L-30 12V-12Z" fill={color} />
    <path d="M30 -12L0 0L30 12V-12Z" fill={color} />
    <circle cx="0" cy="0" r="9" fill="#b91c1c" />
  </g>
);

// ШАРФ
const ScarfAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform={`translate(${ANCHORS.NECK.x}, ${ANCHORS.NECK.y + 4})`}>
    <path d="M-64 -8C-30 8 30 8 64 -8C72 8 64 20 48 20C16 20 -16 20 -48 20C-64 20 -72 8 -64 -8Z" fill={color} />
    <path d="M24 8L44 56C44 60 36 64 28 64C20 64 12 60 12 56L20 8" fill={color} />
    <line x1="20" y1="64" x2="20" y2="70" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
    <line x1="28" y1="64" x2="28" y2="70" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
    <line x1="36" y1="64" x2="36" y2="70" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
  </g>
);

// БОТИНКИ / ТАПОЧКИ
const BootsAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform={`translate(${ANCHORS.FEET.x}, ${ANCHORS.FEET.y - 1})`}>
    <g transform="translate(-25, 4)">
      <ellipse cx="0" cy="4" rx="14" ry="9" fill={color} />
      <path d="M-6 -3C-6 -3 -4 -14 0 -14C4 -14 6 -3 6 -3" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="0" cy="-11" rx="8" ry="2.5" fill="#ffffff" />
    </g>
    <g transform="translate(25, 4)">
      <ellipse cx="0" cy="4" rx="14" ry="9" fill={color} />
      <path d="M-6 -3C-6 -3 -4 -14 0 -14C4 -14 6 -3 6 -3" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="0" cy="-11" rx="8" ry="2.5" fill="#ffffff" />
    </g>
  </g>
);

// КРЫЛЬЯ
const WingsAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform="translate(0, 115)" opacity="0.85">
    <path d="M-56 -30C-130 -90 -170 -20 -110 20C-80 40 -60 20 -56 10Z" fill={color} stroke={color} strokeWidth="3" />
    <path d="M-56 10C-110 40 -130 70 -96 90C-70 104 -56 70 -56 50Z" fill={color} opacity="0.7" />
    <path d="M56 -30C130 -90 170 -20 110 20C80 40 60 20 56 10Z" fill={color} stroke={color} strokeWidth="3" />
    <path d="M56 10C110 40 130 70 96 90C70 104 56 70 56 50Z" fill={color} opacity="0.7" />
    <path d="M-70 -10C-95 -30 -120 -10 -100 5" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" fill="none" />
    <path d="M70 -10C95 -30 120 -10 100 5" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" fill="none" />
  </g>
);

// ЗАКОЛКА / ШПИЛЬКА
const HairpinAccessory: React.FC<{ color: string }> = ({ color }) => (
  <g transform={`translate(${ANCHORS.HAIR.x}, ${ANCHORS.HAIR.y}) rotate(15)`}>
    <path d="M0 -10L3 -3L10 -3L5 1L7 8L0 4L-7 8L-5 1L-10 -3L-3 -3Z" fill={color} stroke="#ffffff" strokeWidth="1" />
    <circle cx="0" cy="0" r="2" fill="#ffffff" />
  </g>
);

// ==================== ГЛАВНЫЙ РЕНДЕРЕР ====================
export interface AccessoryGeometry {
  slot: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  layer: number;
}

export function getAccessoryConfig(value: string): AccessoryGeometry {
  if (!value || value === 'none' || value === 'empty' || value === 'null') {
    return { slot: 'none', scale: 1, offsetX: 0, offsetY: 0, layer: 0 };
  }
  const lower = value.toLowerCase();
  const has = (str: string) => lower.includes(str);

  if (has('crown') || has('корон')) {
    return { slot: 'hat', scale: 1.0, offsetX: 0, offsetY: -10, layer: 5 };
  }
  if (has('halo') || has('нимб')) {
    return { slot: 'hat', scale: 1.0, offsetX: 0, offsetY: -20, layer: 5 };
  }
  if (has('santa') || has('новогод') || has('санта') || has('detective') || has('шерлок') || has('детектив') || has('party') || has('празднич') || has('wizard') || has('волшеб') || has('top hat') || has('цилиндр') || has('fedora') || has('федора') || has('beanie') || has('шапк') || has('шапочк') || has('ushanka') || has('ушанк') || has('helmet') || has('шлем') || has('pirate') || has('пират') || has('cowboy') || has('ковбой') || has('hat') || has('шляп')) {
    return { slot: 'hat', scale: 1.0, offsetX: 0, offsetY: 0, layer: 5 };
  }
  if (has('wings') || has('krylya') || has('крыль')) {
    return { slot: 'wings', scale: 0.65, offsetX: 0, offsetY: 5, layer: -1 };
  }
  if (has('glasses') || has('ochki') || has('очк') || has('очки') || has('headphones') || has('naushniki') || has('наушник') || has('гарнитур')) {
    return { slot: 'glasses', scale: 1.0, offsetX: 0, offsetY: 0, layer: 4 };
  }
  if (has('collar') || has('bell') || has('ошейник') || has('колокольч') || has('колокол')) {
    return { slot: 'collar', scale: 1.0, offsetX: 0, offsetY: 10, layer: 3 };
  }
  if (has('bow') || has('ribbon') || has('bantik') || has('бант') || has('бабочк') || has('бантик')) {
    return { slot: 'collar', scale: 1.0, offsetX: 0, offsetY: 8, layer: 3 };
  }
  if (has('scarf') || has('sharf') || has('шарф')) {
    return { slot: 'scarf', scale: 1.0, offsetX: 0, offsetY: 4, layer: 3 };
  }
  if (has('boots') || has('slippers') || has('tapochki') || has('sapozhki') || has('тапочк') || has('сапожк') || has('туфл') || has('ботинк')) {
    return { slot: 'boots', scale: 0.9, offsetX: 0, offsetY: -1, layer: 2 };
  }
  if (has('hairpin') || has('заколк') || has('star') || has('звезд') || has('шпильк') || has('заколка')) {
    return { slot: 'hairpin', scale: 1.0, offsetX: 0, offsetY: 0, layer: 6 };
  }

  return { slot: 'accessory', scale: 1.0, offsetX: 0, offsetY: 0, layer: 1 };
}

export const RenderAccessory: React.FC<{ value: string; scale?: number; isSleeping?: boolean; skipTransform?: boolean }> = ({ value, scale = 1, isSleeping = false, skipTransform = false }) => {
  if (!value || value === 'none' || value === 'empty' || value === 'null' || value === 'undefined' || value.trim() === '') {
    return null;
  }

  const color = getAccessoryColor(value);
  const lower = value.toLowerCase();

  // Вспомогательные функции для поиска ключевых слов (поддержка русского и английского)
  const has = (str: string) => lower.includes(str);

  let element: React.ReactNode = null;
  let anchor = { x: 0, y: 0 };

  // Определяем, какой аксессуар рендерить и его абсолютный якорь
  if (has('crown') || has('корон')) {
    element = <HatBase color={color} isSleeping={isSleeping}><CrownAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('halo') || has('нимб')) {
    element = <HatBase color={color} isSleeping={isSleeping}><HaloAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('santa') || has('новогод') || has('санта')) {
    element = <HatBase color={color} isSleeping={isSleeping}><SantaHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('detective') || has('шерлок') || has('детектив')) {
    element = <HatBase color={color} isSleeping={isSleeping}><DetectiveHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('party') || has('празднич')) {
    element = <HatBase color={color} isSleeping={isSleeping}><PartyHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('wizard') || has('волшеб')) {
    element = <HatBase color={color} isSleeping={isSleeping}><WizardHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('top hat') || has('цилиндр')) {
    element = <HatBase color={color} isSleeping={isSleeping}><TopHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('fedora') || has('федора')) {
    element = <HatBase color={color} isSleeping={isSleeping}><FedoraAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('beanie') || has('шапк') || has('шапочк')) {
    element = <HatBase color={color} isSleeping={isSleeping}><BeanieAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('ushanka') || has('ушанк')) {
    element = <HatBase color={color} isSleeping={isSleeping}><UshankaAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('helmet') || has('шлем')) {
    element = <HatBase color={color} isSleeping={isSleeping}><HelmetAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('pirate') || has('пират')) {
    element = <HatBase color={color} isSleeping={isSleeping}><PirateHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('cowboy') || has('ковбой')) {
    element = <HatBase color={color} isSleeping={isSleeping}><CowboyHatAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  } else if (has('hat') || has('шляп')) {
    element = <HatBase color={color} isSleeping={isSleeping}><BeanieAccessory color={color} /></HatBase>;
    anchor = ANCHORS.HEAD;
  }

  else if (has('wings') || has('krylya') || has('крыль')) {
    element = <WingsAccessory color={color} />;
    anchor = ANCHORS.BACK;
  } else if (has('glasses') || has('ochki') || has('очк') || has('очки')) {
    element = <GlassesAccessory color={color} isSleeping={isSleeping} />;
    anchor = ANCHORS.EYES;
  } else if (has('headphones') || has('naushniki') || has('наушник') || has('гарнитур')) {
    element = <HeadphonesAccessory color={color} isSleeping={isSleeping} />;
    anchor = ANCHORS.EYES;
  } else if (has('collar') || has('bell') || has('ошейник') || has('колокольч') || has('колокол')) {
    element = <CollarAccessory color={color} />;
    anchor = ANCHORS.NECK;
  } else if (has('bow') || has('ribbon') || has('bantik') || has('бант') || has('бабочк') || has('бантик')) {
    element = <BowTieAccessory color={color} />;
    anchor = ANCHORS.NECK;
  } else if (has('scarf') || has('sharf') || has('шарф')) {
    element = <ScarfAccessory color={color} />;
    anchor = ANCHORS.NECK;
  } else if (has('boots') || has('slippers') || has('tapochki') || has('sapozhki') || has('тапочк') || has('сапожк') || has('туфл') || has('ботинк')) {
    element = <BootsAccessory color={color} />;
    anchor = ANCHORS.FEET;
  } else if (has('hairpin') || has('заколк') || has('star') || has('звезд') || has('шпильк') || has('заколка')) {
    element = <HairpinAccessory color={color} />;
    anchor = ANCHORS.HAIR;
  }

  if (!element) {
    if (!loggedUnknown.has(value)) {
      loggedUnknown.add(value);
      console.warn(`[RenderAccessory] Неизвестный аксессуар: "${value}"`);
    }
    return null;
  }

  if (skipTransform) {
    return <>{element}</>;
  }

  // Применяем точное масштабирование относительно абсолютного якоря
  return (
    <g transform={`translate(${anchor.x}, ${anchor.y}) scale(${scale}) translate(${-anchor.x}, ${-anchor.y})`}>
      {element}
    </g>
  );
};