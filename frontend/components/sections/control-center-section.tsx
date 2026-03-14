import { TrackedLink } from "@/components/analytics/tracked-link";
import { CopyEmailButton } from "@/components/control-center/copy-email-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

export function ControlCenterSection() {
  const { controlCenter, identity } = portfolioContent;

  return (
    <SectionShell id="control-center" labelledBy="control-center-title" className="bg-[var(--color-surface)]">
      <div className="space-y-8">
        <SectionHeading
          id="control-center-title"
          eyebrow="Control Center"
          title="High-value recruiter details, fast"
          description="No novelty widgets. Just concrete hiring context and direct actions."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {controlCenter.modules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">{module.title}</h3>
              <p className="mt-2 text-base font-medium text-[var(--color-ink)]">{module.detail}</p>
              <p className="mt-2 text-sm text-[var(--color-muted-ink)]">{module.value}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <h3 className="text-base font-semibold text-[var(--color-ink)]">Recruiter Actions</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-ink)]">
              Reach out directly, request a resume packet, or schedule a high-signal intro conversation.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <TrackedLink
                href="#contact"
                eventName="resume_packet_click"
                className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]"
              >
                Request resume packet
              </TrackedLink>
              <a
                href={`mailto:${identity.contactEmail}`}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
              >
                Email directly
              </a>
              <CopyEmailButton email={identity.contactEmail} />
            </div>
          </article>

          <article className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <h3 className="text-base font-semibold text-[var(--color-ink)]">{controlCenter.aiCompanion.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-ink)]">{controlCenter.aiCompanion.description}</p>
            <button
              type="button"
              disabled
              className="mt-4 cursor-not-allowed rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted-ink)]"
            >
              Companion preview unavailable in MVP
            </button>
          </article>
        </div>
      </div>
    </SectionShell>
  );
}
