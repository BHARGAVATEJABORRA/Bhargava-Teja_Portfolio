"use client";

import { useCallback, useEffect, useState } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { SiteHeader } from "@/components/layout/site-header";
import { EntranceCurtain } from "@/components/motion/entrance-curtain";
import { AboutSection } from "@/components/sections/about-section";
import { AiCompanionDock } from "@/components/sections/ai-companion-dock";
import { BlogsSection } from "@/components/sections/blogs-section";
import { ContactFooterSection } from "@/components/sections/contact-footer-section";
import { ControlCenterSection } from "@/components/sections/control-center-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { HeroSection, HeroSocialDock } from "@/components/sections/hero-section";
import { TidesBackground } from "@/components/scenes/tides-background";
import { ProjectsSection } from "@/components/sections/projects-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { portfolioContent } from "@/content/portfolio-content";

export function HomeShell() {
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

      {/* The aurora lives INSIDE the footer scene now (adaline architecture):
          see FooterAurora mounted in the CTA band of AdalineFooterScene. */}

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
              {features.projects && <ProjectsSection />}
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
