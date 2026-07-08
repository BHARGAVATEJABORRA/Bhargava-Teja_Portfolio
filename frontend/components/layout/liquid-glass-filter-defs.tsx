/**
 * Global SVG filter used by the floating header bar and the hero corner
 * buttons via `.liquid-control[data-liquid-glass="on"]`.
 *
 * Based on jh3y's "liquid glass" CodePen technique but with chromatic
 * separation DISABLED — a single displacement pass instead of three offset
 * R/G/B passes. Result: the bar/buttons refract whatever is behind them
 * without producing rainbow fringing on high-contrast edges.
 */
export function LiquidGlassFilterDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", overflow: "hidden", pointerEvents: "none" }}
    >
      <defs>
        <filter id="index-liquid-glass" x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.05"
            numOctaves="1"
            seed="13"
            stitchTiles="stitch"
            result="NOISE"
          />
          <feGaussianBlur in="NOISE" stdDeviation="1.4" result="SMOOTH_NOISE" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="SMOOTH_NOISE"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="DISPLACED"
          />
          <feGaussianBlur in="DISPLACED" stdDeviation="0.4" />
        </filter>
      </defs>
    </svg>
  );
}
