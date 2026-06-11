# Direction for footer scene + articles transition

## Core problems (fix these, you decide how)

### 1. Aurora fires too early — visible during sunset, should not exist there

In `ambient-aurora.tsx`, the aurora is visible at ~18% intensity even during the
warm sunset phase (global progress ~0.70–0.82). It should be **zero during sunset,
only appearing once night has settled** (progress > ~0.87).

Direction: rewrite `intensityFor` so the base is 0 at sunset and the swell only
fires during the night section (last ~10–12% of global scroll). Something like:
- `intensity = nightAmbient + ctaSwell` where both terms are 0 before progress 0.85
- Peak total intensity ≤ 0.25 at the CTA, ≤ 0.05 at the dock

Also: ALL `AURORA_CURTAINS` alphas in `aurora-painter.ts` are still too high
(0.20–0.34). Halve them again. The aurora should read as atmospheric background
shimmer, not bright columns.

### 2. Articles section ends with a hard page cut — needs cloud dissolve into the footer sky

The `BlogsSection` (`blogs-section.tsx`) ends abruptly and the dark footer background
pops in. It should feel like the article cards are "rising up into clouds" that
dissolve into the dark night sky.

Direction: at the **bottom of `blogs-section.tsx`** (or as a sibling positioned
absolutely over the section bottom), add an overlay that:
- Uses `frontend/public/adaline-scenes/footer/footer-clouds.png` as a CSS mask
  (`mask-image: url(...)`, `mask-size: cover`, `mask-position: center bottom`)
- Has a gradient background from `transparent` (top) to the page's dark base
  (`#050e11`) at the bottom
- Sits `z-10` so it overlaps both the last article card and the section boundary
- Height ~40–60vh, `pointer-events-none`

This creates the illusion that the article cards disappear into clouds, with the
night sky and stars already glowing behind them.

### 3. Cloud band is barely visible during sunset

In `adaline-scenes.tsx` the cloud `<motion.div>` needs higher base opacity. The
cloud mask (`footer-clouds.png`) is 2000×4000 — it only shows during the sunset/
dusk phase and it's currently too faint. Add `opacity-[0.85]` to that div and
verify it reads as warm dusky clouds at progress 0.2–0.5.

---

## What NOT to touch
- `footer-dock-three.tsx` — the dock/lamp scene is working well
- `smooth-scroll-provider.tsx` — Lenis integration is correct
- Sky gradient colour values — those are now correct (measured from Adaline live)
- Playwright test assertions

After changes: run `npm run verify`, then capture and show wheel-driven screenshots
at the 5 scroll stages so we can compare visually.
