import { portfolioContent, type ArticleSummary, type ProjectSummary } from "@/content/portfolio-content";
import { getResolvedSocialLink, resolveRecruiterSafeLink } from "@/lib/profile-links";
import { siteConfig } from "@/lib/site";
import { headers } from "next/headers";

export async function StructuredData({ projects, articles }: { projects: ProjectSummary[]; articles: ArticleSummary[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const socialProfiles = [getResolvedSocialLink("github"), getResolvedSocialLink("linkedin")]
    .filter((link) => link.isConfigured)
    .map((link) => link.href);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: portfolioContent.identity.name,
    alternateName: portfolioContent.identity.legalName,
    jobTitle: portfolioContent.identity.role,
    description: siteConfig.description,
    email: portfolioContent.identity.contactEmail,
    url: siteConfig.url,
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    url: siteConfig.url,
    description: siteConfig.description,
  };

  const projectListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Portfolio Projects",
    itemListElement: projects.map((project, index) => {
      const link = resolveRecruiterSafeLink(project.href);
      const hasPublicLink = project.linkState === "configured" && link.isConfigured;

      return {
        "@type": "CreativeWork",
        position: index + 1,
        name: project.title,
        description: project.outcome,
        ...(hasPublicLink ? { url: link.href } : {}),
      };
    }),
  };

  const publishedArticles = articles.filter(
    (article) => article.isReal === true && (article.href.startsWith("/") || /^https?:\/\//.test(article.href)),
  );
  const articleListSchema =
    publishedArticles.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Technical Articles",
          itemListElement: publishedArticles.map((article, index) => ({
            "@type": "Article",
            position: index + 1,
            headline: article.title,
            description: article.premise,
            url: article.href,
          })),
        }
      : null;

  const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(personSchema) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(websiteSchema) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(projectListSchema) }} />
      {articleListSchema ? <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(articleListSchema) }} /> : null}
    </>
  );
}
