// Hand-painted footer sky. One palette and one set of scroll curves recolor
// both the sky gradient and the sunset cloud streaks together as you scroll,
// so the clouds always catch the current sky light instead of washing out
// against an already-night gradient.

export type Rgb = readonly [number, number, number];

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function smoothStep(value: number) {
  const clamped = clamp01(value);
  return 3 * clamped ** 2 - 2 * clamped ** 3;
}

function lerpChannel(from: number, to: number, t: number) {
  return Math.round(from + (to - from) * t);
}

export function mixRgb(from: Rgb, to: Rgb, t: number) {
  return `rgb(${lerpChannel(from[0], to[0], t)}, ${lerpChannel(from[1], to[1], t)}, ${lerpChannel(from[2], to[2], t)})`;
}

// Sky band: a sunset (tint 0) melting into night (tint 1). Sunset endpoints are
// the brightest sky the scroll ever shows; night endpoints land on a dark-teal
// horizon so the seam below the band converges on the page base (#050e11).
export const SKY_TOP: [Rgb, Rgb] = [
  [116, 118, 152],
  [5, 13, 16],
];
export const SKY_MIDDLE: [Rgb, Rgb] = [
  [185, 164, 160],
  [16, 34, 39],
];
// Deep teal->green lower sky. This is what the aurora's screen blend lands on:
// over near-black the same shader reads neon, over this it reads soft.
export const SKY_BOTTOM: [Rgb, Rgb] = [
  [216, 178, 132],
  [32, 63, 56],
];

// The horizon keeps light longest: each lower stop starts collapsing later than
// the zenith, giving a rose horizon under an already-violet top. All three
// windows converge near band 0.68, so the sky is fully night when the CTA lands.
export const SKY_STOP_WINDOWS = [
  [0.4, 0.28],
  [0.42, 0.26],
  [0.44, 0.24],
] as const;

// Cloud tint rides lighter and warmer than the sky so the streak tops catch the
// last sunset light, then settles to a visible night teal (not black) so soft
// cloud texture still shows behind the aurora instead of an empty black field.
export const CLOUD_TOP: [Rgb, Rgb] = [
  [172, 138, 164],
  [16, 34, 39],
];
export const CLOUD_BOTTOM: [Rgb, Rgb] = [
  [248, 196, 142],
  [32, 63, 56],
];

// Scroll curves — band progress (0 = band top at viewport bottom, 1 = band
// bottom at 35% viewport) to tint/alpha. Quantized to 1/1000 so a repaint at
// the same scroll position is byte-identical regardless of scroll history.
function quantize(value: number) {
  return Math.round(clamp01(value) * 1000) / 1000;
}

// The sunset holds until ~0.40 (the articles seam and top-fade occupy the band
// until then), so the warm phase is actually seen before the collapse to night.
export function skyStopTint(bandProgress: number, stop: 0 | 1 | 2) {
  const [start, span] = SKY_STOP_WINDOWS[stop];
  return quantize(smoothStep(clamp01((bandProgress - start) / span)));
}

/** Quantized paint state for the sky — three windowed stop tints + alpha. */
export function footerSkyKey(bandProgress: number) {
  return (
    SKY_STOP_WINDOWS.map((_, stop) => skyStopTint(bandProgress, stop as 0 | 1 | 2)).join("|") +
    `|${skyAlpha(bandProgress)}`
  );
}

// The sky fades in as the footer enters, taking over from the day-cycle ocean
// in a same-color sunset crossfade. The window is wide (0-0.14) so the ocean's
// sun and waves dissolve softly instead of being wiped by a fast opacity ramp.
export function skyAlpha(bandProgress: number) {
  return quantize(smoothStep(clamp01(bandProgress / 0.14)));
}

// Clouds catch the last light: the plate's dense rows fill the viewport around
// band 0.5-0.7, so the tint must still be warm there. The collapse lags the
// sky's and converges to the same night base near 0.68, as the plate's alpha
// runs out by the CTA.
export function cloudTint(bandProgress: number) {
  return quantize(smoothStep(clamp01((bandProgress - 0.48) / 0.2)));
}

export function starsAlpha(bandProgress: number) {
  return quantize(smoothStep(clamp01((bandProgress - 0.12) / 0.4)) * 0.96);
}

/** Paint the fixed full-viewport sunset→night sky gradient. */
export function paintFooterSky(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  bandProgress: number,
) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, mixRgb(SKY_TOP[0], SKY_TOP[1], skyStopTint(bandProgress, 0)));
  gradient.addColorStop(0.52, mixRgb(SKY_MIDDLE[0], SKY_MIDDLE[1], skyStopTint(bandProgress, 1)));
  gradient.addColorStop(1, mixRgb(SKY_BOTTOM[0], SKY_BOTTOM[1], skyStopTint(bandProgress, 2)));

  context.clearRect(0, 0, width, height);
  context.globalAlpha = skyAlpha(bandProgress);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;
}

/**
 * Paint the cloud band: the current cloud tint masked by the cloud plate's
 * alpha (destination-in). The gradient spans the whole band so each streak
 * picks up the light for its own altitude.
 */
export function paintFooterClouds(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  bandProgress: number,
  cloudImage: HTMLImageElement,
) {
  const tint = cloudTint(bandProgress);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, mixRgb(CLOUD_TOP[0], CLOUD_TOP[1], tint));
  gradient.addColorStop(1, mixRgb(CLOUD_BOTTOM[0], CLOUD_BOTTOM[1], tint));

  context.clearRect(0, 0, width, height);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(cloudImage, 0, 0, width, height);
  context.globalCompositeOperation = "source-over";
}
