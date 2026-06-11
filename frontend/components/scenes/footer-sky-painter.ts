// Hand-painted footer sky — the adaline.ai architecture. One palette and one
// set of scroll curves recolor the sky gradient AND the sunset cloud streaks
// continuously per scroll, so the clouds always catch the current sky light
// instead of washing out against an already-night gradient.
//
// Endpoint colors are sampled from the live adaline.ai footer scroll:
//   sunset top/mid/bottom measured ≈ (97,97,134) / (174,151,151) / (212,172,129)
//   night  top/mid/bottom measured ≈ (17,28,31) / near-black teal / (10,18,18)
// The sky endpoints below sit between the previous repo values and the
// measured screen samples (the screen numbers include cloud light and the
// top-fade overlay, so the raw gradient endpoints stay a touch deeper).

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

// Sky band: a true sunset (tint 0) melting into night (tint 1). The sunset
// endpoints sit on the measured "sunset onset" frame — the brightest sky the
// live scroll ever shows, i.e. adaline's effective sunset endpoint; the
// measured "full sunset" (97,97,134 / 174,151,151 / 212,172,129) is reached
// partway along the collapse. Night endpoints land on the dark-teal horizon
// adaline uses — the seam below the band must keep converging on the page
// base #050e11/#050d10.
export const SKY_TOP: [Rgb, Rgb] = [
  [116, 118, 152],
  [5, 13, 16],
];
export const SKY_MIDDLE: [Rgb, Rgb] = [
  [185, 164, 160],
  [15, 32, 36],
];
export const SKY_BOTTOM: [Rgb, Rgb] = [
  [216, 178, 132],
  [25, 50, 56],
];

// The horizon keeps the light longest: each lower stop's collapse starts
// later than the zenith's, which is what gives adaline's dusk its rose
// horizon under an already-violet top (measured: full-sunset mid drops only
// 11 RGB units while the top has already dropped 19). All three windows
// still converge at band ~0.68 (global ~0.93), so the whole sky has settled
// into night when the CTA arrives.
export const SKY_STOP_WINDOWS = [
  [0.4, 0.28],
  [0.42, 0.26],
  [0.44, 0.24],
] as const;

// Cloud tint rides lighter/warmer than the sky so the streak tops catch the
// last sunset light, then collapses into the same night base as the sky.
export const CLOUD_TOP: [Rgb, Rgb] = [
  [172, 138, 164],
  [12, 22, 30],
];
export const CLOUD_BOTTOM: [Rgb, Rgb] = [
  [248, 196, 142],
  [6, 14, 20],
];

// Scroll curves — band progress (0 = band top at viewport bottom, 1 = band
// bottom at 35% viewport) to tint/alpha. Quantized to 1/1000 so a repaint at
// the same scroll position is byte-identical regardless of scroll history.
function quantize(value: number) {
  return Math.round(clamp01(value) * 1000) / 1000;
}

// The sunset holds: the articles seam + top-fade occupy the band until
// ~0.40, so the collapse to night only starts once the full sky is on screen
// — the warm phase is actually seen instead of fading in while the gradient
// is already converging to night.
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

// The sky is fully opaque within the first 18% of the band.
export function skyAlpha(bandProgress: number) {
  return quantize(smoothStep(clamp01(bandProgress / 0.18)));
}

// Clouds catch the last light: the plate's dense alpha rows (0.45–0.75 of
// the plate) fill the viewport around band progress 0.5–0.7, so the cloud
// tint must still be warm there. The collapse lags the sky top's — the
// streaks stay lit against the darkening sky — and converges to the
// identical night base at the same ~0.68 point as the sky, right as the
// plate's own alpha runs out near the CTA.
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
 * Paint the cloud band: the current cloud tint masked by the adaline cloud
 * plate's alpha (destination-in), exactly like painting the streaks on the
 * sky canvas — the gradient spans the whole band so each streak picks up the
 * light for its own altitude.
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
