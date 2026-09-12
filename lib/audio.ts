/**
 * Game audio, synthesised with the Web Audio API so the app ships no files.
 *
 * There is deliberately no background music. Two independent buses:
 *   sfx     — short game feedback
 *   ambient — Focus Mode soundscapes (see lib/ambient.ts)
 * Both are created lazily on the first gesture, per autoplay policy.
 */

export type Sfx =
  | "hover"
  | "click"
  | "toggle"
  | "navigate"
  | "open"
  | "close"
  | "questCreate"
  | "questComplete"
  | "coin"
  | "xp"
  | "combo"
  | "equip"
  | "unequip"
  | "purchase"
  | "chestOpen"
  | "reveal"
  | "achievement"
  | "levelup"
  | "evolve"
  | "streak"
  | "focusStart"
  | "focusEnd"
  | "delete"
  | "error";

export type AudioSettings = {
  muted: boolean;
  sfx: number;
  ambient: number;
};

export const DEFAULT_SETTINGS: AudioSettings = { muted: false, sfx: 0.6, ambient: 0.7 };

const N: Record<string, number> = {
  C3: 130.81, E3: 164.81, G3: 196.0, A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
  C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568.0, A6: 1760.0,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private ambientVolume: GainNode | null = null;
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private noiseBuffer: AudioBuffer | null = null;

  get context() {
    return this.ctx;
  }

  get ambientDestination() {
    return this.ambientBus;
  }

  get unlocked() {
    return this.ctx !== null && this.ctx.state === "running";
  }

  unlock() {
    if (typeof window === "undefined") return;

    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.ambientBus = this.ctx.createGain();
      this.ambientVolume = this.ctx.createGain();

      /*
       * Soundscapes layer freely, so their sum has to be caught before it
       * reaches the master. The limiter sits ahead of the user's volume
       * control: it always sees the same signal, so lowering the slider
       * turns the mix down without changing how it is being held.
       */
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 8;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.25;

      this.sfxBus.connect(this.master);
      this.ambientBus.connect(limiter);
      limiter.connect(this.ambientVolume);
      this.ambientVolume.connect(this.master);
      this.master.connect(this.ctx.destination);

      this.applySettings();
    }

    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setSettings(next: AudioSettings) {
    this.settings = next;
    this.applySettings();
  }

  private applySettings() {
    if (!this.ctx || !this.master || !this.sfxBus || !this.ambientVolume) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : 1, t, 0.03);
    this.sfxBus.gain.setTargetAtTime(this.settings.sfx, t, 0.03);
    this.ambientVolume.gain.setTargetAtTime(this.settings.ambient, t, 0.15);
  }

  /** Shared 2s noise bed, reused by sfx and ambient generators. */
  getNoiseBuffer() {
    if (!this.ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;

    const frames = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  private tone(o: {
    freq: number;
    at?: number;
    duration?: number;
    type?: OscillatorType;
    gain?: number;
    sweepTo?: number;
  }) {
    if (!this.ctx || !this.sfxBus) return;
    const { freq, at = 0, duration = 0.16, type = "sine", gain = 0.22, sweepTo } = o;

    const start = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);

    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.015, duration * 0.25));
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(env);
    env.connect(this.sfxBus);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private noise(o: { at?: number; duration?: number; gain?: number; cutoff?: number; type?: BiquadFilterType }) {
    if (!this.ctx || !this.sfxBus) return;
    const { at = 0, duration = 0.25, gain = 0.1, cutoff = 2400, type = "lowpass" } = o;
    const buffer = this.getNoiseBuffer();
    if (!buffer) return;

    const start = this.ctx.currentTime + at;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(cutoff, start);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxBus);
    src.start(start, 0, duration);
  }

  /** Every interaction has its own voice — no shared generic click. */
  play(sound: Sfx) {
    if (!this.ctx || this.settings.muted) return;

    switch (sound) {
      case "hover":
        this.tone({ freq: N.A5, duration: 0.04, gain: 0.03 });
        break;

      case "click":
        this.tone({ freq: N.E5, duration: 0.06, gain: 0.13, type: "triangle", sweepTo: N.B4 });
        break;

      case "toggle":
        this.tone({ freq: N.G4, duration: 0.05, gain: 0.11, type: "square" });
        this.tone({ freq: N.D5, at: 0.04, duration: 0.06, gain: 0.09, type: "square" });
        break;

      case "navigate":
        this.tone({ freq: N.D5, duration: 0.08, gain: 0.1, type: "sine", sweepTo: N.A5 });
        break;

      case "open":
        this.tone({ freq: N.C5, duration: 0.1, gain: 0.1, type: "triangle", sweepTo: N.G5 });
        break;

      case "close":
        this.tone({ freq: N.G5, duration: 0.1, gain: 0.09, type: "triangle", sweepTo: N.C5 });
        break;

      case "questCreate":
        // quill scratch then a soft confirm
        this.noise({ duration: 0.14, gain: 0.05, cutoff: 3200, type: "highpass" });
        this.tone({ freq: N.E5, at: 0.1, duration: 0.14, gain: 0.13, type: "triangle" });
        break;

      case "questComplete":
        this.tone({ freq: N.C5, duration: 0.14, gain: 0.18, type: "triangle" });
        this.tone({ freq: N.E5, at: 0.06, duration: 0.14, gain: 0.18, type: "triangle" });
        this.tone({ freq: N.G5, at: 0.12, duration: 0.24, gain: 0.2, type: "triangle" });
        this.noise({ at: 0.1, duration: 0.26, gain: 0.04, cutoff: 3600 });
        break;

      case "xp":
        this.tone({ freq: N.E6, duration: 0.09, gain: 0.1, type: "sine", sweepTo: N.A6 });
        break;

      case "coin":
        this.tone({ freq: N.C6, duration: 0.06, gain: 0.14, type: "square" });
        this.tone({ freq: N.G6, at: 0.045, duration: 0.1, gain: 0.11, type: "square" });
        break;

      case "combo":
        // rising stab, gets brighter the further the chain goes
        this.tone({ freq: N.A4, duration: 0.1, gain: 0.14, type: "sawtooth", sweepTo: N.A5 });
        this.tone({ freq: N.E5, at: 0.05, duration: 0.14, gain: 0.1, type: "triangle" });
        break;

      case "equip":
        this.noise({ duration: 0.09, gain: 0.07, cutoff: 1600 });
        this.tone({ freq: N.G4, at: 0.02, duration: 0.12, gain: 0.15, type: "square", sweepTo: N.D5 });
        break;

      case "unequip":
        this.tone({ freq: N.D5, duration: 0.1, gain: 0.11, type: "square", sweepTo: N.G4 });
        break;

      case "purchase":
        this.tone({ freq: N.G5, duration: 0.08, gain: 0.15, type: "square" });
        this.tone({ freq: N.C6, at: 0.06, duration: 0.08, gain: 0.15, type: "square" });
        this.tone({ freq: N.E6, at: 0.12, duration: 0.2, gain: 0.16, type: "square" });
        break;

      case "chestOpen":
        // hinge creak into a rising swell
        this.noise({ duration: 0.3, gain: 0.07, cutoff: 900 });
        this.tone({ freq: N.C3, duration: 0.5, gain: 0.13, type: "sawtooth", sweepTo: N.C4 });
        break;

      case "reveal":
        [N.C5, N.G5, N.C6, N.E6].forEach((f, i) =>
          this.tone({ freq: f, at: i * 0.06, duration: 0.5, gain: 0.16, type: "triangle" })
        );
        this.noise({ at: 0.1, duration: 0.6, gain: 0.05, cutoff: 5200, type: "highpass" });
        break;

      case "achievement":
        [N.E5, N.A5, N.C6].forEach((f, i) =>
          this.tone({ freq: f, at: i * 0.08, duration: 0.4, gain: 0.17, type: "triangle" })
        );
        break;

      case "streak":
        this.tone({ freq: N.A4, duration: 0.28, gain: 0.14 });
        this.tone({ freq: N.E5, at: 0.05, duration: 0.34, gain: 0.12 });
        break;

      case "levelup":
        [N.C5, N.E5, N.G5, N.C6].forEach((f, i) =>
          this.tone({ freq: f, at: i * 0.09, duration: 0.5, gain: 0.22, type: "triangle" })
        );
        [N.G5, N.C6, N.E6].forEach((f, i) =>
          this.tone({ freq: f, at: 0.4 + i * 0.07, duration: 0.7, gain: 0.18, type: "sawtooth" })
        );
        this.tone({ freq: N.C3, duration: 1.1, gain: 0.14, sweepTo: N.C4 });
        this.noise({ at: 0.32, duration: 0.9, gain: 0.07, cutoff: 5200 });
        break;

      case "evolve":
        // longer, more ceremonial than a level up
        this.tone({ freq: N.C3, duration: 1.6, gain: 0.15, sweepTo: N.C5 });
        [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6].forEach((f, i) =>
          this.tone({ freq: f, at: 0.3 + i * 0.11, duration: 0.7, gain: 0.16, type: "triangle" })
        );
        this.noise({ at: 0.6, duration: 1.3, gain: 0.08, cutoff: 6000, type: "highpass" });
        break;

      case "focusStart":
        this.tone({ freq: N.A3, duration: 0.9, gain: 0.11, sweepTo: N.A4 });
        break;

      case "focusEnd":
        [N.A4, N.E5, N.A5].forEach((f, i) =>
          this.tone({ freq: f, at: i * 0.12, duration: 0.6, gain: 0.15, type: "sine" })
        );
        break;

      case "delete":
        this.tone({ freq: N.A3, duration: 0.14, gain: 0.1, type: "sawtooth", sweepTo: N.C3 });
        break;

      case "error":
        this.tone({ freq: 180, duration: 0.2, gain: 0.14, type: "sawtooth", sweepTo: 90 });
        break;
    }
  }
}

export const audio = new AudioEngine();
