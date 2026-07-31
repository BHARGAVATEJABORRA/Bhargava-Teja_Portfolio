const EXTRA_SCROLL_OFFSET = 16;
const SETTLE_DELAYS = [220, 700, 1_400, 2_800] as const;
const SETTLE_WINDOW_MS = 5_000;
let activeScrollToken = 0;
let cancelActiveScroll = () => {};

function getHeaderOffset(): number {
  const header = document.querySelector<HTMLElement>("[data-site-header='true']");

  if (!header) {
    return EXTRA_SCROLL_OFFSET;
  }

  const headerBottom = header.getBoundingClientRect().bottom;

  if (!Number.isFinite(headerBottom) || headerBottom < 24) {
    return header.getBoundingClientRect().height + EXTRA_SCROLL_OFFSET;
  }

  return Math.round(headerBottom) + EXTRA_SCROLL_OFFSET;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToY(top: number, hash?: string) {
  const reducedMotion = prefersReducedMotion();
  const targetTop = Math.max(0, top);
  window.scrollTo({ top: targetTop, behavior: reducedMotion ? "auto" : "smooth" });

  if (hash) {
    window.history.replaceState(null, "", hash);
  }
}

export function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  cancelActiveScroll();
  const token = ++activeScrollToken;
  const getTargetTop = () => section.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  let stopped = false;
  let layoutFrame = 0;
  const timers: number[] = [];
  let observer: ResizeObserver | null = null;

  function stopSettling() {
    if (stopped) return;
    stopped = true;
    if (layoutFrame) window.cancelAnimationFrame(layoutFrame);
    layoutFrame = 0;
    observer?.disconnect();
    observer = null;
    timers.forEach((timer) => window.clearTimeout(timer));
    window.removeEventListener("wheel", cancelForUserIntent);
    window.removeEventListener("touchstart", cancelForUserIntent);
    window.removeEventListener("keydown", cancelForUserIntent);
    if (cancelActiveScroll === stopSettling) cancelActiveScroll = () => {};
  }

  const correctPosition = () => {
    if (stopped || token !== activeScrollToken || !document.contains(section)) {
      stopSettling();
      return;
    }

    const correctedTop = Math.max(0, getTargetTop());
    if (Math.abs(correctedTop - window.scrollY) > 2) {
      window.scrollTo({ top: correctedTop, behavior: "auto" });
    }
  };

  function cancelForUserIntent() {
    stopSettling();
  }

  // A deliberate wheel, touch, or key action always releases control back to
  // the visitor immediately.
  cancelActiveScroll = stopSettling;

  const targetTop = getTargetTop();

  scrollToY(targetTop, `#${sectionId}`);

  // Deferred sections can grow above the target after the greeting closes.
  // Observe real layout changes instead of relying on one arbitrary timeout;
  // the scheduled passes cover browsers that coalesce those notifications.
  observer = new ResizeObserver(() => {
    if (layoutFrame || stopped) return;
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0;
      correctPosition();
    });
  });
  observer.observe(document.documentElement);
  SETTLE_DELAYS.forEach((delay) => timers.push(window.setTimeout(correctPosition, delay)));
  timers.push(window.setTimeout(stopSettling, SETTLE_WINDOW_MS));

  window.addEventListener("wheel", cancelForUserIntent, { passive: true });
  window.addEventListener("touchstart", cancelForUserIntent, { passive: true });
  window.addEventListener("keydown", cancelForUserIntent);
}
