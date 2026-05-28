"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { LuArrowUpRight } from "react-icons/lu";

import { AdalineFooterScene } from "@/components/scenes/adaline-scenes";
import { ContactForm } from "@/components/sections/contact-form";
import { Container } from "@/components/ui/container";
import { portfolioContent } from "@/content/portfolio-content";
import { getResolvedSocialLink, getResumeHref, isExternalUrl } from "@/lib/profile-links";
import { coreSectionLinks } from "@/lib/site";

function subscribeToHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function ContactFooterSection() {
  const { resolvedTheme } = useTheme();
  const isHydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydrationSnapshot);
  const github = getResolvedSocialLink("github");
  const linkedIn = getResolvedSocialLink("linkedin");
  const resumeHref = getResumeHref();
  const isDarkTheme = isHydrated && resolvedTheme === "dark";

  const contactLinks = [
    {
      label: "Email",
      href: `mailto:${portfolioContent.identity.contactEmail}`,
      configured: true,
    },
    {
      label: "GitHub",
      href: github.href,
      configured: github.isConfigured,
    },
    {
      label: "LinkedIn",
      href: linkedIn.href,
      configured: linkedIn.isConfigured,
    },
    {
      label: "Resume",
      href: resumeHref,
      configured: true,
    },
  ];

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className={`relative isolate overflow-hidden scroll-mt-28 text-[var(--color-ink)] transition-colors ${
        isDarkTheme ? "bg-[#04080d]" : "bg-[#f1e7d2]"
      }`}
    >
      <AdalineFooterScene />

      <Container className="relative z-10 pt-24 sm:pt-28 lg:pt-32">
        <div className="mx-auto max-w-2xl">
          <h2 id="contact-title" className="sr-only">
            Contact
          </h2>
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-[20%] top-[8%] h-44 rounded-full blur-[58px] ${
              isDarkTheme
                ? "bg-[radial-gradient(circle,rgba(74,255,204,0.16)_0%,rgba(74,255,204,0.04)_42%,transparent_78%)]"
                : "bg-[radial-gradient(circle,rgba(255,227,154,0.44)_0%,rgba(255,239,207,0.24)_22%,rgba(255,247,235,0.08)_48%,transparent_78%)]"
            }`}
          />
          <div className="relative">
            <ContactForm />
          </div>
        </div>

        <div
          className={`mt-[clamp(7rem,18vw,12rem)] rounded-[2rem] border px-6 py-6 backdrop-blur-2xl sm:px-8 ${
            isDarkTheme
              ? "border-white/12 bg-[linear-gradient(180deg,rgba(8,18,27,0.62),rgba(5,12,18,0.46))] shadow-[0_30px_70px_rgba(0,0,0,0.32)]"
              : "border-[rgba(168,188,201,0.34)] bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(241,248,244,0.58))] shadow-[0_26px_60px_rgba(86,108,128,0.12)]"
          }`}
        >
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Navigate</p>
              <nav aria-label="Footer section links" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {coreSectionLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm text-[var(--color-muted-ink)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Contact</p>
              <div className="mt-3 space-y-2">
                {contactLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={isExternalUrl(link.href) ? "_blank" : undefined}
                    rel={isExternalUrl(link.href) ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2 text-sm text-[var(--color-muted-ink)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    <span>{link.label}</span>
                    {!link.configured ? <span className="text-[10px] uppercase tracking-[0.12em]">on request</span> : null}
                  </a>
                ))}
              </div>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Identity</p>
              <p className="mt-3 text-sm text-[var(--color-muted-ink)]">{portfolioContent.identity.name}</p>
              <p className="text-sm text-[var(--color-muted-ink)]">{portfolioContent.identity.role}</p>
              <p className="text-sm text-[var(--color-muted-ink)]">{portfolioContent.identity.currentlyAt}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-[var(--color-muted-ink)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[var(--color-ink)]">{portfolioContent.identity.name}</p>
              <p className="mt-1">Software Engineer focused on cloud, platform, and reliable systems.</p>
            </div>

            <a
              href={`mailto:${portfolioContent.identity.contactEmail}`}
              className="inline-flex items-center gap-2 font-semibold text-[var(--color-ink)] underline underline-offset-4"
            >
              Start a conversation
              <LuArrowUpRight size={14} aria-hidden />
            </a>
          </div>
        </div>
      </Container>

      <div aria-hidden className="relative z-10 h-[clamp(14rem,30vw,22rem)]" />
    </section>
  );
}
