"use client";

import type { CSSProperties, HTMLAttributes, PointerEvent, ReactNode } from "react";

import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";

interface ControlCenterPanelProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  className?: string;
  radius?: number;
  style?: CSSProperties;
}

export function ControlCenterPanel({
  children,
  className = "",
  radius = 28,
  style,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  ...rest
}: ControlCenterPanelProps) {
  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.dataset.glowActive = "true";
    event.currentTarget.style.setProperty("--control-glow-intensity", "1");
    onPointerEnter?.(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.dataset.glowActive = "false";
    event.currentTarget.style.setProperty("--control-glow-intensity", "0");
    onPointerLeave?.(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    event.currentTarget.style.setProperty("--control-glow-x", `${x}%`);
    event.currentTarget.style.setProperty("--control-glow-y", `${y}%`);

    onPointerMove?.(event);
  };

  return (
    <LiquidGlassPanel
      {...rest}
      as="article"
      radius={radius}
      className={`control-center-panel ${className}`.trim()}
      style={style}
      data-glow-active="false"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      {children}
    </LiquidGlassPanel>
  );
}
