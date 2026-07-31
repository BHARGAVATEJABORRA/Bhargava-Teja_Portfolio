"use client";

// TIDES — the cinematic canvas ocean (codepen.io/Chathura-Jayasanka/pen/emBMYWJ)
// implemented as a scroll-driven section. The pen's time-of-day slider becomes a
// pure function of this section's scroll progress: the ocean enters MOONLIT out
// of the Blogs night seam (t = 0) and sweeps the pen's own day keys up to SUNSET
// (t = 1) exactly as the section's bottom reaches the footer — at which point the
// footer's fixed sky (footer-sky-painter.ts) fades in on the *same* sunset
// endpoints, so the section→footer boundary is a same-color crossfade, never a
// cut. See the palette contract in tides-painter.ts.

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import {
  advanceTidesWorld,
  createTidesWorld,
  drawTides,
  formatMoodClock,
  getTidesPalette,
  mulberry32,
} from "@/components/scenes/tides-painter";
import { clamp01 } from "@/components/scenes/footer-sky-painter";
import { subscribeToScroll } from "@/lib/scroll-progress";

export function TidesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moodNameRef = useRef<HTMLSpanElement | null>(null);
  const moodTimeRef = useRef<HTMLSpanElement | null>(null);
  const trackFillRef = useRef<HTMLSpanElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!section || !canvas || !context) {
      return;
    }

    // Set dressing (stars/clouds/birds) persists across frames. A seeded PRNG
    // keeps the whole scene byte-identical under reduced motion.
    const random = shouldReduceMotion ? mulberry32(0x7d1e5) : Math.random;
    const world = createTidesWorld(random);

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;

    // 0 while the section is still entering from below (sky holds MOONLIT, the
    // same dark the Blogs seam lands on), sweeping to 1 the moment the section
    // bottom reaches the viewport bottom (sky lands on SUNSET for the footer).
    let timeOfDay = 0;
    const readScroll = () => {
      const rect = section.getBoundingClientRect();
      const span = section.offsetHeight - window.innerHeight;
      timeOfDay = span > 0 ? clamp01(-rect.top / span) : 0;
    };

    const sizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = Math.max(1, window.innerWidth);
      cssHeight = Math.max(1, window.innerHeight);
      const nextW = Math.round(cssWidth * dpr);
      const nextH = Math.round(cssHeight * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateOverlay = () => {
      const palette = getTidesPalette(timeOfDay);
      if (moodNameRef.current) {
        moodNameRef.current.textContent = palette.name;
      }
      if (moodTimeRef.current) {
        moodTimeRef.current.textContent = formatMoodClock(palette.hour);
      }
      if (trackFillRef.current) {
        trackFillRef.current.style.transform = `scaleX(${timeOfDay})`;
      }
    };

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    // --- Reduced motion: a still frame, repainted only on scroll ----------
    if (shouldReduceMotion) {
      const paintStill = () => {
        readScroll();
        const still = mulberry32(0x51de5);
        drawTides(
          context,
          cssWidth,
          cssHeight,
          world,
          { timeOfDay, time: 18.4, sunDrift: 0.5 },
          still,
        );
        updateOverlay();
      };
      paintStill();
      const unsubscribe = subscribeToScroll(paintStill);
      return () => {
        unsubscribe();
        window.removeEventListener("resize", sizeCanvas);
      };
    }

    // --- Live loop: waves + drift run on rAF, scroll only sets timeOfDay ----
    let raf = 0;
    let last = performance.now();
    const FRAME_MS = 1000 / 60;

    const tick = (now: number) => {
      const elapsed = Math.min(now - last, 64);
      last = now;
      const frames = elapsed / FRAME_MS;

      readScroll();
      advanceTidesWorld(world, frames, random);
      drawTides(
        context,
        cssWidth,
        cssHeight,
        world,
        { timeOfDay, time: now / 1000, sunDrift: 0.5 + Math.sin(now * 0.00004) * 0.5 },
        random,
      );
      updateOverlay();
      raf = window.requestAnimationFrame(tick);
    };

    // Only animate while the section is anywhere near the viewport.
    let visible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true;
          last = performance.now();
          raf = window.requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          window.cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(section);

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", sizeCanvas);
    };
  }, [shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="tides-title"
      className="relative isolate -mt-px h-[240vh] bg-[#050e11]"
    >
      <h2 id="tides-title" className="sr-only">
        Tides — a cinematic ocean
      </h2>

      {/* The painted ocean sticks to the viewport while the section scrolls,
          giving the time-of-day sweep its full travel. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden
          data-scroll-scene="tides-ocean"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {/* UI overlay — typeset to match the footer's label system. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-[clamp(1.25rem,3vw,2.5rem)] px-[clamp(1.5rem,4vw,3.25rem)]">
          <div className="flex items-start justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white/60">
              ◑&nbsp;&nbsp;Tides
            </p>
            <div className="text-right">
              <span
                ref={moodNameRef}
                className="block text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-white/48"
              >
                MOONLIT
              </span>
              <span className="block text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-none text-white/90">
                <span ref={moodTimeRef}>04:30</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <p className="max-w-md text-[clamp(0.95rem,1.5vw,1.15rem)] leading-snug text-white/55">
              Same sea — <span className="italic text-white/70">every hour a different blue.</span>
            </p>
            <div className="flex items-center gap-4">
              <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                Moonlit
              </span>
              <span className="relative h-px flex-1 overflow-hidden bg-white/15">
                <span
                  ref={trackFillRef}
                  className="absolute inset-0 origin-left bg-white/70"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
              <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                Sunset
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
