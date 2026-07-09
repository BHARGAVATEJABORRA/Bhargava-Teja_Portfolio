import { getActiveLenis } from "@/lib/smooth-scroll-instance";

/**
 * Subscribe a paint callback to the page's single scroll clock. Lenis is the
 * canonical driver (it eases the native scroll position itself); the native
 * scroll + resize listeners cover reduced motion, the test harness, and the
 * window before the Lenis provider has mounted. Callbacks must be pure
 * functions of the current scroll position, so a double fire in one frame is
 * a no-op.
 */
export function subscribeToScroll(callback: () => void): () => void {
  let disposed = false;
  let detachLenis: (() => void) | null = null;

  const attachLenis = (attempt: number) => {
    if (disposed) {
      return;
    }

    const lenis = getActiveLenis();
    if (lenis) {
      detachLenis = lenis.on("scroll", callback);
    } else if (attempt < 8) {
      window.setTimeout(() => attachLenis(attempt + 1), 250);
    }
  };

  attachLenis(0);
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback);

  return () => {
    disposed = true;
    detachLenis?.();
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
  };
}
