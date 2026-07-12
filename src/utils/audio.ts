// Pure Web Audio API Synthesizer for high-fidelity interactive sounds and tactile feedback
let audioCtx: AudioContext | null = null;
let soundsMuted = false;

export function setSoundsMuted(muted: boolean) {
  soundsMuted = muted;
}

export function getSoundsMuted() {
  return soundsMuted;
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Mobile Haptic Feedback Wrapper
export function triggerHaptic(duration: any = 15) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch (e) {
    // Silently ignore if vibrate is blocked
  }
}

export function triggerHapticLight() {
  triggerHaptic(8);
}

export function triggerHapticMedium() {
  triggerHaptic(18);
}

export function triggerHapticHeavy() {
  triggerHaptic(35);
}

export function triggerHapticSuccess() {
  triggerHaptic([12, 40, 12]);
}

export function triggerHapticWarning() {
  triggerHaptic([20, 50, 20]);
}

// 1. Pop It - Ultra-satisfying bubbly fluid pop
export function playPopSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(12);
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Rubber pocket air release snap
    const bubble = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    bubble.type = 'sine';
    // Quick pitch sweep downward for suction release
    bubble.frequency.setValueAtTime(450, now);
    bubble.frequency.exponentialRampToValueAtTime(180, now + 0.04);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.Q.setValueAtTime(8, now);
    
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    bubble.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    bubble.start(now);
    bubble.stop(now + 0.05);
    
    // High frequency click represent plastic/silicone popping
    const highClick = ctx.createOscillator();
    const highGain = ctx.createGain();
    highClick.type = 'triangle';
    highClick.frequency.setValueAtTime(2200, now);
    highClick.frequency.exponentialRampToValueAtTime(900, now + 0.012);
    
    highGain.gain.setValueAtTime(0.05, now);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    
    highClick.connect(highGain);
    highGain.connect(ctx.destination);
    highClick.start(now);
    highClick.stop(now + 0.012);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

// 2. Mechanical Keyboard Click - Real high-end tactile thocky switches
export function playKeyClickSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(10);
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // High frequency transient click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1400, now);
    clickOsc.frequency.exponentialRampToValueAtTime(100, now + 0.015);
    
    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.015);
    
    // Low frequency key housing thock resonance (Cherry MX / Gateron Oil King style)
    const thockOsc = ctx.createOscillator();
    const thockFilter = ctx.createBiquadFilter();
    const thockGain = ctx.createGain();
    
    thockOsc.type = 'triangle';
    thockOsc.frequency.setValueAtTime(320, now);
    thockOsc.frequency.exponentialRampToValueAtTime(110, now + 0.04);
    
    thockFilter.type = 'bandpass';
    thockFilter.frequency.setValueAtTime(450, now);
    thockFilter.Q.setValueAtTime(4, now);
    
    thockGain.gain.setValueAtTime(0.24, now);
    thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    thockOsc.connect(thockFilter);
    thockFilter.connect(thockGain);
    thockGain.connect(ctx.destination);
    
    thockOsc.start(now);
    thockOsc.stop(now + 0.05);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

// 3. Cute synthesized cat Meow & soft purring petting response
export function playPetSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(20);
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Soft high-quality meow voice
    const voice = ctx.createOscillator();
    const vocalGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    voice.type = 'triangle';
    voice.frequency.setValueAtTime(360, now);
    voice.frequency.exponentialRampToValueAtTime(540, now + 0.15);
    voice.frequency.exponentialRampToValueAtTime(320, now + 0.4);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.4);
    filter.Q.setValueAtTime(2.2, now);
    
    vocalGain.gain.setValueAtTime(0.0, now);
    vocalGain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    vocalGain.gain.exponentialRampToValueAtTime(0.08, now + 0.22);
    vocalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    voice.connect(filter);
    filter.connect(vocalGain);
    vocalGain.connect(ctx.destination);
    voice.start(now);
    voice.stop(now + 0.45);
    
    // Warm body purr vibration throat underlay
    const purr = ctx.createOscillator();
    const purrGain = ctx.createGain();
    const purrMod = ctx.createOscillator();
    const purrModGain = ctx.createGain();
    
    purr.type = 'sine';
    purr.frequency.setValueAtTime(45, now);
    
    // Purring rapid throat vibration modulation (24Hz)
    purrMod.type = 'sine';
    purrMod.frequency.setValueAtTime(24, now);
    
    purrModGain.gain.setValueAtTime(0.18, now);
    
    purrGain.gain.setValueAtTime(0.16, now);
    purrGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    purrMod.connect(purrModGain);
    purrModGain.connect(purrGain.gain);
    
    purr.connect(purrGain);
    purrGain.connect(ctx.destination);
    
    purr.start(now);
    purrMod.start(now);
    purr.stop(now + 0.45);
    purrMod.stop(now + 0.45);
  } catch (e) {
    console.warn('Pet sound failed', e);
  }
}

// 4. macOS System Click - Crisp premium tactile sound
export function playMacClickSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(8);
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.015);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.018);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

// 5. Cat Purring - Ambient physical feedback loop
let purrOsc: OscillatorNode | null = null;
let purrMod: OscillatorNode | null = null;
let purrGain: GainNode | null = null;
let purrFilter: BiquadFilterNode | null = null;
let purrIntervalId: any = null;

export function startPurrSound() {
  if (soundsMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (purrOsc) return; // Already running
    
    purrOsc = ctx.createOscillator();
    purrMod = ctx.createOscillator();
    purrGain = ctx.createGain();
    purrFilter = ctx.createBiquadFilter();
    
    purrOsc.type = 'sine';
    purrOsc.frequency.setValueAtTime(28, now); // Warm bass
    
    purrFilter.type = 'lowpass';
    purrFilter.frequency.setValueAtTime(60, now);
    
    // Slow breathing pacing (1.8Hz)
    purrMod.type = 'sine';
    purrMod.frequency.setValueAtTime(1.8, now);
    
    const gainModulator = ctx.createGain();
    gainModulator.gain.setValueAtTime(0.15, now);
    
    purrGain.gain.setValueAtTime(0.28, now);
    
    purrMod.connect(gainModulator);
    gainModulator.connect(purrGain.gain);
    
    purrOsc.connect(purrFilter);
    purrFilter.connect(purrGain);
    purrGain.connect(ctx.destination);
    
    purrOsc.start(now);
    purrMod.start(now);
    
    // Gently pulse haptics on mobile
    purrIntervalId = setInterval(() => {
      if (!purrOsc) {
        clearInterval(purrIntervalId);
        return;
      }
      triggerHaptic(6);
    }, 550);
  } catch (e) {
    console.warn('Purr failed to start', e);
  }
}

export function stopPurrSound() {
  try {
    if (purrIntervalId) {
      clearInterval(purrIntervalId);
      purrIntervalId = null;
    }
    if (purrOsc) {
      purrOsc.stop();
      purrOsc.disconnect();
      purrOsc = null;
    }
    if (purrMod) {
      purrMod.stop();
      purrMod.disconnect();
      purrMod = null;
    }
    if (purrFilter) {
      purrFilter.disconnect();
      purrFilter = null;
    }
    if (purrGain) {
      purrGain.disconnect();
      purrGain = null;
    }
  } catch (e) {
    console.warn('Purr failed to stop', e);
  }
}

// 6. Water splash sound for the fishing mini-game
export function playWaterSplashSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(25);
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // A splash consists of brief bandpass-filtered noise + 2 or 3 droplet bubbles
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(450, now + 0.18);
    noiseFilter.Q.setValueAtTime(4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Add 3 droplet bubble "bloops"
    for (let i = 0; i < 3; i++) {
      const bubbleOsc = ctx.createOscillator();
      const bubbleGain = ctx.createGain();
      const delay = i * 0.035;

      bubbleOsc.type = 'sine';
      const f = 750 + i * 200 + Math.random() * 100;
      bubbleOsc.frequency.setValueAtTime(f, now + delay);
      bubbleOsc.frequency.exponentialRampToValueAtTime(f * 2.1, now + delay + 0.05);

      bubbleGain.gain.setValueAtTime(0.06, now + delay);
      bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

      bubbleOsc.connect(bubbleGain);
      bubbleGain.connect(ctx.destination);
      bubbleOsc.start(now + delay);
      bubbleOsc.stop(now + delay + 0.06);
    }
  } catch (e) {
    console.warn('Splash sound failed', e);
  }
}

// 7. Window zoom-open arpeggio sound
export function playWindowOpenSound() {
  if (soundsMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.06, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.15);
    });
  } catch (e) {
    // ignore
  }
}

// 8. Window minimize/close zoom-down sound
export function playWindowCloseSound() {
  if (soundsMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [1046.50, 783.99, 659.25, 523.25]; // C6, G5, E5, C5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      gain.gain.setValueAtTime(0.05, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.12);
    });
  } catch (e) {
    // ignore
  }
}


