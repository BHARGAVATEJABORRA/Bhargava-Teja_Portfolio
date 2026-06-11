"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useReducedMotion, useTransform } from "framer-motion";

import { FooterDockThree } from "@/components/scenes/footer-dock-three";
import {
  clamp01,
  cloudTint,
  footerSkyKey,
  paintFooterClouds,
  paintFooterSky,
  starsAlpha,
} from "@/components/scenes/footer-sky-painter";
import { subscribeToScroll } from "@/lib/scroll-progress";

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

const SHOOTING_STARS = [
  { left: "13%", top: "4%", width: "10px", rotate: "58deg", duration: "8.8s", delay: "0.7s", x: "18vw", y: "26vh", opacity: 0.36 },
  { left: "68%", top: "1%", width: "9px", rotate: "57deg", duration: "11.4s", delay: "3.9s", x: "16vw", y: "23vh", opacity: 0.32 },
  { left: "42%", top: "12%", width: "8px", rotate: "58deg", duration: "13.6s", delay: "7.1s", x: "14vw", y: "20vh", opacity: 0.28 },
  { left: "31%", top: "8%", width: "9px", rotate: "57deg", duration: "15.2s", delay: "5.4s", x: "16vw", y: "22vh", opacity: 0.22 },
  { left: "77%", top: "3%", width: "8px", rotate: "59deg", duration: "10.8s", delay: "11.2s", x: "14vw", y: "20vh", opacity: 0.2 },
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

// Faithful reconstruction of the adaline.ai footer: a fixed sky gradient that
// scrubs sunset → night as you scroll, a cloud-masked dusk band and a starfield
// that scroll up inside a very tall container, a single aurora canvas in the CTA
// band, and the hills + dock + reflection rendered as full-bleed 200vw images.
// Only the foreground copy (contact + nav) is swapped for portfolio content.
export function AdalineFooterScene({ contact, contactId, footer }: AdalineFooterSceneProps) {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const skyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<HTMLDivElement | null>(null);
  const meteorsRef = useRef<HTMLDivElement | null>(null);
  const ctaMeteorsRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Lenis is the single clock for the whole sequence: it eases the native
  // scroll position itself, and every layer below is a *pure function* of
  // that position — repainted only on scroll/resize, never from a second
  // spring/lerp/rAF clock. This is the adaline.ai architecture: the sky and
  // the sunset cloud streaks are hand-painted on canvases and recolored
  // continuously per scroll, so the streaks always catch the current light.
  useEffect(() => {
    const band = bandRef.current;
    const skyCanvas = skyCanvasRef.current;
    const cloudsCanvas = cloudsCanvasRef.current;
    const skyContext = skyCanvas?.getContext("2d");
    const cloudsContext = cloudsCanvas?.getContext("2d");

    if (!band || !skyCanvas || !cloudsCanvas || !skyContext || !cloudsContext) {
      return;
    }

    const cloudImage = new Image();
    cloudImage.decoding = "async";
    cloudImage.src = "/adaline-scenes/footer/footer-clouds.png";

    let lastSkyKey = "";
    let lastCloudsKey = "";
    let lastStarsKey = "";

    // The tall day→night zone drives the whole transition — same mapping as
    // the previous useScroll offset ["start end", "end 35%"]: 0 when the
    // band's top reaches the viewport bottom, 1 when its bottom reaches 35%
    // of the viewport, at which point the sky has fully settled into night.
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

      // Tints are quantized inside the painter curves, so the key both skips
      // no-op repaints and guarantees the same scroll position always shows
      // byte-identical pixels regardless of scroll history.
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
        for (const layer of [starsRef.current, meteorsRef.current, ctaMeteorsRef.current]) {
          if (layer) {
            layer.style.opacity = starsKey;
          }
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
  }, []);

  return (
    <div className="adaline-footer-scene relative flex flex-col overflow-clip bg-[#050e11] text-[#f4fbf7]" style={footerSceneTheme}>
      {/* #home-footer-bg-gradient — the fixed sunset→night sky behind
          everything, hand-painted per scroll exactly like adaline. */}
      <canvas
        ref={skyCanvasRef}
        aria-hidden
        data-scroll-scene="sky-gradient"
        className="pointer-events-none fixed inset-0 h-full w-full"
      />

      {/* Tall scroll zone: only the cloud band + stars move through it. */}
      <div ref={bandRef} data-scroll-scene="sky-band" className="relative -mb-[80vh] h-[200vw] min-h-[300vh]">
        <div aria-hidden className="adaline-footer-top-fade pointer-events-none absolute inset-x-0 top-0 h-[55vh]" />
        {/* #home-footer-clouds-gradient — the adaline cloud plate, painted on
            canvas with the current sky light (tint gradient masked by the
            plate's alpha), never a static-tint CSS mask. */}
        <canvas
          ref={cloudsCanvasRef}
          aria-hidden
          data-scroll-scene="clouds"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* #home-footer-stars — repeating starfield that rises with the scroll. */}
        <div
          ref={starsRef}
          aria-hidden
          data-scroll-scene="stars"
          style={{ opacity: 0 }}
          className="adaline-footer-stars pointer-events-none absolute inset-0 -bottom-[30rem]"
        />
        <div
          ref={meteorsRef}
          aria-hidden
          data-scroll-scene="shooting-stars"
          style={{ opacity: 0 }}
          className="adaline-footer-shooting-stars pointer-events-none absolute inset-0"
        >
          {SHOOTING_STARS.map((star, index) => (
            <span
              key={`meteor-${index}`}
              className="adaline-meteor"
              style={
                {
                  "--meteor-left": star.left,
                  "--meteor-top": star.top,
                  "--meteor-width": star.width,
                  "--meteor-rotate": star.rotate,
                  "--meteor-duration": star.duration,
                  "--meteor-delay": star.delay,
                  "--meteor-travel-x": star.x,
                  "--meteor-travel-y": star.y,
                  "--meteor-opacity": star.opacity,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/* CTA band: foreground contact card. The aurora itself is the site-wide
          ambient layer (AmbientAurora at the app root, §3.3) — it swells to full
          intensity here via global scroll progress instead of being a local,
          IntersectionObserver-gated canvas that froze everywhere else. */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-[#050e11] to-100%">
        <div
          ref={ctaMeteorsRef}
          aria-hidden
          data-scroll-scene="cta-shooting-stars"
          style={{ opacity: 0 }}
          className="adaline-footer-shooting-stars pointer-events-none absolute inset-x-0 top-0 h-[78%]"
        >
          {SHOOTING_STARS.map((star, index) => (
            <span
              key={`cta-meteor-${index}`}
              className="adaline-meteor"
              style={
                {
                  "--meteor-left": star.left,
                  "--meteor-top": star.top,
                  "--meteor-width": star.width,
                  "--meteor-rotate": star.rotate,
                  "--meteor-duration": star.duration,
                  "--meteor-delay": star.delay,
                  "--meteor-travel-x": star.x,
                  "--meteor-travel-y": star.y,
                  "--meteor-opacity": star.opacity,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div aria-hidden className="adaline-footer-aurora-veils pointer-events-none absolute top-[4%] h-[62%] w-full" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 bottom-0 w-full overflow-clip bg-black mix-blend-plus-lighter [mask-image:linear-gradient(to_bottom,transparent_0%,black_5%)]"
        />

        <div className="relative z-20 w-full px-6 pt-[28vh] pb-[18vh] sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[120rem]">
            <div id={contactId} className="mx-auto w-full max-w-[34rem] scroll-mt-28">
              {contact}
            </div>
          </div>
        </div>
      </div>

      {/* Docking-port band: hills, dock + water reflection, and the nav.
          Mirrors the adaline.ai source (see Adaline reference) — hills 100vw at
          -14vw, dock+reflection a 200vw masked image group, nav z-100 overlaying
          on xl. The one intentional deviation is the dock anchor (see below):
          our footer's content proportions differ from Adaline's, so their exact
          left/bottom-0 anchor detached the pier — we center + lift it instead. */}
      <div className="relative bg-[#050e11] xl:h-[40vw]">
        <div aria-hidden className="pointer-events-none absolute -top-[14vw] w-full">
          <img src="/adaline-scenes/footer/footer-hills.webp" alt="" aria-hidden className="w-full object-cover" />
        </div>

        {/* Dock + reflection: a 200vw image group centered on the scene and
            lifted (top-[-6vw]) so the pier deck sits *in* the lake at the hills'
            waterline rather than detaching below it. Both hills and dock scale
            in vw, so this single vw offset composes identically at every width.
            The fade mask blends the foreground planks into the #050e11 base. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-6vw] w-[200vw] -translate-x-1/2"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
          }}
        >
          {shouldReduceMotion ? (
            <>
              <img
                src="/adaline-scenes/footer/footer-dock-reflection.webp"
                alt=""
                aria-hidden
                className="absolute left-0 top-0 aspect-[3] w-[200vw] object-cover opacity-60"
              />
              <img
                src="/adaline-scenes/footer/footer-dock.webp"
                alt=""
                aria-hidden
                className="relative aspect-[3] w-[200vw] object-cover"
              />
            </>
          ) : (
            // Three.js + GSAP ScrollTrigger night scene: same dock/reflection
            // textures, plus the scroll-driven glow path and lamp ignition.
            <FooterDockThree />
          )}
        </div>

        <div className="footer-transparent-nav relative right-0 bottom-0 left-0 z-[100] px-6 pb-16 sm:px-8 lg:px-12 xl:absolute xl:pb-24">
          <div className="mx-auto flex max-w-[120rem] flex-col pt-[30vw] pr-12 pb-6 md:flex-row md:flex-wrap md:justify-between xl:pt-0">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
