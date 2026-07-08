"use client";

import { useCallback, useState } from "react";

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

export function HomeShell() {
  const [showContent, setShowContent] = useState(false);
  const handleEntranceDone = useCallback(() => {
    setShowContent(true);
  }, []);

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
            <div className="relative isolate">
              <ControlCenterSection />
              <AboutSection />
              <SkillsSection />
              <ExperienceSection />
              <ProjectsSection />
              <BlogsSection />
            </div>

            <ContactFooterSection />
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
