"use client";

import { useMemo, useState } from "react";
import {
  SiExpress,
  SiFastify,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiReact,
  SiRedis,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import { LuFlag, LuGauge, LuRadar, LuShieldCheck, LuWorkflow } from "react-icons/lu";

import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

const skillIconMap = {
  nextjs: SiNextdotjs,
  react: SiReact,
  typescript: SiTypescript,
  tailwindcss: SiTailwindcss,
  accessibility: LuShieldCheck,
  performance: LuGauge,
  nodejs: SiNodedotjs,
  express: SiExpress,
  fastify: SiFastify,
  rest: LuWorkflow,
  schema: LuShieldCheck,
  shield: LuShieldCheck,
  postgresql: SiPostgresql,
  redis: SiRedis,
  observability: LuRadar,
  cicd: LuWorkflow,
  flag: LuFlag,
};

export function SkillsSection() {
  const filters = useMemo(() => ["All", ...portfolioContent.skills.map((group) => group.category)], []);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const skills = useMemo(
    () =>
      portfolioContent.skills.flatMap((group) =>
        group.skills.map((skill) => ({
          ...skill,
          category: group.category,
        })),
      ),
    [],
  );

  const filteredSkills = useMemo(
    () => (activeFilter === "All" ? skills : skills.filter((skill) => skill.category === activeFilter)),
    [activeFilter, skills],
  );

  return (
    <SectionShell id="skills" labelledBy="skills-title" className="bg-[var(--color-surface)]">
      <div className="space-y-8">
        <SectionHeading
          id="skills-title"
          eyebrow="Skills"
          title="Modern stack, production habits"
          description="Filter by category, then scan logo-forward strengths. Color is revealed on interaction to keep the default view calm and readable."
        />

        <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Skill category filters">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setActiveFilter(filter);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[var(--color-accent)] bg-[var(--color-card)] text-[var(--color-ink)]"
                    : "border-[var(--color-border)] text-[var(--color-muted-ink)] hover:bg-[var(--color-card)]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {filteredSkills.map((skill) => {
            const Icon = skillIconMap[skill.iconKey as keyof typeof skillIconMap] ?? LuShieldCheck;

            return (
              <li key={`${skill.category}-${skill.name}`}>
                <article className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${skill.brandColor}22 0%, transparent 62%)`,
                    }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <Icon
                        aria-hidden
                        className="h-6 w-6 grayscale opacity-80 transition duration-200 group-hover:grayscale-0 group-hover:opacity-100"
                        style={{
                          color: skill.brandColor,
                        }}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[var(--color-ink)]">{skill.name}</p>
                      <p className="truncate text-xs uppercase tracking-[0.14em] text-[var(--color-muted-ink)]">{skill.category}</p>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </SectionShell>
  );
}
