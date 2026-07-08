"use client";

import type { CSSProperties } from "react";

import GlassSurface from "@/components/ui/glass-surface";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { resolveSkillIcon } from "@/lib/skill-icons";

export function SkillsSection() {
  return (
    <SectionShell id="skills" labelledBy="skills-title">
      <div className="space-y-8">
        <SectionHeading
          id="skills-title"
          eyebrow="Skills"
          title="Logo-forward stack by domain"
          description="Grouped by engineering domain. Icons stay restrained in grayscale and reveal brand color with a soft glow on interaction."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {portfolioContent.skills.map((group) => (
            <GlassSurface
              key={group.category}
              className="flush-glass overflow-hidden"
              borderRadius={28}
              distortionScale={-90}
              redOffset={0}
              greenOffset={0}
              blueOffset={0}
              brightness={60}
              opacity={0.93}
              blur={14}
              displace={2}
              backgroundOpacity={0.08}
              saturation={1.1}
              mixBlendMode="screen"
            >
              <article className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">{group.category}</p>
                <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {group.skills.map((skill) => {
                    const IconComponent = resolveSkillIcon(skill.iconKey);
                    return (
                      <li key={`${group.category}-${skill.name}`}>
                        <div
                          className="skill-card glass-surface relative flex cursor-default flex-col items-center gap-1.5 overflow-hidden rounded-[1.6rem] p-2.5"
                          style={{ "--skill-glow": skill.brandColor } as CSSProperties}
                        >
                          <div
                            className="skill-bg-glow pointer-events-none absolute inset-0 rounded-[1.6rem]"
                            aria-hidden
                            style={{
                              background: `radial-gradient(circle at 50% 0%, ${skill.brandColor}22 0%, transparent 65%)`,
                            }}
                          />

                          <div className="relative z-10 flex h-8 w-8 items-center justify-center">
                            <IconComponent size={24} className="skill-icon" style={{ color: skill.brandColor }} aria-hidden />
                          </div>

                          <p className="skill-name relative z-10 text-center text-[10px] font-semibold leading-tight text-[var(--color-muted-ink)] transition-colors duration-300">
                            {skill.name}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </GlassSurface>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
