"use client";

import {
  useCallback,
  useEffect,
  type HTMLAttributes,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import { getGlassDisplacementImage } from "@/lib/glass-displacement-map";

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
  const feImageRef = useRef<SVGFEImageElement | null>(null);
  const boundsRef = useRef({ width: 640, height: 320 });
  const rawId = useId();
  const filterId = useMemo(
    () => `liquid-panel-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [rawId],
  );
  // SSR-safe feature detection without a setState-in-effect: server renders
  // `false`, the client resolves the real value on mount.
  const supportsUrlFilter = useSyncExternalStore(
    () => () => {},
    () => supportsBackdropUrlFilter(),
    () => false,
  );
  const initialDisplacementImage = useMemo(
    () =>
      getGlassDisplacementImage({
        width: 640,
        height: 320,
        radius,
        border,
        lightness,
        alpha,
        blur,
        blendMode: "difference",
        transparentGradientStart: false,
      }),
    [alpha, blur, border, lightness, radius],
  );

  const updateDisplacementImage = useCallback((width: number, height: number) => {
    boundsRef.current = { width, height };
    feImageRef.current?.setAttribute(
      "href",
      getGlassDisplacementImage({
        width,
        height,
        radius,
        border,
        lightness,
        alpha,
        blur,
        blendMode: "difference",
        transparentGradientStart: false,
      }),
    );
  }, [alpha, blur, border, lightness, radius]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    let nextWidth = boundsRef.current.width;
    let nextHeight = boundsRef.current.height;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      nextWidth = entry.contentRect.width;
      nextHeight = entry.contentRect.height;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateDisplacementImage(nextWidth, nextHeight);
      });
    });
    observer.observe(node);
    updateDisplacementImage(node.clientWidth || 640, node.clientHeight || 320);
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [updateDisplacementImage]);

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
              ref={feImageRef}
              href={initialDisplacementImage}
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
