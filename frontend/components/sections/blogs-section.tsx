"use client";

import { useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { LuArrowRight, LuThumbsUp } from "react-icons/lu";

import { Container } from "@/components/ui/container";
import { portfolioContent } from "@/content/portfolio-content";
import type { ArticleSummary } from "@/content/portfolio-content";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothStep(value: number) {
  const clamped = clamp01(value);
  return 3 * clamped ** 2 - 2 * clamped ** 3;
}

// How far card `index` has shrunk back into the deck: 0 while it is on top,
// ramping to 1 as the next card pins over it. Pure function of the deck's
// scroll progress — the same shared scroll source as every other layer.
function coverage(progress: number, index: number, total: number) {
  if (total <= 1) return 0;
  return clamp01(progress * (total - 1) - index);
}

function ArticleCard({
  article,
  index,
  total,
  deckProgress,
}: {
  article: ArticleSummary;
  index: number;
  total: number;
  deckProgress: MotionValue<number>;
}) {
  const accent = article.accent ?? "#fcbc1d";
  const shouldReduceMotion = useReducedMotion();
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const likeCount = (article.likes ?? 0) + (liked ? 1 : 0);

  // Stacked-deck reveal: each card eases 1 → 0.92 scale with a slight opacity
  // falloff as the next card pins over it. No per-property transition — the
  // values are scroll-bound, so they stop and reverse with the scroll itself.
  const scale = useTransform(deckProgress, (p) => 1 - 0.08 * smoothStep(coverage(p, index, total)));
  const opacity = useTransform(deckProgress, (p) => 1 - 0.2 * smoothStep(coverage(p, index, total)));

  return (
    <motion.article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="article-card group"
      style={{
        zIndex: hovered ? 999 : index + 1,
        ["--article-accent" as string]: accent,
        ...(shouldReduceMotion ? {} : { scale, opacity }),
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
    </motion.article>
  );
}

export function BlogsSection() {
  const articles = portfolioContent.articles ?? [];
  const deckRef = useRef<HTMLDivElement | null>(null);

  // One container-scoped scroll progress drives every card (0 = deck top pins,
  // 1 = deck fully scrolled). Cards derive their scale/opacity from it as pure
  // functions, so the stack tracks scroll one-to-one in both directions.
  const { scrollYProgress: deckProgress } = useScroll({
    target: deckRef,
    offset: ["start start", "end end"],
  });

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

        <div ref={deckRef} className="article-deck mt-12">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              index={index}
              total={articles.length}
              deckProgress={deckProgress}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
