"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FaGithub } from "react-icons/fa6";

import { portfolioContent } from "@/content/portfolio-content";

import { ControlCenterPanel } from "./control-center-panel";

const USERNAME = portfolioContent.identity.controlCenter.githubUsername || "BHARGAVATEJABORRA";

/**
 * Data comes straight from the browser via public CORS-enabled APIs so the
 * card keeps working on GitHub Pages (no server routes):
 *  - contributions: the same public API react-github-calendar uses
 *  - last push: GitHub REST (unauthenticated, 60 req/h — plenty at our cadence)
 */
const CONTRIBUTIONS_URL = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;
const LAST_PUSH_URL = `https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=1&type=owner`;

const HEATMAP_DAYS = 365;
const CELL = 10;
const GUTTER = 3;
const STEP = CELL + GUTTER;

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

interface ContributionResponse {
  total?: Record<string, number>;
  contributions?: Array<{ date?: string; count?: number; level?: number }>;
}

interface RepoResponse {
  pushed_at?: string;
}

/** Theme-aware heat colors: empty ink tint → full accent. */
const LEVEL_FILLS = [
  "color-mix(in srgb, var(--color-ink) 10%, transparent)",
  "color-mix(in srgb, var(--color-accent) 28%, transparent)",
  "color-mix(in srgb, var(--color-accent) 52%, transparent)",
  "color-mix(in srgb, var(--color-accent) 76%, transparent)",
  "var(--color-accent)",
];

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return (await response.json()) as T;
};

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  const mod10 = day % 10;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
}

/** "2026-04-09" → "April 9th" */
function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  return `${month} ${ordinal(date.getDate())}`;
}

/** ISO timestamp → "Wednesday, July 1st 2026" */
function formatPushedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  return `${weekday}, ${month} ${ordinal(date.getDate())} ${date.getFullYear()}`;
}

function toDaySeries(data: ContributionResponse | undefined): ContributionDay[] | null {
  if (!data?.contributions?.length) return null;

  const byDate = new Map<string, ContributionDay>();
  for (const day of data.contributions) {
    if (typeof day?.date !== "string") continue;
    const level = Math.min(4, Math.max(0, Number(day.level ?? 0))) as ContributionDay["level"];
    byDate.set(day.date, { date: day.date, count: Number(day.count ?? 0), level });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const series: ContributionDay[] = [];
  for (let offset = HEATMAP_DAYS - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(today);
    cursor.setUTCDate(cursor.getUTCDate() - offset);
    const date = cursor.toISOString().slice(0, 10);
    series.push(byDate.get(date) ?? { date, count: 0, level: 0 });
  }
  return series;
}

export function GitHubContributions() {
  const { data, error } = useSWR<ContributionResponse>(CONTRIBUTIONS_URL, jsonFetcher, {
    refreshInterval: 30 * 60_000,
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60_000,
  });
  const { data: repoData } = useSWR<RepoResponse[]>(LAST_PUSH_URL, jsonFetcher, {
    refreshInterval: 30 * 60_000,
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60_000,
  });

  const [hovered, setHovered] = useState<ContributionDay | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = toDaySeries(data);
  const weeks: ContributionDay[][] | null = days
    ? (() => {
        const chunks: ContributionDay[][] = [];
        for (let index = 0; index < days.length; index += 7) {
          chunks.push(days.slice(index, index + 7));
        }
        return chunks;
      })()
    : null;

  const total = days ? days.reduce((sum, day) => sum + day.count, 0) : null;
  const pushedAt = repoData?.[0]?.pushed_at ? formatPushedLabel(repoData[0].pushed_at) : null;

  // Land on the most recent weeks once data arrives (recent activity on the right).
  useEffect(() => {
    if (weeks && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(weeks)]);

  const svgWidth = (weeks?.length ?? 53) * STEP - GUTTER;
  const svgHeight = 7 * STEP - GUTTER;

  const headerDetail = hovered
    ? `${hovered.count} contribution${hovered.count === 1 ? "" : "s"} on ${formatDayLabel(hovered.date)}`
    : total !== null
      ? `${total} contributions in the last year`
      : "Loading contributions...";

  return (
    <ControlCenterPanel radius={32} className="flex h-full min-h-[16rem] flex-col justify-between p-4 sm:p-5">
      {/* Header: pill + live detail (swaps to the hovered day, jestsee-style) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] py-1.5 pl-3 pr-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          <FaGithub size={14} aria-hidden />
          <span>Github Activity</span>
        </div>
        <p className="truncate text-xs text-[var(--color-muted-ink)] tabular-nums" aria-live="polite">
          {error ? "Activity unavailable" : headerDetail}
        </p>
      </div>

      {/* Heatmap — fixed-size cells, horizontal scroll, newest at the right */}
      {!error && (
        <div ref={scrollRef} className="mt-3 w-full overflow-x-auto pb-1" onMouseLeave={() => setHovered(null)}>
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="block select-none"
            role="img"
            aria-label={total !== null ? `${total} GitHub contributions in the last year` : "GitHub contribution heatmap"}
          >
            {(weeks ?? Array.from({ length: 53 }, () => [] as ContributionDay[])).map((week, weekIndex) =>
              Array.from({ length: 7 }).map((_, dayIndex) => {
                const day = week[dayIndex];
                const isHovered = Boolean(day && hovered?.date === day.date);
                return (
                  <rect
                    key={`${weekIndex}-${dayIndex}`}
                    x={weekIndex * STEP}
                    y={dayIndex * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2.5}
                    fill={day ? LEVEL_FILLS[day.level] : LEVEL_FILLS[0]}
                    stroke={isHovered ? "var(--color-accent)" : "transparent"}
                    strokeWidth={isHovered ? 1.5 : 0}
                    className={day ? "cursor-pointer" : "animate-pulse"}
                    onMouseEnter={day ? () => setHovered(day) : undefined}
                  >
                    {day && (
                      <title>{`${day.count} contribution${day.count === 1 ? "" : "s"} on ${formatDayLabel(day.date)}`}</title>
                    )}
                  </rect>
                );
              }),
            )}
          </svg>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-[var(--color-muted-ink)]">Activity unavailable right now.</p>}

      {/* Footer: last push straight from the GitHub API */}
      <p className="mt-3 truncate text-xs text-[var(--color-muted-ink)]">
        {pushedAt ? `Last pushed on ${pushedAt}` : `@${USERNAME}`}
      </p>
    </ControlCenterPanel>
  );
}
