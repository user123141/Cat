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
      scaleY: [0.94, 0.99, 0.94],
      scaleX: [1.02, 0.98, 1.02],
      y: [2, 0, 2],
      transition: {
        duration: 3.0,
        repeat: Infinity,
        ease: 'easeInOut',
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
        animate={status}
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
        <path
          d="M145 140C165 140 175 110 170 90C166 75 155 75 150 85C145 95 155 125 135 145"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500 origin-[135px_145px] animate-pulse-slow"
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
            <path d="M62 48L42 12C40 9 46 14 58 32L62 48Z" fill={color} />
            <path d="M58 44L46 20C45 18 49 22 56 32L58 44Z" fill="#fecdd3" opacity="0.6" />
            {/* Right ear */}
            <path d="M138 48L158 12C160 9 154 14 142 32L138 48Z" fill={color} />
            <path d="M142 44L154 20C155 18 151 22 144 32L142 44Z" fill="#fecdd3" opacity="0.6" />
          </>
        )}

        {/* Eyes */}
        {isSleeping ? (
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

        {/* Accessories (Crown, Ribbon/Collar, Glasses, Top hat, Bow tie, etc.) */}
        {(accessory === 'collar_bell' || (accessory && (accessory.includes('bell') || accessory.includes('collar')))) && (
          <>
            {/* Red Collar */}
            <path d="M72 108C85 116 115 116 128 108" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
            {/* Gold Bell */}
            <circle cx="100" cy="116" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="100" cy="114" r="2" fill="#fff" />
          </>
        )}

        {(accessory === 'gold_crown' || (accessory && (accessory.includes('crown') || accessory.includes('halo')))) && (
          // Little cute gold crown on head
          <path
            d="M82 40L86 24L96 32L100 18L104 32L114 24L118 40H82Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {(accessory === 'cool_glasses' || (accessory && (accessory.includes('glasses') || accessory.includes('headphones')))) && (
          // Black cool sunglasses
          <>
            <path d="M72 70C72 70 78 77 88 72" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
            <path d="M112 72C112 72 118 77 128 70" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
            {/* Glasses frame connector */}
            <line x1="88" y1="71" x2="112" y2="71" stroke="#1e293b" strokeWidth="4" />
            {/* Lens glare reflections */}
            <line x1="76" y1="70" x2="82" y2="74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            <line x1="116" y1="70" x2="122" y2="74" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </>
        )}

        {(accessory === 'wizard_hat' || (accessory && (accessory.includes('hat') || accessory.includes('wings')))) && (
          // Wizard Hat
          <g transform="translate(100, 36) scale(0.95)">
            <path d="M-45 0C-20 -5 20 -5 45 0L0 -60L-45 0Z" fill="#6366f1" />
            <ellipse cx="0" cy="0" rx="48" ry="8" fill="#4f46e5" />
            {/* Gold band */}
            <path d="M-19 -7C-10 -11 10 -11 19 -7L14 -1L-14 -1Z" fill="#fbbf24" />
            {/* Star decal */}
            <path d="M0 -30L2 -25L7 -25L3 -21L5 -16L0 -19L-5 -16L-3 -21L-7 -25L-2 -25Z" fill="#fff" />
          </g>
        )}

        {(accessory === 'bow_tie' || (accessory && (accessory.includes('bow') || accessory.includes('tie') || accessory.includes('scarf') || accessory.includes('ribbon')))) && (
          // Red Bow Tie at chest
          <g transform="translate(100, 114)">
            <path d="M-15 -6L0 0L-15 6V-6Z" fill="#ef4444" />
            <path d="M15 -6L0 0L15 6V-6Z" fill="#ef4444" />
            <circle cx="0" cy="0" r="4.5" fill="#b91c1c" />
          </g>
        )}
      </svg>
      </motion.div>
    </div>
  );
};
