/**
 * Data layer between the Prisma/SQLite content database and the app-facing
 * content shapes in content/portfolio-content.ts.
 *
 * - Rows store array-ish fields as JSON strings; the mappers here parse them
 *   back into the exact interfaces the public components already consume.
 * - After every successful mutation the API routes call
 *   publishContentOverrides(), which snapshots the DB into
 *   content/portfolio-overrides.json — the overlay portfolio-content.ts merges
 *   at module load. In dev, webpack HMR picks the file up immediately; the
 *   static GitHub Pages export bakes it in at build time.
 *
 * Node runtime only (fs + Prisma).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { Article, Experience, Prisma, Project, Skill } from "@prisma/client";

import type {
  ArticleSummary,
  ExperienceCollection,
  ExperienceItem,
  ProjectSummary,
  SkillCategory,
} from "@/content/portfolio-content";
import { prisma } from "@/lib/db";
import {
  coerceConfigValue,
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_KEYS,
  toPublicSiteConfig,
  type PublicSiteConfig,
  type SiteConfigKey,
  type SiteConfigShape,
} from "@/lib/site-config";

const OVERRIDES_FILE = path.join(process.cwd(), "content", "portfolio-overrides.json");

export const EXPERIENCE_KINDS = ["work", "education", "certifications"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

// ---------------------------------------------------------------------------
// JSON column helpers
// ---------------------------------------------------------------------------

function parseStringArray(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function parseMetrics(raw: string): { value: string; label: string }[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (m): m is { value: string; label: string } =>
        !!m && typeof m === "object" && typeof (m as { value?: unknown }).value === "string" && typeof (m as { label?: unknown }).label === "string",
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Row -> content-shape mappers (id kept so the admin UI can address rows)
// ---------------------------------------------------------------------------

export type ProjectDto = ProjectSummary & { id: string };
export type ExperienceDto = ExperienceItem & { id: string; kind: ExperienceKind };
export type SkillDto = { id: string; category: string; name: string; iconKey: string; brandColor: string; keywords: string[] };
export type ArticleDto = ArticleSummary & { id: string };

export function toProjectDto(row: Project): ProjectDto {
  return {
    id: row.id,
    title: row.title,
    timeframe: row.timeframe,
    role: row.role,
    category: row.category,
    problem: row.problem,
    approach: row.approach,
    outcome: row.outcome,
    href: row.href,
    linkState: row.linkState === "configured" ? "configured" : "on-request",
    ...(row.liveUrl ? { liveUrl: row.liveUrl } : {}),
    ...(row.repoUrl ? { repoUrl: row.repoUrl } : {}),
    stack: parseStringArray(row.stack),
    techStack: parseStringArray(row.techStack),
    metrics: parseMetrics(row.metrics),
  };
}

export function toExperienceDto(row: Experience): ExperienceDto {
  return {
    id: row.id,
    kind: (EXPERIENCE_KINDS as readonly string[]).includes(row.kind) ? (row.kind as ExperienceKind) : "work",
    organization: row.organization,
    title: row.title,
    period: row.period,
    highlights: parseStringArray(row.highlights),
    ...(row.location ? { location: row.location } : {}),
    ...(row.href ? { href: row.href } : {}),
    ...(row.badgeUrl ? { badgeUrl: row.badgeUrl } : {}),
    ...(row.verifyUrl ? { verifyUrl: row.verifyUrl } : {}),
    ...(row.brandIconKey ? { brandIconKey: row.brandIconKey } : {}),
    ...(row.brandColor ? { brandColor: row.brandColor } : {}),
  };
}

export function toSkillDto(row: Skill): SkillDto {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    iconKey: row.iconKey,
    brandColor: row.brandColor,
    keywords: parseStringArray(row.keywords),
  };
}

export function toArticleDto(row: Article): ArticleDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt,
    readTime: row.readTime,
    href: row.href,
    isExternal: row.isExternal,
    isReal: row.isReal,
    premise: row.premise,
    takeaway: row.takeaway,
    tags: parseStringArray(row.tags),
    ...(row.source ? { source: row.source } : {}),
    ...(row.tagline ? { tagline: row.tagline } : {}),
    ...(row.body ? { body: row.body } : {}),
    ...(typeof row.likes === "number" ? { likes: row.likes } : {}),
    ...(row.accent ? { accent: row.accent } : {}),
  };
}

// ---------------------------------------------------------------------------
// Input validation (create/update payloads from the admin UI)
// ---------------------------------------------------------------------------

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function str(body: Record<string, unknown>, key: string, required: boolean): string | null | undefined {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return required ? undefined : null;
  }
  return typeof value === "string" ? value.trim() : undefined;
}

function strArray(body: Record<string, unknown>, key: string): string[] {
  const value = body[key];
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
}

export function validateProjectInput(body: Record<string, unknown>): ValidationResult<Prisma.ProjectCreateInput> {
  const required = ["title", "timeframe", "role", "category", "problem", "approach", "outcome"] as const;
  const values: Record<string, string> = {};
  for (const key of required) {
    const value = str(body, key, true);
    if (!value) return { ok: false, error: `"${key}" is required.` };
    values[key] = value;
  }

  const linkState = body.linkState === "configured" ? "configured" : "on-request";
  const metrics = Array.isArray(body.metrics)
    ? (body.metrics as unknown[]).filter(
        (m): m is { value: string; label: string } =>
          !!m && typeof m === "object" && typeof (m as { value?: unknown }).value === "string" && typeof (m as { label?: unknown }).label === "string",
      )
    : [];

  return {
    ok: true,
    data: {
      title: values.title,
      timeframe: values.timeframe,
      role: values.role,
      category: values.category,
      problem: values.problem,
      approach: values.approach,
      outcome: values.outcome,
      href: str(body, "href", false) || "#contact",
      linkState,
      liveUrl: str(body, "liveUrl", false) || null,
      repoUrl: str(body, "repoUrl", false) || null,
      stack: JSON.stringify(strArray(body, "stack")),
      techStack: JSON.stringify(strArray(body, "techStack")),
      metrics: JSON.stringify(metrics),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  };
}

export function validateExperienceInput(body: Record<string, unknown>): ValidationResult<Prisma.ExperienceCreateInput> {
  const kind = typeof body.kind === "string" && (EXPERIENCE_KINDS as readonly string[]).includes(body.kind) ? body.kind : undefined;
  if (!kind) return { ok: false, error: `"kind" must be one of: ${EXPERIENCE_KINDS.join(", ")}.` };

  const organization = str(body, "organization", true);
  const title = str(body, "title", true);
  const period = str(body, "period", true);
  if (!organization) return { ok: false, error: '"organization" is required.' };
  if (!title) return { ok: false, error: '"title" is required.' };
  if (!period) return { ok: false, error: '"period" is required.' };

  return {
    ok: true,
    data: {
      kind,
      organization,
      title,
      period,
      location: str(body, "location", false) || null,
      href: str(body, "href", false) || null,
      badgeUrl: str(body, "badgeUrl", false) || null,
      verifyUrl: str(body, "verifyUrl", false) || null,
      brandIconKey: str(body, "brandIconKey", false) || null,
      brandColor: str(body, "brandColor", false) || null,
      highlights: JSON.stringify(strArray(body, "highlights")),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  };
}

export function validateSkillInput(body: Record<string, unknown>): ValidationResult<Prisma.SkillCreateInput> {
  const category = str(body, "category", true);
  const name = str(body, "name", true);
  const iconKey = str(body, "iconKey", true);
  const brandColor = str(body, "brandColor", true);
  if (!category) return { ok: false, error: '"category" is required.' };
  if (!name) return { ok: false, error: '"name" is required.' };
  if (!iconKey) return { ok: false, error: '"iconKey" is required (a react-icons key, e.g. SiDocker).' };
  if (!brandColor) return { ok: false, error: '"brandColor" is required (e.g. #FF9900).' };

  return {
    ok: true,
    data: {
      category,
      name,
      iconKey,
      brandColor,
      keywords: JSON.stringify(strArray(body, "keywords")),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  };
}

export function validateArticleInput(body: Record<string, unknown>): ValidationResult<Prisma.ArticleCreateInput> {
  const required = ["slug", "title", "excerpt", "publishedAt", "readTime", "premise", "takeaway"] as const;
  const values: Record<string, string> = {};
  for (const key of required) {
    const value = str(body, key, true);
    if (!value) return { ok: false, error: `"${key}" is required.` };
    values[key] = value;
  }
  if (!/^[a-z0-9-]+$/.test(values.slug)) {
    return { ok: false, error: '"slug" must be lowercase letters, numbers, and hyphens only.' };
  }

  return {
    ok: true,
    data: {
      slug: values.slug,
      title: values.title,
      excerpt: values.excerpt,
      publishedAt: values.publishedAt,
      readTime: values.readTime,
      premise: values.premise,
      takeaway: values.takeaway,
      href: str(body, "href", false) || "#",
      isExternal: body.isExternal === true,
      isReal: body.isReal === true,
      source: str(body, "source", false) || null,
      tagline: str(body, "tagline", false) || null,
      body: str(body, "body", false) || null,
      likes: typeof body.likes === "number" ? body.likes : null,
      accent: str(body, "accent", false) || null,
      tags: JSON.stringify(strArray(body, "tags")),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// SiteConfig (key-value, JSON-encoded values)
//
// Intentionally raw SQL rather than the `prisma.siteConfig` model accessor:
// the table is created by prisma/migrations/20260708150000_add_site_config,
// and raw queries keep working even before `npx prisma generate` has been
// re-run against the updated schema (and stay correct after it has).
// ---------------------------------------------------------------------------

/** Read every stored key and merge over DEFAULT_SITE_CONFIG. */
export async function getSiteConfig(): Promise<SiteConfigShape> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.$queryRaw<{ key: string; value: string }[]>`SELECT "key", "value" FROM "SiteConfig"`;
  } catch {
    // Table missing (migration not applied yet) — serve defaults.
    return { ...DEFAULT_SITE_CONFIG };
  }

  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const config = { ...DEFAULT_SITE_CONFIG };
  for (const key of SITE_CONFIG_KEYS) {
    const raw = stored.get(key);
    if (raw === undefined) continue;
    try {
      setConfigField(config, key, coerceConfigValue(key, JSON.parse(raw) as unknown));
    } catch {
      // Corrupt row — keep the default.
    }
  }
  return config;
}

function setConfigField<K extends SiteConfigKey>(config: SiteConfigShape, key: K, value: SiteConfigShape[K]): void {
  config[key] = value;
}

/** Upsert a set of key-value pairs (values JSON-encoded). Unknown keys are rejected by the API layer. */
export async function setSiteConfigValues(values: Partial<SiteConfigShape>): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    const json = JSON.stringify(value);
    await prisma.$executeRaw`
      INSERT INTO "SiteConfig" ("key", "value", "createdAt", "updatedAt")
      VALUES (${key}, ${json}, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000)
      ON CONFLICT("key") DO UPDATE SET
        "value" = excluded."value",
        "updatedAt" = CAST(strftime('%s','now') AS INTEGER) * 1000
    `;
  }
}

/** Millisecond timestamp of the most recent SiteConfig edit, or null. */
export async function getSiteConfigLastUpdated(): Promise<number | null> {
  try {
    const rows = await prisma.$queryRaw<{ latest: number | bigint | null }[]>`
      SELECT MAX(CAST("updatedAt" AS INTEGER)) AS latest FROM "SiteConfig"
    `;
    const latest = rows[0]?.latest;
    return latest === null || latest === undefined ? null : Number(latest);
  } catch {
    return null;
  }
}

/** True once at least one config value has been saved. */
export async function isSiteConfigConfigured(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ n: number | bigint }[]>`SELECT COUNT(*) AS n FROM "SiteConfig"`;
    return Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Publish: snapshot the DB into the overlay consumed by the public site
// ---------------------------------------------------------------------------

function stripId<T extends { id: string }>(dto: T): Omit<T, "id"> {
  const rest: Record<string, unknown> = { ...dto };
  delete rest.id;
  return rest as Omit<T, "id">;
}

export async function getPublishedCollections(): Promise<{
  projects: ProjectSummary[];
  experience: ExperienceCollection;
  skills: SkillCategory[];
  articles: ArticleSummary[];
  siteConfig: PublicSiteConfig;
}> {
  const [projects, experiences, skills, articles, siteConfig] = await Promise.all([
    prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.skill.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.article.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    getSiteConfig(),
  ]);

  const experience: ExperienceCollection = { work: [], education: [], certifications: [] };
  for (const row of experiences) {
    const dto = toExperienceDto(row);
    const item = stripId(dto) as ExperienceItem & { kind?: ExperienceKind };
    delete item.kind;
    experience[dto.kind].push(item);
  }

  // Group flat skill rows into ordered categories (first-seen order).
  const categories = new Map<string, SkillCategory>();
  for (const row of skills) {
    const dto = toSkillDto(row);
    const entry = categories.get(dto.category) ?? { category: dto.category, skills: [] };
    entry.skills.push({
      name: dto.name,
      iconKey: dto.iconKey,
      brandColor: dto.brandColor,
      ...(dto.keywords.length ? { keywords: dto.keywords } : {}),
    });
    categories.set(dto.category, entry);
  }

  return {
    projects: projects.map((row) => stripId(toProjectDto(row))),
    experience,
    skills: [...categories.values()],
    articles: articles.map((row) => stripId(toArticleDto(row))),
    // Secrets are stripped here — only the public projection ever reaches the overlay file.
    siteConfig: toPublicSiteConfig(siteConfig),
  };
}

export async function publishContentOverrides(): Promise<void> {
  const collections = await getPublishedCollections();
  await fs.writeFile(OVERRIDES_FILE, `${JSON.stringify(collections, null, 2)}\n`, "utf8");
}
