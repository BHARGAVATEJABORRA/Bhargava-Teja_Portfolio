/**
 * Edge-safe signed session token for the admin gate.
 *
 * Uses Web Crypto (HMAC-SHA256) only — no Node built-ins — so it works in both
 * route handlers (Node runtime) and middleware (Edge runtime). The token is a
 * signed `{ sub, exp }` payload; middleware verifies the signature so the cookie
 * can't be forged without ADMIN_SESSION_SECRET.
 */

const DEV_FALLBACK_SECRET = "dev-only-insecure-admin-secret-change-me";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export const ADMIN_SESSION_COOKIE = "admin_session";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || DEV_FALLBACK_SECRET;
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlEncodeString(value: string): string {
  return b64urlEncode(new TextEncoder().encode(value));
}

function b64urlDecodeToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payloadB64: string): Promise<string> {
  const key = await importKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return b64urlEncode(new Uint8Array(signature));
}

export async function createSessionToken(ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payloadB64 = b64urlEncodeString(JSON.stringify({ sub: "admin", exp }));
  const sig = await sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;

  const key = await importKey();
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecodeToBytes(sig),
      new TextEncoder().encode(payloadB64),
    );
  } catch {
    return false;
  }
  if (!valid) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payloadB64))) as {
      sub?: string;
      exp?: number;
    };
    if (payload.sub !== "admin") return false;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number = DEFAULT_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
