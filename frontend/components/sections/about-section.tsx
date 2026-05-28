import Image from "next/image";

import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { getResumeHref } from "@/lib/profile-links";

export function AboutSection() {
  const bioParagraphs = (portfolioContent.identity.bio || "").split(/\n\n+/).filter(Boolean);
  const fallbackParagraphs = portfolioContent.about.paragraphs;
  const paragraphs = bioParagraphs.length > 0 ? bioParagraphs : fallbackParagraphs;

  return (
    <SectionShell id="about" labelledBy="about-title">
      <div className="liquid-stage liquid-stage--about space-y-8">
        <SectionHeading
          id="about-title"
          eyebrow="About"
        />

        <LiquidGlassPanel as="article" radius={36} className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                {portfolioContent.identity.avatarUrl ? (
                  <span className="relative inline-flex h-16 w-16 overflow-hidden rounded-full ring-2 ring-[color:var(--color-accent)/0.45]">
                    <Image
                      src={portfolioContent.identity.avatarUrl}
                      alt={`${portfolioContent.identity.name} portrait`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/8 px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden>
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-70" />
                  </span>
                  Currently at {portfolioContent.identity.currentlyAt ?? portfolioContent.experience.work[0]?.organization ?? "Capital One"}
                </span>
              </div>

              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-[1.8] text-[var(--color-muted-ink)] sm:text-lg lg:text-[1.2rem]">
                  {paragraph}
                </p>
              ))}

              <a
                href={getResumeHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-accent)] underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                Download resume
              </a>
            </div>

            <div className="border-t border-white/25 p-6 sm:p-7 lg:border-l lg:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Operating Principles</p>
              <ul className="mt-4 space-y-5">
                {portfolioContent.about.principles.map((principle) => (
                  <li key={principle} className="flex items-start gap-3 text-base leading-[1.75] text-[var(--color-muted-ink)] lg:text-[1.08rem]">
                    <span aria-hidden className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </LiquidGlassPanel>
      </div>
    </SectionShell>
  );
}
