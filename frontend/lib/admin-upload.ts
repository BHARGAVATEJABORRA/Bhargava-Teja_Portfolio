"use client";

/**
 * Shared browser-side uploader for the admin UI.
 *
 * Picks the right path per environment (asked once per page load from
 * GET /api/admin/upload):
 *  - "blob": direct browser → Vercel Blob upload via @vercel/blob/client,
 *    then POST /api/admin/upload/finalize for the change log. This bypasses
 *    the ~4.5 MB Vercel function body limit, enabling 5 MB+ files.
 *  - "fs": classic multipart POST to /api/admin/upload (local dev).
 */

import { upload } from "@vercel/blob/client";

export type UploadKind = "resume" | "image" | "media";

let modePromise: Promise<"blob" | "fs"> | null = null;

function getMode(): Promise<"blob" | "fs"> {
  modePromise ??= fetch("/api/admin/upload", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return "fs" as const;
      const data = (await res.json().catch(() => ({}))) as { mode?: string };
      return data.mode === "blob" ? ("blob" as const) : ("fs" as const);
    })
    .catch(() => "fs" as const);
  return modePromise;
}

async function uploadViaBlob(file: File, kind: UploadKind, label: string): Promise<string> {
  const pathname =
    kind === "resume"
      ? "resume/bhargava-teja-borra-resume.pdf"
      : `uploads/${file.name || "upload"}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload/client",
    clientPayload: JSON.stringify({ kind, label }),
  });

  const fin = await fetch("/api/admin/upload/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: blob.url, kind, label, name: file.name, size: file.size, type: file.type }),
  });
  if (!fin.ok) {
    const data = (await fin.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Upload finalize failed (${fin.status}).`);
  }
  return blob.url;
}

async function uploadViaForm(file: File, kind: UploadKind, label: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  body.append("label", label);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (${res.status}).`);
  return data.url;
}

/** Upload a file and return its public URL. Throws with a readable message. */
export async function uploadAdminFile(file: File, kind: UploadKind, label = ""): Promise<string> {
  if ((await getMode()) === "blob") {
    return uploadViaBlob(file, kind, label);
  }
  return uploadViaForm(file, kind, label);
}
