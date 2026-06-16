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
// the day, and a drift of cloud sprites thickens through golden hour → sunset to
// hand the sky into the footer's cloud band.

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

// Clouds gather as the sun lowers: nothing through the bright day, thickening
// across golden hour → sunset so they are dense exactly where the footer's own
// cloud plate picks up.
function cloudIntensityFor(progress: number) {
  const day = clamp01(progress / DAY_SPAN);
  return smoothStep((day - 0.58) / 0.34);
}

// Readability veil over the ocean: ~0 at the hero (full sunrise), easing up to a
// translucent scrim through the content band, then relaxing again toward the
// footer so the sunset + clouds stay vivid into the handoff.
function veilOpacityFor(progress: number) {
  const rampIn = smoothStep((progress - 0.05) / 0.13);
  const relaxOut = 1 - 0.82 * smoothStep((progress - 0.56) / 0.18);
  return 0.46 * rampIn * relaxOut;
}

interface CloudSprite {
  src: string;
  baseX: number; // 0–1 start position
  y: number; // 0–1 of the sky band (above the horizon)
  scale: number; // fraction of viewport width
  speed: number; // viewport-fractions per second
  depth: number; // 0 far (faint/slow) → 1 near
}

const CLOUDS: CloudSprite[] = [
  { src: "/tides/clouds/cloud-03.png", baseX: 0.04, y: 0.06, scale: 0.52, speed: 0.006, depth: 0.25 },
  { src: "/tides/clouds/cloud-wisp.png", baseX: 0.55, y: 0.02, scale: 0.46, speed: 0.009, depth: 0.4 },
  { src: "/tides/clouds/cloud-01.png", baseX: 0.32, y: 0.13, scale: 0.6, speed: 0.013, depth: 0.7 },
  { src: "/tides/clouds/cloud-02.png", baseX: 0.72, y: 0.18, scale: 0.5, speed: 0.018, depth: 1 },
];

export function TidesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const cloudLayerRef = useRef<HTMLDivElement | null>(null);
  const cloudRefs = useRef<(HTMLImageElement | null)[]>([]);
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

    const applyScrollLinked = (timeSeconds: number) => {
      const progress = progressRef.current;
      const palette = getTidesPalette(timeOfDayFor(progress));

      if (veilRef.current) {
        veilRef.current.style.opacity = veilOpacityFor(progress).toFixed(3);
      }

      // Cloud drift + fade. Drift continues under reduced motion via scroll only
      // (timeSeconds is frozen), which is fine — they simply hold position.
      const cloudAlpha = cloudIntensityFor(progress);
      if (cloudLayerRef.current) {
        cloudLayerRef.current.style.opacity = cloudAlpha.toFixed(3);
      }
      if (cloudAlpha > 0.001) {
        cloudRefs.current.forEach((img, i) => {
          if (!img) {
            return;
          }
          const c = CLOUDS[i];
          const drift = (c.baseX + timeSeconds * c.speed) % 1.4;
          const x = (drift - 0.2) * 100;
          img.style.transform = `translate3d(${x.toFixed(2)}vw, 0, 0)`;
        });
      }

    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      const paintStill = () => {
        const palette = timeOfDayFor(progressRef.current);
        drawTides(context, cssWidth, cssHeight, world, { timeOfDay: palette, time: 17.6, sunDrift: 0.5 }, mulberry32(0x51de5));
        applyScrollLinked(0);
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
      applyScrollLinked(now / 1000);
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

        {/* Drifting sunset clouds — sit in the upper sky band, thicken near
            sunset, and hand the sky into the footer's cloud plate. */}
        <div ref={cloudLayerRef} className="absolute inset-x-0 top-0 h-[46%] overflow-hidden" style={{ opacity: 0 }}>
          {CLOUDS.map((cloud, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={cloud.src + index}
              ref={(node) => {
                cloudRefs.current[index] = node;
              }}
              src={cloud.src}
              alt=""
              aria-hidden
              className="absolute select-none mix-blend-screen"
              style={{
                top: `${cloud.y * 100}%`,
                width: `${cloud.scale * 100}vw`,
                opacity: 0.5 + cloud.depth * 0.5,
                filter: `saturate(${0.72 + cloud.depth * 0.2}) brightness(${0.96 + cloud.depth * 0.08})`,
              }}
            />
          ))}
        </div>

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
