# CODEX FINAL IMPLEMENTATION PROMPT
## Portfolio: Bhargava Teja Borra — Full Vision Pass

---

## CRITICAL RULES BEFORE YOU TOUCH A SINGLE FILE

1. **Read every file you are about to modify first.** No blind writes.
2. **Run `npm run build` after every component group** — fix TypeScript errors before moving on.
3. **Do not defer anything.** Every item in this prompt is required now, not Phase 2.
4. **The current state** is visible in the PDF screenshot — study it. Here is what exists vs what must change.

---

## CURRENT STATE AUDIT (from screenshot)

**Already correct — do NOT break these:**
- Name "Bhargava Teja Borra" in header top-left ✅
- "AT A GLANCE" section title ✅
- Dallas, TX location card ✅
- Local time clock ✅
- Horizontal tab bar in Experience (Education / Work History / Certifications) ✅
- Blueprint project cards with horizontal scroll ✅
- Morning→Aurora→Night gradient in footer zone ✅
- Contact form + footer combined ✅
- Entrance curtain (3 languages) ✅

**Must change — every item below is a required fix:**
- ❌ "N" circle on left → Replace with links dock (see Section A)
- ❌ ⌘K button visible in header → Remove button, keep only keyboard shortcut
- ❌ Monitor icon in top-right is wrong shape → Replace theme toggle (see Section B)
- ❌ No door/login icon in hero → Add it (see Section C)
- ❌ "About / My Work / Projects / Experience / Skills / Contact" nav → Rename + reposition (see Section D)
- ❌ Hero background is static gradient → Animated Adaline-style gradient (see Section E)
- ❌ GitHub Activity says "data unavailable" → Replace with COBE globe (see Section F)
- ❌ "Spotify module pending" placeholder → Real Spotify integration (see Section G)
- ❌ Skill icons are generic placeholders → Real SVG brand logos with Sanchit glow (see Section H)
- ❌ "Primary Stack" widget in Control Center → Remove it entirely
- ❌ "GitHub heat map" widget → Remove it entirely

---

## SECTION A — LINKS DOCK (replacing the "N" circle)

**File:** `frontend/components/layout/quick-access-dock.tsx`

**What to build:** A circular FAB in the **bottom-left** corner. At rest it shows a **link-chain icon** (LuLink2 from lucide-react). On click/tap it expands into a **vertical stack of social icons** — each icon has its own brand color glow exactly like Sanchit Agarwal's portfolio (https://sanchitagarwal7.github.io/portfolio_react/).

### Exact Sanchit glow effect

Each social icon button:
- **At rest:** `filter: grayscale(100%)` + `opacity: 0.5`
- **On hover:** `filter: grayscale(0%) drop-shadow(0 0 10px VAR_BRAND_COLOR)` + `opacity: 1` + card background gets a subtle radial glow in brand color
- **Transition:** `transition: filter 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease`

Brand colors per platform:
```
GitHub:    #ffffff (white glow, dark bg icon)
LinkedIn:  #0A66C2
Twitter/X: #1DA1F2
Email:     #EA4335
Resume:    #10B981 (teal/green)
```

### Full implementation

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuLink2,
  LuX,
  LuMail,
  LuFileText,
} from "react-icons/lu";
import { FaGithub, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { portfolioContent } from "@/content/portfolio-content";

const LINKS = [
  {
    id: "github",
    label: "GitHub",
    icon: FaGithub,
    href: `https://github.com/${portfolioContent.identity.githubUsername}`,
    color: "#ffffff",
    bg: "rgba(255,255,255,0.08)",
    external: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: FaLinkedinIn,
    href: `https://linkedin.com/in/${portfolioContent.identity.linkedinUsername}`,
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.12)",
    external: true,
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: FaXTwitter,
    href: "https://x.com/",
    color: "#1DA1F2",
    bg: "rgba(29,161,242,0.10)",
    external: true,
  },
  {
    id: "email",
    label: "Email",
    icon: LuMail,
    href: `mailto:${portfolioContent.identity.email}`,
    color: "#EA4335",
    bg: "rgba(234,67,53,0.10)",
    external: false,
  },
  {
    id: "resume",
    label: "Resume",
    icon: LuFileText,
    href: portfolioContent.identity.resumeHref,
    color: "#10B981",
    bg: "rgba(16,185,129,0.10)",
    external: true,
  },
];

export function QuickAccessDock() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-5 z-40 flex flex-col-reverse items-center gap-2"
      role="navigation"
      aria-label="Social links"
    >
      {/* Trigger button */}
      <motion.button
        type="button"
        aria-label={isOpen ? "Close links" : "Open links"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((p) => !p)}
        whileTap={{ scale: 0.92 }}
        className="glass-surface relative flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-ink)] shadow-lg"
      >
        <motion.span
          key={isOpen ? "close" : "open"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {isOpen ? <LuX size={18} aria-hidden /> : <LuLink2 size={18} aria-hidden />}
        </motion.span>
      </motion.button>

      {/* Social icon stack */}
      <AnimatePresence>
        {isOpen &&
          LINKS.map((link, i) => (
            <motion.a
              key={link.id}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              aria-label={link.label}
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.85 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 28 }}
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300"
              style={
                {
                  "--icon-color": link.color,
                  "--icon-bg": link.bg,
                } as React.CSSProperties
              }
              // On hover: applied via Tailwind group-hover + CSS custom prop
            >
              {/* Background glow blob (appears on hover) */}
              <span
                className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at center, ${link.bg} 0%, transparent 70%)` }}
                aria-hidden
              />

              {/* Icon */}
              <link.icon
                size={17}
                aria-hidden
                className="relative z-10 transition-all duration-300"
                style={{
                  filter: "grayscale(100%)",
                  opacity: 0.55,
                }}
                // CSS-in-JS hover handled via :hover pseudo below or inline group-hover
              />

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg bg-[var(--color-ink)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-bg)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {link.label}
              </span>
            </motion.a>
          ))}
      </AnimatePresence>
    </div>
  );
}
```

**IMPORTANT — add this CSS to `globals.css`** for the icon color-reveal on hover (CSS-only, GPU-accelerated):
```css
/* Dock social icon hover: grayscale → brand color glow */
.group:hover .dock-icon {
  filter: grayscale(0%) drop-shadow(0 0 10px var(--icon-color)) !important;
  opacity: 1 !important;
}
```

Add `className="relative z-10 dock-icon transition-all duration-300"` to the icon component.

---

## SECTION B — HEADER FIXES

**File:** `frontend/components/layout/site-header.tsx`

### Changes required:

**1. Remove the ⌘K command palette button entirely.** It should not be visible. Delete the `<button>` that triggers the command palette. The command palette still works via `Cmd/Ctrl+K` keyboard shortcut — just no button.

**2. Theme toggle position.** Move theme toggle to be the **last item on the right** in the header top row, after any other controls.

**3. Nav pill bar — rename and reposition:**
- Current: `About | My Work | Projects | Experience | Skills | Contact`
- New labels: `About | My Work | Projects | Experience | Skills | Contact` (keep these)
- **Remove any "Home" pill if it exists**
- **Name in top-left becomes a clickable `<a href="/">` refresh button** — when clicked, scrolls to top / reloads page. Remove underline, add `cursor-pointer`. No other change.
- **Shift the pill nav bar slightly to the right** — change `mx-auto` to `ml-auto mr-8` or use `justify-end` with padding-right. It should not be perfectly centered — offset ~60–80px to the right.

**4. Add DOOR icon** (see Section C).

---

## SECTION C — DOOR ICON (Hero, top-right area)

**Inspiration:** https://adxxya30.vercel.app/ — the developer has a door/arrow icon in the top-right area of the hero section. It looks like an open door / "enter" icon. When you hover it subtly glows. It does NOT link externally — it either scrolls to a section or is purely decorative.

**Implementation:**

Use `LuDoorOpen` from `react-icons/lu` (Lucide).

Add it to the **hero section** top-right, absolutely positioned (not in the nav bar — inside the hero section itself):

```tsx
{/* Inside HeroSection, at the top of the component before main content */}
<div className="absolute top-6 right-6 z-10">
  <a
    href="#about"
    onClick={(e) => {
      e.preventDefault();
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }}
    aria-label="Scroll to About section"
    className="group flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-muted-ink)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-[0_0_16px_rgba(var(--color-accent-rgb),0.3)]"
  >
    <LuDoorOpen size={18} aria-hidden />
  </a>
</div>
```

**Position it:** The hero section (`<section id="hero">`) must have `position: relative` so the absolute child works. The door icon sits top-right corner of the hero viewport.

---

## SECTION D — NAV PILL BAR FINAL STATE

After changes, the header should look exactly like this:

```
[Bhargava Teja Borra (as refresh link)]    [pill nav: About|My Work|Projects|Experience|Skills|Contact]    [ThemeToggle]
```

- No ⌘K button
- No subtitle/role text line under name (if it exists, remove it)
- Nav slightly right of center (not full center)
- Theme toggle is the last icon on the right

---

## SECTION E — HERO BACKGROUND (Adaline-inspired animated gradient)

**File:** `frontend/components/sections/hero-section.tsx`
**File:** `frontend/app/globals.css`

The current hero has a static gradient. Replace with an **animated multi-layer radial gradient** that feels alive — blobs of color slowly drifting.

### Technique (no video, no canvas — pure CSS animations for performance)

Add to `globals.css`:
```css
/* ============================================
   HERO ANIMATED GRADIENT BACKGROUND
   Inspired by adaline.ai: layered radial
   gradients with slow CSS transform drift.
   GPU-accelerated via transform only.
   ============================================ */

.hero-gradient-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.hero-gradient-bg::before,
.hero-gradient-bg::after,
.hero-gradient-bg .blob-3 {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

/* Blob 1: warm peach/rose (top-left) */
.hero-gradient-bg::before {
  width: 60%;
  height: 60%;
  top: -10%;
  left: -5%;
  background: radial-gradient(
    circle,
    rgba(255, 183, 153, 0.55) 0%,
    rgba(255, 150, 180, 0.35) 40%,
    transparent 70%
  );
  animation: hero-blob-1 18s ease-in-out infinite;
}

/* Blob 2: lavender/violet (top-right) */
.hero-gradient-bg::after {
  width: 55%;
  height: 55%;
  top: -5%;
  right: -10%;
  background: radial-gradient(
    circle,
    rgba(200, 160, 240, 0.5) 0%,
    rgba(170, 130, 255, 0.3) 40%,
    transparent 70%
  );
  animation: hero-blob-2 22s ease-in-out infinite;
}

/* Blob 3: soft teal/blue (bottom-center) */
.hero-gradient-bg .blob-3 {
  width: 50%;
  height: 50%;
  bottom: 0;
  left: 25%;
  background: radial-gradient(
    circle,
    rgba(130, 200, 230, 0.4) 0%,
    rgba(100, 160, 255, 0.2) 40%,
    transparent 70%
  );
  animation: hero-blob-3 26s ease-in-out infinite;
}

@keyframes hero-blob-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(4%, 6%) scale(1.05); }
  66%       { transform: translate(-3%, 3%) scale(0.97); }
}
@keyframes hero-blob-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40%       { transform: translate(-5%, 4%) scale(1.07); }
  70%       { transform: translate(3%, -3%) scale(0.96); }
}
@keyframes hero-blob-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(3%, -5%) scale(1.08); }
}

/* Dark mode: shift to cool midnight tones */
.dark .hero-gradient-bg::before {
  background: radial-gradient(
    circle,
    rgba(80, 100, 200, 0.45) 0%,
    rgba(60, 80, 180, 0.25) 40%,
    transparent 70%
  );
}
.dark .hero-gradient-bg::after {
  background: radial-gradient(
    circle,
    rgba(140, 80, 200, 0.4) 0%,
    rgba(100, 50, 180, 0.25) 40%,
    transparent 70%
  );
}
.dark .hero-gradient-bg .blob-3 {
  background: radial-gradient(
    circle,
    rgba(40, 140, 180, 0.35) 0%,
    rgba(30, 100, 160, 0.2) 40%,
    transparent 70%
  );
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .hero-gradient-bg::before,
  .hero-gradient-bg::after,
  .hero-gradient-bg .blob-3 {
    animation: none;
  }
}
```

### Add to hero-section.tsx

Inside the `<section id="hero">` element, as the **first child**:
```tsx
{/* Animated background */}
<div className="hero-gradient-bg" aria-hidden>
  <div className="blob-3" />
</div>

{/* All hero content needs position: relative z-10 to sit above background */}
<div className="relative z-10 ...rest of hero content">
```

The hero section itself: `className="relative overflow-hidden min-h-svh flex flex-col ..."` — ensure `position: relative` and `overflow: hidden`.

---

## SECTION F — CONTROL CENTER: REPLACE WITH COBE GLOBE + REAL DATA

**Files to modify:** `frontend/components/sections/control-center-section.tsx` and any widget files in `frontend/components/sections/control-center/`

### Step 1 — Install dependencies
```bash
cd frontend
npm install cobe swr
```

### Step 2 — REMOVE these widgets entirely
- ❌ `mini-heatmap.tsx` — delete this widget, do NOT render it
- ❌ `tech-stack.tsx` / "Primary Stack" card — delete this widget, do NOT render it

### Step 3 — GLOBE widget (replace GitHub Activity card)

**File:** `frontend/components/sections/control-center/globe-widget.tsx`

**Inspiration:** The COBE library (https://github.com/shuding/cobe) — 5kB WebGL globe. Nelson Lai's portfolio and adxxya30's portfolio both use this pattern.

```tsx
"use client";

import createGlobe, { COBEOptions } from "cobe";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface GlobeWidgetProps {
  markerLocation?: [number, number]; // [lat, lng]
  label?: string;
  sublabel?: string;
}

export function GlobeWidget({
  markerLocation = [32.7767, -96.7970], // Dallas, TX
  label = "Dallas, TX",
  sublabel = "Central Time (CT)",
}: GlobeWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe>>();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 4.5; // Start rotated to show Americas
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const options: COBEOptions = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi,
      theta: 0.25,
      dark: isDark ? 1 : 0,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: isDark ? 6 : 4,
      baseColor: isDark ? [0.15, 0.15, 0.2] : [0.85, 0.88, 0.92],
      markerColor: [0.1, 0.82, 1.0], // cyan accent
      glowColor: isDark ? [0.1, 0.15, 0.3] : [0.9, 0.92, 1.0],
      markers: [
        { location: markerLocation, size: 0.12 },
      ],
      onRender(state) {
        state.phi = phi;
        phi += 0.004; // slow rotation
        state.width = width * 2;
        state.height = width * 2;
      },
    };

    globeRef.current = createGlobe(canvasRef.current, options);

    return () => {
      window.removeEventListener("resize", onResize);
      globeRef.current?.destroy();
    };
  }, [isDark, markerLocation]);

  return (
    <div className="surface-panel rounded-2xl p-4 flex flex-col gap-3">
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
        Location
      </p>

      {/* Globe canvas */}
      <div className="relative mx-auto w-full max-w-[200px] aspect-square">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ borderRadius: "50%" }}
        />
        {/* Pulsing location dot overlay */}
        <div
          className="absolute"
          style={{
            /* Dallas is roughly at 55% from left, 38% from top on a Mercator-ish projection */
            /* These are visual approximations — COBE handles the actual dot */
            bottom: "42%",
            left: "30%",
          }}
          aria-hidden
        />
      </div>

      {/* Location info */}
      <div className="text-center space-y-0.5">
        <p className="text-sm font-bold text-[var(--color-ink)]">{label}</p>
        <p className="text-xs text-[var(--color-muted-ink)]">{sublabel}</p>
      </div>
    </div>
  );
}
```

### Step 4 — GitHub Contributions widget

**File:** `frontend/components/sections/control-center/github-contributions.tsx`

Use the GitHub GraphQL API via a Next.js API route (no token needed for public data with REST):

**API Route:** `frontend/app/api/github-contributions/route.ts`
```ts
import { NextResponse } from "next/server";

const USERNAME = "Tony1btech";

export async function GET() {
  try {
    // Use github-contributions-api (no auth needed for public profiles)
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`,
      { next: { revalidate: 3600 } } // cache 1 hour
    );
    if (!res.ok) throw new Error("Failed to fetch contributions");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 200 });
  }
}
```

**Component:**
```tsx
"use client";

import useSWR from "swr";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Level colors using CSS accent
const LEVEL_OPACITY: Record<number, string> = {
  0: "opacity-10",
  1: "opacity-30",
  2: "opacity-55",
  3: "opacity-75",
  4: "opacity-100",
};

export function GitHubContributions() {
  const { data, error } = useSWR("/api/github-contributions", fetcher, {
    revalidateOnFocus: false,
  });

  const weeks: ContributionDay[][] = data?.contributions
    ? (() => {
        const all: ContributionDay[] = data.contributions;
        const last14weeks = all.slice(-98); // 14 weeks × 7 days
        const chunks: ContributionDay[][] = [];
        for (let i = 0; i < last14weeks.length; i += 7) {
          chunks.push(last14weeks.slice(i, i + 7));
        }
        return chunks;
      })()
    : null;

  const total = data?.total?.["lastYear"] ?? null;

  return (
    <div className="surface-panel rounded-2xl p-4 space-y-3 col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          GitHub Activity
        </p>
        {total !== null && (
          <p className="text-xs text-[var(--color-muted-ink)]">
            {total} contributions this year
          </p>
        )}
      </div>

      {error || data?.error ? (
        <p className="text-xs text-[var(--color-muted-ink)]">Activity unavailable</p>
      ) : !weeks ? (
        /* Skeleton */
        <div className="flex gap-1">
          {Array.from({ length: 14 }).map((_, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, di) => (
                <div
                  key={di}
                  className="h-2.5 w-2.5 rounded-sm bg-[var(--color-border)] animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} contributions`}
                  className={`h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)] ${LEVEL_OPACITY[day.level]}`}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <a
        href={`https://github.com/Tony1btech`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
      >
        @Tony1btech →
      </a>
    </div>
  );
}
```

---

## SECTION G — SPOTIFY "NOW PLAYING" WIDGET (Real Integration)

**Source:** Jestsee.com implementation (exactly replicated below).

### Step 1 — Environment variables

Add to `frontend/.env.local`:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token
```

**To get the refresh token:** Use the Spotify OAuth flow once. Full instructions:
1. Create app at https://developer.spotify.com/dashboard
2. Set redirect URI to `http://localhost:3000/callback`
3. Hit `https://accounts.spotify.com/authorize?client_id=YOUR_ID&response_type=code&redirect_uri=http://localhost:3000/callback&scope=user-read-currently-playing,user-read-recently-played`
4. Exchange code for tokens at `/api/token` — save the `refresh_token` permanently.

### Step 2 — API Route

**File:** `frontend/app/api/spotify/route.ts`

```ts
import { NextResponse } from "next/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN!;
const BASE_URL = "https://api.spotify.com/v1/me/player";

async function getAccessToken(): Promise<string> {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export type SpotifyData = {
  songUrl: string;
  title: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
};

export async function GET() {
  // If env vars not set, return placeholder
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return NextResponse.json(
      { isPlaying: false, title: "Configure Spotify", artist: "Set env vars", albumImageUrl: "", songUrl: "#" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const accessToken = await getAccessToken();

    // Try currently playing first
    const nowPlayingRes = await fetch(`${BASE_URL}/currently-playing`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (nowPlayingRes.status === 204) {
      // Nothing playing — get recently played
      const recentRes = await fetch(`${BASE_URL}/recently-played?limit=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const recentData = await recentRes.json();
      const track = recentData.items[0].track;
      return NextResponse.json(
        {
          isPlaying: false,
          songUrl: track.external_urls.spotify,
          title: track.name,
          albumImageUrl: track.album.images[0].url,
          artist: track.artists.map((a: { name: string }) => a.name).join(", "),
        },
        { headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" } }
      );
    }

    const nowData = await nowPlayingRes.json();
    const track = nowData.item;
    return NextResponse.json(
      {
        isPlaying: true,
        songUrl: track.external_urls.spotify,
        title: track.name,
        albumImageUrl: track.album.images[0].url,
        artist: track.artists.map((a: { name: string }) => a.name).join(", "),
      },
      { headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" } }
    );
  } catch {
    return NextResponse.json(
      { isPlaying: false, title: "Not available", artist: "", albumImageUrl: "", songUrl: "#" },
      { status: 200 }
    );
  }
}
```

### Step 3 — Spotify Widget Component

**File:** `frontend/components/sections/control-center/spotify-widget.tsx`

```tsx
"use client";

import useSWR from "swr";
import type { SpotifyData } from "@/app/api/spotify/route";
import { SiSpotify } from "react-icons/si";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SpotifyWidget() {
  const { data, error } = useSWR<SpotifyData>("/api/spotify", fetcher, {
    refreshInterval: 10000, // refresh every 10 seconds (exactly like Jestsee)
  });

  const isLoading = !data && !error;

  if (isLoading) {
    return (
      <div className="surface-panel rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="h-3 w-24 rounded bg-[var(--color-border)]" />
        <div className="flex gap-3">
          <div className="h-14 w-14 rounded-xl bg-[var(--color-border)]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-3/4 rounded bg-[var(--color-border)]" />
            <div className="h-2.5 w-1/2 rounded bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <SiSpotify size={12} className="text-[#1DB954]" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {data?.isPlaying ? "Now Playing" : "Last Played"}
        </p>
      </div>

      {/* Track */}
      {data?.songUrl && data.songUrl !== "#" ? (
        <a
          href={data.songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group"
        >
          {/* Album art — spins if currently playing */}
          {data.albumImageUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <img
                src={data.albumImageUrl}
                alt={`Album art for ${data.title}`}
                className={`h-full w-full object-cover rounded-full ${
                  data.isPlaying ? "animate-[spin_8s_linear_infinite]" : ""
                }`}
              />
            </div>
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-xl bg-[var(--color-border)] flex items-center justify-center">
              <SiSpotify size={20} className="text-[#1DB954]" aria-hidden />
            </div>
          )}

          {/* Track info */}
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">
              {data.title}
            </p>
            <p className="text-xs text-[var(--color-muted-ink)] truncate">
              {data.artist}
            </p>
          </div>
        </a>
      ) : (
        <p className="text-xs text-[var(--color-muted-ink)]">
          Configure Spotify in .env.local
        </p>
      )}
    </div>
  );
}
```

### Step 4 — Update Control Center grid layout

**File:** `frontend/components/sections/control-center-section.tsx`

The final Control Center widget grid (after removing heatmap + primary stack + adding globe):

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
  {/* Row 1 */}
  <GlobeWidget />           {/* Globe — 1 col */}
  <LocalTimeClock />        {/* Clock — 1 col */}
  <WeatherWidget />         {/* Weather — 1 col */}
  <AvailabilityStatus />    {/* Status — 1 col */}

  {/* Row 2 */}
  <GitHubContributions />   {/* Contributions — span 2 cols */}
  <SpotifyWidget />         {/* Spotify — 1 col */}
  <LocationCard />          {/* Location details — 1 col */}
</div>
```

**REMOVE** `MiniHeatmap` and any "Primary Stack" / `TechStack` component from this grid.

The section header stays exactly as-is:
```
AT A GLANCE
Current location, rhythm, and engineering signal
```

---

## SECTION H — SKILLS: REAL SVG LOGOS + SANCHIT GLOW

**File:** `frontend/components/sections/skills-section.tsx`

### The Sanchit glow effect (exact recreation)

Each skill icon card needs this hover behavior:
1. At rest: icon is **grayscale + 50% opacity**
2. On hover:
   - Icon: full color + `drop-shadow(0 0 10px BRAND_COLOR)`
   - Card background: subtle radial glow in brand color
   - Name label: becomes brand color text

### CSS to add to `globals.css`:
```css
/* Skills section: Sanchit-style brand color glow on hover */
.skill-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px -8px var(--skill-glow, rgba(0,0,0,0.2));
}

.skill-card:hover .skill-icon {
  filter: grayscale(0%) drop-shadow(0 0 10px var(--skill-glow)) !important;
  opacity: 1 !important;
}

.skill-card:hover .skill-bg-glow {
  opacity: 1;
}

.skill-card:hover .skill-name {
  color: var(--skill-glow) !important;
}

.skill-icon {
  filter: grayscale(100%);
  opacity: 0.5;
  transition: filter 0.3s ease, opacity 0.3s ease;
}

.skill-bg-glow {
  opacity: 0;
  transition: opacity 0.3s ease;
}
```

### Updated skill card JSX (update the card rendering in skills-section.tsx):

```tsx
<div
  key={skill.name}
  className="skill-card surface-panel relative overflow-hidden flex flex-col items-center gap-2 rounded-2xl p-4 cursor-default"
  style={{ "--skill-glow": skill.brandColor } as React.CSSProperties}
>
  {/* Background glow (revealed on hover) */}
  <div
    className="skill-bg-glow absolute inset-0 rounded-2xl pointer-events-none"
    aria-hidden
    style={{
      background: `radial-gradient(circle at 50% 0%, ${skill.brandColor}22 0%, transparent 65%)`,
    }}
  />

  {/* Icon */}
  <div className="relative z-10 flex h-10 w-10 items-center justify-center">
    {IconComponent ? (
      <IconComponent
        size={32}
        className="skill-icon"
        style={{ color: skill.brandColor }}
        aria-hidden
      />
    ) : (
      <span className="skill-icon text-2xl font-bold text-[var(--color-muted-ink)]">
        {skill.name[0]}
      </span>
    )}
  </div>

  {/* Name */}
  <p className="skill-name relative z-10 text-[11px] font-semibold text-[var(--color-muted-ink)] text-center transition-colors duration-300 leading-tight">
    {skill.name}
  </p>
</div>
```

### Real brand colors in `portfolio-content.ts`

Update EVERY skill's `brandColor` to the real official brand color:
```ts
// Cloud/DevOps
{ name: "AWS",            iconKey: "SiAmazonaws",        brandColor: "#FF9900" },
{ name: "Azure",          iconKey: "SiMicrosoftazure",   brandColor: "#0078D4" },
{ name: "Docker",         iconKey: "SiDocker",           brandColor: "#2496ED" },
{ name: "Kubernetes",     iconKey: "SiKubernetes",       brandColor: "#326CE5" },
{ name: "Terraform",      iconKey: "SiTerraform",        brandColor: "#7B42BC" },
{ name: "GitHub Actions", iconKey: "SiGithubactions",    brandColor: "#2088FF" },
{ name: "Jenkins",        iconKey: "SiJenkins",          brandColor: "#D33833" },
{ name: "CircleCI",       iconKey: "SiCircleci",         brandColor: "#343434" },

// Languages
{ name: "Python",         iconKey: "SiPython",           brandColor: "#3776AB" },
{ name: "Java",           iconKey: "SiJava",             brandColor: "#007396" },
{ name: "JavaScript",     iconKey: "SiJavascript",       brandColor: "#F7DF1E" },
{ name: "TypeScript",     iconKey: "SiTypescript",       brandColor: "#3178C6" },
{ name: "SQL",            iconKey: "LuDatabase",         brandColor: "#4479A1" },
{ name: "Bash",           iconKey: "SiGnubash",          brandColor: "#4EAA25" },

// Backend
{ name: "Node.js",        iconKey: "SiNodedotjs",        brandColor: "#339933" },
{ name: "MongoDB",        iconKey: "SiMongodb",          brandColor: "#47A248" },
{ name: "CloudFormation", iconKey: "SiAmazonaws",        brandColor: "#FF9900" },
{ name: "API Gateway",    iconKey: "LuGlobe",            brandColor: "#FF4F00" },
{ name: "Microservices",  iconKey: "LuNetwork",          brandColor: "#00B4D8" },

// Frontend
{ name: "React",          iconKey: "SiReact",            brandColor: "#61DAFB" },
{ name: "Next.js",        iconKey: "SiNextdotjs",        brandColor: "#000000" },
{ name: "Tailwind CSS",   iconKey: "SiTailwindcss",      brandColor: "#06B6D4" },

// AI/ML
{ name: "SageMaker",      iconKey: "SiAmazonaws",        brandColor: "#FF9900" },
{ name: "ChatGPT / LLM",  iconKey: "SiOpenai",           brandColor: "#412991" },
{ name: "Machine Learning", iconKey: "LuBrainCircuit",   brandColor: "#7C3AED" },
```

### Update `skillIconMap` to include all these react-icons/si icons:
```ts
import {
  SiAmazonaws, SiMicrosoftazure, SiDocker, SiKubernetes, SiTerraform,
  SiGithubactions, SiJenkins, SiCircleci, SiPython, SiJava, SiJavascript,
  SiTypescript, SiGnubash, SiNodedotjs, SiMongodb, SiReact, SiNextdotjs,
  SiTailwindcss, SiOpenai,
} from "react-icons/si";
import { LuDatabase, LuGlobe, LuNetwork, LuBrainCircuit } from "react-icons/lu";
```

---

## SECTION I — EXPERIENCE SECTION (verify single-panel display)

**File:** `frontend/components/sections/experience-section.tsx`

The tab bar already exists (Education / Work History / Certifications). Verify it shows **only one panel at a time**. The correct implementation:

```tsx
// The tab content panels must be conditionally rendered:
{activeTab === "education" && <EducationPanel items={experience.education} />}
{activeTab === "work" && <WorkPanel items={experience.work} />}
{activeTab === "certifications" && <CertsPanel items={experience.certifications} />}

// NOT three simultaneously visible panels
```

If they are all visible at once, change to the conditional rendering above.

The tab bar itself should be a liquid glass pill bar:
```tsx
<div
  role="tablist"
  aria-label="Experience categories"
  className="glass-surface flex items-center gap-1 rounded-2xl p-1 w-fit mb-6"
>
  {(["education", "work", "certifications"] as const).map((tab) => (
    <button
      key={tab}
      role="tab"
      aria-selected={activeTab === tab}
      onClick={() => setActiveTab(tab)}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        activeTab === tab
          ? "bg-[var(--color-accent)] text-white shadow-sm"
          : "text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]"
      }`}
    >
      {tab === "education" ? "Education" : tab === "work" ? "Work History" : "Certifications"}
    </button>
  ))}
</div>
```

---

## SECTION J — BLOGS: ADD SAMPLE ENTRIES

**File:** `frontend/content/portfolio-content.ts`

Replace the empty `articles: []` array with 2 sample entries so the blog section renders:

```ts
articles: [
  {
    slug: "resilient-microservices-patterns",
    title: "Building Resilient Cloud Microservices: Practical Patterns from Production",
    excerpt:
      "Lessons from migrating Capital One services to AWS serverless — deployment safety, observability checkpoints, and cost-aware scaling patterns.",
    publishedAt: "2024-11",
    href: "#",
    isReal: false, // sample only — set to true when published
    tags: ["AWS", "Microservices", "Cloud"],
  },
  {
    slug: "terraform-multi-region",
    title: "Terraform Multi-Region Deployments Without Drift",
    excerpt:
      "How we standardized environment parity across AWS and Azure using Terraform modules and GitHub Actions, reducing configuration drift to near zero.",
    publishedAt: "2024-09",
    href: "#",
    isReal: false,
    tags: ["Terraform", "IaC", "CI/CD"],
  },
] as ArticleSummary[],
```

Also update `contentAvailability.hasPublishedArticles = true` in `frontend/lib/site.ts` so the blog section appears in nav.

---

## SECTION K — FINAL WIRING: home-shell.tsx

**File:** `frontend/components/layout/home-shell.tsx`

Verify the section order is exactly:
```
1. HeroSection          (id="hero")
2. ControlCenterSection (id="control-center")
3. AboutSection         (id="about")
4. SkillsSection        (id="skills")
5. ExperienceSection    (id="experience")
6. ProjectsSection      (id="projects")
7. BlogsSection / ArticlesSection (id="blogs" or id="articles")
8. ContactFooterSection (id="contact")
```

**Overlays (outside main, always rendered):**
- `<QuickAccessDock />` — bottom-left links dock (Section A)
- `<AiCompanionFab />` — bottom-right
- `<CommandPalette />` — keyboard only, no button

---

## SECTION L — COMMAND PALETTE (remove visible trigger)

**File:** `frontend/components/layout/site-header.tsx`

Delete any `<button>` in the header that has text "⌘K" or dispatches the command palette open event. The keyboard shortcut in `command-palette.tsx` handles opening — no button needed.

The command palette itself stays fully functional with `Cmd/Ctrl+K`.

---

## VALIDATION CHECKLIST (run before declaring done)

```bash
cd frontend
npm install    # ensure cobe and swr are installed
npm run lint   # must pass with 0 errors
npm run build  # must compile clean
```

Visual checks at `localhost:3000`:
- [ ] "N" circle is gone — replaced with LuLink2 FAB
- [ ] Clicking LuLink2 FAB opens vertical social icons with color glow on hover
- [ ] No ⌘K button visible in header
- [ ] Door icon visible in hero top-right corner
- [ ] Name "Bhargava Teja Borra" in top-left is a clickable refresh link
- [ ] Nav bar is shifted slightly right, no "Home" pill
- [ ] Theme toggle is last item on the right in header
- [ ] Hero background has animated color blobs (not static)
- [ ] Dark mode: hero blobs shift to cool blue/purple tones
- [ ] Control Center shows: Globe, Clock, Weather, Status, GitHub Contributions, Spotify, Location
- [ ] NO "Primary Stack" widget visible anywhere
- [ ] NO heatmap widget visible anywhere
- [ ] Globe renders (WebGL canvas, spinning, Dallas marker)
- [ ] GitHub contributions renders (or shows "unavailable" gracefully)
- [ ] Spotify shows (or "Configure Spotify" if env vars not set)
- [ ] Skills icons show grayscale → full brand color + glow on hover
- [ ] Experience: only ONE panel visible at a time (tab click switches panel)
- [ ] Blog section shows 2 sample articles
- [ ] All sections reachable via nav pills
- [ ] Mobile (375px): dock works on tap, no horizontal overflow
- [ ] `prefers-reduced-motion`: hero blobs static, no spinning album art

---

## PACKAGE INSTALLS NEEDED

```bash
cd frontend
npm install cobe        # WebGL globe (5kB)
npm install swr         # React data fetching (used by Jestsee for Spotify)
# react-icons already installed — verify SiSpotify is in react-icons/si
```

---

*End of prompt. Implement top-to-bottom, build after each section, fix all TypeScript errors before moving on.*
