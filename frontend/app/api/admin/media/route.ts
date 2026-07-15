/**
 * /api/admin/media — the media library.
 *
 * Backed by Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production),
 * otherwise by public/uploads on disk (local dev).
 *
 * GET    → list uploaded assets (name, url, size, modified time).
 * DELETE → remove one asset: ?url=<blob url> in Blob mode,
 *          ?file=<name> (basename only — no path traversal) in fs mode.
 *
 * Uploads themselves go through /api/admin/upload (+ /client for direct
 * browser → Blob uploads).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { del, list } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { BLOB_UPLOAD_PREFIX, hasBlobStore, isBlobUrl } from "@/lib/upload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

interface MediaItem {
  name: string;
  url: string;
  size: number;
  modified: number;
  isImage: boolean;
}

async function listBlobItems(): Promise<MediaItem[]> {
  const { blobs } = await list({ prefix: BLOB_UPLOAD_PREFIX, limit: 1000 });
  return blobs.map((blob) => {
    const name = blob.pathname.slice(BLOB_UPLOAD_PREFIX.length);
    return {
      name,
      url: blob.url,
      size: blob.size,
      modified: new Date(blob.uploadedAt).getTime(),
      isImage: IMAGE_EXT.has(path.extname(name).toLowerCase()),
    };
  });
}

async function listFsItems(): Promise<MediaItem[]> {
  let names: string[] = [];
  try {
    names = await fs.readdir(UPLOAD_DIR);
  } catch {
    return []; // dir not created yet
  }
  const items = await Promise.all(
    names
      .filter((n) => !n.startsWith("."))
      .map(async (name) => {
        const stat = await fs.stat(path.join(UPLOAD_DIR, name)).catch(() => null);
        if (!stat || !stat.isFile()) return null;
        return {
          name,
          url: `/uploads/${name}`,
          size: stat.size,
          modified: stat.mtimeMs,
          isImage: IMAGE_EXT.has(path.extname(name).toLowerCase()),
        };
      }),
  );
  return items.filter((f): f is MediaItem => f !== null);
}

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = hasBlobStore() ? await listBlobItems() : await listFsItems();
    return NextResponse.json({ items: items.sort((a, b) => b.modified - a.modified) });
  } catch (err) {
    console.error("[admin-media]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = req.nextUrl.searchParams.get("url") ?? "";
  const file = req.nextUrl.searchParams.get("file") ?? "";

  try {
    let deleted: string;
    if (url) {
      if (!hasBlobStore() || !isBlobUrl(url)) {
        return NextResponse.json({ error: "Invalid blob URL." }, { status: 400 });
      }
      await del(url);
      deleted = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? url);
    } else {
      const safe = path.basename(file); // strip any directory components
      if (!safe || safe !== file) return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
      await fs.unlink(path.join(UPLOAD_DIR, safe));
      deleted = safe;
    }
    await recordChange({ entity: "media", action: "delete", summary: `Deleted media "${deleted}"`, field: "uploads" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-media] delete", err);
    return NextResponse.json({ error: "Could not delete that file." }, { status: 500 });
  }
}
