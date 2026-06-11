"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { drawAurora } from "@/components/scenes/aurora-painter";
import { clamp01, smoothStep } from "@/components/scenes/footer-sky-painter";
import { subscribeToScroll } from "@/lib/scroll-progress";

// Aurora brightness as a pure function of global scroll progress. The aurora
// is a night-only phenomenon: zero through the hero, the page body and the
// entire sunset phase, fading in only once the footer sky has settled into
// night (the sky collapse completes ~progress 0.92, see footer-sky-painter's
// SKY_STOP_WINDOWS). It swells over the CTA contact section, then relaxes back to a
// whisper as the dark dock scene enters view.
function intensityFor(progress: number) {
  const nightAmbient = 0.05 * smoothStep((progress - 0.9) / 0.04); // 0 → 0.05 over 0.90–0.94
  const ctaRaw = smoothStep((progress - 0.9) / 0.035);             // rises 0.90 → 0.935
  const dockFade = 1 - smoothStep((progress - 0.935) / 0.045);     // fades 0.935 → 0.98
  return nightAmbient + 0.2 * ctaRaw * dockFade;
}

/**
 * The single ambient aurora layer for the whole site (§3.3). One fixed canvas
 * at the app root, one continuous rAF loop that is identical on every section
 * — no IntersectionObserver gating, so it can never freeze or hard-cut. Only
 * its *intensity* is scroll-linked (smoothly, via global scroll progress).
 */
export function AmbientAurora() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();
  const progressRef = useRef(0);

  // Global scroll progress read straight from the Lenis-driven scroll
  // position — same scrollY / max-scroll value the framer useScroll source
  // produced, with Lenis as the only clock in the chain.
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
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const startedAt = performance.now();
    const elapsed = () => (reduceMotion ? 0 : (performance.now() - startedAt) / 1000);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, window.innerWidth);
      const nextHeight = Math.max(1, window.innerHeight);
      const nextCanvasWidth = Math.round(nextWidth * dpr);
      const nextCanvasHeight = Math.round(nextHeight * dpr);

      width = nextWidth;
      height = nextHeight;

      if (canvas.width !== nextCanvasWidth || canvas.height !== nextCanvasHeight) {
        canvas.width = nextCanvasWidth;
        canvas.height = nextCanvasHeight;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => drawAurora(context, width, height, elapsed(), intensityFor(progressRef.current));

    resize();
    draw();

    window.addEventListener("resize", resize);

    if (!reduceMotion) {
      const frame = () => {
        draw();
        animationFrame = requestAnimationFrame(frame);
      };
      animationFrame = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [reduceMotion]);

  return (
    <div
      aria-hidden
      data-ambient-aurora
      className="ambient-aurora pointer-events-none fixed inset-0 z-[1] [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%)]"
    >
      <canvas ref={canvasRef} className="adaline-footer-aurora-canvas" />
    </div>
  );
}
