import { portfolioContent } from "@/content/portfolio-content";
import { getResolvedSocialLink, getResumeHref, isExternalUrl } from "@/lib/profile-links";
import { coreSectionLinks } from "@/lib/site";

export function PremiumFooter() {
  const githubLink = getResolvedSocialLink("github");
  const linkedInLink = getResolvedSocialLink("linkedin");
  const resumeHref = getResumeHref();

  const contactLinks = [
    {
      label: "Email",
      href: `mailto:${portfolioContent.identity.contactEmail}`,
      configured: true,
    },
    {
      label: "GitHub",
      href: githubLink.href,
      configured: githubLink.isConfigured,
    },
    {
      label: "LinkedIn",
      href: linkedInLink.href,
      configured: linkedInLink.isConfigured,
    },
    {
      label: "Resume",
      href: resumeHref,
      configured: true,
    },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[color:var(--color-border)/0.62] bg-[linear-gradient(180deg,var(--footer-atmo-top)_0%,var(--footer-atmo-mid)_36%,var(--footer-atmo-base)_100%)] pb-14 pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-28 h-28 bg-[radial-gradient(circle_at_50%_100%,var(--footer-atmo-glow),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,var(--footer-atmo-glow),transparent_40%),radial-gradient(circle_at_88%_26%,var(--footer-atmo-glow),transparent_46%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl space-y-10 px-5 sm:px-8">
        <section className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Closing Note</p>
            <p className="max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Senior-level cloud thinking, execution discipline, and recruiter clarity in one place.
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted-ink)]">
              This portfolio is intentionally structured for fast screening and deeper technical follow-up. Additional project artifacts are shared on request.
            </p>
          </div>
          <div className="glass-surface rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Availability</p>
            <p className="mt-3 text-sm text-[var(--color-ink)]">Actively interviewing for cloud and platform engineering roles.</p>
            <p className="mt-2 text-sm text-[var(--color-muted-ink)]">Last refreshed: March 2026</p>
          </div>
        </section>

        <section className="grid gap-8 border-t border-[color:var(--color-border)/0.5] pt-7 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Navigate</p>
            <nav aria-label="Footer section links" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {coreSectionLinks.map((item) => (
                <a key={item.href} href={item.href} className="text-sm text-[var(--color-muted-ink)] transition-colors hover:text-[var(--color-ink)]">
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

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">Identity</p>
            <p className="mt-3 text-sm text-[var(--color-muted-ink)]">{portfolioContent.identity.name}</p>
            <p className="text-sm text-[var(--color-muted-ink)]">{portfolioContent.identity.role}</p>
            <p className="text-sm text-[var(--color-muted-ink)]">{portfolioContent.identity.location}</p>
          </div>
        </section>
      </div>
    </footer>
  );
}
