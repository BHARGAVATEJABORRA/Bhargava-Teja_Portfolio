export function contentSecurityPolicy(nonce: string, development = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://api.open-meteo.com https://api.github.com https://github-contributions-api.jogruber.de https://*.blob.vercel-storage.com https://*.vercel-storage.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com" + (development ? " ws: wss:" : ""),
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
