// src/components/CatRenderer.tsx
import React from 'react';
import { motion } from 'motion/react';
import { RenderAccessory } from '../utils/renderAccessories';

interface CatRendererProps {
  breed: string;
  color: string;
  patternColor: string;
  eyeColor: string;
  accessory?: string;
  hat?: string;
  glasses?: string;
  collar?: string;
  scarf?: string;
  boots?: string;
  wings?: string;
  status: 'idle' | 'eating' | 'sleeping' | 'playing' | 'bathing';
  size?: number;
  className?: string;
  personality?: 'lazy' | 'playful' | 'hungry';
}

export const CatRenderer: React.FC<CatRendererProps> = ({
  breed,
  color,
  patternColor,
  eyeColor,
  accessory,
  hat,
  glasses,
  collar,
  scarf,
  boots,
  wings,
  status,
  size = 200,
  className = '',
  personality = 'lazy',
}) => {
  const [randomStatus, setRandomStatus] = React.useState<typeof status>(status);
  const [awakeAnim, setAwakeAnim] = React.useState<'none' | 'blinking' | 'tail_flick' | 'ear_twitch'>('none');

  React.useEffect(() => {
    if (status === 'sleeping') {
      setRandomStatus('sleeping');
      setAwakeAnim('none');
      return;
    }
    if (status !== 'idle') {
      setRandomStatus(status);
      setAwakeAnim('none');
      return;
    }
    setRandomStatus('idle');

    const interval = setInterval(() => {
      const activities: (typeof status)[] = ['idle', 'playing', 'bathing', 'eating'];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      setRandomStatus(randomActivity);
    }, 4500);
    return () => clearInterval(interval);
  }, [status]);

  React.useEffect(() => {
    if (status === 'sleeping') {
      setAwakeAnim('none');
      return;
    }
    const microAnimInterval = setInterval(() => {
      const anims: ('blinking' | 'tail_flick' | 'ear_twitch' | 'none')[] = ['blinking', 'tail_flick', 'ear_twitch', 'none'];
      const nextAnim = anims[Math.floor(Math.random() * anims.length)];
      setAwakeAnim(nextAnim);
      setTimeout(() => {
        setAwakeAnim('none');
      }, 1000);
    }, 3500);
    return () => clearInterval(microAnimInterval);
  }, [status]);

  const isSleeping = status === 'sleeping';
  const isEating = status === 'eating';
  const isPlaying = status === 'playing';
  const isBathing = status === 'bathing';

  const getIdleDuration = () => {
    if (personality === 'lazy') return 5.5;
    if (personality === 'playful') return 2.2;
    return 3.5;
  };

  const animationVariants = {
    idle: {
      scaleY: [0.98, 1.01, 0.98],
      scaleX: [1.01, 0.99, 1.01],
      y: [0, -3, 0],
      transition: {
        duration: getIdleDuration(),
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    sleeping: {
      scaleY: 0.94,
      scaleX: 1.02,
      y: 2,
      transition: {
        duration: 0,
      },
    },
    eating: {
      y: [0, -6, 0],
      scaleY: [1.0, 0.94, 1.0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    playing: {
      y: [0, -25, 0],
      scaleY: [1.0, 1.15, 0.9, 1.0],
      scaleX: [1.0, 0.88, 1.12, 1.0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    bathing: {
      rotate: [-5, 5, -5],
      y: [0, -4, 0],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

const renderAccessories = () => {
  const items = [];
  if (hat) items.push(hat);
  if (glasses) items.push(glasses);
  if (collar) items.push(collar);
  if (scarf) items.push(scarf);
  if (boots) items.push(boots);
  if (wings) items.push(wings);
  if (accessory && !items.includes(accessory)) items.push(accessory);
  return items.map((item, idx) => (
    <g key={idx} transform="translate(100, 100)">
      <RenderAccessory value={item} scale={1} />
    </g>
  ));
};

  return (
    <div style={{ width: size, height: size }} className={`relative flex items-center justify-center select-none ${className}`}>
      {isSleeping && (
        <div className="absolute top-2 right-4 flex flex-col gap-1 text-purple-400 font-bold text-sm animate-pulse z-20">
          <span className="animate-bounce delay-100 text-xs">Z</span>
          <span className="animate-bounce delay-300 text-sm">z</span>
          <span className="animate-bounce delay-500 text-base">z</span>
        </div>
      )}
      {isBathing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="absolute bottom-2 left-4 w-4 h-4 bg-sky-200/40 border border-sky-300/60 rounded-full animate-bounce [animation-duration:1.5s]"></div>
          <div className="absolute bottom-8 right-6 w-3 h-3 bg-sky-100/50 border border-sky-200/70 rounded-full animate-bounce [animation-duration:2.2s] [animation-delay:0.3s]"></div>
          <div className="absolute top-6 left-8 w-5 h-5 bg-sky-200/30 border border-sky-300/50 rounded-full animate-bounce [animation-duration:1.8s] [animation-delay:0.6s]"></div>
        </div>
      )}
      {isEating && (
        <div className="absolute bottom-4 right-2 pointer-events-none flex gap-1 z-20">
          <div className="w-2 h-2 bg-amber-700/80 rounded-full animate-ping"></div>
          <div className="w-1.5 h-1.5 bg-amber-600/75 rounded-full animate-bounce delay-200"></div>
        </div>
      )}
      {isPlaying && (
        <div className="absolute bottom-2 left-2 animate-spin [animation-duration:3s] z-20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ec4899" />
            <path d="M4 12C8 8 16 8 20 12" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 14C8 18 16 18 20 14" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <motion.div
        variants={animationVariants}
        animate={randomStatus}
        initial="idle"
        whileTap={{
          scale: 0.9,
          scaleY: 0.85,
          scaleX: 1.05,
          transition: { type: 'spring', stiffness: 500, damping: 15 },
        }}
        className="w-full h-full flex items-center justify-center origin-bottom"
      >
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="175" rx="55" ry="12" fill="rgba(0,0,0,0.06)" />

          <motion.path
            d="M145 140C165 140 175 110 170 90C166 75 155 75 150 85C145 95 155 125 135 145"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500 origin-[135px_145px]"
            animate={awakeAnim === 'tail_flick' ? { rotate: [0, 15, -10, 15, 0] } : { rotate: [0, 3, 0] }}
            transition={awakeAnim === 'tail_flick' ? { duration: 0.8, ease: 'easeInOut' } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {breed === 'Sphynx' ? (
            <path d="M60 160C60 120 70 100 100 100C130 100 140 120 140 160C140 175 130 180 100 180C70 180 60 175 60 160Z" fill={color} />
          ) : (
            <path d="M50 155C50 115 65 95 100 95C135 95 150 115 150 155C150 175 135 180 100 180C65 180 50 175 50 155Z" fill={color} />
          )}

          {breed === 'Siamese' && (
            <>
              <path d="M90 125C95 120 105 120 110 125C108 140 92 140 90 125Z" fill={patternColor} />
              <ellipse cx="75" cy="170" rx="12" ry="8" fill={patternColor} />
              <ellipse cx="125" cy="170" rx="12" ry="8" fill={patternColor} />
            </>
          )}

          {breed !== 'Siamese' && (
            <>
              <ellipse cx="75" cy="172" rx="14" ry="10" fill={color} />
              <ellipse cx="125" cy="172" rx="14" ry="10" fill={color} />
              <ellipse cx="75" cy="174" rx="8" ry="5" fill="rgba(255,255,255,0.15)" />
              <ellipse cx="125" cy="174" rx="8" ry="5" fill="rgba(255,255,255,0.15)" />
            </>
          )}

          {breed === 'British Shorthair' && (
            <>
              <path d="M55 135H70" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
              <path d="M130 135H145" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
              <path d="M52 145H68" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
              <path d="M132 145H148" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
            </>
          )}

          {breed === 'Sphynx' ? (
            <path d="M65 75C65 50 80 40 100 40C120 40 135 50 135 75C135 100 115 108 100 108C85 108 65 100 65 75Z" fill={color} />
          ) : breed === 'Persian' ? (
            <path d="M52 75C52 48 70 36 100 36C130 36 148 48 148 75C148 102 128 106 100 106C72 106 52 102 52 75Z" fill={color} />
          ) : (
            <path d="M58 75C58 48 74 38 100 38C126 38 142 48 142 75C142 102 124 104 100 104C76 104 58 102 58 75Z" fill={color} />
          )}

          {breed === 'Siamese' && (
            <path d="M75 75C75 60 85 52 100 52C115 52 125 60 125 75C125 90 115 95 100 95C85 95 75 90 75 75Z" fill={patternColor} />
          )}

          {breed === 'Sphynx' ? (
            <>
              <path d="M70 52L25 15C22 12 28 22 45 42L70 52Z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
              <path d="M62 48L32 24C30 22 34 30 46 41L62 48Z" fill="#fda4af" opacity="0.6" />
              <path d="M130 52L175 15C178 12 172 22 155 42L130 52Z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
              <path d="M138 48L168 24C170 22 166 30 154 41L138 48Z" fill="#fda4af" opacity="0.6" />
            </>
          ) : breed === 'Scottish Fold' ? (
            <>
              <path d="M60 48C56 46 54 50 56 55L68 62L60 48Z" fill={color} />
              <path d="M58 52C56 51 55 52 56 54L64 58L58 52Z" fill="#fecdd3" opacity="0.6" />
              <path d="M140 48C144 46 146 50 144 55L132 62L140 48Z" fill={color} />
              <path d="M142 52C144 51 145 52 144 54L136 58L142 52Z" fill="#fecdd3" opacity="0.6" />
            </>
          ) : (
            <>
              <motion.path
                d="M62 48L42 12C40 9 46 14 58 32L62 48Z"
                fill={color}
                animate={awakeAnim === 'ear_twitch' ? { rotate: [0, -10, 0, -10, 0], y: [0, 1, 0] } : {}}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="origin-[58px_48px]"
              />
              <path d="M58 44L46 20C45 18 49 22 56 32L58 44Z" fill="#fecdd3" opacity="0.6" />
              <motion.path
                d="M138 48L158 12C160 9 154 14 142 32L138 48Z"
                fill={color}
                animate={awakeAnim === 'ear_twitch' ? { rotate: [0, 10, 0, 10, 0], y: [0, 1, 0] } : {}}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="origin-[138px_48px]"
              />
              <path d="M142 44L154 20C155 18 151 22 144 32L142 44Z" fill="#fecdd3" opacity="0.6" />
            </>
          )}

          {isSleeping || awakeAnim === 'blinking' ? (
            <>
              <path d="M74 72C78 75 84 75 88 72" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(0,0,0,0.65)'} strokeWidth="4.5" strokeLinecap="round" />
              <path d="M112 72C116 75 122 75 126 72" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(0,0,0,0.65)'} strokeWidth="4.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="81" cy="71" r="10.5" fill="#ffffff" />
              <circle cx="81" cy="71" r="8.5" fill={eyeColor} />
              {isPlaying ? (
                <circle cx="81" cy="71" r="5" fill="#1e293b" />
              ) : (
                <ellipse cx="81" cy="71" rx="2.5" ry="5.5" fill="#1e293b" />
              )}
              <circle cx="78" cy="67" r="2.5" fill="#ffffff" />
              <circle cx="84" cy="73" r="1" fill="#ffffff" />

              <circle cx="119" cy="71" r="10.5" fill="#ffffff" />
              <circle cx="119" cy="71" r="8.5" fill={eyeColor} />
              {isPlaying ? (
                <circle cx="119" cy="71" r="5" fill="#1e293b" />
              ) : (
                <ellipse cx="119" cy="71" rx="2.5" ry="5.5" fill="#1e293b" />
              )}
              <circle cx="116" cy="67" r="2.5" fill="#ffffff" />
              <circle cx="122" cy="73" r="1" fill="#ffffff" />
            </>
          )}

          {!isSleeping && (
            <>
              <circle cx="70" cy="79" r="6" fill="#fda4af" opacity="0.5" />
              <circle cx="130" cy="79" r="6" fill="#fda4af" opacity="0.5" />
            </>
          )}

          <path d={breed === 'Persian' ? 'M97 76L103 76L100 78Z' : 'M96 76L104 76L100 79Z'} fill="#fda4af" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" />

          {isEating ? (
            <ellipse cx="100" cy="86" rx="4" ry="5" fill="#f43f5e" />
          ) : (
            <path d="M93 82C95 85 99 85 100 82C101 85 105 85 107 82" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(0,0,0,0.65)'} strokeWidth="3.5" strokeLinecap="round" />
          )}

          <>
            <line x1="56" y1="82" x2="32" y2="78" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'} strokeWidth="2" strokeLinecap="round" />
            <line x1="54" y1="89" x2="28" y2="89" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'} strokeWidth="2" strokeLinecap="round" />
            <line x1="144" y1="82" x2="168" y2="78" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'} strokeWidth="2" strokeLinecap="round" />
            <line x1="146" y1="89" x2="172" y2="89" stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'} strokeWidth="2" strokeLinecap="round" />
          </>

          {renderAccessories()}
        </svg>
      </motion.div>
    </div>
  );
};