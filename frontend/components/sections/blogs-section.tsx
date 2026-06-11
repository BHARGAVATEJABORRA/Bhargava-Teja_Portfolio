"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { LuArrowRight, LuThumbsUp } from "react-icons/lu";

import ScrollStack, { ScrollStackItem } from "@/components/reactbits/ScrollStack";
import { Container } from "@/components/ui/container";
import { portfolioContent } from "@/content/portfolio-content";
import type { ArticleSummary } from "@/content/portfolio-content";

function ArticleCard({ article, index }: { article: ArticleSummary; index: number }) {
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
        onClick={() => setLiked((v) => !v)}
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

        {article.tagline ? <p className="article-tagline">&quot;{article.tagline}&quot;</p> : null}

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

      {/* Preview panel */}
      <div className="article-image" aria-hidden>
        <div className="article-image-glow" />
        <span className="article-image-label">{article.source ?? "Article"}</span>
        <span className="article-image-likes">Likes: {likeCount}</span>
      </div>
    </article>
  );
}

// Per-card scale falloff in the stacked deck. ScrollStack pins card `i` at
// `baseScale + i * step`, so baseScale must be derived from the card count:
// the topmost (last) card pins at exactly 1 and each covered card sits one
// step below the card above it, never collapsing past ~0.9.
const CARD_SCALE_STEP = 0.012;

// Cloud-shaped mask for the section-bottom dissolve: the same cloud plate the
// footer uses, anchored to the bottom edge so card tops vanish into the puffs.
const cloudDissolveMask = {
  WebkitMaskImage: "url('/adaline-scenes/footer/footer-clouds.png')",
  maskImage: "url('/adaline-scenes/footer/footer-clouds.png')",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center bottom",
  maskPosition: "center bottom",
  WebkitMaskSize: "cover",
  maskSize: "cover",
  background: "linear-gradient(180deg, transparent 0%, #050e11 85%)",
} satisfies CSSProperties;

export function BlogsSection() {
  const articles = portfolioContent.articles ?? [];

  return (
    <section id="blogs" aria-labelledby="blogs-title" className="relative scroll-mt-28 pb-32 pt-20 sm:pt-24">
      <Container className="w-full">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Writing
        </p>
        <h2
          id="blogs-title"
          className="mt-2 text-center text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl"
        >
          My Articles
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--color-muted-ink)]">
          Scroll to flip through field notes from the cloud trenches. Sample stories for now — hover a
          card to bring it forward.
        </p>

        <div className="article-deck mt-12">
          <ScrollStack
            itemDistance={80}
            itemScale={CARD_SCALE_STEP}
            itemStackDistance={20}
            stackPosition="18%"
            scaleEndPosition="8%"
            baseScale={1 - Math.max(0, articles.length - 1) * CARD_SCALE_STEP}
            blurAmount={1.5}
          >
            {articles.map((article, index) => (
              <ScrollStackItem key={article.slug}>
                <ArticleCard article={article} index={index} />
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </Container>

      {/* Cloud dissolve into the footer night sky: the last cards rise into a
          cloud-masked gradient that lands exactly on the footer base #050e11,
          so the section boundary never shows as a hard cut. The plain seam
          layer underneath guarantees the bottom edge is solid even where the
          cloud plate's alpha has holes. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[50vh]">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 0%, transparent 35%, #050e11 100%)" }}
        />
        <div className="absolute inset-0" style={cloudDissolveMask} />
      </div>
    </section>
  );
}
