import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_IMAGE_HOST = "i.scdn.co";
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

/**
 * Relays Spotify album art through the portfolio origin.
 *
 * Some privacy tools and networks block Spotify's CDN directly. Restricting
 * this route to the CDN's image host prevents it becoming an open proxy, while
 * Vercel's edge cache makes the artwork stable for visitors.
 */
function getSpotifyArtworkUrl(value: string | null): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === SPOTIFY_IMAGE_HOST && url.pathname.startsWith("/image/")
      ? url
      : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const artworkUrl = getSpotifyArtworkUrl(request.nextUrl.searchParams.get("url"));

  if (!artworkUrl) {
    return NextResponse.json({ error: "Invalid Spotify artwork URL" }, { status: 400 });
  }

  try {
    const response = await fetch(artworkUrl, {
      headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
      next: { revalidate: 86_400 },
    });
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Spotify artwork is unavailable" }, { status: 502 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return NextResponse.json({ error: "Spotify artwork is unavailable" }, { status: 502 });
  }
}
