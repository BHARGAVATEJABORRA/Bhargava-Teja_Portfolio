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
  displacement?: number;
  chroma?: number;
  mapBlur?: number;
  mapBorder?: number;
  mapInset?: number;
  style?: CSSProperties;
}

function supportsLiquidGlassUrl() {
  if (typeof window === "undefined" || typeof CSS === "undefined") {
    return false;
  }

  const hasBackdropFilter =
    CSS.supports("backdrop-filter: blur(1px)") || CSS.supports("-webkit-backdrop-filter: blur(1px)");
  const userAgent = window.navigator.userAgent;
  const isChromium = /(Chrome|Chromium|Edg)\//.test(userAgent) && !/Firefox\//.test(userAgent);

  return hasBackdropFilter && isChromium;
}

function buildDisplacementImage(
  width: number,
  height: number,
  radius: number,
  border: number,
  inset: number,
  blur: number,
) {
  const safeWidth = Math.max(64, Math.round(width));
  const safeHeight = Math.max(64, Math.round(height));
  const safeInset = Math.max(0, inset);
  const safeRadius = Math.max(0, radius - safeInset);
  const safeBorder = Math.max(1, border);
  const safeBlur = Math.max(0.1, blur);
  const rectWidth = Math.max(1, safeWidth - safeInset * 2);
  const rectHeight = Math.max(1, safeHeight - safeInset * 2);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${safeWidth} ${safeHeight}" preserveAspectRatio="none">
      <defs>
        <filter id="liquid-map-blur" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${safeBlur}" />
        </filter>
      </defs>
      <rect
        x="${safeInset}"
        y="${safeInset}"
        width="${rectWidth}"
        height="${rectHeight}"
        rx="${safeRadius}"
        ry="${safeRadius}"
        fill="none"
        stroke="white"
        stroke-width="${safeBorder}"
        filter="url(#liquid-map-blur)"
      />
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function LiquidGlassPanel({
  as = "div",
  children,
  className = "",
  contentClassName = "",
  radius = 32,
  displacement = 26,
  chroma = 4,
  mapBlur = 18,
  mapBorder = 10,
  mapInset = 0,
  style,
  ...rest
}: LiquidGlassPanelProps & HTMLAttributes<HTMLElement>) {
  const rootRef = useRef<HTMLElement | null>(null);
  const rawId = useId();
  const filterId = useMemo(() => `liquid-panel-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const [supportsUrlFilter] = useState(() => supportsLiquidGlassUrl());
  const [bounds, setBounds] = useState({ width: 640, height: 320 });

  useEffect(() => {
    const node = rootRef.current;

    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const nextWidth = Math.max(1, Math.round(entry.contentRect.width));
      const nextHeight = Math.max(1, Math.round(entry.contentRect.height));

      setBounds((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const displacementImage = useMemo(
    () => buildDisplacementImage(bounds.width, bounds.height, radius, mapBorder, mapInset, mapBlur),
    [bounds.height, bounds.width, mapBlur, mapBorder, mapInset, radius],
  );

  const backdropValue = supportsUrlFilter
    ? `blur(0.45px) url(#${filterId}) saturate(138%) brightness(1.04)`
    : "blur(26px) saturate(155%) brightness(1.03)";

  const sharedStyle = {
    ...style,
    ["--liquid-radius" as string]: `${radius}px`,
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
          <filter id={filterId} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
            <feImage
              href={displacementImage}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="MAP"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="MAP"
              scale={displacement}
              xChannelSelector="R"
              yChannelSelector="G"
              result="BASE"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="MAP"
              scale={Math.max(1, chroma * 0.6)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="RED_SOURCE"
            />
            <feColorMatrix
              in="RED_SOURCE"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="RED_CHANNEL"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="MAP"
              scale={Math.max(1.5, chroma)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="GREEN_SOURCE"
            />
            <feColorMatrix
              in="GREEN_SOURCE"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="GREEN_CHANNEL"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="MAP"
              scale={Math.max(2, chroma * 1.35)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="BLUE_SOURCE"
            />
            <feColorMatrix
              in="BLUE_SOURCE"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="BLUE_CHANNEL"
            />
            <feBlend in="RED_CHANNEL" in2="GREEN_CHANNEL" mode="screen" result="RG_BLEND" />
            <feBlend in="RG_BLEND" in2="BLUE_CHANNEL" mode="screen" result="RGB_BLEND" />
            <feComposite in="RGB_BLEND" in2="BASE" operator="arithmetic" k1="0" k2="0.24" k3="0.92" k4="0" result="COMPOSITE" />
            <feGaussianBlur in="COMPOSITE" stdDeviation="0.15" />
          </filter>
        </defs>
      </svg>

      <span
        aria-hidden="true"
        className="liquid-panel__backdrop"
        style={{ WebkitBackdropFilter: backdropValue, backdropFilter: backdropValue }}
      />
      <span aria-hidden="true" className="liquid-panel__rim" />
      <div className={`liquid-panel__content ${contentClassName}`.trim()}>{children}</div>
    </>
  );

  if (as === "article") {
    return (
      <article
        {...rest}
        ref={rootRef as never}
        className={`liquid-panel ${className}`.trim()}
        style={sharedStyle}
      >
        {content}
      </article>
    );
  }

  if (as === "aside") {
    return (
      <aside
        {...rest}
        ref={rootRef as never}
        className={`liquid-panel ${className}`.trim()}
        style={sharedStyle}
      >
        {content}
      </aside>
    );
  }

  if (as === "form") {
    return (
      <form
        {...rest}
        ref={rootRef as never}
        className={`liquid-panel ${className}`.trim()}
        style={sharedStyle}
      >
        {content}
      </form>
    );
  }

  if (as === "nav") {
    return (
      <nav
        {...rest}
        ref={rootRef as never}
        className={`liquid-panel ${className}`.trim()}
        style={sharedStyle}
      >
        {content}
      </nav>
    );
  }

  if (as === "section") {
    return (
      <section
        {...rest}
        ref={rootRef as never}
        className={`liquid-panel ${className}`.trim()}
        style={sharedStyle}
      >
        {content}
      </section>
    );
  }

  return (
    <div
      {...rest}
      ref={rootRef as never}
      className={`liquid-panel ${className}`.trim()}
      style={sharedStyle}
    >
      {content}
    </div>
  );
}
