/**
 * /api/admin/upload/finalize — bookkeeping after a direct browser → Blob
 * upload (see /api/admin/upload/client). Records the activity-log entry and,
 * for resume uploads, points SiteConfig.resumeUrl at the new blob.
 *
 * POST JSON: { url, kind, label?, name?, size?, type? }
 */

import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { recordChange } from "@/lib/change-log";
import { publishContentOverrides, setSiteConfigValues } from "@/lib/content-store";
import { isBlobUrl, UPLOAD_KINDS, type UploadKind } from "@/lib/upload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { url?: string; kind?: string; label?: string; name?: string; size?: number; type?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url : "";
  const kind: UploadKind = UPLOAD_KINDS.includes(body.kind as UploadKind) ? (body.kind as UploadKind) : "media";
  if (!isBlobUrl(url)) {
    return NextResponse.json({ error: "Not a Vercel Blob URL." }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label : "";
  const name = typeof body.name === "string" ? body.name : "";
  const size = typeof body.size === "number" ? body.size : undefined;

  try {
    if (kind === "resume") {
      await setSiteConfigValues({ resumeUrl: url });
      await recordChange({
        entity: "resume",
        action: "upload",
        summary: `Uploaded new resume PDF${name ? ` (${name})` : ""}`,
        field: "resumeUrl",
        snapshot: { url, ...(size !== undefined ? { size } : {}) },
      });
      await publishContentOverrides();
    } else {
      await recordChange({
        entity: "media",
        action: "upload",
        summary: `Uploaded ${label || name || "a file"}`,
        field: kind,
        snapshot: { url, ...(size !== undefined ? { size } : {}), ...(body.type ? { type: body.type } : {}) },
      });
    }
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[admin-upload-finalize]", err);
    return NextResponse.json({ error: "Upload succeeded but could not be recorded." }, { status: 500 });
  }
}
