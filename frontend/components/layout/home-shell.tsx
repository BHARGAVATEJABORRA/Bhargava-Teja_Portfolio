"use client";

import { useCallback, useState } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { SiteHeader } from "@/components/layout/site-header";
import { EntranceCurtain } from "@/components/motion/entrance-curtain";
import { AmbientAurora } from "@/components/scenes/ambient-aurora";
import { AboutSection } from "@/components/sections/about-section";
import { AiCompanionDock } from "@/components/sections/ai-companion-dock";
import { BlogsSection } from "@/components/sections/blogs-section";
import { ContactFooterSection } from "@/components/sections/contact-footer-section";
import { ControlCenterSection } from "@/components/sections/control-center-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { HeroSection } from "@/components/sections/hero-section";
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

      {/* Site-wide ambient aurora (§3.3): one fixed canvas, one continuous
          clock, identical on every section — intensity follows global scroll. */}
      <AmbientAurora />

      <SiteHeader />

      {showContent ? (
        <>
          <main id="main-content">
            {/* Iridescent hero (React Bits shader). */}
            <HeroSection />

            {/* Everything between the hero and the footer carries a faint
                iridescence "echo" so the page reads as one continuous field,
                settling into the Adaline sunset→night footer. */}
            <div className="relative isolate">
              <div aria-hidden className="iridescence-echo pointer-events-none absolute inset-0 -z-10" />
              <ControlCenterSection />
              <AboutSection />
              <SkillsSection />
              <ExperienceSection />
              <ProjectsSection />
              <BlogsSection />
            </div>

            <ContactFooterSection />
          </main>

          {/* Command palette — keyboard only (Cmd/Ctrl+K) */}
          <CommandPalette />

          {/* Floating AI companion — spins on hover, opens a chat window on click */}
          <AiCompanionDock />
        </>
      ) : null}
    </>
  );
}
