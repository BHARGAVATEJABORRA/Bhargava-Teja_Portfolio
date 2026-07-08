/**
 * Site-wide configuration: canonical key registry, types, and defaults.
 *
 * Values live in the Prisma `SiteConfig` table as JSON-encoded key-value rows
 * (see lib/content-store.ts for the DB accessors). Secrets (API keys, tokens)
 * are stored in the DB but are NEVER written to the public overlay
 * (content/portfolio-overrides.json) and are always masked in API responses.
 *
 * This module is intentionally free of Prisma/fs imports so both server code
 * and content/portfolio-content.ts can import the types and defaults.
 */

export interface SiteConfigStat {
  value: string;
  label: string;
}

export interface SiteConfigCustomLink {
  label: string;
  url: string;
}

export interface SiteConfigShape {
  // A. Identity & Hero
  fullName: string;
  roleLine: string;
  location: string;
  heroTagline: string;
  aboutBio: string;
  aboutSpecialties: string[];
  aboutStats: SiteConfigStat[];
  currentEmployer: string;
  // B. Social & Links
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  twitterUrl: string;
  customLink: SiteConfigCustomLink;
  // C. AI Companion
  openaiApiKey: string;
  openaiModel: string;
  aiSystemPrompt: string;
  aiEnabled: boolean;
  // D. Spotify Widget
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyRefreshToken: string;
  spotifyEnabled: boolean;
  // E. Site Metadata
  titleTemplate: string;
  metaDescription: string;
  ogImageUrl: string;
  analyticsId: string;
  // F. Contact
  contactHeading: string;
  contactSubheading: string;
  contactEmail: string;
  contactFormDestination: string;
  availableFor: string;
  showContactForm: boolean;
}

export type SiteConfigKey = keyof SiteConfigShape;

export const DEFAULT_SITE_CONFIG: SiteConfigShape = {
  // A. Identity & Hero — defaults mirror the static content in portfolio-content.ts
  fullName: "Bhargava Teja Borra",
  roleLine: "Software Engineer",
  location: "Addison (Dallas), TX, USA",
  heroTagline:
    "Architect and engineer scalable AWS infrastructure with measurable reliability, performance, and cost outcomes.",
  aboutBio:
    "I'm a software engineer with 4+ years building high-scale AWS cloud infrastructure for enterprise banking and Fortune 500 systems — currently at Capital One in Dallas. I design architectures that hold 99.9% uptime, automate everything repeatable with Terraform and CloudFormation, and build CI/CD pipelines that turned three-week release cycles into two-day ships. I care about practical engineering: clear ownership, measurable outcomes, and systems the next engineer can run without a manual.",
  aboutSpecialties: [
    "AWS Platform Engineering",
    "Infrastructure as Code",
    "CI/CD & Automation",
    "Observability & Reliability",
  ],
  aboutStats: [
    { value: "4+", label: "Years building cloud systems" },
    { value: "99.9%", label: "Uptime on banking workloads" },
    { value: "35%", label: "Cloud costs cut" },
  ],
  currentEmployer: "Capital One",
  // B. Social & Links
  email: "bhargavateja.borra@gmail.com",
  githubUrl: "https://github.com/BHARGAVATEJABORRA",
  linkedinUrl: "https://www.linkedin.com/in/bhargavatejaborra/",
  resumeUrl: "/bhargava-teja-borra-resume.pdf",
  twitterUrl: "",
  customLink: { label: "", url: "" },
  // C. AI Companion
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  aiSystemPrompt:
    "You are the AI companion on Bhargava Teja Borra's portfolio. Answer only from the provided portfolio context; if a detail is missing, say so directly. Keep answers concise, specific, and recruiter-friendly.",
  aiEnabled: false,
  // D. Spotify Widget
  spotifyClientId: "",
  spotifyClientSecret: "",
  spotifyRefreshToken: "",
  spotifyEnabled: false,
  // E. Site Metadata
  titleTemplate: "Bhargava Teja Borra | Software Engineer (Cloud & Platform)",
  metaDescription:
    "Recruiter-first software engineering portfolio with resume-backed cloud architecture, reliability, and delivery outcomes.",
  ogImageUrl: "/og-image.svg",
  analyticsId: "",
  // F. Contact
  contactHeading: "Let's build something reliable",
  contactSubheading: "Recruiter and hiring-manager outreach welcome — typically answered within one business day.",
  contactEmail: "bhargavateja.borra@gmail.com",
  contactFormDestination: "bhargavateja.borra@gmail.com",
  availableFor: "Open to senior IC and tech-lead opportunities in cloud, platform, and backend engineering",
  showContactForm: true,
};

export const SITE_CONFIG_KEYS = Object.keys(DEFAULT_SITE_CONFIG) as SiteConfigKey[];

/** Keys whose values are secrets: masked in API GET responses, excluded from the public overlay. */
export const SECRET_CONFIG_KEYS: readonly SiteConfigKey[] = [
  "openaiApiKey",
  "spotifyClientId",
  "spotifyClientSecret",
  "spotifyRefreshToken",
] as const;

export function isSecretConfigKey(key: string): key is SiteConfigKey {
  return (SECRET_CONFIG_KEYS as readonly string[]).includes(key);
}

/** "sk-…abcd" — keeps only the last 4 characters. Empty stays empty. */
export function maskSecret(value: string): string {
  if (!value) return "";
  return `••••${value.slice(-4)}`;
}

/** True when a submitted value is a masked placeholder (i.e. "don't change the stored secret"). */
export function isMaskedPlaceholder(value: unknown): boolean {
  return typeof value === "string" && /^•+.{0,4}$/.test(value);
}

/** The public (non-secret) projection written to content/portfolio-overrides.json. */
export type PublicSiteConfig = Omit<
  SiteConfigShape,
  "openaiApiKey" | "spotifyClientId" | "spotifyClientSecret" | "spotifyRefreshToken"
>;

export function toPublicSiteConfig(config: SiteConfigShape): PublicSiteConfig {
  const publicConfig: Record<string, unknown> = {};
  for (const key of SITE_CONFIG_KEYS) {
    if (!isSecretConfigKey(key)) publicConfig[key] = config[key];
  }
  return publicConfig as PublicSiteConfig;
}

/** Parse one stored JSON value with the default as the type/shape guard. */
export function coerceConfigValue<K extends SiteConfigKey>(key: K, raw: unknown): SiteConfigShape[K] {
  const fallback = DEFAULT_SITE_CONFIG[key];
  if (raw === undefined || raw === null) return fallback;
  if (typeof fallback === "boolean") return (typeof raw === "boolean" ? raw : fallback) as SiteConfigShape[K];
  if (typeof fallback === "string") return (typeof raw === "string" ? raw : fallback) as SiteConfigShape[K];
  if (Array.isArray(fallback)) return (Array.isArray(raw) ? raw : fallback) as SiteConfigShape[K];
  if (typeof fallback === "object") {
    return (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : fallback) as SiteConfigShape[K];
  }
  return fallback;
}
