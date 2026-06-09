"use client";

import { SiSpotify } from "react-icons/si";
import useSWR from "swr";

import type { SpotifyData } from "@/app/api/spotify/route";

import { ControlCenterPanel } from "./control-center-panel";

const fetcher = async (url: string): Promise<SpotifyData> => {
  const response = await fetch(url);
  return (await response.json()) as SpotifyData;
};

export function SpotifyWidget() {
  const { data, error } = useSWR("/api/spotify", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const isLoading = !data && !error;
  const hasTrack = Boolean(data?.songUrl && data.songUrl !== "#");
  const label = data?.sourceLabel ?? (data?.isPlaying ? "Now Playing" : hasTrack ? "Last Played" : "Spotify");

  return (
    <ControlCenterPanel radius={28} className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        <SiSpotify size={14} className="shrink-0 text-[#1DB954]" aria-hidden />
        <span className="truncate">{label}</span>
      </div>

      {isLoading ? (
        <div className="mt-3 flex min-h-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full tint-border-bg-22" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded tint-border-bg-22" />
            <div className="h-2.5 w-1/2 animate-pulse rounded tint-border-bg-22" />
          </div>
        </div>
      ) : hasTrack ? (
        <a
          href={data!.songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-3 flex min-h-0 items-center gap-3"
        >
          {data!.albumImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data!.albumImageUrl}
              alt={`Album art for ${data!.title}`}
              className={`h-10 w-10 shrink-0 rounded-full object-cover ${data!.isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full tint-border-bg-22">
              <SiSpotify size={18} className="text-[#1DB954]" aria-hidden />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
              {data!.title}
            </p>
            <p className="truncate text-xs text-[var(--color-muted-ink)]">{data!.artist}</p>
          </div>
        </a>
      ) : (
        <div className="mt-3 min-h-0 space-y-1 overflow-hidden">
          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{data?.title ?? "Not listening right now"}</p>
          <p className="line-clamp-2 text-xs leading-snug text-[var(--color-muted-ink)]">
            {data?.artist || "Live track appears here when I press play."}
          </p>
        </div>
      )}
    </ControlCenterPanel>
  );
}
