"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { LuMapPin } from "react-icons/lu";

import { ControlCenterPanel } from "./control-center-panel";

interface GlobeWidgetProps {
  markerLocation?: [number, number];
  label?: string;
  sublabel?: string;
}

export function GlobeWidget({
  markerLocation = [32.7767, -96.797],
  label = "Dallas, TX",
  sublabel = "Central Time (CT)",
}: GlobeWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const [hasRenderError, setHasRenderError] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [markerLat, markerLng] = markerLocation;

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    let phi = 4.5;
    let width = 0;

    const onResize = () => {
      if (!canvasRef.current) {
        return;
      }
      width = canvasRef.current.offsetWidth;
    };

    window.addEventListener("resize", onResize);
    onResize();

    const options: COBEOptions = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi,
      theta: 0.25,
      dark: isDark ? 1 : 0,
      diffuse: 1.1,
      mapSamples: 18000,
      mapBrightness: isDark ? 6 : 4,
      baseColor: isDark ? [0.15, 0.15, 0.2] : [0.85, 0.88, 0.92],
      markerColor: [0.1, 0.82, 1.0],
      glowColor: isDark ? [0.1, 0.15, 0.3] : [0.9, 0.92, 1.0],
      markers: [{ location: [markerLat, markerLng], size: 0.12 }],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.0032;
        state.width = width * 2;
        state.height = width * 2;
      },
    };

    try {
      globeRef.current = createGlobe(canvasRef.current, options);
      window.requestAnimationFrame(() => setHasRenderError(false));
    } catch (error) {
      globeRef.current = null;
      window.requestAnimationFrame(() => setHasRenderError(true));
      console.error("Failed to initialize globe widget.", error);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      globeRef.current?.destroy();
    };
  }, [isDark, markerLat, markerLng]);

  return (
    <ControlCenterPanel radius={32} className="flex h-full min-h-[17.5rem] flex-col p-4 sm:min-h-[18.5rem] sm:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] sm:text-base">
        <LuMapPin size={18} aria-hidden />
        <span>{label}</span>
      </div>
      <p className="sr-only">{sublabel}</p>

      <div className="relative mx-auto mt-3 flex flex-1 items-end justify-center">
        <div className="pointer-events-none absolute inset-x-[18%] bottom-6 top-[26%] rounded-full bg-[radial-gradient(circle_at_center,rgba(83,123,255,0.16),transparent_62%)] blur-3xl" />
        <div className="relative aspect-square w-full max-w-[16.5rem] translate-y-9 sm:max-w-[18.5rem] sm:translate-y-10">
          {hasRenderError ? (
            <div className="flex h-full w-full items-center justify-center rounded-full border border-white/18 bg-[radial-gradient(circle_at_38%_34%,rgba(158,191,255,0.3)_0%,rgba(158,191,255,0.12)_22%,rgba(18,34,62,0.08)_56%,rgba(8,18,31,0.04)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
              <div className="flex h-[72%] w-[72%] items-center justify-center rounded-full border border-white/16 bg-[radial-gradient(circle_at_34%_30%,rgba(255,255,255,0.38)_0%,rgba(255,255,255,0.12)_18%,rgba(11,20,38,0.08)_54%,rgba(11,20,38,0.02)_100%)]">
                <span className="text-center text-sm font-medium leading-relaxed text-[var(--color-muted-ink)]">
                  {label}
                  <br />
                  {sublabel}
                </span>
              </div>
            </div>
          ) : (
            <canvas ref={canvasRef} className="h-full w-full rounded-full" />
          )}
        </div>
      </div>
    </ControlCenterPanel>
  );
}
