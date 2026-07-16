/**
 * Standalone Spotify "now playing" endpoint (Vercel serverless function).
 *
 * GitHub Pages can only serve static files, and Spotify credentials must stay
 * server-side — so the static portfolio calls this tiny function instead.
 *
 * Env vars (set in the Vercel dashboard, never committed):
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 * Optional:
 *   ALLOWED_ORIGIN  — e.g. https://<user>.github.io (defaults to *)
 */

const PLAYER_URL = "https://api.spotify.com/v1/me/player";
const TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=short_term";

const OFFLINE = {
  isPlaying: false,
  title: "Not listening right now",
  artist: "The track I'm playing shows up here live.",
  albumImageUrl: "",
  songUrl: "#",
  sourceLabel: "Spotify",
};

function trackToPayload(track, isPlaying, sourceLabel) {
  if (!track || !track.name) return null;
  return {
    isPlaying,
    sourceLabel,
    songUrl: (track.external_urls && track.external_urls.spotify) || "#",
    title: track.name,
    albumImageUrl:
      (track.album && track.album.images && track.album.images[0] && track.album.images[0].url) || "",
    artist: (track.artists || [])
      .map((artist) => artist && artist.name)
      .filter(Boolean)
      .join(", "),
  };
}

async function getAccessToken() {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  const refreshToken = (process.env.SPOTIFY_REFRESH_TOKEN || "").trim();
  if (!clientId || !clientSecret || !refreshToken) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.access_token || null;
}

async function fetchJson(url, accessToken) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok || response.status === 204) return null;
  const text = await response.text();
  try {
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=8, stale-while-revalidate=4");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      res.status(200).json({ ...OFFLINE, detail: "Token exchange failed — check env vars / refresh token" });
      return;
    }

    const now = await fetchJson(`${PLAYER_URL}/currently-playing`, accessToken);
    if (now && now.is_playing) {
      const payload = trackToPayload(now.item, true, "Now Playing");
      if (payload) {
        res.status(200).json(payload);
        return;
      }
    }

    const recent = await fetchJson(`${PLAYER_URL}/recently-played?limit=1`, accessToken);
    const recentPayload = trackToPayload(
      recent && recent.items && recent.items[0] && recent.items[0].track,
      false,
      "Last Played",
    );
    if (recentPayload) {
      res.status(200).json(recentPayload);
      return;
    }

    const top = await fetchJson(TOP_TRACKS_URL, accessToken);
    const topPayload = trackToPayload(top && top.items && top.items[0], false, "Top Track");
    if (topPayload) {
      res.status(200).json(topPayload);
      return;
    }

    res.status(200).json({ ...OFFLINE, detail: "No current, recent, or top track available" });
  } catch (error) {
    res.status(200).json({ ...OFFLINE, detail: `Unexpected error: ${String(error)}` });
  }
};
