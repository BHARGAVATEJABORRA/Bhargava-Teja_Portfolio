"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { EntranceCurtain } from "@/components/motion/entrance-curtain";
import { HeroSection, HeroSocialDock } from "@/components/sections/hero-section";
import { portfolioContent, type ProjectSummary } from "@/content/portfolio-content";

// Canvas/WebGL scenes must never server-render: the SSR pass has no window or
// WebGL, and a markup mismatch on hydration kills the scene silently in
// production. ssr:false keeps them strictly client-side.
const TidesBackground = dynamic(
  () => import("@/components/scenes/tides-background").then((m) => m.TidesBackground),
  { ssr: false },
);
const ContactFooterSection = dynamic(
  () => import("@/components/sections/contact-footer-section").then((m) => m.ContactFooterSection),
  { ssr: false },
);

// None of these modules are visible until the entrance curtain completes.
// Keeping them out of the initial route chunk prevents the graphics-heavy
// control center, project deck, articles, and floating tools from blocking the
// first development compile or the hero's first paint.
const ControlCenterSection = dynamic(
  () => import("@/components/sections/control-center-section").then((m) => m.ControlCenterSection),
  { ssr: false },
);
const AboutSection = dynamic(
  () => import("@/components/sections/about-section").then((m) => m.AboutSection),
  { ssr: false },
);
const SkillsSection = dynamic(
  () => import("@/components/sections/skills-section").then((m) => m.SkillsSection),
  { ssr: false },
);
const ExperienceSection = dynamic(
  () => import("@/components/sections/experience-section").then((m) => m.ExperienceSection),
  { ssr: false },
);
const ProjectsSection = dynamic(
  () => import("@/components/sections/projects-section").then((m) => m.ProjectsSection),
  { ssr: false },
);
const BlogsSection = dynamic(
  () => import("@/components/sections/blogs-section").then((m) => m.BlogsSection),
  { ssr: false },
);
const CommandPalette = dynamic(
  () => import("@/components/layout/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);
const AiCompanionDock = dynamic(
  () => import("@/components/sections/ai-companion-dock").then((m) => m.AiCompanionDock),
  { ssr: false },
);

export function HomeShell({ projects }: { projects: ProjectSummary[] }) {
  const features = portfolioContent.features;
  const [showContent, setShowContent] = useState(false);
  // The Three.js footer scene is the heaviest thing to mount. Deferring it a
  // couple of frames after the rest of the content paints keeps the greeting →
  // hero reveal from freezing while all that WebGL initialises in one tick.
  const [showFooter, setShowFooter] = useState(false);
  const handleEntranceDone = useCallback(() => {
    setShowContent(true);
  }, []);

  useEffect(() => {
    if (!showContent) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShowFooter(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [showContent]);

  return (
    <>
      <EntranceCurtain onDone={handleEntranceDone} />

      {/* The aurora lives inside the footer scene: see FooterAurora mounted in
          the CTA band of AdalineFooterScene. */}

      <SiteHeader />

      <TidesBackground />

      <main id="main-content">
        {/* Hero copy sits over the backdrop. Rendered immediately so it is
            already in place under the curtain: greeting → hero, nothing else. */}
        <HeroSection />

        {/* Everything below the fold is heavier (Three.js footer scene, etc.)
            and never visible during the reveal — defer it until the greeting is
            done so the curtain stays smooth. */}
        {showContent ? (
          <>
            {/* Content floats over the day-cycling sky; sections are
                background-less so the sky shows through behind them. */}
            <div className="relative isolate -mt-px">
              <ControlCenterSection />
              <AboutSection />
              {features.skills && <SkillsSection />}
              {features.experience && <ExperienceSection />}
              {features.projects && <ProjectsSection projects={projects} />}
              {features.articles && <BlogsSection />}
            </div>

            {showFooter ? <ContactFooterSection /> : null}
          </>
        ) : null}
      </main>

      {showContent ? (
        <>
          {/* Command palette — keyboard only (Cmd/Ctrl+K) */}
          <CommandPalette />

          {/* Floating links dock — chain-icon, expands social orbs (bottom-left) */}
          <HeroSocialDock />

          {/* Floating AI companion — spins on hover, opens a chat window on click */}
          <AiCompanionDock />
        </>
      ) : null}
    </>
  );
}
