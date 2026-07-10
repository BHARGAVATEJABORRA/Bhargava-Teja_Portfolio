import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static site in `out/` for GitHub Pages.
// The Pages workflow removes app/api first — server routes can't run there;
// the control-center widgets fetch their data client-side instead.
const isStaticExport = process.env.STATIC_EXPORT === "1";
// For a project page (github.io/<repo>) set NEXT_PUBLIC_BASE_PATH=/<repo>.
// For a user page (<user>.github.io repo) leave it empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

const nextConfig: NextConfig = {
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
  // Ship the migration SQL with every serverless function so lib/db.ts can
  // rebuild the ephemeral /tmp SQLite database on Vercel cold starts.
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/migrations/**/*"],
  },
  devIndicators: false,
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
