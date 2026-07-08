/**
 * /api/admin/upload — single-admin file uploader.
 *
 * POST multipart/form-data:
 *   file  : the uploaded file (required)
 *   kind  : "resume" | "image" | "media"  (default "media")
 *   label : optional human label (stored in the activity log)
 *
 * Files are written under public/uploads/ (served statically). A "resume"
 * upload additionally updates SiteConfig.resumeUrl and republishes the overlay
 * so the public "Download resume" link points at the new PDF immediately.
 *
 * Every upload is recorded in the change/activity log. Node runtime only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { publishContentOverrides, setSiteConfigValues } from "@/lib/content-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const MAX_BYTES: Record<string, number> = {
  resume: 10 * 1024 * 1024, // 10 MB
  image: 5 * 1024 * 1024, // 5 MB
  media: 15 * 1024 * 1024, // 15 MB
};

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "media");
  const label = typeof form.get("label") === "string" ? (form.get("label") as string) : "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!["resume", "image", "media"].includes(kind)) {
    return NextResponse.json({ error: `Unknown upload kind "${kind}".` }, { status: 400 });
  }

  // Type validation.
  if (kind === "resume" && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Resume must be a PDF file." }, { status: 400 });
  }
  if ((kind === "image" || kind === "media") && file.type && !IMAGE_TYPES.has(file.type) && kind === "image") {
    return NextResponse.json({ error: "Images must be PNG, JPEG, WebP, AVIF, GIF, or SVG." }, { status: 400 });
  }

  const max = MAX_BYTES[kind] ?? MAX_BYTES.media;
  if (file.size > max) {
    return NextResponse.json({ error: `File is too large (max ${Math.round(max / 1024 / 1024)} MB).` }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    let url: string;
    let savedPath: string;

    if (kind === "resume") {
      // Stable, human-friendly filename served straight from /public.
      const filename = "bhargava-teja-borra-resume.pdf";
      savedPath = path.join(PUBLIC_DIR, filename);
      await fs.writeFile(savedPath, bytes);
      url = `/${filename}`;

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
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const filename = `${Date.now()}-${slugifyName(file.name || "upload")}`;
      savedPath = path.join(UPLOAD_DIR, filename);
      await fs.writeFile(savedPath, bytes);
      url = `/uploads/${filename}`;

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
