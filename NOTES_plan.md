# Plan (§2.b.2) — checkbox tracker

- [x] §1a inventory → NOTES_diagnosis.md
- [x] Harness: Playwright under `frontend/tests/scroll/`, `npm run verify` = lint → build → scroll harness (desktop 1440 + mobile 390)
- [x] §3.1 footer skid: remove `useSpring` second clock; layers = pure function of `scrollYProgress`
- [x] §3.2 meteor blob: JPEG sprite → gradient trail fading to transparent
- [x] §3.3 aurora: hoist to app root, persistent ambient, scroll-modulated intensity, no IO freeze
- [x] §4 articles deck: scroll-progress scale/opacity falloff + reduced-motion fallback
- [x] §5 AI dock: verify hover spin / click open / no overlap / mobile
- [x] Final: `npm run verify` green both viewports; NOTES_summary.md; changelog; atomic commits

## Metrics log

| When | Run | Result |
| --- | --- | --- |
| pre-fix | desktop harness (reproduce) | §3.1 FAIL: post-stop drift sky 10–16 rgb, clouds 11–17 rgb, star opacity 0.07–0.16; §3.2 FAIL: `footer-meteor.jpg` sprite; §3.3 FAIL: no aurora outside footer; §4 FAIL: no card scale falloff. 5 passed (§5 dock + reduced-motion) |
| after §3.1 | `--grep "no skid"` desktop | PASS — post-stop drift 0.0 on every metric at 7 offsets; reverse pass identical; stars delta = scroll delta ±1.5px ✔ |
| after §3.2 | meteor test desktop | PASS — gradient trail, no url(), zero border ✔ (visual: `tests/scroll/__output__/meteor-isolated.png`) |
| after §3.3 | aurora tests desktop | PASS — canvas animating at hero/mid/footer; static under reduced motion ✔ |
| after §4 | articles tests desktop | PASS — monotonic scale 1→0.92, floor >0.85, last card 1.0, post-stop drift 0 ✔ |
| final | `npm run verify` | lint ✔ build ✔ 16 passed / 2 skipped (mobile hover N/A) across desktop 1440×900 + mobile 390×844 ✔ |
