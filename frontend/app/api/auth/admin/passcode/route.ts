import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/admin-session";
import { clearLoginFailures, clientIp, loginLockStatus, rateLimit, recordLoginFailure } from "@/lib/rate-limit";
import { readJsonObject, requestErrorResponse } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dev-only fallback so `npm run dev` works out of the box. In production
// (Vercel / NODE_ENV=production) ADMIN_PASSCODE MUST be set or login is
// refused — the real passcode never lives in this public repo.
const DEV_ONLY_PASSCODE = "dev-passcode-change-me";

function getExpectedPasscode(): string | null {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return null;
  return DEV_ONLY_PASSCODE;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await readJsonObject(req, 2048); }
  catch (error) { return requestErrorResponse(error); }
  const ip = clientIp(req);

  // Reserve a slot before comparing. Failure-only lockouts can race when many
  // guesses arrive together before any failed attempt has been recorded.
  const localLimit = await rateLimit(`passcode:attempt:${ip}`, { limit: 5, windowMs: 60_000 });
  const globalLimit = localLimit.allowed
    ? await rateLimit("passcode:attempt:global", { limit: 20, windowMs: 60_000 })
    : localLimit;
  if (!globalLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, {
      status: 429, headers: { "Retry-After": String(globalLimit.retryAfterSeconds), "Cache-Control": "no-store" },
    });
  }

  // Brute-force lockout: refuse before even comparing once too many recent
  // failures have accrued (globally or from this IP).
  const lock = await loginLockStatus(ip);
  if (lock.locked) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${lock.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(lock.retryAfterSeconds) } },
    );
  }

  const expected = getExpectedPasscode();
  if (!expected) {
    console.error("[passcode] ADMIN_PASSCODE is not configured in production — refusing login.");
    return NextResponse.json({ ok: false, error: "Admin login is not configured." }, { status: 503 });
  }

  const provided = typeof body.passcode === "string" ? body.passcode : "";

  if (!provided || !safeEqual(provided, expected)) {
    await recordLoginFailure(ip);
    // Small constant delay to further slow scripted guessing.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  await clearLoginFailures(ip);
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
