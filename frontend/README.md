# Portfolio Frontend

Recruiter-first Next.js App Router portfolio implementation.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Environment Setup

This Next.js app lives in `frontend/`, so local development variables belong in `frontend/.env.local`.

Use this local template:

```bash
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXTAUTH_URL=http://127.0.0.1:3000
AUTH_URL=http://127.0.0.1:3000
AUTH_TRUST_HOST=true
NEXT_PUBLIC_GA_ID=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback/spotify
SPOTIFY_REFRESH_TOKEN=
OPENWEATHER_API_KEY=
# Weather keys must stay server-only. Never prefix an API key with NEXT_PUBLIC_.
```

Notes:

- `NEXT_PUBLIC_SITE_URL` falls back to `http://127.0.0.1:3000` if it is missing.
- `NEXT_PUBLIC_GA_ID` is optional. Leave it blank to skip loading Google Analytics.
- The Spotify widget stays in a safe placeholder state until Spotify credentials and a refresh token are set.
- Spotify Web API development-mode apps require the app owner to have Spotify Premium. If Spotify returns a Premium-required `403`, the widget will show that status instead of exposing credentials or failing silently.

To obtain `SPOTIFY_REFRESH_TOKEN`, use Spotify's authorization-code flow:

1. In the Spotify app dashboard, add `http://127.0.0.1:3000/api/auth/callback/spotify` as a redirect URI.
2. Start the local development app, sign in at `/login` with the admin passcode, then visit `http://127.0.0.1:3000/api/auth/signin` in the same browser.
3. Approve Spotify access. The callback exchanges the code server-side and saves `SPOTIFY_REFRESH_TOKEN` in `frontend/.env.local`.
4. Restart `npm run dev` so the app reads the updated local environment.
5. Set the same variables in your production deployment environment before release.

The Spotify setup routes are intentionally unavailable in production; they never render refresh tokens in a page. Existing production refresh tokens continue to work.

## Security verification

See [the security review and rollout checklist](../SECURITY.md) for findings, remaining limitations, and the staged firewall rules.

```bash
npm run test:security
npm run test:security:libsql
npm run build
npm run test:security:http
```

The tests use disposable local databases, synthetic credentials, and disabled paid integrations. `npm run build` creates an empty ignored content-override file only when it is missing; existing content is preserved. The nonce-based script policy requires server-rendered HTML and intentionally disables HTML caching. This hardened configuration targets the Next.js server/Vercel deployment, not static hosting.

`aiEnabled` and `spotifyEnabled` now control both the interface and their server endpoints. Enable the corresponding feature in the admin configuration when desired; a disabled integration will not call its provider.

## Launch Content Checklist

Real personal inputs are required before public launch:

- `frontend/content/portfolio-content.ts`
  - GitHub and LinkedIn profile URLs
  - Project links and case-study destinations
  - Education/certification entries (if available)
- `frontend/public/bhargava-teja-borra-resume.txt`
  - Replace with final PDF resume and update `identity.resumeHref`

The app intentionally routes unresolved profile/project links to contact-safe fallbacks to avoid sending visitors to generic placeholders.
