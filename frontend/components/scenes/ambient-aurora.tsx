'use client';

import type { CSSProperties } from 'react';

import { Aurora } from '@/components/reactbits/aurora';

// Footer aurora — adaline.ai's EXACT footer aurora shader (see components/
// reactbits/aurora.tsx: a 1:1 port of their production bundle — a Three.js
// noise-displaced plane viewed edge-on), mounted like their footer DOM:
//
//   <div class="absolute h-[…] w-full"
//        style="mask-image: linear-gradient(to bottom, transparent 0%, black 40%)">
//     <div class="w-full absolute inset-0"><canvas mix-blend-screen blur-[6px]/></div>
//   </div>
//
// LOOK CONTRACT (2026-07-08, from Tony's side-by-side vs adaline.ai — "all
// over the frame with less light shade, feels like real Aurora"):
//   • TALL canvas (~1570px like adaline's) — real northern lights fill the
//     sky as a faint field. Do NOT shrink the wrapper to move the aurora
//     down: squeezing the render steepens every gradient and turns the soft
//     wash into a bright hard-edged slab (that's what the 1280→690px "bring
//     it down" series did). Vertical placement is tuned with the MASK, not
//     the height.
//   • DIM it with opacity/saturation on the layer, never by shader edits —
//     adaline reads darker because the wash is faint enough for stars to
//     show through.
//   • Camera aspect is canvas-derived (adaline behaviour) — safe at tall
//     heights; only short/wide canvases push the bright zone to one side.
//
// Containment:
//   • zIndex 1 → below the contact card (z-20).
//   • Hills band (z-[2], opaque base) covers the canvas bottom overflow.
//   • Top 40% mask fade dissolves the upper canvas so the part poking into
//     the sky-band overlap (sunset zone) stays invisible.
const auroraMask: CSSProperties = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
};

// Faintness: screen-blend output scales with opacity; saturate pulls the
// cyan toward adaline's deeper green. Tune THESE for "less/more light",
// never the wrapper height.
const auroraTone: CSSProperties = {
  opacity: 0.7,
  filter: 'saturate(0.85)',
};

export function FooterAurora() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-[174px] h-[min(1570px,120vw)]"
      style={{ zIndex: 1, ...auroraMask }}
    >
      <Aurora className="w-full absolute inset-0" style={auroraTone} />
    </div>
  );
}
