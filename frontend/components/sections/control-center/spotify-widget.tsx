"use client";

import useSWR from "swr";

import { SPOTIFY_ENDPOINT, type SpotifyData } from "@/lib/spotify-types";

import { ControlCenterPanel } from "./control-center-panel";

const fetcher = async (url: string): Promise<SpotifyData> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Spotify endpoint ${response.status}`);
  const payload = (await response.json()) as SpotifyData;
  if (payload.detail && process.env.NODE_ENV !== "production") {
    // Surfaced in the dev console only — visitors always see the calm state.
    console.warn("[spotify-widget]", payload.detail);
  }
  return payload;
};

export function SpotifyWidget() {
  const { data, error } = useSWR(SPOTIFY_ENDPOINT, fetcher, {
    refreshInterval: 10_000,
    revalidateOnFocus: true,
  });

  const isLoading = !data && !error;
  const hasTrack  = Boolean(data?.songUrl && data.songUrl !== "#");
  const isPlaying = Boolean(data?.isPlaying);
  const label     = data?.sourceLabel ?? (isPlaying ? "Now Playing" : hasTrack ? "Last Played" : "Spotify");

  // Disc / album art
  const disc = hasTrack && data?.albumImageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={data.albumImageUrl}
      alt={`Album art for ${data.title}`}
      className={`h-16 w-16 shrink-0 rounded-full object-cover shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:h-20 sm:w-20 ${
        isPlaying ? "animate-[spin_8s_linear_infinite]" : ""
      }`}
    />
  ) : (
    /* Plain ring — no brand icon */
    <div className="h-16 w-16 shrink-0 rounded-full border-2 border-[#1DB954]/30 bg-[#1DB954]/10 sm:h-20 sm:w-20" />
  );

  const trackInfo = (
    <div className="w-full min-w-0">
      <p className="truncate text-sm font-semibold text-[var(--color-ink)] transition-colors group-hover:text-[#1DB954]">
        {hasTrack ? data!.title : (data?.title ?? "Not listening right now")}
      </p>
      <p className="line-clamp-2 text-xs leading-snug text-[var(--color-muted-ink)]">
        {hasTrack ? data!.artist : (data?.artist || "Live track appears here when I press play.")}
      </p>
    </div>
  );

  return (
    <ControlCenterPanel radius={28} className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden p-4">

      {/* Header — no icon, just label + optional live dot */}
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1DB954]">
        {isPlaying && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1DB954] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1DB954]" />
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center" aria-label="Loading Spotify">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-full tint-border-bg-22 sm:h-20 sm:w-20" />
          <div className="w-full space-y-2">
            <div className="mx-auto h-3 w-3/4 animate-pulse rounded tint-border-bg-22" />
            <div className="mx-auto h-2.5 w-1/2 animate-pulse rounded tint-border-bg-22" />
          </div>
        </div>
      ) : hasTrack ? (
        <a
          href={data!.songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center"
        >
          {disc}
          {trackInfo}
        </a>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
          {disc}
          {trackInfo}
        </div>
      )}
    </ControlCenterPanel>
  );
}
