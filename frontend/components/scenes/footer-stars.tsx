'use client';

import { useMemo } from 'react';

// Static starfield for the footer CTA sky. The scroll-driven PNG starfield
// (`data-scroll-scene="stars"`) lives in the tall sky-band ABOVE the CTA band,
// so by the time the contact form is in view that field has scrolled off the
// top and the CTA sky is bare. This fills that CTA sky with a fixed scatter of
// CSS star dots — useMemo so they never re-randomize on re-render — mounted as
// the first child of the CTA band, below the aurora and contact card in
// z-index. Pure divs, no canvas/WebGL.
//
// The scatter comes from a seeded PRNG (mulberry32) rather than Math.random(),
// so it stays pure and stable across renders (the lint rules forbid impure
// calls during render anyway) — same random-looking spread, no reshuffling.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FooterStars() {
  const stars = useMemo(() => {
    const rand = mulberry32(0x9e3779b9);
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      top: `${rand() * 85}%`,
      left: `${rand() * 100}%`,
      size: rand() > 0.85 ? 2 : 1,
      opacity: 0.4 + rand() * 0.5,
    }));
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
