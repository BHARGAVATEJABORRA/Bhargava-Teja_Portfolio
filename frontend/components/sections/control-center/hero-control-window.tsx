"use client";

import { motion, type MotionValue } from "framer-motion";

import { FocusTrack } from "./focus-track";
import { AvailabilityStatus } from "./availability-status";
import { LocalTimeClock } from "./local-time-clock";
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
    <motion.div
      id="control-center"
      aria-label="Control center window"
      style={{ opacity, y, scale }}
      className={`w-[min(90vw,44rem)] rounded-[1.75rem] border border-[rgba(255,255,255,0.62)] bg-[rgba(255,249,242,0.32)] p-3 shadow-[0_28px_70px_rgba(74,50,23,0.24)] backdrop-blur-[22px] transition-[opacity,transform] sm:rounded-[2rem] sm:p-4 ${
        visible ? "pointer-events-auto" : "pointer-events-none"
      } ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-4 border-b border-[rgba(188,152,112,0.22)] px-2 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f58f6c]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f0c96f]" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-[#85c98d]" aria-hidden />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(40,90,94,0.88)]">
            Control Center
          </p>
          <p className="mt-1 text-xs text-[rgba(68,65,59,0.74)] sm:text-sm">A live 2x2 window anchored in the room.</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
        <AvailabilityStatus />
        <LocalTimeClock />
        <WeatherWidget />
        <FocusTrack />
      </div>
    </motion.div>
  );
}
