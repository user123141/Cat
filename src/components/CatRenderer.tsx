import React from 'react';
import { motion } from 'motion/react';

interface CatRendererProps {
  breed: string;
  color: string;
  patternColor: string;
  eyeColor: string;
  accessory?: string;
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

  // Secondary awake micro-animations loop
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

  // Dynamic idle speed based on personality
  const getIdleDuration = () => {
    if (personality === 'lazy') return 5.5; // slow breathing
    if (personality === 'playful') return 2.2; // fast breathing
    return 3.5; // default/hungry
  };

  // Framer Motion continuous state animations
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

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* Sparkles / Particles for different statuses */}
      {isSleeping && (
        <div className="absolute top-2 right-4 flex flex-col gap-1 text-purple-400 font-bold text-sm animate-pulse z-20">
          <span className="animate-bounce delay-100 text-xs">Z</span>
          <span className="animate-bounce delay-300 text-sm">z</span>
          <span className="animate-bounce delay-500 text-base">z</span>
        </div>
      )}
      {isBathing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {/* Animated bubbles */}
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
          {/* Toy Ball */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ec4899" />
            <path d="M4 12C8 8 16 8 20 12" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 14C8 18 16 18 20 14" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Main Cat Container with Framer Motion */}
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
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="55" ry="12" fill="rgba(0,0,0,0.06)" />

        {/* Tail */}
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

        {/* Body */}
        {breed === 'Sphynx' ? (
          // Sphynx - Slim body
          <path
            d="M60 160C60 120 70 100 100 100C130 100 140 120 140 160C140 175 130 180 100 180C70 180 60 175 60 160Z"
            fill={color}
          />
        ) : (
          // Fluffy Body for other breeds
          <path
            d="M50 155C50 115 65 95 100 95C135 95 150 115 150 155C150 175 135 180 100 180C65 180 50 175 50 155Z"
            fill={color}
          />
        )}

        {/* Breed Specific Body Patches / Fluff Detail */}
        {breed === 'Siamese' && (
          // Siamese Points (Dark paws and dark tail end, chest point)
          <>
            <path d="M90 125C95 120 105 120 110 125C108 140 92 140 90 125Z" fill={patternColor} />
            {/* Paws */}
            <ellipse cx="75" cy="170" rx="12" ry="8" fill={patternColor} />
            <ellipse cx="125" cy="170" rx="12" ry="8" fill={patternColor} />
          </>
        )}

        {breed !== 'Siamese' && (
          <>
            {/* Normal paws */}
            <ellipse cx="75" cy="172" rx="14" ry="10" fill={color} />
            <ellipse cx="125" cy="172" rx="14" ry="10" fill={color} />
            {/* Paw Pad accents */}
            <ellipse cx="75" cy="174" rx="8" ry="5" fill="rgba(255,255,255,0.15)" />
            <ellipse cx="125" cy="174" rx="8" ry="5" fill="rgba(255,255,255,0.15)" />
          </>
        )}

        {breed === 'British Shorthair' && (
          // Soft body stripes
          <>
            <path d="M55 135H70" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
            <path d="M130 135H145" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
            <path d="M52 145H68" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
            <path d="M132 145H148" stroke={patternColor} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          </>
        )}

        {/* Head */}
        {breed === 'Sphynx' ? (
          // Sphynx - Angular wedge head
          <path
            d="M65 75C65 50 80 40 100 40C120 40 135 50 135 75C135 100 115 108 100 108C85 108 65 100 65 75Z"
            fill={color}
          />
        ) : breed === 'Persian' ? (
          // Persian - Very wide, fluffy round face
          <path
            d="M52 75C52 48 70 36 100 36C130 36 148 48 148 75C148 102 128 106 100 106C72 106 52 102 52 75Z"
            fill={color}
          />
        ) : (
          // Standard / Fold head
          <path
            d="M58 75C58 48 74 38 100 38C126 38 142 48 142 75C142 102 124 104 100 104C76 104 58 102 58 75Z"
            fill={color}
          />
        )}

        {/* Siamese Face Mask */}
        {breed === 'Siamese' && (
          <path
            d="M75 75C75 60 85 52 100 52C115 52 125 60 125 75C125 90 115 95 100 95C85 95 75 90 75 75Z"
            fill={patternColor}
          />
        )}

        {/* Ears */}
        {breed === 'Sphynx' ? (
          // Sphynx - Giant bat ears
          <>
            {/* Left ear */}
            <path
              d="M70 52L25 15C22 12 28 22 45 42L70 52Z"
              fill={color}
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M62 48L32 24C30 22 34 30 46 41L62 48Z" fill="#fda4af" opacity="0.6" /> {/* Pink inside */}
            {/* Right ear */}
            <path
              d="M130 52L175 15C178 12 172 22 155 42L130 52Z"
              fill={color}
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M138 48L168 24C170 22 166 30 154 41L138 48Z" fill="#fda4af" opacity="0.6" />
          </>
        ) : breed === 'Scottish Fold' ? (
          // Folded ears - Pointing downwards on head
          <>
            {/* Left folded ear */}
            <path d="M60 48C56 46 54 50 56 55L68 62L60 48Z" fill={color} />
            <path d="M58 52C56 51 55 52 56 54L64 58L58 52Z" fill="#fecdd3" opacity="0.6" />
            {/* Right folded ear */}
            <path d="M140 48C144 46 146 50 144 55L132 62L140 48Z" fill={color} />
            <path d="M142 52C144 51 145 52 144 54L136 58L142 52Z" fill="#fecdd3" opacity="0.6" />
          </>
        ) : (
          // Standard upright triangles
          <>
            {/* Left ear */}
            <motion.path 
              d="M62 48L42 12C40 9 46 14 58 32L62 48Z" 
              fill={color} 
              animate={awakeAnim === 'ear_twitch' ? { rotate: [0, -10, 0, -10, 0], y: [0, 1, 0] } : {}}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="origin-[58px_48px]"
            />
            <path d="M58 44L46 20C45 18 49 22 56 32L58 44Z" fill="#fecdd3" opacity="0.6" />
            {/* Right ear */}
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

        {/* Eyes */}
        {isSleeping || awakeAnim === 'blinking' ? (
          // Closed sleeping eyes: ^  ^
          <>
            <path
              d="M74 72C78 75 84 75 88 72"
              stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(0,0,0,0.65)'}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M112 72C116 75 122 75 126 72"
              stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(0,0,0,0.65)'}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          // Open big shiny eyes
          <>
            {/* Left Eye background */}
            <circle cx="81" cy="71" r="10.5" fill="#ffffff" />
            <circle cx="81" cy="71" r="8.5" fill={eyeColor} />
            {/* Pupil */}
            {isPlaying ? (
              // Playing: wide dialated circular pupils
              <circle cx="81" cy="71" r="5" fill="#1e293b" />
            ) : (
              // Elegant slit/oval pupil
              <ellipse cx="81" cy="71" rx="2.5" ry="5.5" fill="#1e293b" />
            )}
            {/* Highlights */}
            <circle cx="78" cy="67" r="2.5" fill="#ffffff" />
            <circle cx="84" cy="73" r="1" fill="#ffffff" />

            {/* Right Eye background */}
            <circle cx="119" cy="71" r="10.5" fill="#ffffff" />
            <circle cx="119" cy="71" r="8.5" fill={eyeColor} />
            {/* Pupil */}
            {isPlaying ? (
              <circle cx="119" cy="71" r="5" fill="#1e293b" />
            ) : (
              <ellipse cx="119" cy="71" rx="2.5" ry="5.5" fill="#1e293b" />
            )}
            {/* Highlights */}
            <circle cx="116" cy="67" r="2.5" fill="#ffffff" />
            <circle cx="122" cy="73" r="1" fill="#ffffff" />
          </>
        )}

        {/* Blush cheeks */}
        {!isSleeping && (
          <>
            <circle cx="70" cy="79" r="6" fill="#fda4af" opacity="0.5" />
            <circle cx="130" cy="79" r="6" fill="#fda4af" opacity="0.5" />
          </>
        )}

        {/* Cute flat snout for Persian, normal nose for others */}
        <path
          d={breed === 'Persian' ? 'M97 76L103 76L100 78Z' : 'M96 76L104 76L100 79Z'}
          fill="#fda4af"
          stroke="#f43f5e"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Mouth */}
        {isEating ? (
          // Open chewing mouth
          <ellipse cx="100" cy="86" rx="4" ry="5" fill="#f43f5e" />
        ) : (
          // Cute double curve: 3
          <path
            d="M93 82C95 85 99 85 100 82C101 85 105 85 107 82"
            stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(0,0,0,0.65)'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {/* Whiskers */}
        <>
          {/* Left Whiskers */}
          <line
            x1="56"
            y1="82"
            x2="32"
            y2="78"
            stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="54"
            y1="89"
            x2="28"
            y2="89"
            stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Right Whiskers */}
          <line
            x1="144"
            y1="82"
            x2="168"
            y2="78"
            stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="146"
            y1="89"
            x2="172"
            y2="89"
            stroke={breed === 'Siamese' ? '#1e293b' : 'rgba(120,120,120,0.45)'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>

        {/* Accessories Rendering */}
        {(() => {
          if (!accessory) return null;
          
          const getAccessoryColor = (acc: string) => {
            const accLower = acc.toLowerCase();
            if (accLower.includes('розов') || accLower.includes('pink')) return '#ec4899';
            if (accLower.includes('син') || accLower.includes('blue')) return '#3b82f6';
            if (accLower.includes('зелен') || accLower.includes('изумруд') || accLower.includes('green') || accLower.includes('emerald')) return '#10b981';
            if (accLower.includes('янт') || accLower.includes('желт') || accLower.includes('amber') || accLower.includes('yellow')) return '#f59e0b';
            if (accLower.includes('амет') || accLower.includes('фиолет') || accLower.includes('purple')) return '#a855f7';
            if (accLower.includes('малин')) return '#e11d48';
            if (accLower.includes('бир') || accLower.includes('cyan')) return '#06b6d4';
            if (accLower.includes('оранж') || accLower.includes('orange')) return '#ea580c';
            return '#ef4444'; // default red
          };

          const colorHex = getAccessoryColor(accessory);

          return (
            <>
              {/* 1. Collar & Bell */}
              {(accessory === 'collar_bell' || accessory.includes('bell') || accessory.includes('collar')) && (
                <>
                  {/* Collar */}
                  <path d="M72 108C85 116 115 116 128 108" stroke={colorHex} strokeWidth="8" strokeLinecap="round" />
                  {/* Gold Bell */}
                  <circle cx="100" cy="116" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                  <circle cx="100" cy="114" r="2" fill="#fff" />
                </>
              )}

              {/* 2. Gold Crown */}
              {accessory.includes('crown') && (
                <path
                  d="M82 40L86 24L96 32L100 18L104 32L114 24L118 40H82Z"
                  fill="#fbbf24"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}

              {/* 3. Halo (Нимб) */}
              {accessory.includes('halo') && (
                <g transform="translate(100, 15)">
                  <ellipse cx="0" cy="0" rx="24" ry="6" fill="none" stroke="#fef08a" strokeWidth="4" opacity="0.9" />
                  <line x1="0" y1="3" x2="0" y2="15" stroke="#fef08a" strokeWidth="1.5" opacity="0.5" />
                </g>
              )}

              {/* 4. Cool Glasses */}
              {accessory.includes('glasses') && (
                <>
                  <path d="M72 70C72 70 78 77 88 72" stroke={colorHex} strokeWidth="8" strokeLinecap="round" />
                  <path d="M112 72C112 72 118 77 128 70" stroke={colorHex} strokeWidth="8" strokeLinecap="round" />
                  {/* Glasses frame connector */}
                  <line x1="88" y1="71" x2="112" y2="71" stroke={colorHex} strokeWidth="4" />
                  {/* Lens glare reflections */}
                  <line x1="76" y1="70" x2="82" y2="74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                  <line x1="116" y1="70" x2="122" y2="74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                </>
              )}

              {/* 5. Headphones (Геймерские наушники) */}
              {accessory.includes('headphones') && (
                <g transform="translate(100, 52)">
                  {/* Arch */}
                  <path d="M-36 -12C-36 -42 36 -42 36 -12" fill="none" stroke={colorHex} strokeWidth="5" />
                  {/* Left Cup */}
                  <g transform="translate(-36, -10)">
                    <rect x="-8" y="-12" width="16" height="24" rx="6" fill={colorHex} />
                    <circle cx="-2" cy="0" r="4" fill="#ffffff" opacity="0.3" />
                    {/* Cat ear detail */}
                    <path d="M-8 -12L-14 -22L-2 -12Z" fill={colorHex} />
                  </g>
                  {/* Right Cup */}
                  <g transform="translate(36, -10)">
                    <rect x="-8" y="-12" width="16" height="24" rx="6" fill={colorHex} />
                    <circle cx="2" cy="0" r="4" fill="#ffffff" opacity="0.3" />
                    {/* Cat ear detail */}
                    <path d="M8 -12L14 -22L2 -12Z" fill={colorHex} />
                  </g>
                </g>
              )}

              {/* 6. Scarf (Теплый Шарф) */}
              {accessory.includes('scarf') && (
                <g transform="translate(100, 112)">
                  <path d="M-32 -4C-15 4 15 4 32 -4C36 4 32 10 24 10C8 10 -8 10 -24 10C-32 10 -36 4 -32 -4Z" fill={colorHex} />
                  <path d="M12 4L22 28C22 30 18 32 14 32C10 32 6 30 6 28L10 4" fill={colorHex} />
                  <line x1="10" y1="32" x2="10" y2="35" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
                  <line x1="14" y1="32" x2="14" y2="35" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
                  <line x1="18" y1="32" x2="18" y2="35" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
                </g>
              )}

              {/* 7. Bow Tie / Ribbon */}
              {(accessory.includes('bow_tie') || accessory.includes('ribbon') || accessory.includes('bow') || accessory.includes('tie')) && (
                <g transform="translate(100, 114)">
                  <path d="M-15 -6L0 0L-15 6V-6Z" fill={colorHex} />
                  <path d="M15 -6L0 0L15 6V-6Z" fill={colorHex} />
                  <circle cx="0" cy="0" r="4.5" fill="#b91c1c" />
                </g>
              )}

              {/* 8. Fairy Wings (Крылья Бабочки) */}
              {accessory.includes('wings') && (
                <g transform="translate(100, 120)" opacity="0.8">
                  {/* Left Wing */}
                  <path d="M-28 -15C-65 -45 -85 -10 -55 10C-40 20 -30 10 -28 5" fill={colorHex} stroke="#ffffff" strokeWidth="1.5" />
                  <path d="M-28 5C-55 20 -65 35 -48 45C-35 52 -28 35 -28 25" fill={colorHex} opacity="0.8" />
                  {/* Right Wing */}
                  <path d="M28 -15C65 -45 85 -10 55 10C40 20 30 10 28 5" fill={colorHex} stroke="#ffffff" strokeWidth="1.5" />
                  <path d="M28 5C55 20 65 35 48 45C35 52 28 35 28 25" fill={colorHex} opacity="0.8" />
                </g>
              )}

              {/* 9. Boots / Slippers (Тапочки) */}
              {(accessory.includes('boots') || accessory.includes('slippers')) && (
                <g>
                  {/* Left Boot */}
                  <g transform="translate(75, 172)">
                    <ellipse cx="0" cy="2" rx="14" ry="10" fill={colorHex} />
                    <path d="M-6 -2C-6 -2 -4 -12 0 -12C4 -12 6 -2 6 -2" stroke={colorHex} strokeWidth="5" strokeLinecap="round" />
                    <ellipse cx="0" cy="-10" rx="9" ry="3" fill="#ffffff" />
                  </g>
                  {/* Right Boot */}
                  <g transform="translate(125, 172)">
                    <ellipse cx="0" cy="2" rx="14" ry="10" fill={colorHex} />
                    <path d="M-6 -2C-6 -2 -4 -12 0 -12C4 -12 6 -2 6 -2" stroke={colorHex} strokeWidth="5" strokeLinecap="round" />
                    <ellipse cx="0" cy="-10" rx="9" ry="3" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* 10. Star hairpin (Звездная Заколка) */}
              {accessory.includes('star') && (
                <g transform="translate(122, 40) rotate(15)">
                  <path d="M0 -10L3 -3L10 -3L5 1L7 8L0 4L-7 8L-5 1L-10 -3L-3 -3Z" fill="#fbcfe8" stroke="#ec4899" strokeWidth="1" />
                  <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                </g>
              )}

              {/* 11. Hats */}
              {/* Santa Hat */}
              {(accessory.includes('santa_hat') || accessory.includes('santa')) && (
                <g transform="translate(100, 36) scale(0.9)">
                  <path d="M-28 0L-10 -35L18 -42L25 -30L20 0Z" fill="#ef4444" />
                  <circle cx="24" cy="-38" r="8" fill="#ffffff" />
                  <ellipse cx="0" cy="0" rx="32" ry="7" fill="#ffffff" />
                </g>
              )}

              {/* Detective Hat */}
              {(accessory.includes('detective_hat') || accessory.includes('detective')) && (
                <g transform="translate(100, 32) scale(0.9)">
                  <path d="M-36 0C-36 -30 36 -30 36 0Z" fill="#a1a1aa" stroke="#71717a" strokeWidth="1" />
                  <ellipse cx="0" cy="0" rx="42" ry="6" fill="#71717a" />
                  <path d="M-34 -4C-20 -7 20 -7 34 -4L32 1L-32 1Z" fill="#18181b" />
                </g>
              )}

              {/* Party Hat */}
              {(accessory.includes('party_hat') || accessory.includes('party')) && (
                <g transform="translate(100, 34) scale(0.9)">
                  <path d="M-20 0L0 -45L20 0Z" fill="#f43f5e" />
                  <path d="M-13 -15L5 -20L10 -15L-6 -10Z" fill="#fbbf24" />
                  <path d="M-7 -30L2 -32L5 -28L-4 -26Z" fill="#fbbf24" />
                  <circle cx="0" cy="-45" r="5" fill="#3b82f6" />
                  <ellipse cx="0" cy="0" rx="22" ry="4" fill="#fbbf24" />
                </g>
              )}

              {/* Wizard Hat */}
              {accessory.includes('wizard_hat') && (
                <g transform="translate(100, 36) scale(0.95)">
                  <path d="M-45 0C-20 -5 20 -5 45 0L0 -60L-45 0Z" fill="#6366f1" />
                  <ellipse cx="0" cy="0" rx="48" ry="8" fill="#4f46e5" />
                  <path d="M-19 -7C-10 -11 10 -11 19 -7L14 -1L-14 -1Z" fill="#fbbf24" />
                  <path d="M0 -30L2 -25L7 -25L3 -21L5 -16L0 -19L-5 -16L-3 -21L-7 -25L-2 -25Z" fill="#fff" />
                </g>
              )}

              {/* Standard cylinder/hat */}
              {(accessory.includes('hat_') || accessory.includes('cylinder')) && (
                <g transform="translate(100, 34) scale(0.9)">
                  <rect x="-24" y="-35" width="48" height="35" fill={colorHex} />
                  <rect x="-24" y="-7" width="48" height="7" fill="#1e293b" />
                  <ellipse cx="0" cy="0" rx="36" ry="6" fill={colorHex} />
                </g>
              )}
            </>
          );
        })()}
      </svg>
      </motion.div>
    </div>
  );
};
