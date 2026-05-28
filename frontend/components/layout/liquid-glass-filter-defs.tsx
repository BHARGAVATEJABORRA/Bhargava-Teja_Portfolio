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
          <feGaussianBlur in="NOISE" stdDeviation="0.8" result="SMOOTH_NOISE" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="SMOOTH_NOISE"
            scale="24"
            xChannelSelector="R"
            yChannelSelector="G"
            result="BASE_DISPLACED"
          />
          <feOffset in="BASE_DISPLACED" dx="0" dy="0" result="CENTER_ORIGINAL" />
          <feDisplacementMap
            in="BASE_DISPLACED"
            in2="SMOOTH_NOISE"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
            result="RED_DISPLACED"
          />
          <feColorMatrix
            in="RED_DISPLACED"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="RED_CHANNEL"
          />
          <feDisplacementMap
            in="BASE_DISPLACED"
            in2="SMOOTH_NOISE"
            scale="36"
            xChannelSelector="R"
            yChannelSelector="G"
            result="GREEN_DISPLACED"
          />
          <feColorMatrix
            in="GREEN_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="GREEN_CHANNEL"
          />
          <feDisplacementMap
            in="BASE_DISPLACED"
            in2="SMOOTH_NOISE"
            scale="42"
            xChannelSelector="R"
            yChannelSelector="G"
            result="BLUE_DISPLACED"
          />
          <feColorMatrix
            in="BLUE_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="BLUE_CHANNEL"
          />
          <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
          <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />
          <feGaussianBlur in="RGB_COMBINED" stdDeviation="0.45" result="ABERRATED_BLURRED" />
          <feComposite in="CENTER_ORIGINAL" in2="ABERRATED_BLURRED" operator="arithmetic" k1="0" k2="0.92" k3="0.38" k4="0" />
        </filter>
      </defs>
    </svg>
  );
}
