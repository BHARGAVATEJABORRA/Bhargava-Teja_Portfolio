import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

export function AboutSection() {
  return (
    <SectionShell id="about" labelledBy="about-title">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionHeading
          id="about-title"
          eyebrow="About"
          title="How I approach product engineering"
          description="I prioritize recruiter clarity and engineering rigor: obvious value first, technical depth immediately available on scroll."
        />
        <div className="space-y-5">
          {portfolioContent.about.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-[var(--color-muted-ink)]">
              {paragraph}
            </p>
          ))}
          <ul className="space-y-3">
            {portfolioContent.about.principles.map((principle) => (
              <li key={principle} className="flex items-start gap-2 text-sm text-[var(--color-muted-ink)]">
                <span aria-hidden className="mt-2 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
