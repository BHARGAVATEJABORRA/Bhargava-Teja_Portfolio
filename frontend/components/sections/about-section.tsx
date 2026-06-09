import Image from "next/image";
import { LuMapPin } from "react-icons/lu";

import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { getResumeHref } from "@/lib/profile-links";

const metrics = [
  { value: "3+", label: "Years in production delivery" },
  { value: "35%", label: "Lower compute cost" },
  { value: "40%", label: "Faster APIs & deployments" },
];

const focusAreas = [
  "AWS Platform Engineering",
  "Infrastructure as Code",
  "CI/CD & Automation",
  "Observability & Reliability",
];

export function AboutSection() {
  const { identity, about, experience } = portfolioContent;
  const bioParagraphs = (identity.bio || "").split(/\n\n+/).filter(Boolean);
  const paragraphs = bioParagraphs.length > 0 ? bioParagraphs : about.paragraphs;
  const currentlyAt = identity.currentlyAt ?? experience.work[0]?.organization ?? "Capital One";

  return (
    <SectionShell id="about" labelledBy="about-title">
      <div className="liquid-stage liquid-stage--about space-y-8">
        <SectionHeading id="about-title" eyebrow="About" />

        <LiquidGlassPanel as="article" radius={36} className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            {/* Narrative column */}
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                {identity.avatarUrl ? (
                  <span className="relative inline-flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl tint-accent-ring-45">
                    <Image
                      src={identity.avatarUrl}
                      alt={`${identity.name} portrait`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-white/8 text-xl font-semibold text-[var(--color-ink)]"
                  >
                    {identity.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight text-[var(--color-ink)]">{identity.name}</h3>
                  <p className="text-sm text-[var(--color-muted-ink)]">{identity.role}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-ink)]">
                    <LuMapPin size={13} aria-hidden />
                    {identity.location}
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/45 bg-white/8 px-3.5 py-1.5 text-sm font-medium text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden>
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-70" />
                </span>
                Currently at {currentlyAt}
              </span>

              <div className="space-y-4">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-[1.8] text-[var(--color-muted-ink)] sm:text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Metrics strip */}
              <dl className="grid grid-cols-3 gap-3 border-t border-white/20 pt-5">
                {metrics.map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <dt className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[1.7rem]">
                      {metric.value}
                    </dt>
                    <dd className="text-xs leading-snug text-[var(--color-muted-ink)]">{metric.label}</dd>
                  </div>
                ))}
              </dl>

              <a
                href={getResumeHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Download resume
              </a>
            </div>

            {/* Principles + focus column */}
            <div className="flex flex-col gap-7 border-t border-white/20 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  Operating Principles
                </p>
                <ul className="mt-4 space-y-4">
                  {about.principles.map((principle) => (
                    <li
                      key={principle}
                      className="flex items-start gap-3 text-base leading-[1.7] text-[var(--color-muted-ink)]"
                    >
                      <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  Focus Areas
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </LiquidGlassPanel>
      </div>
    </SectionShell>
  );
}
