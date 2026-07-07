/**
 * audio.js — tutto il suono del gioco, sintetizzato con WebAudio.
 * Nessun file audio da caricare: drone d'ambiente, battito cardiaco,
 * sussurri, stinger e click sono generati al volo.
 *
 * init() va chiamato dopo un gesto dell'utente (il click su "Inizia"),
 * perché i browser bloccano AudioContext prima di quello. Tutte le altre
 * funzioni sono sicure da chiamare in qualunque momento: se il contesto
 * non esiste ancora (o è bloccato) non fanno nulla.
 */

let ctx = null;
let master = null;
let droneGain = null;
let muted = false;

function ensure() {
  if (ctx) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    // Drone d'ambiente: due sawtooth leggermente scordati sotto un
    // lowpass — un ronzio basso, quasi impercettibile, che cresce con
    // lo stadio (vedi setStage).
    droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 200;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 55.7;
    osc1.connect(lowpass);
    osc2.connect(lowpass);
    lowpass.connect(droneGain);
    droneGain.connect(master);
    osc1.start();
    osc2.start();
    return true;
  } catch {
    return false; // WebAudio non disponibile: il gioco funziona muto
  }
}

/** Inviluppo esponenziale attack/decay su un GainNode. */
function env(gainNode, t0, attack, peak, decay) {
  gainNode.gain.setValueAtTime(0.0001, t0);
  gainNode.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

export const audio = {
  /** Da chiamare al click su "Inizia" (serve un gesto utente). */
  init() {
    ensure();
  },

  /** Il drone cresce con lo stadio narrativo (0-3). */
  setStage(stage) {
    if (!droneGain || !ctx) return;
    droneGain.gain.linearRampToValueAtTime(0.05 + stage * 0.03, ctx.currentTime + 2);
  },

  /** Ritorna true se ora è muto. */
  toggleMute() {
    if (!ensure()) return muted;
    muted = !muted;
    master.gain.value = muted ? 0 : 0.25;
    return muted;
  },

  /** Battito cardiaco (doppio colpo sordo). Usato quando l'Altra è vicina. */
  thump() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    for (const dt of [0, 0.18]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(52, t + dt);
      osc.frequency.exponentialRampToValueAtTime(30, t + dt + 0.12);
      const g = ctx.createGain();
      env(g, t + dt, 0.005, dt === 0 ? 0.5 : 0.3, 0.13);
      osc.connect(g);
      g.connect(master);
      osc.start(t + dt);
      osc.stop(t + dt + 0.25);
    }
  },

  /** Sussurro: rumore filtrato in banda, frequenza casuale ogni volta. */
  whisper() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    const dur = 0.7;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.4 + 0.6 * Math.sin(i / 1400));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 900 + Math.random() * 900;
    bandpass.Q.value = 3;
    const g = ctx.createGain();
    env(g, t, 0.1, 0.12, dur - 0.1);
    src.connect(bandpass);
    bandpass.connect(g);
    g.connect(master);
    src.start(t);
  },

  /** Stinger dissonante: assenza, codice sbagliato, inizio inseguimento. */
  stinger() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    for (const f of [220, 233]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.8);
      const g = ctx.createGain();
      env(g, t, 0.01, 0.18, 0.8);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.9);
    }
  },

  /** Click secco per interazioni meccaniche (raccolta, tastierino). */
  click() {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 2200;
    const g = ctx.createGain();
    env(g, t, 0.001, 0.06, 0.03);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.05);
  },
};
