"use client";

import {
  useEffect,
  type HTMLAttributes,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type LiquidGlassTag = "article" | "aside" | "div" | "form" | "nav" | "section";

interface LiquidGlassPanelProps {
  as?: LiquidGlassTag;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  radius?: number;
  /** Tuning passthroughs — defaults match the Experience-section glass. */
  scale?: number;
  border?: number;
  blur?: number;
  displace?: number;
  lightness?: number;
  alpha?: number;
  frost?: number;
  saturation?: number;
  /** Legacy props (silently accepted so existing call sites keep compiling). */
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B";
  yChannel?: "R" | "G" | "B";
  blend?: string;
  displacement?: number;
  chroma?: number;
  mapBlur?: number;
  mapBorder?: number;
  mapInset?: number;
  style?: CSSProperties;
}

function supportsBackdropUrlFilter() {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  const hasBackdrop =
    CSS.supports("backdrop-filter: blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter: blur(1px)");
  const ua = window.navigator.userAgent;
  const isChromium = /(Chrome|Chromium|Edg)\//.test(ua) && !/Firefox\//.test(ua);
  return hasBackdrop && isChromium;
}

/**
 * Build the displacement map — same SVG technique as <GlassSurface>.
 *
 * Two linear gradients (red horizontal, blue vertical) blended with
 * difference, plus an inner blurred neutral-grey rect that defines the
 * non-distorting glass body. With xChannel="R" / yChannel="G" (G has no
 * gradient → near-zero Y displacement) only gentle horizontal refraction
 * fires, which avoids the corner-cross "sparkle" pattern entirely.
 */
function buildDisplacementImage(
  width: number,
  height: number,
  radius: number,
  border: number,
  lightness: number,
  alpha: number,
  blur: number,
) {
  const w = Math.max(64, Math.round(width));
  const h = Math.max(64, Math.round(height));
  const r = Math.max(0, radius);
  const edge = Math.min(w, h) * (border * 0.5);
  const innerW = Math.max(1, w - edge * 2);
  const innerH = Math.max(1, h - edge * 2);

  const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="red"/>
    </linearGradient>
    <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#r)"/>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#b)" style="mix-blend-mode:difference"/>
  <rect x="${edge}" y="${edge}" width="${innerW}" height="${innerH}" rx="${r}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${blur}px)"/>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function LiquidGlassPanel({
  as = "div",
  children,
  className = "",
  contentClassName = "",
  radius = 32,
  // Defaults match the GlassSurface numbers used in the Experience-section glass.
  scale = -90,
  border = 0.07,
  blur = 11,
  displace = 2,
  lightness = 60,
  alpha = 0.93,
  frost = 0,
  saturation = 1.1,
  // legacy / unused props — accepted silently
  redOffset: _r,
  greenOffset: _g,
  blueOffset: _b,
  xChannel: _x,
  yChannel: _y,
  blend: _blend,
  displacement: _displacement,
  chroma: _chroma,
  mapBlur: _mapBlur,
  mapBorder: _mapBorder,
  mapInset: _mapInset,
  style,
  ...rest
}: LiquidGlassPanelProps & HTMLAttributes<HTMLElement>) {
  void _r; void _g; void _b; void _x; void _y; void _blend;
  void _displacement; void _chroma; void _mapBlur; void _mapBorder; void _mapInset;

  const rootRef = useRef<HTMLElement | null>(null);
  const rawId = useId();
  const filterId = useMemo(
    () => `liquid-panel-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [rawId],
  );
  const [supportsUrlFilter, setSupportsUrlFilter] = useState(false);
  const [bounds, setBounds] = useState({ width: 640, height: 320 });

  useEffect(() => {
    setSupportsUrlFilter(supportsBackdropUrlFilter());
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(1, Math.round(entry.contentRect.width));
      const h = Math.max(1, Math.round(entry.contentRect.height));
      setBounds((current) =>
        current.width === w && current.height === h ? current : { width: w, height: h },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const displacementImage = useMemo(
    () => buildDisplacementImage(bounds.width, bounds.height, radius, border, lightness, alpha, blur),
    [bounds.width, bounds.height, radius, border, lightness, alpha, blur],
  );

  // Backdrop filter: just url() + saturate(). No brightness/contrast/blur —
  // those would frost the glass and obscure the refraction.
  const backdropValue = supportsUrlFilter
    ? `url(#${filterId}) saturate(${saturation})`
    : `blur(14px) saturate(${1 + saturation * 0.5}) brightness(1.05)`;

  const sharedStyle = {
    ...style,
    ["--liquid-radius" as string]: `${radius}px`,
    ["--liquid-frost" as string]: `${frost}`,
  } as CSSProperties;

  const content = (
    <>
      <svg
        aria-hidden="true"
        focusable="false"
        width="0"
        height="0"
        className="liquid-panel__defs"
        style={{ position: "absolute", overflow: "hidden", pointerEvents: "none" }}
      >
        <defs>
          <filter
            id={filterId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={displacementImage}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation={displace} />
          </filter>
        </defs>
      </svg>

      <span
        aria-hidden="true"
        className="liquid-panel__backdrop"
        style={{ WebkitBackdropFilter: backdropValue, backdropFilter: backdropValue }}
      />
      <div className={`liquid-panel__content ${contentClassName}`.trim()}>{children}</div>
    </>
  );

  const commonProps = {
    ...rest,
    ref: rootRef as never,
    className: `liquid-panel ${className}`.trim(),
    style: sharedStyle,
  };

  switch (as) {
    case "article":
      return <article {...commonProps}>{content}</article>;
    case "aside":
      return <aside {...commonProps}>{content}</aside>;
    case "form":
      return <form {...commonProps}>{content}</form>;
    case "nav":
      return <nav {...commonProps}>{content}</nav>;
    case "section":
      return <section {...commonProps}>{content}</section>;
    default:
      return <div {...commonProps}>{content}</div>;
  }
}
