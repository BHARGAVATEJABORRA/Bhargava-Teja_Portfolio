import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static site in `out/` for GitHub Pages.
// The Pages workflow removes app/api first — server routes can't run there;
// the control-center widgets fetch their data client-side instead.
const isStaticExport = process.env.STATIC_EXPORT === "1";
// For a project page (github.io/<repo>) set NEXT_PUBLIC_BASE_PATH=/<repo>.
// For a user page (<user>.github.io repo) leave it empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

const nextConfig: NextConfig = {
  experimental: {
    // Three.js exposes a large barrel file. Rewrite named imports to the
    // modules actually used so development does not compile its full export
    // graphs before the first page can respond.
    optimizePackageImports: ["three"],
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        ...(basePath ? { basePath } : {}),
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  turbopack: {
    root: process.cwd(),
  },
  // The contact inbox lives at /admin/inbox; alias the paths people guess.
  // (Redirects aren't supported on static export, hence the gate.)
  ...(isStaticExport
    ? {}
    : {
        redirects: async () => [
          { source: "/admin/contact", destination: "/admin/inbox", permanent: false },
          { source: "/admin/messages", destination: "/admin/inbox", permanent: false },
        ],
        headers: async () => [
          {
            source: "/:path*",
            headers: [
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "X-Frame-Options", value: "DENY" },
              { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), usb=()" },
            ],
          },
        ],
      }),
  // Ship the migration SQL with every serverless function so lib/db.ts can
  // bootstrap a fresh database (Turso or the /tmp fallback) at runtime.
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/migrations/**/*"],
  },
  devIndicators: false,
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
