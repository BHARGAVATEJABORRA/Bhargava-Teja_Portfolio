/**
 * Shared Spotify payload shape. Lives outside app/api so client components
 * can import it even in static-export builds where API routes are removed.
 */
export type SpotifyData = {
  songUrl: string;
  title: string;
  albumImageUrl: string;
  artist: string;
  isPlaying: boolean;
  sourceLabel: string;
  /** Technical reason for a degraded response — for debugging, never rendered. */
  detail?: string;
};

/**
 * Where the widget fetches playback data from.
 * - Dev / server hosting: the built-in Next.js route (/api/spotify).
 * - GitHub Pages (static): set NEXT_PUBLIC_SPOTIFY_ENDPOINT to the deployed
 *   serverless function URL (see spotify-endpoint/README.md) — secrets must
 *   never ship inside a static bundle.
 */
export const SPOTIFY_ENDPOINT =
  process.env.NEXT_PUBLIC_SPOTIFY_ENDPOINT?.trim() || "/api/spotify";
