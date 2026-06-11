// Shared aurora painter — soft vertical "northern-light" curtains in the
// green→teal band (matching the adaline.ai footer). Each curtain is built from
// a few bell-feathered vertical strips drawn with "screen" blending; the
// softness comes from the CSS blur on the canvas element, so we deliberately do
// NO per-frame canvas blur filter — that was the expensive part that stuttered
// the scroll into the footer.
// Alphas are kept deliberately quiet (central curtain capped at 0.17, the rest
// at half their old values) so the aurora reads as atmospheric background
// shimmer behind the contact form, never as bright columns in front of text.
const AURORA_CURTAINS = [
  { x: 0.12, half: 0.16, hue: 144, alpha: 0.1, phase: 0.1, speed: 0.12, height: 0.86 },
  { x: 0.27, half: 0.13, hue: 150, alpha: 0.15, phase: 1.1, speed: 0.17, height: 0.98 },
  { x: 0.44, half: 0.2, hue: 156, alpha: 0.17, phase: 2.4, speed: 0.11, height: 1.08 },
  { x: 0.62, half: 0.15, hue: 162, alpha: 0.155, phase: 3.3, speed: 0.15, height: 0.94 },
  { x: 0.81, half: 0.17, hue: 168, alpha: 0.12, phase: 4.8, speed: 0.13, height: 0.9 },
] as const;

type AuroraCurtain = (typeof AURORA_CURTAINS)[number];

function drawAuroraCurtain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  curtain: AuroraCurtain,
  time: number,
  alphaScale: number,
) {
  const center = width * curtain.x + Math.sin(time * curtain.speed + curtain.phase) * width * 0.035;
  const half = width * curtain.half;
  const topY = -height * 0.08;
  const botY = height * curtain.height;
  const flicker = 0.86 + 0.14 * Math.sin(time * 0.55 + curtain.phase * 1.7);
  const peak = curtain.alpha * alphaScale * flicker;
  const strips = 17;

  for (let s = 0; s < strips; s += 1) {
    const f = s / (strips - 1);
    const edge = 1 - Math.abs(f - 0.5) * 2;
    const stripAlpha = peak * (0.18 + edge * edge * 0.82);
    if (stripAlpha < 0.004) {
      continue;
    }

    const sweep = Math.sin(time * curtain.speed * 1.8 + f * 5.8 + curtain.phase) * width * 0.018;
    const stripX = center + (f - 0.5) * 2 * half + sweep;
    const stripWidth = Math.max(10, half * (0.22 + edge * 0.2));
    const gradient = context.createLinearGradient(0, topY, 0, botY);

    gradient.addColorStop(0, `hsla(${curtain.hue - 3}, 96%, 82%, ${stripAlpha * 0.78})`);
    gradient.addColorStop(0.16, `hsla(${curtain.hue + 4}, 95%, 67%, ${stripAlpha})`);
    gradient.addColorStop(0.42, `hsla(${curtain.hue + 12}, 92%, 54%, ${stripAlpha * 0.46})`);
    gradient.addColorStop(0.7, `hsla(${curtain.hue + 22}, 88%, 45%, ${stripAlpha * 0.12})`);
    gradient.addColorStop(1, `hsla(${curtain.hue + 22}, 80%, 44%, 0)`);

    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(stripX - stripWidth / 2, topY);
    context.bezierCurveTo(
      stripX - stripWidth * 0.95 + Math.sin(time * 0.25 + f * 4) * width * 0.018,
      height * 0.24,
      stripX + stripWidth * 0.55 + Math.cos(time * 0.2 + f * 5) * width * 0.018,
      height * 0.58,
      stripX - stripWidth * 0.15,
      botY,
    );
    context.lineTo(stripX + stripWidth / 2, botY);
    context.bezierCurveTo(
      stripX + stripWidth * 1.05 + Math.cos(time * 0.24 + f * 3) * width * 0.016,
      height * 0.56,
      stripX - stripWidth * 0.38 + Math.sin(time * 0.2 + f * 6) * width * 0.014,
      height * 0.26,
      stripX + stripWidth / 2,
      topY,
    );
    context.closePath();
    context.fill();
  }
}

export function drawAurora(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  alphaScale: number,
) {
  context.clearRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.5, height * 0.18, 0, width * 0.5, height * 0.2, width * 0.56);
  glow.addColorStop(0, `rgba(117, 255, 188, ${0.2 * alphaScale})`);
  glow.addColorStop(0.36, `rgba(70, 233, 192, ${0.11 * alphaScale})`);
  glow.addColorStop(0.72, `rgba(31, 157, 151, ${0.035 * alphaScale})`);
  glow.addColorStop(1, "rgba(31, 157, 151, 0)");

  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = glow;
  context.fillRect(0, -height * 0.12, width, height * 0.92);
  context.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  for (const curtain of AURORA_CURTAINS) {
    drawAuroraCurtain(context, width, height, curtain, time, alphaScale);
  }
  context.restore();
}
