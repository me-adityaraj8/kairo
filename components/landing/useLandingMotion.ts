"use client";

import { useEffect } from "react";

/**
 * All of the landing page's motion, set up once on mount.
 *
 * GSAP and ScrollTrigger are imported dynamically so they stay out of the
 * first load: the page is server-rendered and readable before any of this
 * arrives, and under prefers-reduced-motion they are never fetched at all.
 */
export function useLandingMotion(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      // Listeners on window outlive gsap.context, so they are tracked by hand.
      const teardown: (() => void)[] = [];

      /*
       * The entrance hides these elements before revealing them. If anything
       * in here throws, they would stay hidden and the page would look empty,
       * so failure puts them back rather than leaving a blank hero.
       */
      const HIDDEN = "[data-hero-mark],[data-hero-line],[data-hero-sub],[data-hero-cta],[data-hero-char],[data-reveal],[data-reveal-stagger] > *";
      const forceVisible = () => {
        document.querySelectorAll<HTMLElement>(HIDDEN).forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      };

      let ctx: gsap.Context;
      try {
      ctx = gsap.context(() => {
        /* ---------------------------------------------- hero entrance
         * One timeline so the beats overlap into a single move rather than
         * five separate fades. The wordmark leads, everything else answers it.
         */
        const intro = gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero-mark]", {
            scale: 0.4,
            rotate: -35,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.7)",
          })
          .from(
            "[data-wordmark-letter]",
            {
              yPercent: 120,
              rotateX: -75,
              scale: 0.8,
              opacity: 0,
              duration: 1.1,
              stagger: 0.07,
              ease: "back.out(1.4)",
            },
            "-=0.55"
          )
          .from("[data-wordmark-glow]", { opacity: 0, scale: 0.85, duration: 1.2 }, "-=0.9")
          .fromTo(
            "[data-wordmark-sheen]",
            { opacity: 0, xPercent: -120 },
            { opacity: 1, xPercent: 120, duration: 1.1, ease: "power2.inOut" },
            "-=0.5"
          )
          .set("[data-wordmark-sheen]", { opacity: 0 })
          .from("[data-hero-tag]", { y: 14, opacity: 0, duration: 0.7 }, "-=1.1")
          .from("[data-hero-line]", { yPercent: 110, opacity: 0, duration: 0.85, stagger: 0.09 }, "-=0.75")
          .from("[data-hero-sub]", { y: 22, opacity: 0, duration: 0.7 }, "-=0.5")
          .from("[data-hero-cta]", { y: 20, scale: 0.94, opacity: 0, duration: 0.6, stagger: 0.09, ease: "back.out(1.5)" }, "-=0.4")
          .from(
            "[data-hero-char]",
            { y: 70, scale: 0.8, opacity: 0, duration: 1.1, ease: "elastic.out(1,0.7)" },
            "-=0.8"
          );

        /*
         * The entrance hides these before revealing them, and its clock is
         * requestAnimationFrame — which a background tab throttles to nothing.
         * Opened in a background tab the hero would sit blank, so: if the page
         * is not visible, skip straight to the finished state, and keep a
         * backstop in case the timeline stalls for any other reason.
         */
        if (document.visibilityState === "hidden") {
          intro.progress(1);
        } else {
          const backstop = setTimeout(() => {
            if (intro.progress() < 1) intro.progress(1);
          }, 5000);
          teardown.push(() => clearTimeout(backstop));
        }

        const onVisible = () => {
          if (document.visibilityState === "visible" && intro.progress() < 1) intro.progress(1);
        };
        document.addEventListener("visibilitychange", onVisible);
        teardown.push(() => document.removeEventListener("visibilitychange", onVisible));

        /* ------------------------------------- wordmark idle and hover */
        gsap.fromTo(
          "[data-wordmark-glow]",
          { opacity: 0.9, scale: 1 },
          {
            opacity: 0.55,
            scale: 1.04,
            duration: 3.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1.8,
          }
        );

        const wordmark = document.querySelector<HTMLElement>("[data-wordmark]");
        if (wordmark) {
          const lettersEls = gsap.utils.toArray<HTMLElement>("[data-wordmark-letter]");
          const onWordEnter = () => {
            gsap.to(lettersEls, {
              yPercent: -12,
              scale: 1.06,
              duration: 0.5,
              stagger: { each: 0.04, from: "center" },
              ease: "back.out(2)",
            });
            gsap.fromTo(
              "[data-wordmark-sheen]",
              { opacity: 1, xPercent: -120 },
              { xPercent: 120, duration: 0.9, ease: "power2.inOut", onComplete: () => gsap.set("[data-wordmark-sheen]", { opacity: 0 }) }
            );
          };
          const onWordLeave = () =>
            gsap.to(lettersEls, {
              yPercent: 0,
              scale: 1,
              duration: 0.55,
              stagger: { each: 0.03, from: "center" },
              ease: "power3.out",
            });
          wordmark.addEventListener("pointerenter", onWordEnter);
          wordmark.addEventListener("pointerleave", onWordLeave);
          teardown.push(() => {
            wordmark.removeEventListener("pointerenter", onWordEnter);
            wordmark.removeEventListener("pointerleave", onWordLeave);
          });

          // letters splay apart a little as the hero scrolls away
          /*
           * immediateRender is off on every scrubbed tween that touches an
           * element the entrance also animates. Without it the tween records
           * whatever the entrance happens to have set at creation time — zero
           * opacity, mid-fade — and scrub then holds it there forever.
           */
          gsap.to(lettersEls, {
            yPercent: -30,
            rotateX: 30,
            opacity: 0.15,
            stagger: 0.03,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: "[data-hero]", start: "30% top", end: "bottom top", scrub: true },
          });
        }

        /* ------------------------------------------- pointer parallax */
        const layers = gsap.utils.toArray<HTMLElement>("[data-parallax]");
        const setters = layers.map((el) => ({
          depth: Number(el.dataset.parallax) || 0.2,
          x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3" }),
        }));
        const charX = gsap.quickTo("[data-hero-char]", "x", { duration: 1, ease: "power3" });
        const charRot = gsap.quickTo("[data-hero-char]", "rotate", { duration: 1.2, ease: "power3" });

        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          setters.forEach((s) => {
            s.x(-nx * 90 * s.depth);
            s.y(-ny * 60 * s.depth);
          });
          // the character leans toward the pointer rather than following it
          charX(nx * 26);
          charRot(nx * 5);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        teardown.push(() => window.removeEventListener("pointermove", onMove));

        /* -------------------------------------------- scroll parallax */
        layers.forEach((el) => {
          const depth = Number(el.dataset.parallax) || 0.2;
          gsap.to(el, {
            yPercent: depth * 34,
            ease: "none",
            scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
          });
        });

        // hero contents drift up and fade as you leave
        gsap.to("[data-hero-copy]", {
          yPercent: -22,
          opacity: 0,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: "[data-hero]", start: "40% top", end: "bottom top", scrub: true },
        });

        /* ------------------------------------------- section reveals */
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 44,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
          gsap.from(group.children, {
            y: 52,
            opacity: 0,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
          });
        });

        /* ------------------------- the loop: pinned, steps light up */
        const steps = gsap.utils.toArray<HTMLElement>("[data-loop-step]");
        if (steps.length) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: "[data-loop]",
              start: "top top",
              end: () => `+=${steps.length * 260}`,
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
            },
          });
          steps.forEach((step) => {
            tl.to(step, { opacity: 1, x: 0, duration: 1 }).to(
              step.querySelector("[data-loop-rail]"),
              { scaleX: 1, duration: 1 },
              "<"
            );
          });
        }

        /* -------------------------------------------- magnetic buttons */
        gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
          const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
          const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
          const enter = () => gsap.to(el, { scale: 1.04, duration: 0.3, ease: "power2.out" });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            mx((e.clientX - (r.left + r.width / 2)) * 0.28);
            my((e.clientY - (r.top + r.height / 2)) * 0.4);
          };
          const leave = () => {
            mx(0);
            my(0);
            gsap.to(el, { scale: 1, duration: 0.4, ease: "power2.out" });
          };
          el.addEventListener("pointerenter", enter);
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
        });

        /* ------------------------------------------------- card tilt */
        gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((card) => {
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
          const glow = card.querySelector<HTMLElement>("[data-tilt-glow]");
          gsap.set(card, { transformPerspective: 900, transformOrigin: "center" });

          card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            ry((px - 0.5) * 16);
            rx((0.5 - py) * 16);
            if (glow) {
              glow.style.setProperty("--gx", `${px * 100}%`);
              glow.style.setProperty("--gy", `${py * 100}%`);
              glow.style.opacity = "1";
            }
          });
          card.addEventListener("pointerleave", () => {
            rx(0);
            ry(0);
            if (glow) glow.style.opacity = "0";
          });

          // the card lifts and its icon pops — small, but it makes the card
          // feel picked up rather than merely hovered
          const icon = card.querySelector("[data-card-icon]");
          card.addEventListener("pointerenter", () => {
            gsap.to(card, { y: -8, scale: 1.02, duration: 0.45, ease: "power3.out" });
            if (icon) gsap.to(icon, { scale: 1.18, rotate: -8, duration: 0.5, ease: "back.out(2.4)" });
          });
          card.addEventListener("pointerleave", () => {
            gsap.to(card, { y: 0, scale: 1, duration: 0.5, ease: "power3.out" });
            if (icon) gsap.to(icon, { scale: 1, rotate: 0, duration: 0.5, ease: "power3.out" });
          });
        });

        /* ------------------------------------------- button press feel */
        gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
          const down = () => gsap.to(el, { scale: 0.95, duration: 0.12, ease: "power2.out" });
          const up = () => gsap.to(el, { scale: 1.04, duration: 0.3, ease: "back.out(3)" });
          el.addEventListener("pointerdown", down);
          el.addEventListener("pointerup", up);
          teardown.push(() => {
            el.removeEventListener("pointerdown", down);
            el.removeEventListener("pointerup", up);
          });
        });

        /* ------------------------------- companion answers a click on it */
        const heroChar = document.querySelector<HTMLElement>("[data-hero-char]");
        if (heroChar) {
          const poke = () => {
            gsap
              .timeline()
              .to(heroChar, { scaleX: 1.12, scaleY: 0.88, duration: 0.12, ease: "power2.out" })
              .to(heroChar, { scaleX: 0.94, scaleY: 1.1, duration: 0.14 })
              .to(heroChar, { scaleX: 1, scaleY: 1, y: -18, duration: 0.22, ease: "power2.out" })
              .to(heroChar, { y: 0, duration: 0.5, ease: "bounce.out" });
          };
          heroChar.addEventListener("pointerdown", poke);
          teardown.push(() => heroChar.removeEventListener("pointerdown", poke));
        }

        /* ----------------------------------------- cursor aura + sparks
         * Two lagged layers so the light bends behind fast movement. Only
         * wired up for fine pointers — on touch there is nothing to follow.
         */
        const fine = window.matchMedia("(pointer: fine)").matches;
        const canvas = document.querySelector<HTMLCanvasElement>("[data-spark-canvas]");

        if (fine) {
          const farX = gsap.quickTo("[data-aura-far]", "x", { duration: 0.9, ease: "power3" });
          const farY = gsap.quickTo("[data-aura-far]", "y", { duration: 0.9, ease: "power3" });
          const nearX = gsap.quickTo("[data-aura-near]", "x", { duration: 0.35, ease: "power3" });
          const nearY = gsap.quickTo("[data-aura-near]", "y", { duration: 0.35, ease: "power3" });

          const onAura = (e: PointerEvent) => {
            farX(e.clientX);
            farY(e.clientY);
            nearX(e.clientX);
            nearY(e.clientY);
          };
          window.addEventListener("pointermove", onAura, { passive: true });
          teardown.push(() => window.removeEventListener("pointermove", onAura));

          // the aura swells over anything interactive
          const swell = (to: number) => () =>
            gsap.to("[data-aura-near]", { scale: to, duration: 0.4, ease: "power2.out" });
          document.querySelectorAll<HTMLElement>("a,button,[data-tilt]").forEach((el) => {
            const on = swell(1.9);
            const off = swell(1);
            el.addEventListener("pointerenter", on);
            el.addEventListener("pointerleave", off);
            teardown.push(() => {
              el.removeEventListener("pointerenter", on);
              el.removeEventListener("pointerleave", off);
            });
          });
        }

        if (fine && canvas) {
          const ctx2d = canvas.getContext("2d");
          type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: number };
          let sparks: Spark[] = [];
          let raf = 0;

          const size = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx2d?.setTransform(dpr, 0, 0, dpr, 0, 0);
          };
          size();
          window.addEventListener("resize", size);
          teardown.push(() => window.removeEventListener("resize", size));

          const frame = () => {
            raf = 0;
            if (!ctx2d) return;
            ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
            ctx2d.globalCompositeOperation = "lighter";
            sparks = sparks.filter((p) => p.life > 0);
            sparks.forEach((p) => {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.16;
              p.vx *= 0.98;
              p.life -= 0.02;
              ctx2d.beginPath();
              ctx2d.arc(p.x, p.y, Math.max(0, p.life * 3.2), 0, Math.PI * 2);
              ctx2d.fillStyle = `hsla(${p.hue},95%,68%,${Math.max(0, p.life) * 0.8})`;
              ctx2d.fill();
            });
            if (sparks.length) raf = requestAnimationFrame(frame);
          };

          const burst = (e: PointerEvent) => {
            for (let i = 0; i < 16; i++) {
              const a = (i / 16) * Math.PI * 2 + Math.random();
              const sp = 1.6 + Math.random() * 3.4;
              sparks.push({
                x: e.clientX,
                y: e.clientY,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.2,
                life: 0.7 + Math.random() * 0.4,
                hue: 265 + Math.random() * 60,
              });
            }
            if (!raf) raf = requestAnimationFrame(frame);
          };
          window.addEventListener("pointerdown", burst);
          teardown.push(() => {
            window.removeEventListener("pointerdown", burst);
            cancelAnimationFrame(raf);
          });
        }

        /* ------------------------------ the character crosses the page
         * One tween over the whole document, so the companion travels with
         * you between sections instead of each section animating alone.
         */
        gsap.to("[data-hero-char]", {
          yPercent: 22,
          scale: 0.86,
          opacity: 0.5,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: "[data-hero]", start: "50% top", end: "bottom top", scrub: 0.8 },
        });

        /* --------------------------------------------- light trails */
        gsap.to("[data-trail]", {
          opacity: 0.15,
          xPercent: 40,
          duration: 3.2,
          ease: "sine.inOut",
          stagger: { each: 0.5, repeat: -1, yoyo: true },
        });
      });

      } catch (err) {
        console.error("landing motion failed, showing the page unanimated", err);
        forceVisible();
        return;
      }

      cleanup = () => {
        teardown.forEach((fn) => fn());
        ctx.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled]);
}
