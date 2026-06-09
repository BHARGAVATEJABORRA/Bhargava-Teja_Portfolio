"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";

interface BorderGlowCardProps {
  children: ReactNode;
  className?: string;
  /** Radius of the glow that tracks the cursor. */
  glowSize?: number;
  /** Glow accent color. Defaults to the theme accent. */
  glowColor?: string;
  style?: CSSProperties;
}

/**
 * Border Glow effect (ReactBits-style): a card whose border lights up with a
 * radial gradient that follows the cursor. The glow is masked to the 1px ring
 * via `mask-composite`, so only the border edge illuminates.
 */
export function BorderGlowCard({
  children,
  className = "",
  glowSize = 240,
  glowColor = "var(--color-accent)",
  style,
}: BorderGlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`border-glow-card ${className}`}
      style={
        {
          "--glow-size": `${glowSize}px`,
          "--glow-color": glowColor,
          ...style,
        } as CSSProperties
      }
    >
      <span className="border-glow-card__ring" aria-hidden />
      <span className="border-glow-card__spotlight" aria-hidden />
      <div className="border-glow-card__content">{children}</div>
    </div>
  );
}
