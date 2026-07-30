"use client";

/**
 * The application's only high-frequency scroll clock.
 *
 * The native scroll event is deliberately tiny: it only schedules one frame.
 * That frame snapshots all shared geometry before notifying readers, then runs
 * style/paint writers. Components must subscribe instead of attaching their
 * own scroll listeners, which keeps scroll work bounded as the page grows.
 */
export type ScrollSnapshot = {
  y: number;
  maxY: number;
  width: number;
  height: number;
  documentHeight: number;
  timestamp: number;
};

type Subscriber = (snapshot: ScrollSnapshot) => void;

const readSubscribers = new Set<Subscriber>();
const writeSubscribers = new Set<Subscriber>();

let consumers = 0;
let frame = 0;
let resizeObserver: ResizeObserver | null = null;
let currentSnapshot: ScrollSnapshot = {
  y: 0,
  maxY: 0,
  width: 0,
  height: 0,
  documentHeight: 0,
  timestamp: 0,
};

function readSnapshot(timestamp: number): ScrollSnapshot {
  const root = document.documentElement;
  const height = window.innerHeight;
  const documentHeight = Math.max(root.scrollHeight, document.body?.scrollHeight ?? 0);
  return {
    y: window.scrollY,
    maxY: Math.max(0, documentHeight - height),
    width: window.innerWidth,
    height,
    documentHeight,
    timestamp,
  };
}

function flush(timestamp: number) {
  frame = 0;
  if (consumers === 0) return;

  // Read every shared layout value once, then allow measurement subscribers to
  // cache their own geometry before any subscriber applies style mutations.
  currentSnapshot = readSnapshot(timestamp);
  for (const subscriber of readSubscribers) subscriber(currentSnapshot);
  for (const subscriber of writeSubscribers) subscriber(currentSnapshot);
}

/** Request a coalesced geometry/paint pass after a layout-changing event. */
export function requestScrollRuntimeUpdate() {
  if (typeof window === "undefined" || consumers === 0 || frame !== 0) return;
  frame = window.requestAnimationFrame(flush);
}

/** Start the singleton runtime. Multiple providers are reference-counted. */
export function startScrollRuntime(): () => void {
  if (typeof window === "undefined") return () => {};

  consumers += 1;
  if (consumers === 1) {
    window.addEventListener("scroll", requestScrollRuntimeUpdate, { passive: true });
    window.addEventListener("resize", requestScrollRuntimeUpdate, { passive: true });
    window.addEventListener("orientationchange", requestScrollRuntimeUpdate, { passive: true });

    // Font/image/content changes alter sticky and scroll-track geometry without
    // necessarily producing a window resize. ResizeObserver work is still
    // coalesced through the same frame as scroll work.
    resizeObserver = new ResizeObserver(requestScrollRuntimeUpdate);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);
  }

  requestScrollRuntimeUpdate();

  return () => {
    consumers = Math.max(0, consumers - 1);
    if (consumers !== 0 || typeof window === "undefined") return;

    window.removeEventListener("scroll", requestScrollRuntimeUpdate);
    window.removeEventListener("resize", requestScrollRuntimeUpdate);
    window.removeEventListener("orientationchange", requestScrollRuntimeUpdate);
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** Subscribe to the layout-read phase of the shared scroll frame. */
export function subscribeToScrollRead(subscriber: Subscriber): () => void {
  readSubscribers.add(subscriber);
  requestScrollRuntimeUpdate();
  return () => readSubscribers.delete(subscriber);
}

/** Subscribe to the post-measurement style/paint phase of the shared frame. */
export function subscribeToScrollWrite(subscriber: Subscriber): () => void {
  writeSubscribers.add(subscriber);
  requestScrollRuntimeUpdate();
  return () => writeSubscribers.delete(subscriber);
}

export function getScrollSnapshot() {
  return currentSnapshot;
}
