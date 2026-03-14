import { TrackedLink } from "@/components/analytics/tracked-link";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

export function ProjectsSection() {
  return (
    <SectionShell id="projects" labelledBy="projects-title" className="bg-[var(--color-surface)]">
      <div className="space-y-8">
        <SectionHeading
          id="projects-title"
          eyebrow="Projects"
          title="Supporting projects with clear outcomes"
          description="Each project is scoped to a business problem, an architecture decision, and a measurable result."
        />
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolioContent.projects.map((project) => (
            <li key={project.title} className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">{project.timeframe}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{project.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted-ink)]">{project.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-ink)]">{project.outcome}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <Chip key={`${project.title}-${item}`}>{item}</Chip>
                ))}
              </div>
              <TrackedLink
                href={project.href}
                target="_blank"
                rel="noreferrer"
                eventName="project_card_click"
                eventProperties={{ project: project.title }}
                className="mt-5 inline-flex text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-border)] underline-offset-4 hover:decoration-[var(--color-accent)]"
              >
                Explore project details
              </TrackedLink>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
