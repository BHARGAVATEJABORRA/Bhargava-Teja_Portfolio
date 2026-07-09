"use client";

// Site-wide static "chromium glass" backdrop. One fixed layer behind all
// content: an iridescent gradient mesh (cool blue → violet → cyan) over the
// dark base, a faint frosted blur, and a thin grid for depth. No canvas, no
// rAF — purely CSS, so it's calm and cheap.
export function GlassBackground() {
  return (
    <div aria-hidden className="glass-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Iridescent blobs */}
      <span className="glass-bg__blob glass-bg__blob--a" />
      <span className="glass-bg__blob glass-bg__blob--b" />
      <span className="glass-bg__blob glass-bg__blob--c" />
      {/* Chrome sheen sweep */}
      <span className="glass-bg__sheen" />
      {/* Fine grid for subtle structure */}
      <span className="glass-bg__grid" />
      {/* Frosted vignette to keep content readable */}
      <span className="glass-bg__veil" />
    </div>
  );
}
