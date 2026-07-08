"use client";

import type { CSSProperties, ReactNode } from "react";

import GlassSurface from "@/components/ui/glass-surface";

interface ControlCenterPanelProps {
  children: ReactNode;
  className?: string;
  radius?: number;
  style?: CSSProperties;
}

/**
 * Every "At a Glance" widget renders through this shell so that its glass
 * matches the Experience section exactly. We route through <GlassSurface>
 * (the same component Experience uses) with the same tuning knobs — same
 * displacement scale, blur, brightness, opacity, saturation, blend mode.
 * That eliminates the corner-sparkle / cross artifacts the old
 * LiquidGlassPanel produced against the sunset backdrop.
 *
 * The widget-supplied className / style are applied to an inner wrapper so
 * the widget's own flex + padding layout still works. A companion rule in
 * globals.css resets the default centered .glass-surface__content layout
 * when it's nested under .control-center-panel.
 */
export function ControlCenterPanel({
  children,
  className = "",
  radius = 28,
  style,
}: ControlCenterPanelProps) {
  return (
    <GlassSurface
      className="control-center-panel"
      borderRadius={radius}
      distortionScale={-90}
      redOffset={0}
      greenOffset={0}
      blueOffset={0}
      brightness={60}
      opacity={0.93}
      blur={14}
      displace={2}
      backgroundOpacity={0.08}
      saturation={1.1}
      mixBlendMode="screen"
    >
      <div className={`control-center-panel__inner ${className}`.trim()} style={style}>
        {children}
      </div>
    </GlassSurface>
  );
}
