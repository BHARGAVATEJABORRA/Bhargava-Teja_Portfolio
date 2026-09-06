import { NextResponse } from "next/server";

import { getSpotifyEnvConfig } from "@/lib/spotify-env";
import { requireAdmin } from "@/lib/admin-guard";

const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-top-read",
];

function createState(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return NextResponse.json({ error: "Spotify setup is local-only. Configure production credentials through your hosting settings." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const { clientId, clientSecret, redirectUri } = getSpotifyEnvConfig();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error: "Spotify credentials are missing",
        message: "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET before starting OAuth.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const state = createState();
  const authorizationUrl = new URL(SPOTIFY_AUTHORIZE_URL);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("scope", SPOTIFY_SCOPES.join(" "));
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("show_dialog", "true");

  const response = NextResponse.redirect(authorizationUrl);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: redirectUri.startsWith("https://"),
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
