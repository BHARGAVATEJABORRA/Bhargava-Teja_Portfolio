'use client';

import type { CSSProperties } from 'react';

import { Aurora } from '@/components/reactbits/aurora';

// Footer aurora layer. Wraps the aurora shader (see reactbits/aurora.tsx) in a
// tall, top-masked box so the northern-lights wash fills the sky as a faint
// field instead of a bright slab.
//
// Placement rules that are easy to get wrong:
//   - Keep the canvas tall. Moving the aurora down by shrinking the wrapper
//     steepens the gradients and turns the soft wash into a hard-edged slab;
//     position it with the mask, not the height.
//   - Dim it with the layer opacity/saturation below, never with shader edits.
//   - Camera aspect is canvas-derived, which is safe at these tall heights.
//
// Stacking: zIndex 1 sits below the contact card (z-20); the hills band (z-2)
// covers the canvas bottom overflow; the top 40% mask fade hides the part that
// pokes up into the sunset zone.
const auroraMask: CSSProperties = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
};

// Faintness knobs: opacity scales the screen-blend output, saturate pulls the
// cyan toward a deeper green. Tune these for more/less light, not the height.
const auroraTone: CSSProperties = {
  opacity: 0.7,
  filter: 'saturate(0.85)',
};

export function FooterAurora() {
  return (
    <div
      aria-hidden="true"
      data-ambient-aurora
      className="pointer-events-none absolute inset-x-0 bottom-[174px] h-[min(1570px,120vw)]"
      style={{ zIndex: 1, ...auroraMask }}
    >
      <Aurora className="w-full absolute inset-0" style={auroraTone} />
    </div>
  );
}
