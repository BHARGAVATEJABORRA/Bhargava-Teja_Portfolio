import { LuRss } from "react-icons/lu";

import { SectionHeading } from "@/components/ui/section-heading";
import { SectionShell } from "@/components/ui/section-shell";
import { portfolioContent } from "@/content/portfolio-content";

export function BlogsSection() {
  const articles = portfolioContent.articles ?? [];

  return (
    <SectionShell id="blogs" labelledBy="blogs-title">
      <div className="space-y-8">
        <SectionHeading
          id="blogs-title"
          eyebrow="Blogs"
        />

        {articles.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <li key={article.slug}>
                <a
                  href={article.href}
                  target={article.isExternal ? "_blank" : undefined}
                  rel={article.isExternal ? "noopener noreferrer" : undefined}
                  className="group surface-panel block rounded-2xl p-5 space-y-3 transition-all hover:ring-1 hover:ring-[color:var(--color-accent)/0.3]"
                >
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                    <span>{article.publishedAt}</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]" aria-hidden />
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
                    {article.title}
                  </h3>
                  <p className="line-clamp-3 text-xs leading-relaxed text-[var(--color-muted-ink)]">{article.excerpt}</p>
                  {article.tags && article.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <span
                          key={`${article.slug}-${tag}`}
                          className="rounded-full border border-[color:var(--color-border)/0.75] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted-ink)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li>
              <article className="group surface-panel block rounded-2xl p-5 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <LuRss size={16} className="text-[var(--color-muted-ink)]" aria-hidden />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">Sample Entry · On Deck</p>
                <h3 className="text-sm font-semibold leading-snug text-[var(--color-ink)]">
                  Building resilient cloud microservices: practical patterns from production
                </h3>
                <p className="line-clamp-3 text-xs leading-relaxed text-[var(--color-muted-ink)]">
                  Draft in progress. This upcoming post will cover deployment safety, observability checkpoints, and cost-aware scaling patterns.
                </p>
              </article>
            </li>
          </ul>
        )}
      </div>
    </SectionShell>
  );
}
