import { portfolioContent } from "@/content/portfolio-content";

const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeUrlCandidate(candidate: string): string {
  const trimmed = candidate.trim();

  if (!trimmed) {
    return "";
  }

  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const withProtocol = hasProtocol
    ? trimmed
    : trimmed.includes("localhost") || trimmed.startsWith("127.0.0.1")
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    DEFAULT_SITE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeUrlCandidate(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_SITE_URL;
}

function isRenderableArticleHref(href: string): boolean {
  return href.startsWith("/") || /^https?:\/\//.test(href);
}

function hasRealArticles(): boolean {
  return portfolioContent.articles.some((article) => article.isReal === true && isRenderableArticleHref(article.href));
}

function hasPublishedArticles(): boolean {
  return portfolioContent.articles.length > 0;
}

const resolvedSiteUrl = resolveSiteUrl();

// Title/description/OG image are admin-editable via /admin/settings (Site
// Metadata section) and flow through the portfolio-overrides overlay.
export const siteConfig = {
  title: portfolioContent.meta.titleTemplate,
  description: portfolioContent.meta.description,
  url: resolvedSiteUrl,
  ogImage: portfolioContent.meta.ogImage,
  analyticsId: portfolioContent.meta.analyticsId,
};

export const contentAvailability = {
  hasRealArticles: hasRealArticles(),
  hasPublishedArticles: hasPublishedArticles(),
};

export const coreSectionLinks = [
  { href: "/#about", label: "About" },
  { href: "/#skills", label: "Skills" },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  ...(contentAvailability.hasPublishedArticles ? [{ href: "/#blogs", label: "Articles" }] : []),
  { href: "/#contact", label: "Contact" },
];
