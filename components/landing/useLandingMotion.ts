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
        /* ---------------------------------------------- hero entrance */
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero-mark]", { scale: 0.6, opacity: 0, duration: 0.9, ease: "back.out(1.6)" })
          .from("[data-hero-line]", { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.45")
          .from("[data-hero-sub]", { y: 18, opacity: 0, duration: 0.6 }, "-=0.4")
          .from("[data-hero-cta]", { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.35")
          .from("[data-hero-char]", { y: 40, opacity: 0, duration: 0.9, ease: "power2.out" }, "-=0.7");

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
