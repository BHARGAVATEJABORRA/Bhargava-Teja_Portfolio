"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuMapPin } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";

import { ControlCenterPanel } from "./control-center-panel";

interface GlobeWidgetProps {
  markerLocation?: [number, number];
  label?: string;
}

export function GlobeWidget({
  markerLocation = [
    portfolioContent.identity.controlCenter.weatherLat,
    portfolioContent.identity.controlCenter.weatherLng,
  ],
  label = portfolioContent.identity.controlCenter.location,
}: GlobeWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const [hasRenderError, setHasRenderError] = useState(false);
  const [ready, setReady] = useState(false);
  const [markerLat, markerLng] = markerLocation;

  // Auto-spin baseline plus drag offset accumulated from pointer interaction.
  const phiRef = useRef(4.5);
  const pointerInteractingRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteractingRef.current = event.clientX - dragDeltaRef.current;
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (pointerInteractingRef.current !== null) {
        dragDeltaRef.current = event.clientX - pointerInteractingRef.current;
      }
    }
    function onPointerUp() {
      pointerInteractingRef.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    let width = 0;
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const options: COBEOptions = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: phiRef.current,
      theta: 0.25,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 18000,
      mapBrightness: 4,
      baseColor: [0.85, 0.88, 0.92],
      markerColor: [0.06, 0.56, 0.51],
      glowColor: [0.9, 0.92, 1.0],
      markers: [{ location: [markerLat, markerLng], size: 0.1 }],
      onRender: (state) => {
        // Auto-rotate slowly, but let the drag offset steer the longitude.
        if (pointerInteractingRef.current === null) {
          phiRef.current += 0.0032;
        }
        state.phi = phiRef.current + dragDeltaRef.current / 200;
        state.width = width * 2;
        state.height = width * 2;
      },
    };

    try {
      globeRef.current = createGlobe(canvasRef.current, options);
      window.requestAnimationFrame(() => {
        setHasRenderError(false);
        setReady(true);
      });
    } catch (error) {
      globeRef.current = null;
      window.requestAnimationFrame(() => setHasRenderError(true));
      console.error("Failed to initialize globe widget.", error);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      globeRef.current?.destroy();
    };
  }, [markerLat, markerLng]);

  return (
    <ControlCenterPanel radius={32} className="flex h-full min-h-[16rem] flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
        <LuMapPin size={15} aria-hidden />
        <span>Location</span>
      </div>

      <div className="relative mx-auto mt-2 flex flex-1 items-end justify-center">
        <div className="pointer-events-none absolute inset-x-[16%] bottom-4 top-[24%] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,143,131,0.16),transparent_62%)] blur-3xl" />
        <div className="relative aspect-square w-full max-w-[15rem] translate-y-8 select-none sm:max-w-[17rem] sm:translate-y-9">
          {hasRenderError ? (
            <div className="flex h-full w-full items-center justify-center rounded-full border border-white/18 bg-[radial-gradient(circle_at_38%_34%,rgba(158,191,255,0.3)_0%,rgba(158,191,255,0.12)_22%,rgba(18,34,62,0.08)_56%,rgba(8,18,31,0.04)_100%)]">
              <span className="text-center text-sm font-medium text-[var(--color-muted-ink)]">{label}</span>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              data-ready={ready}
              className="h-full w-full cursor-grab touch-none rounded-full opacity-0 transition-opacity duration-500 data-[ready=true]:opacity-100"
            />
          )}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-[rgba(255,255,255,0.72)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-[0_8px_24px_rgba(10,23,42,0.16)] backdrop-blur-md">
            <LuMapPin size={12} className="text-[var(--color-accent)]" aria-hidden />
            {label}
          </span>
        </div>
      </div>
    </ControlCenterPanel>
  );
}
