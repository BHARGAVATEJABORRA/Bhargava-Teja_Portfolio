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

      {/*
        Exactly four "at a glance" blocks. 3-column layout at lg:
          col 1 (1fr)          col 2 (13.75rem)   col 3 (13.75rem)
        ┌──────────────────────────┬────────────────────────────────┐  row 1 (16rem)
        │  1 · Earth / location    │  2 · GitHub contributions      │
        ├──────────────────────────┼──────────────────┬─────────────┤  row 2 (13.75rem)
        │  3 · Weather (wide)      │  4a · Clock (sq) │ 4b · Spotify│
        └──────────────────────────┴──────────────────┴─────────────┘
        Block 4 is one block split into two squares (clock + Spotify).

        Below lg: single column, stacked in the same order. Clock + Spotify
        share a 2-col row with aspect-square so they stay square on mobile.
      */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_16rem_16rem] lg:grid-rows-[16rem_16rem] lg:items-stretch">

        {/* 1 · Earth with location — wide left cell of row 1 */}
        <div className="min-h-[16rem] min-w-0 lg:col-start-1 lg:row-start-1 lg:min-h-0">
          <GlobeWidget />
        </div>

        {/* 2 · GitHub contribution activity — right cells of row 1 */}
        <div className="min-h-[16rem] min-w-0 lg:col-span-2 lg:col-start-2 lg:row-start-1 lg:min-h-0">
          <GitHubContributions />
        </div>

        {/* 3 · Weather — wide left cell of row 2 */}
        <div className="min-h-[13.75rem] min-w-0 lg:col-start-1 lg:row-start-2 lg:min-h-0">
          <WeatherWidget />
        </div>

        {/* 4 · Clock + Spotify — one block split into two squares in row 2.
            Below lg: side-by-side via 2-col sub-grid with aspect-square.
            At lg: display:contents places each square into cols 2 and 3. */}
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:contents">
          <div className="aspect-square min-w-0 lg:aspect-auto lg:col-start-2 lg:row-start-2 lg:h-[16rem] lg:w-[16rem]">
            <LocalTimeClock />
          </div>
          <div className="aspect-square min-w-0 lg:aspect-auto lg:col-start-3 lg:row-start-2 lg:h-[16rem] lg:w-[16rem]">
            <SpotifyWidget />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
