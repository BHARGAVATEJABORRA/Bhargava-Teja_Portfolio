/// <reference lib="webworker" />

import { advanceTidesWorld, createTidesWorld, drawTides, mulberry32, type TidesWorld } from "./tides-painter";
import { clamp01 } from "./footer-sky-painter";

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  dpr: number;
  progress: number;
  reduceMotion: boolean;
};
type UpdateMessage = { type: "update"; progress: number };
type ResizeMessage = { type: "resize"; width: number; height: number; dpr: number };
type VisibilityMessage = { type: "visibility"; hidden: boolean };
type WorkerMessage = InitMessage | UpdateMessage | ResizeMessage | VisibilityMessage | { type: "destroy" };

const SUNRISE_T = 0.14;
const DAY_SPAN = 0.82;
const FRAME_MS = 1000 / 60;

let canvas: OffscreenCanvas | null = null;
let context: OffscreenCanvasRenderingContext2D | null = null;
let world: TidesWorld | null = null;
let cssWidth = 0;
let cssHeight = 0;
let dpr = 1;
let progress = 0;
let reduceMotion = false;
let hidden = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let last = performance.now();

function timeOfDayFor(nextProgress: number) {
  return SUNRISE_T + clamp01(nextProgress / DAY_SPAN) * (1 - SUNRISE_T);
}

function resize(nextWidth: number, nextHeight: number, nextDpr: number) {
  if (!canvas || !context) return;
  cssWidth = Math.max(1, nextWidth);
  cssHeight = Math.max(1, nextHeight);
  dpr = Math.min(Math.max(1, nextDpr), 2);
  const width = Math.round(cssWidth * dpr);
  const height = Math.round(cssHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function paint(now: number, advance: boolean) {
  if (!context || !world) return;
  if (advance) {
    const elapsed = Math.min(now - last, 64);
    advanceTidesWorld(world, elapsed / FRAME_MS, Math.random);
  }
  last = now;
  drawTides(
    context,
    cssWidth,
    cssHeight,
    world,
    {
      timeOfDay: timeOfDayFor(progress),
      time: now / 1000,
      sunDrift: reduceMotion ? 0.5 : 0.5 + Math.sin(now * 0.00003) * 0.5,
    },
    reduceMotion ? mulberry32(0x51de5) : Math.random,
  );
}

function stop() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
}

function loop() {
  if (hidden || reduceMotion) return;
  paint(performance.now(), true);
  timer = setTimeout(loop, FRAME_MS);
}

function start() {
  if (hidden || reduceMotion || timer !== null) return;
  last = performance.now();
  timer = setTimeout(loop, FRAME_MS);
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === "init") {
    canvas = message.canvas;
    context = canvas.getContext("2d", { alpha: false });
    progress = message.progress;
    reduceMotion = message.reduceMotion;
    world = createTidesWorld(reduceMotion ? mulberry32(0x7d1e5) : Math.random);
    resize(message.width, message.height, message.dpr);
    paint(performance.now(), false);
    start();
    self.postMessage({ type: "ready" });
    return;
  }
  if (message.type === "destroy") {
    stop();
    self.close();
    return;
  }
  if (message.type === "update") {
    progress = message.progress;
    if (reduceMotion) paint(performance.now(), false);
    return;
  }
  if (message.type === "resize") {
    resize(message.width, message.height, message.dpr);
    paint(performance.now(), false);
    return;
  }
  hidden = message.hidden;
  if (hidden) stop();
  else start();
};
