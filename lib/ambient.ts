/**
 * Focus Mode soundscapes, generated rather than streamed.
 *
 * Three things keep these from sounding like filtered static:
 *
 *   Spectrum — beds are built from pink and brown noise, which fall off with
 *   frequency the way rain, wind and water actually do. White noise carries
 *   equal power per hertz, so most of its energy sits in the top octaves and
 *   it reads as hiss no matter how it is filtered.
 *
 *   Slope — filters are cascaded. One biquad is 12 dB/octave, too gentle to
 *   get the top end out of the way; two or three put it where it belongs.
 *
 *   Detail — rain is thousands of separate droplets and a fire is a stream of
 *   crackles, so the texture is scheduled as grains against the audio clock
 *   rather than approximated by wobbling a filter on a static bed.
 *
 * Nothing here is a sample, so nothing seams and no files ship. Entirely
 * separate from game SFX, which have their own bus.
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

/** Fade applied when a soundscape is switched on or off. */
const FADE = 2;

/** Bed length. Long enough that the loop never draws attention to itself. */
const LOOP = 12;

/** How far ahead of the clock grains are queued, and how often that runs. */
const HORIZON = 0.35;
const TICK = 150;

type NoiseColor = "pink" | "brown";

type Layer = {
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
  cancels: (() => void)[];
  stopped: boolean;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

class AmbientMixer {
  private layers = new Map<AmbientId, Layer>();
  private levels = new Map<AmbientId, number>();
  private noiseCache = new Map<NoiseColor, AudioBuffer>();

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

  // ---------------------------------------------------------------- sources

  /**
   * A stereo noise bed of the given colour, cached for the session.
   *
   * The two channels are generated independently, which decorrelates them and
   * gives the beds width instead of a point source between the speakers. The
   * head of each channel is cross-faded against an overrun of the tail so the
   * loop point joins cleanly rather than stepping.
   */
  private noise(color: NoiseColor) {
    const ctx = this.ctx();
    if (!ctx) return null;

    const cached = this.noiseCache.get(color);
    if (cached) return cached;

    const sr = ctx.sampleRate;
    const len = Math.floor(sr * LOOP);
    const tail = Math.floor(sr * 0.4);
    const buffer = ctx.createBuffer(2, len, sr);

    for (let c = 0; c < 2; c++) {
      const gen = new Float32Array(len + tail);

      if (color === "pink") {
        // Kellet's filter bank: six one-poles summed into a -3 dB/octave tilt.
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < gen.length; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179;
          b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522;
          b5 = -0.7616 * b5 - w * 0.016898;
          gen[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
          b6 = w * 0.115926;
        }
      } else {
        // Leaky integrator: -6 dB/octave, the deep end of rain and surf.
        let last = 0;
        for (let i = 0; i < gen.length; i++) {
          last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
          gen[i] = last;
        }
      }

      const data = buffer.getChannelData(c);
      data.set(gen.subarray(0, len));
      for (let i = 0; i < tail; i++) {
        const a = (i / tail) * Math.PI * 0.5;
        data[i] = gen[len + i] * Math.cos(a) + gen[i] * Math.sin(a);
      }

      let peak = 0;
      for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(data[i]));
      if (peak > 0) {
        const scale = 0.9 / peak;
        for (let i = 0; i < len; i++) data[i] *= scale;
      }
    }

    this.noiseCache.set(color, buffer);
    return buffer;
  }

  /** A continuous bed: looping noise through a filter cascade into a gain. */
  private bed(o: {
    color: NoiseColor;
    filters: { type: BiquadFilterType; freq: number; q?: number }[];
    gain: number;
  }) {
    const ctx = this.ctx();
    const buffer = this.noise(o.color);
    if (!ctx || !buffer) return null;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    let node: AudioNode = src;
    const filters: BiquadFilterNode[] = [];
    for (const f of o.filters) {
      const bq = ctx.createBiquadFilter();
      bq.type = f.type;
      bq.frequency.value = f.freq;
      bq.Q.value = f.q ?? 0.707;
      node.connect(bq);
      node = bq;
      filters.push(bq);
    }

    const out = ctx.createGain();
    out.gain.value = o.gain;
    node.connect(out);

    // Offset each bed so stacked layers never sit in phase with one another.
    src.start(0, Math.random() * LOOP);

    return { src, out, filters };
  }

  /** Slow modulation. Returns the oscillator so the layer can stop it. */
  private lfo(target: AudioParam, o: { rate: number; depth: number }) {
    const ctx = this.ctx();
    if (!ctx) return null;

    const osc = ctx.createOscillator();
    const depth = ctx.createGain();
    osc.frequency.value = o.rate;
    depth.gain.value = o.depth;
    osc.connect(depth);
    depth.connect(target);
    osc.start();
    return osc;
  }

  // ----------------------------------------------------------------- grains

  /**
   * One short filtered noise event at an exact time: a droplet, a crackle,
   * a syllable of babble. The resonant band is what makes it read as an
   * object rather than a burst of static.
   */
  private grain(
    target: AudioNode,
    o: {
      at: number;
      duration: number;
      gain: number;
      freq: number;
      q?: number;
      type?: BiquadFilterType;
      color?: NoiseColor;
      sweepTo?: number;
      attack?: number;
    }
  ) {
    const ctx = this.ctx();
    const buffer = this.noise(o.color ?? "pink");
    if (!ctx || !buffer) return;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bq = ctx.createBiquadFilter();
    bq.type = o.type ?? "bandpass";
    bq.frequency.setValueAtTime(o.freq, o.at);
    if (o.sweepTo) bq.frequency.exponentialRampToValueAtTime(o.sweepTo, o.at + o.duration);
    bq.Q.value = o.q ?? 1.5;

    const env = ctx.createGain();
    const attack = o.attack ?? 0.004;
    env.gain.setValueAtTime(0.0001, o.at);
    env.gain.exponentialRampToValueAtTime(o.gain, o.at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, o.at + o.duration);

    src.connect(bq);
    bq.connect(env);
    env.connect(target);
    src.start(o.at, Math.random() * (LOOP - o.duration - 0.1));
    src.stop(o.at + o.duration + 0.02);
  }

  /** A pitched call — birdsong, an owl — softened through a band. */
  private call(
    target: AudioNode,
    o: {
      at: number;
      duration: number;
      gain: number;
      freq: number;
      sweepTo?: number;
      type?: OscillatorType;
      vibrato?: number;
    }
  ) {
    const ctx = this.ctx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.freq, o.at);
    if (o.sweepTo) osc.frequency.exponentialRampToValueAtTime(o.sweepTo, o.at + o.duration);

    const bq = ctx.createBiquadFilter();
    bq.type = "bandpass";
    bq.frequency.value = o.freq * 1.2;
    bq.Q.value = 0.9;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, o.at);
    env.gain.exponentialRampToValueAtTime(o.gain, o.at + o.duration * 0.2);
    env.gain.exponentialRampToValueAtTime(0.0001, o.at + o.duration);

    osc.connect(bq);
    bq.connect(env);
    env.connect(target);
    osc.start(o.at);
    osc.stop(o.at + o.duration + 0.02);

    if (o.vibrato) {
      const vib = ctx.createOscillator();
      const depth = ctx.createGain();
      vib.frequency.value = o.vibrato;
      depth.gain.value = o.freq * 0.03;
      vib.connect(depth);
      depth.connect(osc.frequency);
      vib.start(o.at);
      vib.stop(o.at + o.duration + 0.02);
    }
  }

  /**
   * Queues events slightly ahead of the clock so their timing comes from the
   * audio thread rather than from setTimeout, which drifts and stutters under
   * load. `gap` is called per event, so density can be irregular.
   */
  private schedule(layer: Layer, gap: () => number, fire: (at: number) => void) {
    const ctx = this.ctx();
    if (!ctx) return;

    let next = ctx.currentTime + 0.12;
    let handle: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (layer.stopped) return;
      const until = ctx.currentTime + HORIZON;
      while (next < until) {
        if (next > ctx.currentTime) fire(next);
        next += Math.max(0.01, gap());
      }
      handle = setTimeout(tick, TICK);
    };

    tick();
    layer.cancels.push(() => clearTimeout(handle));
  }

  // ------------------------------------------------------------ soundscapes

  private build(id: AmbientId, out: GainNode): Layer {
    const layer: Layer = { gain: out, nodes: [], cancels: [], stopped: false };

    const attach = (bed: ReturnType<typeof this.bed>) => {
      if (!bed) return null;
      bed.out.connect(out);
      layer.nodes.push(bed.src);
      return bed;
    };
    const modulate = (param: AudioParam | undefined, rate: number, depth: number) => {
      if (!param) return;
      const osc = this.lfo(param, { rate, depth });
      if (osc) layer.nodes.push(osc);
    };

    switch (id) {
      case "rain": {
        // Body, then the wash above it, then the droplets that sell it.
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 700 }], gain: 0.5 }));
        const wash = attach(
          this.bed({
            color: "pink",
            filters: [
              { type: "highpass", freq: 900 },
              { type: "lowpass", freq: 5200 },
              { type: "lowpass", freq: 7000 },
            ],
            gain: 0.2,
          })
        );
        modulate(wash?.filters[1].frequency, 0.05, 1200);

        this.schedule(layer, () => rand(0.012, 0.05), (at) =>
          this.grain(out, {
            at,
            duration: rand(0.012, 0.035),
            gain: rand(0.02, 0.075),
            freq: rand(1900, 8200),
            q: rand(1.6, 4),
          })
        );
        break;
      }

      case "fireplace": {
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 320 }, { type: "lowpass", freq: 520 }], gain: 0.6 }));
        attach(this.bed({ color: "pink", filters: [{ type: "bandpass", freq: 700, q: 0.7 }], gain: 0.06 }));

        // Crackles cluster — long quiet stretches, then a run of pops.
        this.schedule(layer, () => (Math.random() < 0.3 ? rand(0.02, 0.07) : rand(0.1, 0.5)), (at) => {
          const big = Math.random() < 0.12;
          this.grain(out, {
            at,
            duration: big ? rand(0.05, 0.1) : rand(0.008, 0.028),
            gain: big ? rand(0.16, 0.3) : rand(0.03, 0.12),
            freq: big ? rand(380, 900) : rand(900, 3600),
            q: big ? 2.4 : rand(3, 7),
            color: big ? "brown" : "pink",
            attack: 0.001,
          });
        });
        break;
      }

      case "forest": {
        const leaves = attach(
          this.bed({
            color: "pink",
            filters: [{ type: "bandpass", freq: 2200, q: 0.5 }, { type: "lowpass", freq: 4800 }],
            gain: 0.17,
          })
        );
        modulate(leaves?.out.gain, 0.07, 0.07);
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 400 }], gain: 0.22 }));

        this.schedule(layer, () => rand(2.5, 7), (at) => {
          if (Math.random() < 0.55) {
            const base = rand(1700, 3000);
            for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
              this.call(out, {
                at: at + i * rand(0.08, 0.16),
                duration: 0.09,
                gain: 0.05,
                freq: base * (1 + i * 0.1),
                sweepTo: base * rand(1.1, 1.5),
              });
            }
          } else {
            this.grain(out, { at, duration: rand(0.2, 0.5), gain: 0.07, freq: rand(1800, 3400), q: 0.8 });
          }
        });
        break;
      }

      case "waterfall": {
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 500 }], gain: 0.53 }));
        const mid = attach(
          this.bed({
            color: "pink",
            filters: [{ type: "bandpass", freq: 1100, q: 0.4 }, { type: "lowpass", freq: 3800 }],
            gain: 0.19,
          })
        );
        modulate(mid?.filters[0].frequency, 0.09, 260);
        // Turbulence: irregular surges rather than a flat sheet of noise.
        this.schedule(layer, () => rand(0.04, 0.16), (at) =>
          this.grain(out, { at, duration: rand(0.06, 0.2), gain: rand(0.017, 0.051), freq: rand(600, 2400), q: 0.9 })
        );
        break;
      }

      case "ocean": {
        // Two swells at unrelated rates, so waves never arrive on a metronome.
        const surf = attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 600 }], gain: 0.24 }));
        modulate(surf?.out.gain, 0.075, 0.18);
        modulate(surf?.out.gain, 0.041, 0.09);

        const spray = attach(
          this.bed({
            color: "pink",
            filters: [{ type: "highpass", freq: 1400 }, { type: "lowpass", freq: 5000 }],
            gain: 0.035,
          })
        );
        // Spray rides the crest of the swell, not the trough.
        modulate(spray?.out.gain, 0.075, 0.05);
        break;
      }

      case "wind": {
        const gust = attach(
          this.bed({
            color: "brown",
            filters: [{ type: "bandpass", freq: 520, q: 1 }, { type: "lowpass", freq: 2400 }],
            gain: 1.15,
          })
        );
        modulate(gust?.filters[0].frequency, 0.043, 280);
        modulate(gust?.filters[0].frequency, 0.017, 170);
        modulate(gust?.out.gain, 0.029, 0.16);

        const whistle = attach(
          this.bed({ color: "pink", filters: [{ type: "bandpass", freq: 1800, q: 3.5 }], gain: 0.12 })
        );
        modulate(whistle?.filters[0].frequency, 0.037, 700);
        break;
      }

      case "thunder": {
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 800 }], gain: 0.3 }));
        attach(
          this.bed({
            color: "pink",
            filters: [{ type: "highpass", freq: 1200 }, { type: "lowpass", freq: 6000 }],
            gain: 0.1,
          })
        );

        this.schedule(layer, () => rand(7, 22), (at) => {
          const near = Math.random() < 0.35;
          if (near) {
            // Crack first, then the rumble rolling out behind it.
            this.grain(out, { at, duration: 0.32, gain: 0.3, freq: 1600, q: 0.7, sweepTo: 320, attack: 0.001 });
          }
          this.grain(out, {
            at: at + (near ? 0.16 : 0),
            duration: rand(2.4, 4.6),
            gain: near ? 0.42 : rand(0.14, 0.24),
            freq: near ? 190 : 120,
            sweepTo: 48,
            q: 0.6,
            type: "lowpass",
            color: "brown",
            attack: near ? 0.03 : 0.5,
          });
          this.call(out, {
            at: at + (near ? 0.16 : 0),
            duration: rand(2, 3.4),
            gain: near ? 0.2 : 0.1,
            freq: 62,
            sweepTo: 28,
          });
        });
        break;
      }

      case "cafe": {
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 420 }], gain: 0.29 }));

        // Babble: syllable-length bands in the speech range, never a full word.
        this.schedule(layer, () => rand(0.06, 0.3), (at) =>
          this.grain(out, {
            at,
            duration: rand(0.08, 0.22),
            gain: rand(0.015, 0.055),
            freq: rand(320, 1300),
            q: rand(2.5, 6),
            sweepTo: rand(0.7, 1.4) * rand(320, 1300),
            attack: 0.02,
          })
        );

        this.schedule(layer, () => rand(3, 11), (at) => {
          if (Math.random() < 0.5) {
            // Cup on saucer — a struck ring, not a beep.
            this.grain(out, { at, duration: 0.32, gain: 0.05, freq: rand(2400, 3600), q: 14, attack: 0.001 });
          } else {
            this.grain(out, { at, duration: rand(0.3, 0.7), gain: 0.035, freq: rand(300, 700), q: 1.4 });
          }
        });
        break;
      }

      case "night": {
        attach(this.bed({ color: "brown", filters: [{ type: "lowpass", freq: 260 }], gain: 0.26 }));
        attach(this.bed({ color: "pink", filters: [{ type: "bandpass", freq: 900, q: 0.5 }], gain: 0.033 }));

        // Crickets: a trill of clipped chirps, which is what the wings do.
        this.schedule(layer, () => rand(0.6, 2.4), (at) => {
          const freq = rand(3900, 5200);
          const count = 3 + Math.floor(Math.random() * 4);
          const gap = rand(0.05, 0.085);
          for (let i = 0; i < count; i++) {
            this.grain(out, {
              at: at + i * gap,
              duration: 0.026,
              gain: rand(0.026, 0.058),
              freq,
              q: 22,
              attack: 0.002,
            });
          }
        });

        this.schedule(layer, () => rand(14, 40), (at) => {
          this.call(out, { at, duration: 0.5, gain: 0.065, freq: 400, sweepTo: 340, vibrato: 6 });
          this.call(out, { at: at + 0.62, duration: 0.6, gain: 0.052, freq: 360, sweepTo: 300, vibrato: 5 });
        });
        break;
      }

      case "birds": {
        const air = attach(
          this.bed({ color: "pink", filters: [{ type: "lowpass", freq: 1600 }, { type: "lowpass", freq: 2600 }], gain: 0.18 })
        );
        modulate(air?.out.gain, 0.05, 0.03);

        this.schedule(layer, () => rand(1.2, 4.5), (at) => {
          const base = rand(2200, 4200);
          const notes = 2 + Math.floor(Math.random() * 4);
          const near = Math.random() < 0.4;
          for (let i = 0; i < notes; i++) {
            const t = at + i * rand(0.07, 0.15);
            const f = base * rand(0.92, 1.18);
            this.call(out, {
              at: t,
              duration: rand(0.06, 0.13),
              gain: (near ? 0.14 : 0.06) * rand(0.7, 1.2),
              freq: f,
              sweepTo: f * rand(1.15, 1.8),
            });
            // A breath of noise on the attack keeps it from sounding like a tone.
            this.grain(out, {
              at: t,
              duration: 0.05,
              gain: near ? 0.07 : 0.032,
              freq: f * 1.4,
              q: 5,
              attack: 0.002,
            });
          }
        });
        break;
      }
    }

    return layer;
  }

  // ---------------------------------------------------------------- control

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
    layer.stopped = true;
    layer.cancels.forEach((cancel) => cancel());
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
