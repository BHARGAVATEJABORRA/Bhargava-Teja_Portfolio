# Full Footer Scene Overhaul — Exact Adaline.ai Match
## For Claude Code (Fable / max thinking mode) — take your time, verify every change

---

## Mission

Make the portfolio's footer scroll sequence — from the first hint of sunset through
the night dock — look **exactly** like www.adaline.ai aesthetically. Keep all the
user's own content (name, nav, contact form). The scroll animation (sunset→night
gradient, clouds, stars, shooting stars, aurora glow, hills, dock with amber lamps)
is intentional and wanted — Adaline's site uses static images but the user wants the
animated version to look like that same dark, minimal, breathtaking aesthetic.

**Before writing a single line of code**, do the following research steps in order:

### Step 0 — Live side-by-side audit (MANDATORY)

Open `https://www.adaline.ai` in Chrome using the browser MCP. Scroll slowly from the
top of the footer CTA section to the very bottom (dock). Take a screenshot at each
stage:
1. Footer CTA section just entering viewport (sky barely visible)
2. CTA section mid-scroll (sky gradient in sunset phase)
3. CTA section at night (stars visible)
4. Dock section entering
5. Dock section at full rest (final state)

Then screenshot the portfolio at the same scroll stages (use localhost:3000 or the dev
server). Put both side by side mentally — note EVERY visual difference.

### Step 1 — Read the reference folder

Read every image in `frontend/../../Adaline.ai Reference/` (path on disk is relative
to the project root: `../Adaline.ai Reference/`):
- `images/footer-clouds.png` — 2000×4000 cloud mask PNG
- `images/footer-stars.png` — star tile
- `static/image?url=...footer-hills...` — hills image
- `static/image?url=...footer-dock...` — dock image
- `static/image?url=...footer-dock-reflection...` — reflection image

Compare these with what's in `frontend/public/adaline-scenes/footer/`.

### Step 2 — Read existing test screenshots

Look at these test output images to understand the current portfolio state:
- `frontend/tests/scroll/__output__/aurora2-dusk.png` — sunset/dusk phase
- `frontend/tests/scroll/__output__/aurora2-end.png` — dock final state  
- `frontend/tests/scroll/__output__/footer-desktop-down-3.png` — aurora CTA phase
- `frontend/tests/scroll/__output__/footer-desktop-down-5.png` — hills + contact form
- `frontend/tests/scroll/__output__/footer-desktop-down-6.png` — dock final state

### Step 3 — Read these source files in full

- `frontend/components/scenes/adaline-scenes.tsx` (entire file)
- `frontend/components/scenes/ambient-aurora.tsx` (entire file)
- `frontend/components/scenes/aurora-painter.ts` (entire file)
- `frontend/components/scenes/footer-dock-three.tsx` (entire file)
- `frontend/app/globals.css` lines 1890–2003 (the footer CSS section)

---

## Known bugs already fixed (DO NOT re-introduce)

These changes were applied in a previous pass — verify they are still present before
touching anything:

1. **`footer-dock-three.tsx`** — `gl_FragColor` uses `tex.a * uOpacity` (not
   `max(tex.a, glowBleed) * uOpacity`). The alpha channel must NOT expand via
   `glowBleed`.

2. **`ambient-aurora.tsx`** — `intensityFor` fades the ctaSwell out before the dock:
   ```ts
   const ctaRaw = smoothStep((progress - 0.82) / 0.08);
   const dockFade = 1.0 - smoothStep((progress - 0.90) / 0.10);
   const ctaSwell = 0.42 * ctaRaw * dockFade;
   ```

If either of those is missing, restore it first, then continue.

---

## Issues to fix (apply all)

### Issue 1 — Sky gradient: sunset phase not warm/vivid enough

**File:** `frontend/components/scenes/adaline-scenes.tsx`

**Problem:** The `SKY_BOTTOM` sunset colour is `[196, 153, 121]` (warm peach) at the
start. But `skyOpacity` fades in over 0→0.32 of skyProgress AND the gradient is
already transitioning toward night at the same time — so the sunset orange/peach phase
is either invisible or very brief. Adaline's aesthetic shows a rich purple→mauve→peach
sunset that holds for a moment before twilight.

**Fix:**
- Make `skyOpacity` fully opaque much earlier:
  ```ts
  const skyOpacity = useTransform(skyProgress, (value) =>
    smoothStep(clamp01(value / 0.18))   // was 0.32 → fade in over first 18% only
  );
  ```
- Deepen the sunset colour palette to match Adaline more precisely:
  ```ts
  // Sunset (index 0) → Night (index 1). Sampled from Adaline.ai live screenshots.
  const SKY_TOP: ...    = [[48, 38, 82], [10, 20, 32]];      // deep violet → near-black
  const SKY_MIDDLE: ... = [[142, 96, 128], [8, 16, 26]];     // dusty rose → near-black
  const SKY_BOTTOM: ... = [[208, 140, 100], [5, 14, 17]];    // warm amber-peach → near-black
  ```
- Make the gradient transition slower — hold in sunset longer before snapping to night:
  ```ts
  // Use a power curve so sunset holds, then night drops fast
  const skyBackground = useTransform(skyProgress, (value) => {
    const p = Math.pow(smoothStep(value), 0.7);  // was smoothStep(value) — power <1 holds sunset longer
    return footerSkyGradient(p);
  });
  ```

### Issue 2 — Cloud band: barely visible; needs sunset-warm tint

**File:** `frontend/components/scenes/adaline-scenes.tsx`

The cloud mask uses `footer-clouds.png` (2000×4000 PNG, verified in reference folder).
The current `CLOUD_TOP` and `CLOUD_BOTTOM` sunset colours are `[120,112,140]` /
`[210,170,138]`. These look washed-out. Adjust to match the richer Adaline palette:

```ts
const CLOUD_TOP: ... = [[98, 82, 118], [12, 22, 30]];      // violet-grey → dark
const CLOUD_BOTTOM: ... = [[218, 158, 118], [6, 14, 20]];  // warm amber → dark
```

Also: the cloud gradient opacity should be slightly higher. Add `opacity-90` or
`opacity-[0.92]` to the cloud `<motion.div>` in the JSX.

### Issue 3 — Stars: too transparent at mid-scroll; fade in too late

**File:** `frontend/components/scenes/adaline-scenes.tsx`

`starsOpacity` is `smoothStep(clamp01((value - 0.18) / 0.5)) * 0.96`. Stars don't
reach full opacity until skyProgress ≈ 0.68. In Adaline's aesthetic the stars are
clearly visible mid-scroll during the twilight phase.

```ts
const starsOpacity = useTransform(skyProgress, (value) =>
  smoothStep(clamp01((value - 0.12) / 0.40)) * 0.96  // was 0.18 / 0.50 → earlier, faster
);
```

### Issue 4 — Shooting stars: count too low, opacity too subtle

**File:** `frontend/components/scenes/adaline-scenes.tsx`

Currently 3 shooting stars, max `opacity: 0.24`. The Adaline aesthetic shows soft but
clearly visible meteors against the night sky.

Add 2 more shooting stars to the `SHOOTING_STARS` array:
```ts
{ left: "31%", top: "8%", width: "9px", rotate: "57deg", duration: "15.2s", delay: "5.4s", x: "16vw", y: "22vh", opacity: 0.22 },
{ left: "77%", top: "3%", width: "8px", rotate: "59deg", duration: "10.8s", delay: "11.2s", x: "14vw", y: "20vh", opacity: 0.2 },
```
And lift the opacity on all existing stars from `0.18–0.24` to `0.28–0.36`.

### Issue 5 — AmbientAurora: still too visible over the contact form

**File:** `frontend/components/scenes/ambient-aurora.tsx`

Even with Issue 0's `ctaSwell * dockFade`, the aurora at `progress ≈ 0.88` (contact
form) still reads as overly teal. The aurora should be an ATMOSPHERIC BACKDROP, not
columns in front of text. Two changes:

**a) Reduce peak ctaSwell from 0.42 → 0.30:**
```ts
const ctaSwell = 0.30 * ctaRaw * dockFade;   // was 0.42
```

**b) In `aurora-painter.ts` — reduce the alpha of the most intense curtain strip:**
Curtain index 2 (`{ x: 0.44, half: 0.2, hue: 156, alpha: 0.52, ... }`) is the
dominant central column. Lower its `alpha` from `0.52` → `0.34`:
```ts
{ x: 0.44, half: 0.2, hue: 156, alpha: 0.34, phase: 2.4, speed: 0.11, height: 1.08 },
```
And all other curtain alphas: multiply by `0.72` (keeping proportions, just quieter overall).

The result: aurora reads as a whisper of green atmospheric light behind the contact
form, not the dominant visual element.

### Issue 6 — Aurora veil over contact form: too bright

**File:** `frontend/app/globals.css`, `.adaline-footer-aurora-veils` rule

Current: `opacity: 0.72`. This is additive on top of the AmbientAurora canvas.
Lower to: `opacity: 0.38`.

Also reduce the radial gradient's green alpha:
```css
.adaline-footer-aurora-veils {
  background:
    radial-gradient(42% 50% at 50% 10%, rgba(117, 255, 188, 0.07), transparent 66%),
    linear-gradient(180deg, rgba(117, 255, 188, 0.03), transparent 62%);
  mix-blend-mode: screen;
  opacity: 0.38;
  filter: blur(28px);
}
```

### Issue 7 — Dock scene: hills feel too far above the waterline

**File:** `frontend/components/scenes/adaline-scenes.tsx`

The hills img is at `-top-[16vw]` and the dock wrapper is at `top-[-4vw]`.
In Adaline's reference the hills sit right at the waterline — the dock's pier base
appears to touch the lake and the hills frame it from behind.

Adjust the hills position slightly:
```jsx
// Change -top-[16vw] to -top-[14vw] — brings hills slightly lower, closer to waterline
<div aria-hidden className="pointer-events-none absolute -top-[14vw] w-full">
```

And lift the dock wrapper 2vw closer:
```jsx
// Change top-[-4vw] to top-[-6vw]
className="pointer-events-none absolute left-1/2 top-[-6vw] w-[200vw] -translate-x-1/2"
```

### Issue 8 — Dock fade mask: foreground planks cut off too abruptly

**File:** `frontend/components/scenes/adaline-scenes.tsx`

The dock wrapper mask is `linear-gradient(to bottom, black 30%, transparent 100%)`.
This cuts the dock texture at 30% from the top (planks near the bottom of the visible
area get fully transparent). In Adaline's reference the dock planks fade smoothly
from the centre.

Change to a softer mask:
```jsx
style={{
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
  maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
}}
```

---

## Verification steps (run after ALL changes)

```bash
cd frontend && npm run verify
```

Then manually in browser (or via Playwright):

1. Scroll to where the footer first enters the viewport. The sky should show a **warm
   sunset gradient** — orange/amber at the bottom blending through dusty rose to deep
   violet at the top. This is visible and richly coloured, not just dark.

2. Continue scrolling. Stars should appear clearly by the time the sky is half-night.
   Shooting stars should fire occasionally — subtle, not every second.

3. At the **contact form section**: the background should be a deep dark night sky.
   The aurora appears as a soft, diffuse teal atmospheric glow BEHIND the form
   — you should be able to read the form comfortably. NO bright green columns.

4. At the **dock section** (page bottom): near-black scene. Hills as dark silhouettes.
   Dark lake/water. Wooden dock with **two soft warm amber lamp halos** lit.
   Reflection in the water. Footer nav clearly readable in white.
   Aurora = essentially zero (just the 0.08 ambient whisper).

5. Compare frame 6 in `frontend/tests/scroll/__output__/footer-desktop-down-6.png`
   against `aurora2-end.png` — the second should look noticeably closer to
   `Adaline.ai Reference/static/image?url=...footer-dock...`.

6. Run `npm run test -- --grep "footer"` and confirm all footer scroll tests pass.

---

## What NOT to change

- Do not touch `GLOW_PATH`, `LAMP_1`, `LAMP_2`, `WATER_Y` constants in
  `footer-dock-three.tsx`.
- Do not change the Lenis `autoRaf: false` GSAP integration in
  `smooth-scroll-provider.tsx` — it is correct.
- Do not touch `uTime` in the GSAP ticker callback — it is already in seconds.
- Do not modify the Playwright test assertion logic in any `.spec.ts` file.
- Do not change the contact form, footer nav links, or user content.
- Do not alter the `HERO_SEQUENCE_*` hero animation — only footer scene files.
- Take your time and think through each change carefully. A careful pass beats a fast
  one that introduces new regressions.
