/**
 * Focus Mode soundscapes, generated rather than streamed.
 *
 * Each layer is a continuous noise/oscillator graph plus scheduled one-shots
 * (crackles, chirps, thunder). Nothing is a sample loop, so nothing seams.
 * Entirely separate from game SFX and from the (removed) background music.
 */

import { audio } from "./audio";

export type AmbientId =
  | "rain"
  | "fireplace"
  | "forest"
  | "waterfall"
  | "ocean"
  | "wind"
  | "thunder"
  | "cafe"
  | "night"
  | "birds";

export const AMBIENTS: { id: AmbientId; label: string; icon: string; tint: string }[] = [
  { id: "rain", label: "Rain", icon: "🌧️", tint: "#4c9ffe" },
  { id: "fireplace", label: "Fireplace", icon: "🔥", tint: "#ff972e" },
  { id: "forest", label: "Forest", icon: "🌲", tint: "#4ce6cf" },
  { id: "waterfall", label: "Waterfall", icon: "💧", tint: "#17b4c6" },
  { id: "ocean", label: "Ocean", icon: "🌊", tint: "#1f6fd0" },
  { id: "wind", label: "Wind", icon: "🌬️", tint: "#93a4bd" },
  { id: "thunder", label: "Thunder", icon: "⛈️", tint: "#b15cff" },
  { id: "cafe", label: "Cafe", icon: "☕", tint: "#b4780c" },
  { id: "night", label: "Night", icon: "🌙", tint: "#7b30c9" },
  { id: "birds", label: "Birds", icon: "🐦", tint: "#ffc542" },
];

const FADE = 1.4;

type Layer = {
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
  timers: ReturnType<typeof setInterval>[];
};

class AmbientMixer {
  private layers = new Map<AmbientId, Layer>();
  private levels = new Map<AmbientId, number>();

  get active(): AmbientId[] {
    return Array.from(this.layers.keys());
  }

  isPlaying(id: AmbientId) {
    return this.layers.has(id);
  }

  private ctx() {
    audio.unlock();
    return audio.context;
  }

  /** Looping filtered noise — the bed under most soundscapes. */
  private noiseBed(cutoff: number, q: number, type: BiquadFilterType, gainValue: number) {
    const ctx = this.ctx();
    const buffer = audio.getNoiseBuffer();
    if (!ctx || !buffer) return null;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = cutoff;
    filter.Q.value = q;

    const g = ctx.createGain();
    g.gain.value = gainValue;

    src.connect(filter);
    filter.connect(g);
    src.start();

    return { src, out: g, filter };
  }

  /** Short shaped burst used for crackles, drips, chirps and clinks. */
  private blip(
    target: GainNode,
    o: { freq: number; duration: number; gain: number; type?: OscillatorType; sweepTo?: number }
  ) {
    const ctx = this.ctx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.sweepTo) osc.frequency.exponentialRampToValueAtTime(o.sweepTo, t + o.duration);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(o.gain, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + o.duration);

    osc.connect(env);
    env.connect(target);
    osc.start(t);
    osc.stop(t + o.duration + 0.02);
  }

  private noiseBurst(target: GainNode, o: { duration: number; gain: number; cutoff: number }) {
    const ctx = this.ctx();
    const buffer = audio.getNoiseBuffer();
    if (!ctx || !buffer) return;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = o.cutoff;
    const env = ctx.createGain();
    env.gain.setValueAtTime(o.gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + o.duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(target);
    src.start(t, Math.random(), o.duration);
  }

  private build(id: AmbientId, out: GainNode): Layer {
    const ctx = this.ctx()!;
    const nodes: AudioScheduledSourceNode[] = [];
    const timers: ReturnType<typeof setInterval>[] = [];

    const attach = (bed: ReturnType<typeof this.noiseBed>) => {
      if (!bed) return;
      bed.out.connect(out);
      nodes.push(bed.src);
      return bed;
    };

    switch (id) {
      case "rain": {
        attach(this.noiseBed(1800, 0.6, "highpass", 0.22));
        const patter = attach(this.noiseBed(6500, 0.4, "bandpass", 0.1));
        // gentle intensity drift so it never feels static
        if (patter) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 0.08;
          lfoGain.gain.value = 900;
          lfo.connect(lfoGain);
          lfoGain.connect(patter.filter.frequency);
          lfo.start();
          nodes.push(lfo);
        }
        break;
      }

      case "fireplace": {
        attach(this.noiseBed(420, 0.5, "lowpass", 0.3));
        timers.push(
          setInterval(() => {
            if (Math.random() < 0.75) {
              this.noiseBurst(out, { duration: 0.05 + Math.random() * 0.07, gain: 0.12 + Math.random() * 0.2, cutoff: 1800 + Math.random() * 2600 });
            }
          }, 240)
        );
        break;
      }

      case "forest": {
        attach(this.noiseBed(700, 0.5, "lowpass", 0.12));
        attach(this.noiseBed(3400, 0.7, "bandpass", 0.05));
        timers.push(
          setInterval(() => {
            if (Math.random() < 0.35) {
              const f = 1800 + Math.random() * 1600;
              this.blip(out, { freq: f, duration: 0.12, gain: 0.05, sweepTo: f * 1.3 });
            }
          }, 2600)
        );
        break;
      }

      case "waterfall":
        attach(this.noiseBed(1100, 0.4, "lowpass", 0.34));
        attach(this.noiseBed(240, 0.5, "lowpass", 0.2));
        break;

      case "ocean": {
        const bed = attach(this.noiseBed(900, 0.4, "lowpass", 0.001));
        if (bed) {
          // slow swell: waves arriving roughly every 9 seconds
          const lfo = ctx.createOscillator();
          const depth = ctx.createGain();
          lfo.frequency.value = 0.11;
          depth.gain.value = 0.16;
          lfo.connect(depth);
          depth.connect(bed.out.gain);
          bed.out.gain.value = 0.18;
          lfo.start();
          nodes.push(lfo);
        }
        break;
      }

      case "wind": {
        const bed = attach(this.noiseBed(600, 3.5, "bandpass", 0.28));
        if (bed) {
          const lfo = ctx.createOscillator();
          const depth = ctx.createGain();
          lfo.frequency.value = 0.06;
          depth.gain.value = 420;
          lfo.connect(depth);
          depth.connect(bed.filter.frequency);
          lfo.start();
          nodes.push(lfo);
        }
        break;
      }

      case "thunder": {
        attach(this.noiseBed(2000, 0.6, "highpass", 0.16));
        timers.push(
          setInterval(() => {
            if (Math.random() < 0.3) {
              this.noiseBurst(out, { duration: 1.6 + Math.random() * 1.6, gain: 0.3, cutoff: 220 });
              this.blip(out, { freq: 58, duration: 1.8, gain: 0.16, type: "sine", sweepTo: 32 });
            }
          }, 9000)
        );
        break;
      }

      case "cafe": {
        attach(this.noiseBed(520, 0.5, "lowpass", 0.16));
        timers.push(
          setInterval(() => {
            const r = Math.random();
            if (r < 0.25) this.blip(out, { freq: 2400 + Math.random() * 900, duration: 0.09, gain: 0.05, type: "triangle" });
            else if (r < 0.4) this.noiseBurst(out, { duration: 0.3, gain: 0.05, cutoff: 900 });
          }, 1700)
        );
        break;
      }

      case "night": {
        attach(this.noiseBed(300, 0.5, "lowpass", 0.1));
        timers.push(
          setInterval(() => {
            // cricket pulses in short trains
            if (Math.random() < 0.6) {
              for (let i = 0; i < 3; i++) {
                setTimeout(() => this.blip(out, { freq: 4200, duration: 0.03, gain: 0.035, type: "square" }), i * 90);
              }
            }
          }, 1400)
        );
        break;
      }

      case "birds": {
        attach(this.noiseBed(800, 0.5, "lowpass", 0.06));
        timers.push(
          setInterval(() => {
            if (Math.random() < 0.5) {
              const base = 2200 + Math.random() * 1800;
              const notes = 2 + Math.floor(Math.random() * 3);
              for (let i = 0; i < notes; i++) {
                setTimeout(
                  () => this.blip(out, { freq: base * (1 + i * 0.12), duration: 0.08, gain: 0.05, sweepTo: base * 1.5 }),
                  i * 110
                );
              }
            }
          }, 3200)
        );
        break;
      }
    }

    return { gain: out, nodes, timers };
  }

  /** Start a layer with a smooth fade in. */
  start(id: AmbientId, level: number) {
    const ctx = this.ctx();
    const dest = audio.ambientDestination;
    if (!ctx || !dest || this.layers.has(id)) return;

    const out = ctx.createGain();
    out.gain.value = 0.0001;
    out.connect(dest);

    const layer = this.build(id, out);
    this.layers.set(id, layer);
    this.levels.set(id, level);

    out.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), ctx.currentTime + FADE);
  }

  /** Stop with a fade out, then tear the graph down. */
  stop(id: AmbientId) {
    const ctx = this.ctx();
    const layer = this.layers.get(id);
    if (!ctx || !layer) return;

    this.layers.delete(id);
    layer.timers.forEach(clearInterval);
    layer.gain.gain.cancelScheduledValues(ctx.currentTime);
    layer.gain.gain.setValueAtTime(Math.max(0.0002, layer.gain.gain.value), ctx.currentTime);
    layer.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + FADE);

    setTimeout(() => {
      layer.nodes.forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
      try {
        layer.gain.disconnect();
      } catch {}
    }, FADE * 1000 + 120);
  }

  setLevel(id: AmbientId, level: number) {
    this.levels.set(id, level);
    const ctx = this.ctx();
    const layer = this.layers.get(id);
    if (!ctx || !layer) return;
    layer.gain.gain.setTargetAtTime(Math.max(0.0001, level), ctx.currentTime, 0.12);
  }

  stopAll() {
    Array.from(this.layers.keys()).forEach((id) => this.stop(id));
  }
}

export const ambient = new AmbientMixer();
