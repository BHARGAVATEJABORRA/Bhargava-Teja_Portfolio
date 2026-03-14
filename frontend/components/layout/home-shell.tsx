"use client";

import { useCallback, useEffect, useState } from "react";

import { AboutSection } from "@/components/sections/about-section";
import { ArticlesSection } from "@/components/sections/articles-section";
import { ContactSection } from "@/components/sections/contact-section";
import { ControlCenterSection } from "@/components/sections/control-center-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { FlagshipSection } from "@/components/sections/flagship-section";
import { HeroSection } from "@/components/sections/hero-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { ProofStripSection } from "@/components/sections/proof-strip-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { EntranceCurtain } from "@/components/motion/entrance-curtain";

const ENTRANCE_STORAGE_KEY = "portfolio:entrance_seen_v1";

export function HomeShell() {
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);
  const [heroRevealKey, setHeroRevealKey] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const hasSeenEntrance = window.localStorage.getItem(ENTRANCE_STORAGE_KEY) === "1";

        if (hasSeenEntrance) {
          setHeroRevealKey(1);
          return;
        }

        setIsCurtainOpen(true);
      } catch {
        setHeroRevealKey(1);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleCurtainComplete = useCallback(() => {
    setIsCurtainOpen(false);

    try {
      window.localStorage.setItem(ENTRANCE_STORAGE_KEY, "1");
    } catch {
      // Non-blocking fallback when storage is unavailable.
    }

    setHeroRevealKey((current) => current + 1);
  }, []);

  return (
    <>
      <main id="main-content">
        <HeroSection revealKey={heroRevealKey} />
        <ProofStripSection />
        <AboutSection />
        <ControlCenterSection />
        <FlagshipSection />
        <ProjectsSection />
        <ExperienceSection />
        <SkillsSection />
        <ArticlesSection />
        <ContactSection />
      </main>
      <EntranceCurtain isOpen={isCurtainOpen} onComplete={handleCurtainComplete} />
    </>
  );
}
