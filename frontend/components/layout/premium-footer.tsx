import { portfolioContent } from "@/content/portfolio-content";

export function PremiumFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 sm:px-8 md:grid-cols-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Built for Teams</p>
          <p className="text-base font-semibold text-[var(--color-ink)]">Recruiter-friendly by design.</p>
          <p className="text-sm text-[var(--color-muted-ink)]">
            Clean architecture thinking, measurable outcomes, and shipping discipline.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Connect</p>
          <a className="block text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]" href={`mailto:${portfolioContent.identity.contactEmail}`}>
            {portfolioContent.identity.contactEmail}
          </a>
          {portfolioContent.identity.socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Status</p>
          <p className="text-sm text-[var(--color-muted-ink)]">Actively interviewing for high-impact product engineering roles.</p>
          <p className="text-sm text-[var(--color-muted-ink)]">Last refreshed: March 2026</p>
        </div>
      </div>
    </footer>
  );
}
