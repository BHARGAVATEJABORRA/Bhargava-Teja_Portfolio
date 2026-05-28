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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=
SPOTIFY_CLIENT_ID=68491febe3f743e89dc6db78ee213b7f
SPOTIFY_CLIENT_SECRET=6f56fc2d4ef14a3b9254efc275c8f24f
SPOTIFY_REFRESH_TOKEN=
```

Notes:

- `NEXT_PUBLIC_SITE_URL` falls back to `http://localhost:3000` if it is missing.
- `NEXT_PUBLIC_GA_ID` is optional. Leave it blank to skip loading Google Analytics.
- The Spotify widget stays in a safe placeholder state until all three Spotify env vars are set.

To obtain `SPOTIFY_REFRESH_TOKEN`, use Spotify's authorization-code flow:

1. Send the user through Spotify authorization for your app.
2. Exchange the returned authorization code for an access token and refresh token.
3. Paste the refresh token into `SPOTIFY_REFRESH_TOKEN` in `frontend/.env.local`.
4. Set the same variables in your production deployment environment before release.

## Launch Content Checklist

Real personal inputs are required before public launch:

- `frontend/content/portfolio-content.ts`
  - GitHub and LinkedIn profile URLs
  - Project links and case-study destinations
  - Education/certification entries (if available)
- `frontend/public/bhargava-teja-borra-resume.txt`
  - Replace with final PDF resume and update `identity.resumeHref`

The app intentionally routes unresolved profile/project links to contact-safe fallbacks to avoid sending visitors to generic placeholders.
