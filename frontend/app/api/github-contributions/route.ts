import { NextResponse } from "next/server";

import { portfolioContent } from "@/content/portfolio-content";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const USERNAME = portfolioContent.identity.controlCenter.githubUsername || "BHARGAVATEJABORRA";
const DAYS_TO_RENDER = 365;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getContributionRange() {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);

  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (DAYS_TO_RENDER - 1));

  return { from, to };
}

function parseContributionCount(tooltipText: string) {
  const normalized = tooltipText.replace(/\s+/g, " ").trim();

  if (normalized.toLowerCase().startsWith("no contributions")) {
    return 0;
  }

  const countMatch = normalized.match(/(\d+)\s+contribution/i);
  return countMatch ? Number(countMatch[1]) : 0;
}

function extractContributionsFromHtml(html: string) {
  const contributionPattern =
    /data-date="([^"]+)"[^>]*data-level="([0-4])"[\s\S]*?<tool-tip[^>]*>([\s\S]*?)<\/tool-tip>/g;

  const contributionsByDate = new Map<string, ContributionDay>();

  for (const match of html.matchAll(contributionPattern)) {
    const [, date, rawLevel, tooltipText] = match;
    const level = Number(rawLevel) as ContributionDay["level"];

    contributionsByDate.set(date, {
      date,
      count: parseContributionCount(tooltipText),
      level,
    });
  }

  return contributionsByDate;
}

function buildContributionSeries(contributionsByDate: Map<string, ContributionDay>, from: Date, to: Date) {
  const contributions: ContributionDay[] = [];
  const cursor = new Date(from);

  while (cursor <= to) {
    const date = formatDate(cursor);
    contributions.push(
      contributionsByDate.get(date) ?? {
        date,
        count: 0,
        level: 0,
      },
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return contributions;
}

async function fetchOfficialContributionYear(year: number) {
  const response = await fetch(
    `https://github.com/users/${USERNAME}/contributions?from=${year}-01-01&to=${year}-12-31`,
    {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "bhargava-portfolio/1.0",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub contributions for ${year}`);
  }

  const html = await response.text();
  return extractContributionsFromHtml(html);
}

async function fetchOfficialContributions() {
  const { from, to } = getContributionRange();
  const years = Array.from(new Set([from.getUTCFullYear(), to.getUTCFullYear()]));
  const yearlyContributionMaps = await Promise.all(years.map((year) => fetchOfficialContributionYear(year)));
  const contributionsByDate = new Map<string, ContributionDay>();

  for (const yearlyMap of yearlyContributionMaps) {
    for (const [date, contribution] of yearlyMap.entries()) {
      contributionsByDate.set(date, contribution);
    }
  }

  const contributions = buildContributionSeries(contributionsByDate, from, to);

  if (contributions.length === 0) {
    throw new Error("GitHub contributions payload was empty");
  }

  const total = contributions.reduce((sum, day) => sum + day.count, 0);

  return {
    contributions,
    total: { lastYear: total },
    source: "github",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchFallbackContributions() {
  const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Fallback contributions fetch failed");
  }

  const data = await response.json();
  const { from, to } = getContributionRange();
  const contributionsByDate = new Map<string, ContributionDay>();

  for (const contribution of data.contributions ?? []) {
    if (typeof contribution?.date !== "string") {
      continue;
    }

    contributionsByDate.set(contribution.date, {
      date: contribution.date,
      count: Number(contribution.count ?? 0),
      level: Number(contribution.level ?? 0) as ContributionDay["level"],
    });
  }

  const contributions = buildContributionSeries(contributionsByDate, from, to);
  const total = contributions.reduce((sum, day) => sum + day.count, 0);

  return {
    contributions,
    total: { lastYear: total },
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const data = await fetchOfficialContributions();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    try {
      const fallback = await fetchFallbackContributions();
      return NextResponse.json(fallback, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    } catch {
      return NextResponse.json({ error: "unavailable" }, { status: 200 });
    }
  }
}
