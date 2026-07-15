/**
 * /api/admin/upload — single-admin file uploader.
 *
 * GET → { mode, limits } so the admin UI knows which upload path to take:
 *   "blob" : Vercel Blob is configured (BLOB_READ_WRITE_TOKEN). The UI uploads
 *            straight from the browser to Blob via /api/admin/upload/client,
 *            which bypasses the ~4.5 MB Vercel function body limit.
 *   "fs"   : local dev — files are written under public/uploads/.
 *
 * POST multipart/form-data (the "fs" path, and a server-side Blob fallback):
 *   file  : the uploaded file (required)
 *   kind  : "resume" | "image" | "media"  (default "media")
 *   label : optional human label (stored in the activity log)
 *
 * On Vercel the deployment bundle is read-only, so fs writes are only for
 * local dev; production must go through Blob. Every upload is recorded in the
 * change/activity log. Node runtime only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { publishContentOverrides, setSiteConfigValues } from "@/lib/content-store";
import {
  BLOB_UPLOAD_PREFIX,
  hasBlobStore,
  IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  RESUME_BLOB_PATH,
  UPLOAD_KINDS,
  type UploadKind,
} from "@/lib/upload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_DIR = path.join(process.cwd(), "public");

function slugifyName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path
    .basename(original, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "file";
  return `${base}${ext}`;
}

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ mode: hasBlobStore() ? "blob" : "fs", limits: MAX_UPLOAD_BYTES });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    // formData() also throws when the body exceeds the runtime's parse limit
    // (~10 MB) — files that big should go through the direct-to-Blob path.
    return NextResponse.json(
      { error: "Could not read the upload — the file may exceed this server's request size limit (~10 MB)." },
      { status: 413 },
    );
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "media") as UploadKind;
  const label = typeof form.get("label") === "string" ? (form.get("label") as string) : "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!UPLOAD_KINDS.includes(kind)) {
    return NextResponse.json({ error: `Unknown upload kind "${kind}".` }, { status: 400 });
  }

  // Type validation.
  if (kind === "resume" && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Resume must be a PDF file." }, { status: 400 });
  }
  if (kind === "image" && file.type && !IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Images must be PNG, JPEG, WebP, AVIF, GIF, or SVG." }, { status: 400 });
  }

  const max = MAX_UPLOAD_BYTES[kind] ?? MAX_UPLOAD_BYTES.media;
  if (file.size > max) {
    return NextResponse.json({ error: `File is too large (max ${Math.round(max / 1024 / 1024)} MB).` }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const useBlob = hasBlobStore();

  try {
    let url: string;

    if (kind === "resume") {
      if (useBlob) {
        const blob = await put(RESUME_BLOB_PATH, bytes, {
          access: "public",
          contentType: "application/pdf",
          addRandomSuffix: true, // fresh URL per upload so CDNs/browsers never serve a stale resume
        });
        url = blob.url;
      } else {
        // Stable, human-friendly filename served straight from /public.
        const filename = "bhargava-teja-borra-resume.pdf";
        await fs.writeFile(path.join(PUBLIC_DIR, filename), bytes);
        url = `/${filename}`;
      }

      await setSiteConfigValues({ resumeUrl: url });
      await recordChange({
        entity: "resume",
        action: "upload",
        summary: `Uploaded new resume PDF${file.name ? ` (${file.name})` : ""}`,
        field: "resumeUrl",
        snapshot: { url, size: file.size },
      });
      await publishContentOverrides();
    } else {
      const filename = slugifyName(file.name || "upload");
      if (useBlob) {
        const blob = await put(`${BLOB_UPLOAD_PREFIX}${filename}`, bytes, {
          access: "public",
          ...(file.type ? { contentType: file.type } : {}),
          addRandomSuffix: true,
        });
        url = blob.url;
      } else {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const named = `${Date.now()}-${filename}`;
        await fs.writeFile(path.join(UPLOAD_DIR, named), bytes);
        url = `/uploads/${named}`;
      }

      await recordChange({
        entity: "media",
        action: "upload",
        summary: `Uploaded ${label || file.name || "a file"}`,
        field: kind,
        snapshot: { url, size: file.size, type: file.type },
      });
    }

    return NextResponse.json({ ok: true, url, name: file.name, size: file.size });
  } catch (err) {
    console.error("[admin-upload]", err);
    return NextResponse.json({ error: "Failed to save the uploaded file." }, { status: 500 });
  }
}
