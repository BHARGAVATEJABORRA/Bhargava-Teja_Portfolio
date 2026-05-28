import { TrackedLink } from "@/components/analytics/tracked-link";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { resolveRecruiterSafeLink } from "@/lib/profile-links";

export function FlagshipSection() {
  const project = portfolioContent.flagship;
  const repositoryLink = resolveRecruiterSafeLink(project.links.repository);

  return (
    <SectionShell id="flagship" labelledBy="flagship-title">
      <div className="space-y-8">
        <SectionHeading
          id="flagship-title"
          eyebrow="Flagship Project"
          title={project.name}
          description={project.summary}
        />

        <article className="grid gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Architecture Highlights</h3>
              <ul className="mt-4 space-y-4">
                {project.architecture.map((point) => (
                  <li key={point.title}>
                    <p className="text-base font-semibold text-[var(--color-ink)]">{point.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted-ink)]">{point.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Measured Impact</h3>
              <ul className="mt-3 space-y-3 text-sm text-[var(--color-muted-ink)]">
                {project.impact.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrackedLink
                href={project.links.caseStudy}
                eventName="flagship_case_study_click"
                className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]"
              >
                Request case study
              </TrackedLink>
              <a
                href={repositoryLink.href}
                target={repositoryLink.openInNewTab ? "_blank" : undefined}
                rel={repositoryLink.openInNewTab ? "noopener noreferrer" : undefined}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
              >
                {repositoryLink.isConfigured ? "View repository" : "Repository available on request"}
              </a>
            </div>
          </div>
        </article>
      </div>
    </SectionShell>
  );
}
