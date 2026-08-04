"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { FiHeart } from "react-icons/fi";
import { FaSpotify } from "react-icons/fa6";

import { SPOTIFY_ENDPOINT, type SpotifyData } from "@/lib/spotify-types";

import { ControlCenterPanel } from "./control-center-panel";

// Keep the now-playing card in step with a track change. The API response is
// shared-edge cached for one second, so multiple visitors do not multiply
// Spotify requests while the browser still receives a revalidated response.
const SPOTIFY_REFRESH_INTERVAL_MS = 1_000;

function albumArtworkSrc(url: string) {
  return `/api/spotify/artwork?url=${encodeURIComponent(url)}`;
}
const WAVEFORM_HEIGHTS = [12, 22, 31, 17, 38, 25, 14, 34, 19, 29, 11, 27, 36, 16, 24, 33, 13];

const fetcher = async (url: string): Promise<SpotifyData> => {
  // `max-age=0` on the API response makes the browser revalidate every poll.
  // Do not use fetch's `no-store` mode here: it bypasses Vercel's one-second
  // shared cache and turns simultaneous visitors into duplicate API calls.
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Spotify endpoint ${response.status}`);
  const payload = (await response.json()) as SpotifyData;
  if (payload.detail && process.env.NODE_ENV !== "production") {
    // Surfaced in the dev console only — visitors always see the calm state.
    console.warn("[spotify-widget]", payload.detail);
  }
  return payload;
};

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden>
      {WAVEFORM_HEIGHTS.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          className="block w-[2px] origin-center rounded-full bg-white/90"
          style={{ height }}
          animate={active ? { scaleY: [0.45, 1, 0.58] } : { scaleY: 0.55 }}
          transition={
            active
              ? {
                  duration: 0.7 + (index % 5) * 0.11,
                  delay: index * 0.035,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.25 }
          }
        />
      ))}
    </div>
  );
}

function PlaybackProgress({ data }: { data: SpotifyData }) {
  const durationMs = Math.max(0, data.durationMs ?? 0);
  const serverProgressMs = Math.min(durationMs || Infinity, Math.max(0, data.progressMs ?? 0));
  const [progressMs, setProgressMs] = useState(serverProgressMs);

  // Use Spotify's latest sampled position when it is ahead of the local
  // playhead. This avoids synchronously setting state inside an effect.
  const displayedProgressMs = data.isPlaying
    ? Math.max(progressMs, serverProgressMs)
    : serverProgressMs;

  useEffect(() => {
    if (!data.isPlaying || durationMs <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgressMs((current) => Math.min(durationMs, current + 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [data.isPlaying, durationMs]);

  const hasTiming = durationMs > 0;
  const percentage = hasTiming
    ? Math.min(100, Math.max(0, (displayedProgressMs / durationMs) * 100))
    : data.isPlaying
      ? 38
      : 100;

  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
        <motion.div
          className="h-full rounded-full bg-white"
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between text-[0.68rem] font-medium tabular-nums text-white/65">
        <span>{hasTiming ? formatTime(displayedProgressMs) : data.isPlaying ? "Live" : "Played"}</span>
        <span>{hasTiming ? formatTime(durationMs) : "Spotify"}</span>
      </div>
    </div>
  );
}

type SpotifyCardProps = {
  data: SpotifyData;
  hasTrack: boolean;
  isPlaying: boolean;
  label: string;
};

function CompactSpotifyCard({ data, hasTrack, isPlaying, label }: SpotifyCardProps) {
  return (
    <ControlCenterPanel
      radius={32}
      className="group relative flex h-full min-h-0 w-full overflow-hidden bg-[#050806] text-white"
    >
      {data.albumImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={albumArtworkSrc(data.albumImageUrl)}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.16]"
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_25%,rgba(30,215,96,0.28),transparent_42%),linear-gradient(145deg,#173021,#030504_75%)]" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,3,0.16)_0%,rgba(2,4,3,0.42)_38%,rgba(2,4,3,0.96)_100%)]" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/12" />

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/78">
            <FaSpotify className="shrink-0 text-[#1ed760]" size={16} aria-hidden />
            {hasTrack ? (
              <a
                href={data.songUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={`Open ${data.title} in Spotify`}
              >
                {label}
              </a>
            ) : (
              <span className="truncate">{label}</span>
            )}
          </div>
          <Waveform active={isPlaying} />
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-white/62">{data.artist}</p>
              <h3 className="mt-0.5 truncate text-lg font-semibold tracking-[-0.03em] text-white">{data.title}</h3>
            </div>
            <FiHeart className="mb-1 shrink-0 text-white/90" size={24} aria-hidden />
          </div>

          <PlaybackProgress key={data.songUrl} data={data} />
        </div>
      </div>
    </ControlCenterPanel>
  );
}

export function SpotifyWidget() {
  const { data, error } = useSWR(SPOTIFY_ENDPOINT, fetcher, {
    refreshInterval: SPOTIFY_REFRESH_INTERVAL_MS,
    dedupingInterval: SPOTIFY_REFRESH_INTERVAL_MS,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
  });

  const isLoading = !data && !error;
  const hasTrack = Boolean(data?.songUrl && data.songUrl !== "#");
  const isPlaying = Boolean(data?.isPlaying);
  const label = data?.sourceLabel ?? (isPlaying ? "Now Playing" : hasTrack ? "Last Played" : "Spotify");
  const displayData: SpotifyData = data ?? {
    songUrl: "#",
    title: isLoading ? "Loading your soundtrack" : "Not listening right now",
    albumImageUrl: "",
    artist: isLoading ? "Connecting to Spotify…" : "The next track will appear here.",
    isPlaying: false,
    sourceLabel: "Spotify",
  };
  return <CompactSpotifyCard data={displayData} hasTrack={hasTrack} isPlaying={isPlaying} label={label} />;
}
