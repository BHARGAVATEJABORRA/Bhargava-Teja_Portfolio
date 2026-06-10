"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, useScroll } from "framer-motion";

import { drawAurora } from "@/components/scenes/aurora-painter";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothStep(value: number) {
  const clamped = clamp01(value);
  return 3 * clamped ** 2 - 2 * clamped ** 3;
}

// Aurora brightness as a pure function of global scroll progress: a whisper
// over the hero, a soft ambient glow through the middle sections, then the
// full northern-lights swell only once the footer sky has settled into night
// (the last ~15% of the page). Never zero, so the ambient loop is visible on
// every section.
function intensityFor(progress: number) {
  const ambient = 0.1 * smoothStep((progress - 0.1) / 0.5);
  const ctaSwell = 0.82 * smoothStep((progress - 0.84) / 0.13);
  return 0.08 + ambient + ctaSwell;
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
  const { scrollYProgress } = useScroll();
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = scrollYProgress.get();
    return scrollYProgress.on("change", (latest) => {
      progressRef.current = latest;
    });
  }, [scrollYProgress]);

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
