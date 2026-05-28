"use client";

import { SiSpotify } from "react-icons/si";
import useSWR from "swr";

import type { SpotifyData } from "@/app/api/spotify/route";

import { ControlCenterPanel } from "./control-center-panel";

const fetcher = async (url: string): Promise<SpotifyData> => {
  const response = await fetch(url);
  return (await response.json()) as SpotifyData;
};

interface SpotifyWidgetProps {
  isConfigured: boolean;
}

export function SpotifyWidget({ isConfigured }: SpotifyWidgetProps) {
  const { data, error } = useSWR(isConfigured ? "/api/spotify" : null, fetcher, {
    refreshInterval: 10_000,
  });

  if (!isConfigured) {
    return (
      <ControlCenterPanel radius={28} className="space-y-3 p-4">
        <div className="flex items-center gap-1.5">
          <SiSpotify size={12} className="text-[#1DB954]" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Spotify
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Spotify integration coming soon</p>
          <p className="text-xs leading-relaxed text-[var(--color-muted-ink)]">
            Add a Spotify refresh token in <code>.env.local</code> to enable this widget locally.
          </p>
        </div>
      </ControlCenterPanel>
    );
  }

  const isLoading = !data && !error;

  if (isLoading) {
    return (
      <ControlCenterPanel radius={28} className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="flex gap-3">
          <div className="h-14 w-14 animate-pulse rounded-full bg-[var(--color-border)]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--color-border)]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[var(--color-border)]" />
          </div>
        </div>
      </ControlCenterPanel>
    );
  }

  return (
    <ControlCenterPanel radius={28} className="space-y-3 p-4">
      <div className="flex items-center gap-1.5">
        <SiSpotify size={12} className="text-[#1DB954]" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {data?.isPlaying ? "Now Playing" : "Last Played"}
        </p>
      </div>

      {data?.songUrl && data.songUrl !== "#" ? (
        <a href={data.songUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
          {data.albumImageUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
              <img
                src={data.albumImageUrl}
                alt={`Album art for ${data.title}`}
                className={`h-full w-full rounded-full object-cover ${data.isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)]">
              <SiSpotify size={20} className="text-[#1DB954]" aria-hidden />
            </div>
          )}

          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
              {data.title}
            </p>
            <p className="truncate text-xs text-[var(--color-muted-ink)]">{data.artist}</p>
          </div>
        </a>
      ) : (
        <p className="text-xs text-[var(--color-muted-ink)]">Spotify is configured, but playback data is unavailable right now.</p>
      )}
    </ControlCenterPanel>
  );
}
