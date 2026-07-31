"use client";

import { createElement, type CSSProperties } from "react";

import GlassSurface from "@/components/ui/glass-surface";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent, type SkillItem } from "@/content/portfolio-content";
import { resolveSkillIcon } from "@/lib/skill-icons";

function SkillChip({ skill }: { skill: SkillItem }) {
  return (
    <div
      className="skill-card glass-surface relative flex h-full cursor-default flex-col items-center gap-1 overflow-hidden rounded-[1.4rem] p-2"
      style={{ "--skill-glow": skill.brandColor } as CSSProperties}
    >
      <div
        className="skill-bg-glow pointer-events-none absolute inset-0 rounded-[1.4rem]"
        aria-hidden
        style={{ background: `radial-gradient(circle at 50% 0%, ${skill.brandColor}22 0%, transparent 65%)` }}
      />
      <div className="relative z-10 flex h-7 w-7 items-center justify-center">
        {/* createElement, not a capitalised local: the icon is resolved from
            data at render time, which the static-components lint rule (rightly)
            flags when assigned to a component-shaped variable. */}
        {createElement(resolveSkillIcon(skill.iconKey), {
          size: 22,
          className: "skill-icon",
          style: { color: skill.brandColor },
          "aria-hidden": true,
        })}
      </div>
      <p className="skill-name relative z-10 text-center text-[9px] font-semibold leading-tight text-[var(--color-muted-ink)] transition-colors duration-300">
        {skill.name}
      </p>
    </div>
  );
}

export function SkillsSection() {
  return (
    <SectionShell id="skills" labelledBy="skills-title" containerMaxWidthClassName="max-w-none">
      <div className="space-y-4">
        {/* The eyebrow doubles as the section's h2: SectionShell's
            aria-labelledby points at #skills-title, so this id must exist. */}
        <h2 id="skills-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Skills
        </h2>

        {/* Masonry, not a grid: a grid row stretches every panel to match the
            tallest in that row, which is what left the dead space. Columns let
            each panel size to its own content and pull the next one up.
            More columns on wide screens keeps the whole section inside one
            viewport instead of running into the next section. */}
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
          {portfolioContent.skills.map((group) => (
            <div key={group.category} className="mb-3 break-inside-avoid">
              <GlassSurface
                className="flush-glass overflow-hidden"
                borderRadius={24}
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
                <article className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                    {group.category}
                  </p>
                  <ul className="mt-3 grid grid-cols-4 gap-2">
                    {group.skills.map((skill) => (
                      <li key={`${group.category}-${skill.name}`}>
                        <SkillChip skill={skill} />
                      </li>
                    ))}
                  </ul>
                </article>
              </GlassSurface>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
