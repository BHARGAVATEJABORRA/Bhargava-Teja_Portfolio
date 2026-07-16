/**
 * Shared constants for the admin upload pipeline (server-side).
 *
 * Storage backends:
 *  - Vercel Blob (BLOB_READ_WRITE_TOKEN set) — production. Browser uploads go
 *    directly to Blob via /api/admin/upload/client so file size isn't capped
 *    by the ~4.5 MB Vercel serverless request body limit.
 *  - Local filesystem (public/uploads) — dev fallback; Vercel's bundle is
 *    read-only so this path never works in production.
 */

export const UPLOAD_KINDS = ["resume", "image", "media"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const MAX_UPLOAD_BYTES: Record<UploadKind, number> = {
  resume: 10 * 1024 * 1024, // 10 MB
  image: 10 * 1024 * 1024, // 10 MB
  media: 20 * 1024 * 1024, // 20 MB
};

export const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Blob pathname prefix for media-library assets (mirrors /public/uploads). */
export const BLOB_UPLOAD_PREFIX = "uploads/";
/** Blob pathname for the resume (a random suffix is appended per upload). */
export const RESUME_BLOB_PATH = "resume/bhargava-teja-borra-resume.pdf";

export function hasBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** True for URLs served by this project's Vercel Blob store. */
export function isBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}
