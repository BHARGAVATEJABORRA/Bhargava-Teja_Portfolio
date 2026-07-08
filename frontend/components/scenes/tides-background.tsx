"use client";

// Site-wide TIDES day cycle (§ replaces the old per-section ocean). One fixed
// ocean/sky canvas behind the *entire* page: the pen's time-of-day becomes a
// pure function of GLOBAL scroll progress. At the top (post-greeting) the sun
// sits on the horizon — SUNRISE — and the day climbs through MORNING / MIDDAY /
// GOLDEN HOUR as you scroll your content, landing on SUNSET right as the footer
// arrives. From there the footer's own fixed sky (footer-sky-painter.ts) fades
// in on the *same* sunset endpoints, so day → footer is a seamless crossfade.
//
// Layering: this whole layer sits at z-index -1 — above the body's base paint,
// behind all content (most sections are background-less, so the sky shows
// through). A scroll-graded veil keeps mid-page copy readable without flattening
// the day. (The footer owns the clouds; this layer stays clean sky + water.)

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import {
  advanceTidesWorld,
  createTidesWorld,
  drawTides,
  mulberry32,
} from "@/components/scenes/tides-painter";
import { clamp01, smoothStep } from "@/components/scenes/footer-sky-painter";
import { subscribeToScroll } from "@/lib/scroll-progress";

// Day runs SUNRISE (t = 0.14, sun on the horizon) → SUNSET (t = 1). The arc
// completes by 82% of the page so the last stretch holds sunset for the footer
// crossfade. MOONLIT (t = 0) is intentionally never reached — night lives in
// the footer.
const SUNRISE_T = 0.14;
const DAY_SPAN = 0.82;

function timeOfDayFor(progress: number) {
  const day = clamp01(progress / DAY_SPAN);
  return SUNRISE_T + day * (1 - SUNRISE_T);
}

// Readability veil over the ocean: ~0 at the hero (full sunrise), easing up to a
// translucent scrim through the content band, then relaxing again toward the
// footer so the sunset stays vivid into the handoff.
function veilOpacityFor(progress: number) {
  const rampIn = smoothStep((progress - 0.05) / 0.13);
  const relaxOut = 1 - 0.82 * smoothStep((progress - 0.56) / 0.18);
  return 0.46 * rampIn * relaxOut;
}

export function TidesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const reduceMotion = useReducedMotion();

  // Global scroll progress — identical source to AmbientAurora.
  useEffect(() => {
    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current = maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
    };
    update();
    return subscribeToScroll(update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) {
      return;
    }

    const random = reduceMotion ? mulberry32(0x7d1e5) : Math.random;
    const world = createTidesWorld(random);

    let cssWidth = 0;
    let cssHeight = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = Math.max(1, window.innerWidth);
      cssHeight = Math.max(1, window.innerHeight);
      const nextW = Math.round(cssWidth * dpr);
      const nextH = Math.round(cssHeight * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const applyScrollLinked = () => {
      const progress = progressRef.current;

      if (veilRef.current) {
        veilRef.current.style.opacity = veilOpacityFor(progress).toFixed(3);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      const paintStill = () => {
        const palette = timeOfDayFor(progressRef.current);
        drawTides(context, cssWidth, cssHeight, world, { timeOfDay: palette, time: 17.6, sunDrift: 0.5 }, mulberry32(0x51de5));
        applyScrollLinked();
      };
      paintStill();
      const unsubscribe = subscribeToScroll(paintStill);
      return () => {
        unsubscribe();
        window.removeEventListener("resize", resize);
      };
    }

    let raf = 0;
    let last = performance.now();
    const FRAME_MS = 1000 / 60;

    const tick = (now: number) => {
      const elapsed = Math.min(now - last, 64);
      last = now;
      advanceTidesWorld(world, elapsed / FRAME_MS, random);
      drawTides(
        context,
        cssWidth,
        cssHeight,
        world,
        {
          timeOfDay: timeOfDayFor(progressRef.current),
          time: now / 1000,
          sunDrift: 0.5 + Math.sin(now * 0.00003) * 0.5,
        },
        random,
      );
      applyScrollLinked();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduceMotion]);

  return (
    <>
      <div aria-hidden data-tides-background className="pointer-events-none fixed inset-0" style={{ zIndex: -1 }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Readability veil — scroll-graded so the hero sunrise and the sunset
            stay vivid while mid-page content keeps its contrast. */}
        <div
          ref={veilRef}
          className="absolute inset-0"
          style={{
            opacity: 0,
            background:
              "linear-gradient(180deg, rgba(4,9,16,0.18) 0%, rgba(4,9,16,0.52) 40%, rgba(4,9,16,0.62) 100%)",
          }}
        />
      </div>

    </>
  );
}
