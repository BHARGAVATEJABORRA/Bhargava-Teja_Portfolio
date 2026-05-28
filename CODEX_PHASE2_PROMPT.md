# Codex Phase 2 — Full Vision Implementation Prompt

## CONTEXT & GROUND RULES

You are implementing a premium software engineer portfolio for **Bhargav Patel** (legal: Bhargava Teja Borra). The Phase 1 MVP is already in place at `frontend/`. Your job is to implement the **exact** final vision described below — no approximations, no deferrals, no placeholders labeled "future work."

**Tech stack (already established — do not change):**
- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` in globals.css — NOT v3 directives)
- Framer Motion (`motion`, `AnimatePresence`, `useReducedMotion`, `useScroll`, `useTransform`)
- `next-themes` for light/dark/system theming (`.dark` class strategy)
- `cmdk` for command palette
- `react-icons` (fa6, lu, si)
- Glass design system already defined in `globals.css` (`.glass-surface`, `.surface-panel`, CSS custom properties)
- Single content source: `frontend/content/portfolio-content.ts`

**Read these files first before writing any code:**
1. `frontend/content/portfolio-content.ts` — all data lives here
2. `frontend/app/globals.css` — glass design tokens
3. `frontend/components/layout/home-shell.tsx` — current section order
4. `frontend/components/layout/site-header.tsx` — current nav
5. `frontend/components/layout/quick-access-dock.tsx` — dock component
6. `frontend/components/sections/experience-section.tsx` — needs full redesign
7. `frontend/components/sections/skills-section.tsx` — keep, refine glow
8. `frontend/lib/site.ts` — siteConfig

---

## EXACT PAGE STRUCTURE (implement in this order)

```
[EntranceCurtain] → fades out, then:

<HomeShell>
  <SiteHeader />          ← liquid glass pill nav, always visible
  <HeroSection />         ← slide 1: Sarah.dev rotating + breaking rose animation
  <ControlCenterSection /> ← slide 2: MUST HAVE — real-time data dashboard
  <AboutSection />
  <SkillsSection />       ← keep existing, refine glow
  <ExperienceSection />   ← REDESIGN: horizontal 3-column (Study | Work | Certs)
  <ProjectsSection />     ← REDESIGN: horizontal scroll, blueprint aesthetic
  <BlogsSection />        ← new section (empty state, graceful)
  <ContactFooterSection /> ← contact form + footer combined, cinematic transition
  <QuickAccessDock />     ← left-bottom, all links
  <AiCompanionFab />      ← right-bottom FAB
  <CommandPalette />      ← Cmd/Ctrl+K overlay
</HomeShell>
```

---

## COMPONENT 1 — ENTRANCE CURTAIN (already implemented, verify only)

File: `frontend/components/motion/entrance-curtain.tsx`

Verify it contains:
- `greetings = ["Hello", "నమస్కారం", "नमस्ते"]` (Telugu first after English per portfolio owner's preference order)
- Skips on keypress or pointer down
- Marks `localStorage.setItem("portfolio:entrance_seen_v1", "1")` after completion
- `useReducedMotion()` → instant 360ms dismiss if true
- Full-screen overlay `bg-[var(--color-ink)]` with centered greeting text

---

## COMPONENT 2 — SITE HEADER (update: add ThemeToggle dropdown)

File: `frontend/components/layout/site-header.tsx`

The header already has a glass pill. Make these precise changes:

### ThemeToggle — replace or enhance to show 3 options
The theme toggle must support **Light / Dark / System** as a 3-way cycle or a small dropdown. Use `next-themes` `setTheme("light" | "dark" | "system")` and `theme` values.

```tsx
// ThemeToggle cycle: system → light → dark → system
// Icon: LuSun (light), LuMoon (dark), LuMonitor (system)
// Renders as a single button that cycles, with aria-label reflecting current state
```

### Section nav pills
Current section IDs in nav (update to match new section order):
```
hero | control-center | about | skills | experience | projects | blogs | contact
```
Labels:
```
Home | Control Center | About | Skills | Experience | Projects | Blog | Contact
```

### Command palette button
Keep existing `⌘K` button. It dispatches `window.dispatchEvent(new Event("portfolio:open-command-palette"))`.

---

## COMPONENT 3 — HERO SECTION (full redesign: Sarah.dev inspiration)

File: `frontend/components/sections/hero-section.tsx` (create or replace)

### Visual concept
The hero is a **rotating typographic sculpture** at rest. On hover, it **shatters/blooms like a broken rose** — text fragments rotate and scatter outward, then reassemble. Think: CSS 3D transforms + Framer Motion `staggerChildren` + `rotateZ` + `scale`.

### Implementation spec

```tsx
"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

// The greeting text fragments that rotate and scatter on hover
// Split the hero title/name into individual word spans
// Each word gets its own motion.span with unique rotation/translation on hover

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const [isExploded, setIsExploded] = useState(false);
  // ...
}
```

**Exact animation behavior:**

1. **At rest (idle):** The name "Bhargav Patel" and role text rotate slowly in 3D — `rotateY: [0, 3, -3, 0]` on a 6s loop with `ease: "easeInOut"`. The tagline words gently float up/down offset from each other (staggered `y: [0, -4, 0]` on 4s loops).

2. **On hover (`isExploded = true`):** Each word in the name + tagline explodes outward:
   - Use `staggerChildren: 0.04, delayChildren: 0`
   - Each word gets a unique `rotateZ` between -45 and +45 (deterministic per index), `x` ±100–200px, `y` ±60–120px, `opacity: 0` at the end
   - Duration: 0.5s cubic-bezier spring

3. **On mouse leave (`isExploded = false`):** Words snap back to origin with spring physics (`type: "spring", stiffness: 260, damping: 20`).

4. **If `prefersReducedMotion`:** No rotation, no explosion. Static layout only.

**Layout structure:**
```
<section id="hero" ...>
  <div class="min-h-svh flex flex-col justify-center items-center text-center px-6">

    <!-- Eyebrow -->
    <motion.p>Software Engineer · Full-Stack · Cloud</motion.p>

    <!-- Name (explodable) -->
    <div onMouseEnter={explode} onMouseLeave={reassemble} class="cursor-crosshair">
      <motion.h1>
        {["Bhargav", "Patel"].map((word, i) => (
          <motion.span key={i} variants={wordVariants} className="inline-block mx-2">
            {word}
          </motion.span>
        ))}
      </motion.h1>

      <!-- Tagline words also scatter -->
      <motion.p class="text-[var(--color-muted-ink)]">
        {taglineWords.map((word, i) => (
          <motion.span key={i} variants={wordVariants} className="inline-block mr-2">
            {word}
          </motion.span>
        ))}
      </motion.p>
    </div>

    <!-- CTA row -->
    <div class="flex gap-4 mt-8">
      <a href="#contact">Get in touch</a>
      <a href="#projects">See my work</a>
    </div>

    <!-- Impact metrics strip -->
    <div class="flex gap-8 mt-12 text-center">
      <div><span class="text-3xl font-bold">99.9%</span><p>Uptime SLA</p></div>
      <div><span class="text-3xl font-bold">5+</span><p>Years Experience</p></div>
      <div><span class="text-3xl font-bold">10M+</span><p>API Calls / Month</p></div>
    </div>

    <!-- Scroll indicator -->
    <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
      <LuChevronDown />
    </motion.div>
  </div>
</section>
```

**Word scatter variants:**
```tsx
const scatterVariants = {
  idle: { x: 0, y: 0, rotateZ: 0, opacity: 1 },
  exploded: (i: number) => ({
    x: (i % 2 === 0 ? 1 : -1) * (80 + i * 30),
    y: (i % 3 === 0 ? -1 : 1) * (40 + i * 20),
    rotateZ: (i % 2 === 0 ? 1 : -1) * (15 + i * 12),
    opacity: 0,
    transition: { type: "spring", stiffness: 200, damping: 15, delay: i * 0.04 },
  }),
};
```

---

## COMPONENT 4 — CONTROL CENTER (new, MUST HAVE — slide 2)

File: `frontend/components/sections/control-center-section.tsx`

### Concept
An OS-grade live dashboard inspired by Jestsee/Aditya's Control Center. Appears as slide 2, immediately after hero. Dark glass card aesthetic. Shows real-time data fetched on client. Mobile-responsive (stack to 1 col).

### Layout
```
<section id="control-center" class="py-16 sm:py-20 bg-[var(--color-surface)]">
  <Container>
    <SectionHeading eyebrow="Control Center" title="Live System Dashboard"
      description="Real-time data streams from GitHub, weather, and system time." />

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <!-- Widget 1: Local Time -->
      <!-- Widget 2: GitHub Activity -->
      <!-- Widget 3: Weather -->
      <!-- Widget 4: Now Playing / Focus status -->
      <!-- Widget 5 (span 2): GitHub Contribution Heatmap mini -->
      <!-- Widget 6: Current Status (availability badge) -->
      <!-- Widget 7: Location -->
      <!-- Widget 8: Coffee count / Fun metric -->
    </div>
  </Container>
</section>
```

### Widget specs (implement each as its own sub-component in `components/sections/control-center/`)

**Widget: LocalTimeClock**
- `setInterval` every second updating `new Date()`
- Display: `HH:MM:SS` in large monospace font + timezone label `"America/Chicago"`
- Analog clock SVG (optional) or digital only
- Glass card with subtle tick animation on seconds hand

**Widget: GitHubActivity**
- Fetch: `GET https://api.github.com/users/bhargavborra/events?per_page=5`
- Use `useEffect` with `SWR` or plain `fetch` with 5-min cache (`revalidate: 300`)
- Show: last 3 event types (PushEvent, PullRequestEvent, etc.) with icons
- Loading: skeleton pulse animation
- Error: "GitHub data unavailable" gracefully

**Widget: WeatherWidget**
- Fetch: `GET https://wttr.in/Kansas+City?format=j1` (no API key needed)
- Parse: `current_condition[0].temp_F`, `weatherDesc[0].value`, `weatherIconUrl[0].value`
- Display: temperature + condition icon (use weather emoji mapping, no external images)
- Cache 10 minutes via `localStorage` timestamp check
- Error state: "Kansas City · Weather unavailable"

**Widget: AvailabilityStatus**
- Hard-coded but editable in `portfolio-content.ts`:
  ```ts
  controlCenter: {
    availability: "open-to-opportunities", // "open-to-opportunities" | "employed" | "selective"
    availabilityNote: "Open to senior/staff IC and tech lead roles",
    location: "Kansas City, MO",
    timezone: "CT (UTC-6)",
    coffeeCount: 847, // fun running total
  }
  ```
- Show a pulsing green dot for "open-to-opportunities", yellow for "selective", gray for "employed"

**Widget: FocusTrack** (fun metric)
- Coffee count from content with a `+1` animation on mount
- Or: "Deep work streak: 4 days" — hard-coded from content

**Widget: LocationCard**
- "Kansas City, MO" with a simple SVG map pin icon
- Shows timezone offset + local time relative to UTC

**Widget: MiniHeatmap**
- Fetch `https://github-contributions-api.jogruber.de/v4/bhargavborra?y=last`
- Render a simplified 12-week × 7-day grid of colored squares
- Color: `var(--color-accent)` at varying opacities (0.15 / 0.35 / 0.6 / 1.0)
- Loading: 84 gray skeleton squares

**Widget: TechStack** (always available)
- Static list of top 5 current primary technologies from `portfolioContent.skills`
- Rendered as small icon + name pills in the card

### Styling all widgets
Each widget is a `glass-surface` or `surface-panel` card with:
```css
rounded-2xl p-4 space-y-2
/* title */
text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-ink)]
/* value */
text-2xl font-bold text-[var(--color-ink)] tabular-nums
```

Skeleton loading state: `animate-pulse bg-[var(--color-border)] rounded` placeholders.

---

## COMPONENT 5 — ABOUT SECTION (keep, enhance)

File: `frontend/components/sections/about-section.tsx`

Keep existing content. Add these refinements:
- If `portfolioContent.identity.avatarUrl` is set, render a circular avatar with a subtle ring using `--color-accent`
- Add a "Currently at" chip with animated green pulse dot
- Add `portfolioContent.identity.bio` multi-paragraph support (split on `\n\n`)
- Link to resume download using `getResumeHref()` from `profile-links.ts`

---

## COMPONENT 6 — SKILLS SECTION (keep, minor refinements)

File: `frontend/components/sections/skills-section.tsx`

The existing implementation is good. Make these precise changes only:

1. **Glow intensity:** Increase from `36` hex alpha to `4D` (30% opacity) in the radial gradient: `${skill.brandColor}4D`
2. **Hover transition:** Change `duration-200` to `duration-300` on the icon for smoother reveal
3. **Filter tab accessibility:** Add `role="toolbar"` is already there — ensure `aria-label` says "Filter skills by category"
4. **Grid:** Keep `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (update from current 2/3 to show 4 per row on lg)

---

## COMPONENT 7 — EXPERIENCE SECTION (full redesign: horizontal 3-column)

File: `frontend/components/sections/experience-section.tsx`

**COMPLETELY REPLACE** the existing tabbed vertical timeline. The new design uses **3 persistent columns side by side**, not tabs.

### Layout
```
<section id="experience" ...>
  <SectionHeading eyebrow="Experience" title="Background at a glance" ... />

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
    <!-- Column 1: Education -->
    <ExperienceColumn type="education" items={portfolioContent.experience.education} />

    <!-- Column 2: Work (center, visually emphasized) -->
    <ExperienceColumn type="work" items={portfolioContent.experience.work} featured />

    <!-- Column 3: Certifications -->
    <ExperienceColumn type="certifications" items={portfolioContent.experience.certifications} />
  </div>
</section>
```

### ExperienceColumn component (create in same file or split)
```tsx
function ExperienceColumn({
  type, items, featured = false
}: {
  type: "education" | "work" | "certifications";
  items: ExperienceEntry[];
  featured?: boolean;
}) {
  const labels = {
    education: { eyebrow: "Education", icon: LuGraduationCap },
    work: { eyebrow: "Work History", icon: LuBriefcase },
    certifications: { eyebrow: "Certifications", icon: LuAward },
  };

  return (
    <div class={`surface-panel rounded-3xl p-5 space-y-5 ${featured ? "ring-1 ring-[var(--color-accent)]/30" : ""}`}>
      <!-- Column header -->
      <div class="flex items-center gap-2">
        <Icon class="text-[var(--color-accent)]" size={16} aria-hidden />
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {label.eyebrow}
        </p>
      </div>

      <!-- Timeline within column -->
      <ol class="space-y-5 border-l border-[color:var(--color-border)/0.6] pl-4">
        {items.map((item) => (
          <li key={...} class="relative space-y-1">
            <span aria-hidden class="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">{item.period}</p>
            <h3 class="text-sm font-semibold text-[var(--color-ink)] leading-snug">{item.title}</h3>
            <p class="text-xs text-[var(--color-muted-ink)]">{item.organization}</p>
            {/* Work highlights only — hide on education/certs for space */}
            {type === "work" && item.highlights?.slice(0, 2).map(h => (
              <p class="text-xs text-[var(--color-muted-ink)] leading-relaxed">· {h}</p>
            ))}
            {item.href && (
              <a href={item.href} target="_blank" rel="noopener noreferrer"
                class="text-xs font-semibold text-[var(--color-accent)] underline underline-offset-2">
                View credential →
              </a>
            )}
          </li>
        ))}
      </ol>

      {items.length === 0 && (
        <p class="text-xs text-[var(--color-muted-ink)]">
          Add entries in portfolio-content.ts
        </p>
      )}
    </div>
  );
}
```

**Import icons:**
```tsx
import { LuGraduationCap, LuBriefcase, LuAward } from "lucide-react";
// or from "react-icons/lu": { LuGraduationCap, LuBriefcase, LuAward }
```

---

## COMPONENT 8 — PROJECTS SECTION (full redesign: horizontal scroll + blueprint)

File: `frontend/components/sections/projects-section.tsx`

### Concept
Projects scroll **horizontally** on a single row. Each card is presented in a **blueprint / technical drawing aesthetic** — dark navy/teal background, white line art, grid lines, annotation arrows, monospace labels. Think: architectural CAD drawing, circuit board schematic.

### Layout
```tsx
<section id="projects" class="py-16 sm:py-20 overflow-hidden">
  <Container>
    <SectionHeading eyebrow="Projects" title="Engineering at scale"
      description="Select builds across cloud infrastructure, ML, and platform engineering." />
  </Container>

  <!-- Horizontal scroll container (extends past Container bounds) -->
  <div class="mt-8 px-4 sm:px-6 lg:px-8">
    <div
      class="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar cursor-grab active:cursor-grabbing"
      ref={scrollRef}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {portfolioContent.projects.map((project, i) => (
        <BlueprintProjectCard key={project.title} project={project} index={i} />
      ))}

      <!-- End spacer -->
      <div class="shrink-0 w-4" />
    </div>

    <!-- Scroll hint -->
    <p class="text-xs text-[var(--color-muted-ink)] text-center mt-2">Drag to scroll · {count} projects</p>
  </div>
</section>
```

### BlueprintProjectCard component
```tsx
// Each card: 320px wide × ~420px tall, shrink-0, snap-center
// Blueprint styling:

function BlueprintProjectCard({ project, index }: { project: ProjectSummary; index: number }) {
  return (
    <article
      class="shrink-0 snap-center w-[min(80vw,320px)] rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #071422 100%)",
        border: "1px solid rgba(100,160,255,0.25)",
      }}
    >
      <!-- Blueprint grid background -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden>
        {/* CSS grid pattern via repeating-linear-gradient */}
        <div style={{
          backgroundImage: `
            linear-gradient(rgba(100,160,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,160,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
          width: "100%",
          height: "100%",
        }} />
      </div>

      <!-- Corner registration marks -->
      <div class="absolute top-3 left-3 w-4 h-4 border-l border-t border-[rgba(100,160,255,0.4)]" aria-hidden />
      <div class="absolute top-3 right-3 w-4 h-4 border-r border-t border-[rgba(100,160,255,0.4)]" aria-hidden />
      <div class="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-[rgba(100,160,255,0.4)]" aria-hidden />
      <div class="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-[rgba(100,160,255,0.4)]" aria-hidden />

      <!-- Card content -->
      <div class="relative p-6 space-y-4">
        <!-- Index label (blueprint annotation style) -->
        <p class="font-mono text-[10px] text-[rgba(100,160,255,0.6)] uppercase tracking-widest">
          PRJ-{String(index + 1).padStart(3, "0")} / {project.category}
        </p>

        <!-- Title (blueprint white ink) -->
        <h3 class="text-base font-bold text-white leading-tight font-mono">
          {project.title}
        </h3>

        <!-- Problem statement with annotation arrow -->
        <div class="space-y-1">
          <p class="font-mono text-[9px] text-[rgba(100,160,255,0.5)] uppercase tracking-widest">
            ↳ PROBLEM
          </p>
          <p class="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
            {project.problem ?? project.description}
          </p>
        </div>

        <!-- Approach/solution -->
        {project.approach && (
          <div class="space-y-1">
            <p class="font-mono text-[9px] text-[rgba(100,160,255,0.5)] uppercase tracking-widest">
              ↳ APPROACH
            </p>
            <p class="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
              {project.approach}
            </p>
          </div>
        )}

        <!-- Tech tags -->
        <div class="flex flex-wrap gap-1.5">
          {project.techStack.map(tech => (
            <span key={tech} class="font-mono text-[9px] px-2 py-0.5 rounded border border-[rgba(100,160,255,0.25)] text-[rgba(100,160,255,0.8)] bg-[rgba(100,160,255,0.06)]">
              {tech}
            </span>
          ))}
        </div>

        <!-- Metrics row -->
        {project.metrics && (
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(100,160,255,0.15)]">
            {project.metrics.map(m => (
              <div key={m.label}>
                <p class="font-mono text-sm font-bold text-white">{m.value}</p>
                <p class="font-mono text-[9px] text-[rgba(100,160,255,0.5)]">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        <!-- CTA -->
        <div class="pt-2">
          {project.linkState === "configured" ? (
            <a href={project.liveUrl ?? project.repoUrl ?? "#"} target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-white border border-[rgba(100,160,255,0.4)] px-3 py-2 rounded-lg hover:bg-[rgba(100,160,255,0.1)] transition-colors font-mono">
              View Project →
            </a>
          ) : (
            <span class="inline-flex items-center gap-1.5 text-xs font-mono text-[rgba(100,160,255,0.5)] border border-[rgba(100,160,255,0.2)] px-3 py-2 rounded-lg">
              Available on request
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
```

### Drag-to-scroll implementation
```tsx
const scrollRef = useRef<HTMLDivElement>(null);
const dragStartX = useRef(0);
const dragScrollLeft = useRef(0);
const isDragging = useRef(false);

const handleDragStart = (e: React.MouseEvent) => {
  if (!scrollRef.current) return;
  isDragging.current = true;
  dragStartX.current = e.pageX - scrollRef.current.offsetLeft;
  dragScrollLeft.current = scrollRef.current.scrollLeft;
};

const handleDragMove = (e: React.MouseEvent) => {
  if (!isDragging.current || !scrollRef.current) return;
  e.preventDefault();
  const x = e.pageX - scrollRef.current.offsetLeft;
  const walk = (x - dragStartX.current) * 1.5;
  scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
};

const handleDragEnd = () => { isDragging.current = false; };
```

### portfolio-content.ts additions needed for projects
Add `problem`, `approach`, `metrics` fields to `ProjectSummary`:
```ts
interface ProjectSummary {
  // ... existing fields ...
  problem?: string;      // 1-2 sentence problem statement
  approach?: string;     // 1-2 sentence solution approach
  metrics?: Array<{ label: string; value: string }>;  // e.g. [{label:"Cost Reduction",value:"40%"}]
}
```

Update the 3 existing projects with real metrics from resume:
- **Capital One AWS Migration**: `metrics: [{value:"40%",label:"Cost Reduction"},{value:"99.9%",label:"Uptime"}]`
- **Accenture Enterprise Cloud**: `metrics: [{value:"60%",label:"Deploy Speed"},{value:"30%",label:"Resource Savings"}]`
- **ML Transaction Intelligence**: `metrics: [{value:"25%",label:"Fraud Reduction"},{value:"1M+",label:"Transactions/Day"}]`

---

## COMPONENT 9 — BLOGS SECTION (new, graceful empty state)

File: `frontend/components/sections/blogs-section.tsx`

```tsx
import { LuRss, LuExternalLink } from "react-icons/lu";
import { SectionShell } from "@/components/ui/section-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { portfolioContent } from "@/content/portfolio-content";

export function BlogsSection() {
  const articles = portfolioContent.articles ?? [];

  return (
    <SectionShell id="blogs" labelledBy="blogs-title">
      <div class="space-y-8">
        <SectionHeading
          id="blogs-title"
          eyebrow="Writing"
          title="Ideas and technical deep dives"
          description="Occasional writing on distributed systems, cloud architecture, and engineering culture."
        />

        {articles.length > 0 ? (
          <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <li key={article.slug}>
                <a href={article.href} target={article.isExternal ? "_blank" : undefined}
                   rel={article.isExternal ? "noopener noreferrer" : undefined}
                   class="group surface-panel block rounded-2xl p-5 space-y-3 hover:ring-1 hover:ring-[var(--color-accent)]/30 transition-all">
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                    {article.publishedAt}
                  </p>
                  <h3 class="text-sm font-semibold text-[var(--color-ink)] leading-snug group-hover:text-[var(--color-accent)] transition-colors">
                    {article.title}
                  </h3>
                  <p class="text-xs text-[var(--color-muted-ink)] leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <!-- Empty state -->
          <div class="surface-panel rounded-3xl p-10 text-center space-y-4">
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <LuRss size={20} class="text-[var(--color-muted-ink)]" aria-hidden />
            </div>
            <div>
              <p class="text-sm font-semibold text-[var(--color-ink)]">Coming soon</p>
              <p class="text-xs text-[var(--color-muted-ink)] mt-1">
                Writing in progress. Check back or follow on{" "}
                <a href="https://dev.to" target="_blank" rel="noopener noreferrer"
                   class="font-semibold text-[var(--color-accent)] underline underline-offset-2">
                  Dev.to
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
```

---

## COMPONENT 10 — CONTACT + FOOTER (combined, cinematic Adaline-inspired)

File: `frontend/components/sections/contact-footer-section.tsx`

### Concept
Contact form + footer are **one seamless section**. As you scroll down through the contact form, the footer appears below with a **cinematic sky transition**: the background morphs from a warm morning gradient → deep aurora lights (purples, greens) → dark night with mountain silhouette at the very bottom.

This is achieved with a tall section + `useScroll` + `useTransform` from Framer Motion.

### Structure
```tsx
"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export function ContactFooterSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  // Sky gradient transitions via scroll
  // 0.0 → morning: warm orange/pink dawn
  // 0.4 → aurora: purple/teal/green
  // 0.8 → night: deep navy with mountain silhouette

  const skyOpacityMorning = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const skyOpacityAurora = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);
  const skyOpacityNight = useTransform(scrollYProgress, [0.65, 1.0], [0, 1]);

  return (
    <section ref={sectionRef} id="contact" aria-labelledby="contact-title"
      class="relative min-h-[200vh] overflow-hidden">

      <!-- Sky layers (absolute, full height, stacked) -->
      <div class="sticky top-0 h-svh w-full overflow-hidden -z-10" aria-hidden>

        <!-- Morning layer -->
        <motion.div style={{ opacity: skyOpacityMorning }} class="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 60%, #FF7E45 0%, #FF9B7A 20%, #FFB6A0 40%, #FFC8B0 55%, #FFDDC8 70%, #E8B8D0 85%, #C8A0E0 100%)"
          }} />

        <!-- Aurora layer -->
        <motion.div style={{ opacity: skyOpacityAurora }} class="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 30% 40%, rgba(0,255,150,0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(100,0,255,0.5) 0%, transparent 50%), linear-gradient(180deg, #0a0a2e 0%, #1a1040 30%, #0d1f35 60%, #060d1a 100%)"
          }} />

        <!-- Night layer -->
        <motion.div style={{ opacity: skyOpacityNight }} class="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #020410 0%, #060d1a 40%, #0d1520 70%, #152030 100%)"
          }}>
          <!-- Mountain silhouette SVG -->
          <svg class="absolute bottom-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice" aria-hidden>
            <path d="M0,200 L0,160 L120,80 L240,140 L360,60 L480,120 L600,40 L720,100 L840,30 L960,110 L1080,50 L1200,130 L1320,70 L1440,140 L1440,200 Z"
              fill="#0a1020" />
          </svg>
          <!-- Stars (small circles) -->
          {Array.from({length: 60}, (_, i) => (
            <circle key={i} cx={`${(i * 37 + 13) % 100}%`} cy={`${(i * 19 + 7) % 60}%`}
              r={i % 5 === 0 ? "1.5" : "0.8"} fill="white" opacity={0.4 + (i % 3) * 0.2} />
          ))}
        </motion.div>
      </div>

      <!-- Scrollable content (positioned over sticky sky) -->
      <div class="relative pt-20 pb-32">
        <Container>

          <!-- Contact form -->
          <div class="max-w-xl mx-auto space-y-8">
            <SectionHeading
              id="contact-title"
              eyebrow="Contact"
              title="Let's build something together"
              description="Open to senior IC, staff engineer, and tech lead opportunities. Response within 24 hours."
            />

            <ContactForm />  {/* existing form component */}
          </div>

          <!-- Footer content (below form) -->
          <footer class="mt-32 pt-16 border-t border-[rgba(255,255,255,0.1)]">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p class="text-sm font-semibold text-white">Bhargav Patel</p>
                <p class="text-xs text-[rgba(255,255,255,0.5)]">Software Engineer · Kansas City, MO</p>
              </div>
              <div class="flex items-center gap-4">
                {/* Social links - white/muted on dark night background */}
                <a href={githubHref} target="_blank" rel="noopener noreferrer"
                   class="text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
                  <FaGithub size={16} aria-label="GitHub" />
                </a>
                <a href={linkedinHref} target="_blank" rel="noopener noreferrer"
                   class="text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
                  <FaLinkedinIn size={16} aria-label="LinkedIn" />
                </a>
              </div>
              <p class="text-xs text-[rgba(255,255,255,0.3)]">
                © {new Date().getFullYear()} Bhargav Patel. Built with Next.js.
              </p>
            </div>
          </footer>
        </Container>
      </div>
    </section>
  );
}
```

**Important implementation notes:**
- The contact form already exists in `frontend/components/sections/contact-section.tsx` or similar. Extract just the `<form>` portion as a reusable `<ContactForm />` component.
- The sticky sky background technique: outer section is `min-h-[200vh]`, inner sky div is `position: sticky; top: 0; height: 100svh` — this makes the sky "stay put" while content scrolls over it.
- All text in the footer zone must be light (white/rgba) since the background goes dark.
- `prefers-reduced-motion`: if true, skip the sky transition — render only the night layer static.

---

## COMPONENT 11 — COMMAND PALETTE (new)

File: `frontend/components/layout/command-palette.tsx`

Use `cmdk` library. Install if not present: `npm install cmdk`.

```tsx
"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

const sections = [
  { id: "hero", label: "Home" },
  { id: "control-center", label: "Control Center" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "blogs", label: "Blog" },
  { id: "contact", label: "Contact" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("portfolio:open-command-palette", handleOpen);
    return () => window.removeEventListener("portfolio:open-command-palette", handleOpen);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigateTo = (sectionId: string) => {
    setOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <!-- Backdrop -->
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <!-- Palette -->
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            class="fixed left-1/2 top-[20%] z-50 w-[min(90vw,500px)] -translate-x-1/2"
          >
            <Command
              class="glass-surface rounded-2xl overflow-hidden shadow-2xl"
              loop
            >
              <Command.Input
                placeholder="Search sections or actions..."
                class="w-full bg-transparent px-4 py-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)] outline-none border-b border-[var(--color-border)]"
              />
              <Command.List class="max-h-64 overflow-y-auto p-2">
                <Command.Empty class="py-6 text-center text-sm text-[var(--color-muted-ink)]">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigate" class="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[var(--color-muted-ink)]">
                  {sections.map((s) => (
                    <Command.Item
                      key={s.id}
                      value={s.label}
                      onSelect={() => navigateTo(s.id)}
                      class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] aria-selected:bg-[color:var(--glass-bg-strong)] cursor-pointer"
                    >
                      <LuHash size={14} class="text-[var(--color-muted-ink)]" aria-hidden />
                      {s.label}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions">
                  <Command.Item value="Toggle theme" onSelect={() => { toggleTheme(); setOpen(false); }}
                    class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] aria-selected:bg-[color:var(--glass-bg-strong)] cursor-pointer">
                    <LuSunMoon size={14} class="text-[var(--color-muted-ink)]" aria-hidden />
                    Toggle theme
                  </Command.Item>
                  <Command.Item value="Download resume" onSelect={() => { window.open(resumeHref, "_blank"); setOpen(false); }}
                    class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] aria-selected:bg-[color:var(--glass-bg-strong)] cursor-pointer">
                    <LuFileText size={14} class="text-[var(--color-muted-ink)]" aria-hidden />
                    Download resume
                  </Command.Item>
                  <Command.Item value="Send email" onSelect={() => { window.location.href = `mailto:${email}`; setOpen(false); }}
                    class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] aria-selected:bg-[color:var(--glass-bg-strong)] cursor-pointer">
                    <LuMail size={14} class="text-[var(--color-muted-ink)]" aria-hidden />
                    Send email
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div class="border-t border-[var(--color-border)] px-3 py-2 flex items-center gap-4 text-[10px] text-[var(--color-muted-ink)]">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## COMPONENT 12 — AI COMPANION FAB (right-bottom)

File: `frontend/components/layout/ai-companion-fab.tsx`

A pulsing FAB in the bottom-right corner. Phase 2 placeholder — clicking shows a "coming soon" tooltip.

```tsx
"use client";

import { useState } from "react";
import { LuBot } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { useLowerOverlaySuppression } from "@/components/layout/use-lower-overlay-suppression";

export function AiCompanionFab() {
  const [showTooltip, setShowTooltip] = useState(false);
  const isSuppressed = useLowerOverlaySuppression();

  return (
    <div class={`fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-5 z-40 transition-all duration-200 ${
      isSuppressed ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100"
    }`}>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            class="glass-surface absolute bottom-full right-0 mb-2 w-48 rounded-xl p-3 text-xs text-[var(--color-muted-ink)]"
          >
            <p class="font-semibold text-[var(--color-ink)] mb-1">AI Companion</p>
            <p>Coming soon — will answer questions about Bhargav's work and experience.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label="AI Companion (coming soon)"
        onClick={() => setShowTooltip((p) => !p)}
        class="glass-surface relative inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-ink)]"
      >
        <!-- Pulsing ring -->
        <span class="absolute inset-0 rounded-full animate-ping bg-[var(--color-accent)] opacity-20" aria-hidden />
        <LuBot size={18} aria-hidden />
      </button>
    </div>
  );
}
```

---

## HOME SHELL UPDATE

File: `frontend/components/layout/home-shell.tsx`

Update section order to exactly:
```tsx
<>
  <EntranceCurtain onDone={() => setShowContent(true)} />

  {showContent && (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ControlCenterSection />
        <AboutSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <BlogsSection />
        <ContactFooterSection />
      </main>
      <QuickAccessDock />
      <AiCompanionFab />
      <CommandPalette />
    </>
  )}
</>
```

---

## QUICK ACCESS DOCK UPDATE

File: `frontend/components/layout/quick-access-dock.tsx`

The dock is already correct. Verify it contains all 4 items: GitHub, LinkedIn, Resume, Email. Confirm suppression works near footer.

If `portfolioContent.identity.twitterUrl` or `portfolioContent.identity.devToUrl` exist, add them as items. No other changes needed.

---

## GLOBALS.CSS ADDITIONS

Add to `frontend/app/globals.css`:

```css
/* Blueprint card grid pattern (used in projects section) */
.blueprint-grid {
  background-image:
    linear-gradient(rgba(100, 160, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 160, 255, 0.06) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Ping animation for AI companion */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* No scrollbar utility (already present — verify) */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## PORTFOLIO-CONTENT.TS ADDITIONS

Add these fields to the existing interfaces/content:

```ts
// Add to identity:
controlCenter: {
  availability: "open-to-opportunities" as const,
  availabilityNote: "Open to senior/staff IC and tech lead roles in cloud, platform, or full-stack engineering",
  location: "Kansas City, MO",
  timezone: "Central Time (CT)",
  coffeeCount: 847,
  githubUsername: "bhargavborra",
  weatherLocation: "Kansas City",
  weatherTimezone: "America/Chicago",
},

// Add to each ProjectSummary:
// Capital One:
problem: "Legacy monolith creating deployment bottlenecks and 3× higher cloud costs than industry benchmark.",
approach: "Designed microservices migration with blue-green deployments and auto-scaling ECS clusters.",
metrics: [{ value: "40%", label: "Cost Reduction" }, { value: "99.9%", label: "Uptime SLA" }],

// Accenture:
problem: "Manual multi-cloud deployments taking 2 weeks and causing configuration drift across environments.",
approach: "Built Terraform modules + GitHub Actions pipelines with environment parity across AWS/Azure/GCP.",
metrics: [{ value: "60%", label: "Faster Deploys" }, { value: "30%", label: "Resource Savings" }],

// ML:
problem: "Rule-based fraud detection missing 35% of sophisticated patterns, costing $2M+ annually.",
approach: "Implemented ensemble ML models with real-time feature engineering on streaming transaction data.",
metrics: [{ value: "25%", label: "Fraud Reduction" }, { value: "1M+", label: "Txns/Day" }],
```

---

## ACCESSIBILITY REQUIREMENTS

All new components must:
1. Work with keyboard only (Tab, Enter, Escape, Arrow keys where applicable)
2. Have `aria-label` on all icon-only buttons
3. Pass `aria-hidden` on all decorative elements
4. Honor `prefers-reduced-motion` — wrap animations in `if (!prefersReducedMotion)` checks
5. Minimum touch target: `min-h-11 min-w-11` (44px) on all interactive elements
6. Focus visible: use `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` on interactive elements

---

## PERFORMANCE REQUIREMENTS

1. Control Center widgets: use `Suspense` boundaries + skeleton loading states
2. All `useEffect` fetches: include cleanup, respect AbortController
3. Weather/GitHub data: cache in `localStorage` with timestamp, expire appropriately (10min weather, 5min GitHub)
4. Images: use `next/image` with `loading="lazy"` where applicable
5. Framer Motion: dynamic import motion components if bundle size becomes concern: `import dynamic from "next/dynamic"`

---

## TESTING CHECKLIST (verify before completion)

- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] `npm run lint` passes with 0 errors
- [ ] Entrance curtain fires → 3 languages → fades out
- [ ] All 8 section nav pills appear in header and highlight on scroll
- [ ] Control Center: all 6+ widgets render (with skeleton/error states)
- [ ] GitHub widget: fetches real events (or shows error state)
- [ ] Weather widget: shows temperature (or shows error state)
- [ ] Hero: words scatter on hover, reassemble on mouse leave
- [ ] Experience: 3 columns visible on md+ breakpoints, stacks on mobile
- [ ] Projects: horizontal scroll works with drag on desktop, touch on mobile
- [ ] Blogs: empty state renders cleanly
- [ ] Contact form: submits (logs to console acceptable), shows success state
- [ ] Footer sky: gradient transitions visible when scrolling through contact section
- [ ] Cmd+K opens command palette, ESC closes it
- [ ] AI companion FAB visible bottom-right, tooltip on click
- [ ] Dock visible bottom-left, expands on hover/tap
- [ ] Both dock and FAB hide when near contact/footer section
- [ ] Theme toggle: cycles Light → Dark → System correctly
- [ ] Mobile (375px): all sections readable, touch targets ≥44px, no horizontal overflow (except project scroll)
- [ ] Dark mode: all glass tokens render correctly, no white-on-white text
- [ ] `prefers-reduced-motion: reduce`: no animations fire, static layouts only

---

## FILE CREATION SUMMARY

Create or modify these files:
```
frontend/components/sections/hero-section.tsx           ← REPLACE
frontend/components/sections/control-center-section.tsx  ← CREATE NEW
frontend/components/sections/control-center/             ← CREATE DIR
  local-time-clock.tsx
  github-activity.tsx
  weather-widget.tsx
  availability-status.tsx
  mini-heatmap.tsx
  location-card.tsx
frontend/components/sections/experience-section.tsx     ← REPLACE
frontend/components/sections/projects-section.tsx       ← REPLACE
frontend/components/sections/blogs-section.tsx          ← CREATE NEW
frontend/components/sections/contact-footer-section.tsx ← CREATE NEW
frontend/components/layout/command-palette.tsx          ← CREATE NEW
frontend/components/layout/ai-companion-fab.tsx         ← CREATE (replace placeholder)
frontend/components/layout/home-shell.tsx               ← UPDATE section order
frontend/components/layout/site-header.tsx              ← UPDATE theme toggle, section IDs
frontend/content/portfolio-content.ts                   ← ADD controlCenter + project fields
frontend/app/globals.css                                ← ADD blueprint-grid, ping utilities
```

Do NOT modify:
- `frontend/components/layout/quick-access-dock.tsx` (unless adding Twitter/Dev.to)
- `frontend/components/sections/skills-section.tsx` (only minor glow/grid tweak)
- `frontend/components/motion/entrance-curtain.tsx` (verify only)
- `frontend/lib/` files
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`

---

*End of Phase 2 implementation spec. Implement all components top-to-bottom, run `npm run build` after each major component, and fix any TypeScript errors before proceeding to the next. Do not skip any section.*
