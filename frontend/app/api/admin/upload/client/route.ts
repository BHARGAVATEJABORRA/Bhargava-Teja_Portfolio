/**
 * /api/admin/upload/client — token exchange for direct browser → Vercel Blob
 * uploads (the @vercel/blob/client `upload()` protocol).
 *
 * Direct client uploads bypass the ~4.5 MB request body limit of Vercel
 * serverless functions, which is what allows 5 MB+ images. Flow:
 *
 *   1. browser POSTs { type: "blob.generate-client-token" } here — admin-
 *      gated; we validate kind/size/content-type and mint a scoped token.
 *   2. browser uploads the file straight to Blob with that token.
 *   3. browser POSTs /api/admin/upload/finalize to record the change log
 *      entry (and, for resumes, update SiteConfig.resumeUrl).
 *
 * Vercel Blob also calls back here with "blob.upload-completed" — that
 * request carries no admin cookie but is signature-verified by handleUpload,
 * so it must NOT go through requireAdmin.
 */

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import {
  BLOB_UPLOAD_PREFIX,
  IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_KINDS,
  type UploadKind,
} from "@/lib/upload-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseKind(clientPayload: string | null): UploadKind {
  try {
    const parsed = JSON.parse(clientPayload ?? "{}") as { kind?: string };
    return UPLOAD_KINDS.includes(parsed.kind as UploadKind) ? (parsed.kind as UploadKind) : "media";
  } catch {
    return "media";
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  // Only the token mint is admin-gated; the completion webhook authenticates
  // via its signature inside handleUpload (see module comment).
  if (body.type === "blob.generate-client-token") {
    const denied = await requireAdmin();
    if (denied) return denied;
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = parseKind(clientPayload);
        if (kind !== "resume" && !pathname.startsWith(BLOB_UPLOAD_PREFIX)) {
          throw new Error(`Uploads must live under ${BLOB_UPLOAD_PREFIX}`);
        }
        return {
          allowedContentTypes:
            kind === "resume"
              ? ["application/pdf"]
              : kind === "image"
                ? [...IMAGE_TYPES]
                : ["image/*", "video/*", "application/pdf"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES[kind],
          addRandomSuffix: true,
          tokenPayload: clientPayload ?? "",
        };
      },
      // The change log entry is written by /api/admin/upload/finalize (called
      // by the browser), which also works in local dev where this webhook
      // can't reach us.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[admin-upload-client]", err);
    return NextResponse.json({ error: (err as Error).message || "Upload token exchange failed." }, { status: 400 });
  }
}
