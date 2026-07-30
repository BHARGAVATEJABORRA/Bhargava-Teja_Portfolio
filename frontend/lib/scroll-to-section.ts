const EXTRA_SCROLL_OFFSET = 16;
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
  }, 850);
}
