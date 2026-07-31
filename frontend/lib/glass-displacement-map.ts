type GlassDisplacementOptions = {
  width: number;
  height: number;
  radius: number;
  border: number;
  lightness: number;
  alpha: number;
  blur: number;
  blendMode: string;
  transparentGradientStart: boolean;
};

const displacementImageCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 96;

/**
 * Build and cache the SVG data URL shared by the two liquid-glass component
 * families. Dimensions are pixel-quantized so ResizeObserver sub-pixel noise
 * cannot continuously regenerate equivalent maps.
 */
export function getGlassDisplacementImage({
  width,
  height,
  radius,
  border,
  lightness,
  alpha,
  blur,
  blendMode,
  transparentGradientStart,
}: GlassDisplacementOptions): string {
  const w = Math.max(64, Math.round(width));
  const h = Math.max(64, Math.round(height));
  const r = Math.max(0, radius);
  const edge = Math.min(w, h) * (border * 0.5);
  const innerW = Math.max(1, w - edge * 2);
  const innerH = Math.max(1, h - edge * 2);
  const gradientStart = transparentGradientStart ? "#0000" : "#000";
  const cacheKey = [
    w,
    h,
    r,
    border,
    lightness,
    alpha,
    blur,
    blendMode,
    gradientStart,
  ].join("|");
  const cached = displacementImageCache.get(cacheKey);
  if (cached) return cached;

  const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="${gradientStart}"/>
      <stop offset="100%" stop-color="red"/>
    </linearGradient>
    <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${gradientStart}"/>
      <stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#r)"/>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#b)" style="mix-blend-mode:${blendMode}"/>
  <rect x="${edge}" y="${edge}" width="${innerW}" height="${innerH}" rx="${r}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${blur}px)"/>
</svg>`;
  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  if (displacementImageCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = displacementImageCache.keys().next().value;
    if (oldest) displacementImageCache.delete(oldest);
  }
  displacementImageCache.set(cacheKey, dataUrl);
  return dataUrl;
}
