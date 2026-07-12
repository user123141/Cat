// Максимально естественные, низкие, тёплые звуки
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

// Haptic
export function triggerHaptic(duration: any = 15) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch (e) {}
}
export function triggerHapticLight() { triggerHaptic(8); }
export function triggerHapticMedium() { triggerHaptic(18); }
export function triggerHapticHeavy() { triggerHaptic(35); }
export function triggerHapticSuccess() { triggerHaptic([12, 40, 12]); }
export function triggerHapticWarning() { triggerHaptic([20, 50, 20]); }

// ---------- 1. POP (лопающийся пузырёк) — мягкий хлопок с низким резонансом ----------
export function playPopSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(12);
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Шумовой хлопок с низкочастотным фильтром
    const bufferSize = Math.floor(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.05);

    // Мягкий низкий звон (для пузырьковости)
    const osc = ctx.createOscillator();
    const gainOsc = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    gainOsc.gain.setValueAtTime(0.03, now);
    gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gainOsc);
    gainOsc.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {}
}

// ---------- 2. KEYBOARD (механический клик) — с низким "thump" ----------
export function playKeyClickSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(10);
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ударный шум (короткий)
    const bufferSize = Math.floor(ctx.sampleRate * 0.012);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.012);

    // Низкий "thump" (корпус)
    const osc = ctx.createOscillator();
    const gainOsc = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.035);
    gainOsc.gain.setValueAtTime(0.06, now);
    gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gainOsc);
    gainOsc.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  } catch (e) {}
}

// ---------- 3. PET (мяуканье + мурлыканье) — очень мягкое ----------
export function playPetSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(20);
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Мяу — плавное изменение частоты, низкий старт
    const voice = ctx.createOscillator();
    const gainVoice = ctx.createGain();
    voice.type = 'sine';
    voice.frequency.setValueAtTime(280, now);
    voice.frequency.linearRampToValueAtTime(480, now + 0.15);
    voice.frequency.linearRampToValueAtTime(260, now + 0.4);

    // Фильтр для смягчения
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.4);

    gainVoice.gain.setValueAtTime(0, now);
    gainVoice.gain.linearRampToValueAtTime(0.08, now + 0.06);
    gainVoice.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    voice.connect(filter);
    filter.connect(gainVoice);
    gainVoice.connect(ctx.destination);
    voice.start(now);
    voice.stop(now + 0.4);

    // Мурлыканье — очень низкое, без вибрато
    const purr = ctx.createOscillator();
    const gainPurr = ctx.createGain();
    purr.type = 'sine';
    purr.frequency.setValueAtTime(32, now);
    gainPurr.gain.setValueAtTime(0.05, now);
    gainPurr.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    purr.connect(gainPurr);
    gainPurr.connect(ctx.destination);
    purr.start(now);
    purr.stop(now + 0.6);
  } catch (e) {}
}

// ---------- 4. MAC CLICK (короткий щелчок) ----------
export function playMacClickSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(8);
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.015);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.015);
  } catch (e) {}
}

// ---------- 5. PURR (длительное мурчание) — очень низкое, с мягким вибрато ----------
let purrOsc: OscillatorNode | null = null;
let purrGain: GainNode | null = null;
let purrLFO: OscillatorNode | null = null;
let purrLFOGain: GainNode | null = null;
let purrIntervalId: any = null;

export function startPurrSound() {
  if (soundsMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    if (purrOsc) return;

    purrOsc = ctx.createOscillator();
    purrOsc.type = 'sine';
    purrOsc.frequency.setValueAtTime(28, now);

    // LFO для лёгкого вибрато (2.5 Гц, амплитуда 1.5 Гц)
    purrLFO = ctx.createOscillator();
    purrLFO.type = 'sine';
    purrLFO.frequency.setValueAtTime(2.5, now);
    purrLFOGain = ctx.createGain();
    purrLFOGain.gain.setValueAtTime(1.5, now);

    purrLFO.connect(purrLFOGain);
    purrLFOGain.connect(purrOsc.frequency);

    purrGain = ctx.createGain();
    purrGain.gain.setValueAtTime(0.10, now);
    purrOsc.connect(purrGain);
    purrGain.connect(ctx.destination);

    purrOsc.start(now);
    purrLFO.start(now);

    purrIntervalId = setInterval(() => triggerHaptic(6), 600);
  } catch (e) {}
}

export function stopPurrSound() {
  try {
    if (purrIntervalId) clearInterval(purrIntervalId);
    if (purrOsc) { purrOsc.stop(); purrOsc.disconnect(); purrOsc = null; }
    if (purrLFO) { purrLFO.stop(); purrLFO.disconnect(); purrLFO = null; }
    if (purrLFOGain) { purrLFOGain.disconnect(); purrLFOGain = null; }
    if (purrGain) { purrGain.disconnect(); purrGain = null; }
  } catch (e) {}
}

// ---------- 6. WATER SPLASH (плеск воды) ----------
export function playWaterSplashSound() {
  if (soundsMuted) return;
  try {
    triggerHaptic(25);
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.15);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.10, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.16);

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550 + i * 120, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(400 + i * 80, now + i * 0.04 + 0.05);
      oscGain.gain.setValueAtTime(0.03, now + i * 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.05);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.05);
    }
  } catch (e) {}
}

// ---------- 7. WINDOW OPEN (мягкое арпеджио, очень тихое) ----------
export function playWindowOpenSound() {
  if (soundsMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [392, 493.88, 587.33, 783.99];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.07);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now + i * 0.07);
      gain.gain.setValueAtTime(0.02, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.2);
    });
  } catch (e) {}
}

// ---------- 8. WINDOW CLOSE (плавное затухание) ----------
export function playWindowCloseSound() {
  if (soundsMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [783.99, 587.33, 493.88, 392];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now + i * 0.06);
      gain.gain.setValueAtTime(0.02, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.18);
    });
  } catch (e) {}
}