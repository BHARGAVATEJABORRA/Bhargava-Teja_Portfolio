/**
 * Seeds the content database from the static defaults in
 * content/portfolio-content.ts. Idempotent: skips any collection that already
 * has rows, so re-running never clobbers admin edits.
 *
 * Run with: npm run db:seed  (or npx prisma db seed)
 */

import { PrismaClient } from "@prisma/client";

import { portfolioContent } from "../content/portfolio-content";
import { DEFAULT_SITE_CONFIG } from "../lib/site-config";

const prisma = new PrismaClient();

async function seedProjects() {
  if ((await prisma.project.count()) > 0) return "skipped (has rows)";
  await prisma.project.createMany({
    data: portfolioContent.projects.map((p, i) => ({
      title: p.title,
      timeframe: p.timeframe,
      role: p.role,
      category: p.category,
      problem: p.problem,
      approach: p.approach,
      outcome: p.outcome,
      href: p.href,
      linkState: p.linkState,
      liveUrl: p.liveUrl ?? null,
      repoUrl: p.repoUrl ?? null,
      stack: JSON.stringify(p.stack),
      techStack: JSON.stringify(p.techStack),
      metrics: JSON.stringify(p.metrics ?? []),
      sortOrder: i,
    })),
  });
  return `${portfolioContent.projects.length} rows`;
}

async function seedExperience() {
  if ((await prisma.experience.count()) > 0) return "skipped (has rows)";
  const kinds = ["work", "education", "certifications"] as const;
  let total = 0;
  for (const kind of kinds) {
    const items = portfolioContent.experience[kind];
    await prisma.experience.createMany({
      data: items.map((item, i) => ({
        kind,
        organization: item.organization,
        title: item.title,
        period: item.period,
        location: item.location ?? null,
        href: item.href ?? null,
        badgeUrl: item.badgeUrl ?? null,
        verifyUrl: item.verifyUrl ?? null,
        brandIconKey: item.brandIconKey ?? null,
        brandColor: item.brandColor ?? null,
        highlights: JSON.stringify(item.highlights),
        sortOrder: i,
      })),
    });
    total += items.length;
  }
  return `${total} rows`;
}

async function seedSkills() {
  if ((await prisma.skill.count()) > 0) return "skipped (has rows)";
  let order = 0;
  let total = 0;
  for (const category of portfolioContent.skills) {
    await prisma.skill.createMany({
      data: category.skills.map((skill) => ({
        category: category.category,
        name: skill.name,
        iconKey: skill.iconKey,
        brandColor: skill.brandColor,
        keywords: JSON.stringify(skill.keywords ?? []),
        sortOrder: order++,
      })),
    });
    total += category.skills.length;
  }
  return `${total} rows`;
}

async function seedArticles() {
  if ((await prisma.article.count()) > 0) return "skipped (has rows)";
  await prisma.article.createMany({
    data: portfolioContent.articles.map((a, i) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      publishedAt: a.publishedAt,
      readTime: a.readTime,
      href: a.href,
      isExternal: a.isExternal ?? false,
      isReal: a.isReal ?? false,
      premise: a.premise,
      takeaway: a.takeaway,
      source: a.source ?? null,
      tagline: a.tagline ?? null,
      body: a.body ?? null,
      likes: a.likes ?? null,
      accent: a.accent ?? null,
      tags: JSON.stringify(a.tags ?? []),
      sortOrder: i,
    })),
  });
  return `${portfolioContent.articles.length} rows`;
}

async function seedSiteConfig() {
  // Raw SQL (not prisma.siteConfig) so seeding works even with a client
  // generated before the SiteConfig model was added. INSERT OR IGNORE keeps
  // it idempotent per key — re-running never clobbers admin edits.
  let inserted = 0;
  for (const [key, value] of Object.entries(DEFAULT_SITE_CONFIG)) {
    inserted += await prisma.$executeRaw`
      INSERT OR IGNORE INTO "SiteConfig" ("key", "value", "createdAt", "updatedAt")
      VALUES (${key}, ${JSON.stringify(value)}, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
    `;
  }
  return inserted > 0 ? `${inserted} keys` : "skipped (has rows)";
}

async function main() {
  console.log("projects:", await seedProjects());
  console.log("experience:", await seedExperience());
  console.log("skills:", await seedSkills());
  console.log("articles:", await seedArticles());
  console.log("siteConfig:", await seedSiteConfig());
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
