import { NextResponse } from "next/server";

import { getSpotifyEnvConfig } from "@/lib/spotify-env";

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
  premiumBlocked: boolean;
};

export type SpotifyData = {
  songUrl: string;
  title: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
  sourceLabel: string;
};

const UNCONFIGURED: SpotifyData = {
  isPlaying: false,
  title: "Spotify integration coming soon",
  artist: "Add credentials and a refresh token to enable this widget",
  albumImageUrl: "",
  songUrl: "#",
  sourceLabel: "Spotify",
};

const UNAVAILABLE: SpotifyData = {
  isPlaying: false,
  title: "Spotify unavailable",
  artist: "Spotify did not return an access token or track data right now",
  albumImageUrl: "",
  songUrl: "#",
  sourceLabel: "Spotify",
};

const PREMIUM_REQUIRED: SpotifyData = {
  isPlaying: false,
  title: "Spotify Premium required",
  artist: "Spotify accepted the token but blocked track endpoints for this app/account",
  albumImageUrl: "",
  songUrl: "#",
  sourceLabel: "Spotify",
};

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

function isPremiumBlockedMessage(value: string): boolean {
  return value.toLowerCase().includes("premium subscription required");
}

async function getRecentlyPlayed(accessToken: string): Promise<TrackLookupResult> {
  const response = await fetch(`${PLAYER_URL}/recently-played?limit=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    return { payload: null, premiumBlocked: isPremiumBlockedMessage(text) };
  }

  const data = JSON.parse(text || "{}") as SpotifyRecentlyPlayedResponse;
  return { payload: trackToPayload(data.items?.[0]?.track, false, "Last Played"), premiumBlocked: false };
}

async function getTopTrack(accessToken: string): Promise<TrackLookupResult> {
  const response = await fetch(TOP_TRACKS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    return { payload: null, premiumBlocked: isPremiumBlockedMessage(text) };
  }

  const data = JSON.parse(text || "{}") as SpotifyTopTracksResponse;
  return { payload: trackToPayload(data.items?.[0], false, "Top Track"), premiumBlocked: false };
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
    return NextResponse.json(UNAVAILABLE, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const nowPlayingResponse = await fetch(`${PLAYER_URL}/currently-playing`, {
      headers: { Authorization: `Bearer ${accessToken.token}` },
      cache: "no-store",
    });
    const nowPlayingText = await nowPlayingResponse.text();
    let premiumBlocked = !nowPlayingResponse.ok && isPremiumBlockedMessage(nowPlayingText);

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
    premiumBlocked = premiumBlocked || recent.premiumBlocked;
    if (recent.payload) {
      return NextResponse.json(recent.payload, {
        headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" },
      });
    }

    const topTrack = accessToken.scopes.has("user-top-read")
      ? await getTopTrack(accessToken.token)
      : { payload: null, premiumBlocked: false };
    premiumBlocked = premiumBlocked || topTrack.premiumBlocked;
    if (topTrack.payload) {
      return NextResponse.json(topTrack.payload, {
        headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=300" },
      });
    }

    if (premiumBlocked) {
      return NextResponse.json(PREMIUM_REQUIRED, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(
      {
        ...UNAVAILABLE,
        artist: accessToken.scopes.has("user-top-read")
          ? "Spotify did not return playback, recent, or top-track data"
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
