import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

export function ExperienceSection() {
  return (
    <SectionShell id="experience" labelledBy="experience-title">
      <div className="space-y-8">
        <SectionHeading
          id="experience-title"
          eyebrow="Experience"
          title="Execution track record"
          description="I focus on end-to-end ownership across architecture, delivery, and measurable product outcomes."
        />
        <ol className="space-y-6 border-l border-[var(--color-border)] pl-5">
          {portfolioContent.experience.map((item) => (
            <li key={`${item.company}-${item.title}`} className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <span aria-hidden className="absolute -left-[29px] top-6 h-3 w-3 rounded-full border border-[var(--color-border)] bg-[var(--color-accent)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">{item.period}</p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                {item.title} · {item.company}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-muted-ink)]">
                {item.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}
