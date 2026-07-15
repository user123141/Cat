// src/components/NeedsCatRenderer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { RenderAccessory } from '../utils/renderAccessories';

interface NeedsCatRendererProps {
  status: 'idle' | 'eating' | 'sleeping' | 'playing' | 'bathing' | string;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  breed?: string;
  color?: string;
  patternColor?: string;
  eyeColor?: string;
  hat?: string;
  glasses?: string;
  collar?: string;
  scarf?: string;
  boots?: string;
  wings?: string;
  accessory?: string;
  size?: number;
}

export const NeedsCatRenderer: React.FC<NeedsCatRendererProps> = ({
  status,
  hunger,
  happiness,
  cleanliness,
  energy,
  breed = 'Standard',
  color = '#ffccd5',
  patternColor = '#ff85a1',
  eyeColor = '#0ea5e9',
  hat,
  glasses,
  collar,
  scarf,
  boots,
  wings,
  accessory,
  size = 100,
}) => {
  const isSleeping = status === 'sleeping';
  const isSad = happiness < 35 || hunger < 35 || cleanliness < 35;
  const isDirty = cleanliness < 35;
  const isHungry = hunger < 35;

  const [activity, setActivity] = useState<'idle' | 'blinking' | 'tail_flick' | 'ear_twitch'>('idle');
  const rafIdRef = useRef<number | null>(null);
  const lastStateChangeRef = useRef<number>(0);
  const stateDurationRef = useRef<number>(2000);

  useEffect(() => {
    if (isSleeping) {
      setActivity('idle');
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (!lastStateChangeRef.current) lastStateChangeRef.current = timestamp;

      const elapsed = timestamp - lastStateChangeRef.current;
      if (elapsed > stateDurationRef.current) {
        const rand = Math.random();
        if (rand < 0.4) {
          setActivity('blinking');
          stateDurationRef.current = 150;
        } else if (rand < 0.7) {
          setActivity('tail_flick');
          stateDurationRef.current = 500;
        } else if (rand < 0.9) {
          setActivity('ear_twitch');
          stateDurationRef.current = 350;
        } else {
          setActivity('idle');
          stateDurationRef.current = 1500 + Math.random() * 1500;
        }
        lastStateChangeRef.current = timestamp;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastStateChangeRef.current = performance.now();
        stateDurationRef.current = 1000;
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(loop);
        }
      } else {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isSleeping]);

  let tailRotate = 0;
  if (!isSleeping) {
    if (activity === 'tail_flick') {
      tailRotate = 18;
    } else if (isSad) {
      tailRotate = -10;
    }
  }

  let earRotateLeft = 0;
  let earRotateRight = 0;
  if (activity === 'ear_twitch') {
    earRotateLeft = -12;
  }

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
      <g key={idx} transform="translate(50, 50) scale(0.5)">
        <RenderAccessory value={item} scale={1} />
      </g>
    ));
  };

  if (isSleeping) {
    // We no longer return a completely different, accessory-less static cat.
    // Instead, we let the unified renderer below handle the sleeping state with closed eyes,
    // so accessories, breeds, custom colors, and markings are perfectly preserved!
  }

  return (
    <div style={{ width: size, height: size }} className={`relative flex items-center justify-center ${isSleeping ? 'animate-pulse' : ''}`}>
      {isSad && !isSleeping && (
        <span className="absolute top-0.5 left-0.5 text-[9px] animate-bounce">
          {isDirty ? '🧼' : isHungry ? '🍗' : '💔'}
        </span>
      )}
      {isSleeping && (
        <div className="absolute top-1 right-2 flex flex-col text-[8px] font-bold text-sky-400 select-none z-20">
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>Z</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>z</span>
          <span className="animate-bounce" style={{ animationDelay: '0.7s' }}>z</span>
        </div>
      )}

      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="85" rx="25" ry="5" fill="rgba(0,0,0,0.08)" />

        <path
          d="M72 70C82 70 87 55 85 45C83 37 77 37 75 42C72 47 77 62 67 72"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          style={{
            transform: `rotate(${tailRotate}deg)`,
            transformOrigin: '67px 72px',
            transition: 'transform 0.15s ease-out'
          }}
        />

        <path d="M25 78C25 58 32 48 50 48C68 48 75 58 75 78C75 88 68 90 50 90C32 90 25 88 25 78Z" fill={color} />
        <ellipse cx="37" cy="86" rx="7" ry="5" fill={color} />
        <ellipse cx="63" cy="86" rx="7" ry="5" fill={color} />

        <path d="M29 38C29 24 37 19 50 19C63 19 71 24 71 38C71 51 62 52 50 52C38 52 29 51 29 38Z" fill={color} />

        <path
          d="M31 24L21 6C20 4 23 6 29 15L31 24Z"
          fill={color}
          style={{
            transform: `rotate(${earRotateLeft}deg)`,
            transformOrigin: '29px 24px',
            transition: 'transform 0.1s ease-out'
          }}
        />
        <path
          d="M69 24L79 6C80 4 77 6 71 15L69 24Z"
          fill={color}
          style={{
            transform: `rotate(${earRotateRight}deg)`,
            transformOrigin: '69px 24px',
            transition: 'transform 0.1s ease-out'
          }}
        />

        {isSleeping || activity === 'blinking' ? (
          <>
            <path d="M37 36C39 37.5 41 37.5 43 36" stroke="rgba(0,0,0,0.7)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M57 36C59 37.5 61 37.5 63 36" stroke="rgba(0,0,0,0.7)" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : isSad ? (
          <>
            <path d="M35 34L45 36" stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M65 34L55 36" stroke="rgba(0,0,0,0.6)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="39" r="3" fill="#1e293b" />
            <circle cx="60" cy="39" r="3" fill="#1e293b" />
          </>
        ) : (
          <>
            <circle cx="40" cy="37" r="5" fill="#fff" />
            <circle cx="40" cy="37" r="4" fill={eyeColor} />
            <circle cx="40" cy="37" r="2.5" fill="#1e293b" />
            <circle cx="38.5" cy="35" r="1" fill="#fff" />

            <circle cx="60" cy="37" r="5" fill="#fff" />
            <circle cx="60" cy="37" r="4" fill={eyeColor} />
            <circle cx="60" cy="37" r="2.5" fill="#1e293b" />
            <circle cx="58.5" cy="35" r="1" fill="#fff" />
          </>
        )}

        <circle cx="34" cy="42" r="3" fill="#fda4af" opacity="0.6" />
        <circle cx="66" cy="42" r="3" fill="#fda4af" opacity="0.6" />

        <path d="M48 41L52 41L50 43Z" fill="#fda4af" stroke="#f43f5e" strokeWidth="0.5" />

        {isSad ? (
          <path d="M47 47C48 45.5 52 45.5 53 47" stroke="rgba(0,0,0,0.7)" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M47 45C48 46.5 50 46.5 50 45C50 46.5 52 46.5 53 45" stroke="rgba(0,0,0,0.7)" strokeWidth="2" strokeLinecap="round" />
        )}

        {renderAccessories()}
      </svg>
    </div>
  );
};