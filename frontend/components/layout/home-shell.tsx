"use client";

import { useCallback, useState } from "react";

import { CommandPalette } from "@/components/layout/command-palette";
import { SiteHeader } from "@/components/layout/site-header";
import { EntranceCurtain } from "@/components/motion/entrance-curtain";
import { AboutSection } from "@/components/sections/about-section";
import { BlogsSection } from "@/components/sections/blogs-section";
import { ContactFooterSection } from "@/components/sections/contact-footer-section";
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

      {showContent ? (
        <>
          <SiteHeader />

          <main id="main-content">
            {/* Hero section owns the lower hero controls. */}
            <HeroSection />
            <AboutSection />
            <SkillsSection />
            <ExperienceSection />
            <ProjectsSection />
            <BlogsSection />
            <ContactFooterSection />
          </main>

          {/* Command palette — keyboard only (Cmd/Ctrl+K) */}
          <CommandPalette />
        </>
      ) : null}
    </>
  );
}
