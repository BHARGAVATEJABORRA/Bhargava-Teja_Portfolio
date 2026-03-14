import { portfolioContent } from "@/content/portfolio-content";
import { siteConfig } from "@/lib/site";

export function StructuredData() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: portfolioContent.identity.name,
    jobTitle: portfolioContent.identity.role,
    description: siteConfig.description,
    email: portfolioContent.identity.contactEmail,
    url: siteConfig.url,
    sameAs: portfolioContent.identity.socialLinks.map((item) => item.href),
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
    itemListElement: portfolioContent.projects.map((project, index) => ({
      "@type": "CreativeWork",
      position: index + 1,
      name: project.title,
      description: project.outcome,
      url: project.href,
    })),
  };

  const articleListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Technical Articles",
    itemListElement: portfolioContent.articles.map((article, index) => ({
      "@type": "Article",
      position: index + 1,
      headline: article.title,
      description: article.premise,
      url: article.href,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleListSchema) }} />
    </>
  );
}
