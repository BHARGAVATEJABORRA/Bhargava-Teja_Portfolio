import { portfolioContent } from "@/content/portfolio-content";

export type SocialPlatform = "github" | "linkedin";

interface ResolvedSocialLink {
  href: string;
  isConfigured: boolean;
}

interface RecruiterSafeLink {
  href: string;
  isConfigured: boolean;
  openInNewTab: boolean;
}

const socialHosts: Record<SocialPlatform, Set<string>> = {
  github: new Set(["github.com", "www.github.com"]),
  linkedin: new Set(["linkedin.com", "www.linkedin.com"]),
};

const genericRootHosts = new Set([
  "github.com",
  "www.github.com",
  "linkedin.com",
  "www.linkedin.com",
  "gitlab.com",
  "www.gitlab.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "instagram.com",
  "www.instagram.com",
  "credly.com",
  "www.credly.com",
  "snapchat.com",
  "www.snapchat.com",
]);

function isRootPath(pathname: string): boolean {
  return pathname === "/" || pathname === "";
}

function isGenericProfileUrl(href: string, platform: SocialPlatform): boolean {
  try {
    const parsed = new URL(href);
    const hostname = parsed.hostname.toLowerCase();

    if (!socialHosts[platform].has(hostname)) {
      return false;
    }

    if (platform === "github") {
      return isRootPath(parsed.pathname);
    }

    const normalizedPath = parsed.pathname.toLowerCase();
    return isRootPath(normalizedPath) || normalizedPath === "/in";
  } catch {
    return false;
  }
}

export function getResolvedSocialLink(platform: SocialPlatform): ResolvedSocialLink {
  const matched = portfolioContent.identity.socialLinks.find((link) => link.label.toLowerCase() === platform);
  const href = matched?.href;

  if (!href || isGenericProfileUrl(href, platform)) {
    return {
      href: "#contact",
      isConfigured: false,
    };
  }

  return {
    href,
    isConfigured: true,
  };
}

export function getResumeHref(): string {
  return portfolioContent.identity.resumeHref;
}

export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function isGenericRootExternalUrl(href: string): boolean {
  try {
    const parsed = new URL(href);
    return genericRootHosts.has(parsed.hostname.toLowerCase()) && isRootPath(parsed.pathname);
  } catch {
    return false;
  }
}

export function resolveRecruiterSafeLink(href?: string): RecruiterSafeLink {
  if (!href) {
    return {
      href: "#contact",
      isConfigured: false,
      openInNewTab: false,
    };
  }

  const trimmed = href.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return {
      href: "#contact",
      isConfigured: false,
      openInNewTab: false,
    };
  }

  if (isGenericRootExternalUrl(trimmed)) {
    return {
      href: "#contact",
      isConfigured: false,
      openInNewTab: false,
    };
  }

  return {
    href: trimmed,
    isConfigured: true,
    openInNewTab: isExternalUrl(trimmed),
  };
}
