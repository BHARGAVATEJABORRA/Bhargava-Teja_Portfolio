# PROJECT Agent Operating Manual

This file is the single source of truth for how work is executed in this repository.

## Mission
Build a production-minded software engineer portfolio application through agent-driven, incremental delivery. Prioritize reliability, clarity, recruiter-facing polish, and maintainable architecture over rapid but fragile output.

## Execution Model
- Use Copilot Local / Copilot CLI for orchestration, planning, design support, QA support, and documentation support.
- Use Codex for implementation, integration, refactoring, and final execution.
- Keep decisions explicit and record non-trivial tradeoffs in project documentation.
- Deliver in small phases with verifiable outcomes.

## MCP Usage
Use MCP tools intentionally:
- GitHub MCP for repository context, issues, pull requests, and workflow visibility.
- Context7 MCP for framework/library behavior and documentation lookup before assumptions.
- MongoDB MCP for data modeling and query support.
- Playwright MCP for UI/browser validation and regression checks.
- Microsoft Learn MCP when platform guidance is relevant.
- Sentry MCP later in the lifecycle for monitoring and production diagnostics.
- shadcn MCP is available for browsing and installing shadcn-compatible components.
- React Bits registry is configured through `components.json` via `@react-bits`.
- For frontend UI work, agents may use shadcn MCP to discover, add, and adapt components when it improves speed, consistency, and polish.

## Working Style
- Plan first, implement second, verify third, document fourth.
- Favor sequential execution when tasks overlap in file ownership.
- Use parallel execution only when ownership and touched files do not overlap.
- Keep changes scoped, reviewable, and reversible.
- Avoid speculative abstractions; optimize for clarity and long-term maintainability.

## Coding Rules
- Prefer readable, flat, predictable code over cleverness.
- Keep architecture simple and responsibilities explicit.
- Use explicit control flow and descriptive naming.
- Handle errors explicitly; do not silently swallow failures.
- Keep logging useful for diagnostics and free of secrets.
- Keep regenerable files reproducible.
- Preserve testable behavior for each meaningful change.

## Folder Ownership (Future Structure)
Use these ownership boundaries as the repository grows:
- `frontend/`: UI routes, components, state, accessibility, responsive behavior.
- `backend/`: API routes, controllers, services, auth, external integrations.
- `data/`: schemas, model contracts, migrations, seeds.
- `tests/`: unit, integration, end-to-end tests, fixtures.
- `docs/`: setup guides, architecture notes, feature and decision records.
- `.github/`: agent definitions, instructions, prompt templates, process conventions.
- `.codex/skills/`: reusable Codex workflows for repeatable execution.

If work spans multiple folders, define execution order before coding to reduce conflicts.

## Orchestration Workflow
1. Intake: Clarify scope, constraints, and expected outcomes.
2. Planning: Break work into phases, dependencies, risks, and ownership.
3. Design: Define UI/UX direction and accessibility expectations for user-facing changes.
4. Implementation: Execute the smallest clean change set with clear integration points.
5. QA: Validate smoke paths, regressions, and edge cases (including browser validation for UI).
6. Docs: Update setup, architecture, and feature notes to match reality.
7. Handoff: Summarize changed files, validation results, residual risks, and next actions.

## Quality Bar
- Acceptance criteria are met without ambiguity.
- Touched areas show no obvious regressions.
- Error paths are handled and observable.
- Code remains understandable to a new engineer.
- Documentation reflects actual behavior.
- Validation evidence exists for non-trivial changes.

## Definition of Done
A task is complete only when all conditions are true:
- Requested scope is fully implemented.
- Changes are integrated cleanly across affected layers.
- Validation is complete (tests and/or manual QA; Playwright for UI when applicable).
- Known risks and constraints are explicitly documented.
- Required documentation/instructions/prompts are updated.
- Output is reviewer-ready with no hidden TODOs or ambiguous behavior.

# AGENTS.md — Portfolio Build System

> **Project:** Premium Software Engineer Portfolio
> **Owner:** Bhargav
> **Date Created:** 2026-03-13
> **Last Updated:** 2026-03-13
> **Status:** Phase 1 MVP implemented; review and content-hardening in progress

---

## 0. Strategic Summary

This document is the single source of truth for building Bhargav's premium software engineer
portfolio. It defines the product vision, refined information architecture, phased
implementation plan, workflow responsibilities, folder structure, dependencies, risks,
and acceptance criteria.

**Core design principle:** One cinematic entrance. One OS-grade exploration layer. Zero clutter.

The portfolio serves two visitor types simultaneously:

- **Recruiter mode** (≤12-second first impression): Hero → About → Experience → Projects → Contact
- **Engineer mode** (deep-dive): Command palette → any section → case study → architecture → blog

The site is recruiter-first and mobile-first. Every design and implementation decision must
be evaluated against those two constraints before anything else.

---

## 1. Product Vision

### What This Is

A polished, product-grade personal site that communicates, in order:

1. Who Bhargav is — human story, background, personality
2. What kind of engineer Bhargav is — depth, thinking style, architecture awareness
3. What Bhargav builds — projects with real impact metrics and technical detail
4. Why Bhargav's work matters — outcomes and decisions, not just tech stacks
5. Where to go next — resume, GitHub, LinkedIn, contact, all one click away

### What This Is NOT

- A basic HTML/Bootstrap personal page
- A showcase of design tricks without substance
- An overloaded hero with five competing visual effects
- A page that works beautifully on desktop and breaks on mobile

### The One-Wow-Moment Rule

The portfolio is allowed exactly **one** primary visual wow moment: the cinematic hero
entrance with the 3-language greeting curtain (English → Hindi → Telugu, ~2.5s, then
resolves into the hero). Every other animation must be smooth and polished, but subordinate
to content clarity. No section competes for dominance with the hero entrance.

---

## 2. Information Architecture

```text
/ (root)
│
├── [Entrance Curtain Animation]
│   └── 3-language greeting: "Hello" → "नमस्ते" → "నమస్కారం"
│       Dissolves into hero after ~2.5s (skippable on any key or click)
│       Only plays on first visit; localStorage flag prevents replay
│
├── #hero
│   ├── Short powerful tagline (1 line)
│   ├── Brief introduction (2–3 sentences max)
│   ├── Primary CTA: "View My Work" → scrolls to #projects
│   ├── Secondary CTA: "Download Resume" → opens PDF
│   ├── Left-bottom dock (GitHub, LinkedIn, Resume, Email)
│   ├── Right-bottom: AI companion trigger button (Phase 2 only)
│   └── Theme switcher (light / dark / system)
│
├── #about
│   ├── Personal photo
│   ├── Short narrative (who I am, where I'm from, what drives me)
│   └── Current focus / what I'm building now
│
├── #skills
│   ├── Category filter tabs (Languages, Frameworks, Tools, Cloud)
│   └── Logo grid: greyscale at rest → brand color + radial glow on hover
│
├── #experience
│   ├── Sub-tabs: Work | Education | Certifications
│   ├── Layout: vertical timeline (mobile + tablet, default)
│   └── Layout: horizontal card strip (desktop ≥1280px only)
│
├── #projects
│   ├── Featured projects (top 3): full card with
│   │   ├── Title + one-line summary
│   │   ├── Impact metric callout (e.g. "Reduced latency by 40%")
│   │   ├── Tech stack chips
│   │   ├── Architecture highlight — Phase 2 (diagram or callout sentence)
│   │   ├── Live link + GitHub link
│   │   └── Case study expand / modal — Phase 2
│   └── All projects grid (smaller cards, filterable by tag)
│
├── #articles          ← CONDITIONAL: rendered only when content array length > 0
│   ├── Article card list
│   └── Each card: title, summary, tags, read time, date
│
└── #contact + footer
    ├── Contact form (name, email, message)
    ├── Direct email + social links
    └── Footer: cinematic fade-to-dark transition
        with tagline, nav links, copyright
```

### Sections Removed from Original Brief

| Removed | Reason | Replacement |
|---|---|---|
| Standalone greeting section | Wastes a full viewport; no independent content value | Merged into hero entrance curtain animation |
| Control Center as a full page section | Expensive to build; requires real data to be meaningful | Collapsible dock panel (Phase 2 gate) |
| Horizontal Experience scroll on mobile | Violates mobile-first constraint | Vertical timeline (default); horizontal only on desktop |
| Blueprint / design+code project overlay | Too complex for MVP; risk of over-engineering | Deferred to Phase 3 |

### Sections Deferred to Phase 2

| Feature | Gate condition before shipping |
|---|---|
| AI Companion | Real Q&A dataset built and tested (≥20 questions answered accurately) |
| Control Center panel | Real live data modules confirmed (GitHub API, current project, etc.) |
| Architecture diagrams in projects | Diagram assets created and reviewed |
| In-page resume PDF viewer | Nice-to-have; deprioritized unless feedback requests it |

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js App Router** | SSG for performance, SSR for dynamic routes, strong ecosystem |
| Language | **TypeScript** | Type safety for content schemas, better refactoring, required for scale |
| Styling | **Tailwind CSS v3** | Utility-first, dark mode via `class` strategy, mobile-first defaults |
| Animation | **Framer Motion** | Best-in-class React animation, scroll-driven triggers, layout animations |
| Content layer | **Typed local JSON/TS + MDX** | Projects and blog as MDX; skills and experience as strongly-typed TS files |
| Icons | **Lucide React + SVG brand logos** | Lucide for UI chrome; brand logos as SVGs for greyscale → color hover effect |
| Theme | **next-themes** | Flicker-free system/dark/light switching |
| Command palette | **cmdk** | Headless, fully accessible, used by Vercel, Linear, Raycast |
| Analytics | **Vercel Analytics** (primary) or **Plausible** (fallback) | Zero-config, privacy-first, no cookie banner required |
| Hosting | **Vercel** | Native Next.js integration, edge CDN, instant preview deployments |
| SEO | **next/metadata API + JSON-LD** | First-party, no extra library, full App Router support |
| Fonts | **Geist** (preferred) or **Inter** (fallback) | Clean, modern, excellent readability at all sizes |

> **Unresolved:** Font (Geist vs Inter), analytics provider (Vercel vs Plausible),
> contact form backend (Resend vs Formspree). See Section 11 for all open decisions.

---

## 4. Folder Structure (Current Repository Reality)

```text
PROJECT/
│
├── AGENTS.md
├── docs/
│   └── phase-1-mvp.md
├── .github/
│   ├── agents/
│   ├── instructions/
│   └── prompts/
├── .codex/
│   └── skills/
├── .vscode/
│   └── mcp.json
│
└── frontend/
    ├── app/
    │   ├── api/
    │   │   └── contact/
    │   │       └── route.ts
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── robots.ts
    │   └── sitemap.ts
    │
    ├── components/
    │   ├── analytics/
    │   ├── control-center/
    │   ├── layout/
    │   ├── sections/
    │   ├── seo/
    │   └── ui/
    │
    ├── content/
    │   └── portfolio-content.ts
    ├── lib/
    ├── public/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    └── README.md
```

### Target Evolution

As the project matures, content may be split from `frontend/content/portfolio-content.ts` into:
- `frontend/content/profile.ts`
- `frontend/content/projects.ts`
- `frontend/content/experience.ts`
- `frontend/content/skills.ts`
- `frontend/content/articles.ts`

Do not force that split until content size or maintenance pain justifies it.

---

## 5. Phased Implementation Plan

### Workflow model

This project uses a two-layer workflow:

- **Orchestration layer (Copilot / Cowork):** Planning, scaffolding, content data files,
  config files, boilerplate-heavy tasks, SEO markup, analytics wiring. Tasks where
  autocomplete and inline suggestion speed outweigh the need for deep reasoning.

- **Implementation layer (Codex):** Complex component logic, animation sequences,
  interaction state, responsive layout transitions, command palette, accessibility
  audits, performance optimisation, API integrations. Tasks that require reasoning
  about the full codebase rather than completing a pattern.

Each phase header notes which layer is primary. A task can shift layers — use judgement.

---

### Phase 0 — Foundation
**Primary layer:** Orchestration
**Goal:** Scaffold the project, configure tools, establish design tokens, wire CI/CD.
**Estimated effort:** 1–2 hours

Tasks:
1. `npx create-next-app@latest portfolio --typescript --tailwind --app --src-dir`
2. Install core dependencies:
   `framer-motion cmdk next-themes lucide-react clsx tailwind-merge`
3. Configure `tailwind.config.ts`:
   - Custom color tokens: `brand`, `surface`, `border`, `text`, `muted`
   - Dark mode strategy: `class`
   - Custom font family reference
   - Extended animation utilities
4. Configure `next.config.ts` — image remote patterns, MDX plugin (if using)
5. Set up `globals.css` — CSS variables for all design tokens in `:root` and `.dark`
6. Create `.env.example` with all required key names (no values)
7. Stub `frontend/content/portfolio-content.ts` with real personal information placeholders
8. Add placeholder assets to `frontend/public/`: `og-image.png`, `resume.pdf`, `avatar.jpg`
9. Initialise git, push to GitHub, connect to Vercel for preview deploys

Phase 0 acceptance criteria:
- `npm run dev` starts without errors from the `frontend/` app
- `npm run build` completes without errors
- Dark/light theme toggle works in dev
- Vercel preview URL is live

---

### Phase 1A — Layout Shell + Hero
**Primary layer:** Orchestration → Implementation
**Goal:** Establish the full page skeleton and deliver the one wow moment.
**Estimated effort:** 4–6 hours

Tasks:
1. `layout.tsx` — root layout with `ThemeProvider`, font loading via `next/font`, root metadata
2. `site-header.tsx`
   - Liquid-glass effect: `backdrop-filter: blur()` + semi-transparent surface token
   - `@supports` fallback for browsers without `backdrop-filter`: solid surface colour
   - Mobile navigation remains readable and usable
3. Dock-style quick access for GitHub, LinkedIn, Resume, and Email
4. Entrance greeting experience
   - First-visit-only if implemented
   - Skippable
   - Must not hurt first usable render
5. Hero section
   - Tagline
   - Brief introduction
   - CTA row: “View My Work” + “Download Resume”
   - One restrained hero effect only
   - `prefers-reduced-motion` respected

Phase 1A acceptance criteria:
- Hero visible and legible in ≤1.5s on simulated 4G throttle
- Any entrance treatment is skippable and does not cause layout jump
- Header remains legible in light and dark themes
- Mobile interaction remains tappable at 375px viewport
- CLS < 0.1

---

### Phase 1B — Content Sections
**Primary layer:** Orchestration (data) → Implementation (components)
**Goal:** Build About, Skills, Experience, Projects, and Contact with real content.
**Estimated effort:** 6–8 hours

Tasks:
1. Real content population in `frontend/content/portfolio-content.ts`
2. About section with photo, narrative, and current focus
3. Skills section with greyscale → brand colour hover behaviour
4. Experience section with mobile-safe default timeline and desktop enhancement only where justified
5. Projects section with featured work, impact metrics, and supporting cards
6. Contact section and premium footer

Phase 1B acceptance criteria:
- All sections render without errors on 375px, 768px, 1280px, 1440px
- No horizontal overflow at any breakpoint
- Hover effects are smooth without jank
- Impact metrics are visible and meaningful
- Contact form submits successfully and returns a confirmation state

---

### Phase 1C — Cross-cutting Concerns
**Primary layer:** Implementation + Orchestration
**Goal:** Command palette, SEO, analytics, performance budget, accessibility pass.
**Estimated effort:** 3–4 hours

Tasks:
1. Command palette with keyboard support
2. SEO metadata, sitemap, robots, JSON-LD
3. Analytics provider wiring and core events
4. Performance budget checks and asset optimisation
5. Accessibility pass: semantics, keyboard, focus, reduced motion, contrast

Phase 1C acceptance criteria:
- Lighthouse scores (mobile): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 90
- Lighthouse scores (desktop): Performance ≥ 95
- Keyboard command palette works correctly
- JSON-LD validates
- Analytics events appear in provider dashboard after test interactions
- No console errors or production build warnings

---

### Phase 2 — Enhanced Features
**Primary layer:** Implementation
**Goal:** Ship features that require real content or live data to be valuable.
**Gate condition:** Portfolio is live, shared with ≥5 people, and initial feedback is gathered.

> **Do not begin Phase 2 until the Phase 2 gate condition is met.**
> Shipping these features with incomplete data actively damages credibility.

Tasks:
1. **AI Companion**
   - Structured Q&A dataset
   - LLM provider integration
   - Floating trigger and chat drawer
   - Safety and refusal behaviour
2. **Control Center Panel**
   - Dock-triggered drawer, not full page section
   - Only real live modules
3. **Blog / Articles enhancement**
   - Activate only with real article volume
4. **Project Case Studies**
   - Modal or dedicated route
   - Problem → Architecture → Solution → Outcome

Phase 2 acceptance criteria:
- AI answers 20 pre-written test questions accurately before public visibility
- Control center shows only real, live data
- Blog only goes live with real articles
- All Phase 1 Lighthouse scores remain acceptable

---

### Phase 3 — Ongoing Polish
**Primary layer:** Orchestration + Implementation as needed
**Goal:** Data-driven iteration and content expansion.

Backlog:
- A/B test hero tagline variants
- Blueprint / design+code project presentation overlay
- Testimonials / peer recommendations section
- Speaking engagements or open-source contributions section
- Newsletter integration (only if writing consistently)
- Internationalisation (only if audience data justifies it)

---

## 6. Workflow Responsibilities

The project follows a two-layer workflow. The table below maps each task type to the
appropriate layer.

| Task | Layer | Reasoning |
|---|---|---|
| Project scaffolding and config files | **Orchestration** | CLI and config; limited reasoning required |
| Design token setup and content files | **Orchestration** | Pattern-completion and structured typing |
| SEO markup and analytics event wiring | **Orchestration** | Boilerplate-heavy and spec-driven |
| Complex animation and component interaction | **Implementation** | Requires sequencing and interaction reasoning |
| Responsive layout transitions and state-heavy UI | **Implementation** | Requires codebase-aware reasoning |
| Performance audit and accessibility hardening | **Implementation** | Requires deep review and prioritisation |
| AI Companion and live data modules | **Implementation** | API integration, failure handling, and product reasoning |

### Handoff Protocol

When switching between orchestration and implementation work:

1. Commit all in-progress work with a descriptive message referencing phase and task number
2. Leave a `// TODO(impl): <clear instruction>` comment at the exact next task location
3. Do not leave partially wired imports or broken type references when switching layers

---

## 7. Dependencies

### Phase 0

```bash
npm install framer-motion cmdk next-themes lucide-react clsx tailwind-merge
```

### Phase 1B — Content rendering

```bash
npm install @next/mdx @mdx-js/react remark-gfm rehype-pretty-code shiki
```

### Phase 1B — Contact form (choose one)

```bash
# Option A: Resend + React Email
npm install resend react-email

# Option B: Formspree
npm install @formspree/react
```

### Phase 1C — Analytics (choose one)

```bash
# Option A: Vercel Analytics
npm install @vercel/analytics

# Option B: Plausible
npm install next-plausible
```

### Phase 2 (defer)

```bash
npm install openai
# or: npm install @anthropic-ai/sdk
npm install @octokit/rest
```

### Dev tooling

```bash
npm install -D @next/bundle-analyzer prettier eslint-config-next
```

---

## 8. MCP and Tooling Guidance

Use MCP tools intentionally:
- GitHub MCP for repository context, issues, pull requests, and workflow visibility.
- Context7 MCP for framework/library behavior and documentation lookup before assumptions.
- Playwright MCP for UI/browser validation and regression checks.
- Microsoft Learn MCP when platform guidance is relevant.
- Sentry MCP later in the lifecycle for monitoring and production diagnostics.
- shadcn MCP is available for browsing and installing shadcn-compatible components.
- React Bits registry is configured through `components.json` via `@react-bits`.
- For frontend UI work, agents may use shadcn MCP to discover, add, and adapt components when it improves speed, consistency, and polish.

Prefer existing local components first. Imported components must be adapted to the project style instead of pasted in blindly.

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `backdrop-filter` missing on older Android Chrome | Medium | Low | Use `@supports` fallback to solid surface colour |
| Entrance treatment janky on low-end devices | Medium | High | Use only transform/opacity, respect reduced motion, test on throttled CPU |
| AI Companion hallucinating incorrect facts | High (if rushed) | Very High | Hard gate: do not ship until 20-question test suite passes |
| Contact form spam | High | Medium | Honeypot field; server-side rate limiting; add Turnstile later if needed |
| Animation bundle size bloat | Low | Medium | Audit with bundle analyzer before shipping |
| Content file grows too large | Medium | Low | Split content modules only when maintenance pain justifies it |
| Hero over-engineered before content is finalised | High | Medium | Write real content first |
| Control Center showing stale or fake data | Medium | High | Only ship modules with confirmed live data |
| Phase 2 creep delaying launch | High | High | Hard-block Phase 2 until live site and real review feedback |

---

## 10. Pre-launch Acceptance Criteria

All items below must be checked before sharing the portfolio with any recruiter or employer.

### Performance
- [ ] Lighthouse Performance ≥ 90 on mobile
- [ ] Lighthouse Performance ≥ 95 on desktop
- [ ] LCP ≤ 2.5s on 4G throttle
- [ ] CLS < 0.1
- [ ] No render-blocking resources identified in Lighthouse

### Accessibility
- [ ] Lighthouse Accessibility ≥ 95
- [ ] All interactive elements keyboard-reachable and operable
- [ ] Skip-to-content link works correctly
- [ ] All images have meaningful `alt` text
- [ ] Color contrast ≥ 4.5:1 in light and dark themes
- [ ] Reduced-motion path exists for all non-essential motion

### SEO
- [ ] Lighthouse SEO ≥ 95
- [ ] Unique title and description on every page
- [ ] Open Graph image renders correctly
- [ ] JSON-LD `Person` schema validates
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] `robots.txt` present and correct

### Content integrity
- [ ] Real name, tagline, and bio — no placeholder text anywhere
- [ ] At least 3 projects with real, verifiable impact metrics
- [ ] Work experience complete, accurate, and correctly dated
- [ ] Resume PDF is current and downloadable

### Functionality
- [ ] Theme toggle works without flash of unstyled content
- [ ] Entrance treatment plays once only if present
- [ ] Command palette opens with `Cmd+K` and `Ctrl+K`
- [ ] Navigation links scroll to correct sections
- [ ] Contact form submits successfully and user sees confirmation
- [ ] All external links open in new tab with `rel="noopener noreferrer"`
- [ ] Styled 404 page exists and links back to home

### Mobile
- [ ] Fully functional at 375px viewport width
- [ ] No horizontal scroll at any viewport width
- [ ] All tap targets ≥ 44×44px
- [ ] Mobile navigation works correctly

### Analytics
- [ ] Analytics provider receives pageviews
- [ ] `resume_download` fires on Resume CTA click
- [ ] `project_click` fires on project link click
- [ ] `command_used` fires with the correct command name

---

## 11. Immediate Next Steps

Work in this order. Do not skip ahead.

1. **Write real content first.** Populate `frontend/content/portfolio-content.ts` with accurate information before changing sections for polish.
2. **Review the implemented Phase 1 MVP** against this document and fix mismatches.
3. **Replace all placeholders**: site URL, links, resume asset, project metrics, contact behaviour.
4. **Run a mobile, accessibility, and SEO hardening pass** before any feature expansion.
5. **Do not begin Phase 2** until the portfolio is live and reviewed by at least five real people.
6. **Update this document** at the end of each phase or major review pass.

---

## 12. Open Decisions

These decisions are unresolved. They must be made before or during the relevant phase.

| # | Decision | Options | Needed by | Notes |
|---|---|---|---|---|
| D1 | Font choice | Geist, Inter | Review pass | Geist is more distinctive; Inter is safer |
| D2 | Hero background effect | Animated gradient mesh, subtle particle field, static gradient | Review pass | Choose one; must not hurt LCP |
| D3 | Contact form backend | Resend + API route, Formspree | Deployment hardening | Resend gives full control; Formspree is simpler |
| D4 | Analytics provider | Vercel Analytics, Plausible | Deployment hardening | Depends on hosting/privacy preference |
| D5 | Brand / accent colour | Undecided | Review pass | Must work in both light and dark |
| D6 | Custom domain | Undecided | Before launch | Needed for canonical URL and JSON-LD |
| D7 | AI Companion LLM provider | OpenAI, Anthropic | Phase 2 | Defer until Phase 2 |
| D8 | Project case study format | Dedicated route, inline modal | Phase 2 | Route is better for SEO |
| D9 | Blog/content CMS | MDX in repo, Sanity, Contentlayer | Phase 2 | MDX-in-repo is simplest initially |

---

## 13. Revision History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-03-13 | 1.0 | Initial planning document created | AI-assisted planning session |
| 2026-03-13 | 1.1 | Refined workflow language, implementation split, and open decisions | AI-assisted planning session |
| 2026-03-13 | 1.2 | Aligned document to current repo reality under `frontend/` and Phase 1 MVP status | AI-assisted planning session |

---

*This document is the build contract for this project. Update it after every phase.
Decisions made verbally should be recorded here within 24 hours.*