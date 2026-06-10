# Changelog (§2.b.5) — one atomic commit per change

- `d31b65d` Safety snapshot: pre-session WIP committed so subsequent fixes are atomic.
- `3f39714` **Harness.** `frontend/tests/scroll/` Playwright suite + `npm run verify`
  (lint → build → harness, desktop 1440 + mobile 390). Measures post-stop drift,
  reversibility, 1:1 star tracking, meteor texture, aurora persistence, card
  stacking. Reproduced all four bugs with numbers before any fix.
- `2b8cc41` **§3.1 footer skid.** Removed the `useSpring` second clock in
  `AdalineFooterScene`; sky gradient, cloud tint, star opacity are now pure
  `useTransform`s of `scrollYProgress` (Lenis remains the single smoothing).
- `df7d410` **§3.2 meteor blob.** `footer-meteor.jpg` (JPEG → no alpha → attached
  box) replaced with a CSS linear-gradient trail fading fully to transparent +
  pseudo-element head glow in the same element; deleted the unused jpg.
- `597f267` **§3.3 aurora.** Painter extracted to `aurora-painter.ts`; new
  `AmbientAurora` mounts ONE fixed canvas at the app root (z-1, screen blend,
  top-fade mask) with one continuous rAF clock — IntersectionObserver gating and
  the footer-local canvas removed. Intensity = pure function of global scroll
  progress (0.08 hero → ~0.18 mid → 1.0 night CTA). Static frame under
  reduced motion.
- `0c7de86` **§4 articles deck.** Container-scoped `useScroll` drives per-card
  scale (1 → 0.92, smoothstep) + opacity (1 → 0.8) falloff as the next card pins
  over; removed the CSS `transform` transition (it was a lag clock);
  `prefers-reduced-motion` renders the plain stacked list.
- (no commit needed) **§5 AI dock** already met acceptance — verified by harness:
  hover spin via `ai-dock-spin` keyframes, click opens chat window, no overlap
  with footer CTA/nav, works at 390px, spin disabled under reduced motion.
