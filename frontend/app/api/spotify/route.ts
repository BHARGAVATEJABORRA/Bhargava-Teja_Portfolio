import { NextResponse } from "next/server";

import { getSpotifyEnvConfig } from "@/lib/spotify-env";
import type { SpotifyData } from "@/lib/spotify-types";

const PLAYER_URL = "https://api.spotify.com/v1/me/player";
const TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=short_term";

type SpotifyTrack = {
  name?: string;
  external_urls?: { spotify?: string };
  album?: { images?: Array<{ url?: string }> };
  artists?: Array<{ name?: string }>;
};

type SpotifyPlaybackResponse = {
  is_playing?: boolean;
  item?: SpotifyTrack | null;
};

type SpotifyRecentlyPlayedResponse = {
  items?: Array<{ track?: SpotifyTrack | null }>;
};

type SpotifyTopTracksResponse = {
  items?: SpotifyTrack[];
};

type AccessTokenResult = {
  token: string;
  scopes: Set<string>;
};

type TrackLookupResult = {
  payload: SpotifyData | null;
  forbidden: boolean;
};

export type { SpotifyData };

// Visitor-facing fallbacks all read as a calm "nothing playing" state; the
// actual failure reason travels in `detail` so /api/spotify stays debuggable.
const OFFLINE: Omit<SpotifyData, "detail"> = {
  isPlaying: false,
  title: "Not listening right now",
  artist: "The track I'm playing shows up here live.",
  albumImageUrl: "",
  songUrl: "#",
  sourceLabel: "Spotify",
};

const UNCONFIGURED: SpotifyData = {
  ...OFFLINE,
  detail: "Add SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN to enable this widget",
};

const UNAVAILABLE: SpotifyData = {
  ...OFFLINE,
  detail: "Spotify did not return an access token or track data right now",
};

// Point re-auth instructions at whatever origin this deployment runs on
// (NEXT_PUBLIC_SITE_URL et al via getSpotifyEnvConfig) instead of localhost.
function tokenRejected(siteUrl: string): SpotifyData {
  return {
    ...OFFLINE,
    detail: `Spotify rejected the refresh token (likely expired or revoked). Re-mint it: open ${siteUrl}/api/auth/signin, authorize, then retry /api/spotify`,
  };
}

function forbidden(siteUrl: string): SpotifyData {
  return {
    ...OFFLINE,
    detail: `Spotify returned 403 on the player/track endpoints (usually missing scopes). Re-run ${siteUrl}/api/auth/signin to re-grant scopes`,
  };
}

async function getAccessToken(): Promise<AccessTokenResult | null> {
  const { clientId, clientSecret, refreshToken, isConfigured } = getSpotifyEnvConfig();

  if (!isConfigured) {
    return null;
  }

  let response: Response;

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string; scope?: string };
  if (!data.access_token) {
    return null;
  }

  return {
    token: data.access_token,
    scopes: new Set((data.scope ?? "").split(" ").filter(Boolean)),
  };
}

function trackToPayload(track: SpotifyTrack | null | undefined, isPlaying: boolean, sourceLabel: string): SpotifyData | null {
  if (!track?.name) {
    return null;
  }

  return {
    isPlaying,
    sourceLabel,
    songUrl: track.external_urls?.spotify ?? "#",
    title: track.name,
    albumImageUrl: track.album?.images?.[0]?.url ?? "",
    artist: track.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ?? "",
  };
}

async function getRecentlyPlayed(accessToken: string): Promise<TrackLookupResult> {
  const response = await fetch(`${PLAYER_URL}/recently-played?limit=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    return { payload: null, forbidden: response.status === 403 };
  }

  const data = JSON.parse(text || "{}") as SpotifyRecentlyPlayedResponse;
  return { payload: trackToPayload(data.items?.[0]?.track, false, "Last Played"), forbidden: false };
}

async function getTopTrack(accessToken: string): Promise<TrackLookupResult> {
  const response = await fetch(TOP_TRACKS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    return { payload: null, forbidden: response.status === 403 };
  }

  const data = JSON.parse(text || "{}") as SpotifyTopTracksResponse;
  return { payload: trackToPayload(data.items?.[0], false, "Top Track"), forbidden: false };
}

export async function GET() {
  const spotifyConfig = getSpotifyEnvConfig();

  if (!spotifyConfig.isConfigured) {
    return NextResponse.json(UNCONFIGURED, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    // We already know credentials are configured, so a null token means the
    // refresh exchange itself failed — almost always an expired/revoked token.
    return NextResponse.json(tokenRejected(spotifyConfig.siteUrl), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const nowPlayingResponse = await fetch(`${PLAYER_URL}/currently-playing`, {
      headers: { Authorization: `Bearer ${accessToken.token}` },
      cache: "no-store",
    });
    const nowPlayingText = await nowPlayingResponse.text();
    let wasForbidden = nowPlayingResponse.status === 403;

    if (nowPlayingResponse.ok && nowPlayingResponse.status !== 204) {
      const nowData = JSON.parse(nowPlayingText || "{}") as SpotifyPlaybackResponse;
      const payload = nowData.is_playing ? trackToPayload(nowData.item, true, "Now Playing") : null;

      if (payload) {
        return NextResponse.json(payload, {
          headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" },
        });
      }
    }

    const recent = await getRecentlyPlayed(accessToken.token);
    wasForbidden = wasForbidden || recent.forbidden;
    if (recent.payload) {
      return NextResponse.json(recent.payload, {
        headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" },
      });
    }

    const topTrack = accessToken.scopes.has("user-top-read")
      ? await getTopTrack(accessToken.token)
      : { payload: null, forbidden: false };
    wasForbidden = wasForbidden || topTrack.forbidden;
    if (topTrack.payload) {
      return NextResponse.json(topTrack.payload, {
        headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" },
      });
    }

    if (wasForbidden) {
      return NextResponse.json(forbidden(spotifyConfig.siteUrl), {
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(
      {
        ...UNAVAILABLE,
        detail: accessToken.scopes.has("user-top-read")
          ? "Token is valid but Spotify returned no current, recent, or top track — play something, then retry"
          : "Visit /api/auth/signin again to grant the updated top-track scope",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(UNAVAILABLE, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
