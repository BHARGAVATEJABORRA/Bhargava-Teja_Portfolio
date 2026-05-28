"use client";

import useSWR from "swr";
import { FaGithub } from "react-icons/fa6";

import { ControlCenterPanel } from "./control-center-panel";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

interface ContributionResponse {
  error?: string;
  contributions?: ContributionDay[];
  total?: Record<string, number>;
  fetchedAt?: string;
  source?: string;
}

const HEATMAP_DAYS = 365;
const HEATMAP_COLUMNS = Math.ceil(HEATMAP_DAYS / 7);

const LEVEL_STYLES: Record<number, string> = {
  0: "border-[color:var(--color-border)/0.28] bg-[color:var(--color-border)/0.14]",
  1: "border-[color:var(--color-accent)/0.2] bg-[color:var(--color-accent)/0.2]",
  2: "border-[color:var(--color-accent)/0.32] bg-[color:var(--color-accent)/0.38]",
  3: "border-[color:var(--color-accent)/0.4] bg-[color:var(--color-accent)/0.6]",
  4: "border-[color:var(--color-accent)] bg-[var(--color-accent)]",
};

const fetcher = async (url: string): Promise<ContributionResponse> => {
  const response = await fetch(url);
  return (await response.json()) as ContributionResponse;
};

export function GitHubContributions() {
  const { data, error } = useSWR("/api/github-contributions", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    dedupingInterval: 20_000,
  });

  const weeks: ContributionDay[][] | null = data?.contributions
    ? (() => {
        const lastYear = data.contributions.slice(-HEATMAP_DAYS);
        const chunks: ContributionDay[][] = [];
        for (let index = 0; index < lastYear.length; index += 7) {
          chunks.push(lastYear.slice(index, index + 7));
        }
        return chunks;
      })()
    : null;

  const total = data?.total?.lastYear ?? null;
  const updatedLabel = data?.fetchedAt
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(data.fetchedAt))
    : null;

  return (
    <ControlCenterPanel radius={32} className="flex h-full min-h-[17.5rem] flex-col p-4 sm:min-h-[18.5rem] sm:p-5">
      <div className="flex items-center gap-2.5 text-[var(--color-ink)]">
        <FaGithub size={18} aria-hidden />
        <h3 className="text-base font-semibold sm:text-lg">GitHub Contributions</h3>
      </div>

      {error || data?.error ? (
        <p className="mt-4 text-sm text-[var(--color-muted-ink)]">Activity unavailable</p>
      ) : !weeks ? (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="inline-flex min-w-max gap-0.5 sm:gap-1">
            {Array.from({ length: HEATMAP_COLUMNS }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1">
                {Array.from({ length: 7 }).map((__, dayIndex) => (
                  <div key={dayIndex} className="h-2.5 w-2.5 animate-pulse rounded-full bg-[color:var(--color-border)/0.22] sm:h-3 sm:w-3" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="inline-flex min-w-max gap-0.5 sm:gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    title={`${day.date}: ${day.count} contributions`}
                    className={`h-2.5 w-2.5 rounded-full border ${LEVEL_STYLES[day.level]} sm:h-3 sm:w-3`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-4 text-sm text-[var(--color-muted-ink)] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>{total !== null ? `${total} contributions in the last year` : "Loading contribution totals..."}</p>
          <p className="text-[11px] text-[var(--color-muted-ink)]/80">
            {data?.source === "fallback"
              ? "Fallback source in use."
              : updatedLabel
                ? `Live from GitHub. Updated ${updatedLabel}.`
                : "Live from GitHub."}
          </p>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`h-3 w-3 rounded-full border ${LEVEL_STYLES[level]}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </ControlCenterPanel>
  );
}
