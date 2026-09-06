"use client";

import { createElement, type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from "react-icons/lu";

import GlassSurface from "@/components/ui/glass-surface";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent, type SkillItem } from "@/content/portfolio-content";
import { resolveSkillIcon } from "@/lib/skill-icons";

const AUTOPLAY_MS = 4_000;

const categoryDescriptions: Record<string, string> = {
  "Cloud Platforms": "Cloud architecture across the leading hyperscale platforms.",
  "Infrastructure as Code": "Repeatable, auditable infrastructure and configuration automation.",
  "Containers & CI/CD": "Portable workloads and dependable software delivery pipelines.",
  "Programming Languages": "Production-focused languages for systems, services, and automation.",
  "Backend & Frameworks": "Secure APIs, resilient services, and distributed backend systems.",
  Frontend: "Responsive interfaces built with modern web foundations.",
  Databases: "Relational, document, cache, and cloud-native data stores.",
  "Data Science & AI": "Data analysis, machine learning, and visualization workflows.",
  "Generative AI": "LLM products, agentic integrations, and prompt-driven systems.",
  "Testing & Monitoring": "Automated quality gates and production observability.",
  "Developer Tools": "The build, collaboration, and delivery tools behind daily engineering.",
  "Operating Systems": "Comfort across Unix, Linux, macOS, and Windows environments.",
};

function SkillItemView({ skill }: { skill: SkillItem }) {
  return (
    <li className="skills-carousel-item" style={{ "--skill-glow": skill.brandColor } as CSSProperties}>
      <span className="skills-carousel-icon" aria-hidden>
        {createElement(resolveSkillIcon(skill.iconKey), {
          size: 34,
          className: skill.iconKey === "SiOpenai" ? "skill-icon skill-icon--openai" : "skill-icon",
          style: { color: skill.brandColor },
        })}
      </span>
      <span className="skills-carousel-name">{skill.name}</span>
    </li>
  );
}

export function SkillsSection() {
  const groups = portfolioContent.skills;
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const countdownRef = useRef<HTMLSpanElement | null>(null);

  const showSlide = useCallback(
    (nextIndex: number, nextDirection: number) => {
      setDirection(nextDirection);
      setActiveIndex((nextIndex + groups.length) % groups.length);
    },
    [groups.length],
  );

  const move = useCallback(
    (step: number) => {
      setDirection(step);
      setActiveIndex((current) => (current + step + groups.length) % groups.length);
    },
    [groups.length],
  );

  useEffect(() => {
    if (isPaused || shouldReduceMotion) {
      if (countdownRef.current) countdownRef.current.textContent = "Paused";
      return;
    }

    const startedAt = performance.now();
    if (countdownRef.current) countdownRef.current.textContent = `${(AUTOPLAY_MS / 1000).toFixed(1)}s`;
    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      if (countdownRef.current) {
        countdownRef.current.textContent = `${(Math.max(0, AUTOPLAY_MS - elapsed) / 1000).toFixed(1)}s`;
      }
    }, 100);
    const timeout = window.setTimeout(() => move(1), AUTOPLAY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [activeIndex, isPaused, move, shouldReduceMotion]);

  const activeGroup = groups[activeIndex];

  return (
    <SectionShell
      id="skills"
      labelledBy="skills-title"
      containerMaxWidthClassName="max-w-[1188px]"
      className="skills-carousel-section"
    >
      <GlassSurface
        className="skills-carousel-shell flush-glass"
        borderRadius={24}
        distortionScale={-90}
        redOffset={0}
        greenOffset={0}
        blueOffset={0}
        brightness={60}
        opacity={0.93}
        blur={16}
        displace={2}
        backgroundOpacity={0.08}
        saturation={1.1}
        mixBlendMode="screen"
      >
        <div className="skills-carousel-frame">
          <div className="skills-carousel-heading">
            <h2 id="skills-title">Skills</h2>
            <p>My Tech Stack</p>
          </div>

          <button
            type="button"
            className="skills-carousel-pause"
            onClick={() => setIsPaused((value) => !value)}
            aria-label={isPaused ? "Resume automatic skill slides" : "Pause automatic skill slides"}
          >
            {isPaused || shouldReduceMotion ? <LuPlay size={15} aria-hidden /> : <LuPause size={15} aria-hidden />}
            <span ref={countdownRef}>{isPaused || shouldReduceMotion ? "Paused" : "4.0s"}</span>
          </button>

          <div className="skills-carousel-stage">
            <button type="button" className="skills-carousel-arrow skills-carousel-arrow--left" onClick={() => move(-1)} aria-label="Previous skill group">
              <LuChevronLeft aria-hidden />
            </button>

            <div className="skills-carousel-viewport" aria-live="polite">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.article
                  key={activeGroup.category}
                  custom={direction}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: direction > 0 ? 70 : -70 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -70 : 70 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  className="skills-carousel-card"
                  drag={shouldReduceMotion ? false : "x"}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 55) move(info.offset.x < 0 ? 1 : -1);
                  }}
                >
                  <h3>{activeGroup.category}</h3>
                  <p>{categoryDescriptions[activeGroup.category] ?? "Tools and technologies used to build dependable products."}</p>
                  <ul className="skills-carousel-items">
                    {activeGroup.skills.map((skill) => (
                      <SkillItemView key={`${activeGroup.category}-${skill.name}`} skill={skill} />
                    ))}
                  </ul>
                </motion.article>
              </AnimatePresence>
            </div>

            <button type="button" className="skills-carousel-arrow skills-carousel-arrow--right" onClick={() => move(1)} aria-label="Next skill group">
              <LuChevronRight aria-hidden />
            </button>
          </div>

          <div className="skills-carousel-dots" role="tablist" aria-label="Skill groups">
            {groups.map((group, index) => (
              <button
                key={group.category}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show ${group.category}`}
                onClick={() => showSlide(index, index >= activeIndex ? 1 : -1)}
              />
            ))}
          </div>
        </div>
      </GlassSurface>
    </SectionShell>
  );
}
