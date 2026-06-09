import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getSpotifyEnvConfig } from "@/lib/spotify-env";

type SpotifyTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlResponse(title: string, body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #06121f;
        color: #edf7ff;
      }
      main {
        width: min(92vw, 760px);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 24px;
        padding: 28px;
        background: rgba(255,255,255,0.08);
        box-shadow: 0 24px 80px rgba(0,0,0,0.34);
      }
      code {
        display: block;
        overflow-wrap: anywhere;
        border-radius: 16px;
        margin: 18px 0;
        padding: 16px;
        background: rgba(0,0,0,0.36);
        color: #b9ffd8;
      }
      p { line-height: 1.6; color: rgba(237,247,255,0.78); }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function serializeEnvValue(value: string): string {
  if (/^[A-Za-z0-9._~+/=-]+$/.test(value)) {
    return value;
  }

  return `"${value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll('"', '\\"')}"`;
}

async function upsertLocalEnvValue(key: string, value: string): Promise<void> {
  const envPath = path.join(process.cwd(), ".env.local");
  const serialized = `${key}=${serializeEnvValue(value)}`;
  let current = "";

  try {
    current = await readFile(envPath, "utf8");
  } catch {
    current = "";
  }

  const linePattern = new RegExp(`^${key}=.*$`, "m");
  const next = linePattern.test(current)
    ? current.replace(linePattern, serialized)
    : `${current}${current && !current.endsWith("\n") ? "\n" : ""}${serialized}\n`;

  await writeFile(envPath, next, "utf8");
  process.env[key] = value;
}

async function exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getSpotifyEnvConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as SpotifyTokenResponse;

  if (!response.ok) {
    return {
      error: payload.error ?? `HTTP ${response.status}`,
      error_description: payload.error_description ?? "Spotify token exchange failed.",
    };
  }

  return payload;
}

export async function GET(request: NextRequest) {
  const { clientId, clientSecret } = getSpotifyEnvConfig();
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("spotify_oauth_state")?.value;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const response = htmlResponse(
      "Spotify Authorization Failed",
      `<h1>Spotify authorization failed</h1><p>${escapeHtml(error)}</p>`,
      400,
    );
    response.cookies.delete("spotify_oauth_state");
    return response;
  }

  if (!clientId || !clientSecret) {
    return htmlResponse(
      "Spotify Credentials Missing",
      "<h1>Spotify credentials are missing</h1><p>Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, then restart the dev server and try again.</p>",
      500,
    );
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = htmlResponse(
      "Spotify State Mismatch",
      "<h1>Spotify state mismatch</h1><p>Start again from <code>/api/auth/signin</code>. This protects the local token exchange from forged callbacks.</p>",
      400,
    );
    response.cookies.delete("spotify_oauth_state");
    return response;
  }

  const tokenResponse = await exchangeCodeForTokens(code);
  const refreshToken = tokenResponse.refresh_token;
  const response = refreshToken
    ? await (async () => {
        await upsertLocalEnvValue("SPOTIFY_REFRESH_TOKEN", refreshToken);

        return htmlResponse(
        "Spotify Refresh Token",
        `<h1>Spotify refresh token generated</h1>
        <p>The token was saved to <code>frontend/.env.local</code> and loaded into the running dev server.</p>
        <p>Keep this token private. The Spotify client secret was used only on the server during this exchange. You can now re-test <code>/api/spotify</code>.</p>`,
        );
      })()
    : htmlResponse(
        "Spotify Token Exchange Failed",
        `<h1>Spotify token exchange failed</h1>
        <p>${escapeHtml(tokenResponse.error_description ?? tokenResponse.error ?? "No refresh token returned.")}</p>
        <p>Confirm the Spotify dashboard redirect URI exactly matches <code>${escapeHtml(getSpotifyEnvConfig().redirectUri)}</code>.</p>`,
        400,
      );

  response.cookies.delete("spotify_oauth_state");
  return response;
}
