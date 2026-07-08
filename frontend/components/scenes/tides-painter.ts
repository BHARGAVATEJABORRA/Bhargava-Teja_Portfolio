// TIDES — cinematic canvas ocean, ported from the "TIDES - A Cinematic Canvas
// Ocean" pen (codepen.io/Chathura-Jayasanka/pen/emBMYWJ) and re-keyed to this
// site's footer sunset sequence. The pen's slider-driven `timeOfDay` becomes a
// pure function of scroll (see tides-section.tsx); this module only paints.
//
// Palette contract with the footer (footer-sky-painter.ts):
//   t = 0   MOONLIT — sky sits on the footer's *night* endpoints
//             (SKY_TOP[1] 5,13,16 … SKY_BOTTOM[1] 25,50,56), i.e. the dark the
//             page base already shows, so the section rises out of the Blogs
//             seam without a cut.
//   t = 1   SUNSET — sky lands on the footer's *sunset onset* endpoints
//             (SKY_TOP[0] 116,118,152 zenith, SKY_BOTTOM[0] 216,178,132
//             horizon), which is exactly the gradient the footer's fixed sky
//             fades in with — the handoff is a same-color crossfade.
// Between the two, the pen's own day keys (DAWN → GOLDEN HOUR) are kept.

import { clamp01 } from "@/components/scenes/footer-sky-painter";

export type Rgb3 = readonly [number, number, number];

export interface TidesKey {
  /** position of this key on the 0–1 scrub timeline */
  t: number;
  name: string;
  /** mood-clock anchor, fractional hours (20.5 = 20:30) */
  hour: number;
  skyTop: Rgb3;
  skyHor: Rgb3;
  sun: Rgb3;
  glow: Rgb3;
  wFar: Rgb3;
  wNear: Rgb3;
  foam: Rgb3;
  /** sun/moon height above the horizon, 0 = on it, 1 = high */
  sunH: number;
  /** glitter-path intensity */
  glit: number;
  /** starfield visibility */
  star: number;
}

export const TIDES_KEYS: readonly TidesKey[] = [
  {
    t: 0,
    name: "MOONLIT",
    hour: 4.5,
    skyTop: [5, 13, 16],
    skyHor: [18, 38, 44],
    sun: [228, 234, 255],
    glow: [140, 164, 216],
    wFar: [25, 50, 56],
    wNear: [4, 11, 14],
    foam: [196, 208, 234],
    sunH: 0.5,
    glit: 0.35,
    star: 1,
  },
  {
    // Premium "midnight sapphire & gold" landing mood: deep sapphire/indigo sky
    // over a royal-gold horizon with a champagne sun. The day still brightens to
    // MORNING/MIDDAY as you scroll — only the greeting endpoint is re-tinted.
    t: 0.14,
    name: "SUNRISE",
    hour: 6.1,
    skyTop: [16, 26, 68],
    skyHor: [231, 180, 80],
    sun: [255, 233, 176],
    glow: [255, 198, 128],
    wFar: [150, 130, 120],
    wNear: [16, 26, 60],
    foam: [244, 236, 255],
    sunH: 0.06,
    glit: 0.82,
    star: 0.35,
  },
  {
    t: 0.38,
    name: "MORNING",
    hour: 9.5,
    skyTop: [64, 134, 206],
    skyHor: [188, 222, 236],
    sun: [255, 255, 246],
    glow: [255, 250, 224],
    wFar: [120, 186, 196],
    wNear: [20, 92, 114],
    foam: [255, 255, 255],
    sunH: 0.55,
    glit: 0.5,
    star: 0,
  },
  {
    t: 0.56,
    name: "MIDDAY",
    hour: 13,
    skyTop: [58, 142, 214],
    skyHor: [176, 216, 230],
    sun: [255, 255, 248],
    glow: [255, 252, 232],
    wFar: [96, 178, 188],
    wNear: [16, 96, 120],
    foam: [255, 255, 255],
    sunH: 0.92,
    glit: 0.45,
    star: 0,
  },
  {
    t: 0.76,
    name: "GOLDEN HOUR",
    hour: 18.2,
    skyTop: [74, 92, 156],
    skyHor: [255, 202, 120],
    sun: [255, 236, 194],
    glow: [255, 168, 92],
    wFar: [206, 164, 118],
    wNear: [34, 78, 98],
    foam: [255, 244, 228],
    sunH: 0.3,
    glit: 0.95,
    star: 0,
  },
  {
    t: 1,
    name: "SUNSET",
    hour: 20.5,
    skyTop: [116, 118, 152],
    skyHor: [216, 178, 132],
    sun: [255, 206, 148],
    glow: [255, 104, 64],
    wFar: [196, 118, 92],
    wNear: [30, 42, 72],
    foam: [255, 222, 200],
    sunH: 0.06,
    glit: 1,
    star: 0.15,
  },
] as const;

export interface TidesPalette {
  name: string;
  hour: number;
  skyTop: Rgb3;
  skyHor: Rgb3;
  sun: Rgb3;
  glow: Rgb3;
  wFar: Rgb3;
  wNear: Rgb3;
  foam: Rgb3;
  sunH: number;
  glit: number;
  star: number;
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function lerpRgb(from: Rgb3, to: Rgb3, t: number): Rgb3 {
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
}

function rgb(color: Rgb3, alpha = 1) {
  return `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;
}

export function getTidesPalette(timeOfDay: number): TidesPalette {
  const t = clamp01(timeOfDay);
  let index = 0;
  while (index < TIDES_KEYS.length - 1 && t > TIDES_KEYS[index + 1].t) {
    index += 1;
  }
  const a = TIDES_KEYS[index];
  const b = TIDES_KEYS[Math.min(index + 1, TIDES_KEYS.length - 1)];
  const span = b.t - a.t || 1;
  const k = clamp01((t - a.t) / span);

  return {
    name: k < 0.5 ? a.name : b.name,
    hour: lerp(a.hour, b.hour, k),
    skyTop: lerpRgb(a.skyTop, b.skyTop, k),
    skyHor: lerpRgb(a.skyHor, b.skyHor, k),
    sun: lerpRgb(a.sun, b.sun, k),
    glow: lerpRgb(a.glow, b.glow, k),
    wFar: lerpRgb(a.wFar, b.wFar, k),
    wNear: lerpRgb(a.wNear, b.wNear, k),
    foam: lerpRgb(a.foam, b.foam, k),
    sunH: lerp(a.sunH, b.sunH, k),
    glit: lerp(a.glit, b.glit, k),
    star: lerp(a.star, b.star, k),
  };
}

export function formatMoodClock(hour: number) {
  const hh = Math.floor(hour) % 24;
  const mm = Math.floor((hour % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// --- Drifting set dressing (stars / clouds / birds) -------------------------
// Positions live outside the painter so they persist across frames; the pen
// advanced them by fixed per-frame steps at ~60fps, so `advance` scales those
// steps by elapsed frames.

interface TidesStar {
  x: number;
  y: number;
  r: number;
  tw: number;
}

interface TidesCloud {
  x: number;
  y: number;
  w: number;
  speed: number;
}

interface TidesBird {
  x: number;
  y: number;
  speed: number;
  size: number;
  flap: number;
}

export interface TidesWorld {
  stars: TidesStar[];
  clouds: TidesCloud[];
  birds: TidesBird[];
}

export function createTidesWorld(random: () => number = Math.random): TidesWorld {
  return {
    stars: Array.from({ length: 140 }, () => ({
      x: random(),
      y: random() * 0.4,
      r: random() * 1.2 + 0.3,
      tw: random() * Math.PI * 2,
    })),
    clouds: Array.from({ length: 5 }, () => ({
      x: random(),
      y: 0.08 + random() * 0.18,
      w: 0.18 + random() * 0.22,
      speed: 0.000015 + random() * 0.00002,
    })),
    birds: Array.from({ length: 4 }, () => ({
      x: random(),
      y: 0.15 + random() * 0.18,
      speed: 0.00004 + random() * 0.00004,
      size: 8 + random() * 6,
      flap: random() * Math.PI * 2,
    })),
  };
}

export function advanceTidesWorld(world: TidesWorld, frames: number, random: () => number = Math.random) {
  for (const cloud of world.clouds) {
    cloud.x += cloud.speed * frames;
    if (cloud.x > 1.3) {
      cloud.x = -0.3;
    }
  }
  for (const bird of world.birds) {
    bird.x += bird.speed * frames;
    bird.flap += 0.15 * frames;
    if (bird.x > 1.2) {
      bird.x = -0.2;
      bird.y = 0.15 + random() * 0.18;
    }
  }
}

export interface TidesFrame {
  /** scrub position 0–1 (MOONLIT → SUNSET) */
  timeOfDay: number;
  /** wave clock, seconds */
  time: number;
  /** sun column drift, 0–1 viewport fraction (0.5 = centred) */
  sunDrift: number;
}

/**
 * Paint one full frame. `random` feeds the foam flecks and the glitter path —
 * pass a seeded generator when frames must be reproducible (reduced motion);
 * the live loop uses Math.random exactly like the pen.
 */
export function drawTides(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: TidesWorld,
  frame: TidesFrame,
  random: () => number = Math.random,
) {
  const palette = getTidesPalette(frame.timeOfDay);
  const time = frame.time;
  const horizonY = height * 0.42;
  const oceanH = height - horizonY;

  const sunX = width * (0.5 + (frame.sunDrift - 0.5) * 0.25);
  const sunY = horizonY - palette.sunH * horizonY * 0.82;

  // Sky
  const sky = context.createLinearGradient(0, 0, 0, horizonY + oceanH * 0.1);
  sky.addColorStop(0, rgb(palette.skyTop));
  sky.addColorStop(0.7, rgb(lerpRgb(palette.skyTop, palette.skyHor, 0.55)));
  sky.addColorStop(1, rgb(palette.skyHor));
  context.fillStyle = sky;
  context.fillRect(0, 0, width, horizonY + 2);

  // Stars
  if (palette.star > 0.01) {
    for (const star of world.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + star.tw);
      context.fillStyle = rgb([255, 255, 255], palette.star * twinkle * 0.9);
      context.beginPath();
      context.arc(star.x * width, star.y * horizonY, star.r, 0, Math.PI * 2);
      context.fill();
    }
  }

  // Sun glow
  const glowR = Math.min(width, height) * 0.5;
  const glow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
  glow.addColorStop(0, rgb(palette.glow, 0.55));
  glow.addColorStop(0.25, rgb(palette.glow, 0.22));
  glow.addColorStop(1, rgb(palette.glow, 0));
  context.fillStyle = glow;
  context.fillRect(0, 0, width, horizonY + oceanH * 0.4);

  // Sun / moon disc
  const sunR = Math.min(width, height) * 0.045;
  const disc = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  disc.addColorStop(0, rgb(palette.sun, 1));
  disc.addColorStop(0.7, rgb(palette.sun, 0.95));
  disc.addColorStop(1, rgb(palette.sun, 0.2));
  context.fillStyle = disc;
  context.beginPath();
  context.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  context.fill();

  // Clouds
  for (const cloud of world.clouds) {
    const cx = cloud.x * width;
    const cy = cloud.y * horizonY;
    const cw = cloud.w * width;
    context.fillStyle = rgb(lerpRgb(palette.skyHor, [255, 255, 255], 0.25), 0.16);
    for (let puff = 0; puff < 4; puff += 1) {
      context.beginPath();
      context.ellipse(cx + puff * cw * 0.22, cy + Math.sin(puff) * 6, cw * (0.3 - puff * 0.04), cw * 0.06, 0, 0, Math.PI * 2);
      context.fill();
    }
  }

  // Birds
  for (const bird of world.birds) {
    const bx = bird.x * width;
    const by = bird.y * horizonY;
    const wing = Math.sin(bird.flap) * bird.size * 0.5;
    context.strokeStyle = rgb(lerpRgb(palette.skyTop, [0, 0, 0], 0.3), 0.5);
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(bx - bird.size, by + wing);
    context.quadraticCurveTo(bx, by - bird.size * 0.3, bx, by);
    context.quadraticCurveTo(bx, by - bird.size * 0.3, bx + bird.size, by + wing);
    context.stroke();
  }

  // Atmospheric haze at the horizon
  const haze = context.createLinearGradient(0, horizonY - 40, 0, horizonY + 40);
  haze.addColorStop(0, rgb(palette.skyHor, 0));
  haze.addColorStop(0.5, rgb(palette.skyHor, 0.45));
  haze.addColorStop(1, rgb(palette.wFar, 0));
  context.fillStyle = haze;
  context.fillRect(0, horizonY - 40, width, 80);

  // Ocean swells, horizon → viewer
  const bands = 26;
  for (let i = 0; i < bands; i += 1) {
    const depth = i / (bands - 1);
    const yTop = horizonY + Math.pow(depth, 1.9) * oceanH;
    const amp = lerp(0.6, 30, depth);
    const wlen = lerp(46, 340, depth);
    const speed = lerp(0.25, 0.9, depth);
    const phase = time * speed + i * 0.9;
    const color = lerpRgb(palette.wFar, palette.wNear, depth);
    const waveY = (x: number) =>
      yTop + Math.sin(x / wlen + phase) * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;

    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(0, yTop + Math.sin(phase) * amp);
    for (let x = 0; x <= width; x += 6) {
      context.lineTo(x, waveY(x));
    }
    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = rgb(color);
    context.fill();

    // Crest highlight
    context.lineWidth = lerp(0.6, 2.2, depth);
    context.beginPath();
    let started = false;
    for (let x = 0; x <= width; x += 6) {
      const y = waveY(x);
      if (started) {
        context.lineTo(x, y);
      } else {
        context.moveTo(x, y);
        started = true;
      }
    }
    context.strokeStyle = rgb(lerpRgb(color, palette.sun, 0.55), lerp(0.05, 0.3, depth));
    context.stroke();

    // Foam flecks on the front swells
    if (depth > 0.62) {
      const foamAlpha = (depth - 0.62) / 0.38;
      for (let x = 0; x <= width; x += 9) {
        const crest = Math.sin(x / wlen + phase);
        if (crest > 0.55 && random() > 0.45) {
          context.fillStyle = rgb(palette.foam, foamAlpha * (0.18 + random() * 0.35));
          context.fillRect(x + (random() - 0.5) * 6, waveY(x) - random() * 3, 1.5 + random() * 3, 1.5 + random() * 2);
        }
      }
    }
  }

  // Glitter path under the sun
  const glitterCount = 220;
  for (let i = 0; i < glitterCount; i += 1) {
    const dy = random();
    const y = horizonY + Math.pow(dy, 1.5) * oceanH;
    const spread = lerp(6, width * 0.3, dy);
    const x = sunX + (random() - 0.5) * 2 * spread;
    const distFade = 1 - Math.min(1, Math.abs(x - sunX) / (spread + 1));
    const flick = 0.25 + random() * 0.75;
    const alpha = distFade * distFade * flick * palette.glit * (1 - dy * 0.25);
    if (alpha < 0.02) {
      continue;
    }
    context.fillStyle = rgb(palette.sun, alpha * 0.85);
    const len = 1 + random() * (2 + dy * 4);
    context.fillRect(x, y, len, 1 + dy);
  }

  // Vignette
  const vignette = context.createRadialGradient(width / 2, height * 0.55, height * 0.25, width / 2, height * 0.55, height * 0.9);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,8,0.34)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

/** Small deterministic PRNG so reduced-motion repaints are byte-identical. */
export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
