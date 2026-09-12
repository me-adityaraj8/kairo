/**
 * Procedural game audio. Every sound is synthesised with the Web Audio API so
 * the app ships no audio files and nothing depends on the network.
 *
 * The context is created lazily on the first user gesture, per autoplay policy.
 */

export type Sfx =
  | "click"
  | "hover"
  | "open"
  | "close"
  | "complete"
  | "coin"
  | "purchase"
  | "levelup"
  | "streak"
  | "error";

export type AudioSettings = {
  muted: boolean;
  music: number;
  sfx: number;
};

export const DEFAULT_SETTINGS: AudioSettings = { muted: false, music: 0.35, sfx: 0.6 };

const NOTE: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, E6: 1318.5, G6: 1568.0,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: { stop: () => void } | null = null;
  private musicTimer: number | null = null;
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private wantsMusic = false;

  get unlocked() {
    return this.ctx !== null && this.ctx.state === "running";
  }

  /** Safe to call on every gesture; only the first one does work. */
  unlock() {
    if (typeof window === "undefined") return;

    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applySettings();
    }

    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.wantsMusic && !this.musicNodes) this.startMusic();
  }

  setSettings(next: AudioSettings) {
    this.settings = next;
    this.applySettings();
  }

  private applySettings() {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.settings.muted ? 0 : 1, now, 0.03);
    this.musicGain.gain.setTargetAtTime(this.settings.music * 0.5, now, 0.2);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx, now, 0.03);
  }

  /** One enveloped oscillator. */
  private tone(opts: {
    freq: number;
    at?: number;
    duration?: number;
    type?: OscillatorType;
    gain?: number;
    sweepTo?: number;
    destination?: GainNode;
  }) {
    if (!this.ctx || !this.sfxGain) return;

    const {
      freq,
      at = 0,
      duration = 0.18,
      type = "sine",
      gain = 0.25,
      sweepTo,
      destination = this.sfxGain,
    } = opts;

    const start = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);

    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.02, duration * 0.2));
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(env);
    env.connect(destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private noise(opts: { at?: number; duration?: number; gain?: number; cutoff?: number }) {
    if (!this.ctx || !this.sfxGain) return;
    const { at = 0, duration = 0.25, gain = 0.12, cutoff = 2200 } = opts;

    const start = this.ctx.currentTime + at;
    const frames = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, start);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    src.start(start);
    src.stop(start + duration);
  }

  play(sound: Sfx) {
    if (!this.ctx || this.settings.muted) return;

    switch (sound) {
      case "hover":
        this.tone({ freq: NOTE.A5, duration: 0.05, gain: 0.035, type: "sine" });
        break;

      case "click":
        this.tone({ freq: NOTE.E5, duration: 0.07, gain: 0.16, type: "triangle", sweepTo: NOTE.A4 });
        break;

      case "open":
        this.tone({ freq: NOTE.C5, duration: 0.1, gain: 0.12, type: "triangle", sweepTo: NOTE.G5 });
        break;

      case "close":
        this.tone({ freq: NOTE.G5, duration: 0.1, gain: 0.1, type: "triangle", sweepTo: NOTE.C5 });
        break;

      case "coin":
        this.tone({ freq: NOTE.C6, duration: 0.08, gain: 0.18, type: "square" });
        this.tone({ freq: NOTE.G6, at: 0.05, duration: 0.12, gain: 0.14, type: "square" });
        break;

      case "complete":
        // rising major triad, with a soft swell underneath
        this.tone({ freq: NOTE.C5, duration: 0.16, gain: 0.2, type: "triangle" });
        this.tone({ freq: NOTE.E5, at: 0.07, duration: 0.16, gain: 0.2, type: "triangle" });
        this.tone({ freq: NOTE.G5, at: 0.14, duration: 0.26, gain: 0.22, type: "triangle" });
        this.noise({ at: 0.1, duration: 0.3, gain: 0.05, cutoff: 3200 });
        break;

      case "purchase":
        this.tone({ freq: NOTE.G5, duration: 0.09, gain: 0.16, type: "square" });
        this.tone({ freq: NOTE.C6, at: 0.07, duration: 0.09, gain: 0.16, type: "square" });
        this.tone({ freq: NOTE.E6, at: 0.14, duration: 0.22, gain: 0.18, type: "square" });
        this.noise({ at: 0.12, duration: 0.35, gain: 0.07, cutoff: 4200 });
        break;

      case "streak":
        this.tone({ freq: NOTE.A4, duration: 0.3, gain: 0.16, type: "sine" });
        this.tone({ freq: NOTE.E5, at: 0.06, duration: 0.36, gain: 0.14, type: "sine" });
        break;

      case "levelup":
        // the loudest, longest cue in the game: fanfare + sweep + shimmer
        [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
          this.tone({ freq: f, at: i * 0.1, duration: 0.5, gain: 0.24, type: "triangle" })
        );
        [NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) =>
          this.tone({ freq: f, at: 0.42 + i * 0.07, duration: 0.7, gain: 0.2, type: "sawtooth" })
        );
        this.tone({ freq: NOTE.C4, duration: 1.1, gain: 0.16, type: "sine", sweepTo: NOTE.C5 });
        this.noise({ at: 0.35, duration: 0.9, gain: 0.09, cutoff: 5200 });
        for (let i = 0; i < 6; i++) {
          this.tone({ freq: NOTE.C6 + i * 120, at: 0.7 + i * 0.05, duration: 0.3, gain: 0.07, type: "sine" });
        }
        break;

      case "error":
        this.tone({ freq: 180, duration: 0.22, gain: 0.16, type: "sawtooth", sweepTo: 90 });
        break;
    }
  }

  setMusicEnabled(on: boolean) {
    this.wantsMusic = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  /** Slow ambient pad plus an occasional arpeggio. Deliberately understated. */
  private startMusic() {
    if (!this.ctx || !this.musicGain || this.musicNodes) return;

    const ctx = this.ctx;
    const bed = ctx.createGain();
    bed.gain.value = 0.16;
    bed.connect(this.musicGain);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(bed);

    // three detuned voices make the pad breathe
    const voices = [NOTE.C4 / 2, NOTE.G4 / 2, NOTE.E4].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "triangle" : "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 7;
      osc.connect(filter);
      osc.start();
      return osc;
    });

    // slow filter sweep
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 320;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const arpNotes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.A4, NOTE.C5];
    let step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.settings.muted) return;
      this.tone({
        freq: arpNotes[step % arpNotes.length],
        duration: 1.6,
        gain: 0.05,
        type: "sine",
        destination: this.musicGain!,
      });
      step++;
    }, 2600);

    this.musicNodes = {
      stop: () => {
        voices.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        try {
          lfo.stop();
        } catch {}
      },
    };
  }

  private stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicNodes?.stop();
    this.musicNodes = null;
  }
}

export const audio = new AudioEngine();
