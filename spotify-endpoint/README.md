# Spotify endpoint (for the GitHub Pages build)

GitHub Pages only serves static files, and the Spotify client secret + refresh token must never ship in a static bundle. This folder is a tiny free Vercel serverless function the static site calls instead.

## Deploy (one time, ~3 minutes)

1. `npm i -g vercel` (if you don't have it)
2. From this folder: `vercel --prod` (log in, accept defaults)
3. In the Vercel dashboard → the new project → Settings → Environment Variables, add:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`
   - `ALLOWED_ORIGIN` (optional, e.g. `https://<your-username>.github.io`)

   Use the same values as `frontend/.env.local`.
4. Redeploy (`vercel --prod`) so the env vars take effect.
5. Verify: open `https://<project>.vercel.app/api/spotify` — you should see live JSON.

## Wire it into the portfolio

In the GitHub repo → Settings → Secrets and variables → Actions → **Variables**, add:

```
NEXT_PUBLIC_SPOTIFY_ENDPOINT = https://<project>.vercel.app/api/spotify
```

The Pages workflow injects it at build time; the widget falls back to `/api/spotify` in local dev.

## Debugging

If the widget shows "Not listening right now", run from `frontend/`:

```
node scripts/spotify-check.mjs
```

It tests the token exchange and every player endpoint and tells you exactly what's wrong (expired refresh token, missing scopes, app in Development Mode without your account allow-listed, etc.).
