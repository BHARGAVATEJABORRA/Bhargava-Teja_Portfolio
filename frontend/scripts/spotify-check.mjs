#!/usr/bin/env node
/**
 * Spotify pipeline diagnostic — pinpoints exactly why the widget shows
 * "Not listening right now".
 *
 * Run from frontend/:  node scripts/spotify-check.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};
  const values = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[trimmed.slice(0, eq).trim()] = value;
  }
  return values;
}

const env = { ...loadEnvLocal(), ...process.env };
const clientId = (env.SPOTIFY_CLIENT_ID ?? "").trim();
const clientSecret = (env.SPOTIFY_CLIENT_SECRET ?? "").trim();
const refreshToken = (env.SPOTIFY_REFRESH_TOKEN ?? "").trim();

const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => console.log(`  ✗ ${msg}`);

console.log("\n1. Credentials in .env.local");
if (!clientId) bad("SPOTIFY_CLIENT_ID missing"); else ok(`SPOTIFY_CLIENT_ID (${clientId.length} chars)`);
if (!clientSecret) bad("SPOTIFY_CLIENT_SECRET missing"); else ok(`SPOTIFY_CLIENT_SECRET (${clientSecret.length} chars)`);
if (!refreshToken) bad("SPOTIFY_REFRESH_TOKEN missing"); else ok(`SPOTIFY_REFRESH_TOKEN (${refreshToken.length} chars)`);
if (!clientId || !clientSecret || !refreshToken) {
  console.log("\nFix: fill the missing variables, then re-run. To mint a refresh token:");
  console.log("  npm run dev  → open http://127.0.0.1:3000/api/auth/signin");
  process.exit(1);
}

console.log("\n2. Refresh-token exchange (accounts.spotify.com)");
const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
});
const tokenBody = await tokenResponse.json().catch(() => ({}));
if (!tokenResponse.ok || !tokenBody.access_token) {
  bad(`Token exchange failed (HTTP ${tokenResponse.status}): ${JSON.stringify(tokenBody)}`);
  console.log("\nMost common causes:");
  console.log("  - Refresh token expired/revoked → re-mint via http://127.0.0.1:3000/api/auth/signin");
  console.log("  - CLIENT_ID/SECRET don't match the app that minted the token");
  console.log("  - App in Development Mode: your Spotify account must be added under");
  console.log("    Dashboard → your app → Settings → User Management");
  process.exit(1);
}
const scopes = (tokenBody.scope ?? "").split(" ").filter(Boolean);
ok(`Access token received. Scopes: ${scopes.join(", ") || "(none!)"}`);
for (const need of ["user-read-currently-playing", "user-read-recently-played"]) {
  if (!scopes.includes(need)) bad(`Missing scope ${need} → re-run /api/auth/signin`);
}

console.log("\n3. Player endpoints (api.spotify.com)");
const accessToken = tokenBody.access_token;
const endpoints = [
  ["currently-playing", "https://api.spotify.com/v1/me/player/currently-playing"],
  ["recently-played", "https://api.spotify.com/v1/me/player/recently-played?limit=1"],
  ["top-tracks", "https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=short_term"],
];
for (const [name, url] of endpoints) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const text = await response.text();
  if (response.status === 204) {
    ok(`${name}: 204 (nothing playing right now — normal)`);
  } else if (response.ok) {
    try {
      const data = JSON.parse(text || "{}");
      const track = data.item ?? data.items?.[0]?.track ?? data.items?.[0];
      ok(`${name}: 200 — ${track?.name ? `“${track.name}” by ${track.artists?.map((a) => a.name).join(", ")}` : "no track in payload"}`);
    } catch {
      ok(`${name}: 200`);
    }
  } else {
    bad(`${name}: HTTP ${response.status} — ${text.slice(0, 160)}`);
  }
}

console.log("\nIf everything above passes, /api/spotify (dev) and the deployed");
console.log("spotify-endpoint function (production) will serve live data.\n");
