/**
 * A small voice for the landing page's companion.
 *
 * Deliberately separate from lib/audio.ts: the game's SFX engine belongs to
 * the signed-in app, carries its own settings and buses, and there is no
 * reason to pull it onto a marketing page. This is one context, a handful of
 * oscillators, and nothing to configure.
 *
 * The context is created on the first click, which is a user gesture, so no
 * autoplay policy is involved.
 */

let ctx: AudioContext | null = null;
let last = 0;

/** Rotating so repeated pokes answer differently rather than repeating. */
const PHRASES: number[][] = [
  [660, 880],
  [740, 988, 1175],
  [587, 784],
  [880, 1175, 1319],
  [523, 659, 784],
];
let phrase = 0;

export function chirp() {
  if (typeof window === "undefined") return;

  // A held-down pointer shouldn't machine-gun it.
  const now = performance.now();
  if (now - last < 140) return;
  last = now;

  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();

    const notes = PHRASES[phrase % PHRASES.length];
    phrase += 1;

    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.16;
    out.connect(ctx.destination);

    notes.forEach((freq, i) => {
      const at = t0 + i * 0.075;
      const dur = 0.13;

      const osc = ctx!.createOscillator();
      osc.type = "triangle";
      // a small upward bend on each note is what makes it read as a chirp
      osc.frequency.setValueAtTime(freq * 0.92, at);
      osc.frequency.exponentialRampToValueAtTime(freq, at + dur * 0.55);

      // rounding off the top keeps it soft rather than piercing
      const tone = ctx!.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2600;

      const env = ctx!.createGain();
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(1, at + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, at + dur);

      osc.connect(tone);
      tone.connect(env);
      env.connect(out);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    });

    // let the graph go once the phrase has rung out
    setTimeout(() => {
      try {
        out.disconnect();
      } catch {}
    }, 700);
  } catch {
    // a missing or blocked AudioContext should never break the page
  }
}
