"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useReducedMotion, useTransform } from "framer-motion";

// Client-only layers: the aurora + dock are WebGL and the meteors drive raw
// DOM nodes — none of them can server-render, so ssr:false keeps the SSR
// markup clean and prevents silent hydration failures on Vercel.
const FooterAurora = dynamic(
  () => import("@/components/scenes/ambient-aurora").then((m) => m.FooterAurora),
  { ssr: false },
);
const FooterMeteors = dynamic(
  () => import("@/components/scenes/footer-meteors").then((m) => m.FooterMeteors),
  { ssr: false },
);
const FooterStars = dynamic(
  () => import("@/components/scenes/footer-stars").then((m) => m.FooterStars),
  { ssr: false },
);
const FooterDockThree = dynamic(
  () => import("@/components/scenes/footer-dock-three").then((m) => m.FooterDockThree),
  { ssr: false },
);
import {
  clamp01,
  cloudTint,
  footerSkyKey,
  paintFooterClouds,
  paintFooterSky,
  starsAlpha,
} from "@/components/scenes/footer-sky-painter";
import { subscribeToScroll } from "@/lib/scroll-progress";

// Shared helpers for the client-only mounted check (stable identities so the
// store never resubscribes).
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const footerSceneTheme = {
  "--color-ink": "#f2fbff",
  "--color-muted-ink": "rgba(224, 243, 247, 0.72)",
  "--color-border": "rgba(221, 244, 255, 0.24)",
  "--color-accent": "#74ffd2",
  "--color-accent-strong": "#42e9c0",
} as CSSProperties;

const heroLowerMask = {
  WebkitMaskImage: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.18) 18%, rgba(0, 0, 0, 0.82) 42%, rgba(0, 0, 0, 1) 72%)",
  maskImage: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.18) 18%, rgba(0, 0, 0, 0.82) 42%, rgba(0, 0, 0, 1) 72%)",
} satisfies CSSProperties;

const heroForegroundMask = {
  WebkitMaskImage: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.24) 18%, rgba(0, 0, 0, 1) 54%, rgba(0, 0, 0, 1) 100%)",
  maskImage: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.24) 18%, rgba(0, 0, 0, 1) 54%, rgba(0, 0, 0, 1) 100%)",
} satisfies CSSProperties;

const heroFrameMask = {
  WebkitMaskImage:
    "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 72%, rgba(0, 0, 0, 0.44) 90%, rgba(0, 0, 0, 0.8) 100%)",
  maskImage:
    "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 72%, rgba(0, 0, 0, 0.44) 90%, rgba(0, 0, 0, 0.8) 100%)",
} satisfies CSSProperties;

const HERO_SEQUENCE_START = 2;
const HERO_SEQUENCE_END = 281;
const HERO_SEQUENCE_REVEAL_PROGRESS = 0.84;
const HERO_SEQUENCE_FRAME_COUNT = HERO_SEQUENCE_END - HERO_SEQUENCE_START + 1;
const HERO_SEQUENCE_SMOOTHING = 0.12;
const HERO_SEQUENCE_PRIORITY_FRAMES = [2, 3, 4, 8, 18, 40, 72, 89, 120, 160, 200, 240, 281] as const;
const HERO_SEQUENCE_HIGH_FRAMES = [1, 89, 281] as const;

type HeroFrameQuality = "standard" | "high";

function buildHeroSequenceFrameUrl(frame: number) {
  return `/adaline-scenes/hero-sequence/desktop/graded_4K_100_gm_50_1080_3-${String(frame).padStart(3, "0")}.jpg`;
}

function buildHeroSequenceHighFrameUrl(frame: number) {
  return `/adaline-scenes/hero-sequence/high/graded_4K_100_gm_85_1440_3-${String(frame).padStart(3, "0")}.jpg`;
}

function clampFrame(frame: number) {
  return Math.min(HERO_SEQUENCE_END, Math.max(HERO_SEQUENCE_START, frame));
}

function progressToFrame(progress: number) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const frameOffset = Math.round(clampedProgress * (HERO_SEQUENCE_FRAME_COUNT - 1));
  return clampFrame(HERO_SEQUENCE_START + frameOffset);
}

// Drifting sunset clouds for the warm dusk band. Each cloud is a cluster of
// 4-6 overlapping blurred ellipses (never a single flat pill), drifting
// horizontally on an infinite loop at its own speed for parallax. Negative
// delays start every cloud mid-flight so the band is populated the moment it
// scrolls into view.
interface CloudPuff {
  left: string;
  top: string;
  width: string;
  height: string;
  blur: string;
  alpha: number;
}

interface DriftCloud {
  top: string;
  width: string;
  height: string;
  duration: string;
  delay: string;
  opacity: number;
  puffs: CloudPuff[];
}

const DRIFT_CLOUDS: readonly DriftCloud[] = [
  {
    top: "6%",
    width: "34rem",
    height: "9rem",
    duration: "95s",
    delay: "-20s",
    opacity: 0.42,
    puffs: [
      { left: "6%", top: "38%", width: "44%", height: "52%", blur: "14px", alpha: 0.5 },
      { left: "26%", top: "10%", width: "40%", height: "62%", blur: "12px", alpha: 0.62 },
      { left: "48%", top: "30%", width: "42%", height: "56%", blur: "16px", alpha: 0.55 },
      { left: "18%", top: "52%", width: "52%", height: "44%", blur: "18px", alpha: 0.42 },
      { left: "62%", top: "44%", width: "34%", height: "40%", blur: "14px", alpha: 0.38 },
    ],
  },
  {
    top: "17%",
    width: "26rem",
    height: "7rem",
    duration: "120s",
    delay: "-70s",
    opacity: 0.3,
    puffs: [
      { left: "10%", top: "30%", width: "42%", height: "54%", blur: "16px", alpha: 0.5 },
      { left: "34%", top: "12%", width: "38%", height: "60%", blur: "12px", alpha: 0.58 },
      { left: "54%", top: "36%", width: "38%", height: "48%", blur: "18px", alpha: 0.44 },
      { left: "22%", top: "54%", width: "46%", height: "40%", blur: "20px", alpha: 0.36 },
    ],
  },
  {
    top: "28%",
    width: "40rem",
    height: "10rem",
    duration: "75s",
    delay: "-45s",
    opacity: 0.36,
    puffs: [
      { left: "4%", top: "42%", width: "38%", height: "48%", blur: "16px", alpha: 0.46 },
      { left: "24%", top: "16%", width: "44%", height: "58%", blur: "13px", alpha: 0.6 },
      { left: "50%", top: "28%", width: "40%", height: "54%", blur: "15px", alpha: 0.52 },
      { left: "66%", top: "48%", width: "30%", height: "42%", blur: "18px", alpha: 0.4 },
      { left: "14%", top: "56%", width: "50%", height: "40%", blur: "20px", alpha: 0.38 },
      { left: "40%", top: "50%", width: "36%", height: "44%", blur: "17px", alpha: 0.42 },
    ],
  },
  {
    top: "40%",
    width: "22rem",
    height: "6rem",
    duration: "110s",
    delay: "-95s",
    opacity: 0.26,
    puffs: [
      { left: "12%", top: "34%", width: "40%", height: "52%", blur: "14px", alpha: 0.48 },
      { left: "36%", top: "16%", width: "36%", height: "58%", blur: "12px", alpha: 0.54 },
      { left: "52%", top: "40%", width: "36%", height: "46%", blur: "18px", alpha: 0.4 },
      { left: "24%", top: "54%", width: "42%", height: "38%", blur: "20px", alpha: 0.34 },
    ],
  },
] as const;

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function resizeCanvasToViewport(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nextWidth = Math.round(window.innerWidth * dpr);
  const nextHeight = Math.round(window.innerHeight * dpr);

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  return { width: nextWidth, height: nextHeight };
}

interface AdalineHeroSceneProps {
  progress: MotionValue<number>;
  enableSequence: boolean;
}

export function AdalineHeroScene({ progress, enableSequence }: AdalineHeroSceneProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const standardFramesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const highFramesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const renderRafRef = useRef<number | null>(null);
  const preloadTimeoutRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const smoothedProgressRef = useRef(0);
  const lastDrawnFrameRef = useRef<number | null>(null);

  const roomVignetteOpacity = useTransform(progress, [0.28, 0.7], [0, 1]);
  const roomAtmosphereOpacity = useTransform(progress, [0.38, 0.76], [0, 1]);

  const ensureFrame = useCallback((frame: number, quality: HeroFrameQuality) => {
    const safeFrame = quality === "high" ? frame : clampFrame(frame);
    const targetMap = quality === "high" ? highFramesRef.current : standardFramesRef.current;
    const existing = targetMap.get(safeFrame);

    if (existing) {
      return existing;
    }

    const image = new Image();
    image.decoding = "async";
    image.loading = quality === "high" ? "eager" : "lazy";
    image.src = quality === "high" ? buildHeroSequenceHighFrameUrl(safeFrame) : buildHeroSequenceFrameUrl(safeFrame);
    targetMap.set(safeFrame, image);
    return image;
  }, []);

  const resolveFrameImage = useCallback(
    (frame: number) => {
      if (frame <= HERO_SEQUENCE_START + 1) {
        const openingHigh = highFramesRef.current.get(1);
        if (openingHigh?.complete && openingHigh.naturalWidth > 0) {
          return openingHigh;
        }
      }

      if ((HERO_SEQUENCE_HIGH_FRAMES as readonly number[]).includes(frame)) {
        const highFrame = highFramesRef.current.get(frame);
        if (highFrame?.complete && highFrame.naturalWidth > 0) {
          return highFrame;
        }
      }

      const exactFrame = standardFramesRef.current.get(frame);
      if (exactFrame?.complete && exactFrame.naturalWidth > 0) {
        return exactFrame;
      }

      for (let offset = 1; offset <= 6; offset += 1) {
        const previousFrame = standardFramesRef.current.get(frame - offset);
        if (previousFrame?.complete && previousFrame.naturalWidth > 0) {
          return previousFrame;
        }

        const nextFrame = standardFramesRef.current.get(frame + offset);
        if (nextFrame?.complete && nextFrame.naturalWidth > 0) {
          return nextFrame;
        }
      }

      return null;
    },
    [],
  );

  const drawFrame = useCallback(
    (frame: number, force = false) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      ensureFrame(frame, "standard");
      const image = resolveFrameImage(frame);

      if (!image) {
        return;
      }

      if (!force && lastDrawnFrameRef.current === frame) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const { width, height } = resizeCanvasToViewport(canvas);
      drawImageCover(context, image, width, height);
      lastDrawnFrameRef.current = frame;
    },
    [ensureFrame, resolveFrameImage],
  );

  useEffect(() => {
    if (!enableSequence) {
      return;
    }

    HERO_SEQUENCE_PRIORITY_FRAMES.forEach((frame) => ensureFrame(frame, "standard"));
    HERO_SEQUENCE_HIGH_FRAMES.forEach((frame) => ensureFrame(frame, "high"));

    let nextFrame = HERO_SEQUENCE_START;
    let cancelled = false;

    const preloadChunk = () => {
      if (cancelled) {
        return;
      }

      let loaded = 0;
      while (nextFrame <= HERO_SEQUENCE_END && loaded < 12) {
        ensureFrame(nextFrame, "standard");
        nextFrame += 1;
        loaded += 1;
      }

      if (nextFrame <= HERO_SEQUENCE_END) {
        preloadTimeoutRef.current = window.setTimeout(preloadChunk, 18);
      }
    };

    preloadChunk();

    return () => {
      cancelled = true;
      if (preloadTimeoutRef.current !== null) {
        window.clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [enableSequence, ensureFrame]);

  useEffect(() => {
    if (!enableSequence) {
      return;
    }

    const handleResize = () => {
      if (lastDrawnFrameRef.current !== null) {
        drawFrame(lastDrawnFrameRef.current, true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [drawFrame, enableSequence]);

  useEffect(() => {
    if (!enableSequence) {
      return;
    }

    const unsubscribe = progress.on("change", (latest) => {
      targetProgressRef.current = Math.min(1, Math.max(0, latest / HERO_SEQUENCE_REVEAL_PROGRESS));
    });

    return unsubscribe;
  }, [enableSequence, progress]);

  useEffect(() => {
    if (!enableSequence) {
      return;
    }

    const render = () => {
      const target = targetProgressRef.current;
      const current = smoothedProgressRef.current;
      const delta = target - current;
      const smoothing = Math.abs(delta) > 0.08 ? HERO_SEQUENCE_SMOOTHING * 0.7 : HERO_SEQUENCE_SMOOTHING;
      const nextProgress = Math.abs(delta) < 0.00035 ? target : current + delta * smoothing;

      smoothedProgressRef.current = nextProgress;
      const frame = progressToFrame(nextProgress);
      drawFrame(frame);
      renderRafRef.current = window.requestAnimationFrame(render);
    };

    drawFrame(HERO_SEQUENCE_START, true);
    renderRafRef.current = window.requestAnimationFrame(render);

    return () => {
      if (renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current);
      }
    };
  }, [drawFrame, enableSequence]);

  if (enableSequence) {
    return (
      <div ref={sceneRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#f2ebde]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,249,238,0.62)_0%,rgba(255,249,238,0.16)_30%,transparent_58%),linear-gradient(180deg,rgba(252,249,243,0.18)_0%,rgba(252,249,243,0)_42%,rgba(31,28,24,0.18)_100%)]" />

        <motion.div
          style={{ opacity: roomVignetteOpacity }}
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_52%,rgba(75,57,39,0.12)_76%,rgba(56,38,24,0.34)_100%)]"
        />

        <motion.div
          style={{ opacity: roomAtmosphereOpacity }}
          className="absolute inset-x-[10%] bottom-[8%] top-[24%] rounded-[2rem] bg-[radial-gradient(circle_at_50%_56%,rgba(255,248,235,0.26)_0%,rgba(255,248,235,0.08)_34%,transparent_72%)] blur-[38px]"
        />

        <motion.div
          style={{ opacity: roomAtmosphereOpacity }}
          className="absolute inset-x-0 bottom-0 h-[22vh] bg-[linear-gradient(180deg,rgba(44,31,18,0)_0%,rgba(44,31,18,0.1)_34%,rgba(44,31,18,0.32)_100%)]"
        />
      </div>
    );
  }

  return (
    <div ref={sceneRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={shouldReduceMotion ? undefined : { y: -26 }}
        className="absolute -left-[8%] top-[-16%] h-[30rem] w-[116%] rounded-full bg-[radial-gradient(circle,rgba(255,245,227,0.54)_0%,rgba(255,245,227,0.26)_24%,rgba(255,245,227,0.04)_54%,transparent_80%)] opacity-45 blur-[62px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.12),transparent_24%),linear-gradient(180deg,rgba(247,242,233,0.54)_0%,rgba(247,242,233,0.22)_18%,rgba(247,242,233,0.04)_42%,rgba(247,242,233,0)_62%)]" />

      <motion.div
        style={shouldReduceMotion ? undefined : { y: 8, scale: 1.04 }}
        className="adaline-hero-base absolute inset-0 origin-center"
      />

      <motion.div
        style={shouldReduceMotion ? heroLowerMask : { ...heroLowerMask, y: 8 }}
        className="adaline-hero-foreground absolute inset-0 opacity-[0.84]"
      />

      <motion.div
        style={shouldReduceMotion ? heroForegroundMask : { ...heroForegroundMask, y: -20, scale: 1.08 }}
        className="adaline-hero-foreground absolute inset-x-[-8%] bottom-[-10%] top-[40%] opacity-[0.62] blur-[1.2px]"
      />

      <motion.div
        style={shouldReduceMotion ? heroFrameMask : { ...heroFrameMask, y: -14 }}
        className="adaline-hero-frame absolute inset-x-[-4%] bottom-[-14%] top-[-6%] opacity-[0.1] mix-blend-multiply"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(231,221,193,0.2),transparent_26%),linear-gradient(180deg,rgba(7,12,15,0)_0%,rgba(7,12,15,0)_60%,rgba(7,12,15,0.1)_78%,rgba(7,12,15,0.46)_100%)]" />
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_50%_24%,rgba(3,8,12,0.08),transparent_28%),linear-gradient(180deg,rgba(3,6,10,0.3)_0%,rgba(3,6,10,0.2)_24%,rgba(3,6,10,0.12)_44%,rgba(3,6,10,0.44)_100%)]" />
    </div>
  );
}

interface AdalineFooterSceneProps {
  contact: ReactNode;
  contactId?: string;
  footer: ReactNode;
}

// The scrolling footer scene: a fixed sky gradient that scrubs sunset -> night
// as you scroll, a cloud-masked dusk band and a starfield that rise inside a
// very tall container, a single aurora canvas in the CTA band, and the hills +
// dock + reflection rendered as full-bleed 200vw images. The foreground copy
// (contact + nav) holds the portfolio content.
export function AdalineFooterScene({ contact, contactId, footer }: AdalineFooterSceneProps) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const skyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  // Render only after mount: the sky/cloud canvases and the fixed-position
  // layers depend on window metrics that don't exist during SSR/prerender.
  // useSyncExternalStore: false on the server snapshot, true on the client.
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  // Lenis is the single clock for the whole sequence: it eases the native
  // scroll position, and every layer below is a pure function of that position,
  // repainted only on scroll/resize rather than from a second spring/rAF clock.
  // The sky and the sunset cloud streaks are hand-painted on canvases and
  // recolored per scroll, so the streaks always catch the current light.
  useEffect(() => {
    if (!mounted) return;
    const band = bandRef.current;
    const skyCanvas = skyCanvasRef.current;
    const cloudsCanvas = cloudsCanvasRef.current;
    // try/catch: getContext can throw in headless/limited environments; a
    // missing backdrop must never crash hydration of the footer content.
    const getContext2d = (canvas: HTMLCanvasElement | null) => {
      try {
        return canvas?.getContext("2d") ?? null;
      } catch {
        return null;
      }
    };
    const skyContext = getContext2d(skyCanvas);
    const cloudsContext = getContext2d(cloudsCanvas);

    if (!band || !skyCanvas || !cloudsCanvas || !skyContext || !cloudsContext) {
      return;
    }

    const cloudImage = new Image();
    cloudImage.decoding = "async";
    cloudImage.src = "/adaline-scenes/footer/footer-clouds.png";

    let lastSkyKey = "";
    let lastCloudsKey = "";
    let lastStarsKey = "";

    // The tall day->night zone drives the whole transition: 0 when the band's
    // top reaches the viewport bottom, 1 when its bottom reaches 35% of the
    // viewport, where the sky has fully settled into night.
    const bandProgress = () => {
      const rect = band.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      return clamp01((viewportHeight - rect.top) / (viewportHeight * 0.65 + rect.height));
    };

    const paint = () => {
      const progress = bandProgress();

      const skyWidth = Math.max(1, window.innerWidth);
      const skyHeight = Math.max(1, window.innerHeight);
      if (skyCanvas.width !== skyWidth || skyCanvas.height !== skyHeight) {
        skyCanvas.width = skyWidth;
        skyCanvas.height = skyHeight;
        lastSkyKey = "";
      }

      // Tints are quantized inside the painter curves, so this key skips no-op
      // repaints and keeps the same scroll position pixel-identical.
      const skyKey = footerSkyKey(progress);
      if (skyKey !== lastSkyKey) {
        paintFooterSky(skyContext, skyWidth, skyHeight, progress);
        lastSkyKey = skyKey;
      }

      if (cloudImage.complete && cloudImage.naturalWidth > 0) {
        const cloudsWidth = Math.round(cloudImage.naturalWidth / 2);
        const cloudsHeight = Math.round(cloudImage.naturalHeight / 2);
        if (cloudsCanvas.width !== cloudsWidth || cloudsCanvas.height !== cloudsHeight) {
          cloudsCanvas.width = cloudsWidth;
          cloudsCanvas.height = cloudsHeight;
          lastCloudsKey = "";
        }

        const cloudsKey = String(cloudTint(progress));
        if (cloudsKey !== lastCloudsKey) {
          paintFooterClouds(cloudsContext, cloudsWidth, cloudsHeight, progress, cloudImage);
          lastCloudsKey = cloudsKey;
        }
      }

      const starsKey = String(starsAlpha(progress));
      if (starsKey !== lastStarsKey) {
        if (starsRef.current) {
          starsRef.current.style.opacity = starsKey;
        }
        lastStarsKey = starsKey;
      }
    };

    cloudImage.addEventListener("load", paint);
    paint();
    const unsubscribe = subscribeToScroll(paint);

    return () => {
      cloudImage.removeEventListener("load", paint);
      unsubscribe();
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="adaline-footer-scene relative flex flex-col overflow-clip text-[#f4fbf7]" style={footerSceneTheme}>
      {/* No opaque bridge or scene background at the seam: the fixed sky canvas
          fades in over the still-visible tides ocean (matching sunset palettes),
          so the articles -> footer handoff is a same-color crossfade with no
          hard edge. The dark base returns on the CTA and dock bands only. */}

      {/* Fixed sunset -> night sky behind everything, hand-painted per scroll. */}
      <canvas
        ref={skyCanvasRef}
        aria-hidden
        data-scroll-scene="sky-gradient"
        className="pointer-events-none fixed inset-0 h-full w-full"
      />

      {/* Tall scroll zone: only the cloud band + stars move through it. */}
      <div ref={bandRef} data-scroll-scene="sky-band" className="relative -mb-[80vh] h-[200vw] min-h-[300vh]">
        {/* Cloud plate painted on canvas with the current sky light (tint
            gradient masked by the plate's alpha), not a static CSS mask. The
            wrapper drifts slowly sideways so the entry reads as passing
            clouds, not a cut. */}
        <div aria-hidden className="adaline-footer-clouds-drift pointer-events-none absolute inset-0">
          <canvas
            ref={cloudsCanvasRef}
            data-scroll-scene="clouds"
            className="h-full w-full object-cover object-top"
          />
        </div>
        {/* Drifting cloud puffs riding the warm dusk zone at the top of the
            band only (never over the CTA, hills or water). The wrapper clips
            and edge-masks them so each cloud fades in/out at the edges. */}
        <div aria-hidden data-scroll-scene="drift-clouds" className="adaline-drift-clouds pointer-events-none absolute inset-x-0 top-0 h-[110vh]">
          {DRIFT_CLOUDS.map((cloud, cloudIndex) => (
            <div
              key={`drift-cloud-${cloudIndex}`}
              className="adaline-drift-cloud"
              style={
                {
                  top: cloud.top,
                  width: cloud.width,
                  height: cloud.height,
                  opacity: cloud.opacity,
                  "--cloud-duration": cloud.duration,
                  "--cloud-delay": cloud.delay,
                } as CSSProperties
              }
            >
              {cloud.puffs.map((puff, puffIndex) => (
                <span
                  key={`drift-cloud-${cloudIndex}-puff-${puffIndex}`}
                  className="adaline-drift-cloud-puff"
                  style={{
                    left: puff.left,
                    top: puff.top,
                    width: puff.width,
                    height: puff.height,
                    filter: `blur(${puff.blur})`,
                    background: `radial-gradient(50% 50% at 50% 50%, rgba(255, 240, 228, ${puff.alpha}) 0%, rgba(255, 240, 228, ${puff.alpha * 0.5}) 55%, rgba(255, 240, 228, 0) 100%)`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Repeating starfield that rises with the scroll. */}
        <div
          ref={starsRef}
          aria-hidden
          data-scroll-scene="stars"
          style={{ opacity: 0 }}
          className="adaline-footer-stars pointer-events-none absolute inset-0 -bottom-[30rem]"
        />
      </div>

      {/* CTA band: foreground contact card. The aurora is anchored inside this
          band (absolute, top-masked) so it scrolls with the scene and the hills
          band below paints over its lower edge — the glow rises from behind the
          ridgeline. */}
      <div data-scroll-scene="cta-band" className="relative flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-[#050e11] to-100%">
        <FooterStars />
        <FooterAurora />
        {/* Meteor layer (footer-meteors.tsx): JS spawns streak <img>s into it
            every 5-10s and flies them down-left. */}
        <FooterMeteors />

        {/* The collapsed "Contact me" pill sits low in the band and its panel
            opens downward (over the hills/lake), so it stays on-screen even at
            the deepest footer scroll; opening upward got clipped at the top. */}
        <div className="relative z-20 w-full px-6 pt-[34vh] pb-[12vh] sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[120rem]">
            <div id={contactId} className="mx-auto w-full max-w-[34rem] scroll-mt-28">
              {contact}
            </div>
          </div>
        </div>
      </div>

      {/* Docking-port band: hills, dock + water reflection, and the nav. Hills
          are 100vw at -14vw; the dock + reflection are a masked 200vw image
          group; the nav sits at z-100 on xl. The dock is centered and lifted
          rather than anchored bottom-left, since the footer's proportions here
          left the bottom-left anchor detaching the pier. */}
      <div className="relative z-[2] bg-[#050e11] xl:h-[40vw]">
        <div aria-hidden className="pointer-events-none absolute -top-[14vw] w-full">
          <img src="/adaline-scenes/footer/footer-hills.webp" alt="" aria-hidden className="w-full object-cover" />
        </div>

        {/* Dock + reflection: a centered image group whose SIZE (width in vw)
            sets how near the pier reads, and whose top offset seats it in the
            lake. On phones it stays at 118vw so it retains the distant
            perspective and can sit behind the footer copy without dominating
            it. The larger intermediate widths fill the wider in-flow footer;
            xl returns to the original 105vw composition. The matching nav
            padding intentionally allows a small overlap with the name.
            The fade mask blends the foreground planks into the #050e11 base. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[10vw] w-[118vw] -translate-x-1/2 sm:w-[126vw] lg:w-[138vw] xl:top-[2vw] xl:w-[105vw]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.12) 72%, transparent 88%)",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.12) 72%, transparent 88%)",
          }}
        >
          {shouldReduceMotion ? (
            <>
              <span
                aria-hidden
                data-dock-reflection="static"
                className="pointer-events-none absolute inset-0 mix-blend-screen"
                style={{
                  background:
                    "radial-gradient(ellipse 3.8% 18% at 23.5% 34.5%, rgba(255, 199, 133, 0.2) 0%, rgba(255, 199, 133, 0.08) 38%, transparent 76%), radial-gradient(ellipse 3.8% 18% at 35.5% 34.5%, rgba(255, 199, 133, 0.2) 0%, rgba(255, 199, 133, 0.08) 38%, transparent 76%), radial-gradient(ellipse 3.8% 18% at 57.5% 34.5%, rgba(255, 199, 133, 0.2) 0%, rgba(255, 199, 133, 0.08) 38%, transparent 76%)",
                }}
              />
              <img
                src="/adaline-scenes/footer/footer-dock.webp"
                alt=""
                aria-hidden
                className="relative aspect-[2.5] w-full object-fill"
              />
            </>
          ) : (
            // Three.js + GSAP ScrollTrigger night scene: same dock/reflection
            // textures, plus scroll-driven ignition for all three lamp pools.
            <FooterDockThree />
          )}
        </div>

        <div className="footer-transparent-nav relative right-0 bottom-0 left-0 z-[100] px-6 pb-16 sm:px-8 lg:px-12 xl:absolute xl:pb-24">
          <div className="mx-auto flex max-w-[120rem] flex-col pt-[28vw] pr-12 pb-6 sm:pt-[30vw] md:flex-row md:flex-wrap md:justify-between lg:pt-[32vw] xl:pt-0">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
