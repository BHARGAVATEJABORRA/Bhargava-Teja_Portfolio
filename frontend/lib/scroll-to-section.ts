const EXTRA_SCROLL_OFFSET = 16;

function getHeaderOffset(): number {
  const header = document.querySelector<HTMLElement>("[data-site-header='true']");

  if (!header) {
    return EXTRA_SCROLL_OFFSET;
  }

  return header.getBoundingClientRect().height + EXTRA_SCROLL_OFFSET;
}

export function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targetTop = section.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: reducedMotion ? "auto" : "smooth",
  });

  window.history.replaceState(null, "", `#${sectionId}`);
}
