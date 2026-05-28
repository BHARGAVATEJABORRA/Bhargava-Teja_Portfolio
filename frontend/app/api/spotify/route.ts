import { NextResponse } from "next/server";
import { getSpotifyEnvConfig } from "@/lib/spotify-env";

const BASE_URL = "https://api.spotify.com/v1/me/player";

async function getAccessToken(): Promise<string | null> {
  const { clientId, clientSecret, refreshToken, isConfigured } = getSpotifyEnvConfig();

  if (!isConfigured) {
    return null;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export type SpotifyData = {
  songUrl: string;
  title: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
};

export async function GET() {
  const spotifyConfig = getSpotifyEnvConfig();

  if (!spotifyConfig.isConfigured) {
    return NextResponse.json(
      {
        isPlaying: false,
        title: "Spotify integration coming soon",
        artist: "Add credentials and a refresh token to enable this widget",
        albumImageUrl: "",
        songUrl: "#",
      } satisfies SpotifyData,
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    // Spotify only returns a refresh token through the authorization-code flow:
    // authorize the app, exchange the returned code for tokens, then paste the
    // refresh token into SPOTIFY_REFRESH_TOKEN in .env.local and production envs.
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Unable to obtain Spotify token");
    }

    const nowPlayingResponse = await fetch(`${BASE_URL}/currently-playing`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (nowPlayingResponse.status === 204) {
      const recentResponse = await fetch(`${BASE_URL}/recently-played?limit=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const recentData = (await recentResponse.json()) as {
        items?: Array<{
          track?: {
            name?: string;
            external_urls?: { spotify?: string };
            album?: { images?: Array<{ url?: string }> };
            artists?: Array<{ name?: string }>;
          };
        }>;
      };
      const track = recentData.items?.[0]?.track;

      return NextResponse.json(
        {
          isPlaying: false,
          songUrl: track?.external_urls?.spotify ?? "#",
          title: track?.name ?? "Not available",
          albumImageUrl: track?.album?.images?.[0]?.url ?? "",
          artist: track?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ?? "",
        } satisfies SpotifyData,
        { headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" } },
      );
    }

    const nowData = (await nowPlayingResponse.json()) as {
      item?: {
        name?: string;
        external_urls?: { spotify?: string };
        album?: { images?: Array<{ url?: string }> };
        artists?: Array<{ name?: string }>;
      };
    };
    const track = nowData.item;

    return NextResponse.json(
      {
        isPlaying: true,
        songUrl: track?.external_urls?.spotify ?? "#",
        title: track?.name ?? "Not available",
        albumImageUrl: track?.album?.images?.[0]?.url ?? "",
        artist: track?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ?? "",
      } satisfies SpotifyData,
      { headers: { "Cache-Control": "s-maxage=8, stale-while-revalidate=2" } },
    );
  } catch {
    return NextResponse.json(
      {
        isPlaying: false,
        title: "Not available",
        artist: "",
        albumImageUrl: "",
        songUrl: "#",
      } satisfies SpotifyData,
      { status: 200 },
    );
  }
}
