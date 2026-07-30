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

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import {
  advanceTidesWorld,
  createTidesWorld,
  drawTides,
  mulberry32,
} from "@/components/scenes/tides-painter";
import { clamp01, smoothStep } from "@/components/scenes/footer-sky-painter";
import { subscribeToScrollRead, subscribeToScrollWrite } from "@/lib/scroll-runtime";

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

export function TidesBackground({ onReady }: { onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const onReadyRef = useRef(onReady);
  const hasSignaledReadyRef = useRef(false);
  const [workerDisabled, setWorkerDisabled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const signalReady = useCallback(() => {
    if (hasSignaledReadyRef.current) return;
    hasSignaledReadyRef.current = true;
    onReadyRef.current?.();
  }, []);

  // Global scroll progress is a single read from the application scheduler.
  useEffect(() => {
    const update = ({ y, maxY }: { y: number; maxY: number }) => {
      const next = maxY > 0 ? clamp01(y / maxY) : 0;
      if (next !== progressRef.current) {
        progressRef.current = next;
        workerRef.current?.postMessage({ type: "update", progress: next });
      }
    };
    return subscribeToScrollRead(update);
  }, []);

  useEffect(() => {
    return subscribeToScrollWrite(() => {
      if (veilRef.current) veilRef.current.style.opacity = veilOpacityFor(progressRef.current).toFixed(3);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Move the always-visible, full-viewport simulation off the main thread
    // where the browser supports OffscreenCanvas. Safari/mobile safely retain
    // the exact same main-thread painter below.
    const supportsWorkerCanvas =
      typeof Worker !== "undefined" &&
      typeof OffscreenCanvas !== "undefined" &&
      !workerDisabled &&
      "transferControlToOffscreen" in canvas;
    if (supportsWorkerCanvas) {
      let candidateWorker: Worker | null = null;
      try {
        const worker = new Worker(new URL("./tides-worker.ts", import.meta.url));
        candidateWorker = worker;
        const offscreen = canvas.transferControlToOffscreen();
        workerRef.current = worker;
        const onWorkerMessage = (event: MessageEvent<{ type?: string }>) => {
          if (event.data?.type === "ready") signalReady();
          if (event.data?.type === "error") setWorkerDisabled(true);
        };
        const onWorkerError = () => setWorkerDisabled(true);
        worker.addEventListener("message", onWorkerMessage);
        worker.addEventListener("error", onWorkerError);
        const readyTimeout = window.setTimeout(() => {
          if (!hasSignaledReadyRef.current) setWorkerDisabled(true);
        }, 2000);
        worker.postMessage(
          {
            type: "init",
            canvas: offscreen,
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: window.devicePixelRatio || 1,
            progress: progressRef.current,
            reduceMotion,
          },
          [offscreen],
        );
        let width = window.innerWidth;
        let height = window.innerHeight;
        const unsubscribeResize = subscribeToScrollRead((snapshot) => {
          if (snapshot.width === width && snapshot.height === height) return;
          width = snapshot.width;
          height = snapshot.height;
          worker.postMessage({ type: "resize", width, height, dpr: window.devicePixelRatio || 1 });
        });
        const visibility = () => worker.postMessage({ type: "visibility", hidden: document.hidden });
        document.addEventListener("visibilitychange", visibility);
        return () => {
          unsubscribeResize();
          document.removeEventListener("visibilitychange", visibility);
          window.clearTimeout(readyTimeout);
          worker.removeEventListener("message", onWorkerMessage);
          worker.removeEventListener("error", onWorkerError);
          worker.postMessage({ type: "destroy" });
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
        };
      } catch {
        // A transferred canvas can never be reclaimed by the main thread.
        // This also occurs when React development Strict Mode replays the
        // effect against the same DOM node. Replace it before falling back.
        candidateWorker?.terminate();
        if (workerRef.current === candidateWorker) workerRef.current = null;
        const fallbackTimer = window.setTimeout(() => setWorkerDisabled(true), 0);
        return () => window.clearTimeout(fallbackTimer);
      }
    }

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

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
    let width = window.innerWidth;
    let height = window.innerHeight;
    const unsubscribeResize = subscribeToScrollRead((snapshot) => {
      if (snapshot.width === width && snapshot.height === height) return;
      width = snapshot.width;
      height = snapshot.height;
      resize();
    });

    if (reduceMotion) {
      const paintStill = () => {
        const palette = timeOfDayFor(progressRef.current);
        drawTides(context, cssWidth, cssHeight, world, { timeOfDay: palette, time: 17.6, sunDrift: 0.5 }, mulberry32(0x51de5));
        applyScrollLinked();
      };
      paintStill();
      signalReady();
      const unsubscribe = subscribeToScrollWrite(paintStill);
      return () => {
        unsubscribe();
        unsubscribeResize();
      };
    }

    let raf = 0;
    let last = performance.now();
    const FRAME_MS = 1000 / 60;
    let firstFramePainted = false;

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
      if (!firstFramePainted) {
        firstFramePainted = true;
        signalReady();
      }
      applyScrollLinked();
      raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribeResize();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [reduceMotion, signalReady, workerDisabled]);

  return (
    <>
      <div aria-hidden data-tides-background className="pointer-events-none fixed inset-0" style={{ zIndex: -1 }}>
        <canvas
          key={workerDisabled ? "main-thread" : "worker"}
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />

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
