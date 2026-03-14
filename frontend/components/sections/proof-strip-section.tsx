import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

export function ProofStripSection() {
  return (
    <SectionShell id="proof" labelledBy="proof-title" className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-10 sm:py-12">
      <h2 id="proof-title" className="sr-only">
        Proof Highlights
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {portfolioContent.proofMetrics.map((metric) => (
          <li key={metric.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{metric.value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted-ink)]">{metric.context}</p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
