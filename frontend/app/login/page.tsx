import type { Metadata } from "next";
import Link from "next/link";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { LuArrowLeft, LuLockKeyhole } from "react-icons/lu";

import { AccessRequestForm } from "@/components/login/access-request-form";
import { ReflectiveAccessCard } from "@/components/login/reflective-access-card";
import { portfolioContent } from "@/content/portfolio-content";
import { getResolvedSocialLink } from "@/lib/profile-links";

export const metadata: Metadata = {
  title: "Login",
  description: "Request invite-only access to Bhargava Teja Borra's portfolio review space.",
};

export default function LoginPage() {
  const github = getResolvedSocialLink("github");
  const linkedIn = getResolvedSocialLink("linkedin");

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[10%] h-72 w-72 rounded-full tint-accent-bg-20 blur-3xl" />
        <div className="absolute right-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[rgba(82,126,255,0.16)] blur-3xl" />
        <div className="absolute bottom-[-14%] left-[24%] h-[24rem] w-[24rem] rounded-full bg-[rgba(255,146,88,0.14)] blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-5 py-14 sm:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="surface-panel overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="space-y-6">
                <Link
                  href="/#hero"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-muted-ink)] underline underline-offset-4"
                >
                  <LuArrowLeft size={14} aria-hidden />
                  Back to portfolio
                </Link>

                <div
                  data-liquid-glass="on"
                  className="liquid-control inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]"
                >
                  <LuLockKeyhole size={14} aria-hidden />
                  <span>Invite-only access</span>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-5xl">
                    Login space with a reflective access card and a cleaner auth layout.
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-[var(--color-muted-ink)] sm:text-lg">
                    This route follows the current auth pattern used by modern product teams: strong visual framing, one clear form, and direct secondary actions instead of cluttered widgets.
                  </p>
                </div>

                <ReflectiveAccessCard />

                <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted-ink)] sm:text-base">
                  The card previews the private handoff flow without prompting for camera access or showing fake credentials. Approved requests still route directly to{" "}
                  <a
                    href={`mailto:${portfolioContent.identity.contactEmail}`}
                    className="font-semibold text-[var(--color-ink)] underline underline-offset-4"
                  >
                    {portfolioContent.identity.contactEmail}
                  </a>
                  .
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={github.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-liquid-glass="on"
                  className="liquid-control inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[var(--color-ink)]"
                >
                  <FaGithub size={16} aria-hidden />
                  <span>GitHub</span>
                </a>
                <a
                  href={linkedIn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-liquid-glass="on"
                  className="liquid-control inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[var(--color-ink)]"
                >
                  <FaLinkedinIn size={16} aria-hidden />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </article>

          <article className="glass-surface rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Request access</p>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                  Tell me what you need and I&apos;ll share the right login details.
                </h2>
                <p className="text-sm leading-relaxed text-[var(--color-muted-ink)] sm:text-base">
                  There isn&apos;t a public auth backend here yet. Instead of a fake sign-in form, this page sends a real access request through the site contact route.
                </p>
              </div>

              <AccessRequestForm />

              <div className="rounded-2xl border tint-border-bd-72 tint-card-bg-56 p-4 text-sm text-[var(--color-muted-ink)]">
                Need immediate access instead? Email{" "}
                <a href={`mailto:${portfolioContent.identity.contactEmail}`} className="font-semibold text-[var(--color-ink)] underline underline-offset-4">
                  {portfolioContent.identity.contactEmail}
                </a>
                .
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
