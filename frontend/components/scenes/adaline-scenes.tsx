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

const footerReflectionMask = {
  WebkitMaskImage:
    "linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.56) 22%, rgba(0, 0, 0, 0.22) 58%, transparent 100%)",
  maskImage:
    "linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.56) 22%, rgba(0, 0, 0, 0.22) 58%, transparent 100%)",
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

export function AdalineFooterScene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const isHydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydrationSnapshot);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start end", "end start"],
  });

  const cloudY = useTransform(scrollYProgress, [0, 1], [48, -56]);
  const starsY = useTransform(scrollYProgress, [0, 1], [24, -64]);
  const starsNearY = useTransform(scrollYProgress, [0, 1], [40, -96]);
  const hillsY = useTransform(scrollYProgress, [0, 1], [18, -12]);
  const dockY = useTransform(scrollYProgress, [0, 1], [12, -8]);
  const reflectionY = useTransform(scrollYProgress, [0, 1], [10, -20]);
  const meteorY = useTransform(scrollYProgress, [0, 1], [0, -34]);
  const isDarkTheme = isHydrated && resolvedTheme === "dark";

  return (
    <div ref={sceneRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 ${
          isDarkTheme
            ? "bg-[radial-gradient(circle_at_50%_-8%,rgba(23,73,88,0.34),transparent_24%),linear-gradient(180deg,#071018_0%,#040b10_40%,#020608_100%)]"
            : "bg-[radial-gradient(circle_at_18%_0%,rgba(255,228,166,0.9),transparent_22%),radial-gradient(circle_at_52%_18%,rgba(255,248,236,0.78),rgba(255,248,236,0.18)_26%,transparent_56%),linear-gradient(180deg,#eef6f3_0%,#dfece4_38%,#d5e4da_68%,#ceded3_100%)]"
        }`}
      />

      {isDarkTheme ? (
        <motion.div
          style={shouldReduceMotion ? { backgroundSize: "1180px auto" } : { y: starsY, backgroundSize: "1180px auto" }}
          animate={shouldReduceMotion ? undefined : { opacity: [0.34, 0.52, 0.38] }}
          transition={shouldReduceMotion ? undefined : { duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="adaline-footer-stars absolute inset-[-12%] opacity-40"
        />
      ) : null}

      {isDarkTheme ? (
        <motion.div
          style={shouldReduceMotion ? { backgroundSize: "760px auto" } : { y: starsNearY, backgroundSize: "760px auto" }}
          className="adaline-footer-stars absolute inset-[-18%] opacity-15 blur-[0.8px]"
        />
      ) : null}

      <motion.div
        style={
          shouldReduceMotion
            ? {
                ...footerCloudMask,
                background: isDarkTheme
                  ? "radial-gradient(circle at 50% 62%, rgba(36, 214, 171, 0.4) 0%, rgba(13, 84, 100, 0.22) 26%, transparent 58%), linear-gradient(180deg, rgba(5, 16, 24, 0) 0%, rgba(5, 16, 24, 0.12) 18%, rgba(5, 16, 24, 0.78) 100%)"
                  : "radial-gradient(circle at 18% 8%, rgba(255, 217, 135, 0.78) 0%, rgba(255, 217, 135, 0.22) 18%, transparent 42%), radial-gradient(circle at 50% 26%, rgba(255, 250, 244, 0.88) 0%, rgba(255, 250, 244, 0.2) 24%, transparent 56%), linear-gradient(180deg, rgba(250, 247, 238, 0.66) 0%, rgba(250, 247, 238, 0.14) 24%, rgba(224, 236, 228, 0.2) 58%, rgba(214, 226, 218, 0.48) 100%)",
              }
            : {
                ...footerCloudMask,
                y: cloudY,
                background: isDarkTheme
                  ? "radial-gradient(circle at 50% 62%, rgba(36, 214, 171, 0.4) 0%, rgba(13, 84, 100, 0.22) 26%, transparent 58%), linear-gradient(180deg, rgba(5, 16, 24, 0) 0%, rgba(5, 16, 24, 0.12) 18%, rgba(5, 16, 24, 0.78) 100%)"
                  : "radial-gradient(circle at 18% 8%, rgba(255, 217, 135, 0.78) 0%, rgba(255, 217, 135, 0.22) 18%, transparent 42%), radial-gradient(circle at 50% 26%, rgba(255, 250, 244, 0.88) 0%, rgba(255, 250, 244, 0.2) 24%, transparent 56%), linear-gradient(180deg, rgba(250, 247, 238, 0.66) 0%, rgba(250, 247, 238, 0.14) 24%, rgba(224, 236, 228, 0.2) 58%, rgba(214, 226, 218, 0.48) 100%)",
              }
        }
        className={`absolute inset-0 ${isDarkTheme ? "opacity-85" : "opacity-95"}`}
      />

      {isDarkTheme ? (
        <motion.div
          style={shouldReduceMotion ? undefined : { y: meteorY }}
          className="adaline-footer-meteor absolute right-[8%] top-[9%] h-[11rem] w-[0.8rem] rotate-[58deg] opacity-55 mix-blend-screen blur-[0.8px] sm:right-[12%] sm:h-[13rem]"
        />
      ) : null}

      <motion.div
        style={shouldReduceMotion ? undefined : { y: hillsY }}
        animate={isDarkTheme && !shouldReduceMotion ? { opacity: [0.58, 0.72, 0.6] } : undefined}
        transition={isDarkTheme && !shouldReduceMotion ? { duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : undefined}
        className={`absolute left-1/2 bottom-[12.75rem] h-[clamp(7rem,14vw,12rem)] w-[112%] -translate-x-1/2 sm:bottom-[14.25rem] lg:bottom-[15.75rem] ${
          isDarkTheme ? "opacity-70" : "opacity-82"
        }`}
      >
        <div className={`adaline-footer-hills absolute inset-0 ${isDarkTheme ? "" : "brightness-[1.42] saturate-[0.78]"}`} />
      </motion.div>

      {isDarkTheme ? (
        <>
          <div className="absolute inset-x-[14%] bottom-[12rem] h-28 rounded-full bg-[radial-gradient(circle,rgba(120,255,212,0.18)_0%,rgba(120,255,212,0.08)_24%,transparent_72%)] blur-[44px] sm:bottom-[16rem] sm:h-36" />
          <div className="absolute inset-x-[8%] bottom-[14rem] h-40 rounded-full bg-[radial-gradient(circle,rgba(18,115,129,0.24)_0%,rgba(18,115,129,0.08)_36%,transparent_72%)] blur-[68px] sm:bottom-[18rem]" />
        </>
      ) : (
        <>
          <div className="absolute left-[10%] top-[4.5rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,223,150,0.42)_0%,rgba(255,223,150,0.12)_28%,transparent_74%)] blur-[48px]" />
          <div className="absolute inset-x-[16%] bottom-[12.75rem] h-24 rounded-full bg-[radial-gradient(circle,rgba(255,246,225,0.28)_0%,rgba(255,246,225,0.08)_26%,transparent_74%)] blur-[36px] sm:bottom-[15rem]" />
        </>
      )}

      <motion.div
        style={shouldReduceMotion ? footerReflectionMask : { ...footerReflectionMask, y: reflectionY }}
        className={`absolute left-1/2 bottom-[5rem] h-[clamp(4rem,8vw,7rem)] w-[118%] -translate-x-1/2 lg:bottom-[5.5rem] ${
          isDarkTheme ? "opacity-55" : "opacity-42"
        }`}
      >
        <div className={`adaline-footer-dock-reflection absolute inset-0 ${isDarkTheme ? "" : "brightness-[1.38] saturate-[0.72]"}`} />
      </motion.div>

      <motion.div
        style={shouldReduceMotion ? undefined : { y: dockY }}
        className="absolute left-1/2 bottom-[-1.25rem] h-[clamp(8.5rem,15vw,13rem)] w-[118%] -translate-x-1/2 opacity-95"
      >
        <div className={`adaline-footer-dock absolute inset-0 ${isDarkTheme ? "" : "brightness-[1.14] saturate-[0.84]"}`} />
      </motion.div>

      <div
        className={`absolute inset-x-0 bottom-0 ${
          isDarkTheme
            ? "h-[24rem] bg-[linear-gradient(180deg,rgba(3,7,10,0)_0%,rgba(3,7,10,0.3)_24%,rgba(3,7,10,0.86)_78%,#03070a_100%)]"
            : "h-[22rem] bg-[linear-gradient(180deg,rgba(223,234,228,0)_0%,rgba(223,234,228,0.16)_24%,rgba(214,226,219,0.72)_80%,#d3e0d7_100%)]"
        }`}
      />
      <div
        className={`absolute inset-0 ${
          isDarkTheme
            ? "bg-[linear-gradient(180deg,rgba(6,10,12,0.18)_0%,rgba(6,10,12,0)_24%,rgba(6,10,12,0)_62%,rgba(6,10,12,0.08)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(255,252,246,0.26)_0%,rgba(255,252,246,0.08)_22%,rgba(255,252,246,0)_56%,rgba(112,134,120,0.08)_100%)]"
        }`}
      />
    </div>
  );
}
