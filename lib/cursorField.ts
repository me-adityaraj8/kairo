/**
 * Canvas particle field that reacts to the pointer.
 *
 * One canvas, one rAF loop, one pre-rendered glow sprite drawn with additive
 * blending. Pre-rendering the glow matters: per-particle shadowBlur or gradient
 * creation is what makes these effects stutter.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  kind: "ambient" | "trail" | "spark";
};

export type FieldQuality = "off" | "low" | "high";

const HUES = { xp: 168, gold: 44, violet: 276, blue: 212 };

function glowSprite(hue: number) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `hsla(${hue},100%,72%,0.95)`);
  grad.addColorStop(0.35, `hsla(${hue},100%,62%,0.35)`);
  grad.addColorStop(1, `hsla(${hue},100%,60%,0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export class CursorField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites = new Map<number, HTMLCanvasElement>();
  private hueList: number[] = [];
  private particles: Particle[] = [];
  private raf = 0;
  private running = false;

  // true pointer, and the lagging ring that follows it
  private px = -9999;
  private py = -9999;
  private rx = -9999;
  private ry = -9999;
  private lastX = -9999;
  private lastY = -9999;
  private speed = 0;
  private hovering = false;
  private pressed = false;
  private dpr = 1;
  private quality: FieldQuality = "high";
  private ambientTarget = 70;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.hueList = Object.values(HUES);
    this.hueList.forEach((h) => this.sprites.set(h, glowSprite(h)));
    this.resize();
  }

  setQuality(q: FieldQuality) {
    this.quality = q;
    this.ambientTarget = q === "high" ? 70 : q === "low" ? 28 : 0;
    if (q === "off") this.particles = [];
  }

  resize = () => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(window.innerWidth * this.dpr);
    this.canvas.height = Math.floor(window.innerHeight * this.dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
  };

  pointer(x: number, y: number) {
    this.px = x;
    this.py = y;
    if (this.rx < -9000) {
      this.rx = x;
      this.ry = y;
    }
  }

  setHovering(v: boolean) {
    this.hovering = v;
  }

  setPressed(v: boolean) {
    this.pressed = v;
  }

  /** Reward burst. `tone` picks the colour family. */
  burst(x: number, y: number, tone: keyof typeof HUES = "gold", count = 26) {
    if (this.quality === "off") return;
    const n = this.quality === "low" ? Math.round(count / 2) : count;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const sp = 2.2 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        maxLife: 0.7 + Math.random() * 0.6,
        size: 7 + Math.random() * 12,
        hue: HUES[tone] + (Math.random() * 24 - 12),
        kind: "spark",
      });
    }
  }

  /** Closest pre-rendered sprite hue, without allocating per particle. */
  private nearestHue(hue: number) {
    let best = this.hueList[0];
    let bestDelta = Math.abs(best - hue);
    for (let i = 1; i < this.hueList.length; i++) {
      const d = Math.abs(this.hueList[i] - hue);
      if (d < bestDelta) {
        best = this.hueList[i];
        bestDelta = d;
      }
    }
    return best;
  }

  private spawnAmbient() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.particles.push({
      x: Math.random() * w,
      y: h + 20,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.16 + Math.random() * 0.4),
      life: 1,
      maxLife: 1,
      size: 4 + Math.random() * 7,
      hue: Math.random() > 0.55 ? HUES.gold : HUES.xp,
      kind: "ambient",
    });
  }

  private step = () => {
    if (!this.running) return;
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (this.quality !== "off") {
      // ring trails the pointer with inertia so it reads as physical
      this.rx += (this.px - this.rx) * 0.16;
      this.ry += (this.py - this.ry) * 0.16;

      const dx = this.px - this.lastX;
      const dy = this.py - this.lastY;
      this.speed = Math.min(60, Math.hypot(dx, dy));
      this.lastX = this.px;
      this.lastY = this.py;

      // emit trail while moving
      if (this.px > -9000 && this.speed > 1.4) {
        const emit = this.quality === "high" ? Math.min(3, Math.floor(this.speed / 6) + 1) : 1;
        for (let i = 0; i < emit; i++) {
          this.particles.push({
            x: this.px + (Math.random() - 0.5) * 8,
            y: this.py + (Math.random() - 0.5) * 8,
            vx: -dx * 0.05 + (Math.random() - 0.5) * 0.7,
            vy: -dy * 0.05 + (Math.random() - 0.5) * 0.7,
            life: 1,
            maxLife: 0.45 + Math.random() * 0.4,
            size: 5 + Math.random() * 8,
            hue: this.hovering ? HUES.gold : HUES.xp,
            kind: "trail",
          });
        }
      }

      // occasional spark near the cursor
      if (this.quality === "high" && this.px > -9000 && Math.random() < 0.02) {
        const a = Math.random() * Math.PI * 2;
        const r = 18 + Math.random() * 26;
        this.particles.push({
          x: this.px + Math.cos(a) * r,
          y: this.py + Math.sin(a) * r,
          vx: Math.cos(a) * 0.5,
          vy: Math.sin(a) * 0.5 - 0.3,
          life: 1,
          maxLife: 0.5,
          size: 4 + Math.random() * 5,
          hue: HUES.violet,
          kind: "spark",
        });
      }

      while (
        this.particles.filter((p) => p.kind === "ambient").length < this.ambientTarget &&
        this.particles.length < 260
      ) {
        this.spawnAmbient();
        // seed the first screenful at random heights instead of all from below
        const last = this.particles[this.particles.length - 1];
        if (last) last.y = Math.random() * h;
      }
    }

    ctx.globalCompositeOperation = "lighter";

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.kind === "ambient") {
        // ambient motes are pushed away from the cursor, then drift back up
        const ax = p.x - this.px;
        const ay = p.y - this.py;
        const d2 = ax * ax + ay * ay;
        if (d2 < 26000 && d2 > 1) {
          const d = Math.sqrt(d2);
          const force = (1 - d / 161) * 0.9;
          p.vx += (ax / d) * force;
          p.vy += (ay / d) * force;
        }
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 - 0.006;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -30 || p.x < -40 || p.x > w + 40) {
          this.particles.splice(i, 1);
          continue;
        }
      } else {
        p.life -= 0.016 / p.maxLife;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.vy += p.kind === "spark" ? 0.04 : 0.01;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
      }

      const sprite = this.sprites.get(this.nearestHue(p.hue))!;
      const alpha = p.kind === "ambient" ? 0.5 : p.life;
      const size = p.size * (p.kind === "ambient" ? 1 : 0.6 + p.life * 0.8);

      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
    }

    // cursor light + ring
    if (this.quality !== "off" && this.px > -9000) {
      const pulse = this.pressed ? 0.6 : this.hovering ? 1.35 : 1;
      const light = this.sprites.get(this.hovering ? HUES.gold : HUES.violet)!;
      const lightSize = 260 * pulse;
      ctx.globalAlpha = this.hovering ? 0.4 : 0.26;
      ctx.drawImage(light, this.rx - lightSize / 2, this.ry - lightSize / 2, lightSize, lightSize);

      const ringSize = (this.hovering ? 46 : 34) * (this.pressed ? 0.8 : 1);
      ctx.globalAlpha = 0.9;
      const ring = this.sprites.get(this.hovering ? HUES.gold : HUES.xp)!;
      ctx.drawImage(ring, this.rx - ringSize / 2, this.ry - ringSize / 2, ringSize, ringSize);

      ctx.globalAlpha = 1;
      const dot = this.sprites.get(HUES.gold)!;
      ctx.drawImage(dot, this.px - 7, this.py - 7, 14, 14);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.raf = requestAnimationFrame(this.step);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.step);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.stop();
    this.particles = [];
    this.sprites.clear();
  }
}
