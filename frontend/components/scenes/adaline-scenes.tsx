"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

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

const footerCloudMask = {
  WebkitMaskImage: "url('/adaline-scenes/footer/footer-clouds.png')",
  maskImage: "url('/adaline-scenes/footer/footer-clouds.png')",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center top",
  maskPosition: "center top",
  WebkitMaskSize: "cover",
  maskSize: "cover",
} satisfies CSSProperties;

const HERO_SEQUENCE_START = 2;
const HERO_SEQUENCE_END = 281;
const HERO_SEQUENCE_REVEAL_PROGRESS = 0.84;
const HERO_SEQUENCE_FRAME_COUNT = HERO_SEQUENCE_END - HERO_SEQUENCE_START + 1;
const HERO_SEQUENCE_SMOOTHING = 0.12;
const HERO_SEQUENCE_PRIORITY_FRAMES = [2, 3, 4, 8, 18, 40, 72, 89, 120, 160, 200, 240, 281] as const;
const HERO_SEQUENCE_HIGH_FRAMES = [1, 89, 281] as const;

type HeroFrameQuality = "standard" | "high";

function subscribeToHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

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

// Adaline-style footer: one full-bleed sky that scroll-scrubs through a time-of-day
// cycle. Theme picks the palette — light = day -> golden dusk, dark = dusk -> deep
// night with a green aurora glow on the horizon. The "end" sky cross-fades in as the
// footer scrolls into view, faint stars rise, and the green aurora swells at the base.
const FOOTER_SKY = {
  light: {
    base: "#f1e7d2",
    start:
      "radial-gradient(120% 80% at 22% -8%, rgba(255,246,219,0.9) 0%, rgba(255,246,219,0) 46%), linear-gradient(180deg, #a7c6df 0%, #c7d9e2 30%, #e3e0d2 64%, #f4ecda 100%)",
    end:
      "radial-gradient(120% 70% at 50% 112%, rgba(255,196,120,0.55) 0%, rgba(255,196,120,0) 56%), linear-gradient(180deg, #5b5a86 0%, #936f8a 32%, #d39a72 66%, #f3c293 100%)",
    cloud: "linear-gradient(180deg, rgba(255,253,247,0.85) 0%, rgba(255,247,233,0.5) 48%, rgba(255,240,220,0.15) 100%)",
    starsMax: 0.14,
    auroraMax: 0,
    bottomFade:
      "linear-gradient(180deg, rgba(241,231,210,0) 0%, rgba(241,231,210,0.18) 30%, rgba(241,231,210,0.74) 78%, #f1e7d2 100%)",
  },
  dark: {
    base: "#04080d",
    start:
      "radial-gradient(120% 80% at 28% -6%, rgba(120,108,150,0.5) 0%, rgba(120,108,150,0) 44%), linear-gradient(180deg, #2a2950 0%, #4a3b5e 32%, #8a5f5a 66%, #c6885f 100%)",
    end:
      "radial-gradient(130% 78% at 50% 116%, rgba(58,226,170,0.45) 0%, rgba(20,118,108,0.16) 30%, rgba(20,118,108,0) 62%), linear-gradient(180deg, #050a14 0%, #061521 42%, #082b34 76%, #0a3f3e 100%)",
    cloud: "linear-gradient(180deg, rgba(206,210,232,0.4) 0%, rgba(150,158,196,0.22) 50%, rgba(96,110,150,0.08) 100%)",
    starsMax: 0.62,
    auroraMax: 1,
    bottomFade:
      "linear-gradient(180deg, rgba(4,8,13,0) 0%, rgba(4,8,13,0.3) 26%, rgba(4,8,13,0.86) 78%, #04080d 100%)",
  },
} as const;

export function AdalineFooterScene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const isHydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydrationSnapshot);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start end", "end start"],
  });

  const isDarkTheme = isHydrated && resolvedTheme === "dark";
  const sky = isDarkTheme ? FOOTER_SKY.dark : FOOTER_SKY.light;

  // End-of-day sky cross-fades in as the footer rises into view and deepens to full at the base.
  const skyEndOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [0, 0.78, 1]);
  const starsOpacity = useTransform(scrollYProgress, [0.15, 1], [0, sky.starsMax]);
  const auroraOpacity = useTransform(scrollYProgress, [0.32, 1], [0, sky.auroraMax]);
  const cloudY = useTransform(scrollYProgress, [0, 1], [44, -64]);
  const starsY = useTransform(scrollYProgress, [0, 1], [28, -78]);

  // Static fallback for reduced motion / pre-hydration: rest near the end-of-day state.
  const staticEnd = shouldReduceMotion ? 0.82 : undefined;

  return (
    <div ref={sceneRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Day / dusk start sky */}
      <div className="absolute inset-0" style={{ background: sky.start }} />

      {/* Dusk / night end sky, cross-faded by scroll */}
      <motion.div
        className="absolute inset-0"
        style={{ background: sky.end, opacity: staticEnd ?? skyEndOpacity }}
      />

      {/* Faint stars rising toward night */}
      <motion.div
        style={
          shouldReduceMotion
            ? { backgroundSize: "1180px auto", opacity: sky.starsMax * 0.85 }
            : { y: starsY, backgroundSize: "1180px auto", opacity: starsOpacity }
        }
        animate={shouldReduceMotion || !isDarkTheme ? undefined : { filter: ["brightness(0.85)", "brightness(1.15)", "brightness(0.9)"] }}
        transition={shouldReduceMotion || !isDarkTheme ? undefined : { duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="adaline-footer-stars absolute inset-[-14%]"
      />

      {/* Diagonal wispy cloud bands */}
      <motion.div
        style={
          shouldReduceMotion
            ? { ...footerCloudMask, background: sky.cloud }
            : { ...footerCloudMask, background: sky.cloud, y: cloudY }
        }
        className={`absolute inset-[-8%] rotate-[-6deg] ${isDarkTheme ? "opacity-55" : "opacity-80"}`}
      />

      {/* Green aurora horizon glow (dark only) */}
      {isDarkTheme ? (
        <>
          <motion.div
            style={{ opacity: staticEnd ?? auroraOpacity }}
            className="absolute inset-x-[6%] bottom-[2rem] h-56 rounded-[50%] bg-[radial-gradient(circle,rgba(72,235,180,0.28)_0%,rgba(40,180,150,0.1)_38%,transparent_72%)] blur-[70px]"
          />
          <motion.div
            style={{ opacity: staticEnd ?? auroraOpacity }}
            className="absolute inset-x-[20%] bottom-[5rem] h-32 rounded-[50%] bg-[radial-gradient(circle,rgba(120,255,212,0.22)_0%,rgba(120,255,212,0.06)_42%,transparent_76%)] blur-[44px]"
          />
        </>
      ) : null}

      {/* Bottom fade into the footer content base color */}
      <div className="absolute inset-x-0 bottom-0 h-[26rem]" style={{ background: sky.bottomFade }} />
    </div>
  );
}
