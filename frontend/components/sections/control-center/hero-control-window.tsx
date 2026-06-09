"use client";

import { motion, type MotionValue } from "framer-motion";

import { GitHubContributions } from "./github-contributions";
import { GlobeWidget } from "./globe-widget";
import { LocalTimeClock } from "./local-time-clock";
import { SpotifyWidget } from "./spotify-widget";
import { WeatherWidget } from "./weather-widget";

interface HeroControlWindowProps {
  opacity?: MotionValue<number>;
  y?: MotionValue<number>;
  scale?: MotionValue<number>;
  visible?: boolean;
  className?: string;
}

export function HeroControlWindow({
  opacity,
  y,
  scale,
  visible = true,
  className = "",
}: HeroControlWindowProps) {
  return (
    <motion.section
      id="control-center"
      aria-label="At a glance — live control center"
      style={{ opacity, y, scale }}
      className={`w-[min(94vw,68rem)] transition-[opacity,transform] ${
        visible ? "pointer-events-auto" : "pointer-events-none"
      } ${className}`.trim()}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4 px-1 sm:mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">At a Glance</h2>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[16rem_13.75rem] lg:items-stretch">
        <div className="min-h-[16rem] min-w-0 lg:min-h-0">
          <GlobeWidget />
        </div>
        <div className="min-h-[16rem] min-w-0 lg:min-h-0">
          <GitHubContributions />
        </div>
        <div className="min-h-[13.75rem] min-w-0 lg:min-h-0">
          <WeatherWidget />
        </div>
        <div className="grid min-h-[13.75rem] min-w-0 gap-3 sm:gap-4 lg:min-h-0 lg:grid-rows-2 [&>.control-center-panel]:min-h-0 [&>.control-center-panel]:overflow-hidden [&>.control-center-panel]:!p-3 sm:[&>.control-center-panel]:!p-4">
          <LocalTimeClock />
          <SpotifyWidget />
        </div>
      </div>
    </motion.section>
  );
}
