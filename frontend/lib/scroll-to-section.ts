import { getActiveLenis } from "@/lib/smooth-scroll-instance";

const EXTRA_SCROLL_OFFSET = 16;
const SCROLL_DURATION = 0.7;
const SCROLL_DURATION_MS = SCROLL_DURATION * 1000;

let fallbackAnimationFrame: number | null = null;
let activeScrollToken = 0;

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

const easeOutExpo = (time: number) => Math.min(1, 1.001 - 2 ** (-10 * time));

function animateFallbackScroll(targetTop: number, immediate: boolean) {
  if (fallbackAnimationFrame !== null) {
    window.cancelAnimationFrame(fallbackAnimationFrame);
    fallbackAnimationFrame = null;
  }

  if (immediate) {
    window.scrollTo({ top: targetTop, behavior: "auto" });
    return;
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const startTime = Date.now();

  const step = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / SCROLL_DURATION_MS);
    const nextTop = startTop + distance * easeOutExpo(progress);

    window.scrollTo({ top: nextTop, behavior: "auto" });

    if (progress < 1) {
      fallbackAnimationFrame = window.requestAnimationFrame(step);
      return;
    }

    fallbackAnimationFrame = null;
  };

  fallbackAnimationFrame = window.requestAnimationFrame(step);
}

export function scrollToY(top: number, hash?: string) {
  const reducedMotion = prefersReducedMotion();
  const targetTop = Math.max(0, top);
  const lenis = getActiveLenis() ?? window.__portfolioLenis;

  if (lenis) {
    lenis.resize();
    lenis.scrollTo(targetTop, {
      duration: SCROLL_DURATION,
      immediate: reducedMotion,
    });
  } else {
    animateFallbackScroll(targetTop, reducedMotion);
  }

  if (hash) {
    window.history.replaceState(null, "", hash);
  }
}

export function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  const token = ++activeScrollToken;
  const getTargetTop = () => section.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  const targetTop = getTargetTop();

  scrollToY(targetTop, `#${sectionId}`);

  window.setTimeout(() => {
    if (token !== activeScrollToken || !document.contains(section)) {
      return;
    }

    const correctedTop = Math.max(0, getTargetTop());

    if (Math.abs(correctedTop - window.scrollY) > 2) {
      window.scrollTo({ top: correctedTop, behavior: "auto" });
    }
  }, SCROLL_DURATION_MS + 80);
}
