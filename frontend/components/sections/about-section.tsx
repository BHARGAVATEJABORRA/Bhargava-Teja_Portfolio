import Image from "next/image";
import { LuMapPin } from "react-icons/lu";

import GlassSurface from "@/components/ui/glass-surface";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { getResumeHref } from "@/lib/profile-links";

export function AboutSection() {
  const { identity, about, experience } = portfolioContent;
  // Data source only — stats/specialties are admin-editable via /admin/settings.
  const metrics = about.stats;
  const focusAreas = about.specialties;
  const currentlyAt = identity.currentlyAt ?? experience.work[0]?.organization ?? "Capital One";
  const whoIAm = about.paragraphs[0];

  return (
    <SectionShell id="about" labelledBy="about-title">
      <div className="liquid-stage liquid-stage--about space-y-8">
        <SectionHeading id="about-title" eyebrow="About" />

        <GlassSurface
          className="flush-glass overflow-hidden"
          borderRadius={36}
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
          <article className="flex flex-col gap-7 p-6 sm:p-10">
            {/* Identity row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
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
            </div>

            {/* Who I am — one paragraph, front and center */}
            <p className="max-w-3xl text-base leading-[1.85] text-[var(--color-ink)] sm:text-lg">{whoIAm}</p>

            {/* Focus chips */}
            <ul className="flex flex-wrap gap-2">
              {focusAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]"
                >
                  {area}
                </li>
              ))}
            </ul>

            {/* Metrics + resume */}
            <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/20 pt-6">
              <dl className="grid grid-cols-3 gap-6 sm:gap-10">
                {metrics.map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <dt className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-[1.7rem]">
                      {metric.value}
                    </dt>
                    <dd className="max-w-[9rem] text-xs leading-snug text-[var(--color-muted-ink)]">{metric.label}</dd>
                  </div>
                ))}
              </dl>

              <a
                href={getResumeHref()}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Download resume
              </a>
            </div>
          </article>
        </GlassSurface>
      </div>
    </SectionShell>
  );
}
