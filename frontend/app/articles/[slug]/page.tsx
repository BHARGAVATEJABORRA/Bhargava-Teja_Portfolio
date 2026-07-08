import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LuClock, LuCalendar } from "react-icons/lu";

import { BackToArticles } from "@/components/articles/back-to-articles";

import { portfolioContent } from "@/content/portfolio-content";
import { siteConfig } from "@/lib/site";

const articles = portfolioContent.articles ?? [];

function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };
  const ogImage = article.ogImage || siteConfig.ogImage;
  const url = `/articles/${slug}`;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url,
      siteName: "Bhargava Teja Borra Portfolio",
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const accent = article.accent ?? "#fcbc1d";
  const index = articles.findIndex((a) => a.slug === slug);
  const sheet = `ART-${String(index + 1).padStart(3, "0")}`;

  return (
    <main
      id="main-content"
      className="relative min-h-screen text-white"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d1f3c 48%, #060f1c 100%)" }}
    >
      {/* Blueprint grid + accent glow backdrop. */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(${accent}0d 1px, transparent 1px), linear-gradient(90deg, ${accent}0d 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="pointer-events-none fixed -right-40 -top-40 h-96 w-96 rounded-full blur-3xl"
        aria-hidden
        style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)` }}
      />

      <article className="relative mx-auto w-[min(92vw,760px)] px-1 py-14 sm:py-20">
        <BackToArticles />

        {/* Title block */}
        <div
          className="mt-8 rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: `${accent}40`, background: `${accent}0d` }}
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${accent}cc` }}>
            <span>{sheet}</span>
            <span className="truncate pl-3 text-white/55">{article.source ?? "Article"}</span>
          </div>

          <h1 className="mt-5 text-2xl font-bold leading-tight sm:text-4xl">{article.title}</h1>

          {article.tagline ? (
            <p
              className="mt-4 border-l-2 pl-4 text-base italic text-white/75 sm:text-lg"
              style={{ borderColor: `${accent}80` }}
            >
              &quot;{article.tagline}&quot;
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            {article.publishedAt ? (
              <span className="inline-flex items-center gap-1.5">
                <LuCalendar size={13} aria-hidden /> {article.publishedAt}
              </span>
            ) : null}
            {article.readTime ? (
              <span className="inline-flex items-center gap-1.5">
                <LuClock size={13} aria-hidden /> {article.readTime}
              </span>
            ) : null}
          </div>

          {article.tags && article.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border px-2.5 py-0.5 font-mono text-[11px]"
                  style={{ borderColor: `${accent}33`, backgroundColor: `${accent}12`, color: `${accent}dd` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="mt-10 space-y-6 text-[1.02rem] leading-[1.8] text-white/80">
          {article.premise ? (
            <p className="text-lg font-medium text-white/90">{article.premise}</p>
          ) : null}

          {(article.body ?? article.excerpt)
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}

          {article.takeaway ? (
            <div
              className="mt-8 rounded-xl border-l-4 p-5"
              style={{ borderColor: accent, background: `${accent}10` }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${accent}cc` }}>
                ↳ Takeaway
              </p>
              <p className="mt-2 text-white/85">{article.takeaway}</p>
            </div>
          ) : null}
        </div>

        {article.isReal === false ? (
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
            Sample article — illustrative content based on real project work.
          </p>
        ) : null}

        {article.isExternal && article.href && article.href !== "#" ? (
          <a
            href={article.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-xs font-semibold transition-colors hover:bg-white/5"
            style={{ borderColor: `${accent}66`, color: "#fff" }}
          >
            Read the original →
          </a>
        ) : null}
      </article>
    </main>
  );
}
