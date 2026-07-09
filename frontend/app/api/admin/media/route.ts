/**
 * /api/admin/media — the media library over public/uploads.
 *
 * GET    → list uploaded assets (name, url, size, modified time).
 * DELETE → remove one asset (?file=<name>, basename only — no path traversal).
 *
 * Uploads themselves go through /api/admin/upload (kind=image|media).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    let names: string[] = [];
    try {
      names = await fs.readdir(UPLOAD_DIR);
    } catch {
      return NextResponse.json({ items: [] }); // dir not created yet
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
    const files = items.filter((f): f is NonNullable<typeof f> => f !== null).sort((a, b) => b.modified - a.modified);
    return NextResponse.json({ items: files });
  } catch (err) {
    console.error("[admin-media]", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const file = req.nextUrl.searchParams.get("file") ?? "";
  const safe = path.basename(file); // strip any directory components
  if (!safe || safe !== file) return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
  try {
    await fs.unlink(path.join(UPLOAD_DIR, safe));
    await recordChange({ entity: "media", action: "delete", summary: `Deleted media "${safe}"`, field: "uploads" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-media] delete", err);
    return NextResponse.json({ error: "Could not delete that file." }, { status: 500 });
  }
}
