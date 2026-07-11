"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LuArrowRight, LuThumbsUp } from "react-icons/lu";

import { getActiveLenis } from "@/lib/smooth-scroll-instance";

import { BorderGlowCard } from "@/components/ui/border-glow-card";
import { portfolioContent } from "@/content/portfolio-content";
import type { ArticleSummary } from "@/content/portfolio-content";
import { useLikes } from "@/lib/use-likes";

function ArticleCard({
  article,
  index,
  liked,
  likeCount,
  onToggleLike,
}: {
  article: ArticleSummary;
  index: number;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
}) {
  // Blueprint look (ported from the original Projects cards), reworked to feel
  // more like a real engineering drawing sheet: a deep technical-blue panel
  // with an accent-tinted grid, a title-block header strip with the sheet
  // number, corner registration ticks, and an accent glow. Each article's own
  // accent tints the grid, header, corners, chips, and glow.
  const accent = article.accent ?? "#fcbc1d";
  const sheet = `ART-${String(index + 1).padStart(3, "0")}`;

  return (
    <BorderGlowCard
      glowColor={accent}
      className="h-[470px] w-[min(82vw,380px)] shrink-0"
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border"
        style={{
          background: "linear-gradient(150deg, #0a1628 0%, #0d1f3c 52%, #071422 100%)",
          borderColor: `${accent}40`,
        }}
      >
        {/* Faint engineering grid, tinted to the card accent. */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage: `linear-gradient(${accent}12 1px, transparent 1px), linear-gradient(90deg, ${accent}12 1px, transparent 1px)`,
            backgroundSize: "26px 26px",
          }}
        />
        {/* Soft corner glow in the card accent. */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
          aria-hidden
          style={{ background: `radial-gradient(circle, ${accent}40, transparent 70%)` }}
        />

        {/* Corner registration ticks. */}
        <span className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 border-l border-t" style={{ borderColor: `${accent}66` }} aria-hidden />
        <span className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 border-r border-t" style={{ borderColor: `${accent}66` }} aria-hidden />
        <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b border-l" style={{ borderColor: `${accent}66` }} aria-hidden />
        <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b border-r" style={{ borderColor: `${accent}66` }} aria-hidden />

        {/* Title-block header strip. */}
        <div
          className="relative flex items-center justify-between border-b px-6 py-3"
          style={{ borderColor: `${accent}33`, background: `${accent}0f` }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${accent}cc` }}>
            {sheet}
          </span>
          <span className="truncate pl-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            {article.source ?? "Article"}
          </span>
          {/* Like button — sits inside the header, no clipping. */}
          <button
            type="button"
            onClick={onToggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike article" : "Like article"}
            className="ml-3 inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] transition-colors"
            style={{
              borderColor: liked ? accent : `${accent}55`,
              background: liked ? `${accent}22` : "transparent",
              color: liked ? "#fff" : `${accent}cc`,
            }}
          >
            <LuThumbsUp size={14} aria-hidden />
            {likeCount}
          </button>
        </div>

        <div className="relative flex flex-1 flex-col px-6 pb-6 pt-5">
          <h3 className="font-mono text-lg font-bold leading-snug text-white">{article.title}</h3>

          {article.tagline ? (
            <p className="mt-2 border-l-2 pl-3 text-xs italic text-white/70" style={{ borderColor: `${accent}80` }}>
              &quot;{article.tagline}&quot;
            </p>
          ) : null}

          <div className="mt-4 space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: `${accent}99` }}>
              ↳ Overview
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-white/65">
              {article.body ?? article.excerpt}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border px-2 py-0.5 font-mono text-[10px]"
                style={{
                  borderColor: `${accent}33`,
                  backgroundColor: `${accent}10`,
                  color: `${accent}cc`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            className="mt-auto flex items-center justify-between gap-3 border-t pt-4"
            style={{ borderColor: `${accent}22` }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              {article.readTime}
            </span>
            <Link
              href={`/articles/${article.slug}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2"
              style={{ borderColor: `${accent}66` }}
            >
              Learn More <LuArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </BorderGlowCard>
  );
}

export function BlogsSection() {
  const articles = portfolioContent.articles ?? [];
  const likes = useLikes("article");

  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeArticle = articles[activeIndex] ?? articles[0];

  // Drive the horizontal translate from scroll progress manually. We read the
  // track's geometry on every scroll tick (works with native scroll and Lenis)
  // and write the transform straight to the element — no animation library
  // between the scroll position and the pixels. (Ported from ProjectsSection.)
  useEffect(() => {
    if (articles.length < 2) return;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));

    let travel = 0;
    let currentTranslate = 0;

    const measureTravel = () => {
      const gallery = galleryRef.current;
      if (!gallery || gallery.children.length < 2) return 0;
      const cards = gallery.children;
      const firstRect = cards[0].getBoundingClientRect();
      const lastRect = cards[cards.length - 1].getBoundingClientRect();
      const firstCenter = firstRect.left + firstRect.width / 2 - currentTranslate;
      const lastCenter = lastRect.left + lastRect.width / 2 - currentTranslate;
      return Math.max(0, lastCenter - firstCenter);
    };

    const update = () => {
      const track = containerRef.current;
      const gallery = galleryRef.current;
      if (!track || !gallery) return;
      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance > 0 ? clamp(-rect.top / distance) : 0;
      currentTranslate = -progress * travel;
      gallery.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;

      const nextIndex = Math.round(progress * (articles.length - 1));
      if (activeIndexRef.current !== nextIndex) {
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }
    };

    const remeasure = () => {
      travel = measureTravel();
      update();
    };

    remeasure();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", remeasure);

    const lenis = getActiveLenis();
    lenis?.on("scroll", update);

    // Fonts/layout can settle after mount; re-measure a few times.
    const timeouts = [200, 600, 1200].map((delay) => window.setTimeout(remeasure, delay));

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", remeasure);
      lenis?.off("scroll", update);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [articles.length]);

  // Stable, SSR-safe scroll-track height. One extra "screen" of scroll per card.
  const trackHeightVh = 100 + (articles.length - 1) * 55;

  return (
    <section id="blogs" aria-label="Articles" className="scroll-mt-28">
      {/* Tall scroll track; the gallery sticks and translates horizontally as you scroll. */}
      <div
        ref={containerRef}
        className="projects-scroll-track relative"
        style={{ height: `${trackHeightVh}vh` }}
      >
        <div className="projects-sticky sticky top-0 flex h-svh items-center overflow-hidden">
          <div className="projects-scroll-title pointer-events-none absolute left-4 right-4 top-[8rem] z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 sm:left-6 sm:right-6 md:top-[calc(4.5rem+env(safe-area-inset-top))] lg:top-24">
            <div className="min-w-0">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-muted)]">Articles</p>
              <h3 className="truncate text-xl font-bold leading-tight text-[var(--color-ink)] sm:text-2xl">{activeArticle?.title}</h3>
            </div>
            {activeArticle?.source ? (
              <p
                className="hidden shrink-0 rounded-full border px-3 py-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] sm:block"
                style={{
                  borderColor: `${activeArticle.accent ?? "#fcbc1d"}55`,
                  backgroundColor: `${activeArticle.accent ?? "#fcbc1d"}12`,
                  color: activeArticle.accent ?? "#fcbc1d",
                }}
              >
                {activeArticle.source}
              </p>
            ) : null}
          </div>

          <div
            ref={galleryRef}
            className="projects-gallery flex gap-6 pl-[max(1.5rem,calc(50vw-190px))] pr-[50vw] will-change-transform"
          >
            {articles.map((article, index) => (
              <ArticleCard
                key={article.slug}
                article={article}
                index={index}
                liked={likes.isLiked(article.slug)}
                likeCount={likes.count(article.slug)}
                onToggleLike={() => likes.toggle(article.slug)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
