"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { LuMapPin } from "react-icons/lu";

import { portfolioContent } from "@/content/portfolio-content";
import { subscribeToScrollRead } from "@/lib/scroll-runtime";

import { ControlCenterPanel } from "./control-center-panel";

const GlobeRenderer = dynamic(() => import("./globe-renderer").then((module) => module.GlobeRenderer), {
  ssr: false,
});

const ACTIVATION_MARGIN = 0;

interface GlobeWidgetProps {
  markerLocation?: [number, number];
  label?: string;
}

type DataConnection = {
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

export function GlobeWidget({
  markerLocation = [
    portfolioContent.identity.controlCenter.weatherLat,
    portfolioContent.identity.controlCenter.weatherLng,
  ],
  label = portfolioContent.identity.controlCenter.location,
}: GlobeWidgetProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hasRenderError, setHasRenderError] = useState(false);
  const [ready, setReady] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [enhancementAllowed, setEnhancementAllowed] = useState(false);
  const [markerLat, markerLng] = markerLocation;
  const sceneActive = nearViewport && documentVisible && enhancementAllowed && !hasRenderError;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: `${ACTIVATION_MARGIN}px 0px` },
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // IntersectionObserver governs entry. While active, the shared read phase
  // verifies exit so a delayed observer callback cannot retain a WebGL context.
  useEffect(() => {
    if (!nearViewport || !documentVisible) return;
    return subscribeToScrollRead(() => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (rect.bottom < -ACTIVATION_MARGIN || rect.top > window.innerHeight + ACTIVATION_MARGIN) {
        setNearViewport(false);
      }
    });
  }, [documentVisible, nearViewport]);

  useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dataPreference = window.matchMedia("(prefers-reduced-data: reduce)");
    const connection = (navigator as Navigator & { connection?: DataConnection }).connection;
    const updatePreference = () => {
      setEnhancementAllowed(!motionPreference.matches && !dataPreference.matches && !connection?.saveData);
    };

    updatePreference();
    motionPreference.addEventListener("change", updatePreference);
    dataPreference.addEventListener("change", updatePreference);
    connection?.addEventListener?.("change", updatePreference);
    return () => {
      motionPreference.removeEventListener("change", updatePreference);
      dataPreference.removeEventListener("change", updatePreference);
      connection?.removeEventListener?.("change", updatePreference);
    };
  }, []);

  return (
    <ControlCenterPanel radius={32} className="flex h-full min-h-[16rem] flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
        <LuMapPin size={15} aria-hidden />
        <span>Location</span>
      </div>

      <div className="relative mx-auto mt-2 flex min-h-0 w-full flex-1 items-end justify-center">
        <div className="pointer-events-none absolute inset-x-[16%] bottom-4 top-[24%] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,132,196,0.2),transparent_62%)] blur-3xl" />
        <div ref={viewportRef} className="relative aspect-square w-full max-w-[15rem] translate-y-8 select-none sm:max-w-[17rem] sm:translate-y-9">
          {/* Immediate complete fallback: it remains behind WebGL during load
              and is all the visitor sees when motion/GPU/network is unavailable. */}
          <div
            aria-hidden
            data-globe-fallback
            className="absolute inset-0 rounded-full border border-white/18 bg-[radial-gradient(circle_at_35%_30%,rgba(130,190,241,0.5)_0%,rgba(57,126,184,0.3)_28%,rgba(18,65,109,0.5)_59%,rgba(5,20,38,0.8)_100%)] shadow-[inset_-16px_-14px_30px_rgba(2,10,22,0.38),0_0_32px_rgba(62,148,225,0.18)]"
          />
          {sceneActive ? (
            <GlobeRenderer
              markerLat={markerLat}
              markerLng={markerLng}
              ready={ready}
              setReady={setReady}
              setRenderError={setHasRenderError}
            />
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[rgba(8,16,26,0.66)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <LuMapPin size={12} className="text-[var(--color-accent)]" aria-hidden />
            {label}
          </span>
        </div>
      </div>
    </ControlCenterPanel>
  );
}
