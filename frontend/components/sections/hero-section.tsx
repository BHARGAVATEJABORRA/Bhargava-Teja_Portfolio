"use client";

import { motion, useReducedMotion } from "framer-motion";

import { TrackedLink } from "@/components/analytics/tracked-link";
import { HeroWowCard } from "@/components/sections/hero-wow-card";
import { Container } from "@/components/ui/container";
import { portfolioContent } from "@/content/portfolio-content";

interface HeroSectionProps {
  revealKey: number;
}

const heroRevealVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function HeroSection({ revealKey }: HeroSectionProps) {
  const { hero, identity } = portfolioContent;
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion && revealKey > 0;

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative overflow-hidden py-20 sm:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            key={revealKey}
            className="space-y-7"
            initial={shouldAnimate ? "hidden" : false}
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.09, delayChildren: 0.04 },
              },
            }}
          >
            <motion.p variants={heroRevealVariants} className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              {identity.location} · {identity.role}
            </motion.p>
            <motion.h1
              variants={heroRevealVariants}
              id="hero-title"
              className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-5xl"
            >
              {hero.headline}
            </motion.h1>
            <motion.p variants={heroRevealVariants} className="max-w-2xl text-lg leading-relaxed text-[var(--color-muted-ink)]">
              {hero.supporting}
            </motion.p>
            <motion.div variants={heroRevealVariants} className="flex flex-wrap gap-4">
              <TrackedLink
                href={hero.primaryCta.href}
                eventName="hero_primary_cta_click"
                className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition-transform hover:-translate-y-0.5"
              >
                {hero.primaryCta.label}
              </TrackedLink>
              <TrackedLink
                href={hero.secondaryCta.href}
                eventName="hero_secondary_cta_click"
                className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
              >
                {hero.secondaryCta.label}
              </TrackedLink>
            </motion.div>
          </motion.div>
          <HeroWowCard {...hero.wowCard} />
        </div>
      </Container>
    </section>
  );
}
