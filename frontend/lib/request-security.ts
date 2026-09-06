import { NextResponse } from "next/server";

/** Small request firewall shared by proxy and route handlers. */
export class RequestError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

export function mutationOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "same-site") return false;
  // Non-browser clients may omit Origin; cookies alone are never an origin proof.
  if (!origin) return !site || site === "same-origin";
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export async function readBodyText(request: Request, maxBytes = 16_384): Promise<string> {
  if (!mutationOriginAllowed(request)) throw new RequestError("Cross-origin request denied.", 403);
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    throw new RequestError("Request body too large.", 413);
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError("Request body too large.", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function readJsonObject(request: Request, maxBytes = 16_384): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError("Expected application/json.", 415);
  }
  const value: unknown = JSON.parse(await readBodyText(request, maxBytes));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError("Expected a JSON object.");
  return value as Record<string, unknown>;
}

export function requestErrorResponse(error: unknown): NextResponse {
  return NextResponse.json({ error: error instanceof RequestError ? error.message : "Invalid request body." }, {
    status: error instanceof RequestError ? error.status : 400,
    headers: { "Cache-Control": "no-store" },
  });
}
