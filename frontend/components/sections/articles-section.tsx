import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";
import { contentAvailability } from "@/lib/site";

export function ArticlesSection() {
  if (!contentAvailability.hasRealArticles) {
    return null;
  }

  return (
    <SectionShell id="articles" labelledBy="articles-title">
      <div className="space-y-8">
        <SectionHeading
          id="articles-title"
          eyebrow="Articles / Blogs"
          title="Technical writing with architecture perspective"
          description="Short reads that show how I reason about systems, risk, and execution quality."
        />
        <ul className="grid gap-4 md:grid-cols-3">
          {portfolioContent.articles
            .filter((article) => article.isReal === true)
            .map((article) => (
            <li key={article.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">{article.readTime}</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">{article.title}</h3>
              <p className="mt-3 text-sm text-[var(--color-muted-ink)]">{article.premise}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-ink)]">{article.takeaway}</p>
              <a
                href={article.href}
                className="mt-4 inline-flex text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-border)] underline-offset-4 hover:decoration-[var(--color-accent)]"
              >
                Read preview
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
