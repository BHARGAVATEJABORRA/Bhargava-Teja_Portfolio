# Summary (§6) — root cause → fix → passing metric, per bug

Mission: every animated layer locked 1:1 to scroll; the only sanctioned
independent clock is the ambient aurora. Verified by
`frontend/tests/scroll/` (Playwright) on desktop 1440×900 and mobile 390×844:
`npm run verify` = lint → build → harness, all green.

## §3.1 Stars/sky "skid down" after scroll stops

- **Root cause:** `useSpring(skyProgress, {stiffness 140, damping 42})` in
  `AdalineFooterScene` (adaline-scenes.tsx) added a physics clock on top of
  Lenis' own scroll easing. Lenis animates the *native* scroll position; the
  in-flow starfield therefore tracked scroll exactly while the spring-lagged
  sky/cloud/star-opacity kept converging after the page stopped — measured
  post-stop drift up to **17 RGB units (clouds), 16 (sky), 0.16 star opacity**.
- **Fix:** deleted the spring; all four derived values are pure
  `useTransform`s of `scrollYProgress`. One scroll source (Lenis), zero extra
  smoothing layers.
- **Metric:** post-stop drift **0.0** on all metrics at 7 footer offsets;
  descending/ascending samples identical (clean reverse); star layer delta =
  scroll delta within 1.5px at every step. Desktop + mobile ✔

## §3.2 Shooting stars with "something attached" (blob)

- **Root cause:** the streak texture was `footer-meteor.jpg` — JPEG has no
  alpha channel, so the sprite's un-faded bounding rectangle rode along the
  star as an attached box.
- **Fix:** one element: CSS `linear-gradient(to top, …white → transparent)`
  trail (fades fully to transparent), `::after` radial head glow pinned to the
  leading end, `transform-origin: 50% 100%`, `border-radius` capsule. JPG
  deleted. The flight animation stays a clean GPU keyframe (deliberate ambient,
  per §3.2's "clean rAF if ambient" allowance).
- **Metric:** computed `background-image` contains `gradient`, no `url()`,
  transparent background-color, 0 border; isolated render shows a clean fading
  streak (`tests/scroll/__output__/meteor-isolated.png`). ✔

## §3.3 Aurora "stuck on one slide"

- **Root cause:** the aurora canvas was mounted *only* inside the footer CTA
  band and its rAF loop was started/stopped by an IntersectionObserver — it
  didn't exist on other sections and froze whenever off-screen.
- **Fix:** painter extracted to `aurora-painter.ts`; new `AmbientAurora`
  component mounts a single fixed, screen-blended canvas at the app root
  (HomeShell, z-1 under all content) running one continuous rAF loop with no
  gating. Intensity is a pure smoothstep of global scroll progress: 0.08 at the
  hero, ~0.18 through the middle sections, swelling to 1.0 only as the footer
  sky settles into night — smooth storytelling, no freeze, no hard cut.
  Reduced motion = one static frame.
- **Metric:** canvas pixel sums change between samples at hero, mid-page and
  footer (animating everywhere); identical under reduced motion. ✔

## §4 Articles sticky-stacking deck

- **State found:** cards already `position: sticky; top: 10rem` with ascending
  z-index, blur and rounded corners; 8 placeholder resume-derived articles
  (`isReal: false`) already seeded in `portfolio-content.ts`. Missing: the
  stacked-deck reveal and the reduced-motion fallback.
- **Fix:** one container-scoped `useScroll({target: deck})` progress; each card
  derives `scale = 1 − 0.08·smoothstep(coverage)` and `opacity = 1 − 0.2·…` as
  the next card pins over it. Removed the `.article-card` CSS `transform`
  transition (a lag clock). `prefers-reduced-motion` skips all transforms.
- **Metric:** scales fall monotonically with scroll, end at 0.92 (floor 0.85
  respected, last card 1.0), zero post-stop drift mid-deck, identity transforms
  under reduced motion. Desktop + mobile ✔

## §5 AI companion dock

- Already implemented (`ai-companion-dock.tsx` + `.ai-dock` CSS) — fixed
  bottom-right, hover spin keyframe, click opens the chat panel wired to
  `/api/ai-companion`, reduced-motion disables the spin.
- **Metric (verified, no change needed):** spins on hover, opens on click, no
  bounding-box overlap with the contact CTA or footer nav, works at 390px,
  no spin under reduced motion. ✔

## Re-running on a schedule

A prompt can't self-schedule; to re-run this verification every 5 hours wrap
`npm --prefix frontend run verify` in a GitHub Action with
`on: schedule: [cron: '0 */5 * * *']` or a local cron entry.
