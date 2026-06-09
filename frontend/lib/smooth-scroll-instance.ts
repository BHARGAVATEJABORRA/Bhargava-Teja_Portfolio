import type Lenis from "lenis";

let activeLenis: Lenis | null = null;

declare global {
  interface Window {
    __portfolioLenis?: Lenis | null;
  }
}

export function setActiveLenis(lenis: Lenis | null) {
  activeLenis = lenis;

  if (typeof window !== "undefined") {
    window.__portfolioLenis = lenis;
  }
}

export function getActiveLenis() {
  return activeLenis;
}
