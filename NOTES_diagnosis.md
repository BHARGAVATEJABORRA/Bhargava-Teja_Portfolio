# Diagnosis — animation mechanism inventory (per §1a)

Date: 2026-06-09. Verified against source at commit a442ac6 + uncommitted WIP.

## Stack (package.json)

- `lenis` 1.3.23 — the smooth scroller. Mounted once in
  `frontend/components/providers/smooth-scroll-provider.tsx:52` with `autoRaf: true`,
  duration 0.7s, `easeOutExpo`. Lenis scrolls the **native window scroll position**
  (no wrapper transform), so `window.scrollY` and framer-motion's `useScroll()` both
  read the *same* animated value. There is exactly one smooth-scroll source of truth —
  good; nothing else needs to subscribe to Lenis directly.
- `framer-motion` 12.36.0 — used for `useScroll`/`useTransform`/`useSpring` in the
  footer scene and entrance/section reveals.
- `gsap` 3.15.0 / `@gsap/react` — installed; grep shows **no ScrollTrigger usage in the
  footer**. (Used elsewhere; not part of these bugs.)

## Footer (`frontend/components/scenes/adaline-scenes.tsx`, `AdalineFooterScene`)

| Layer | Mechanism | File:line | Verdict |
| --- | --- | --- | --- |
| Sky gradient (`data-scroll-scene="sky-gradient"`) | `useScroll({target: skyRef})` → **`useSpring(stiffness 140, damping 42, mass 0.18)`** → `useTransform` → `background` | adaline-scenes.tsx:655-664 | ⚠️ The spring is a **second clock**: it keeps easing after scroll input stops and lags it while scrolling. This is the §3.1 "skid". Also animates `background` (paint) not transform — unavoidable for a gradient, but must not be spring-lagged. |
| Cloud band (`data-scroll-scene="clouds"`) | same spring → `background` gradient under a PNG mask | adaline-scenes.tsx:665,682-687 | ⚠️ same spring lag |
| Starfield (`data-scroll-scene="stars"`) | static `transform: translateY(-50%)` (globals.css:1926); *positional* movement comes purely from being inside the tall in-flow scroll zone (correct, 1:1 by construction); **opacity** driven by the same spring | adaline-scenes.tsx:666,689-694, globals.css:1918-1928 | ⚠️ opacity lags scroll via spring → perceived "skidding" of star brightness during/after scroll |
| Shooting stars (`.adaline-meteor`) | **infinite CSS keyframe** `adaline-meteor N s linear infinite` — pure wall-clock animation | globals.css:1956-1994, adaline-scenes.tsx:151-155 | ⚠️ time-based, not scroll-bound (tolerable as deliberate ambient per §0? No — §3.2 still applies to the visual bug) |
| Shooting-star **texture** | `background-image: url(footer-meteor.jpg)` — **a JPEG, which has no alpha channel**; the un-faded rectangle around the streak is the "blob attached" | globals.css:1962 | ❌ root cause of §3.2. Replace with a `linear-gradient(... transparent)` trail. |
| Aurora | `<canvas>` 2D, rAF loop, **gated by an IntersectionObserver (rootMargin 200px)** and **mounted only inside the footer CTA band** | adaline-scenes.tsx:247-340 (IO at 317-330), mounted at 730 | ❌ root cause of §3.3: aurora exists nowhere else on the page and freezes when off-screen → "stuck on one slide". |
| Hills / dock / reflection | static in-flow images | adaline-scenes.tsx:780-810 | ✅ no clock |

### Root cause summary (§3 preamble confirmed)

All three §3 bugs trace to layers with their own clock or own lifecycle:

1. **§3.1 skid** = `useSpring` at adaline-scenes.tsx:662 adds a physics clock on top of
   Lenis' own easing. Lenis already smooths the scroll value (0.7s easeOutExpo); a spring
   on top means layers continue moving after the page has stopped → drift between the
   in-flow starfield (1:1) and the spring-lagged sky/cloud/star-opacity → "slowly skids".
   Fix: drop the spring, feed `skyProgress` directly into the transforms. Lenis is the
   single shared smoothing; pure function of scroll thereafter.
2. **§3.2 blob** = JPEG meteor sprite (no alpha) + wall-clock keyframe. Fix: one element
   whose trail is a CSS `linear-gradient(to top, transparent, white)` (fades fully to
   transparent), `transform-origin` keeping head+tail a unit; keep as deliberate ambient
   (clean keyframe is GPU-composited; no JS clock needed) — visual bug is the alpha.
3. **§3.3 frozen aurora** = canvas mounted only in footer + IO gating. Fix: hoist a single
   ambient aurora canvas to the app root (fixed, low z-index, behind content), continuous
   rAF (paused only for `prefers-reduced-motion` / hidden tab), intensity modulated
   smoothly by global scroll progress.

## Articles section (`frontend/components/sections/blogs-section.tsx`)

- Already a sticky-stacking deck: `.article-card { position: sticky; top: 10rem; transform-origin: top center; backdrop-filter: blur(10px) }` with ascending `z-index` (globals.css:334-378, blogs-section.tsx:28).
- **Missing vs §4**: no scroll-progress scale (1 → ~0.92)/opacity falloff as the next card
  pins over; no `prefers-reduced-motion` fallback for the deck.
- Content: already seeded with **8** placeholder, resume-derived articles flagged
  `isReal: false` (`frontend/content/portfolio-content.ts:447-592`) — exceeds the 5-card
  seed requirement; data shape is swappable. Keeping it.

## AI companion dock (`frontend/components/sections/ai-companion-dock.tsx`)

Already implemented: fixed bottom-right (`.ai-dock`, globals.css:2005), CSS hover spin
(`ai-dock-spin`, globals.css:2044-2069), click opens a chat window wired to
`/api/ai-companion`, reduced-motion disables spin (globals.css:2114-2123). §5 is a
verification task, not a build task.

## Chosen techniques (per §2.b.1)

- **One scroll source**: Lenis animates native scroll; framer `useScroll` reads it. All
  scroll-linked values become pure `useTransform`s of `scrollYProgress` — no springs, no
  per-property CSS `transition` on scroll-linked styles.
- **Meteor trail**: standard CSS technique — thin element, `linear-gradient(to top/left,
  transparent 0%, rgba(white) 100%)`, rounded head via `border-radius`/pseudo head dot,
  fully transparent tail end. (Community consensus pattern for "CSS shooting star".)
- **Sticky stacking cards**: container-scoped `useScroll({target, offset})` per card →
  `scale`/`opacity` transforms — same approach as the kartavya-singh.com reference.
