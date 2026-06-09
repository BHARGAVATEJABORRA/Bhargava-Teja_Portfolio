"use client";

import { useState } from "react";
import { LuArrowRight, LuThumbsUp } from "react-icons/lu";

import { Container } from "@/components/ui/container";
import { portfolioContent } from "@/content/portfolio-content";
import type { ArticleSummary } from "@/content/portfolio-content";

function ArticleCard({
  article,
  index,
}: {
  article: ArticleSummary;
  index: number;
}) {
  const accent = article.accent ?? "#fcbc1d";
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const likeCount = (article.likes ?? 0) + (liked ? 1 : 0);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="article-card group"
      style={{
        zIndex: hovered ? 999 : index + 1,
        ["--article-accent" as string]: accent,
      }}
    >
      {hovered ? <span className="article-tooltip">{article.title}</span> : null}

      {/* Like button */}
      <button
        type="button"
        onClick={() => setLiked((value) => !value)}
        aria-pressed={liked}
        aria-label={liked ? "Unlike article" : "Like article"}
        className="article-like"
        data-liked={liked}
      >
        <LuThumbsUp size={18} aria-hidden />
      </button>

      <div className="article-info">
        <p className="article-kicker">
          <span>{article.source ?? "Article"}</span>
          <span className="article-kicker-sep" aria-hidden>
            |
          </span>
          <span>{article.publishedAt}</span>
        </p>

        <h3 className="article-title">{article.title}</h3>

        <span className="article-rule" aria-hidden />

        {article.tagline ? <p className="article-tagline">“{article.tagline}”</p> : null}

        <p className="article-body">{article.body ?? article.excerpt}</p>

        <div className="article-meta">
          <span>{article.readTime}</span>
          {article.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="article-tag">
              {tag}
            </span>
          ))}
        </div>

        <a
          href={article.href}
          target={article.isExternal ? "_blank" : undefined}
          rel={article.isExternal ? "noopener noreferrer" : undefined}
          className="article-learn"
        >
          Learn More <LuArrowRight size={16} aria-hidden />
        </a>
      </div>

      {/* Preview panel — gradient placeholder standing in for a cover image */}
      <div className="article-image" aria-hidden>
        <div className="article-image-glow" />
        <span className="article-image-label">{article.source ?? "Article"}</span>
        <span className="article-image-likes">Likes: {likeCount}</span>
      </div>
    </article>
  );
}

export function BlogsSection() {
  const articles = portfolioContent.articles ?? [];

  return (
    <section id="blogs" aria-labelledby="blogs-title" className="scroll-mt-28 pb-32 pt-20 sm:pt-24">
      <Container className="w-full">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Writing
        </p>
        <h2
          id="blogs-title"
          className="article-section-title mt-2 text-center text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl"
        >
          My Articles
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--color-muted-ink)]">
          Scroll to flip through field notes from the cloud trenches. Sample stories for now — hover a
          card to bring it forward.
        </p>

        <div className="article-deck mt-12">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              index={index}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
