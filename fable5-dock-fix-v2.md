# Fix Prompt — Footer Dock Night Scene v2 (Fable 5 / Claude Code)

## What you're fixing

The dock/night footer section on a Next.js portfolio looks like an aurora borealis
explosion instead of a quiet dark dock with two amber lamp halos. Two bugs introduced
by a previous agent are the culprits. Fix **both** — nothing else. Do not touch any
other files, tests, visual baselines, or styling.

**Target visual:** match `frontend/tests/scroll/__output__/adaline-live-footer-end.png`
— near-black scene, dark hills, dark water, wooden dock with two soft warm amber lamp
halos. No green aurora anywhere in the dock section.

---

## Bug 1 — CRITICAL: `glowBleed` bleeds warm amber into transparent sky (the "aurora" look)

**File:** `frontend/components/scenes/footer-dock-three.tsx`  
**Line:** 117 (the final `gl_FragColor` line inside the `FRAGMENT_SHADER` string)

**Current broken code:**
```glsl
gl_FragColor = vec4(col, max(tex.a, min(glowBleed, 1.0)) * uOpacity);
```

**Why it's broken:**  
`tex.a = 0` in the sky area (the top ~13% of the canvas, above the lamp posts at
UV y = 0.866). The `max(tex.a, glowBleed)` expansion makes the canvas **non-transparent
there when lamps are lit** — `exp(-segDist * 14.0)` at the lamp UV has a halo radius
that reaches UV y ~0.97–1.0 with value ≈ 0.15–0.25. So the canvas paints warm amber
rectangles in what should be fully transparent sky, which the CSS `mix-blend-mode:
screen` layers then blast over the entire footer as "aurora".

**Fix — one line change:**
```glsl
// BEFORE (line 117):
gl_FragColor = vec4(col, max(tex.a, min(glowBleed, 1.0)) * uOpacity);

// AFTER:
gl_FragColor = vec4(col, tex.a * uOpacity);
```

The `glowBleed` variable on **line 110** (`float glowBleed = max(lamp1, lamp2) * 0.6`)
and its use in the **color** channel on line 113
(`col += (lamp1 + lamp2) * lampWarm * 0.42 * max(onDock, glowBleed)`) are fine —
they add warm color at the soft dock edges and that's intentional. Only the **alpha
channel expansion** is the bug. Keep lines 110 and 113 exactly as-is.

---

## Bug 2 — CRITICAL: AmbientAurora `ctaSwell` reaches full intensity (0.82!) at the dock

**File:** `frontend/components/scenes/ambient-aurora.tsx`  
**Function:** `intensityFor` (lines 22–26)

**Current broken code:**
```typescript
function intensityFor(progress: number) {
  const ambient = 0.1 * smoothStep((progress - 0.1) / 0.5);
  const ctaSwell = 0.82 * smoothStep((progress - 0.84) / 0.13);
  return 0.08 + ambient + ctaSwell;
}
```

**Why it's broken:**  
The dock section is the **last** section (scroll progress ~0.90–1.0). With the current
formula, `ctaSwell` at progress = 1.0 equals `0.82 * smoothStep(0.16/0.13) = 0.82`.
Total intensity = `0.08 + 0.1 + 0.82 = 1.0` — **full-brightness aurora directly over
the dock.** The fixed canvas (`position: fixed, z-[1], mix-blend-mode: screen`) paints
five bright green curtains over the entire viewport. That's the aurora the user sees.

The aurora is meant for the **CTA section** that precedes the dock. It should swell
there and then **fade out** as the dark dock enters — matching the Adaline reference
which shows zero aurora over the dock.

**Fix — replace the entire `intensityFor` function:**
```typescript
function intensityFor(progress: number) {
  const ambient = 0.1 * smoothStep((progress - 0.1) / 0.5);
  // Aurora swells over the CTA contact section, then fades to near-zero
  // as the dark dock scene enters view. At progress = 1.0 only a whisper
  // of ambient remains, matching the dark night reference.
  const ctaRaw = smoothStep((progress - 0.82) / 0.08);        // rises 0.82 → 0.90
  const dockFade = 1.0 - smoothStep((progress - 0.90) / 0.10); // fades 0.90 → 1.00
  const ctaSwell = 0.42 * ctaRaw * dockFade;
  return 0.08 + ambient + ctaSwell;
}
```

Intensity curve:
- Progress 0.00: 0.08 (soft ambient whisper)  
- Progress 0.50: 0.18 (gentle mid-page ambient)  
- Progress 0.90: ~0.60 (aurora peak at CTA section)  
- Progress 1.00: ~0.18 (ambient only — dock is dark)  

---

## What NOT to change

- Do not touch any other line in `footer-dock-three.tsx` — the `glowBleed` color
  line (113), the `onDock` line (109), the `uTime` value (368, correctly in seconds),
  the Lenis `autoRaf: false` integration in `smooth-scroll-provider.tsx` (correct),
  `LAMP_1`, `LAMP_2`, `GLOW_PATH`, `WATER_Y`, vertex shader, reflection ripple UV,
  `makeUniforms`, or `applyProgress`.
- Do not modify any Playwright test files.
- Do not modify `adaline-scenes.tsx`, `globals.css`, or any other component.

---

## Verification

After both changes, run:
```bash
cd frontend && npm run verify
```

Then manually scroll to the dock section in a browser and confirm:
1. No green aurora columns visible anywhere in the dock section
2. Dark near-black sky, dark hills, dark water
3. Two warm amber lamp halos visible on the dock
4. The aurora CTA section (above the dock) still shows the aurora swell — it should
   just fade out gracefully before the dock enters
