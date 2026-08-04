"use client";

import { memo, useEffect, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

import type { WeatherKind } from "@/lib/open-meteo";

type SceneProps = {
  kind: WeatherKind;
  isNight: boolean;
  expanded?: boolean;
};

type CloudVariant = "far" | "middle" | "near";

type DataSaverConnection = {
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function getConnection() {
  return (navigator as Navigator & { connection?: DataSaverConnection }).connection;
}

function prefersReducedData() {
  if (typeof window === "undefined") return false;
  const connection = getConnection();
  return Boolean(connection?.saveData || window.matchMedia?.("(prefers-reduced-data: reduce)").matches);
}

function subscribeToReducedData(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia?.("(prefers-reduced-data: reduce)");
  media?.addEventListener?.("change", onChange);
  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);
  return () => {
    media?.removeEventListener?.("change", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}

function subscribeToDocumentVisibility(onChange: () => void) {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function useSceneMotion() {
  const [nearViewport, setNearViewport] = useState(false);
  const reduceMotion = useReducedMotion();
  const reducedData = useSyncExternalStore(subscribeToReducedData, prefersReducedData, () => false);
  const visible = useSyncExternalStore(subscribeToDocumentVisibility, () => !document.hidden, () => true);

  return {
    canAnimate: !reduceMotion && !reducedData && visible,
    nearViewport,
    setNearViewport,
  };
}

function CloudBank({ variant, storm, night }: { variant: CloudVariant; storm: boolean; night: boolean }) {
  const fill = night ? "#8da2ba" : storm ? "#8c9eaa" : "#edf5f9";
  const shade = night ? "#405570" : storm ? "#4e6472" : "#91b1c5";
  const paths =
    variant === "far"
      ? ["M-20 82 C3 58 18 68 36 52 C57 33 82 45 97 60 C113 76 138 47 163 58 C184 67 197 49 220 46 L220 120 L-20 120 Z"]
      : variant === "middle"
        ? ["M-18 91 C6 65 22 72 37 52 C57 24 82 38 98 57 C112 73 127 58 143 44 C166 23 191 45 220 37 L220 120 L-18 120 Z"]
        : ["M-24 100 C0 71 17 79 31 56 C48 28 77 39 91 60 C108 83 128 70 145 48 C163 27 192 47 224 42 L224 120 L-24 120 Z"];

  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="none" className={`weather-cloud-bank weather-cloud-bank--${variant}`} aria-hidden>
      <defs>
        <linearGradient id={`weather-cloud-${variant}-${night ? "night" : storm ? "storm" : "day"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.96" />
          <stop offset="100%" stopColor={shade} stopOpacity="0.86" />
        </linearGradient>
      </defs>
      {paths.map((path) => (
        <path key={path} d={path} fill={`url(#weather-cloud-${variant}-${night ? "night" : storm ? "storm" : "day"})`} />
      ))}
      <path d="M-8 94 C34 78 48 88 77 72 C111 53 142 75 167 60 C181 51 194 57 208 53 L208 120 L-8 120 Z" fill={shade} opacity="0.28" />
    </svg>
  );
}

const WEATHER_PARTICLES = Array.from({ length: 16 }, (_, index) => ({
  left: `${(index * 37 + 9) % 100}%`,
  top: `${(index * 23 + 5) % 82}%`,
  animationDelay: `${(index % 8) * -0.45}s`,
}));

/**
 * A composited, CSS-only weather scene. The only animated properties are
 * transforms/opacity, and they run only while this scene is actually visible.
 */
export const WeatherScene = memo(function WeatherScene({ kind, isNight, expanded = false }: SceneProps) {
  const { canAnimate, nearViewport, setNearViewport } = useSceneMotion();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const isRain = kind === "rainy";
  const isSnow = kind === "snowy";
  const isStorm = kind === "thunderstorm";
  const isFog = kind === "foggy";
  const hasClouds = kind === "partly-cloudy" || kind === "cloudy" || isRain || isSnow || isStorm || isFog;
  const sky = isNight
    ? "linear-gradient(180deg, #071327 0%, #152b4b 58%, #315574 100%)"
    : isStorm || isRain
      ? "linear-gradient(180deg, #385263 0%, #6f8a98 55%, #9bb9c8 100%)"
      : isFog
        ? "linear-gradient(180deg, #6e94aa 0%, #a6c3d1 57%, #d5e2e5 100%)"
        : "linear-gradient(180deg, #1266a5 0%, #3196ce 54%, #9ed3e7 100%)";

  useEffect(() => {
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setNearViewport(entry.isIntersecting), { rootMargin: "280px 0px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, [root, setNearViewport]);

  const motionActive = canAnimate && nearViewport;

  return (
    <div
      ref={setRoot}
      data-weather-scene-active={motionActive ? "true" : "false"}
      className={`weather-scene weather-scene--${expanded ? "expanded" : "compact"} ${motionActive ? "weather-scene--animated" : ""}`}
      style={{ background: sky }}
      aria-hidden
    >
      <div className="weather-scene__horizon" />
      {!isNight && !isStorm ? <div className="weather-scene__sun" /> : null}
      {isNight ? (
        <>
          <div className="weather-scene__stars">
            {[8, 18, 27, 42, 57, 71, 84, 91, 35, 64].map((left, index) => (
              <i key={left} style={{ left: `${left}%`, top: `${8 + ((index * 17) % 35)}%` }} />
            ))}
          </div>
          <div className="weather-scene__moon" />
        </>
      ) : null}

      {hasClouds ? (
        <div className={`weather-scene__clouds weather-scene__clouds--${kind}`}>
          <CloudBank variant="far" storm={isStorm || isRain} night={isNight} />
          <CloudBank variant="middle" storm={isStorm || isRain} night={isNight} />
          <CloudBank variant="near" storm={isStorm || isRain} night={isNight} />
        </div>
      ) : null}

      {isFog ? <div className="weather-scene__fog" /> : null}
      {isRain || isStorm ? (
        <div className="weather-scene__particles weather-scene__particles--rain">
          {WEATHER_PARTICLES.map((particle, index) => <i key={index} style={particle} />)}
        </div>
      ) : null}
      {isSnow ? (
        <div className="weather-scene__particles weather-scene__particles--snow">
          {WEATHER_PARTICLES.map((particle, index) => <i key={index} style={particle} />)}
        </div>
      ) : null}
      {isStorm ? <div className="weather-scene__lightning" /> : null}
      <div className="weather-scene__finish" />

      <style jsx>{`
        .weather-scene { isolation: isolate; position: absolute; inset: 0; overflow: hidden; border-radius: inherit; }
        .weather-scene__horizon { position: absolute; inset: 40% 0 0; background: linear-gradient(180deg, transparent, rgba(222, 243, 250, 0.16)); }
        .weather-scene__sun { position: absolute; top: 18%; right: 34%; width: ${expanded ? "9rem" : "4.8rem"}; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(255,253,237,0.98) 0 20%, rgba(255,238,173,0.8) 42%, rgba(255,230,153,0) 71%); }
        .weather-scene__stars i { position: absolute; width: 1px; height: 1px; border-radius: 50%; background: rgba(255,255,255,.8); }
        .weather-scene__moon { position: absolute; top: 18%; right: 34%; width: ${expanded ? "7rem" : "3.75rem"}; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 34% 31%, rgba(132,149,170,.34) 0 5%, transparent 6%), radial-gradient(circle at 67% 65%, rgba(118,137,160,.28) 0 7%, transparent 8%), radial-gradient(circle at 43% 45%, #f5f8fb 0%, #d6e0eb 57%, #aebdce 100%); box-shadow: 0 0 24px rgba(207,226,247,.3); }
        .weather-scene__clouds { position: absolute; inset: 0; opacity: .93; }
        .weather-cloud-bank { position: absolute; left: -9%; width: 118%; height: 68%; overflow: visible; }
        .weather-cloud-bank--far { top: 4%; opacity: .46; }
        .weather-cloud-bank--middle { top: 20%; opacity: .7; }
        .weather-cloud-bank--near { top: 39%; opacity: .82; }
        .weather-scene__clouds--partly-cloudy .weather-cloud-bank--far { opacity: .22; }
        .weather-scene__clouds--partly-cloudy .weather-cloud-bank--middle { opacity: .34; transform: translateX(28%); }
        .weather-scene__clouds--partly-cloudy .weather-cloud-bank--near { opacity: .22; transform: translateX(-28%); }
        .weather-scene--animated .weather-cloud-bank--far { will-change: transform; animation: weather-cloud-far 300s linear infinite; }
        .weather-scene--animated .weather-cloud-bank--middle { will-change: transform; animation: weather-cloud-middle 230s linear infinite; }
        .weather-scene--animated .weather-cloud-bank--near { will-change: transform; animation: weather-cloud-near 170s linear infinite; }
        .weather-scene__fog { position: absolute; inset: 42% -8% -8%; opacity: .54; background: linear-gradient(180deg, transparent, rgba(244,250,250,.55) 53%, rgba(217,231,235,.7)); }
        .weather-scene__particles { position: absolute; inset: 0; overflow: hidden; }
        .weather-scene__particles i { position: absolute; display: block; opacity: .56; }
        .weather-scene__particles--rain i { width: 1px; height: 16px; background: linear-gradient(180deg, rgba(255,255,255,.8), transparent); transform: rotate(14deg); }
        .weather-scene__particles--snow i { width: 3px; height: 3px; border-radius: 50%; background: white; }
        .weather-scene--animated .weather-scene__particles--rain i { will-change: transform, opacity; animation: weather-rain 2.4s linear infinite; animation-delay: var(--delay, 0s); }
        .weather-scene--animated .weather-scene__particles--snow i { will-change: transform, opacity; animation: weather-snow 8s linear infinite; animation-delay: var(--delay, 0s); }
        .weather-scene__lightning { position: absolute; inset: 0; opacity: 0; background: linear-gradient(122deg, transparent 44%, rgba(255,255,255,.3) 47%, transparent 51%); }
        .weather-scene--animated .weather-scene__lightning { animation: weather-lightning 12s step-end infinite; }
        .weather-scene__finish { position: absolute; inset: 0; background: linear-gradient(165deg, rgba(255,255,255,.18), transparent 35%, rgba(2,15,28,.17)); box-shadow: inset 0 1px rgba(255,255,255,.38), inset 0 -1px rgba(0,0,0,.12); }
        @keyframes weather-cloud-far { from { transform: translate3d(-1.5%,0,0); } to { transform: translate3d(1.5%,0,0); } }
        @keyframes weather-cloud-middle { from { transform: translate3d(-2.1%,0,0); } to { transform: translate3d(2.1%,0,0); } }
        @keyframes weather-cloud-near { from { transform: translate3d(-2.8%,0,0); } to { transform: translate3d(2.8%,0,0); } }
        @keyframes weather-rain { from { transform: translate3d(-5px,-22px,0) rotate(14deg); opacity: 0; } 15% { opacity: .56; } to { transform: translate3d(18px,190px,0) rotate(14deg); opacity: 0; } }
        @keyframes weather-snow { from { transform: translate3d(0,-14px,0); opacity: 0; } 20% { opacity: .78; } to { transform: translate3d(15px,190px,0); opacity: 0; } }
        @keyframes weather-lightning { 0%, 92%, 100% { opacity: 0; } 93%, 94% { opacity: .62; } }
        @media (prefers-reduced-motion: reduce), (prefers-reduced-data: reduce) { .weather-scene * { animation: none !important; } }
      `}</style>
    </div>
  );
});
